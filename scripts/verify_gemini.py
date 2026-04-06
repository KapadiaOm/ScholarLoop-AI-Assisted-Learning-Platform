
import asyncio
import os
import sys

# Add src to path
sys.path.append(os.path.join(os.path.dirname(__file__), ".."))

from src.services.llm import factory
from src.services.llm.config import LLMConfig

# Mock config or rely on env?
# Ideally user sets env vars.

async def verify():
    print("Verifying Gemini Integration...")
    
    # Check if key is available
    api_key = os.getenv("LLM_API_KEY") or os.getenv("GOOGLE_API_KEY")
    if not api_key:
        print("ERROR: No API key found. Please set LLM_API_KEY or GOOGLE_API_KEY.")
        return

    print(f"Using API Key: {api_key[:4]}...{api_key[-4:]}")

    import google.generativeai as genai
    genai.configure(api_key=api_key)
    
    print("\n--- Listing Available Models ---")
    try:
        for m in genai.list_models():
            if 'generateContent' in m.supported_generation_methods:
                print(m.name)
    except Exception as e:
        print(f"Error listing models: {e}")
    print("--------------------------------\n")
    
    try:
        # Test Complete
        print("\n1. Testing complete()...")
        response = await factory.complete(
            prompt="Hello, are you Gemini?",
            binding="gemini",
            api_key=api_key
        )
        print(f"Response: {response}")
        
        # Test Stream
        print("\n2. Testing stream()...")
        print("Stream Output: ", end="", flush=True)
        async for chunk in factory.stream(
            prompt="Count from 1 to 5.",
            binding="gemini",
            api_key=api_key
        ):
            print(chunk, end="", flush=True)
        print("\n\nVerification Successful!")
        
    except Exception as e:
        print(f"\nERROR: Verification failed with error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    if sys.platform == "win32":
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(verify())
