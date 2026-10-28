"""
Suraksha Setu — ML Preprocessing & Feature Extraction
Handles multilingual text normalization (English, Devanagari Hindi, Romanized Hinglish)
combining word TF-IDF, character n-gram TF-IDF, and structured indicators.
"""

import re
import unicodedata
from sklearn.compose import ColumnTransformer
from sklearn.feature_extraction.text import TfidfVectorizer


def normalize_multilingual_text(text: str) -> str:
    """
    Normalizes multilingual complaint text:
    - Normalizes Unicode (NFC)
    - Lowercases text
    - Preserves Devanagari Unicode characters (\u0900-\u097F)
    - Strips non-informative punctuation while retaining word boundaries
    """
    if not isinstance(text, str):
        return ""

    text = unicodedata.normalize("NFC", text)
    text = text.lower()
    text = re.sub(r"[^\w\s\u0900-\u097F]", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


INDICATOR_COLUMNS = [
    "immediate_danger",
    "physical_force",
    "ongoing_threats",
    "stalking",
    "target_minor",
    "urgent_support_requested",
]


def build_preprocessor() -> ColumnTransformer:
    """
    Builds a robust ColumnTransformer:
    1. Word-level TF-IDF (n-grams 1-2) for core vocabulary cues
    2. Character n-gram TF-IDF (char_wb n-grams 3-5) for Romanized Hinglish, misspellings, and Devanagari affixes
    3. Direct numeric pass-through of structured binary safety indicators
    """
    word_tfidf = TfidfVectorizer(
        preprocessor=normalize_multilingual_text,
        ngram_range=(1, 2),
        max_features=500,
        sublinear_tf=True,
    )

    char_tfidf = TfidfVectorizer(
        preprocessor=normalize_multilingual_text,
        analyzer="char_wb",
        ngram_range=(3, 5),
        max_features=600,
        sublinear_tf=True,
    )

    return ColumnTransformer(
        transformers=[
            ("word_features", word_tfidf, "narrative"),
            ("char_features", char_tfidf, "narrative"),
            ("indicator_features", "passthrough", INDICATOR_COLUMNS),
        ],
        remainder="drop",
    )
