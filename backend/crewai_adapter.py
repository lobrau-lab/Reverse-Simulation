"""
CrewAI & LangGraph Agent Framework Adapter.
Dispatches high-level agent tasks into CrewAI tasks or LangGraph state machine events.
"""

import asyncio
from typing import Dict, Any, Callable
from models import AgentStatus, LocationTarget, Severity


class CrewAIAdapter:
    def __init__(self, event_emitter_cb: Callable):
        self.emit_event = event_emitter_cb

    async def execute_task(self, agent_id: str, task_id: str, task_description: str, machine_id: str):
        """Simulate CrewAI sequential/hierarchical task steps and emit events."""
        # 1. Planning step
        await self.emit_event({
            "event_type": "task_progress",
            "agent_id": agent_id,
            "task_id": task_id,
            "machine_id": machine_id,
            "status": AgentStatus.PLANNING,
            "location_target": LocationTarget.DESK_01,
            "animation": "thinking",
            "speech": f"Decomposing task: '{task_description}' into CrewAI steps",
            "progress": 15,
            "severity": Severity.INFO
        })
        await asyncio.sleep(2)

        # 2. Tool Execution step
        await self.emit_event({
            "event_type": "tool_call_started",
            "agent_id": agent_id,
            "task_id": task_id,
            "machine_id": machine_id,
            "status": AgentStatus.USING_TOOL,
            "location_target": LocationTarget.TOOL_ROOM,
            "animation": "walking",
            "speech": "Invoking Serper / CodeInterpreter Crew Tool...",
            "progress": 45,
            "severity": Severity.INFO
        })
        await asyncio.sleep(2)

        # 3. Code & Synthesis step
        await self.emit_event({
            "event_type": "agent_update",
            "agent_id": agent_id,
            "task_id": task_id,
            "machine_id": machine_id,
            "status": AgentStatus.WRITING_CODE,
            "location_target": LocationTarget.DESK_01,
            "animation": "typing",
            "speech": "Writing final output artifact in CrewAI memory",
            "progress": 85,
            "severity": Severity.INFO
        })
        await asyncio.sleep(2)

        # 4. Completed step
        await self.emit_event({
            "event_type": "task_completed",
            "agent_id": agent_id,
            "task_id": task_id,
            "machine_id": machine_id,
            "status": AgentStatus.COMPLETED_TASK,
            "location_target": LocationTarget.DESK_01,
            "animation": "celebrating",
            "speech": "CrewAI task execution finished successfully!",
            "progress": 100,
            "severity": Severity.SUCCESS
        })
