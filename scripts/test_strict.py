import asyncio
import sys
from pathlib import Path

# Add project to path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from dotenv import load_dotenv
load_dotenv(project_root / ".env")

async def test_strict():
    from src.services.llm import get_llm_config
    from src.agents.ideagen.idea_generation_workflow import IdeaGenerationWorkflow
    
    llm_config = get_llm_config()
    workflow = IdeaGenerationWorkflow(
        api_key=llm_config.api_key,
        base_url=llm_config.base_url,
        api_version=getattr(llm_config, "api_version", None),
        model=llm_config.model,
    )
    
    point = {
        "knowledge_point": "Python as a High-Level Programming Language",
        "description": "Python is a high level programming language."
    }
    ideas = [
        "Idea 1 about Python being high-level.",
        "Idea 2 about Python being easy to learn.",
        "Idea 3 about Python's abstraction over C.",
        "Idea 4 about performance tradeoffs.",
        "Idea 5 about syntax design."
    ]
    
    # We will invoke strict_filter but we'll monkey-patch call_llm to print the exact response
    original_call_llm = workflow.call_llm
    
    async def patched_call_llm(*args, **kwargs):
        resp = await original_call_llm(*args, **kwargs)
        with open("raw_response.txt", "w", encoding="utf-8") as f:
            f.write(resp)
        print("WROTE RAW RESPONSE TO raw_response.txt")
        return resp
        
    workflow.call_llm = patched_call_llm
    
    result = await workflow.strict_filter(point, ideas)
    print(f"Result: {result}")

if __name__ == "__main__":
    asyncio.run(test_strict())
