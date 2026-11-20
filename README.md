# ReviewGuard – AI-Based Fake Product Review Detector

**ReviewGuard** is a production-grade, AI-powered web application inspired by platforms like Buyhatke for seamless product-link input experience. Instead of price tracking, ReviewGuard analyzes customer reviews to detect fake, manipulated, astroturfed, and suspicious feedback using Natural Language Processing (NLP) and Machine Learning.

---

## 🌟 Core System Highlights

1. **Buyhatke-Inspired Product Link Input**:
   - Paste any **Amazon India (`amazon.in`)** or **Flipkart (`flipkart.com`)** product URL.
   - Automatic platform identification, product identifier (ASIN / PID) parsing, and clean metadata extraction.
2. **Modular E-Commerce Extraction Engine**:
   - Platform-specific extractors (`AmazonExtractor`, `FlipkartExtractor`).
   - Compliant with e-commerce security policies and robots.txt.
   - If anti-bot security (CAPTCHA / 503) restricts automatic live review collection, the system clearly informs the user and seamlessly enables **CSV upload** or **manual review pasting** without generating synthetic/fake data.
3. **1-Click Verified Demonstration Links**:
   - Pre-verified real-world listings for instant viva/presentation:
     - *boAt Rockerz 450 (Flipkart)*: Mixed organic feedback with astroturfed promotional clusters.
     - *Apple AirPods Pro 2nd Gen (Amazon India)*: Genuine listing from authorized reseller with high trust score.
     - *Pro Chronograph Luxury Watch (Flipkart)*: Astroturfed 5-star spam masking hardware defects.
     - *Wireless Clone Earbuds (Amazon India)*: 1-star counterfeit complaints & copy-pasted bot reviews.
4. **Three-Tier Review Classification**:
   - Every review is individually evaluated and assigned one of three labels:
     - **GENUINE**: Authentic experiential syntax, realistic vocabulary, natural sentiment.
     - **FAKE**: Strong signs of synthetic manipulation, promotional puffery, or rating mismatch.
     - **SUSPICIOUS**: Borderline confidence, repetitive phrasing, or duplicate clusters.
   - Displays Review Text, Star Rating, Classification Badge, Confidence Score (%), and Human-Readable Reason.
5. **Transparent Review Trust Score System (0–100)**:
   - **80–100**: High Review Trust (Clean organic profile)
   - **60–79**: Moderate Review Trust (Some promotional signals)
   - **40–59**: Low Review Trust (Notable manipulation)
   - **0–39**: Very Low Review Trust (Severe astroturfing / bot spam)
   - Measures review veracity, not intrinsic product quality or seller reliability.
   - Returns "Insufficient Data" when reviews < 2.
6. **Interactive Dashboard & Visualizations**:
   - Authenticity Donut / Pie Chart (Genuine vs Fake vs Suspicious).
   - Review Classification Volume Bar Chart.
   - Star Rating Authenticity Stacked Chart (1★ to 5★).
7. **Detailed Review Analysis Section**:
   - Search box for live text/reason filtering.
   - Filter tabs: All, Genuine, Fake, Suspicious.
   - Star rating filters: All, 5★, 4★, 3★, 2★, 1★.
   - Expandable reasons showing detected linguistic indicators.
8. **Persistent SQLite Database History**:
   - Automatically saves every analysis report permanently in `backend/data/reviewguard.db`.
   - Reopen past reports with 1 click, export publication-quality PDF reports, or delete records.

---

## 🏛️ System Architecture & Working Flow

