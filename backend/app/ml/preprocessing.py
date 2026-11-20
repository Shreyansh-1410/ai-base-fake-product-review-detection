import re
import string
import numpy as np
import pandas as pd
from typing import List, Dict, Any, Tuple
import nltk
from nltk.corpus import stopwords
from nltk.tokenize import word_tokenize, sent_tokenize

# Ensure stopwords are available
try:
    STOP_WORDS = set(stopwords.words("english"))
except LookupError:
    nltk.download("stopwords", quiet=True)
    STOP_WORDS = set(stopwords.words("english"))

PUFFERY_WORDS = {
    "revolutionary", "miracle", "life-changing", "magic", "best ever",
    "perfection", "must buy", "run don't walk", "flawless",
    "unbelievable", "mind-blowing", "100%", "buy now",
    "masterpiece", "life changing", "godsend", "obsessed",
    "holy grail", "run dont walk", "hands down the best", "greatest of all time"
}

def clean_text_for_nlp(text: str) -> str:
    """
    Cleans raw review text by removing URLs, excessive whitespace, 
    and non-standard symbols while preserving punctuation context for stylometrics.
    """
    if not isinstance(text, str):
        return ""
    # Strip URLs if any
    text = re.sub(r"https?://\S+|www\.\S+", "", text)
    # Strip HTML tags
    text = re.sub(r"<.*?>", "", text)
    # Normalize multiple punctuation (e.g. !!!!! -> !)
    text = re.sub(r"([!?.]){2,}", r"\1 \1", text)
    # Normalize whitespace
    text = re.sub(r"\s+", " ", text).strip()
    return text

def extract_linguistic_features(texts: List[str]) -> pd.DataFrame:
    """
    Extracts deep stylometric and behavioral linguistic features:
    - Text length & word counts
    - Lexical diversity (Type-Token Ratio)
    - Punctuation intensities (exclamation, capitalization)
    - Promotional puffery score
    - First-person pronoun density
    """
    features = []
    
    for raw in texts:
        t = clean_text_for_nlp(raw)
        char_len = len(t)
        words = re.findall(r"\b[A-Za-z0-9']+\b", t)
        word_count = max(len(words), 1)
        sentences = [s.strip() for s in re.split(r"[.!?]+", t) if s.strip()]
        sentence_count = max(len(sentences), 1)
        
        # Uppercase ratio
        upper_chars = sum(1 for c in t if c.isupper())
        upper_ratio = upper_chars / max(char_len, 1)
        
        # Punctuation counts
        exclamation_count = t.count("!")
        question_count = t.count("?")
        
        # Lexical diversity (TTR)
        unique_words = len(set(w.lower() for w in words))
        ttr = unique_words / word_count
        
        # Average sentence length in words
        avg_sentence_len = word_count / sentence_count
        
        # Promotional puffery detection
        t_lower = t.lower()
        puffery_hits = sum(1 for phrase in PUFFERY_WORDS if phrase in t_lower)
        
        # Pronoun frequency (deceptive reviews frequently overuse self-referential or exaggerated subjective claims)
        first_person_pronouns = sum(1 for w in words if w.lower() in {"i", "me", "my", "mine", "myself", "we", "our"})
        first_person_ratio = first_person_pronouns / word_count
        
        # Digits/Numbers (genuine reviews often specify numbers, hours, days, dimensions)
        numeric_count = sum(1 for w in words if any(char.isdigit() for char in w))
        numeric_ratio = numeric_count / word_count

        features.append({
            "char_len": char_len,
            "word_count": word_count,
            "avg_sentence_len": avg_sentence_len,
            "upper_ratio": upper_ratio,
            "exclamation_count": exclamation_count,
            "question_count": question_count,
            "lexical_diversity": ttr,
            "puffery_count": puffery_hits,
            "first_person_ratio": first_person_ratio,
            "numeric_ratio": numeric_ratio
        })
        
    return pd.DataFrame(features)
