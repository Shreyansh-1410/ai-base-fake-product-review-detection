import pandas as pd
from app.config import settings

def create_sample_files():
    sample_dir = settings.DATA_DIR / "sample_reviews"
    sample_dir.mkdir(parents=True, exist_ok=True)

    # 1. Earbuds Contradiction Dataset (Case 9)
    df_earbuds = pd.DataFrame([
        {"product_name": "ProSound ANC Earbuds", "reviewer_id": "cust_101", "rating": 5.0, "review_text": "Excellent battery life! The battery lasts 12 hours on a single charge. Best earbuds ever!", "verified_purchase": False},
        {"product_name": "ProSound ANC Earbuds", "reviewer_id": "cust_102", "rating": 1.0, "review_text": "Battery drains within 30 minutes. Completely unusable during my workout.", "verified_purchase": True},
        {"product_name": "ProSound ANC Earbuds", "reviewer_id": "cust_103", "rating": 5.0, "review_text": "Fantastic sound quality and amazing battery backup! Flawless purchase!", "verified_purchase": False},
        {"product_name": "ProSound ANC Earbuds", "reviewer_id": "cust_104", "rating": 1.0, "review_text": "The earbuds stopped working after two days. Left earpiece produces no sound at all.", "verified_purchase": True},
        {"product_name": "ProSound ANC Earbuds", "reviewer_id": "cust_105", "rating": 5.0, "review_text": "Best purchase! Highly recommended to all buyers!", "verified_purchase": False}
    ])
    df_earbuds.to_csv(sample_dir / "sample_earbuds_contradiction.csv", index=False)
    df_earbuds.to_excel(sample_dir / "sample_earbuds_contradiction.xlsx", index=False)

    # 2. Genuine Laptop Reviews (Scenario A & B)
    df_laptop = pd.DataFrame([
        {"product": "UltraBook Pro 14", "user": "dev_alex", "stars": 5.0, "review": "I have been using this laptop for three weeks now. The aluminium finish feels premium and the battery easily lasts 7 hours while programming in VS Code.", "verified": True},
        {"product": "UltraBook Pro 14", "user": "student_emma", "stars": 4.5, "review": "Screen color accuracy is impressive for this price point. Clean display and the keyboard has comfortable travel for writing essays.", "verified": True},
        {"product": "UltraBook Pro 14", "user": "gamer_mike", "stars": 2.0, "review": "Thermals get uncomfortably hot during continuous gaming. Fans spin loud and the CPU throttles after 20 minutes.", "verified": True}
    ])
    df_laptop.to_csv(sample_dir / "sample_laptop_reviews.csv", index=False)
    df_laptop.to_excel(sample_dir / "sample_laptop_reviews.xlsx", index=False)

    print("Sample CSV and Excel demonstration files created in:", sample_dir)

if __name__ == "__main__":
    create_sample_files()
