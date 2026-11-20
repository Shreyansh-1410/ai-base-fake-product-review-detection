import sqlite3
import json
import logging
from pathlib import Path
from datetime import datetime
from typing import List, Dict, Any, Optional

logger = logging.getLogger("reviewguard.sqlite_db")

DB_DIR = Path(__file__).resolve().parent.parent / "data"
DB_DIR.mkdir(parents=True, exist_ok=True)
DB_PATH = DB_DIR / "reviewguard.db"

def get_connection():
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """Initializes the SQLite schema for persistent analysis reports."""
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS analysis_history (
                analysis_id TEXT PRIMARY KEY,
                product_name TEXT NOT NULL,
                product_url TEXT,
                platform TEXT DEFAULT 'E-Commerce Platform',
                brand TEXT,
                image_url TEXT,
                product_rating REAL,
                total_reviews INTEGER NOT NULL,
                genuine_count INTEGER DEFAULT 0,
                fake_count INTEGER DEFAULT 0,
                suspicious_count INTEGER DEFAULT 0,
                genuine_percentage REAL DEFAULT 0.0,
                fake_percentage REAL DEFAULT 0.0,
                suspicious_percentage REAL DEFAULT 0.0,
                review_trust_score REAL,
                review_trust_category TEXT,
                model_name TEXT DEFAULT 'Logistic Regression',
                summary_json TEXT,
                full_data_json TEXT NOT NULL,
                created_at TEXT NOT NULL
            )
        """)
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_created_at ON analysis_history (created_at DESC)")
        conn.commit()
    logger.info("SQLite database initialized at: %s", DB_PATH)

def save_analysis_record(analysis_data: Dict[str, Any]) -> str:
    """Saves or updates a full analysis report record in SQLite."""
    analysis_id = analysis_data.get("analysis_id")
    summary = analysis_data.get("summary", {})
    product_name = analysis_data.get("product_name", "Unknown Product")
    product_url = analysis_data.get("product_url", "")
    platform = analysis_data.get("platform", "E-Commerce Platform")
    brand = analysis_data.get("brand", "")
    image_url = analysis_data.get("image_url", "")
    product_rating = analysis_data.get("product_rating")
    model_name = analysis_data.get("model_name", "Logistic Regression")
    
    total = summary.get("total_reviews", len(analysis_data.get("reviews", [])))
    genuine = summary.get("genuine_count", 0)
    fake = summary.get("fake_count", summary.get("suspicious_count", 0))
    suspicious = summary.get("suspicious_count", summary.get("uncertain_count", 0))
    
    gen_pct = round((genuine / total) * 100, 1) if total > 0 else 0.0
    fake_pct = round((fake / total) * 100, 1) if total > 0 else 0.0
    sus_pct = round((suspicious / total) * 100, 1) if total > 0 else 0.0
    
    trust_score = summary.get("review_trust_score")
    trust_cat = summary.get("review_trust_category", "Unspecified")
    
    created_at = analysis_data.get("timestamp") or datetime.now().isoformat()
    full_json = json.dumps(analysis_data)
    summary_json = json.dumps(summary)
    
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO analysis_history (
                analysis_id, product_name, product_url, platform, brand, image_url,
                product_rating, total_reviews, genuine_count, fake_count, suspicious_count,
                genuine_percentage, fake_percentage, suspicious_percentage,
                review_trust_score, review_trust_category, model_name,
                summary_json, full_data_json, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(analysis_id) DO UPDATE SET
                product_name=excluded.product_name,
                product_url=excluded.product_url,
                platform=excluded.platform,
                brand=excluded.brand,
                image_url=excluded.image_url,
                product_rating=excluded.product_rating,
                total_reviews=excluded.total_reviews,
                genuine_count=excluded.genuine_count,
                fake_count=excluded.fake_count,
                suspicious_count=excluded.suspicious_count,
                genuine_percentage=excluded.genuine_percentage,
                fake_percentage=excluded.fake_percentage,
                suspicious_percentage=excluded.suspicious_percentage,
                review_trust_score=excluded.review_trust_score,
                review_trust_category=excluded.review_trust_category,
                model_name=excluded.model_name,
                summary_json=excluded.summary_json,
                full_data_json=excluded.full_data_json,
                created_at=excluded.created_at
        """, (
            analysis_id, product_name, product_url, platform, brand, image_url,
            product_rating, total, genuine, fake, suspicious,
            gen_pct, fake_pct, sus_pct,
            trust_score, trust_cat, model_name,
            summary_json, full_json, created_at
        ))
        conn.commit()
    return analysis_id

def get_analysis_record(analysis_id: str) -> Optional[Dict[str, Any]]:
    """Retrieves full analysis payload by analysis ID from SQLite."""
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT full_data_json FROM analysis_history WHERE analysis_id = ?", (analysis_id,))
        row = cursor.fetchone()
        if row and row["full_data_json"]:
            return json.loads(row["full_data_json"])
    return None

def list_recent_analyses(limit: int = 30) -> List[Dict[str, Any]]:
    """Lists summary cards of recent analyses for the history page."""
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT 
                analysis_id, product_name, product_url, platform, brand, image_url,
                product_rating, total_reviews, genuine_count, fake_count, suspicious_count,
                genuine_percentage, fake_percentage, suspicious_percentage,
                review_trust_score, review_trust_category, model_name, created_at
            FROM analysis_history
            ORDER BY created_at DESC
            LIMIT ?
        """, (limit,))
        rows = cursor.fetchall()
        return [dict(row) for row in rows]

def delete_analysis_record(analysis_id: str) -> bool:
    """Deletes an analysis report by ID."""
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM analysis_history WHERE analysis_id = ?", (analysis_id,))
        conn.commit()
        return cursor.rowcount > 0

def clear_all_history() -> int:
    """Clears all records in analysis_history."""
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM analysis_history")
        conn.commit()
        return cursor.rowcount

# Initialize on import
init_db()
