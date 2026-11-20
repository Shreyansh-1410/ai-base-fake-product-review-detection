from fastapi import APIRouter, HTTPException, Query
from typing import List, Dict, Any, Optional
from app.schemas.review import BatchReviewInput, SingleReviewInput, ProductVerificationInput
from app.schemas.analysis import FullAnalysisResponse
from app.services.analysis_service import analysis_service

router = APIRouter(prefix="/demo", tags=["Demo Cases"])

DEMO_SCENARIOS: List[Dict[str, Any]] = [
    {
        "id": "case_1",
        "title": "Case 1: Genuine Positive Review on a Genuine Product",
        "scenario_type": "Scenario A (Genuine Product + Genuine Review)",
        "product_name": "Sony WH-1000XM5 Wireless Headphones",
        "description": "Customer provides an authentic, detailed positive review of an authentic product with verified serial number.",
        "expected_behavior": "Review classified as Likely Genuine. Review Trust Score high (85-98%). Reported Quality high. Authenticity: Verified Genuine.",
        "product_verification": {
            "has_verification_evidence": True,
            "serial_number": "SN-SONY-XM5-982143",
            "authorized_seller": True,
            "inspection_result": "verified_genuine",
            "evidence_notes": "Official distributor invoice and valid warranty registration verified on Sony support portal."
        },
        "reviews": [
            {
                "review_id": "rev_1",
                "review_text": "I have been using these headphones daily on my commute for three weeks. The active noise cancellation easily drowns out subway hum, and battery life consistently hits around 28 hours with ANC active. Earcups are very soft memory foam.",
                "rating": 5.0,
                "verified_purchase": True
            },
            {
                "review_id": "rev_2",
                "review_text": "Sound profile is well balanced out of the box with clear vocals and punchy bass that doesn't bleed into the mids. The companion app equalizer allows precise adjustments.",
                "rating": 4.5,
                "verified_purchase": True
            }
        ]
    },
    {
        "id": "case_2",
        "title": "Case 2: Genuine Negative Review on a Genuine Product",
        "scenario_type": "Scenario A (Genuine Product + Genuine Review)",
        "product_name": "Apple MacBook Air M3 (Genuine)",
        "description": "Authentic customer complains about specific real-world thermal throttling under continuous video render.",
        "expected_behavior": "Review classified as Likely Genuine. System does NOT flag negative review as fake just because it's critical.",
        "product_verification": {
            "has_verification_evidence": True,
            "serial_number": "APL-MB-M3-44109",
            "authorized_seller": True,
            "inspection_result": "verified_genuine",
            "evidence_notes": "Purchased directly from Apple Store Regent Street."
        },
        "reviews": [
            {
                "review_id": "rev_1",
                "review_text": "While the machine is light and silent for web browsing, the fanless design leads to noticeable thermal throttling during 4K video exports in DaVinci Resolve. The palm rest gets quite warm after 25 minutes of sustained workload.",
                "rating": 2.0,
                "verified_purchase": True
            }
        ]
    },
    {
        "id": "case_3",
        "title": "Case 3: Genuine Review on a Counterfeit Product",
        "scenario_type": "Scenario B (Fake Product + Genuine Review)",
        "product_name": "Knockoff 'AirPods Pro 2' Clone",
        "description": "Customer bought a knockoff unknowingly and posted an honest warning about shoddy materials and poor sound.",
        "expected_behavior": "Review classified as Likely Genuine (customer is telling the truth!). Product Authenticity marked Verified Counterfeit.",
        "product_verification": {
            "has_verification_evidence": True,
            "serial_number": "INVALID-SERIAL-000",
            "authorized_seller": False,
            "inspection_result": "verified_counterfeit",
            "evidence_notes": "Serial number rejected by Apple database; plastic mold seams rough; missing H2 chip."
        },
        "reviews": [
            {
                "review_id": "rev_1",
                "review_text": "Beware, this is clearly a fake counterfeit product! The packaging had blurry printing, no genuine serial number, and the plastic case creaks loudly when opening. Left earbud died after 3 days. Do not buy from this third-party seller!",
                "rating": 1.0,
                "verified_purchase": True
            }
        ]
    },
    {
        "id": "case_4",
        "title": "Case 4: Fake Positive Review on a Genuine Product",
        "scenario_type": "Scenario C (Genuine Product + Fake Review)",
        "product_name": "Samsung Galaxy S24 Ultra (Genuine)",
        "description": "An authentic smartphone receives syndicated spam/puffery reviews from an incentivized review broker.",
        "expected_behavior": "Review classified as Suspicious due to puffery superlatives and shouting syntax. Product remains Genuine.",
        "product_verification": {
            "has_verification_evidence": True,
            "serial_number": "SM-S928B-IMEI-9921",
            "authorized_seller": True,
            "inspection_result": "verified_genuine",
            "evidence_notes": "IMEI verified with Samsung carrier registration."
        },
        "reviews": [
            {
                "review_id": "rev_1",
                "review_text": "BEST PHONE EVER IN HUMAN HISTORY!! TOTALLY REVOLUTIONARY MAGIC QUALITY!! 1000% RECOMMEND TO EVERYONE ON EARTH BUY IT NOW RIGHT NOW!!",
                "rating": 5.0,
                "verified_purchase": False
            }
        ]
    },
    {
        "id": "case_5",
        "title": "Case 5: Fake Negative Review on a Genuine Product",
        "scenario_type": "Scenario C (Genuine Product + Fake Review)",
        "product_name": "Dell XPS 15 Laptop (Genuine)",
        "description": "Competitor smear attack attempting to damage brand reputation with unsubstantiated hate text.",
        "expected_behavior": "Classified as Suspicious (deceptive negative). Review Trust Score penalizes the smear attempt.",
        "product_verification": {
            "has_verification_evidence": True,
            "serial_number": "DELL-TAG-8821B",
            "authorized_seller": True,
            "inspection_result": "verified_genuine",
            "evidence_notes": "Enterprise Dell ProSupport asset verified."
        },
        "reviews": [
            {
                "review_id": "rev_1",
                "review_text": "HORRIBLE SCAM COMPANY WORST FRAUD CRIMINALS TOTAL GARBAGE DO NOT BUY FROM DELL GO BUY THE OTHER BRAND INSTEAD ZERO STARS SCAMMERS!!!",
                "rating": 1.0,
                "verified_purchase": False
            }
        ]
    },
    {
        "id": "case_6",
        "title": "Case 6: Fake Positive Review on a Counterfeit Product",
        "scenario_type": "Scenario D (Fake Product + Fake Review)",
        "product_name": "Unbranded Counterfeit Smartwatch",
        "description": "A fraudulent counterfeit smartwatch boosted by fabricated 5-star promotional astroturfing.",
        "expected_behavior": "Review classified as Suspicious. Misleading Positive Review detected. Product marked Verified Counterfeit.",
        "product_verification": {
            "has_verification_evidence": True,
            "serial_number": "NO-SERIAL-PRINTED",
            "authorized_seller": False,
            "inspection_result": "verified_counterfeit",
            "evidence_notes": "Customs lab seizure: unlicensed intellectual property replica."
        },
        "reviews": [
            {
                "review_id": "rev_1",
                "review_text": "Mind-blowing miraculous perfection! Greatest smartwatch on the planet, battery lasts 3 weeks and solves all your life problems! 100% must buy!",
                "rating": 5.0,
                "verified_purchase": False
            }
        ]
    },
    {
        "id": "case_7",
        "title": "Case 7: Genuine Positive Review on a Poor-Quality Product",
        "scenario_type": "Scenario A/B Boundary (Low Quality Product + Genuine Review)",
        "product_name": "Ultra-Budget $8 Plastic Earbuds",
        "description": "A low-income customer is genuinely satisfied with an ultra-cheap product because their expectations were modest.",
        "expected_behavior": "Classified as Likely Genuine. System recognizes authentic consumer satisfaction despite low-end materials.",
        "product_verification": {
            "has_verification_evidence": False,
            "inspection_result": "not_verified",
            "evidence_notes": ""
        },
        "reviews": [
            {
                "review_id": "rev_1",
                "review_text": "For eight dollars, I honestly can't complain. The plastic is lightweight and cheap, and the sound is tinny, but it plugs into my work radio and plays podcasts clearly enough. Good enough for my morning dog walk.",
                "rating": 4.0,
                "verified_purchase": True
            }
        ]
    },
    {
        "id": "case_8",
        "title": "Case 8: Repeated Promotional Reviews (Coordinated Bot Syndication)",
        "scenario_type": "Campaign / Duplicate Astroturfing",
        "product_name": "Apex Wireless Gaming Earbuds",
        "description": "Near-duplicate reviews posted across different reviewer accounts with identical marketing phrases.",
        "expected_behavior": "Near-duplicate detection flags review pair with >85% lexical overlap. Tagged as Coordinated Syndication.",
        "product_verification": {
            "has_verification_evidence": False,
            "inspection_result": "not_verified",
            "evidence_notes": ""
        },
        "reviews": [
            {
                "review_id": "rev_1",
                "review_text": "Incredible sound quality and fantastic battery life! Best earbuds ever, highly recommended to all my friends!",
                "rating": 5.0,
                "verified_purchase": False
            },
            {
                "review_id": "rev_2",
                "review_text": "Incredible sound quality and fantastic battery life! Best earbuds ever, highly recommended to all my family!",
                "rating": 5.0,
                "verified_purchase": False
            },
            {
                "review_id": "rev_3",
                "review_text": "Incredible sound quality and fantastic battery backup! Best earbuds ever, highly recommended to everyone!",
                "rating": 5.0,
                "verified_purchase": False
            }
        ]
    },
    {
        "id": "case_9",
        "title": "Case 9: Contradictory Product Claims (Primary Innovation Focus)",
        "scenario_type": "Feature Contradiction & Misleading Positives",
        "product_name": "ProSound ANC Earbuds",
        "description": "Promotional positive reviews claim 12 hours battery life and crystal sound, while real customers report 30 minutes runtime and complete failure.",
        "expected_behavior": "Identifies direct contradiction on Battery aspect (12 hours vs 30 minutes). Isolates suspicious positive reviews.",
        "product_verification": {
            "has_verification_evidence": False,
            "inspection_result": "not_verified",
            "evidence_notes": ""
        },
        "reviews": [
            {
                "review_id": "rev_1",
                "review_text": "Excellent battery life! The battery lasts 12 hours on a single charge. Best earbuds ever!",
                "rating": 5.0,
                "verified_purchase": False
            },
            {
                "review_id": "rev_2",
                "review_text": "Battery drains within 30 minutes. Completely unusable during my workout.",
                "rating": 1.0,
                "verified_purchase": True
            },
            {
                "review_id": "rev_3",
                "review_text": "Fantastic sound quality and amazing battery backup! Flawless purchase!",
                "rating": 5.0,
                "verified_purchase": False
            },
            {
                "review_id": "rev_4",
                "review_text": "The earbuds stopped working after two days. Left earpiece produces no sound at all.",
                "rating": 1.0,
                "verified_purchase": True
            },
            {
                "review_id": "rev_5",
                "review_text": "Best purchase! Highly recommended to all buyers!",
                "rating": 5.0,
                "verified_purchase": False
            }
        ]
    },
    {
        "id": "case_10",
        "title": "Case 10: Rating and Sentiment Mismatch",
        "scenario_type": "Discrepancy Indicator",
        "product_name": "Acoustic Pro Bluetooth Speaker",
        "description": "5-star rating entered with heavily negative text, and 1-star rating entered with high praise.",
        "expected_behavior": "Detects rating mismatch without jumping to conclusions. Flags as an indicator for further investigation.",
        "product_verification": {
            "has_verification_evidence": False,
            "inspection_result": "not_verified",
            "evidence_notes": ""
        },
        "reviews": [
            {
                "review_id": "rev_1",
                "review_text": "Very poor quality. Completely disappointed with the tinny sound and loose charging port. Total waste of money.",
                "rating": 5.0,
                "verified_purchase": True
            },
            {
                "review_id": "rev_2",
                "review_text": "Absolutely love this speaker! Clear loud sound, connects instantly to iPhone and lasts all day at the beach.",
                "rating": 1.0,
                "verified_purchase": True
            }
        ]
    }
]

@router.get("/cases")
async def get_demo_cases():
    """Returns the list of 10 demonstration scenarios."""
    return {"cases": DEMO_SCENARIOS}

@router.post("/run/{case_id}", response_model=FullAnalysisResponse)
async def run_demo_case(case_id: str, model_name: Optional[str] = Query(default="Logistic Regression")):
    """Executes a specific demonstration scenario directly through the full pipeline."""
    scenario = next((c for c in DEMO_SCENARIOS if c["id"] == case_id), None)
    if not scenario:
        raise HTTPException(status_code=404, detail=f"Demo case '{case_id}' not found.")

    reviews_list = [SingleReviewInput(**r) for r in scenario["reviews"]]
    verification = ProductVerificationInput(**scenario["product_verification"])

    batch_input = BatchReviewInput(
        product_name=scenario["product_name"],
        reviews=reviews_list,
        product_verification=verification
    )

    result = analysis_service.run_full_analysis(batch_input, model_name=model_name)
    return result
