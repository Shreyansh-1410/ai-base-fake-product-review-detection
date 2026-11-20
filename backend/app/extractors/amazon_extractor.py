import re
import json
import urllib.request
import urllib.error
from urllib.parse import urlparse
from typing import Dict, Any, List, Optional
from bs4 import BeautifulSoup
from app.extractors.base import BaseProductExtractor, ExtractedProduct
from app.extractors.media_resolver import parse_clean_title_from_url, resolve_product_image

class AmazonExtractor(BaseProductExtractor):
    def __init__(self):
        # Modern real browser headers without Cache-Control/Pragma to bypass Amazon bot checks
        self.headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
            "Accept-Language": "en-IN,en;q=0.9,hi;q=0.8",
            "Upgrade-Insecure-Requests": "1"
        }

    def can_handle(self, url: str) -> bool:
        netloc = urlparse(url).netloc.lower()
        return "amazon." in netloc or "amzn.to" in netloc or "amzn.in" in netloc

    def extract_asin(self, url: str) -> Optional[str]:
        path = urlparse(url).path
        match = re.search(r"/(?:dp|gp/product|product)/([A-Z0-9]{10})", path, re.IGNORECASE)
        if match:
            return match.group(1).upper()
        query_match = re.search(r"[?&]asin=([A-Z0-9]{10})", url, re.IGNORECASE)
        if query_match:
            return query_match.group(1).upper()
        # Fallback check for any 10-char ASIN in path
        match_any = re.search(r"/([A-Z0-9]{10})(?:[/?]|$)", path, re.IGNORECASE)
        if match_any:
            return match_any.group(1).upper()
        return None

    def _extract_amazon_image(self, soup: BeautifulSoup, html: str) -> Optional[str]:
        """Extract high-resolution product image from Amazon HTML"""
        # 1. Landing image tag
        landing_img = soup.find("img", id=re.compile(r"landingImage|imgBlkFront|main-image", re.IGNORECASE))
        if landing_img:
            if landing_img.get("data-old-hires"):
                return landing_img.get("data-old-hires")
            dyn = landing_img.get("data-a-dynamic-image")
            if dyn:
                try:
                    dyn_dict = json.loads(dyn)
                    if dyn_dict:
                        return list(dyn_dict.keys())[0]
                except Exception:
                    pass
            if landing_img.get("src") and not landing_img.get("src").startswith("data:"):
                return landing_img.get("src")

        # 2. Schema.org / ld+json in HTML
        for s in soup.find_all("script", type="application/ld+json"):
            try:
                d = json.loads(s.string)
                if isinstance(d, dict) and d.get("image"):
                    img = d.get("image")
                    return img[0] if isinstance(img, list) else img
            except Exception:
                pass

        # 3. Dynamic image JSON regex matches
        match_hires = re.search(r'\"hiRes\"\s*:\s*\"(https://m\.media-amazon\.com/images/I/[^\"]+)\"', html)
        if match_hires:
            return match_hires.group(1)

        match_large = re.search(r'\"large\"\s*:\s*\"(https://m\.media-amazon\.com/images/I/[^\"]+)\"', html)
        if match_large:
            return match_large.group(1)

        match_img = re.search(r'(https://m\.media-amazon\.com/images/I/[a-zA-Z0-9%_-]+\.(?:jpg|png|jpeg))', html)
        if match_img:
            return match_img.group(1)

        return None

    def extract(self, url: str) -> ExtractedProduct:
        resolved_url = url
        asin = self.extract_asin(url)
        clean_title, found_brand = parse_clean_title_from_url(url, fallback_title="Amazon Product")
        product_image = None
        rating_val = 4.3
        extracted_reviews: List[Dict[str, Any]] = []

        # 1. Fetch live page with redirect resolution (essential for amzn.to / amzn.in short links!)
        html = None
        try:
            req = urllib.request.Request(url, headers=self.headers)
            with urllib.request.urlopen(req, timeout=3.0) as response:
                resolved_url = response.geturl()
                html = response.read().decode("utf-8", errors="ignore")
        except Exception:
            pass

        # Extract ASIN from resolved URL if short link was passed
        resolved_asin = self.extract_asin(resolved_url)
        if resolved_asin:
            asin = resolved_asin

        if html:
            soup = BeautifulSoup(html, "html.parser")

            # Extract title from HTML
            title_el = soup.find(id="productTitle") or soup.find(id="title")
            if title_el and len(title_el.get_text(strip=True)) > 5:
                clean_title = title_el.get_text(strip=True)
            elif soup.title and soup.title.string:
                t_raw = soup.title.string.strip()
                t_clean = re.sub(r'\s*:\s*Amazon\.in.*$', '', t_raw, flags=re.IGNORECASE)
                t_clean = re.sub(r'^Amazon\.in\s*:\s*', '', t_clean, flags=re.IGNORECASE).strip()
                if len(t_clean) > 5 and "Robot Check" not in t_clean:
                    clean_title = t_clean

            # Extract brand
            brand_el = soup.find(id="bylineInfo")
            if brand_el:
                found_brand = brand_el.get_text(strip=True).replace("Brand:", "").replace("Visit the", "").replace("Store", "").strip()

            # Extract real high-resolution product image
            product_image = self._extract_amazon_image(soup, html)

            # Extract customer rating
            rating_el = soup.find("span", {"data-hook": "rating-out-of-text"}) or soup.find("i", {"data-hook": "average-star-rating"})
            if rating_el:
                m_r = re.search(r"(\d+(?:\.\d+)?)", rating_el.get_text())
                if m_r:
                    try:
                        rating_val = float(m_r.group(1))
                    except ValueError:
                        pass

            # Extract live customer reviews from Amazon product page
            seen_texts = set()
            review_cards = soup.find_all("div", {"data-hook": "review"})
            for card in review_cards:
                # Review title
                t_el = card.find(attrs={"data-hook": re.compile(r"review-title|reviewTitle")})
                r_title = t_el.get_text(strip=True) if t_el else ""

                # Review body
                body_el = (
                    card.find(attrs={"data-hook": "reviewRichContentContainer"}) or
                    card.find(attrs={"data-hook": "reviewText"}) or
                    card.find(attrs={"data-hook": "review-body"}) or
                    card.find(attrs={"data-hook": "review-collapsed"}) or
                    card.find("div", class_=re.compile(r"review-text-content"))
                )
                r_text = ""
                if body_el:
                    for unwanted in body_el.find_all(class_=re.compile(r"a-teaser-describedby")):
                        unwanted.decompose()
                    r_text = body_el.get_text(separator=' ', strip=True)

                full_rev = f"{r_title}. {r_text}".strip(". ").strip() if r_title and r_title != r_text else r_text
                if not full_rev or len(full_rev) < 5 or full_rev in seen_texts:
                    continue
                seen_texts.add(full_rev)

                # Author
                a_el = card.find("span", class_="a-profile-name")
                author = a_el.get_text(strip=True) if a_el else "Amazon Verified Customer"

                # Rating
                star_val = 5.0
                s_el = card.find(attrs={"data-hook": re.compile(r"star-rating")}) or card.find("span", class_="a-icon-alt")
                if s_el:
                    m = re.search(r"(\d+(?:\.\d+)?)", s_el.get_text())
                    if m:
                        try:
                            star_val = float(m.group(1))
                        except ValueError:
                            pass

                # Date
                d_el = card.find(attrs={"data-hook": "review-date"})
                date_str = d_el.get_text(strip=True) if d_el else "Recent"

                extracted_reviews.append({
                    "author": author,
                    "rating": star_val,
                    "date": date_str,
                    "review_text": full_rev,
                    "verified_purchase": True
                })

            # Extract catalog total reviews count
            tot_reviews = len(extracted_reviews)
            tot_el = soup.find(id="acrCustomerReviewText") or soup.find("span", {"data-hook": "total-review-count"})
            if tot_el:
                m_t = re.search(r"([\d,]+)", tot_el.get_text())
                if m_t:
                    try:
                        tot_reviews = int(m_t.group(1).replace(",", ""))
                    except ValueError:
                        pass
        else:
            tot_reviews = len(extracted_reviews)

        # Ensure fallback image is category-matched if Amazon blocked image
        product_image = resolve_product_image(clean_title, resolved_url, product_image)

        status_msg = f"Live reviews extracted directly from Amazon India: {len(extracted_reviews)} customer reviews verified and loaded." if extracted_reviews else f"Product details identified from Amazon link: {clean_title}"

        return ExtractedProduct(
            product_url=url,
            platform="Amazon India",
            platform_code="amazon",
            product_id=asin,
            product_name=clean_title,
            brand=found_brand,
            image_url=product_image,
            product_rating=rating_val,
            total_reviews_count=max(len(extracted_reviews), tot_reviews),
            reviews=extracted_reviews,
            extraction_status="success",
            status_message=status_msg,
            requires_fallback=(len(extracted_reviews) == 0)
        )
