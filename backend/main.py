"""
FastAPI Orchestra Node & Reverse Simulation Backend.
WebSocket Endpoint: /ws
REST Commands Endpoint: /api/command
"""

import asyncio
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import logging

from models import OrchestraCommand, OrchestraEvent, EventType, AgentStatus, LocationTarget, Severity
from connection_manager import manager
from mock_generator import MockEventGenerator
from machine_router import MachineRouter
from tmux_adapter import TmuxAdapter
from crewai_adapter import CrewAIAdapter

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("orchestra_main")

app = FastAPI(title="Reverse Simulation - Orchestra Node Backend", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

mock_gen = MockEventGenerator()
router = MachineRouter()
tmux = TmuxAdapter()


@app.on_event("startup")
async def startup_event():
    logger.info("Orchestra Node Backend starting up...")
    asyncio.create_task(mock_gen.start())


@app.get("/")
async def root():
    return {
        "service": "Orchestra Node - Reverse Simulation",
        "status": "running",
        "schema_version": "1.0",
        "websocket_endpoint": "/ws"
    }


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket, token: str = "dev_token_123"):
    # Security: Verify development token
    if token != "dev_token_123" and token != "local":
        logger.warning(f"Unauthorized WS attempt with token: {token}")
        await websocket.close(code=1008)
        return

    await manager.connect(websocket)
    try:
        # Send initial handshake heartbeat event
        handshake = {
            "schema_version": "1.0",
            "event_id": "handshake_01",
            "event_type": "heartbeat",
            "timestamp": "2026-07-28T07:37:31Z",
            "agent_id": "system",
            "machine_id": "orchestra_core",
            "status": "idle",
            "location_target": "machine_room",
            "animation": "pulse",
            "speech": "Connected to Orchestra Node Backend v1.0",
            "progress": 100,
            "severity": "info"
        }
        await manager.send_personal_message(handshake, websocket)

        while True:
            data = await websocket.receive_text()
            logger.info(f"Received WS payload from Godot: {data}")
            # Handle commands coming directly over WebSocket
            try:
                import json
                payload = json.loads(data)
                if "command_type" in payload:
                    await process_godot_command(payload)
            except Exception as e:
                logger.error(f"Error parsing incoming WS message: {e}")

    except WebSocketDisconnect:
        manager.disconnect(websocket)


@app.post("/api/command")
async def handle_command(cmd: OrchestraCommand):
    """REST endpoint for sending commands from Godot or Web UI."""
    await process_godot_command(cmd.model_dump())
    return {"status": "command_received", "command": cmd.command_type}


async def process_godot_command(cmd_data: dict):
    cmd_type = cmd_data.get("command_type")
    agent_id = cmd_data.get("agent_id", "unknown")
    logger.info(f"Processing command '{cmd_type}' for agent '{agent_id}'")

    # Broadcast command acknowledgment event back to Godot
    ack_event = OrchestraEvent(
        event_id=f"ack_{agent_id}_{cmd_type}",
        event_type=EventType.COMMAND_ACK,
        agent_id=agent_id,
        machine_id=cmd_data.get("preferred_machine", "desktop_gpu"),
        status=AgentStatus.THINKING,
        location_target=LocationTarget.DESK_01,
        animation="thinking",
        speech=f"Received command: {cmd_type}",
        progress=10,
        severity=Severity.INFO,
        metadata=cmd_data
    )
    await manager.broadcast(ack_event.model_dump())

    if cmd_type == "assign_task":
        task_text = cmd_data.get("task", "New assigned task")
        target_machine = router.route_task(task_text, "code", cmd_data.get("preferred_machine"))
        
        # 1. Update event: Agent receives task and begins planning
        event1 = OrchestraEvent(
            event_id=f"evt_assign_{agent_id}",
            event_type=EventType.TASK_CREATED,
            agent_id=agent_id,
            task_id=f"task_{agent_id}_01",
            machine_id=target_machine,
            status=AgentStatus.PLANNING,
            location_target=LocationTarget.DESK_01,
            animation="thinking",
            speech=f"Assigned task: {task_text} on {target_machine}",
            progress=25,
            severity=Severity.INFO
        )
        await manager.broadcast(event1.model_dump())

        # Ensure tmux session exists for real local execution
        session_name = f"tmux-{agent_id}"
        tmux.create_session(session_name)
        tmux.send_keys(session_name, f"echo '[Agent {agent_id}] Starting task: {task_text}'")

    elif cmd_type in ["pause_agent", "interrupt_agent"]:
        event_pause = OrchestraEvent(
            event_id=f"evt_pause_{agent_id}",
            event_type=EventType.AGENT_UPDATE,
            agent_id=agent_id,
            machine_id="desktop_gpu",
            status=AgentStatus.BLOCKED,
            location_target=LocationTarget.ALERT_ZONE,
            animation="stopped",
            speech=f"Agent paused by operator command.",
            progress=0,
            severity=Severity.WARNING
        )
        await manager.broadcast(event_pause.model_dump())

    elif cmd_type == "approve_tool":
        event_appr = OrchestraEvent(
            event_id=f"evt_appr_{agent_id}",
            event_type=EventType.TOOL_CALL_FINISHED,
            agent_id=agent_id,
            machine_id="desktop_gpu",
            status=AgentStatus.USING_TOOL,
            location_target=LocationTarget.TOOL_ROOM,
            animation="typing",
            speech=f"Tool execution approved! Continuing task.",
            progress=60,
            severity=Severity.SUCCESS
        )
        await manager.broadcast(event_appr.model_dump())
