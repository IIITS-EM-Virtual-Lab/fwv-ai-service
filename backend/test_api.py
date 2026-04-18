import requests

GROQ_API_KEY = ""  # your groq key

response = requests.post(
    "https://api.groq.com/openai/v1/chat/completions",
    headers={
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json"
    },
    json={
        "model": "llama-3.3-70b-versatile",  # Or "llama-3.1-8b-instant" for speed
        "messages": [{"role": "user", "content": "What is Faraday's Law?"}],
        "max_tokens": 200,
        "temperature": 0.7
    },
    timeout=60
)

print(response.status_code)
print(response.text[:500])
print(response.headers.get("x-ratelimit-remaining-requests"))
print(response.headers.get("x-ratelimit-remaining-tokens"))