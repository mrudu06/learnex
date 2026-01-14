import sys
import os
from mcp.server.fastmcp import FastMCP
from dotenv import load_dotenv

# Ensure we can import from server package
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from server.gemini_service import GeminiService
from server.blob_service import BlobStorageService

load_dotenv()

class QuizToolController:
    """
    Controller class to manage MCP tool operations and service dependencies.
    Follows OOP principles by encapsulating state and logic.
    """
    def __init__(self):
        # Initialize services once to maintain state and connection pools
        try:
            self.blob_service = BlobStorageService()
        except Exception as e:
            print(f"Warning: Failed to initialize BlobStorageService: {e}")
            self.blob_service = None

        try:
            self.gemini_service = GeminiService()
        except Exception as e:
            print(f"Warning: Failed to initialize GeminiService: {e}")
            self.gemini_service = None

    def list_cricket_data(self) -> str:
        """
        Lists all available cricket data files in the Azure Blob Storage.
        """
        if not self.blob_service:
            return "Error: BlobStorageService is not initialized. Check configuration."
        
        try:
            blobs = self.blob_service.list_blobs()
            if isinstance(blobs, str) and blobs.startswith("Error"):
                 return blobs
            return f"Available Data Files:\n" + "\n".join(blobs)
        except Exception as e:
            return f"Error: {str(e)}"

    def get_cricket_data(self, filename: str) -> str:
        """
        Retrieves the content of a specific cricket data file from Azure Blob Storage.
        """
        if not self.blob_service:
            return "Error: BlobStorageService is not initialized. Check configuration."

        try:
            content = self.blob_service.get_blob_content(filename)
            return content
        except Exception as e:
            return f"Error: {str(e)}"

    def generate_quiz_questions(self, topic: str = "General Knowledge", count: int = 10, difficulty: str = "Medium") -> str:
        """
        Generates quiz questions using Gemini's knowledge.
        Defaults to General Knowledge.

        Args:
            topic: The specific topic (default "General Knowledge").
            count: Number of questions to generate (default 10).
            difficulty: Difficulty level (Easy, Medium, Hard).
        """
        if not self.gemini_service:
            return "Error: GeminiService is not initialized. Check configuration."

        prompt = (
            f"Generate {count} multiple-choice quiz questions about '{topic}'. "
            f"Difficulty: {difficulty}. "
            f"Return the result as a strictly formatted JSON array. "
            f"Each object in the array must have these keys: 'question' (string), 'options' (array of 4 strings), and 'answer' (string, matching one of the options). "
            f"Example format: [{{'question': '...', 'options': ['...'], 'answer': '...'}}]. "
            f"Do not include any markdown formatting or explanations outside the JSON."
        )

        try:
            # We pass None for data and offset to use Gemini's internal knowledge
            result = self.gemini_service.generate_quiz(prompt=prompt)
            return result
        except Exception as e:
            return f"Error: {str(e)}"

# Initialize Controller and MCP Server
controller = QuizToolController()
mcp = FastMCP("CricketQuizGenerator")

# Register tools using the controller instance methods
mcp.tool(name="list_cricket_data")(controller.list_cricket_data)
mcp.tool(name="get_cricket_data")(controller.get_cricket_data)
mcp.tool(name="generate_quiz_questions")(controller.generate_quiz_questions)

if __name__ == "__main__":
    mcp.run()
