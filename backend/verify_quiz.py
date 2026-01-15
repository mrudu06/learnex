from ai_service import AIService
import json

def test():
    print("Initializing AI Service...")
    ai = AIService()
    print(f"Model: {ai.gemini_model_name}")
    print(f"Key Ends With: {ai.api_key[-5:] if ai.api_key else 'None'}")
    
    print("\nGenerating Quiz...")
    try:
        # Simple test
        result = ai.generate_quiz("Science", count=3)
        print("Raw Result:", result[:100] + "...")
        if "[" in result and "]" in result:
             print("SUCCESS: JSON generated.")
        else:
             print("FAILURE: Invalid format.")
    except Exception as e:
        print(f"FAILURE: {e}")

if __name__ == "__main__":
    test()
