import os
import requests
import json
from google import genai
from dotenv import load_dotenv

load_dotenv(override=True)

class AIService:
    def __init__(self):
        self.provider = "gemini" 
        self.model_name = "gemini-1.5-flash"
        self.ollama_base_url = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")

    def _get_client(self, api_key: str):
        if not api_key:
            return None
        return genai.Client(api_key=api_key)

    def ask_pdf(self, context: str, question: str, mode: str = "partner", api_key: str = None) -> str:
        max_chars = 30000
        
        system_prompts = {
            "partner": "You are a helpful study partner. Answer questions based ONLY on the provided context.",
            "quiz": "You are a quiz master. Based on the context, ask the user a detailed question to test their understanding. If the user provides an answer, evaluate it effectively.",
            "summary": "You are a summarizer. Provide a concise summary and a list of key takeaways from the provided context."
        }
        
        system_instruction = system_prompts.get(mode, system_prompts["partner"])

        prompt = f"""
{system_instruction}

CONTEXT:
{context[:max_chars]} 

QUESTION: {question}
Answer:
"""
        client = self._get_client(api_key)
        
        if not client:
             return "Please provide a valid Gemini API Key in Settings or Login to use AI features."

        try:
            response = client.models.generate_content(
                model=self.model_name,
                contents=prompt
            )
            return response.text
        except Exception as e:
            print(f"Gemini Error: {e}")
            return f"Error connecting to AI: {str(e)}"

    def generate_quiz(self, topic: str, count: int = 5, difficulty: str = "Medium", context: str = None, api_key: str = None) -> dict:
        client = self._get_client(api_key)
        if not client:
             return {"error": "Missing API Key"}

        max_chars = 25000
        truncated_context = context[:max_chars] if context else ""
        
        # JSON Prompt
        final_prompt = f"""
Generate {count} multiple-choice quiz questions based on the text below.
Topic: {topic}
Difficulty: {difficulty}

JSON Format:
{{
  "questions": [
    {{
      "question": "Question text?",
      "options": ["A", "B", "C", "D"],
      "answer": "Correct Option Text"
    }}
  ]
}}

CONTEXT:
{truncated_context}...
"""
        try:
            response = client.models.generate_content(
                model=self.model_name,
                contents=final_prompt,
                config={'response_mime_type': 'application/json'}
            )
            return json.loads(response.text)
        except Exception as e:
            print(f"Quiz Gen Error: {e}")
            return {"error": str(e)}

    def generate_flashcards(self, count: int = 10, context: str = None, api_key: str = None) -> dict:
        client = self._get_client(api_key)
        if not client:
             return {"error": "Missing API Key"}

        max_chars = 25000
        truncated_context = context[:max_chars] if context else ""

        final_prompt = f"""
Generate {count} flashcards (Front/Back) based on the text below.
Focus on key concepts and definitions.

JSON Format:
{{
  "flashcards": [
    {{ "front": "Term/Question", "back": "Definition/Answer" }}
  ]
}}

CONTEXT:
{truncated_context}...
"""
        try:
            response = client.models.generate_content(
                model=self.model_name,
                contents=final_prompt,
                config={'response_mime_type': 'application/json'}
            )
            return json.loads(response.text)
        except Exception as e:
            print(f"Flashcard Gen Error: {e}")
            return {"error": str(e)}

    def generate_search_queries(self, context: str, count: int = 3, api_key: str = None) -> list:
        # Fallback to keyword extraction if no key provided
        if not api_key:
             print("DEBUG: No key for search queries, using fallback.")
             title = context.split('\\n')[0][:80].strip() if context else ""
             return [title] if len(title) > 5 else ["Educational videos"]

        client = self._get_client(api_key)
        truncated_context = context[:5000] if context else ""
        
        prompt = f"""
Generate {count} short, simple YouTube search queries (max 5 words) based on this text.
Context: {truncated_context}...
Focus on educational videos.
JSON Array of strings.
"""
        try:
            response = client.models.generate_content(
                model=self.model_name,
                contents=prompt,
                config={'response_mime_type': 'application/json'}
            )
            return json.loads(response.text)
        except Exception as e:
            print(f"Search Query Error: {e}")
            return ["Educational videos"]
