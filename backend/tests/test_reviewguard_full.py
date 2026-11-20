from app.extractors.manager import extractor_manager
from app.schemas.review import BatchReviewInput, SingleReviewInput
from app.services.analysis_service import analysis_service
from app.sqlite_db import save_analysis_record, get_analysis_record, list_recent_analyses, delete_analysis_record
from app.nlp.trust_engine import trust_engine

def test_platform_identification():
    amazon_res = extractor_manager.identify_platform("https://www.amazon.in/dp/B0BDHW4847")
    assert amazon_res["platform"] == "Amazon India"
    assert amazon_res["platform_code"] == "amazon"
    assert amazon_res["supported"] is True

    flipkart_res = extractor_manager.identify_platform("https://www.flipkart.com/boat-rockerz-450/p/itm5a8c90382d56e")
    assert flipkart_res["platform"] == "Flipkart"
    assert flipkart_res["platform_code"] == "flipkart"
    assert flipkart_res["supported"] is True

    generic_res = extractor_manager.identify_platform("https://www.example.com/product/123")
    assert generic_res["supported"] is False

def test_sample_products_available():
    samples = extractor_manager.get_sample_products()
    assert len(samples) >= 4
    platforms = [s["platform_code"] for s in samples]
    assert "amazon" in platforms
    assert "flipkart" in platforms
    for s in samples:
        assert len(s["reviews"]) > 0

def test_full_analysis_pipeline_and_classification():
    sample = extractor_manager.get_sample_products()[0] # boAt Rockerz
    reviews = [
        SingleReviewInput(review_id=f"r_{i}", review_text=r["review_text"], rating=r["rating"])
        for i, r in enumerate(sample["reviews"])
    ]
    batch = BatchReviewInput(
        product_name=sample["title"],
        product_url=sample["url"],
        platform=sample["platform"],
        brand=sample["brand"],
        image_url=sample["image_url"],
        product_rating=sample["product_rating"],
        reviews=reviews
    )

    result = analysis_service.run_full_analysis(batch, model_name="Logistic Regression")

    # Verify Output Structure
    assert result.analysis_id.startswith("ANL-")
    assert result.product_name == sample["title"]
    assert result.platform == sample["platform"]
    assert len(result.reviews) == len(sample["reviews"])

    # Verify Classifications are strictly GENUINE, FAKE, or SUSPICIOUS
    valid_labels = {"GENUINE", "FAKE", "SUSPICIOUS"}
    for rev in result.reviews:
        assert rev.classification in valid_labels
        assert rev.confidence_score >= 0.0
        assert len(rev.reason) > 5

    # Verify Summary
    assert result.summary.total_reviews == len(sample["reviews"])
    assert result.summary.genuine_count + result.summary.fake_count + result.summary.suspicious_count == len(sample["reviews"])
    assert result.summary.review_trust_score is not None
    assert 0.0 <= result.summary.review_trust_score <= 100.0
    assert result.summary.review_trust_category in [
        "High Review Trust", "Moderate Review Trust", "Low Review Trust", "Very Low Review Trust"
    ]

def test_trust_score_thresholds():
    # 1. 100% Genuine reviews -> High Review Trust
    reviews_genuine = [
        {"classification": "GENUINE", "rating": 5.0, "deception_probability": 0.05, "review_text": f"Organic test review {i}"}
        for i in range(10)
    ]
    score, cat, expl = trust_engine.calculate_review_trust_score(reviews_genuine, duplicates_count=0, contradictions_count=0)
    assert score >= 80.0
    assert cat == "High Review Trust"

    # 2. 100% Fake reviews -> Very Low Review Trust
    reviews_fake = [
        {"classification": "FAKE", "rating": 5.0, "deception_probability": 0.95, "review_text": f"Spam bot review {i}"}
        for i in range(10)
    ]
    score_f, cat_f, _ = trust_engine.calculate_review_trust_score(reviews_fake, duplicates_count=3, contradictions_count=0)
    assert score_f <= 39.0
    assert cat_f == "Very Low Review Trust"

    # 3. Insufficient data (< 2 reviews)
    score_insuf, cat_insuf, _ = trust_engine.calculate_review_trust_score([reviews_genuine[0]], duplicates_count=0, contradictions_count=0)
    assert score_insuf is None
    assert cat_insuf == "Insufficient Review Data"

def test_sqlite_persistence():
    test_id = "ANL-TEST9999"
    test_payload = {
        "analysis_id": test_id,
        "product_name": "Test Wireless Headphones",
        "product_url": "https://www.amazon.in/dp/B0TEST999",
        "platform": "Amazon India",
        "brand": "TestBrand",
        "image_url": "https://example.com/test.jpg",
        "product_rating": 4.5,
        "model_name": "Logistic Regression",
        "summary": {
            "total_reviews": 10,
            "genuine_count": 8,
            "fake_count": 1,
            "suspicious_count": 1,
            "review_trust_score": 85.0,
            "review_trust_category": "High Review Trust"
        },
        "reviews": [
            {
                "review_id": "r1",
                "review_text": "Authentic audio device",
                "rating": 5.0,
                "sentiment": "Positive",
                "sentiment_score": 0.8,
                "classification": "GENUINE",
                "confidence_score": 95.0,
                "reason": "Clear experiential phrasing"
            }
        ]
    }

    # Save
    save_analysis_record(test_payload)

    # Retrieve
    retrieved = get_analysis_record(test_id)
    assert retrieved is not None
    assert retrieved["analysis_id"] == test_id
    assert retrieved["product_name"] == "Test Wireless Headphones"
    assert retrieved["summary"]["review_trust_score"] == 85.0

    # List history
    history = list_recent_analyses(limit=10)
    ids = [h["analysis_id"] for h in history]
    assert test_id in ids

    # Delete
    deleted = delete_analysis_record(test_id)
    assert deleted is True
    assert get_analysis_record(test_id) is None

if __name__ == "__main__":
    print("Running ReviewGuard Test Suite...")
    test_platform_identification()
    print("[PASS] Test 1: Platform Identification (Amazon & Flipkart)")
    test_sample_products_available()
    print("[PASS] Test 2: Verified Sample Products Available")
    test_full_analysis_pipeline_and_classification()
    print("[PASS] Test 3: AI Review Classification (GENUINE/FAKE/SUSPICIOUS)")
    test_trust_score_thresholds()
    print("[PASS] Test 4: Trust Score Engine & Categories")
    test_sqlite_persistence()
    print("[PASS] Test 5: SQLite Database Persistence & History")
    print("\n=======================================================")
    print("[*] ALL REVIEWGUARD TESTS PASSED 100% SUCCESSFULLY!")
    print("=======================================================\n")
