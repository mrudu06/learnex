from google import genai
import os
from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")
print(f"Key: {api_key[:5]}...{api_key[-5:]}")

client = genai.Client(api_key=api_key)

try:
    print("Listing models...")
    # New SDK might use client.models.list() or similar.
    # We'll try to iterate.
    for m in client.models.list():
        print(f"- {m.name}")
except Exception as e:
    print(f"Error: {e}")
