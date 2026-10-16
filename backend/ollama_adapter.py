"""
Ollama / llama.cpp Local Endpoint Adapter.
Interacts with local Ollama instances (e.g. RTX desktop GPU or spare PC).
"""

import aiohttp
import json
import logging
from typing import AsyncGenerator, Dict, Any

logger = logging.getLogger("ollama_adapter")


class OllamaAdapter:
    def __init__(self, host: str = "http://localhost:11434"):
        self.host = host

    async def check_health(self) -> bool:
        """Verify Ollama service is reachable."""
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(f"{self.host}/api/version", timeout=3) as resp:
                    return resp.status == 200
        except Exception:
            return False

    async def list_models(self) -> list:
        """List locally pulled models."""
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(f"{self.host}/api/tags") as resp:
                    if resp.status == 200:
                        data = await resp.json()
                        return [m["name"] for m in data.get("models", [])]
        except Exception as e:
            logger.warning(f"Could not list Ollama models from {self.host}: {e}")
        return ["qwen2.5-coder:32b", "deepseek-r1:8b", "llama3.3:70b"]

    async def generate_stream(self, prompt: str, model: str = "qwen2.5-coder:32b") -> AsyncGenerator[str, None]:
        """Stream response chunks from Ollama API."""
        url = f"{self.host}/api/generate"
        payload = {"model": model, "prompt": prompt, "stream": True}
        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(url, json=payload) as resp:
                    async for line in resp.content:
                        if line:
                            data = json.loads(line)
                            yield data.get("response", "")
        except Exception as e:
            logger.error(f"Ollama generation failed: {e}")
            yield f"[Ollama local stream mock output for prompt: '{prompt}']"
