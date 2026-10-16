"""
Pydantic schemas for Reverse Simulation / Orchestra Node backend.
Protocol Schema Version: 1.0
"""

from enum import Enum
from typing import Any, Dict, Optional
from pydantic import BaseModel, Field
from datetime import datetime


class AgentStatus(str, Enum):
    IDLE = "idle"
    THINKING = "thinking"
    PLANNING = "planning"
    WRITING_CODE = "writing_code"
    USING_TOOL = "using_tool"
    WAITING_FOR_TOOL = "waiting_for_tool"
    COLLABORATING = "collaborating"
    REVIEWING = "reviewing"
    COMPLETED_TASK = "completed_task"
    FAILED = "failed"
    BLOCKED = "blocked"
    OFFLINE = "offline"


class AutonomyLevel(str, Enum):
    CHAT_ONLY = "chat_only"
    ASK_BEFORE_TOOLS = "ask_before_tools"
    TRUSTED_TASKS = "trusted_tasks"
    AUTONOMOUS = "autonomous"


class LocationTarget(str, Enum):
    DESK_01 = "desk_01"
    DESK_02 = "desk_02"
    DESK_03 = "desk_03"
    DESK_04 = "desk_04"
    MEETING_TABLE = "meeting_table"
    TOOL_ROOM = "tool_room"
    REVIEW_BOARD = "review_board"
    WATER_COOLER = "water_cooler"
    ALERT_ZONE = "alert_zone"
    TERMINAL_ROOM = "terminal_room"
    MACHINE_ROOM = "machine_room"


class Severity(str, Enum):
    INFO = "info"
    WARNING = "warning"
    ERROR = "error"
    SUCCESS = "success"


class EventType(str, Enum):
    AGENT_UPDATE = "agent_update"
    TASK_CREATED = "task_created"
    TASK_PROGRESS = "task_progress"
    TASK_COMPLETED = "task_completed"
    TASK_FAILED = "task_failed"
    TOOL_CALL_STARTED = "tool_call_started"
    TOOL_CALL_FINISHED = "tool_call_finished"
    APPROVAL_REQUESTED = "approval_requested"
    HEARTBEAT = "heartbeat"
    MACHINE_STATUS = "machine_status"
    LOG_LINE = "log_line"
    COMMAND_ACK = "command_ack"


class OrchestraEvent(BaseModel):
    schema_version: str = Field(default="1.0")
    event_id: str
    event_type: EventType
    timestamp: str = Field(default_factory=lambda: datetime.utcnow().isoformat() + "Z")
    agent_id: str
    task_id: Optional[str] = None
    machine_id: str
    status: AgentStatus
    location_target: LocationTarget
    animation: str
    speech: Optional[str] = None
    progress: Optional[int] = Field(default=0, ge=0, le=100)
    severity: Severity = Severity.INFO
    metadata: Optional[Dict[str, Any]] = None


class CommandType(str, Enum):
    ASSIGN_TASK = "assign_task"
    PAUSE_AGENT = "pause_agent"
    RESUME_AGENT = "resume_agent"
    INTERRUPT_AGENT = "interrupt_agent"
    RETRY_TASK = "retry_task"
    TERMINATE_AGENT = "terminate_agent"
    APPROVE_TOOL = "approve_tool"
    DENY_TOOL = "deny_tool"
    SET_AUTONOMY = "set_autonomy"
    ROUTE_TO_MACHINE = "route_to_machine"


class OrchestraCommand(BaseModel):
    command_type: CommandType
    agent_id: str
    task: Optional[str] = None
    task_id: Optional[str] = None
    autonomy: Optional[AutonomyLevel] = None
    preferred_machine: Optional[str] = None
    tool_name: Optional[str] = None
