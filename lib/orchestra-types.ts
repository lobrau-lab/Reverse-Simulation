export type AgentStatus =
  | 'idle'
  | 'thinking'
  | 'planning'
  | 'writing_code'
  | 'using_tool'
  | 'waiting_for_tool'
  | 'collaborating'
  | 'reviewing'
  | 'completed_task'
  | 'failed'
  | 'blocked'
  | 'offline';

export type AutonomyLevel =
  | 'chat_only'
  | 'ask_before_tools'
  | 'trusted_tasks'
  | 'autonomous';

export type EventType =
  | 'agent_update'
  | 'task_created'
  | 'task_progress'
  | 'task_completed'
  | 'task_failed'
  | 'tool_call_started'
  | 'tool_call_finished'
  | 'approval_requested'
  | 'heartbeat'
  | 'machine_status'
  | 'log_line'
  | 'command_ack';

export type LocationTarget =
  | 'desk_01'
  | 'desk_02'
  | 'desk_03'
  | 'desk_04'
  | 'meeting_table'
  | 'tool_room'
  | 'review_board'
  | 'water_cooler'
  | 'alert_zone'
  | 'terminal_room'
  | 'machine_room';

export type Severity = 'info' | 'warning' | 'error' | 'success';

export interface OrchestraEvent {
  schema_version: '1.0';
  event_id: string;
  event_type: EventType;
  timestamp: string;
  agent_id: string;
  task_id?: string;
  machine_id: string;
  status: AgentStatus;
  location_target: LocationTarget;
  animation: string;
  speech?: string;
  progress?: number;
  severity: Severity;
  metadata?: Record<string, any>;
}

export interface AgentInfo {
  id: string;
  name: string;
  role: string;
  assigned_desk: LocationTarget;
  current_status: AgentStatus;
  current_task_id?: string;
  current_task_title?: string;
  autonomy: AutonomyLevel;
  preferred_machine: string;
  active_machine: string;
  tmux_session?: string;
  color: string;
  avatar: string;
  x: number;
  y: number;
  target_x: number;
  target_y: number;
  speech_bubble?: string;
  progress: number;
}

export interface MachineNode {
  id: string;
  name: string;
  type: 'desktop_gpu' | 'macbook_mlx' | 'spare_pc' | 'android_termux';
  ip: string;
  tailscale_ip?: string;
  status: 'online' | 'busy' | 'offline';
  gpu_vram_used_gb: number;
  gpu_vram_total_gb: number;
  cpu_usage_pct: number;
  ram_used_gb: number;
  ram_total_gb: number;
  active_engines: string[]; // e.g. ['ollama:qwen2.5-coder', 'mlx-server:llama-3.3-70b']
  active_sessions: number;
}

export interface TaskItem {
  id: string;
  title: string;
  agent_id: string;
  assigned_machine: string;
  autonomy: AutonomyLevel;
  status: 'pending' | 'in_progress' | 'awaiting_approval' | 'completed' | 'failed';
  progress: number;
  created_at: string;
  logs: string[];
  pending_tool?: {
    tool_name: string;
    args: Record<string, any>;
  };
}

export interface OrchestraCommand {
  command_type:
    | 'assign_task'
    | 'pause_agent'
    | 'resume_agent'
    | 'interrupt_agent'
    | 'retry_task'
    | 'terminate_agent'
    | 'approve_tool'
    | 'deny_tool'
    | 'set_autonomy'
    | 'route_to_machine';
  agent_id: string;
  task?: string;
  task_id?: string;
  autonomy?: AutonomyLevel;
  preferred_machine?: string;
  tool_name?: string;
}
