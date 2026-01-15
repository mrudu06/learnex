import os
from dotenv import load_dotenv
from google import genai

# Load env from backend folder
load_dotenv("/home/mrudu/learnex/backend/.env")

api_key = os.getenv("GEMINI_API_KEY")
print(f"Using Key: {api_key[:5]}...")

try:
    client = genai.Client(api_key=api_key)
    # Try to list models. The method might be different depending on SDK version.
    # Assuming standard google-genai interface or similar.
    # If using 'google-generativeai' package it is genai.list_models()
    # If using 'google-genai' (new SDK) it might be client.models.list()
    
    print("Listing models...")
    for model in client.models.list():
        print(f" - {model.name}")
        
except Exception as e:
    print(f"Error: {e}")
