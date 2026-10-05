const DEMO_LOCATIONS = {
    pune: { name: "Pune", state: "Maharashtra", latitude: 18.5204, longitude: 73.8567 },
    surat: { name: "Surat", state: "Gujarat", latitude: 21.1702, longitude: 72.8311 },
    ahmedabad: { name: "Ahmedabad", state: "Gujarat", latitude: 23.0225, longitude: 72.5714 },
    rajkot: { name: "Rajkot", state: "Gujarat", latitude: 22.3039, longitude: 70.8022 },
    nashik: { name: "Nashik", state: "Maharashtra", latitude: 19.9975, longitude: 73.7898 },
    delhi: { name: "Delhi", state: "Delhi", latitude: 28.6139, longitude: 77.209 },
    mumbai: { name: "Mumbai", state: "Maharashtra", latitude: 19.076, longitude: 72.8777 }
};

function getWeatherCodeLabel(code) {
    if ([0].includes(code)) return "Clear sky";
    if ([1, 2, 3].includes(code)) return "Partly cloudy";
    if ([45, 48].includes(code)) return "Fog";
    if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code)) return "Rain expected";
    if ([95, 96, 99].includes(code)) return "Thunderstorm risk";
    return "Weather update";
}

function getHarvestAdvice({ rainChance, precipitation, windSpeed }) {
    if (rainChance >= 60 || precipitation >= 5) {
        return {
            status: "Delay harvest",
            tone: "danger",
            detail: "High rain risk can damage harvested crop. Prefer waiting or arranging covered storage."
        };
    }
    if (rainChance >= 30 || precipitation >= 1 || windSpeed >= 28) {
        return {
            status: "Harvest with caution",
            tone: "warning",
            detail: "Moderate weather risk. Harvest only if transport and storage are ready."
        };
    }
    return {
        status: "Safe for harvesting",
        tone: "success",
        detail: "Low rain risk. Good window for harvesting and transport planning."
    };
}

function getDemoLocation(location) {
    const key = String(location || "pune").trim().toLowerCase();
    return DEMO_LOCATIONS[key] || {
        name: location || "Pune",
        state: "India",
        latitude: 18.5204,
        longitude: 73.8567
    };
}

async function geocodeLocation(location) {
    const fallback = getDemoLocation(location);
    const url = new URL("https://geocoding-api.open-meteo.com/v1/search");
    url.searchParams.set("name", location || fallback.name);
    url.searchParams.set("count", "1");
    url.searchParams.set("language", "en");
    url.searchParams.set("format", "json");

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    try {
        const response = await fetch(url, { signal: controller.signal });
        if (!response.ok) throw new Error(`geocoding failed with ${response.status}`);
        const payload = await response.json();
        const first = payload.results?.[0];
        if (!first) return fallback;
        return {
            name: first.name,
            state: first.admin1 || first.country || "India",
            latitude: first.latitude,
            longitude: first.longitude
        };
    } finally {
        clearTimeout(timeout);
    }
}

async function fetchOpenMeteoForecast(location) {
    const place = await geocodeLocation(location);
    const url = new URL("https://api.open-meteo.com/v1/forecast");
    url.searchParams.set("latitude", String(place.latitude));
    url.searchParams.set("longitude", String(place.longitude));
    url.searchParams.set("current", "temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m");
    url.searchParams.set("daily", "precipitation_probability_max,precipitation_sum,temperature_2m_max,temperature_2m_min");
    url.searchParams.set("forecast_days", "5");
    url.searchParams.set("timezone", "auto");

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    try {
        const response = await fetch(url, { signal: controller.signal });
        if (!response.ok) throw new Error(`Open-Meteo failed with ${response.status}`);
        const payload = await response.json();
        const current = payload.current || {};
        const rainChance = Number(payload.daily?.precipitation_probability_max?.[0] || 0);
        const precipitation = Number(current.precipitation || 0);
        const windSpeed = Number(current.wind_speed_10m || 0);
        const advice = getHarvestAdvice({ rainChance, precipitation, windSpeed });

        return {
            source: "live",
            message: "Live weather loaded from Open-Meteo.",
            location: place,
            current: {
                temperature: Number(current.temperature_2m || 0),
                humidity: Number(current.relative_humidity_2m || 0),
                precipitation,
                windSpeed,
                weatherCode: current.weather_code,
                condition: getWeatherCodeLabel(current.weather_code)
            },
            rainChance,
            advice,
            daily: (payload.daily?.time || []).map((date, index) => ({
                date,
                rainChance: Number(payload.daily.precipitation_probability_max?.[index] || 0),
                precipitation: Number(payload.daily.precipitation_sum?.[index] || 0),
                maxTemp: Number(payload.daily.temperature_2m_max?.[index] || 0),
                minTemp: Number(payload.daily.temperature_2m_min?.[index] || 0)
            }))
        };
    } finally {
        clearTimeout(timeout);
    }
}

function getDemoForecast(location) {
    const place = getDemoLocation(location);
    const rainChance = place.name.toLowerCase() === "pune" ? 22 : 12;
    const advice = getHarvestAdvice({ rainChance, precipitation: 0, windSpeed: 14 });
    const today = new Date();

    return {
        source: "demo",
        message: "Live weather source unavailable, showing saved demo forecast.",
        location: place,
        current: {
            temperature: place.name.toLowerCase() === "pune" ? 27 : 29,
            humidity: 48,
            precipitation: 0,
            windSpeed: 14,
            weatherCode: 1,
            condition: "Partly cloudy"
        },
        rainChance,
        advice,
        daily: Array.from({ length: 5 }, (_, index) => {
            const date = new Date(today);
            date.setDate(today.getDate() + index);
            return {
                date: date.toISOString().slice(0, 10),
                rainChance: Math.max(5, rainChance + index * 4),
                precipitation: index > 2 ? 1.2 : 0,
                maxTemp: 29 + index,
                minTemp: 20 + index
            };
        })
    };
}

async function getWeatherForecast(query) {
    const location = query.location || "Pune";
    if (query.source === "demo") return getDemoForecast(location);
    try {
        return await fetchOpenMeteoForecast(location);
    } catch (error) {
        console.warn("Live weather fetch failed:", error.message);
        return getDemoForecast(location);
    }
}

module.exports = { getWeatherForecast };
