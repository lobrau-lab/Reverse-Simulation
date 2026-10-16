"""
Apple Silicon MLX Server Adapter.
Communicates with Apple MLX LM Studio or mlx-lm-server on macOS M-Series hardware.
"""

import aiohttp
import logging
from typing import Dict, Any

logger = logging.getLogger("mlx_adapter")


class MLXAdapter:
    def __init__(self, host: str = "http://localhost:8080"):
        self.host = host

    async def generate_completion(self, prompt: str, model: str = "mlx-community/Llama-3.3-70B-Instruct-4bit") -> str:
        """Query local MLX server via OpenAI-compatible endpoint."""
        url = f"{self.host}/v1/chat/completions"
        payload = {
            "model": model,
            "messages": [{"role": "user", "content": prompt}],
            "temperature": 0.3,
            "max_tokens": 1024
        }
        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(url, json=payload, timeout=30) as resp:
                    if resp.status == 200:
                        data = await resp.json()
                        return data["choices"][0]["message"]["content"]
        except Exception as e:
            logger.warning(f"MLX server at {self.host} not responding, using mock: {e}")
        return f"[Apple Silicon MLX 4-bit local output for '{prompt}']"
