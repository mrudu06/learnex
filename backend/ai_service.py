import os
import requests
import json
from google import genai
from dotenv import load_dotenv

load_dotenv(override=True)

class AIService:
    def __init__(self):
        self.provider = os.getenv("AI_PROVIDER", "local") # Default to local as requested
        self.model_name = os.getenv("AI_MODEL", "phi3") if self.provider == "local" else "gemini-2.0-flash-exp"
        self.api_key = os.getenv("GEMINI_API_KEY")
        self.ollama_base_url = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")

        self.gemini_model_name = "gemini-flash-lite-latest"
        self.gemini_client = None
        if self.api_key:
            try:
                self.gemini_client = genai.Client(api_key=self.api_key)
            except Exception as e:
                print(f"Error initializing Gemini client: {e}")
        elif self.provider == "gemini":
            print("Warning: GEMINI_API_KEY not set but provider is gemini.")

        # Prefer Gemini for Quiz generation due to better JSON adherence


    def ask_pdf(self, context: str, question: str, mode: str = "partner") -> str:
        # Truncate context. Phi-3 is efficient but large context on local CPU takes time.
        # Drastically reducing to ~1000 chars to prevent timeouts on slow hardware.
        max_chars = 1000 if self.provider == "local" else 30000
        
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
        if self.provider == "local":
            result = self._call_ollama(prompt)
            return result if result else "Sorry, I couldn't generate a response. The model might be busy or timed out."
        elif self.gemini_client:
            try:
                response = self.gemini_client.models.generate_content(
                    model=self.model_name,
                    contents=prompt
                )
                return response.text
            except Exception as e:
                print(f"Error calling Gemini API for Q&A: {str(e)}")
                return "Sorry, I encountered an error creating the response."
        return "AI Service Unavailable"

    def generate_quiz(self, topic: str, count: int = 5, difficulty: str = "Medium", context: str = None) -> str:
        # Prefer Gemini for Quiz generation due to better JSON adherence
        use_gemini = self.gemini_client is not None
        
        if context:
            # Truncate context to prevent token limits.
            max_chars = 25000 if use_gemini else 1000
            truncated_context = context[:max_chars]
            
            prompt = (
                f"Generate {count} multiple-choice quiz questions based on this text. "
                f"Difficulty: {difficulty}. "
                f"Context: {truncated_context}... "
            )
        else:
            prompt = (
                f"Generate {count} multiple-choice quiz questions about '{topic}'. "
                f"Difficulty: {difficulty}. "
            )

        if use_gemini:
            try:
                print("DEBUG: Using Gemini for Quiz Generation with Schema")
                
                response_schema = {
                    "type": "ARRAY",
                    "items": {
                        "type": "OBJECT",
                        "properties": {
                            "question": {"type": "STRING"},
                            "options": {"type": "ARRAY", "items": {"type": "STRING"}},
                            "answer": {"type": "STRING"}
                        },
                        "required": ["question", "options", "answer"]
                    }
                }

                response = self.gemini_client.models.generate_content(
                    model=self.gemini_model_name,
                    contents=prompt,
                    config=genai.types.GenerateContentConfig(
                        temperature=0.7, 
                        response_mime_type="application/json",
                        response_schema=response_schema
                    )
                )
                return response.text
            except Exception as e:
                print(f"Error calling Gemini API for Quiz: {str(e)}")
                # Fallback to local if Gemini fails (rare if key is valid)
        
        if self.provider == "local":
             # Local fallback prompt needs explicit JSON instructions
            prompt += (
                " Format: Strict JSON array. Keys: 'question', 'options' (4 strings), 'answer'. "
                "No markdown."
            )
            print("DEBUG: Using Local (Ollama) for Quiz Generation")
            return self._call_ollama(prompt, json_mode=True)
            
        return ""
    def generate_search_queries(self, context: str, count: int = 3) -> list:
        # Generate search queries for YouTube based on context
        
        # Truncate for speed
        truncated_context = context[:5000]
        
        # SIMPLIFIED PROMPT
        prompt = (
            f"Generate {count} short, simple YouTube search queries (max 5 words) based on this text. "
            f"Context: {truncated_context}... "
            f"Focus on educational videos."
        )

        use_gemini = self.gemini_client is not None
        
        if use_gemini:
            try:
                print("DEBUG: Using Gemini for Search Queries")
                response_schema = {
                    "type": "ARRAY",
                    "items": {"type": "STRING"}
                }
                
                response = self.gemini_client.models.generate_content(
                    model=self.gemini_model_name,
                    contents=prompt,
                    config=genai.types.GenerateContentConfig(
                        temperature=0.7, 
                        response_mime_type="application/json",
                        response_schema=response_schema
                    )
                )
                return json.loads(response.text)
            except Exception as e:
                print(f"Error generating queries with Gemini: {e}")
                # Fallback to local
        
        # Local fallback skipped or failed, try backup strategies
        
        # FINAL FALLBACK: Keyword Extraction
        print("DEBUG: Fallback to keyword extraction")
        if context:
            # 1. Try to take the first line as a title
            title = context.split('\n')[0][:80].strip()
            if len(title) > 5:
                return [title, f"{title} tutorial"]
                
            # 2. Just return generic
            return ["Educational videos"]
            
        return ["General Education"]
    def _call_ollama(self, prompt: str, json_mode: bool = False) -> str:
        print(f"Sending request to Ollama ({self.model_name})...")
        url = f"{self.ollama_base_url}/api/generate"
        payload = {
            "model": self.model_name,
            "prompt": prompt,
            "stream": False
        }
        if json_mode:
            payload["format"] = "json"

        try:
            # Increased timeout for local inference
            response = requests.post(url, json=payload, timeout=180)
            response.raise_for_status()
            return response.json().get("response", "")
        except requests.exceptions.RequestException as e:
            print(f"Error calling Ollama ({self.model_name}): {e}")
            if hasattr(e, 'response') and e.response is not None:
                print(f"Ollama Error Response: {e.response.text}")
            return None

