"""Diagnostic script to test Guide Module functionality."""
import asyncio
import sys
from pathlib import Path

# Add project to path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from dotenv import load_dotenv
load_dotenv(project_root / ".env")

async def test_guide():
    print("=" * 60)
    print("Guide Module Diagnostic")
    print("=" * 60)
    
    try:
        from src.services.llm import get_llm_config
        from src.agents.guide.agents.locate_agent import LocateAgent
        from src.agents.guide.agents.interactive_agent import InteractiveAgent
        from src.agents.guide.agents.chat_agent import ChatAgent
        from src.agents.guide.agents.summary_agent import SummaryAgent
        
        llm_config = get_llm_config()
        print(f"LLM Config:")
        print(f"  Binding: {llm_config.binding}")
        print(f"  Model: {llm_config.model}")
        
        print("\n1. Testing LocateAgent...")
        locate_agent = LocateAgent(
            api_key=llm_config.api_key,
            base_url=llm_config.base_url,
            language="en",
            api_version=getattr(llm_config, "api_version", None),
            binding=llm_config.binding,
        )
        
        test_records = [
            {
                "type": "qa",
                "title": "Introduction to Python",
                "user_query": "What are the basic data types in Python?",
                "output": "Python has several built-in types including integers, floats, strings, booleans, and lists."
            }
        ]
        
        result = await locate_agent.process("test_notebook", "Test Notebook", test_records)
        print(f"LocateAgent Result Success: {result.get('success')}")
        knowledge_points = result.get('knowledge_points', [])
        
        if knowledge_points:
            test_pt = knowledge_points[0]
            
            print("\n2. Testing InteractiveAgent...")
            interactive_agent = InteractiveAgent(
                api_key=llm_config.api_key,
                base_url=llm_config.base_url,
                language="en",
                api_version=getattr(llm_config, "api_version", None),
                binding=llm_config.binding,
            )
            interact_res = await interactive_agent.process(test_pt, test_records)
            print("InteractiveAgent Content Generated:")
            print(interact_res.get('content', '')[:100] + "...")
            
            print("\n3. Testing ChatAgent...")
            chat_agent = ChatAgent(
                api_key=llm_config.api_key,
                base_url=llm_config.base_url,
                language="en",
                api_version=getattr(llm_config, "api_version", None),
                binding=llm_config.binding,
            )
            chat_res = await chat_agent.process(test_pt, "Could you explain this simpler?", interact_res.get('content', ''))
            print("ChatAgent Response:")
            print(chat_res.get('answer', '')[:100] + "...")
            
            print("\n4. Testing SummaryAgent...")
            summary_agent = SummaryAgent(
                api_key=llm_config.api_key,
                base_url=llm_config.base_url,
                language="en",
                api_version=getattr(llm_config, "api_version", None),
                binding=llm_config.binding,
            )
            
            # Create a mock learning state for the summary agent
            mock_points = [{"knowledge_title": "Python Control Flow", "status": "completed"}]
            mock_history = [{"role": "user", "content": "Explain simpler"}, {"role": "assistant", "content": chat_res.get('answer', '')}]
            
            sum_res = await summary_agent.process("Test Notebook", mock_points, mock_history)
            print("SummaryAgent Overview:")
            print(sum_res.get('overview', '')[:100] + "...")

        print("\nGuide Module test completed successfully!")
        
    except Exception as e:
        print(f"\nError: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_guide())
