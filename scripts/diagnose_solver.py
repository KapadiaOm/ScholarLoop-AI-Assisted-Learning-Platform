"""Diagnostic script to test Smart Solver functionality."""
import asyncio
import sys
from pathlib import Path

# Add project to path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from dotenv import load_dotenv
load_dotenv(project_root / ".env")

async def test_solver():
    print("=" * 60)
    print("Smart Solver Diagnostic")
    print("=" * 60)
    
    try:
        from src.agents.solve.main_solver import MainSolver
        
        print("\n1. Creating MainSolver instance...")
        solver = MainSolver()
        
        print("\n2. Initializing (ainit)...")
        await solver.ainit()
        
        print(f"\n3. Solver config:")
        llm_config = solver.config.get("llm", {})
        print(f"   api_key: {llm_config.get('api_key', '')[:15]}...")
        print(f"   base_url: {llm_config.get('base_url', 'N/A')}")
        print(f"   model: {llm_config.get('model', 'N/A')}")
        print(f"   binding: {llm_config.get('binding', 'N/A')}")
        
        print("\n4. Testing a simple solve call...")
        result = await solver.solve("What is 2+2?", verbose=True)
        
        print(f"\n5. Result:")
        print(f"   Answer: {result.get('final_answer', 'N/A')[:200]}...")
        print("\nSmart Solver test completed successfully!")
        
    except Exception as e:
        print(f"\nError: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_solver())