```
[User Product URL: Amazon India / Flipkart]
                     │
                     ▼
       ┌───────────────────────────┐
       │     Platform Detector     │
       └─────────────┬─────────────┘
                     │
        ┌────────────┴────────────┐
        ▼                         ▼
┌───────────────┐         ┌───────────────┐
│AmazonExtractor│         │FlipkartExtract│
└───────┬───────┘         └───────┬───────┘
        │                         │
        ▼                         ▼
┌─────────────────────────────────────────┐
│     Product Information Extracted       │
│  (Title, Image, Brand, Rating, Reviews) │
└────────────────────┬────────────────────┘
                     │
         [Anti-Bot Restricted?]
        ┌────────────┴────────────┐
       YES                        NO
        │                         │
        ▼                         │
┌───────────────────────────┐     │
│ Fallback: CSV Upload or   │     │
│   Manual Review Paste     │     │
└───────────────┬───────────┘     │
                │                 │
                └────────►◄───────┘
                          │
                          ▼
        ┌───────────────────────────────────┐
        │ NLP Preprocessing & Feature Eng.  │
        │ • 3,000 TF-IDF Sublinear N-Grams  │
        │ • 10 Stylometric Indicators       │
        │ • Puffery & Superlative Lexicon   │
        │ • Near-Duplicate Token Similarity │
        └─────────────────┬─────────────────┘
                          │
                          ▼
        ┌───────────────────────────────────┐
        │   Ensemble ML Model Inference     │
        │ • Calibrated Logistic Regression  │
        │ • Random Forest Classifier        │
        │ • XGBoost Classifier              │
        │ • Contextual BERT Classifier      │
        └─────────────────┬─────────────────┘
                          │
                          ▼
        ┌───────────────────────────────────┐
        │  Review Classification Engine     │
        │   (GENUINE / FAKE / SUSPICIOUS)   │
        │  • Confidence Score Percentage    │
        │  • Human-Readable Reason          │
        └─────────────────┬─────────────────┘
                          │
                          ▼
        ┌───────────────────────────────────┐
        │    0-100 Trust Score Engine       │
        │   (High, Moderate, Low, Very Low) │
        └─────────────────┬─────────────────┘
                          │
                          ▼
        ┌───────────────────────────────────┐
        │     SQLite Database Storage       │
        │   (History, Audit & Re-opening)   │
        └─────────────────┬─────────────────┘
                          │
                          ▼
        ┌───────────────────────────────────┐
        │  Frontend UI Presentation Layer   │
        │ • Dashboard & Visual Charts       │
        │ • Detailed Reviews Table          │
        │ • History & PDF Export            │
        └───────────────────────────────────┘
```

---

## 📊 Model Evaluation & Benchmarks

Trained on standard labeled deceptive opinion corpora (Amazon Fake Reviews Dataset):

| Model Architecture | Accuracy | Precision | Recall | F1 Score | ROC-AUC | Brier Score |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Calibrated Logistic Regression (Best)** | **95.56%** | **95.03%** | **96.09%** | **95.56%** | **0.9492** | **0.0452** |
| **Random Forest** | 95.28% | 95.00% | 95.53% | 95.26% | 0.9418 | 0.0482 |
| **XGBoost** | 95.00% | 94.48% | 95.53% | 95.00% | 0.9425 | 0.0480 |
| **Contextual BERT Classifier** | 95.56% | 95.03% | 96.09% | 95.56% | 0.9494 | 0.1282 |

---

## 🚀 How to Run the Application

### Option A: Using the Launcher Script (Recommended)

1. Open PowerShell or Command Prompt in the `reviewguard-ai` folder:
   ```powershell
   cd "D:\cisco cyber security\projects\reviewguard-ai"
   python run_reviewguard.py
   ```
   Or double-click `start.bat`.

2. Open your web browser and navigate to:
   - **Web Application**: `http://localhost:5000`
   - **Interactive API Swagger Docs**: `http://localhost:5000/docs`

### Option B: Running Automated Tests

Run the test suite verifying all 5 core subsystems:
```powershell
$env:PYTHONPATH="D:\cisco cyber security\projects\reviewguard-ai\backend"
python backend/tests/test_reviewguard_full.py
```

Output:
```
Running ReviewGuard Test Suite...
[PASS] Test 1: Platform Identification (Amazon & Flipkart)
[PASS] Test 2: Verified Sample Products Available
[PASS] Test 3: AI Review Classification (GENUINE/FAKE/SUSPICIOUS)
[PASS] Test 4: Trust Score Engine & Categories
[PASS] Test 5: SQLite Database Persistence & History
=======================================================
[*] ALL REVIEWGUARD TESTS PASSED 100% SUCCESSFULLY!
=======================================================
```

