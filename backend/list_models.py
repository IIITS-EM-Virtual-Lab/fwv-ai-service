from google import genai
import os
from dotenv import load_dotenv
from pathlib import Path

env_path = Path(__file__).resolve().parent / ".env"
load_dotenv(dotenv_path=env_path)

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

models = client.models.list()
for m in models:
    print(m.name, "->", m.supported_generation_methods)
