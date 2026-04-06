"""Diagnostic script to test Question Module functionality."""
import asyncio
import sys
from pathlib import Path

# Add project to path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from dotenv import load_dotenv
load_dotenv(project_root / ".env")

async def test_question():
    print("=" * 60)
    print("Question Module Diagnostic")
    print("=" * 60)
    
    try:
        from src.services.llm import get_llm_config
        from src.agents.question.coordinator import AgentCoordinator
        
        llm_config = get_llm_config()
        print(f"LLM Config:")
        print(f"  Binding: {llm_config.binding}")
        print(f"  Model: {llm_config.model}")
        
        print("\n1. Testing AgentCoordinator (Custom Mode)...")
        coordinator = AgentCoordinator(
            api_key=llm_config.api_key,
            base_url=llm_config.base_url,
            language="en",
            api_version=getattr(llm_config, "api_version", None),
        )
        
        requirement = {
            "knowledge_point": "Python Variables",
            "difficulty": "easy",
            "question_type": "choice"
        }
        
        result = await coordinator.generate_questions_custom(requirement, num_questions=1)
        
        print(f"Coordinator Result Success: {result.get('success')}")
        if result.get('success'):
             print(f"Generated {result.get('completed', 0)} questions.")
             if result.get('results'):
                 q = result['results'][0].get('question', {})
                 print(f"Sample Question: {q.get('question', '')[:100]}...")
                 print(f"Sample Answer: {q.get('correct_answer', '')}")
                 
        else:
             print(f"Failures: {result.get('failures')}")
             
        print("\nQuestion Module test completed successfully!")
        
    except Exception as e:
        print(f"\nError: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_question())