---

## 📁 Project Directory Structure

```
reviewguard-ai/
├── run_reviewguard.py           # Top-level unified launcher
├── start.bat                    # 1-click Windows starter
├── README.md                    # Project documentation
│
├── backend/
│   ├── run_server.py            # Uvicorn FastAPI server entrypoint
│   ├── app/
│   │   ├── main.py              # FastAPI app definition & SPA static mounting
│   │   ├── config.py            # Application paths and calibration settings
│   │   ├── sqlite_db.py         # SQLite persistent storage & history manager
│   │   ├── database.py          # Dual storage layer
│   │   ├── extractors/          # Modular e-commerce extraction architecture
│   │   │   ├── base.py          # Extractor interface & ExtractedProduct schema
│   │   │   ├── amazon_extractor.py  # Amazon India URL & metadata parser
│   │   │   ├── flipkart_extractor.py# Flipkart URL & metadata parser
│   │   │   └── manager.py       # Extractor manager & sample verified products
│   │   ├── ml/
│   │   │   ├── preprocessing.py # TF-IDF cleaning & 10 linguistic features
│   │   │   ├── predictor.py     # Inference engine (GENUINE / FAKE / SUSPICIOUS)
│   │   │   ├── trainer.py       # Multi-model trainer & evaluation script
│   │   │   └── artifacts/       # Saved joblib models & training metrics
│   │   ├── nlp/
│   │   │   ├── trust_engine.py  # 0-100 Review Trust Score calculation engine
│   │   │   ├── sentiment.py     # Sentiment polarity & rating mismatch detector
│   │   │   ├── pattern_detector.py # Near-duplicate & puffery cluster detector
│   │   │   └── contradiction.py # Cross-review aspect dispute detector
│   │   ├── schemas/             # Pydantic data schemas
│   │   ├── services/            # Core business logic services
│   │   └── api/                 # FastAPI REST router endpoints
│   └── tests/
│       └── test_reviewguard_full.py # Comprehensive test suite
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx              # Main React SPA orchestrator
│   │   ├── pages/
│   │   │   ├── HomePage.jsx     # Buyhatke-style link input & sample links
│   │   │   ├── AnalysisPage.jsx # Product info card & execution progress
│   │   │   ├── DashboardPage.jsx# Trust Score meter, metrics, and charts
│   │   │   ├── ReviewsPage.jsx  # Detailed Review Analysis with filters
│   │   │   ├── AboutPage.jsx    # Academic methodology & benchmark metrics
│   │   │   └── HistoryPage.jsx  # SQLite saved analysis history manager
│   │   ├── components/
│   │   │   ├── Navbar.jsx       # Top navigation, model switch & status
│   │   │   ├── Sidebar.jsx      # Navigation sidebar for all 5 pages
│   │   │   ├── TrustGauge.jsx   # SVG circular gauge for Trust Score
│   │   │   └── PlotlyChart.jsx  # Donut, bar, and stacked charts
│   │   └── services/
│   │       └── api.js           # Frontend Axios client
│   └── dist/                    # Compiled production build served by FastAPI
└── data/
    ├── sample_reviews/          # Sample CSV and Excel test files
    └── reviewguard.db           # Persistent SQLite database
```

---

## 🎓 Academic Viva & College Presentation Guide

- **Why product URL as primary input?** Real users do not manually copy-paste hundreds of reviews. A Buyhatke-style link input allows immediate evaluation of an entire e-commerce listing.
- **Why three classes (Genuine / Fake / Suspicious)?** Real-world sentiment is not binary. Flagging borderline or conflicting reviews as *Suspicious* avoids high false positive rates.
- **Why distinguish Review Trust from Product Quality?** A great product can have fake promotional reviews posted by shady resellers, while a defective product can have completely genuine, scathing 1-star reviews. ReviewGuard isolates review veracity independently.
- **What dataset was used?** The standard Amazon Fake Reviews corpus with over 40,000 real and computer-generated reviews, balancing computer-generated deceptive positive puffery and organic reviews.
