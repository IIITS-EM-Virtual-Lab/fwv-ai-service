from playwright.sync_api import sync_playwright
from urllib.parse import urlparse
import os
import time

BASE_URL = "https://www.fwvlab.com/"
DOMAIN = "www.fwvlab.com"

OUTPUT_DIR = "data/raw"
os.makedirs(OUTPUT_DIR, exist_ok=True)

visited = set()
MAX_PAGES = 60          # safety limit
DELAY = 2               # delay between pages
MAX_RETRIES = 3         # 🔁 retry count


def is_internal(url):
    try:
        return urlparse(url).netloc == DOMAIN
    except:
        return False


def clean_filename(url):
    name = url.replace("https://www.fwvlab.com/", "").strip("/")
    return name.replace("/", "_") if name else "home"


def scrape_page(page, url):
    if url in visited or len(visited) >= MAX_PAGES:
        return

    visited.add(url)

    attempt = 1
    while attempt <= MAX_RETRIES:
        try:
            print(f"Scraping ({len(visited)}): {url} | Attempt {attempt}")

            page.goto(url, timeout=60000)
            page.wait_for_timeout(5000)

            text = page.inner_text("body")
            lines = [l.strip() for l in text.splitlines() if len(l.strip()) > 40]

            filename = clean_filename(url)
            with open(f"{OUTPUT_DIR}/{filename}.txt", "w", encoding="utf-8") as f:
                f.write("\n".join(lines))

            # Extract links after successful load
            links = page.eval_on_selector_all(
                "a[href]",
                "els => els.map(e => e.href)"
            )

            time.sleep(DELAY)

            for link in links:
                if link and is_internal(link):
                    scrape_page(page, link)

            return  # ✅ success → exit retry loop

        except Exception as e:
            print(f"⚠️ Error on {url} (Attempt {attempt})")
            print(f"Reason: {e}")
            attempt += 1
            time.sleep(3)

    print(f"❌ Skipping page after {MAX_RETRIES} failed attempts: {url}")


if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        scrape_page(page, BASE_URL)

        browser.close()
