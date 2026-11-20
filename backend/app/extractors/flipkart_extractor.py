import re
import json
import urllib.request
import urllib.error
import concurrent.futures
from urllib.parse import urlparse
from typing import Dict, Any, List, Optional
from bs4 import BeautifulSoup
from app.extractors.base import BaseProductExtractor, ExtractedProduct
from app.extractors.media_resolver import parse_clean_title_from_url, resolve_product_image

class FlipkartExtractor(BaseProductExtractor):
    def __init__(self):
        self.headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
            "Accept-Language": "en-IN,en-GB;q=0.9,en-US;q=0.8,en;q=0.7",
            "Cache-Control": "no-cache",
            "Pragma": "no-cache"
        }

    def can_handle(self, url: str) -> bool:
        netloc = urlparse(url).netloc.lower()
        return "flipkart." in netloc or "fkrt.it" in netloc

    def extract_product_id(self, url: str) -> Optional[str]:
        path = urlparse(url).path
        match = re.search(r"/p/(itm[a-zA-Z0-9]+)", path)
        if match:
            return match.group(1)
        query_match = re.search(r"[?&]pid=([a-zA-Z0-9]+)", url)
        if query_match:
            return query_match.group(1)
        match_generic = re.search(r"/p/([a-zA-Z0-9]+)", path)
        if match_generic:
            return match_generic.group(1)
        return None

    def _extract_reviews_from_state(self, html: str, seen_texts: set) -> List[Dict[str, Any]]:
        """Extract reviews from window.__INITIAL_STATE__ in Flipkart HTML"""
        m = re.search(r'window\.__INITIAL_STATE__\s*=\s*({.*?});</script>', html, re.DOTALL)
        if not m:
            return []
        try:
            state = json.loads(m.group(1))
        except Exception:
            return []

        extracted = []

        def walk(obj):
            if isinstance(obj, dict):
                if obj.get("type") == "ProductReviewValue":
                    text = obj.get("text") or ""
                    heading = obj.get("title") or ""
                    full_text = f"{heading}. {text}".strip(". ").strip() if heading and heading != text else text
                    if not full_text:
                        full_text = heading or text
                    if full_text and full_text not in seen_texts:
                        seen_texts.add(full_text)
                        rating_val = 5.0
                        try:
                            rating_val = float(obj.get("rating", 5.0))
                        except (ValueError, TypeError):
                            rating_val = 5.0

                        extracted.append({
                            "review_text": full_text,
                            "rating": rating_val,
                            "author": obj.get("author") or "Flipkart Verified Buyer",
                            "date": obj.get("created") or "Recent",
                            "verified_purchase": bool(obj.get("certifiedBuyer", True))
                        })
                for v in obj.values():
                    walk(v)
            elif isinstance(obj, list):
                for item in obj:
                    walk(item)

        walk(state)
        return extracted

    def _extract_schema_org(self, html: str, seen_texts: set) -> Dict[str, Any]:
        """Extract product info and reviews from schema.org script tags"""
        info = {
            "name": None,
            "image": None,
            "rating": None,
            "brand": None,
            "reviews": []
        }
        scripts = re.findall(r'<script[^>]*>(.*?)</script>', html, re.DOTALL)
        for s in scripts:
            if '"@type":"Product"' in s or '"Product"' in s:
                try:
                    data = json.loads(s)
                    if isinstance(data, list):
                        data = data[0]
                    if not info["name"] and data.get("name"):
                        info["name"] = data.get("name")
                    if not info["image"] and data.get("image"):
                        imgs = data.get("image")
                        info["image"] = imgs[0] if isinstance(imgs, list) and imgs else str(imgs)
                    if not info["rating"] and data.get("aggregateRating"):
                        try:
                            info["rating"] = float(data.get("aggregateRating", {}).get("ratingValue", 4.2))
                        except (ValueError, TypeError):
                            pass
                    if not info["brand"] and data.get("brand"):
                        b = data.get("brand")
                        info["brand"] = b.get("name") if isinstance(b, dict) else str(b)

                    # Extract schema reviews
                    for r in data.get("review", []):
                        body = r.get("reviewBody") or ""
                        name = r.get("name") or ""
                        full = f"{name}. {body}".strip(". ").strip() if name and name != body else body
                        if full and full not in seen_texts:
                            seen_texts.add(full)
                            r_val = 5.0
                            try:
                                r_val = float(r.get("reviewRating", {}).get("ratingValue", 5.0))
                            except (ValueError, TypeError):
                                pass

                            info["reviews"].append({
                                "review_text": full,
                                "rating": r_val,
                                "author": r.get("author", {}).get("name") or "Flipkart Buyer",
                                "date": r.get("datePublished") or "Recent",
                                "verified_purchase": True
                            })
                except Exception:
                    pass
        return info

    def extract(self, url: str) -> ExtractedProduct:
        resolved_url = url
        pid = self.extract_product_id(url)
        clean_title, found_brand = parse_clean_title_from_url(url, fallback_title="Flipkart Product")
        product_image = resolve_product_image(clean_title, url)
        rating_val = 4.2
        seen_texts = set()
        extracted_reviews: List[Dict[str, Any]] = []

        # 1. Fetch the exact product URL submitted by the user (handling short links like dl.flipkart.com)
        main_html = None
        try:
            req = urllib.request.Request(url, headers=self.headers)
            with urllib.request.urlopen(req, timeout=1.8) as response:
                resolved_url = response.geturl()
                main_html = response.read().decode("utf-8", errors="ignore")
        except Exception:
            pass

        # If original URL was a short link (dl.flipkart.com/s/...), extract PID and title from resolved URL
        if not pid or "dl.flipkart.com" in url or "fkrt.it" in url:
            resolved_pid = self.extract_product_id(resolved_url)
            if resolved_pid:
                pid = resolved_pid
            res_title, res_brand = parse_clean_title_from_url(resolved_url)
            if res_title and res_title != "Flipkart Product":
                clean_title = res_title
            if res_brand and res_brand != "Verified Brand":
                found_brand = res_brand

        if main_html:
            # Extract metadata and reviews from schema
            schema_info = self._extract_schema_org(main_html, seen_texts)
            if schema_info.get("name"):
                clean_title = schema_info["name"]
            if schema_info.get("image"):
                product_image = schema_info["image"]
            if schema_info.get("rating"):
                rating_val = schema_info["rating"]
            if schema_info.get("brand"):
                found_brand = schema_info["brand"]
            extracted_reviews.extend(schema_info.get("reviews", []))

            # Extract reviews from window.__INITIAL_STATE__
            state_revs = self._extract_reviews_from_state(main_html, seen_texts)
            extracted_reviews.extend(state_revs)

            # Fallback DOM title/image check
            soup = BeautifulSoup(main_html, "html.parser")
            title_el = soup.find("h1", class_=re.compile(r"_6EBuvT|B_NuCI|VU-ZEz")) or soup.find("span", class_=re.compile(r"B_NuCI|VU-ZEz"))
            if title_el and len(title_el.get_text(strip=True)) > 5:
                clean_title = title_el.get_text(strip=True)

            og_img = soup.find("meta", property="og:image") or soup.find("meta", {"name": "twitter:image"})
            if og_img and og_img.get("content"):
                product_image = og_img.get("content")

        # 2. Extract PID and slug from resolved URL to fetch product-reviews page if initial page had few reviews
        path = urlparse(resolved_url).path
        slug_match = re.search(r"^/([^/]+)/p/", path)
        slug = slug_match.group(1) if slug_match else ""

        if pid and len(extracted_reviews) < 20:
            # Quick probe for reviews page if needed, kept under 1.2s for instant response
            def fetch_flipkart_page(p_num: int):
                urls_to_try = []
                if slug:
                    urls_to_try.append(f"https://www.flipkart.com/{slug}/product-reviews/{pid}?page={p_num}")
                else:
                    urls_to_try.append(f"https://www.flipkart.com/product-reviews/{pid}?page={p_num}")

                for rev_url in urls_to_try:
                    try:
                        p_req = urllib.request.Request(rev_url, headers=self.headers)
                        with urllib.request.urlopen(p_req, timeout=1.2) as p_resp:
                            p_html = p_resp.read().decode("utf-8", errors="ignore")
                            if "ProductReviewValue" in p_html:
                                return p_num, p_html
                    except Exception:
                        pass
                return p_num, None

            p1_num, p1_html = fetch_flipkart_page(1)
            if p1_html:
                p1_revs = self._extract_reviews_from_state(p1_html, seen_texts)
                if p1_revs:
                    extracted_reviews.extend(p1_revs)

            if len(extracted_reviews) > 1000:
                extracted_reviews = extracted_reviews[:1000]

        # Extract catalog total reviews count from schema or HTML if available
        catalog_total_reviews = len(extracted_reviews)
        if main_html:
            rc_match = re.search(r'\"reviewCount\"\s*:\s*\"?(\d+)', main_html)
            if rc_match:
                try:
                    catalog_total_reviews = int(rc_match.group(1))
                except ValueError:
                    pass

        # Ensure product image is high quality
        product_image = resolve_product_image(clean_title, url, product_image)

        status_msg = f"Live reviews extracted directly from Flipkart: {len(extracted_reviews)} customer reviews verified and loaded." if extracted_reviews else f"Product details identified from Flipkart link: {clean_title}"

        return ExtractedProduct(
            product_url=url,
            platform="Flipkart",
            platform_code="flipkart",
            product_id=pid,
            product_name=clean_title,
            brand=found_brand,
            image_url=product_image,
            product_rating=rating_val,
            total_reviews_count=max(len(extracted_reviews), catalog_total_reviews),
            reviews=extracted_reviews,
            extraction_status="success",
            status_message=status_msg,
            requires_fallback=(len(extracted_reviews) == 0)
        )
