from ai_service import AIService
import json
import os

# Ensure API key is loaded for this test script if not already in env context
from dotenv import load_dotenv
load_dotenv()

def test_quiz():
    print("Initializing AI Service...")
    ai = AIService()
    
    print("\nGenerating Quiz about 'Space Exploration'...")
    try:
        # Generate a small quiz
        result = ai.generate_quiz(topic="Space Exploration", count=3, difficulty="Easy")
        
        print("\n--- RAW RESULT ---")
        print(result)
        
        print("\n--- PARSED JSON CHECK ---")
        parsed = json.loads(result)
        print(json.dumps(parsed, indent=2))
        print("\nSUCCESS: Quiz generated and parsed correctly.")
        
    except Exception as e:
        print(f"\nFAILURE: {e}")

if __name__ == "__main__":
    test_quiz()
