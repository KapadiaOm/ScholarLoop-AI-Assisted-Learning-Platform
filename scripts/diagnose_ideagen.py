"""Diagnostic script to test Idea Generator functionality."""
import asyncio
import sys
from pathlib import Path

# Add project to path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from dotenv import load_dotenv
load_dotenv(project_root / ".env")

async def test_ideagen():
    print("=" * 60)
    print("Idea Generator Diagnostic")
    print("=" * 60)
    
    try:
        from src.services.llm import get_llm_config
        from src.agents.ideagen.idea_generation_workflow import IdeaGenerationWorkflow
        from src.agents.ideagen.material_organizer_agent import MaterialOrganizerAgent
        
        llm_config = get_llm_config()
        print(f"LLM Config:")
        print(f"  Binding: {llm_config.binding}")
        print(f"  Model: {llm_config.model}")
        
        print("\n1. Testing MaterialOrganizerAgent...")
        organizer = MaterialOrganizerAgent(
            api_key=llm_config.api_key,
            base_url=llm_config.base_url,
            api_version=getattr(llm_config, "api_version", None),
            model=llm_config.model,
        )
        
        test_records = [
            {
                "type": "qa",
                "title": "What is Python?",
                "user_query": "Explain what Python is.",
                "output": "Python is a high-level programming language."
            }
        ]
        
        kps = await organizer.process(test_records)
        print(f"Extracted {len(kps)} knowledge points: {kps}")
        
        if kps:
            print("\n2. Testing IdeaGenerationWorkflow...")
            workflow = IdeaGenerationWorkflow(
                api_key=llm_config.api_key,
                base_url=llm_config.base_url,
                api_version=getattr(llm_config, "api_version", None),
                model=llm_config.model,
            )
            
            result = await workflow.process(kps)
            print(f"Final Markdown Length: {len(result)}\n")
            print(result[:500] + "...\n")
            
        print("Idea Generator test completed successfully!")
        
    except Exception as e:
        print(f"\nError: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_ideagen())
