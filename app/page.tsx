'use client';

import React, { useState, useEffect } from 'react';
import { AgentInfo, AutonomyLevel, MachineNode, OrchestraEvent } from '@/lib/orchestra-types';
import { INITIAL_AGENTS, INITIAL_MACHINES, ROOM_COORDINATES } from '@/lib/orchestra-state';
import { OfficeCanvas } from '@/components/OfficeCanvas';
import { AgentInspector } from '@/components/AgentInspector';
import { TaskDispatcher } from '@/components/TaskDispatcher';
import { MachineNodePanel } from '@/components/MachineNodePanel';
import { GodotCodeViewer } from '@/components/GodotCodeViewer';
import { ToolApprovalModal } from '@/components/ToolApprovalModal';
import { EventLogConsole } from '@/components/EventLogConsole';
import {
  Gamepad2,
  Server,
  Terminal,
  Code2,
  Activity,
  Layers,
  Sparkles,
  Wifi,
  Play,
  Pause,
} from 'lucide-react';

export default function OrchestraDashboard() {
  const [agents, setAgents] = useState<AgentInfo[]>(INITIAL_AGENTS);
  const [machines, setMachines] = useState<MachineNode[]>(INITIAL_MACHINES);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>('engineer_01');
  const [events, setEvents] = useState<OrchestraEvent[]>([]);
  const [logsByAgent, setLogsByAgent] = useState<Record<string, string[]>>({
    engineer_01: ['[tmux-kira-dev] Active session initialized on RTX 4090 GPU node.'],
    planner_02: ['[tmux-orion-arch] MLX 70B local endpoint listening on port 8080.'],
    toolrunner_03: ['[tmux-rox-tools] Spare Linux node connected via Tailscale.'],
    evaluator_04: ['[tmux-vesper-qa] Code audit worker started.'],
  });

  const [activeTab, setActiveTab] = useState<'canvas' | 'hardware' | 'code'>('canvas');
  const [simulating, setSimulating] = useState(true);

  // Tool Approval Modal State
  const [approvalModal, setApprovalModal] = useState<{
    isOpen: boolean;
    agentId: string;
    toolName: string;
    args: Record<string, any>;
  }>({
    isOpen: false,
    agentId: '',
    toolName: '',
    args: {},
  });

  const selectedAgent = agents.find((a) => a.id === selectedAgentId) || null;

  // Add event helper
  const pushEvent = (evt: OrchestraEvent) => {
    setEvents((prev) => [evt, ...prev.slice(0, 49)]);
  };

  // Dispatch new task from UI
  const handleDispatchTask = async (
    agentId: string,
    taskPrompt: string,
    preferredMachine: string,
    autonomy: AutonomyLevel
  ) => {
    // 1. Local event broadcast
    const newEvt: OrchestraEvent = {
      schema_version: '1.0',
      event_id: `evt_${Date.now()}`,
      event_type: 'task_created',
      timestamp: new Date().toISOString(),
      agent_id: agentId,
      machine_id: preferredMachine,
      status: 'planning',
      location_target: 'desk_01',
      animation: 'thinking',
      speech: `Received task: "${taskPrompt}"`,
      progress: 15,
      severity: 'info',
    };
    pushEvent(newEvt);

    // Append to logs
    setLogsByAgent((prev) => ({
      ...prev,
      [agentId]: [
        ...(prev[agentId] || []),
        `[${new Date().toLocaleTimeString()}] DISPATCH -> "${taskPrompt}" (Target Node: ${preferredMachine})`,
      ],
    }));

    // Update agent state
    setAgents((prev) =>
      prev.map((a) => {
        if (a.id === agentId) {
          const roomTarget = ROOM_COORDINATES[a.assigned_desk] || { x: 200, y: 200 };
          return {
            ...a,
            current_status: 'planning',
            current_task_title: taskPrompt,
            autonomy,
            active_machine: preferredMachine,
            speech_bubble: `Planning task: ${taskPrompt.slice(0, 24)}...`,
            target_x: roomTarget.x,
            target_y: roomTarget.y,
            progress: 20,
          };
        }
        return a;
      })
    );

    // Call server API (uses Gemini API server-side for generating AI agent thoughts!)
    try {
      const res = await fetch('/api/orchestra', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate_agent_step',
          agent_id: agentId,
          machine_id: preferredMachine,
          prompt: taskPrompt,
        }),
      });
      const data = await res.json();
      if (data.speech) {
        setAgents((prev) =>
          prev.map((a) => (a.id === agentId ? { ...a, speech_bubble: data.speech, progress: 40 } : a))
        );
        setLogsByAgent((prev) => ({
          ...prev,
          [agentId]: [...(prev[agentId] || []), `[Gemini Server Step] -> ${data.speech}`],
        }));
      }
    } catch (e) {
      console.error('API call failed', e);
    }

    // Trigger tool approval check if ask_before_tools
    if (autonomy === 'ask_before_tools') {
      setTimeout(() => {
        setApprovalModal({
          isOpen: true,
          agentId,
          toolName: 'execute_shell_script',
          args: { command: 'cargo build --release', dir: '/workspace/export_engine' },
        });
      }, 2500);
    }
  };

  // Agent Quick Action handler
  const handleAgentAction = (actionType: string, agentId: string, autonomy?: AutonomyLevel) => {
    if (actionType === 'set_autonomy' && autonomy) {
      setAgents((prev) =>
        prev.map((a) => (a.id === agentId ? { ...a, autonomy } : a))
      );
      setLogsByAgent((prev) => ({
        ...prev,
        [agentId]: [
          ...(prev[agentId] || []),
          `[Autonomy Change] -> Switched autonomy level to: ${autonomy}`,
        ],
      }));
      return;
    }

    setLogsByAgent((prev) => ({
      ...prev,
      [agentId]: [
        ...(prev[agentId] || []),
        `[Control Command] -> ${actionType.toUpperCase()}`,
      ],
    }));

    if (actionType === 'pause_agent') {
      setAgents((prev) =>
        prev.map((a) =>
          a.id === agentId
            ? {
                ...a,
                current_status: 'blocked',
                speech_bubble: 'Agent paused by operator',
                target_x: 740, // Alert Zone
                target_y: 520,
              }
            : a
        )
      );
    } else if (actionType === 'resume_agent') {
      setAgents((prev) =>
        prev.map((a) => {
          if (a.id === agentId) {
            const roomTarget = ROOM_COORDINATES[a.assigned_desk] || { x: 200, y: 200 };
            return {
              ...a,
              current_status: 'writing_code',
              speech_bubble: 'Resuming agent work...',
              target_x: roomTarget.x,
              target_y: roomTarget.y,
            };
          }
          return a;
        })
      );
    }
  };

  // Tool Approval Modal Callbacks
  const handleApproveTool = () => {
    const { agentId, toolName } = approvalModal;
    setApprovalModal((prev) => ({ ...prev, isOpen: false }));
    setLogsByAgent((prev) => ({
      ...prev,
      [agentId]: [
        ...(prev[agentId] || []),
        `[Tool Approval] APPROVED -> Tool '${toolName}' executed successfully.`,
      ],
    }));
    setAgents((prev) =>
      prev.map((a) =>
        a.id === agentId
          ? {
              ...a,
              current_status: 'using_tool',
              speech_bubble: `Tool ${toolName} executed!`,
              target_x: 740, // Tool Room
              target_y: 160,
              progress: 85,
            }
          : a
      )
    );
  };

  const handleDenyTool = () => {
    const { agentId, toolName } = approvalModal;
    setApprovalModal((prev) => ({ ...prev, isOpen: false }));
    setLogsByAgent((prev) => ({
      ...prev,
      [agentId]: [
        ...(prev[agentId] || []),
        `[Tool Approval] DENIED -> Tool '${toolName}' was blocked by operator.`,
      ],
    }));
    setAgents((prev) =>
      prev.map((a) =>
        a.id === agentId
          ? {
              ...a,
              current_status: 'blocked',
              speech_bubble: `Tool execution denied by operator`,
              target_x: 740, // Alert Zone
              target_y: 520,
            }
          : a
      )
    );
  };

  // Simulation Loop: periodically triggers autonomous agent interactions
  useEffect(() => {
    if (!simulating) return;

    const interval = setInterval(() => {
      setAgents((prev) => {
        const randomIndex = Math.floor(Math.random() * prev.length);
        const agent = prev[randomIndex];

        // Random status choices
        const statuses = [
          { status: 'writing_code', target: 'desk_01', anim: 'typing', text: 'Compiling Rust modules...' },
          { status: 'using_tool', target: 'tool_room', anim: 'walking', text: 'Running SQLite migration...' },
          { status: 'collaborating', target: 'meeting_table', anim: 'talking', text: 'Syncing Godot signals...' },
          { status: 'reviewing', target: 'review_board', anim: 'reading', text: 'Auditing security rules...' },
        ] as const;

        const choice = statuses[Math.floor(Math.random() * statuses.length)];
        const targetCoord = ROOM_COORDINATES[choice.target] || ROOM_COORDINATES[agent.assigned_desk];

        return prev.map((a, idx) => {
          if (idx === randomIndex) {
            return {
              ...a,
              current_status: choice.status as any,
              speech_bubble: choice.text,
              target_x: targetCoord.x,
              target_y: targetCoord.y,
              progress: Math.min(100, (a.progress + 12) % 100 || 20),
            };
          }
          return a;
        });
      });
    }, 7000);

    return () => clearInterval(interval);
  }, [simulating]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-900/90 backdrop-blur px-6 py-3">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 shadow-lg shadow-indigo-500/20 text-white font-bold">
              <Gamepad2 className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-base font-semibold tracking-tight text-slate-100 flex items-center gap-2">
                REVERSE SIMULATION
                <span className="rounded bg-indigo-950 px-2 py-0.5 text-[10px] font-mono text-indigo-400 border border-indigo-800">
                  Orchestra Node v1.0
                </span>
              </h1>
              <p className="text-xs text-slate-400 font-mono">
                Godot 4.x 2D Office Frontend + Multi-Agent Local Execution Server
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 font-mono text-xs">
            <div className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-slate-300">
              <Wifi className="h-3.5 w-3.5 text-emerald-400" />
              <span>Tailscale Mesh: Connected</span>
            </div>

            <button
              onClick={() => setSimulating(!simulating)}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium transition-all border ${
                simulating
                  ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                  : 'border-slate-700 bg-slate-800 text-slate-300'
              }`}
            >
              {simulating ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
              {simulating ? 'SIMULATION ACTIVE' : 'SIMULATION PAUSED'}
            </button>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="border-b border-slate-800 bg-slate-900/50 px-6 py-2">
        <div className="mx-auto flex max-w-7xl items-center gap-4 text-xs font-mono">
          <button
            onClick={() => setActiveTab('canvas')}
            className={`flex items-center gap-2 rounded-lg px-3 py-1.5 transition-all ${
              activeTab === 'canvas'
                ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Gamepad2 className="h-4 w-4" /> 2D Godot Office Simulator
          </button>
          <button
            onClick={() => setActiveTab('hardware')}
            className={`flex items-center gap-2 rounded-lg px-3 py-1.5 transition-all ${
              activeTab === 'hardware'
                ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Server className="h-4 w-4" /> Hardware Nodes & Routing
          </button>
          <button
            onClick={() => setActiveTab('code')}
            className={`flex items-center gap-2 rounded-lg px-3 py-1.5 transition-all ${
              activeTab === 'code'
                ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Code2 className="h-4 w-4" /> Godot GDScript & Python Source
          </button>
        </div>
      </div>

      {/* Main Content Body */}
      <main className="mx-auto max-w-7xl p-6">
        {activeTab === 'canvas' && (
          <div className="flex flex-col gap-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* 2D Visual Office Viewport */}
              <div className="lg:col-span-2">
                <OfficeCanvas
                  agents={agents}
                  selectedAgentId={selectedAgentId}
                  onSelectAgent={(id) => setSelectedAgentId(id)}
                />
              </div>

              {/* Selected Agent Inspector */}
              <div className="lg:col-span-1">
                <AgentInspector
                  agent={selectedAgent}
                  onSendAction={handleAgentAction}
                  logs={selectedAgent ? logsByAgent[selectedAgent.id] || [] : []}
                />
              </div>
            </div>

            {/* Task Dispatcher Form */}
            <TaskDispatcher
              agents={agents}
              machines={machines}
              onDispatchTask={handleDispatchTask}
            />

            {/* Event Log Console */}
            <EventLogConsole events={events} onClear={() => setEvents([])} />
          </div>
        )}

        {activeTab === 'hardware' && (
          <div className="flex flex-col gap-6">
            <MachineNodePanel machines={machines} />
            <TaskDispatcher
              agents={agents}
              machines={machines}
              onDispatchTask={handleDispatchTask}
            />
          </div>
        )}

        {activeTab === 'code' && (
          <div>
            <GodotCodeViewer />
          </div>
        )}
      </main>

      {/* Tool Approval Modal Popup */}
      <ToolApprovalModal
        isOpen={approvalModal.isOpen}
        agentId={approvalModal.agentId}
        toolName={approvalModal.toolName}
        toolArgs={approvalModal.args}
        onApprove={handleApproveTool}
        onDeny={handleDenyTool}
      />
    </div>
  );
}
