FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy entire project
COPY . .

# Expose port
EXPOSE 7860

# Start server
CMD ["uvicorn", "backend.app:app", "--host", "0.0.0.0", "--port", "7860"]
```

Hugging Face Spaces uses **port 7860** by default — that's why we changed it.

---

### Step 4 — Update `requirements.txt`

Replace it with this clean version (remove the torch CPU line we added for Render):
```
fastapi
uvicorn
python-dotenv
requests
beautifulsoup4
faiss-cpu
google-genai
sentence-transformers
```

---

### Step 5 — Add your Gemini API key as a Secret

1. Go to your Space → **Settings** tab
2. Scroll to **Repository Secrets**
3. Click **New Secret**:
```
Name:  GEMINI_API_KEY
Value: your_actual_key_here