"""Diagnostic script to verify LLM binding and configuration."""
import os
import sys
from pathlib import Path

# Add project to path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from dotenv import load_dotenv
load_dotenv(project_root / ".env")

print("=" * 60)
print("LLM Configuration Diagnostic")
print("=" * 60)

# Check environment variables
print("\n1. Environment Variables:")
print(f"   LLM_BINDING: {os.getenv('LLM_BINDING')}")
print(f"   LLM_MODEL: {os.getenv('LLM_MODEL')}")
print(f"   LLM_HOST: {os.getenv('LLM_HOST')}")
print(f"   LLM_API_KEY: {os.getenv('LLM_API_KEY', '')[:10]}...")

# Check unified config
print("\n2. Unified Config (get_active_llm_config):")
try:
    from src.services.config import get_active_llm_config
    config = get_active_llm_config()
    if config:
        print(f"   provider: {config.get('provider')}")
        print(f"   model: {config.get('model')}")
        print(f"   base_url: {config.get('base_url')}")
    else:
        print("   No active config found")
except Exception as e:
    print(f"   Error: {e}")

# Check LLM config
print("\n3. LLM Config (get_llm_config):")
try:
    from src.services.llm.config import get_llm_config
    llm_config = get_llm_config()
    print(f"   binding: {llm_config.binding}")
    print(f"   model: {llm_config.model}")
    print(f"   base_url: {llm_config.base_url}")
except Exception as e:
    print(f"   Error: {e}")

# Check BaseAgent initialization
print("\n4. BaseAgent Test:")
try:
    from src.agents.chat.chat_agent import ChatAgent
    agent = ChatAgent(language="en")
    print(f"   agent.binding: {agent.binding}")
    print(f"   agent.model: {agent.model}")
    print(f"   agent.base_url: {agent.base_url}")
except Exception as e:
    print(f"   Error: {e}")

print("\n" + "=" * 60)
