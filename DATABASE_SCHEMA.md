# DATABASE SCHEMA: HarvestMitra AI 🗄️

HarvestMitra AI uses a relational MySQL database managed via Sequelize ORM.

---

## 1. Entity Relationship Overview

```
 [ users ] 1 ──── 1 [ farmer_profiles ]
    │                      │
    ├─ 1 ── * [ harvest_simulations ]
    ├─ 1 ── * [ transport_requests ] 1 ── * [ transport_matches ]
    ├─ 1 ── * [ chat_sessions ] 1 ────── * [ chat_messages ]
    └─ 1 ── * [ reports ]

 [ crops ] 1 ──── * [ market_prices ] 
 [ markets ] 1 ── * [ market_prices ]
 [ farmer_profiles ] * ──── * [ crops ] (via farmer_crops)
```

---

## 2. Table Specifications

### A. `users`
Stores login credentials, roles, and language preference.
```sql
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(100) NOT NULL,
  phone_number VARCHAR(15) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('farmer', 'admin') DEFAULT 'farmer',
  preferred_language ENUM('en', 'gu', 'hi') DEFAULT 'gu',
  is_demo_account BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### B. `farmer_profiles`
Extended profile for customized decision support.
```sql
CREATE TABLE farmer_profiles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNIQUE NOT NULL,
  district VARCHAR(100) NOT NULL,
  state VARCHAR(100) NOT NULL DEFAULT 'Gujarat',
  village VARCHAR(100),
  farm_size_acres DECIMAL(5,2),
  primary_crop_id INT,
  typical_yield_kg DECIMAL(10,2),
  preferred_mandi_id INT,
  transport_mode ENUM('own_vehicle', 'rented_truck', 'shared_freight') DEFAULT 'shared_freight',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### C. `crops`
Master agricultural crop directory.
```sql
CREATE TABLE crops (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name_en VARCHAR(100) NOT NULL,
  name_gu VARCHAR(100) NOT NULL,
  name_hi VARCHAR(100) NOT NULL,
  category ENUM('vegetable', 'grain', 'fruit', 'pulse', 'oilseed') DEFAULT 'vegetable',
  shelf_life_days INT DEFAULT 3,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### D. `markets` (Mandi Directory)
```sql
CREATE TABLE markets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  district VARCHAR(100) NOT NULL,
  state VARCHAR(100) NOT NULL,
  distance_from_surat_km DECIMAL(6,2) DEFAULT 0.0,
  operating_days VARCHAR(100) DEFAULT 'Mon-Sat',
  contact_number VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### E. `market_prices`
Daily or sample market commodity rates.
```sql
CREATE TABLE market_prices (
  id INT AUTO_INCREMENT PRIMARY KEY,
  market_id INT NOT NULL,
  crop_id INT NOT NULL,
  price_per_kg DECIMAL(8,2) NOT NULL,
  price_per_quintal DECIMAL(10,2) NOT NULL,
  min_price DECIMAL(8,2),
  max_price DECIMAL(8,2),
  data_type ENUM('verified_live', 'sample_demo') DEFAULT 'sample_demo',
  price_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (market_id) REFERENCES markets(id) ON DELETE CASCADE,
  FOREIGN KEY (crop_id) REFERENCES crops(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### F. `harvest_simulations`
History of simulation calculations performed by farmers.
```sql
CREATE TABLE harvest_simulations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  crop_id INT NOT NULL,
  quantity_kg DECIMAL(10,2) NOT NULL,
  current_market_id INT NOT NULL,
  alt_market_id INT,
  
  -- Results JSON containing Option 1, 2, 3 calculations
  simulation_results JSON NOT NULL,
  
  recommended_option VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (crop_id) REFERENCES crops(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### G. `transport_requests`
Shared transport pool postings.
```sql
CREATE TABLE transport_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  pickup_district VARCHAR(100) NOT NULL,
  pickup_village VARCHAR(100),
  destination_market_id INT NOT NULL,
  crop_id INT NOT NULL,
  quantity_kg DECIMAL(10,2) NOT NULL,
  pickup_date DATE NOT NULL,
  vehicle_capacity_kg DECIMAL(10,2) DEFAULT 1500.0,
  status ENUM('open', 'matched', 'completed', 'cancelled') DEFAULT 'open',
  contact_preference ENUM('in_app', 'phone', 'whatsapp') DEFAULT 'phone',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (destination_market_id) REFERENCES markets(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### H. `transport_matches`
Connections formed between farmers pooling transport.
```sql
CREATE TABLE transport_matches (
  id INT AUTO_INCREMENT PRIMARY KEY,
  request_id_1 INT NOT NULL,
  request_id_2 INT NOT NULL,
  estimated_cost_per_farmer DECIMAL(8,2) NOT NULL,
  savings_percentage DECIMAL(5,2) NOT NULL,
  status ENUM('proposed', 'accepted', 'rejected') DEFAULT 'proposed',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (request_id_1) REFERENCES transport_requests(id) ON DELETE CASCADE,
  FOREIGN KEY (request_id_2) REFERENCES transport_requests(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### I. `weather_alerts`
Weather advisories linked to districts and crops.
```sql
CREATE TABLE weather_alerts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  district VARCHAR(100) NOT NULL,
  alert_title VARCHAR(150) NOT NULL,
  alert_description TEXT NOT NULL,
  severity ENUM('low', 'moderate', 'high', 'critical') DEFAULT 'moderate',
  rain_probability_pct INT DEFAULT 0,
  actionable_recommendation TEXT,
  valid_until DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### J. `chat_sessions` & `chat_messages`
Conversation context storage for Mitra Assistant.
```sql
CREATE TABLE chat_sessions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  session_title VARCHAR(150) DEFAULT 'Harvest Consultation',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE chat_messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  session_id INT NOT NULL,
  sender ENUM('user', 'assistant') NOT NULL,
  message_text TEXT NOT NULL,
  language ENUM('en', 'gu', 'hi') DEFAULT 'gu',
  is_voice BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (session_id) REFERENCES chat_sessions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

## 3. Database Indexes
- `idx_market_prices_lookup`: `(market_id, crop_id, price_date)`
- `idx_transport_matching`: `(destination_market_id, pickup_date, status)`
- `idx_weather_district`: `(district, valid_until)`
