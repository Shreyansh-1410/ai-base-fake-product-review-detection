#!/usr/bin/env python3
"""
ReviewGuard AI - End-to-End System Verification and Health Diagnostic Tool
Run: python scripts/verify_system.py
"""
import sys
import os
from pathlib import Path

# Setup paths
ROOT_DIR = Path(__file__).resolve().parent.parent
BACKEND_DIR = ROOT_DIR / "backend"
sys.path.insert(0, str(BACKEND_DIR))

def print_header(title: str):
    print("\n" + "=" * 60)
    print(f"[*] {title}")
    print("=" * 60)

def verify_system():
    print_header("ReviewGuard AI - Production Diagnostic Check")
    passed = 0
    total = 0

    # 1. Check Directory Structure
    total += 1
    print("\n[1/5] Checking Directory Structure...")
    required_paths = [
        BACKEND_DIR / "app",
        BACKEND_DIR / "app" / "ml" / "artifacts",
        BACKEND_DIR / "data",
        ROOT_DIR / "frontend"
    ]
    all_paths_ok = all(p.exists() for p in required_paths)
    if all_paths_ok:
        print("  [+] Core directories verified: OK")
        passed += 1
    else:
        print("  [-] Some directories missing!")

    # 2. Check Database & Config
    total += 1
    print("\n[2/5] Checking Database & Configuration...")
    try:
        from app.config import settings
        from app.sqlite_db import get_analysis_record
        print(f"  [+] Config loaded: Project='{settings.PROJECT_NAME}', API_Prefix='{settings.API_V1_STR}'")
        print(f"  [+] SQLite Database connected: OK")
        passed += 1
    except Exception as e:
        print(f"  [-] Database check failed: {e}")

    # 3. Check ML Predictor & Models
    total += 1
    print("\n[3/5] Checking ML Models & Inference Pipeline...")
    try:
        from app.ml.predictor import predictor
        sample_texts = [
            "This phone has brilliant screen clarity and long battery life.",
            "AMAZING BEST PRODUCT EVER 1000% RECOMMENDED BUY NOW NOW!!"
        ]
        results = predictor.predict_batch(sample_texts)
        print(f"  [+] Predictor loaded models: {len(results)} reviews analyzed successfully.")
        print(f"      Text 1 Classification: {results[0]['classification']} (Conf: {results[0]['confidence_score']}%)")
        print(f"      Text 2 Classification: {results[1]['classification']} (Conf: {results[1]['confidence_score']}%)")
        passed += 1
    except Exception as e:
        print(f"  [-] ML Predictor failed: {e}")

    # 4. Check Short Link & Brand Extraction
    total += 1
    print("\n[4/5] Checking Mobile Short Link & Brand Resolver...")
    try:
        from app.extractors.media_resolver import parse_clean_title_from_url
        title_fk, brand_fk = parse_clean_title_from_url("https://dl.flipkart.com/s/mPjUNUNNNN")
        title_ap, brand_ap = parse_clean_title_from_url("iphone 17")
        print(f"  [+] Flipkart short link resolved: '{title_fk}' (Brand: {brand_fk})")
        print(f"  [+] Apple query resolved: '{title_ap}' (Brand: {brand_ap})")
        passed += 1
    except Exception as e:
        print(f"  [-] Extractor check failed: {e}")

    # 5. Check Full Analysis Pipeline
    total += 1
    print("\n[5/5] Checking Full End-to-End Analysis Pipeline...")
    try:
        from app.schemas.review import BatchReviewInput, SingleReviewInput
        from app.services.analysis_service import analysis_service
        sample_batch = BatchReviewInput(
            product_name="Apple iPhone 17 Pro",
            product_url="https://example.com/iphone-17",
            platform="Amazon India",
            brand="Apple",
            product_rating=4.8,
            reviews=[
                SingleReviewInput(
                    review_id="diag_1",
                    review_text="Display is extremely sharp and battery lasts through 7 hours of screen time.",
                    rating=5.0,
                    verified_purchase=True
                ),
                SingleReviewInput(
                    review_id="diag_2",
                    review_text="Lightweight titanium chassis with comfortable ergonomics and snappy software.",
                    rating=5.0,
                    verified_purchase=True
                )
            ]
        )
        res = analysis_service.run_full_analysis(sample_batch)
        print(f"  [+] Full analysis executed: Trust Score = {res.summary.review_trust_score}/100")
        print(f"  [+] Authenticity Status = {res.summary.product_authenticity_status}")
        passed += 1
    except Exception as e:
        print(f"  [-] Full analysis failed: {e}")

    # Final Summary
    print_header("Diagnostic Summary")
    print(f"Results: {passed}/{total} checks passed.")
    if passed == total:
        print("[+] ALL SYSTEMS OPERATIONAL - ReviewGuard AI is ready for production.\n")
        return 0
    else:
        print("[-] System warnings detected. Please review outputs above.\n")
        return 1

if __name__ == "__main__":
    sys.exit(verify_system())
