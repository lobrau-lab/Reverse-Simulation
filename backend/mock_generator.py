"""
Mock Event Generator for Orchestra Node.
Simulates autonomous agent movements, status updates, speech bubbles, and progress ticks.
"""

import asyncio
import random
import uuid
from datetime import datetime
from models import OrchestraEvent, EventType, AgentStatus, LocationTarget, Severity
from connection_manager import manager


class MockEventGenerator:
    def __init__(self):
        self.running = False
        self.agents = [
            {
                "id": "engineer_01",
                "machine": "desktop_gpu",
                "desk": LocationTarget.DESK_01,
                "phrases": [
                    "Writing async WebSocket dispatcher",
                    "Compiling Godot 4.6 GDExtension",
                    "Optimizing NavigationAgent2D avoidance",
                    "Refactoring Pydantic v2 event models"
                ]
            },
            {
                "id": "planner_02",
                "machine": "macbook_mlx",
                "desk": LocationTarget.DESK_02,
                "phrases": [
                    "Analyzing multi-machine load balance",
                    "Designing LangGraph feedback loops",
                    "Evaluating MLX 70B response latency",
                    "Structuring Godot signal hierarchy"
                ]
            },
            {
                "id": "toolrunner_03",
                "machine": "spare_pc",
                "desk": LocationTarget.DESK_03,
                "phrases": [
                    "Executing SQLite VACUUM query",
                    "Running tmux send-keys automation",
                    "Polling Tailscale node health",
                    "Verifying tool approval signatures"
                ]
            },
            {
                "id": "evaluator_04",
                "machine": "macbook_mlx",
                "desk": LocationTarget.DESK_04,
                "phrases": [
                    "Auditing WebSocket JSON schemas",
                    "Testing reconnect backoff timer",
                    "Validating ed25519 auth headers",
                    "Running Godot 2D tilemap collision test"
                ]
            }
        ]

    async def start(self):
        self.running = True
        while self.running:
            await asyncio.sleep(6)
            if not manager.active_connections:
                continue

            agent = random.choice(self.agents)
            status = random.choice([
                AgentStatus.WRITING_CODE,
                AgentStatus.THINKING,
                AgentStatus.USING_TOOL,
                AgentStatus.COLLABORATING,
                AgentStatus.REVIEWING
            ])

            loc = agent["desk"]
            anim = "typing"
            if status == AgentStatus.USING_TOOL:
                loc = LocationTarget.TOOL_ROOM
                anim = "walking"
            elif status == AgentStatus.COLLABORATING:
                loc = LocationTarget.MEETING_TABLE
                anim = "talking"
            elif status == AgentStatus.REVIEWING:
                loc = LocationTarget.REVIEW_BOARD
                anim = "reading"
            elif status == AgentStatus.THINKING:
                anim = "thinking"

            speech = random.choice(agent["phrases"])
            event = OrchestraEvent(
                event_id=str(uuid.uuid4()),
                event_type=EventType.AGENT_UPDATE,
                timestamp=datetime.utcnow().isoformat() + "Z",
                agent_id=agent["id"],
                task_id=f"task_{random.randint(100, 999)}",
                machine_id=agent["machine"],
                status=status,
                location_target=loc,
                animation=anim,
                speech=speech,
                progress=random.randint(10, 95),
                severity=Severity.INFO
            )

            await manager.broadcast(event.model_dump())
