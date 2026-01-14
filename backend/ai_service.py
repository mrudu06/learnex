import os
from google import genai
from dotenv import load_dotenv

load_dotenv()

class GeminiService:
    def __init__(self, model_name="gemini-2.0-flash-exp"):
        self.api_key = os.getenv("GEMINI_API_KEY")
        if not self.api_key:
            # Fallback or raise error. 
            # For now, print warning but don't crash init if we want to allow app to start without it
            print("Warning: GEMINI_API_KEY environment variable is not set.")
            self.api_key = None
        
        if self.api_key:
            self.client = genai.Client(api_key=self.api_key)
        else:
            self.client = None
            
        self.model_name = model_name

    def generate_quiz(self, topic: str, count: int = 5, difficulty: str = "Medium") -> str:
        if not self.client:
             return None

        prompt = (
            f"Generate {count} multiple-choice quiz questions about '{topic}'. "
            f"Difficulty: {difficulty}. "
            f"Return the result as a strictly formatted JSON array. "
            f"Each object in the array must have these keys: 'question' (string), 'options' (array of 4 strings), and 'answer' (string, matching one of the options). "
            f"Example format: [{{'question': '...', 'options': ['...'], 'answer': '...'}}]. "
            f"Do not include any markdown formatting, code blocks, or explanations outside the JSON."
        )

        try:
            response = self.client.models.generate_content(
                model=self.model_name,
                contents=prompt
            )
            return response.text
        except Exception as e:
            print(f"Error calling Gemini API: {str(e)}")
            return None

    def ask_pdf(self, context: str, question: str) -> str:
        """
        Answers a question based on the provided PDF context.
        """
        if not self.client:
             return "AI Service Unavailable"

        prompt = f"""
You are a helpful AI tutor for the 'LearnEx' platform.
Answer the student's question based ONLY on the provided context.
If the answer is not in the context, say "I cannot find the answer in the provided document."

---
CONTEXT:
{context[:30000]} 
---

QUESTION: {question}
"""
        # Limit context to ~30k chars to stay safely within token limits for Flash 2.0 (though it handles 1M, better safe/faster)

        try:
            response = self.client.models.generate_content(
                model=self.model_name,
                contents=prompt
            )
            return response.text
        except Exception as e:
            print(f"Error calling Gemini API for Q&A: {str(e)}")
            return "Sorry, I encountered an error creating the response."
