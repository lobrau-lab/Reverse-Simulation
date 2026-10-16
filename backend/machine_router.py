"""
Machine Node Router for Orchestra Node Backend.
Routes agent tasks to optimal hardware based on capabilities, vRAM, and task type.
"""

from typing import Dict, Any, Optional
import logging

logger = logging.getLogger("machine_router")


class MachineRouter:
    def __init__(self):
        self.nodes = {
            "desktop_gpu": {
                "name": "Rig RTX 4090 Desktop",
                "vram_gb": 24,
                "preferred_tasks": ["writing_code", "heavy_synthesis", "comfyui_vision"],
                "status": "online"
            },
            "macbook_mlx": {
                "name": "MacBook Pro M3 Max (MLX)",
                "vram_gb": 36,
                "preferred_tasks": ["planning", "reasoning", "long_context"],
                "status": "online"
            },
            "spare_pc": {
                "name": "Spare i3 Linux Node",
                "vram_gb": 0,
                "preferred_tasks": ["using_tool", "sqlite_migrations", "cron_jobs"],
                "status": "online"
            },
            "android_termux": {
                "name": "Termux Android Node",
                "vram_gb": 0,
                "preferred_tasks": ["adb_automation", "mobile_testing", "light_polling"],
                "status": "online"
            }
        }

    def route_task(self, task_description: str, task_type: str, user_preference: Optional[str] = None) -> str:
        """Determines best machine node ID for a task."""
        if user_preference and user_preference in self.nodes:
            logger.info(f"User specified preference '{user_preference}' for task")
            return user_preference

        desc_lower = task_description.lower()
        if "code" in desc_lower or "build" in desc_lower or "export" in desc_lower:
            return "desktop_gpu"
        elif "plan" in desc_lower or "architect" in desc_lower or "design" in desc_lower:
            return "macbook_mlx"
        elif "db" in desc_lower or "tool" in desc_lower or "migrate" in desc_lower or "bash" in desc_lower:
            return "spare_pc"
        elif "mobile" in desc_lower or "android" in desc_lower or "notification" in desc_lower:
            return "android_termux"

        return "desktop_gpu"
