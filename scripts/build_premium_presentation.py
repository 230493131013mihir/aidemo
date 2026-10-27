import os
import sys
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.enum.text import PP_ALIGN
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE

def build_presentation():
    prs = Presentation()
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)
    blank_layout = prs.slide_layouts[6]

    # --- PALETTE: Future of Agriculture x AI Technology ---
    BG_DARK = RGBColor(7, 19, 17)        # Deep Obsidian Emerald
    CARD_BG = RGBColor(14, 34, 30)       # Dark Emerald Glass
    CARD_BG_ALT = RGBColor(11, 26, 23)   # Dark Card
    CARD_BORDER = RGBColor(26, 67, 58)   # Subtle Card Border
    EMERALD = RGBColor(16, 185, 129)     # Vibrant Emerald
    MINT = RGBColor(52, 211, 153)        # Mint Glow
    GOLD = RGBColor(245, 158, 11)        # Warm Restrained Gold
    GOLD_LIGHT = RGBColor(253, 230, 138)  # Soft Gold
    SKY = RGBColor(56, 189, 248)         # Logistics Sky Blue
    PURPLE = RGBColor(192, 132, 252)     # AI Intelligence Purple
    WHITE = RGBColor(255, 255, 255)      # Crisp White
    LIGHT_SLATE = RGBColor(148, 163, 184)# Muted Slate Text
    MUTED_TEXT = RGBColor(100, 116, 139) # Secondary Label
    PILL_BG = RGBColor(6, 44, 36)        # Pill Tag Background

    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    assets_dir = os.path.join(base_dir, "docs", "presentation_assets")
    hero_img = os.path.join(assets_dir, "hero.jpg")
    mandi_img = os.path.join(assets_dir, "mandi.jpg")
    logistics_img = os.path.join(assets_dir, "logistics.jpg")
    telemetry_img = os.path.join(assets_dir, "telemetry.jpg")

    def create_slide():
        slide = prs.slides.add_slide(blank_layout)
        # Background
        bg = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, Inches(13.333), Inches(7.5))
        bg.fill.solid()
        bg.fill.fore_color.rgb = BG_DARK
        bg.line.fill.background()

        # Top subtle glow accent line
        line = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, Inches(13.333), Inches(0.05))
        line.fill.solid()
        line.fill.fore_color.rgb = EMERALD
        line.line.fill.background()
        return slide

    def add_header(slide, eyebrow, title, subtitle=None):
        # Eyebrow tag
        tb_tag = slide.shapes.add_textbox(Inches(0.8), Inches(0.42), Inches(11.5), Inches(0.35))
        tf_tag = tb_tag.text_frame
        tf_tag.word_wrap = True
        tf_tag.margin_left = tf_tag.margin_top = tf_tag.margin_right = tf_tag.margin_bottom = 0
        p_tag = tf_tag.paragraphs[0]
        p_tag.text = eyebrow.upper()
        p_tag.font.size = Pt(10.5)
        p_tag.font.bold = True
        p_tag.font.color.rgb = GOLD

        # Title
        tb_title = slide.shapes.add_textbox(Inches(0.8), Inches(0.72), Inches(11.5), Inches(0.7))
        tf_title = tb_title.text_frame
        tf_title.word_wrap = True
        tf_title.margin_left = tf_title.margin_top = tf_title.margin_right = tf_title.margin_bottom = 0
        p_title = tf_title.paragraphs[0]
        p_title.text = title
        p_title.font.size = Pt(26)
        p_title.font.bold = True
        p_title.font.color.rgb = WHITE

        # Subtitle
        if subtitle:
            tb_sub = slide.shapes.add_textbox(Inches(0.8), Inches(1.38), Inches(11.5), Inches(0.45))
            tf_sub = tb_sub.text_frame
            tf_sub.word_wrap = True
            tf_sub.margin_left = tf_sub.margin_top = tf_sub.margin_right = tf_sub.margin_bottom = 0
            p_sub = tf_sub.paragraphs[0]
            p_sub.text = subtitle
            p_sub.font.size = Pt(13)
            p_sub.font.color.rgb = LIGHT_SLATE

    def add_card(slide, left, top, width, height, bg_color=CARD_BG, border_color=CARD_BORDER):
        card = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(left), Inches(top), Inches(width), Inches(height))
        card.fill.solid()
        card.fill.fore_color.rgb = bg_color
        card.line.color.rgb = border_color
        card.line.width = Pt(1)
        return card

    slides_notes = []

    # =========================================================================
    # SLIDE 1: Title & Hero Showcase (Mihir Jadav)
    # =========================================================================
    s1 = create_slide()
    # Left Hero Text
    tb1_tag = s1.shapes.add_textbox(Inches(0.8), Inches(1.1), Inches(6.8), Inches(0.4))
    p = tb1_tag.text_frame.paragraphs[0]
    p.text = "NATIONAL AGRI-TECH HACKATHON 2026 • PRODUCTION SHOWCASE"
    p.font.size = Pt(10.5)
    p.font.bold = True
    p.font.color.rgb = GOLD

    tb1_t = s1.shapes.add_textbox(Inches(0.8), Inches(1.5), Inches(6.8), Inches(1.6))
    tf1 = tb1_t.text_frame
    tf1.word_wrap = True
    p1 = tf1.paragraphs[0]
    p1.text = "HarvestMitra AI"
    p1.font.size = Pt(44)
    p1.font.bold = True
    p1.font.color.rgb = WHITE

    p2 = tf1.add_paragraph()
    p2.text = "Intelligent APMC Mandi Arbitrage, Profit Simulation & Farm Cold-Chain Logistics"
    p2.font.size = Pt(16)
    p2.font.bold = True
    p2.font.color.rgb = MINT
    p2.space_before = Pt(6)

    tb1_desc = s1.shapes.add_textbox(Inches(0.8), Inches(3.2), Inches(6.8), Inches(1.4))
    tf_d = tb1_desc.text_frame
    tf_d.word_wrap = True
    p_d = tf_d.paragraphs[0]
    p_d.text = "An end-to-end full-stack AI ecosystem empowering 140M+ Indian farmers to overcome mandi cartels, simulate factual net revenue across mandis, eliminate middleman exploitation, and book on-demand refrigerated dispatch."
    p_d.font.size = Pt(12.5)
    p_d.font.color.rgb = LIGHT_SLATE

    # Badges row
    add_card(s1, 0.8, 4.4, 6.8, 0.55, bg_color=CARD_BG, border_color=CARD_BORDER)
    tb_b = s1.shapes.add_textbox(Inches(0.9), Inches(4.45), Inches(6.6), Inches(0.45))
    p_b = tb_b.text_frame.paragraphs[0]
    p_b.text = "⚡ 106 APMC Mandis Monitored  •  33/33 Tests Verified  •  40 Merged PRs  •  Sub-15ms Offline AI"
    p_b.font.size = Pt(10.5)
    p_b.font.bold = True
    p_b.font.color.rgb = MINT

    # Team Card
    add_card(s1, 0.8, 5.2, 6.8, 1.7, bg_color=CARD_BG_ALT, border_color=CARD_BORDER)
    tb_team = s1.shapes.add_textbox(Inches(1.0), Inches(5.3), Inches(6.4), Inches(1.5))
    tf_team = tb_team.text_frame
    tf_team.word_wrap = True
    p_th = tf_team.paragraphs[0]
    p_th.text = "ENGINEERING SQUAD & MODULE OWNERSHIP:"
    p_th.font.size = Pt(10)
    p_th.font.bold = True
    p_th.font.color.rgb = GOLD

    members = [
        ("Mihir Jadav (Team Lead)", "System Architecture, Unified Backend API & Security Enforcement"),
        ("Sayali Kulkarni", "Frontend UI/UX, Farmer Accessibility & Universal Guest Mode"),
        ("Prashant Warule", "Core Harvest Decision Simulator & Shared Highway Transport"),
        ("Varun Patil", "Mitra Multilingual Voice AI, Market Arbitrage & Weather Telemetry")
    ]
    for name, role in members:
        pm = tf_team.add_paragraph()
        pm.text = f"• {name}: {role}"
        pm.font.size = Pt(9.5)
        pm.font.color.rgb = WHITE
        pm.space_before = Pt(2)

    # Hero Image Right
    if os.path.exists(hero_img):
        s1.shapes.add_picture(hero_img, Inches(7.8), Inches(1.1), width=Inches(4.8), height=Inches(5.8))

    slides_notes.append(
        "SPEAKER: MIHIR JADAV (Team Leader)\n"
        "\"Respected judges and evaluators, I am Mihir Jadav, Team Leader for HarvestMitra AI. "
        "Across Bharat, 86% of smallholder farmers suffer an estimated 20% to 30% financial loss every season due to forced distress selling at village mandis, opaque cartel pricing, and solo freight costs. "
        "To solve this, our engineering squad built HarvestMitra AI — a production-grade agritech ecosystem that unifies deterministic price arbitrage, 106 live APMC mandis, multilingual voice AI, and shared farm logistics. "
        "Let us examine the critical problem Indian farmers face today.\""
    )

    # =========================================================================
    # SLIDE 2: The Farmer's Critical Challenge (The Problem) (Mihir Jadav)
    # =========================================================================
    s2 = create_slide()
    add_header(s2, "Ground Reality • Agricultural Supply Chain Crisis",
               "The Smallholder Trap: Why Indian Farmers Lose 20–30% Every Harvest",
               "Opaque mandi cartels, lack of holding power, and fragmented logistics drain rural income.")

    # 4 Problem Cards (2x2 Grid)
    problems = [
        ("01", "Opaque Local Mandi Cartels",
         "Village traders and local APMC cartels artificially suppress spot prices by 15% to 25%. Smallholders have zero real-time visibility into neighboring high-demand terminals.",
         "Impact: ₹4,000–₹8,000 lost per metric ton sold locally.", GOLD),
        ("02", "Zero Holding Power & Spoilage",
         "Highly perishable horticultural crops like Tomato, Onion, and Grapes degrade rapidly in tropical heat. Farmers are forced into same-day distress selling within 24–48 hours.",
         "Impact: 100% loss risk forces immediate fire sales.", EMERALD),
        ("03", "Siloed Solo Transport & High Freight",
         "Smallholders dispatching 500–1,500 kg must hire an entire truck or pay extortionate solo rates (₹35–₹50/km). Freight alone consumes up to 40% of gross crop earnings.",
         "Impact: Freight eats nearly half of farmer take-home profit.", SKY),
        ("04", "Severe Information Asymmetry",
         "Terminal price spreads between local mandis and major consumption centers (e.g., Nashik vs Mumbai Vashi) are discovered only after arriving at the market.",
         "Impact: Middlemen capture 70% of terminal consumer price.", PURPLE)
    ]

    card_positions = [(0.8, 1.9), (6.8, 1.9), (0.8, 4.4), (6.8, 4.4)]
    for idx, (num, ptitle, pdesc, pimpact, accent_color) in enumerate(problems):
        x, y = card_positions[idx]
        add_card(s2, x, y, 5.7, 2.2, bg_color=CARD_BG, border_color=CARD_BORDER)
        tb = s2.shapes.add_textbox(Inches(x + 0.25), Inches(y + 0.15), Inches(5.2), Inches(1.9))
        tf = tb.text_frame
        tf.word_wrap = True
        
        # Number + Title
        p_t = tf.paragraphs[0]
        p_t.text = f"{num}  •  {ptitle.upper()}"
        p_t.font.size = Pt(13)
        p_t.font.bold = True
        p_t.font.color.rgb = accent_color

        p_d = tf.add_paragraph()
        p_d.text = pdesc
        p_d.font.size = Pt(11)
        p_d.font.color.rgb = WHITE
        p_d.space_before = Pt(4)

        p_i = tf.add_paragraph()
        p_i.text = f"⚠ {pimpact}"
        p_i.font.size = Pt(10)
        p_i.font.bold = True
        p_i.font.color.rgb = GOLD_LIGHT
        p_i.space_before = Pt(4)

    # Bottom Callout Strip
    add_card(s2, 0.8, 6.75, 11.7, 0.45, bg_color=PILL_BG, border_color=EMERALD)
    tb_bot = s2.shapes.add_textbox(Inches(1.0), Inches(6.78), Inches(11.3), Inches(0.4))
    p_bot = tb_bot.text_frame.paragraphs[0]
    p_bot.text = "CRITICAL METRIC: 86% of Indian farmers are smallholders (< 2 Ha) • ₹92,000 Crore lost annually in post-harvest distress"
    p_bot.font.size = Pt(10.5)
    p_bot.font.bold = True
    p_bot.font.color.rgb = MINT

    slides_notes.append(
        "SPEAKER: MIHIR JADAV (Team Leader)\n"
        "\"When a smallholder farmer in Maharashtra harvests tomatoes, they face an impossible choice. "
        "Local village traders offer suppressed rates, often 20% below actual terminal demand. "
        "Holding the produce means risk of total rot within 48 hours, while hiring an entire truck to reach Mumbai Vashi APMC is financially prohibitive for 500 kilograms. "
        "This triple trap—cartels, perishability, and freight—causes an estimated ₹92,000 crore annual value destruction across rural India.\""
    )

    # =========================================================================
    # SLIDE 3: Our Vision & The Core Paradigm Shift (Mihir Jadav)
    # =========================================================================
    s3 = create_slide()
    add_header(s3, "Product Vision • The HarvestMitra Solution",
               "From Reactive Distress Selling to Proactive Profit Arbitrage",
               "HarvestMitra AI integrates price discovery, harvest simulation, and shared logistics into one workflow.")

    # Left Column: The Paradigm Shift
    add_card(s3, 0.8, 1.9, 5.6, 5.0, bg_color=CARD_BG, border_color=CARD_BORDER)
    tb_vis = s3.shapes.add_textbox(Inches(1.1), Inches(2.1), Inches(5.0), Inches(4.6))
    tf_v = tb_vis.text_frame
    tf_v.word_wrap = True

    p = tf_v.paragraphs[0]
    p.text = "THE ARCHITECTURAL PARADIGM SHIFT"
    p.font.size = Pt(12)
    p.font.bold = True
    p.font.color.rgb = GOLD

    p = tf_v.add_paragraph()
    p.text = "THE OLD DISTRESS PARADIGM:"
    p.font.size = Pt(11)
    p.font.bold = True
    p.font.color.rgb = RGBColor(239, 68, 68) # Red
    p.space_before = Pt(8)

    p = tf_v.add_paragraph()
    p.text = "Harvest in Isolation ➔ Forced Local Cartel Sale ➔ Solo Freight Extortion ➔ Net Financial Loss."
    p.font.size = Pt(10.5)
    p.font.color.rgb = LIGHT_SLATE

    p = tf_v.add_paragraph()
    p.text = "THE HARVESTMITRA AI PARADIGM:"
    p.font.size = Pt(11)
    p.font.bold = True
    p.font.color.rgb = MINT
    p.space_before = Pt(12)

    p = tf_v.add_paragraph()
    p.text = "1. Verified Land & Multi-Crop Profile Sync (Agristack 7/12)\n" \
             "2. Deterministic 3-Scenario Revenue Simulation (mathEngine)\n" \
             "3. Direct Wholesale Procurement & Collective FPO Pooling\n" \
             "4. Highway Corridor Logistics Sharing with Digital QR Gate Pass\n" \
             "5. Guaranteed +15% to +30% Net Take-Home Margin in Farmer's Pocket."
    p.font.size = Pt(10.5)
    p.font.color.rgb = WHITE
    p.space_before = Pt(4)

    # Right Column: 3 Core Pillars
    pillars = [
        ("Pillar 1: Zero-Hallucination Math Engine",
         "Generative AI never calculates financial projections. Our deterministic mathEngine.js calculates real tolls, diesel fuel, and APMC cess to guarantee 100% mathematical accuracy.", EMERALD),
        ("Pillar 2: 106 APMC Mandi Scanner",
         "Tracks 106 wholesale mandis across Maharashtra. Automated Simple Moving Average (SMA3 vs SMA7) trend detection identifies profitable arbitrage before market crashes.", GOLD),
        ("Pillar 3: Shared Rural Cold-Chain Corridor",
         "Clusters smallholder farmers moving along identical highway routes (e.g. NH-160), slashing per-kg freight costs by 40% to 50% with verified escrow security.", SKY)
    ]
    for idx, (ptitle, pdesc, pcolor) in enumerate(pillars):
        y_pos = 1.9 + idx * 1.65
        add_card(s3, 6.7, y_pos, 5.8, 1.5, bg_color=CARD_BG, border_color=CARD_BORDER)
        tb_p = s3.shapes.add_textbox(Inches(6.9), Inches(y_pos + 0.15), Inches(5.4), Inches(1.2))
        tf_p = tb_p.text_frame
        tf_p.word_wrap = True

        p_pt = tf_p.paragraphs[0]
        p_pt.text = ptitle.upper()
        p_pt.font.size = Pt(12)
        p_pt.font.bold = True
        p_pt.font.color.rgb = pcolor

        p_pd = tf_p.add_paragraph()
        p_pd.text = pdesc
        p_pd.font.size = Pt(10.5)
        p_pd.font.color.rgb = WHITE
        p_pd.space_before = Pt(4)

    slides_notes.append(
        "SPEAKER: MIHIR JADAV (Team Leader)\n"
        "\"HarvestMitra AI replaces distress selling with deterministic profit arbitrage. "
        "Instead of forcing a farmer to guess where to sell, our system connects crop registration to verified 3-scenario financial simulation, direct buyer matching, and pooled highway transport. "
        "Crucially, our math is never hallucinated by generative AI. Our verified math engine evaluates real highway tolls, diesel costs, and APMC cess to give the farmer factual take-home profit.\""
    )

    # =========================================================================
    # SLIDE 4: How It Works: The 4-Step Farmer Journey (Mihir Jadav)
    # =========================================================================
    s4 = create_slide()
    add_header(s4, "End-to-End Workflow • Intuitive 4-Step Pipeline",
               "How HarvestMitra AI Guides Every Harvest Decision",
               "From crop registration to verified APMC terminal delivery in minutes.")

    # 4 Horizontal Pipeline Step Cards
    steps = [
        ("STEP 01", "Crop & Land Sync",
         "Farmer registers acreage or verifies 7/12 Agristack survey. System models crop maturity, expected harvest weight (kg), and perishability shelf life.",
         "Input: Crop & Acreage\nOutput: Harvest Kg Profile", EMERALD),
        ("STEP 02", "3-Scenario Simulation",
         "mathEngine evaluates: (A) Sell Local Today, (B) Hold in Cold Storage for 5–7 Days, or (C) Dispatch to Regional Terminal (Vashi/Pune APMC).",
         "Input: Market Rates & Costs\nOutput: Ranked Net Profit", GOLD),
        ("STEP 03", "Buyer & FPO Match",
         "Farmer matches with certified APMC procurement bids or aggregates with FPO collective lot to negotiate premium wholesale counter-quotations.",
         "Input: Pooled Cargo Lot\nOutput: Guaranteed B2B Bid", PURPLE),
        ("STEP 04", "Shared Transit & Pass",
         "System books shared truck capacity along highway corridor. Issues digital QR Gate Pass, locks freight fare in escrow, and triggers delivery rating.",
         "Input: Freight Booking\nOutput: Verified Mandi Pass", SKY)
    ]

    for idx, (snum, stitle, sdesc, sio, scolor) in enumerate(steps):
        x = 0.8 + idx * 2.95
        add_card(s4, x, 1.9, 2.8, 4.3, bg_color=CARD_BG, border_color=CARD_BORDER)
        
        # Step Header Pill
        add_card(s4, x + 0.15, 2.05, 1.2, 0.35, bg_color=PILL_BG, border_color=scolor)
        tb_tag = s4.shapes.add_textbox(Inches(x + 0.2), Inches(2.07), Inches(1.1), Inches(0.3))
        p_tg = tb_tag.text_frame.paragraphs[0]
        p_tg.text = snum
        p_tg.font.size = Pt(9.5)
        p_tg.font.bold = True
        p_tg.font.color.rgb = scolor

        tb = s4.shapes.add_textbox(Inches(x + 0.15), Inches(2.5), Inches(2.5), Inches(3.5))
        tf = tb.text_frame
        tf.word_wrap = True

        pt = tf.paragraphs[0]
        pt.text = stitle
        pt.font.size = Pt(13)
        pt.font.bold = True
        pt.font.color.rgb = WHITE

        pd = tf.add_paragraph()
        pd.text = sdesc
        pd.font.size = Pt(10)
        pd.font.color.rgb = LIGHT_SLATE
        pd.space_before = Pt(6)

        pio = tf.add_paragraph()
        pio.text = sio
        pio.font.size = Pt(9)
        pio.font.bold = True
        pio.font.color.rgb = GOLD_LIGHT
        pio.space_before = Pt(10)

    # Bottom workflow summary
    add_card(s4, 0.8, 6.4, 11.7, 0.6, bg_color=CARD_BG_ALT, border_color=CARD_BORDER)
    tb_ws = s4.shapes.add_textbox(Inches(1.0), Inches(6.45), Inches(11.3), Inches(0.5))
    p_ws = tb_ws.text_frame.paragraphs[0]
    p_ws.text = "WORKFLOW RESULT: Transparent financial comparison + Guaranteed freight pooling = 15% to 30% additional net margin directly to the farmer."
    p_ws.font.size = Pt(11)
    p_ws.font.bold = True
    p_ws.font.color.rgb = MINT

    slides_notes.append(
        "SPEAKER: MIHIR JADAV (Team Leader)\n"
        "\"Here is the exact journey in 4 simple steps: First, the farmer enters their crop acreage or connects their 7/12 Agristack land record. "
        "Second, our simulator calculates take-home returns across local, cold-storage, and regional mandi scenarios. "
        "Third, if a regional terminal wins, the platform matches them with APMC buyers or bulk FPO lots. "
        "Fourth, the farmer books shared transport, receives a digital QR gate pass, and locks freight in escrow. Sayali will now present the farmer interface.\""
    )

    # =========================================================================
    # SLIDE 5: Meet The Ecosystem: 5 Integrated Roles (Mihir Jadav)
    # =========================================================================
    s5 = create_slide()
    add_header(s5, "Multi-Stakeholder Architecture • Collaborative Network",
               "Meet the Ecosystem: 5 Dedicated Stakeholder Roles",
               "A connected platform uniting farmers, FPO collectives, APMC mandis, transporters, and market administrators.")

    roles = [
        ("FARMER", "Sayali Kulkarni",
         "Universal Guest Mode (zero login wall)\nMulti-Crop Profile & Acreage Donut Chart\n3-Scenario Harvest Profit Simulator\n1-Click Loan-Ready A4 Printable Report\nAgristack 7/12 Land Verification", EMERALD),
        ("FPO LEADER", "Mihir Jadav",
         "45+ Member Farmer Roster & Privacy Isolation\nCollective Uncommitted Crop Lot Aggregation\nBulk Mandi Procurement Counter-Quotations\nTransparent Proportional Payout Ledger\nBulk Highway Transport Scheduling", GOLD),
        ("MANDI OFFICIAL", "Mihir Jadav",
         "Real-Time District Farmer Arrivals Feed\nDirect Procurement Counter-Quotation Offers\nOfficial APMC License & Weighbridge Record\nSMS & WhatsApp Booking Notifications\ne-NAM Electronic Trade Record Alignment", PURPLE),
        ("TRANSPORTER", "Prashant Warule",
         "Real-Time Open Highway Cargo Matching\nSingle-Trip Active Driver Integrity Lock\nDigital Mandi Gate Pass with Official QR Seal\nNH-160 Corridor Route Playback Simulator\nUPI Freight Escrow & 5-Star Driver Rating", SKY),
        ("APMC ADMIN", "Mihir Jadav",
         "Strict Role-Based Access Control (RBAC)\n106 APMC Mandi Benchmark Price Governance\nCentral Government Scheme Management\nUser Status Moderation (Active/Suspended)\nSystem-Wide Audit & Transaction Logging", WHITE)
    ]

    for idx, (rtitle, rowner, rfeatures, rcolor) in enumerate(roles):
        x = 0.8 + idx * 2.35
        add_card(s5, x, 1.9, 2.25, 4.8, bg_color=CARD_BG, border_color=CARD_BORDER)

        # Role Header
        add_card(s5, x + 0.1, 2.05, 2.05, 0.65, bg_color=PILL_BG, border_color=rcolor)
        tb_r = s5.shapes.add_textbox(Inches(x + 0.12), Inches(2.08), Inches(2.0), Inches(0.6))
        tf_r = tb_r.text_frame
        tf_r.word_wrap = True
        pr = tf_r.paragraphs[0]
        pr.text = rtitle
        pr.font.size = Pt(11)
        pr.font.bold = True
        pr.font.color.rgb = rcolor

        pro = tf_r.add_paragraph()
        pro.text = f"Owner: {rowner}"
        pro.font.size = Pt(8.5)
        pro.font.color.rgb = LIGHT_SLATE

        tb_f = s5.shapes.add_textbox(Inches(x + 0.1), Inches(2.8), Inches(2.05), Inches(3.8))
        tf_f = tb_f.text_frame
        tf_f.word_wrap = True
        
        for f_line in rfeatures.split("\n"):
            pf = tf_f.add_paragraph() if tf_f.paragraphs[0].text else tf_f.paragraphs[0]
            pf.text = f"• {f_line}"
            pf.font.size = Pt(9)
            pf.font.color.rgb = WHITE
            pf.space_before = Pt(4)

    slides_notes.append(
        "SPEAKER: MIHIR JADAV (Team Leader)\n"
        "\"HarvestMitra AI is not a single-user app. We designed a cohesive multi-stakeholder ecosystem. "
        "Farmers simulate harvest profits and book transport; FPO Leaders pool member crops into bulk institutional lots; APMC Mandi officials issue direct procurement bids; "
        "Transporters fill empty truck capacity along highway corridors; and APMC Administrators govern price benchmarks and security. "
        "I will now turn the stage over to Sayali Kulkarni to showcase our zero-friction farmer experience.\""
    )

    # =========================================================================
    # SLIDE 6: Technology Architecture & Modern Full-Stack Pipeline (Mihir Jadav)
    # =========================================================================
    s6 = create_slide()
    add_header(s6, "System Architecture • Modern Full-Stack Engineering",
               "Production-Engineered Architectural Blueprint",
               "Modern web standards, zero-hallucination computation, and strict role-based data isolation.")

    layers = [
        ("PRESENTATION TIER", "Frontend UI / SPA Client (React 19, Vite 8, TailwindCSS v4)",
         "• React 19 SPA with client routing (React Router v7) & strict ProtectedRoute guards\n"
         "• Recharts dynamic multi-crop acreage donut chart & 14-day price trajectory analytics\n"
         "• Leaflet.js interactive NH-160 highway logistics corridor & driver telemetry radar\n"
         "• Native Web Speech API for multilingual voice STT recognition & TTS audio playback", EMERALD),
        ("APPLICATION API TIER", "Backend API Gateway (Node.js 20, Express 5.3)",
         "• Centralized REST API router (App.js) with JWT authentication & role-based middleware\n"
         "• mathEngine.js deterministic profit engine (Zero-hallucination toll, fuel & cess deduction)\n"
         "• Hybrid AI orchestration: Google Gemini API with sub-15ms deterministic fallback engine\n"
         "• Centralized error handling, input schema sanitization, and session token lifecycle", GOLD),
        ("DATA & PERSISTENCE TIER", "Relational Database (MySQL 8.0 / Sequelize ORM)",
         "• 14 Relational Models: Users, FarmerProfiles, Crops, Markets, MarketPrices, TransportRequests, Trips\n"
         "• Dedicated FPO Schemas: FpoProfiles, FpoMembers, CropAggregations, BulkOffers, Orders\n"
         "• ACID-compliant transactions for cargo allocation, over-commitment guards & escrow release\n"
         "• 150 seeded Maharashtra APMC price records & 106 tracked wholesale market benchmarks", SKY),
        ("EXTERNAL INTEGRATIONS TIER", "Telemetry, Open Services & Government Registries",
         "• Live Open-Meteo Satellite API for hyper-local rain probability, temperature & wind telemetry\n"
         "• National Agristack Registry algorithmic resolver (Survey 7/12 land record validation)\n"
         "• WhatsApp Web deep-link gateway simulator for high-priority rain and gate pass alerts\n"
         "• Tested production deployment on Render Cloud Platform with SSL termination", PURPLE)
    ]

    for idx, (ltitle, lsub, ldetails, lcolor) in enumerate(layers):
        y = 1.9 + idx * 1.25
        add_card(s6, 0.8, y, 11.7, 1.15, bg_color=CARD_BG, border_color=CARD_BORDER)

        # Tag
        add_card(s6, 0.95, y + 0.15, 2.3, 0.85, bg_color=PILL_BG, border_color=lcolor)
        tb_tag = s6.shapes.add_textbox(Inches(1.0), Inches(y + 0.2), Inches(2.2), Inches(0.75))
        tf_t = tb_tag.text_frame
        tf_t.word_wrap = True
        ptg = tf_t.paragraphs[0]
        ptg.text = ltitle
        ptg.font.size = Pt(10)
        ptg.font.bold = True
        ptg.font.color.rgb = lcolor

        tb_c = s6.shapes.add_textbox(Inches(3.4), Inches(y + 0.1), Inches(8.9), Inches(1.0))
        tf_c = tb_c.text_frame
        tf_c.word_wrap = True
        
        pc_title = tf_c.paragraphs[0]
        pc_title.text = lsub
        pc_title.font.size = Pt(11)
        pc_title.font.bold = True
        pc_title.font.color.rgb = WHITE

        pc_body = tf_c.add_paragraph()
        pc_body.text = ldetails
        pc_body.font.size = Pt(8.5)
        pc_body.font.color.rgb = LIGHT_SLATE
        pc_body.space_before = Pt(2)

    slides_notes.append(
        "SPEAKER: MIHIR JADAV (Team Leader)\n"
        "\"HarvestMitra AI is architected on a rock-solid 4-tier stack. "
        "Our React 19 frontend provides fast, responsive analytics using Recharts and Leaflet. "
        "Our Express 5 gateway enforces strict role-based access control and runs our deterministic math engine. "
        "Our MySQL database maintains 14 relational tables with full ACID transaction guarantees for produce allocations. "
        "And our integration tier pulls live satellite weather from Open-Meteo and validates 7/12 land records.\""
    )

    # =========================================================================
    # SLIDE 7: Behind the APIs: Production Endpoints & Data Flow (Mihir Jadav)
    # =========================================================================
    s7 = create_slide()
    add_header(s7, "Backend Engineering • Verified RESTful Endpoints",
               "Behind the APIs: Deterministic Routing & Data Flow",
               "Production endpoint implementations verified across 33 automated test suites.")

    endpoints = [
        ("GET /api/markets/arbitrage", "Inter-Mandi Arbitrage & Profit Engine",
         "Params: ?crop=Tomato&quantityKg=1000\n"
         "Validation: Validates crop name and non-negative quantity. Queries database APMC benchmark rates.\n"
         "Math Logic: Net Profit = (Mandi Price × Quantity) - (Toll Fees + Diesel Cost + APMC Cess + Unloading).\n"
         "Response: Ranks mandis by net margin (Rank 1: Surat APMC ₹29,080, Rank 2: Pune APMC ₹28,150).", EMERALD),
        ("POST /api/transport/requests", "Shared Cargo Clustering & Driver Integrity Lock",
         "Payload: { pickupDistrict, deliveryMandi, cropType, weightKg, priceOffer }\n"
         "Isolation: Farmer token verified via JWT. Single-trip active driver lock enforced (returns 409 Conflict if driver has ongoing trip).\n"
         "Security: Automatically mints cryptographic 8-character gate_pass_code with verifiable QR data payload.", SKY),
        ("POST /api/fpo/aggregations", "Collective Produce Pooling & Over-Commitment Guard",
         "Payload: { cropName: 'Onion', lots: [{ farmerId: 1, committedKg: 1000 }, { farmerId: 2, committedKg: 1500 }] }\n"
         "Integrity Guard: Rejects with 400 Bad Request if committed > uncommitted farmer inventory.\n"
         "Output: Creates pooled wholesale lot AGG-2026-NAS-6771 ready for bulk APMC procurement quotation.", GOLD)
    ]

    for idx, (epath, etitle, edesc, ecolor) in enumerate(endpoints):
        y = 1.9 + idx * 1.65
        add_card(s7, 0.8, y, 11.7, 1.5, bg_color=CARD_BG, border_color=CARD_BORDER)

        add_card(s7, 1.0, y + 0.15, 3.4, 0.45, bg_color=PILL_BG, border_color=ecolor)
        tb_ep = s7.shapes.add_textbox(Inches(1.05), Inches(y + 0.18), Inches(3.3), Inches(0.4))
        pep = tb_ep.text_frame.paragraphs[0]
        pep.text = epath
        pep.font.size = Pt(11)
        pep.font.bold = True
        pep.font.color.rgb = ecolor

        tb_txt = s7.shapes.add_textbox(Inches(4.6), Inches(y + 0.12), Inches(7.7), Inches(1.3))
        tf_txt = tb_txt.text_frame
        tf_txt.word_wrap = True

        pt = tf_txt.paragraphs[0]
        pt.text = etitle.upper()
        pt.font.size = Pt(11.5)
        pt.font.bold = True
        pt.font.color.rgb = WHITE

        for line in edesc.split("\n"):
            pl = tf_txt.add_paragraph()
            pl.text = line
            pl.font.size = Pt(9.5)
            pl.font.color.rgb = LIGHT_SLATE
            pl.space_before = Pt(2)

    slides_notes.append(
        "SPEAKER: MIHIR JADAV (Team Leader)\n"
        "\"Let us look under the hood at our production APIs. "
        "Our arbitrage endpoint calculates factual take-home profit by deducting highway tolls and diesel fuel rather than returning raw gross prices. "
        "Our transport endpoint prevents double-booking through an active driver lock, returning a 409 Conflict if violated. "
        "And our FPO aggregation API enforces mathematical inventory guards, rejecting any lot where committed produce exceeds a farmer's uncommitted stock. "
        "Sayali will now demonstrate how this powers our farmer user interface.\""
    )

    # =========================================================================
    # SLIDE 8: Farmer Module & Rural-First UX (Sayali Kulkarni)
    # =========================================================================
    s8 = create_slide()
    add_header(s8, "Frontend & Rural-First UX • Sayali Kulkarni",
               "Zero-Friction Farmer Experience: Accessible, Intuitive & Actionable",
               "Designed specifically for rural smallholders with multilingual support, guest mode, and A4 printability.")

    farmer_features = [
        ("Universal Guest Mode",
         "Rural farmers should never be blocked by complex login or OTP walls just to check commodity rates. Anyone can click 'Explore Without Login' to immediately access market analytics and simulations.",
         "Verified: 5/5 Guest Mode Tests Pass", EMERALD),
        ("Multi-Crop Acreage Donut",
         "Smallholders cultivating multiple crops (e.g. Cotton, Tomato, Wheat) switch tabs seamlessly. Recharts interactive donut calculates acreage distribution, projected yield, and expected revenue.",
         "Verified: 10/10 Multi-Crop Tests Pass", GOLD),
        ("1-Click Printable Farm Report",
         "Many rural farmers need physical documentation for bank loans or APMC clearances. Issue #79 A4 printable layout strips all web navigation, producing a certified, loan-ready decision sheet.",
         "Verified: Issue #78 & #79 A4 CSS Layout", SKY),
        ("Agristack 7/12 Land Verification",
         "Integrated with national agricultural identity registry (Survey 142/2A). Linking land credentials unlocks pre-approved government welfare schemes (PM-KISAN, Drip Irrigation Subsidies).",
         "Verified: 7/12 Resolver & Pre-Approval", PURPLE)
    ]

    for idx, (ftitle, fdesc, fverified, fcolor) in enumerate(farmer_features):
        x = 0.8 + idx * 2.95
        add_card(s8, x, 1.9, 2.8, 4.8, bg_color=CARD_BG, border_color=CARD_BORDER)

        add_card(s8, x + 0.15, 2.1, 2.5, 0.5, bg_color=PILL_BG, border_color=fcolor)
        tb_t = s8.shapes.add_textbox(Inches(x + 0.2), Inches(2.15), Inches(2.4), Inches(0.4))
        pt = tb_t.text_frame.paragraphs[0]
        pt.text = ftitle.upper()
        pt.font.size = Pt(10.5)
        pt.font.bold = True
        pt.font.color.rgb = fcolor

        tb_d = s8.shapes.add_textbox(Inches(x + 0.15), Inches(2.75), Inches(2.5), Inches(3.8))
        tf_d = tb_d.text_frame
        tf_d.word_wrap = True

        pd = tf_d.paragraphs[0]
        pd.text = fdesc
        pd.font.size = Pt(10)
        pd.font.color.rgb = WHITE

        pv = tf_d.add_paragraph()
        pv.text = f"✓ {fverified}"
        pv.font.size = Pt(9.5)
        pv.font.bold = True
        pv.font.color.rgb = GOLD_LIGHT
        pv.space_before = Pt(12)

    slides_notes.append(
        "SPEAKER: SAYALI KULKARNI (Frontend & UI/UX)\n"
        "\"Thank you, Mihir. In engineering the HarvestMitra frontend, our primary objective was zero rural friction. "
        "First, we built Universal Guest Mode: a farmer should never be blocked by an OTP wall just to check daily crop prices. "
        "Second, our Multi-Crop Acreage visualizer uses Recharts to calculate land allocation and expected harvest tonnage across multiple crops simultaneously. "
        "And third, recognizing that farmers need paper documentation for bank credit or APMC clearances, our One-Click Printable Farm Report transforms the screen into a clean, loan-ready A4 document. "
        "Mihir will now explain our newly integrated FPO module.\""
    )

    # =========================================================================
    # SLIDE 9: FPO Leader Module: Collective Farmer Empowerment (Mihir Jadav)
    # =========================================================================
    s9 = create_slide()
    add_header(s9, "Collective Aggregation • Mihir Jadav",
               "FPO Module: Transforming Small Lots into High-Value Bulk Contracts",
               "Enabling Farmer Producer Organizations to pool member crops, negotiate with wholesale mandis, and automate payouts.")

    fpo_blocks = [
        ("01 • MEMBER ROSTER & PRIVACY",
         "Centralized directory tracking 45+ registered member farmers, surveyed acreage, village clusters, and uncommitted stock. Full data privacy prevents non-FPO members from viewing sensitive farmer contact records.", EMERALD),
        ("02 • COLLECTIVE LOT AGGREGATION",
         "FPO leaders aggregate multiple 200–500 kg farmer lots into single wholesale shipments (e.g. 2,500 kg Onion lot AGG-2026-NAS-6771). Strict mathematical validation prevents double-allocation of produce.", GOLD),
        ("03 • BULK MANDI PROCUREMENT OFFERS",
         "FPO dispatches formal bulk trade offers directly to APMC terminal officials. Mandis submit electronic counter-quotations (e.g. ₹31/kg on Vashi APMC) which FPO leaders accept or negotiate.", SKY),
        ("04 • TRANSPARENT PAYOUT LEDGER",
         "Once a bulk contract is confirmed, the system calculates exact proportional payouts per farmer: (Gross Value × Share %) - (Proportional Freight) = Transparent Net Payout directly into bank accounts.", PURPLE)
    ]

    card_positions = [(0.8, 1.9), (6.8, 1.9), (0.8, 4.3), (6.8, 4.3)]
    for idx, (btitle, bdesc, bcolor) in enumerate(fpo_blocks):
        x, y = card_positions[idx]
        add_card(s9, x, y, 5.7, 2.2, bg_color=CARD_BG, border_color=CARD_BORDER)

        tb = s9.shapes.add_textbox(Inches(x + 0.25), Inches(y + 0.15), Inches(5.2), Inches(1.9))
        tf = tb.text_frame
        tf.word_wrap = True

        pt = tf.paragraphs[0]
        pt.text = btitle
        pt.font.size = Pt(12)
        pt.font.bold = True
        pt.font.color.rgb = bcolor

        pd = tf.add_paragraph()
        pd.text = bdesc
        pd.font.size = Pt(10.5)
        pd.font.color.rgb = WHITE
        pd.space_before = Pt(6)

    # Bottom Callout
    add_card(s9, 0.8, 6.65, 11.7, 0.55, bg_color=PILL_BG, border_color=EMERALD)
    tb_fb = s9.shapes.add_textbox(Inches(1.0), Inches(6.7), Inches(11.3), Inches(0.45))
    pfb = tb_fb.text_frame.paragraphs[0]
    pfb.text = "VERIFIED IN CODEBASE: 15/15 FPO test cases passing in fpoModule.test.js • Database tables: fpo_profiles, fpo_members, fpo_crop_aggregations, fpo_bulk_offers."
    pfb.font.size = Pt(10)
    pfb.font.bold = True
    pfb.font.color.rgb = MINT

    slides_notes.append(
        "SPEAKER: MIHIR JADAV (Team Leader)\n"
        "\"Smallholder farmers alone often lack bargaining power. That is why we engineered a complete FPO Module. "
        "An FPO leader can aggregate produce across dozens of smallholders—for instance, pooling 2,500 kilograms of onions from three farmers into a single lot. "
        "The FPO dispatches this bulk lot to Vashi APMC, receives an electronic counter-quotation at ₹31 per kilo, and confirms the contract. "
        "Our payout ledger automatically splits gross revenue and proportional freight deductions, ensuring 100% financial transparency. All 15 automated FPO test suites pass.\""
    )

    # =========================================================================
    # SLIDE 10: APMC Mandi Procurement Portal (Mihir Jadav)
    # =========================================================================
    s10 = create_slide()
    add_header(s10, "Buyer-Side Operations • Mihir Jadav",
               "Mandi Portal: Direct Digital Procurement for APMC Officials",
               "Eliminating physical middleman cartels through direct farmer connection and verified digital trades.")

    mandi_features = [
        ("District Arrivals Feed",
         "Wholesale APMC traders and licensed mandi officials view real-time incoming produce listings across 28 registered district farmers with verified crop types, quantities, and harvest readiness.", EMERALD),
        ("Direct Procurement Offers",
         "Officials can bypass village brokers and send direct purchase offers (e.g. 250 kg Cotton at ₹75.65/kg). Farmer dashboards instantly receive active procurement notification toasts.", GOLD),
        ("Electronic Weighbridge & License Sync",
         "Displays verified Mandi License number (MH-APMC-PUN-MJ-2026), operating days, automated weighbridge facilities, and ripening chamber capacity aligned with e-NAM digital standards.", SKY)
    ]

    for idx, (mtitle, mdesc, mcolor) in enumerate(mandi_features):
        x = 0.8 + idx * 3.95
        add_card(s10, x, 1.9, 3.8, 3.8, bg_color=CARD_BG, border_color=CARD_BORDER)

        add_card(s10, x + 0.2, 2.1, 3.4, 0.5, bg_color=PILL_BG, border_color=mcolor)
        tb_t = s10.shapes.add_textbox(Inches(x + 0.25), Inches(2.15), Inches(3.3), Inches(0.4))
        pt = tb_t.text_frame.paragraphs[0]
        pt.text = mtitle.upper()
        pt.font.size = Pt(11)
        pt.font.bold = True
        pt.font.color.rgb = mcolor

        tb_d = s10.shapes.add_textbox(Inches(x + 0.2), Inches(2.8), Inches(3.4), Inches(2.7))
        tf_d = tb_d.text_frame
        tf_d.word_wrap = True

        pd = tf_d.paragraphs[0]
        pd.text = mdesc
        pd.font.size = Pt(10.5)
        pd.font.color.rgb = WHITE

    # Mandi Image & Test Stat
    add_card(s10, 0.8, 5.9, 11.7, 1.25, bg_color=CARD_BG_ALT, border_color=CARD_BORDER)
    tb_ms = s10.shapes.add_textbox(Inches(1.0), Inches(6.0), Inches(11.3), Inches(1.05))
    tf_ms = tb_ms.text_frame
    tf_ms.word_wrap = True

    pms = tf_ms.paragraphs[0]
    pms.text = "VERIFIED IN PRODUCTION: APMC Mandi Portal & Procurement Workflow"
    pms.font.size = Pt(11)
    pms.font.bold = True
    pms.font.color.rgb = GOLD

    pms_d = tf_ms.add_paragraph()
    pms_d.text = "• Tested in mandiProcurement.test.js: 6/6 tests passed with 100% success.\n" \
                 "• Tested in mandiDashboardFlow.test.js: Real-time notification badge, procurement offer submission, and district farmer feed verified.\n" \
                 "• Live Demo Account: mandi@harvestmitra.local (Sayali Kulkarni - APMC Mandi Official, Pune Wholesale Market)."
    pms_d.font.size = Pt(9.5)
    pms_d.font.color.rgb = LIGHT_SLATE
    pms_d.space_before = Pt(3)

    slides_notes.append(
        "SPEAKER: MIHIR JADAV (Team Leader)\n"
        "\"On the buyer side, our dedicated APMC Mandi Portal gives licensed wholesale officials direct visibility into farm arrivals. "
        "A mandi official in Pune can view incoming produce from 28 registered district farmers and dispatch a binding procurement offer directly to a farmer's dashboard. "
        "This bypasses village brokers, eliminates commission leakage, and creates a verified digital audit trail. Prashant Warule will now show how produce is physically transported.\""
    )

    # =========================================================================
    # SLIDE 11: Transporter Module & Shared Logistics (Prashant Warule)
    # =========================================================================
    s11 = create_slide()
    add_header(s11, "Shared Freight & Escrow • Prashant Warule",
               "Shared Transport Pooling: Slashing Rural Freight Costs by 40–50%",
               "Dynamic highway cargo clustering, corridor telemetry playback, and secure digital gate pass verification.")

    transport_features = [
        ("Shared Cargo Clustering",
         "Clusters smallholder farmers along identical highway corridors (e.g. Niphad ➔ Nashik ➔ Mumbai Vashi). Eliminates empty return trips and splits fuel/tolls proportionally, reducing freight by 40–50%.",
         "Tested: sharedTransportBooking.test.js", EMERALD),
        ("Single-Trip Active Driver Lock",
         "Strict database constraint ensures a transporter can only progress one active delivery at a time. System returns 409 Conflict if a driver attempts to accept overlapping dispatches.",
         "Tested: transport_security.test.js (7/7 Pass)", GOLD),
        ("Digital QR Mandi Gate Pass",
         "Accepted trips instantly generate a digital Mandi Gate Pass containing verified driver photo, vehicle license (MH-12-PW-2026), cargo manifest, and an encrypted QR security seal.",
         "Tested: driverGatePassPrint.test.js", SKY),
        ("Freight Escrow & 5-Star Rating",
         "Farmer locks freight fare in HarvestMitra Escrow upon booking. Funds are automatically released to the driver upon delivery confirmation, followed by 5-star driver performance reviews.",
         "Tested: escrow_rating.test.js", PURPLE)
    ]

    for idx, (ttitle, tdesc, ttest, tcolor) in enumerate(transport_features):
        x = 0.8 + idx * 2.95
        add_card(s11, x, 1.9, 2.8, 4.3, bg_color=CARD_BG, border_color=CARD_BORDER)

        add_card(s11, x + 0.15, 2.05, 2.5, 0.45, bg_color=PILL_BG, border_color=tcolor)
        tb_t = s11.shapes.add_textbox(Inches(x + 0.2), Inches(2.1), Inches(2.4), Inches(0.35))
        pt = tb_t.text_frame.paragraphs[0]
        pt.text = ttitle.upper()
        pt.font.size = Pt(10)
        pt.font.bold = True
        pt.font.color.rgb = tcolor

        tb_d = s11.shapes.add_textbox(Inches(x + 0.15), Inches(2.65), Inches(2.5), Inches(3.4))
        tf_d = tb_d.text_frame
        tf_d.word_wrap = True

        pd = tf_d.paragraphs[0]
        pd.text = tdesc
        pd.font.size = Pt(9.5)
        pd.font.color.rgb = WHITE

        ptst = tf_d.add_paragraph()
        ptst.text = f"✓ {ttest}"
        ptst.font.size = Pt(9)
        ptst.font.bold = True
        ptst.font.color.rgb = GOLD_LIGHT
        ptst.space_before = Pt(8)

    # Technical honesty callout
    add_card(s11, 0.8, 6.4, 11.7, 0.65, bg_color=CARD_BG_ALT, border_color=CARD_BORDER)
    tb_hc = s11.shapes.add_textbox(Inches(1.0), Inches(6.45), Inches(11.3), Inches(0.55))
    phc = tb_hc.text_frame.paragraphs[0]
    phc.text = "TECHNICAL HONESTY NOTE: Route radar is an accurate Logistics Corridor & Telemetry Playback Simulator (NH-160 Kasara Ghat corridor with 1x-10x speed scrubber), not unverified hardware satellite GPS."
    phc.font.size = Pt(9.5)
    phc.font.bold = True
    phc.font.color.rgb = MINT

    slides_notes.append(
        "SPEAKER: PRASHANT WARULE (Transporter Module & Shared Logistics)\n"
        "\"Thank you, Mihir. In traditional rural logistics, a farmer dispatching 500 kg pays for an entire truck. "
        "Our Shared Transport Pooling Engine matches farmers along identical highway corridors, cutting freight costs by 40% to 50%. "
        "To protect both parties, our system enforces a single-trip driver lock, generates a Digital Mandi Gate Pass with an encrypted QR verification seal, "
        "and locks freight payments in escrow until delivery is confirmed. Varun will now present our AI and weather intelligence.\""
    )

    # =========================================================================
    # SLIDE 12: AI Intelligence, Market Trends & Weather (Varun Patil)
    # =========================================================================
    s12 = create_slide()
    add_header(s12, "AI & Telemetry Integration • Varun Patil",
               "AI-Powered Intelligence: Price Forecasting, Voice & Weather Telemetry",
               "106 APMC Mandis analyzed, live Open-Meteo satellite weather, and multilingual voice assistance.")

    ai_pillars = [
        ("106 APMC Mandi Scanner",
         "Our mandiSyncService calculates 3-day and 7-day Simple Moving Averages (SMA3 vs SMA7) across 106 Maharashtra mandis to detect price spikes and market drops before they occur.",
         "Live Data: 106 Mandis & 3,722 Records", EMERALD),
        ("14-Day Price Forecast Engine",
         "forecastEngine.js predicts price trajectories over a 14-day window with 95% statistical confidence bounds (lower, baseline, upper) to identify optimal selling dates.",
         "Algorithm: Confidence Bound Modeling", GOLD),
        ("Open-Meteo Weather Telemetry",
         "Direct integration with Open-Meteo API for real-time rain probability, humidity, and wind speed. Precipitation >60% triggers localized WhatsApp advisory toasts.",
         "Live Integration: Open-Meteo Direct API", SKY),
        ("Mitra Multilingual Voice AI",
         "Web Speech STT/TTS operating in Marathi, Hindi, and English. If cloud connectivity drops, our deterministic local rule engine responds in under 15 milliseconds without hallucination.",
         "Fallback: Sub-15ms Rule-Based AI", PURPLE)
    ]

    for idx, (atitle, adesc, astatus, acolor) in enumerate(ai_pillars):
        x = 0.8 + idx * 2.95
        add_card(s12, x, 1.9, 2.8, 3.8, bg_color=CARD_BG, border_color=CARD_BORDER)

        add_card(s12, x + 0.15, 2.05, 2.5, 0.45, bg_color=PILL_BG, border_color=acolor)
        tb_t = s12.shapes.add_textbox(Inches(x + 0.2), Inches(2.1), Inches(2.4), Inches(0.35))
        pt = tb_t.text_frame.paragraphs[0]
        pt.text = atitle.upper()
        pt.font.size = Pt(10)
        pt.font.bold = True
        pt.font.color.rgb = acolor

        tb_d = s12.shapes.add_textbox(Inches(x + 0.15), Inches(2.65), Inches(2.5), Inches(3.0))
        tf_d = tb_d.text_frame
        tf_d.word_wrap = True

        pd = tf_d.paragraphs[0]
        pd.text = adesc
        pd.font.size = Pt(9.5)
        pd.font.color.rgb = WHITE

        pst = tf_d.add_paragraph()
        pst.text = f"● {astatus}"
        pst.font.size = Pt(9)
        pst.font.bold = True
        pst.font.color.rgb = GOLD_LIGHT
        pst.space_before = Pt(8)

    # Technical Truth Table
    add_card(s12, 0.8, 5.9, 11.7, 1.25, bg_color=CARD_BG_ALT, border_color=CARD_BORDER)
    tb_tt = s12.shapes.add_textbox(Inches(1.0), Inches(5.95), Inches(11.3), Inches(1.1))
    tf_tt = tb_tt.text_frame
    tf_tt.word_wrap = True

    ptt = tf_tt.paragraphs[0]
    ptt.text = "TECHNICAL FACT VERIFICATION & INTEGRATION REALITY TABLE:"
    ptt.font.size = Pt(10.5)
    ptt.font.bold = True
    ptt.font.color.rgb = GOLD

    ptt_d = tf_tt.add_paragraph()
    ptt_d.text = "• Live Connected: Open-Meteo Weather API, MySQL Database (14 schemas), Bcrypt Auth, SMS/WhatsApp payload formatting.\n" \
                 "• Algorithmic: 14-Day Price Forecast Engine, Agristack 7/12 land registry resolver, Deterministic AI Fallback Engine.\n" \
                 "• Simulated / Sample: WhatsApp deep-link generation (no paid Twilio gateway), Highway Corridor Simulator, Crop Doctor heuristic."
    ptt_d.font.size = Pt(9.5)
    ptt_d.font.color.rgb = LIGHT_SLATE
    ptt_d.space_before = Pt(3)

    slides_notes.append(
        "SPEAKER: VARUN PATIL (AI, Market Trends & Weather Integrations)\n"
        "\"Thank you, Prashant. Literacy should never be a barrier to technology. "
        "Our Mitra Voice Assistant allows a farmer to speak naturally in Marathi or Hindi to check commodity prices and receive spoken audio responses. "
        "If village internet drops, our sub-15-millisecond deterministic fallback engine continues answering without cloud dependency. "
        "Furthermore, our 14-day price forecasting engine projects price bounds, while live Open-Meteo satellite telemetry warns farmers before heavy rains destroy exposed harvests. Mihir will now present our security architecture.\""
    )

    # =========================================================================
    # SLIDE 13: Central APMC Admin Console & Enterprise Security (Mihir Jadav)
    # =========================================================================
    s13 = create_slide()
    add_header(s13, "Security & Governance • Mihir Jadav",
               "Enterprise Security & APMC Central Governance",
               "Strict role-based access control, cryptographic password hashing, and real-time market supervision.")

    admin_cols = [
        ("Role-Based Security Matrix",
         "Strict middleware enforcement across all endpoints. Farmers attempting to access admin or mandi routes receive immediate 403 Forbidden. Passwords protected with bcrypt hashing (10 salt rounds). Sessions are strictly scoped with zero token leaks in local storage.",
         "14/14 Security & RBAC Tests Pass", EMERALD),
        ("APMC Benchmark Price Governance",
         "Central market administrators supervise 106 APMC Mandis, review price outlier anomalies, edit benchmark mandi prices, and publish government welfare schemes directly to verified farmers.",
         "Verified: Issue 0055530 Price Governance", GOLD),
        ("Audit Logging & Account Control",
         "All administrative transactions, user status updates (Active/Suspended), and mandi price modifications are recorded in audit logs with timestamped actor IDs for regulatory accountability.",
         "Verified: Audit Migration & Log Storage", SKY)
    ]

    for idx, (atitle, adesc, atest, acolor) in enumerate(admin_cols):
        x = 0.8 + idx * 3.95
        add_card(s13, x, 1.9, 3.8, 3.8, bg_color=CARD_BG, border_color=CARD_BORDER)

        add_card(s13, x + 0.2, 2.1, 3.4, 0.5, bg_color=PILL_BG, border_color=acolor)
        tb_t = s13.shapes.add_textbox(Inches(x + 0.25), Inches(2.15), Inches(3.3), Inches(0.4))
        pt = tb_t.text_frame.paragraphs[0]
        pt.text = atitle.upper()
        pt.font.size = Pt(11)
        pt.font.bold = True
        pt.font.color.rgb = acolor

        tb_d = s13.shapes.add_textbox(Inches(x + 0.2), Inches(2.8), Inches(3.4), Inches(2.7))
        tf_d = tb_d.text_frame
        tf_d.word_wrap = True

        pd = tf_d.paragraphs[0]
        pd.text = adesc
        pd.font.size = Pt(10.5)
        pd.font.color.rgb = WHITE

        ptst = tf_d.add_paragraph()
        ptst.text = f"✓ {atest}"
        ptst.font.size = Pt(9.5)
        ptst.font.bold = True
        ptst.font.color.rgb = GOLD_LIGHT
        ptst.space_before = Pt(12)

    # Security Highlights Strip
    add_card(s13, 0.8, 5.9, 11.7, 1.25, bg_color=CARD_BG_ALT, border_color=CARD_BORDER)
    tb_sh = s13.shapes.add_textbox(Inches(1.0), Inches(6.0), Inches(11.3), Inches(1.05))
    tf_sh = tb_sh.text_frame
    tf_sh.word_wrap = True

    psh = tf_sh.paragraphs[0]
    psh.text = "TESTED SECURITY VERIFICATION METRICS (api_security.test.js & roleAccessAudit.test.js):"
    psh.font.size = Pt(10.5)
    psh.font.bold = True
    psh.font.color.rgb = GOLD

    psh_d = tf_sh.add_paragraph()
    psh_d.text = "• GET /api/admin/users (Farmer Token) ➔ 403 Forbidden  •  GET /api/admin/overview (Farmer Token) ➔ 403 Forbidden\n" \
                 "• POST /api/market/sync (Farmer Token) ➔ 403 Forbidden  •  Transporter B accessing Transporter A trip ➔ 403 Forbidden\n" \
                 "• Zero passwords or JWT secrets exposed in API responses. Session-scoped token cleanup on browser close verified."
    psh_d.font.size = Pt(9.5)
    psh_d.font.color.rgb = LIGHT_SLATE
    psh_d.space_before = Pt(3)

    slides_notes.append(
        "SPEAKER: MIHIR JADAV (Team Leader)\n"
        "\"Security and governance are built into the foundation of HarvestMitra AI. "
        "Our role-based security matrix strictly enforces access permissions: farmers attempting to call admin endpoints receive immediate 403 Forbidden responses. "
        "Passwords use bcrypt with 10 salt rounds, sessions are isolated without token leaks, and APMC administrators have dedicated controls to moderate benchmark rates and review system audit logs. "
        "Let us now walk through our live demonstration sequence.\""
    )

    # =========================================================================
    # SLIDE 14: Live Product Demonstration Choreography (Mihir Jadav)
    # =========================================================================
    s14 = create_slide()
    add_header(s14, "Stage Rehearsal • Live Software Demonstration",
               "Live Product Demonstration: The End-to-End Trade Journey",
               "A synchronized 6-step walkthrough demonstrating real software execution across all 5 roles.")

    demo_steps = [
        ("01", "GUEST LANDING", "Route: /",
         "Demonstrate zero-barrier rural access by clicking 'Explore Without Login'. Shows immediate mandi prices.", EMERALD),
        ("02", "FARMER DASHBOARD", "Route: /dashboard",
         "Switch multi-crop profiles (Cotton, Tomato, Wheat). Open Recharts acreage chart and trigger 1-click A4 Printable Farm Report.", GOLD),
        ("03", "HARVEST SIMULATOR", "Route: /harvest",
         "Input 1,500 kg Tomato. Compare Option 1 Local vs Option 3 Regional Vashi APMC with +₹14,000 net take-home advantage.", SKY),
        ("04", "SHARED TRANSPORT", "Route: /transport",
         "Book pooled cargo capacity. View NH-160 highway corridor route and open Digital QR Gate Pass verification modal.", PURPLE),
        ("05", "MITRA VOICE AI", "Route: /chat",
         "Click microphone and speak in Hindi: 'टमाटर कब बेचना चाहिए?' Mitra responds via spoken audio synthesis.", MINT),
        ("06", "MANDI & ADMIN", "Route: /admin",
         "Log in as Mandi/Admin. Review incoming procurement offer and demonstrate APMC benchmark price update.", WHITE)
    ]

    for idx, (snum, stitle, sroute, sdesc, scolor) in enumerate(demo_steps):
        x = 0.8 + idx * 1.95
        add_card(s14, x, 1.9, 1.85, 4.2, bg_color=CARD_BG, border_color=CARD_BORDER)

        add_card(s14, x + 0.1, 2.05, 1.65, 0.4, bg_color=PILL_BG, border_color=scolor)
        tb_n = s14.shapes.add_textbox(Inches(x + 0.12), Inches(2.08), Inches(1.6), Inches(0.35))
        pn = tb_n.text_frame.paragraphs[0]
        pn.text = f"STEP {snum}"
        pn.font.size = Pt(9.5)
        pn.font.bold = True
        pn.font.color.rgb = scolor

        tb_d = s14.shapes.add_textbox(Inches(x + 0.1), Inches(2.55), Inches(1.65), Inches(3.4))
        tf_d = tb_d.text_frame
        tf_d.word_wrap = True

        pt = tf_d.paragraphs[0]
        pt.text = stitle
        pt.font.size = Pt(10)
        pt.font.bold = True
        pt.font.color.rgb = WHITE

        pr = tf_d.add_paragraph()
        pr.text = sroute
        pr.font.size = Pt(8.5)
        pr.font.bold = True
        pr.font.color.rgb = GOLD_LIGHT
        pr.space_before = Pt(2)

        pd = tf_d.add_paragraph()
        pd.text = sdesc
        pd.font.size = Pt(8.5)
        pd.font.color.rgb = LIGHT_SLATE
        pd.space_before = Pt(6)

    # Demo credentials strip
    add_card(s14, 0.8, 6.3, 11.7, 0.8, bg_color=CARD_BG_ALT, border_color=CARD_BORDER)
    tb_dc = s14.shapes.add_textbox(Inches(1.0), Inches(6.35), Inches(11.3), Inches(0.7))
    tf_dc = tb_dc.text_frame
    tf_dc.word_wrap = True

    pdc = tf_dc.paragraphs[0]
    pdc.text = "VERIFIED LIVE DEMO CREDENTIALS (aidemo-c4b9.onrender.com):"
    pdc.font.size = Pt(10)
    pdc.font.bold = True
    pdc.font.color.rgb = GOLD

    pdc_d = tf_dc.add_paragraph()
    pdc_d.text = "• Farmer: demo@harvestmitra.local (Demo@12345)  •  Transporter: transporter@harvestmitra.local (Transporter@12345)\n" \
                 "• Mandi Official: mandi@harvestmitra.local (Demo@12345)  •  Admin: admin@harvestmitra.local (Admin@12345)"
    pdc_d.font.size = Pt(9.5)
    pdc_d.font.color.rgb = WHITE
    pdc_d.space_before = Pt(2)

    slides_notes.append(
        "SPEAKER: MIHIR JADAV (Team Leader)\n"
        "\"To prove this is live software and not a slide presentation, we have prepared an end-to-end 6-step demo sequence. "
        "First, Sayali shows Universal Guest Mode on the landing page. Second, she opens the Farmer Dashboard and prints an A4 report. "
        "Third, Prashant demonstrates the 3-scenario simulator, proving a ₹14,000 net profit advantage at Vashi APMC. "
        "Fourth, Varun books shared transport and displays the digital QR gate pass. "
        "Fifth, he demonstrates live multilingual voice query with Mitra AI. "
        "And sixth, I demonstrate the Mandi and Admin consoles. All accounts are pre-provisioned and active on our deployed Render server.\""
    )

    # =========================================================================
    # SLIDE 15: Feasibility, Impact & Strategic Roadmap (Mihir Jadav)
    # =========================================================================
    s15 = create_slide()
    add_header(s15, "Production Readiness • Strategic Roadmap",
               "Engineering Maturity & Future Horizon",
               "A production-ready foundation with a clear technical roadmap for nationwide deployment.")

    # Left Column: Verified Project Metrics
    add_card(s15, 0.8, 1.9, 5.6, 5.0, bg_color=CARD_BG, border_color=CARD_BORDER)
    tb_m = s15.shapes.add_textbox(Inches(1.1), Inches(2.1), Inches(5.0), Inches(4.6))
    tf_m = tb_m.text_frame
    tf_m.word_wrap = True

    pm_t = tf_m.paragraphs[0]
    pm_t.text = "VERIFIED ENGINEERING METRICS"
    pm_t.font.size = Pt(12)
    pm_t.font.bold = True
    pm_t.font.color.rgb = GOLD

    metrics = [
        ("40 Merged Pull Requests", "0 Open Issues across all team feature sprints"),
        ("33/33 Automated Test Suites", "20 Backend + 13 Frontend test suites passing at 100%"),
        ("106 APMC Mandis Monitored", "Continuous moving average price trend detection across Maharashtra"),
        ("Sub-15ms Offline Voice AI", "Zero-downtime deterministic fallback engine without cloud dependency"),
        ("100% Multi-User Isolation", "Strict data privacy between farmers, transporters, and mandi officials")
    ]
    for mtitle, msub in metrics:
        p = tf_m.add_paragraph()
        p.text = f"✔  {mtitle}"
        p.font.size = Pt(11)
        p.font.bold = True
        p.font.color.rgb = MINT
        p.space_before = Pt(8)

        ps = tf_m.add_paragraph()
        ps.text = msub
        ps.font.size = Pt(9.5)
        ps.font.color.rgb = LIGHT_SLATE

    # Right Column: Strategic 4-Phase Roadmap
    add_card(s15, 6.7, 1.9, 5.8, 5.0, bg_color=CARD_BG, border_color=CARD_BORDER)
    tb_r = s15.shapes.add_textbox(Inches(7.0), Inches(2.1), Inches(5.2), Inches(4.6))
    tf_r = tb_r.text_frame
    tf_r.word_wrap = True

    pr_t = tf_r.paragraphs[0]
    pr_t.text = "STRATEGIC 4-PHASE EXPANSION ROADMAP"
    pr_t.font.size = Pt(12)
    pr_t.font.bold = True
    pr_t.font.color.rgb = SKY

    phases = [
        ("Phase 1: Agristack API Pilot (Q1 2027)",
         "Direct integration with National Digital Agriculture Mission API for live 7/12 land records and automated scheme eligibility pre-approvals.", EMERALD),
        ("Phase 2: IoT Cold-Chain Telemetry (Q2 2027)",
         "ESP32 temperature and humidity sensor integration in refrigerated trucks for continuous perishability monitoring during highway transit.", GOLD),
        ("Phase 3: Progressive Web App with SQLite (Q3 2027)",
         "Full offline-first PWA caching allowing complete price discovery and trade record logging in zero-connectivity tribal farming belts.", SKY),
        ("Phase 4: District Cooperative Credit Bank Financing (Q4 2027)",
         "Instant Kisan Credit Card (KCC) loan approvals and freight escrow financing in partnership with Maharashtra District Cooperative Banks.", PURPLE)
    ]
    for ptitle, pdesc, pcolor in phases:
        p = tf_r.add_paragraph()
        p.text = ptitle
        p.font.size = Pt(11)
        p.font.bold = True
        p.font.color.rgb = pcolor
        p.space_before = Pt(8)

        pd = tf_r.add_paragraph()
        pd.text = pdesc
        pd.font.size = Pt(9.5)
        pd.font.color.rgb = WHITE

    slides_notes.append(
        "SPEAKER: MIHIR JADAV (Team Leader)\n"
        "\"HarvestMitra AI is not a weekend prototype. We have merged 40 pull requests, achieved 100% success across 33 automated test suites, "
        "and connected 106 APMC mandis. "
        "Our strategic roadmap outlines realistic next steps: partnering with the National Agristack API for official land verification, "
        "deploying IoT temperature sensors for refrigerated transit, building an offline-first PWA for zero-connectivity zones, "
        "and integrating with District Cooperative Banks for instant harvest financing.\""
    )

    # =========================================================================
    # SLIDE 16: Memorable Closing & Stage Q&A Defense (Mihir Jadav)
    # =========================================================================
    s16 = create_slide()
    add_header(s16, "National Agri-Tech Hackathon 2026 • Closing Showcase",
               "HarvestMitra AI: Transforming Distress Selling into Factual Prosperity",
               "Built with pride for Bharat's 140 Million smallholder farmers.")

    # Center Hero Card
    add_card(s16, 1.8, 1.9, 9.7, 4.9, bg_color=CARD_BG, border_color=CARD_BORDER)
    tb_c = s16.shapes.add_textbox(Inches(2.2), Inches(2.1), Inches(8.9), Inches(4.5))
    tf_c = tb_c.text_frame
    tf_c.word_wrap = True

    pc = tf_c.paragraphs[0]
    pc.text = "THE HARVESTMITRA AI PROMISE"
    pc.font.size = Pt(13)
    pc.font.bold = True
    pc.font.color.rgb = GOLD

    pc_quote = tf_c.add_paragraph()
    pc_quote.text = "\"By unifying deterministic price arbitrage, shared highway logistics, and multilingual voice accessibility, " \
                    "HarvestMitra AI returns an estimated 15% to 30% additional net margin directly to the farmer's pocket—" \
                    "ensuring that those who feed our nation never have to sell in distress.\""
    pc_quote.font.size = Pt(14)
    pc_quote.font.color.rgb = WHITE
    pc_quote.space_before = Pt(10)

    # Team Grid
    pc_th = tf_c.add_paragraph()
    pc_th.text = "CORE ARCHITECTS & PRESENTERS:"
    pc_th.font.size = Pt(11)
    pc_th.font.bold = True
    pc_th.font.color.rgb = MINT
    pc_th.space_before = Pt(16)

    tmembers = [
        ("Mihir Jadav", "Team Leader, System Architecture, Backend APIs, Database, Mandi & Admin"),
        ("Sayali Kulkarni", "Frontend UI/UX Architecture, Farmer Accessibility & Universal Guest Mode"),
        ("Prashant Warule", "Core Harvest Decision Simulator, APMC Database & Shared Highway Logistics"),
        ("Varun Patil", "Mitra Multilingual Voice AI, 14-Day Price Forecast & Weather Telemetry")
    ]
    for tm, tr in tmembers:
        p = tf_c.add_paragraph()
        p.text = f"• {tm}  —  {tr}"
        p.font.size = Pt(10)
        p.font.color.rgb = LIGHT_SLATE
        p.space_before = Pt(3)

    # Repository & Live URL Strip
    pc_urls = tf_c.add_paragraph()
    pc_urls.text = "GitHub: github.com/230493131013mihir/aidemo  •  Live Deployment: aidemo-c4b9.onrender.com"
    pc_urls.font.size = Pt(10)
    pc_urls.font.bold = True
    pc_urls.font.color.rgb = GOLD_LIGHT
    pc_urls.space_before = Pt(14)

    pc_floor = tf_c.add_paragraph()
    pc_floor.text = "We thank the esteemed jury for their time. Respected judges, the floor is open for Q&A."
    pc_floor.font.size = Pt(12)
    pc_floor.font.bold = True
    pc_floor.font.color.rgb = MINT
    pc_floor.space_before = Pt(8)

    slides_notes.append(
        "SPEAKER: MIHIR JADAV (Team Leader)\n"
        "\"To conclude: HarvestMitra AI is not theoretical research. It is a tested, production-ready ecosystem designed to return factual profit to Bharat's 140 million farmers. "
        "On behalf of Sayali, Prashant, Varun, and myself, thank you for your time. Respected judges, we welcome your questions.\""
    )

    output_pptx = os.path.join(base_dir, "HarvestMitra_AI_Premium_Presentation.pptx")
    prs.save(output_pptx)
    print(f"Base presentation created successfully at: {output_pptx}")
    return output_pptx, slides_notes

if __name__ == "__main__":
    build_presentation()
