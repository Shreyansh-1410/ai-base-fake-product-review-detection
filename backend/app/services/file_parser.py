import io
import pandas as pd
from typing import List, Tuple, Dict, Any, Optional
from app.schemas.review import SingleReviewInput

REVIEW_TEXT_ALIASES = [
    "review", "review_text", "text", "body", "content", "comments", 
    "comment", "review_body", "customer_review", "feedback", "reviews"
]

RATING_ALIASES = [
    "rating", "stars", "star_rating", "score", "rate", "overall", "user_rating"
]

REVIEWER_ID_ALIASES = [
    "reviewer_id", "user_id", "author", "user", "customer_id", "profile_name", "reviewer_name"
]

TIMESTAMP_ALIASES = [
    "timestamp", "date", "review_date", "time", "created_at", "posted_at"
]

VERIFIED_ALIASES = [
    "verified_purchase", "verified", "is_verified", "verified_buyer", "purchase_verified"
]

def _match_column(columns: List[str], candidate_aliases: List[str]) -> Optional[str]:
    normalized_cols = {col.strip().lower().replace(" ", "_"): col for col in columns}
    for alias in candidate_aliases:
        if alias in normalized_cols:
            return normalized_cols[alias]
    # Substring search
    for norm_name, original_col in normalized_cols.items():
        for alias in candidate_aliases:
            if alias in norm_name:
                return original_col
    return None

def parse_uploaded_file(file_bytes: bytes, filename: str) -> Tuple[str, List[SingleReviewInput]]:
    """
    Parses CSV or Excel bytes and maps columns to SingleReviewInput.
    Returns (detected_product_name, list_of_SingleReviewInput).
    """
    filename_lower = filename.lower()
    
    if filename_lower.endswith(".csv"):
        # Try UTF-8 first, fallback to latin-1
        try:
            df = pd.read_csv(io.BytesIO(file_bytes), encoding="utf-8")
        except UnicodeDecodeError:
            df = pd.read_csv(io.BytesIO(file_bytes), encoding="latin-1")
    elif filename_lower.endswith((".xlsx", ".xls")):
        df = pd.read_excel(io.BytesIO(file_bytes))
    else:
        raise ValueError(f"Unsupported file format: {filename}. Please upload a .csv or .xlsx file.")
    
    if df.empty:
        raise ValueError("Uploaded file is empty.")
    
    columns = list(df.columns)
    
    # Identify key columns
    text_col = _match_column(columns, REVIEW_TEXT_ALIASES)
    if not text_col:
        # If no explicit name match, pick the first object/string column with average length > 15
        for col in columns:
            if df[col].dtype == object:
                sample_lens = df[col].dropna().astype(str).str.len()
                if not sample_lens.empty and sample_lens.mean() > 15:
                    text_col = col
                    break
    
    if not text_col:
        raise ValueError(f"Could not automatically identify a review text column. Found columns: {columns}")
        
    rating_col = _match_column(columns, RATING_ALIASES)
    reviewer_col = _match_column(columns, REVIEWER_ID_ALIASES)
    time_col = _match_column(columns, TIMESTAMP_ALIASES)
    verified_col = _match_column(columns, VERIFIED_ALIASES)
    
    # Try to extract product name from filename or product column if present
    product_col = _match_column(columns, ["product_name", "product", "item_name", "title"])
    detected_product_name = "Imported Product"
    if product_col and not df[product_col].dropna().empty:
        detected_product_name = str(df[product_col].dropna().iloc[0])
    else:
        base_name = filename.rsplit(".", 1)[0].replace("_", " ").replace("-", " ").title()
        if base_name:
            detected_product_name = base_name

    parsed_reviews: List[SingleReviewInput] = []
    
    for idx, row in df.iterrows():
        raw_text = row[text_col]
        if pd.isna(raw_text) or not str(raw_text).strip():
            continue
        text_str = str(raw_text).strip()
        if len(text_str) < 3:
            continue
            
        rating_val = None
        if rating_col and not pd.isna(row[rating_col]):
            try:
                r = float(row[rating_col])
                if 1.0 <= r <= 5.0:
                    rating_val = r
                elif 1.0 <= r <= 10.0:
                    rating_val = round(r / 2.0, 1)  # normalize 10-star scale to 5-star
            except (ValueError, TypeError):
                pass
                
        reviewer_val = None
        if reviewer_col and not pd.isna(row[reviewer_col]):
            reviewer_val = str(row[reviewer_col]).strip()
            
        timestamp_val = None
        if time_col and not pd.isna(row[time_col]):
            timestamp_val = str(row[time_col]).strip()
            
        verified_val = None
        if verified_col and not pd.isna(row[verified_col]):
            v_str = str(row[verified_col]).strip().lower()
            if v_str in ["true", "1", "yes", "y", "verified"]:
                verified_val = True
            elif v_str in ["false", "0", "no", "n", "unverified"]:
                verified_val = False

        parsed_reviews.append(
            SingleReviewInput(
                review_id=f"rev_{idx+1}",
                review_text=text_str,
                rating=rating_val,
                reviewer_id=reviewer_val,
                timestamp=timestamp_val,
                verified_purchase=verified_val
            )
        )
        
    if not parsed_reviews:
        raise ValueError("No valid customer reviews could be extracted from the file.")
        
    return detected_product_name, parsed_reviews
