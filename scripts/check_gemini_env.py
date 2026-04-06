
import sys
import os

print("Python executable:", sys.executable)
print("Environment keys:", [k for k in os.environ.keys() if "API" in k or "LLM" in k])

try:
    import google.generativeai as genai
    print("google.generativeai imported successfully", genai.__version__)
except ImportError as e:
    print("Failed to import google.generativeai:", e)

try:
    from dotenv import load_dotenv
    load_dotenv()
    print("Loaded .env")
    print("LLM_API_KEY:", os.getenv("LLM_API_KEY"))
except Exception as e:
    print("Dotenv error:", e)
