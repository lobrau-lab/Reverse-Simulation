'use client';

import React from 'react';
import { AgentInfo, AutonomyLevel } from '@/lib/orchestra-types';
import { Play, Pause, AlertOctagon, RefreshCw, Terminal, Cpu, ShieldAlert } from 'lucide-react';

interface AgentInspectorProps {
  agent: AgentInfo | null;
  onSendAction: (actionType: string, agentId: string, autonomy?: AutonomyLevel) => void;
  logs: string[];
}

export const AgentInspector: React.FC<AgentInspectorProps> = ({
  agent,
  onSendAction,
  logs,
}) => {
  if (!agent) {
    return (
      <div className="flex h-full flex-col items-center justify-center rounded-xl border border-slate-800 bg-slate-900/50 p-6 text-center text-slate-500">
        <Terminal className="mb-3 h-8 w-8 opacity-40" />
        <p className="text-sm font-medium">Select an agent on the Godot office floor to inspect telemetry, tmux session, and control autonomy.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-slate-800 bg-slate-900 p-5 text-slate-200 shadow-xl">
      {/* Header */}
      <div className="flex items-start justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-800 text-2xl shadow-inner border border-slate-700">
            {agent.avatar}
          </div>
          <div>
            <h3 className="font-semibold text-slate-100 flex items-center gap-2">
              {agent.name}
              <span className="rounded bg-slate-800 px-2 py-0.5 text-xs font-mono text-slate-400 border border-slate-700">
                {agent.id}
              </span>
            </h3>
            <p className="text-xs text-slate-400">{agent.role}</p>
          </div>
        </div>
      </div>

      {/* Grid Specs */}
      <div className="grid grid-cols-2 gap-3 text-xs">
        <div className="rounded-lg bg-slate-950 p-2.5 border border-slate-800">
          <span className="text-slate-500 font-mono block mb-1">CURRENT STATUS</span>
          <span className="font-semibold text-emerald-400 capitalize">{agent.current_status}</span>
        </div>
        <div className="rounded-lg bg-slate-950 p-2.5 border border-slate-800">
          <span className="text-slate-500 font-mono block mb-1">TARGET MACHINE</span>
          <span className="font-semibold text-blue-400 flex items-center gap-1">
            <Cpu className="h-3 w-3" />
            {agent.active_machine}
          </span>
        </div>
        <div className="rounded-lg bg-slate-950 p-2.5 border border-slate-800">
          <span className="text-slate-500 font-mono block mb-1">TMUX SESSION</span>
          <span className="font-mono text-slate-300">{agent.tmux_session || `tmux-${agent.id}`}</span>
        </div>
        <div className="rounded-lg bg-slate-950 p-2.5 border border-slate-800">
          <span className="text-slate-500 font-mono block mb-1">TASK PROGRESS</span>
          <div className="flex items-center gap-2 mt-1">
            <div className="h-1.5 flex-1 rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-emerald-500 transition-all duration-300"
                style={{ width: `${agent.progress}%` }}
              ></div>
            </div>
            <span className="font-mono text-slate-300">{agent.progress}%</span>
          </div>
        </div>
      </div>

      {/* Autonomy Controls */}
      <div className="rounded-lg border border-slate-800 bg-slate-950 p-3">
        <label className="text-xs font-mono text-slate-400 flex items-center gap-1.5 mb-2">
          <ShieldAlert className="h-3.5 w-3.5 text-amber-400" />
          AUTONOMY LEVEL
        </label>
        <div className="grid grid-cols-2 gap-1.5">
          {(['chat_only', 'ask_before_tools', 'trusted_tasks', 'autonomous'] as AutonomyLevel[]).map((level) => (
            <button
              key={level}
              onClick={() => onSendAction('set_autonomy', agent.id, level)}
              className={`rounded-md px-2.5 py-1.5 text-xs font-mono transition-all border ${
                agent.autonomy === level
                  ? 'bg-indigo-600/30 text-indigo-300 border-indigo-500 shadow-sm'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200'
              }`}
            >
              {level.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Quick Action Controls */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => onSendAction('pause_agent', agent.id)}
          className="flex-1 flex items-center justify-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs font-medium text-amber-400 hover:bg-amber-500/20"
        >
          <Pause className="h-3.5 w-3.5" /> Pause
        </button>
        <button
          onClick={() => onSendAction('resume_agent', agent.id)}
          className="flex-1 flex items-center justify-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs font-medium text-emerald-400 hover:bg-emerald-500/20"
        >
          <Play className="h-3.5 w-3.5" /> Resume
        </button>
        <button
          onClick={() => onSendAction('interrupt_agent', agent.id)}
          className="flex-1 flex items-center justify-center gap-1.5 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs font-medium text-rose-400 hover:bg-rose-500/20"
        >
          <AlertOctagon className="h-3.5 w-3.5" /> Interrupt
        </button>
        <button
          onClick={() => onSendAction('retry_task', agent.id)}
          className="flex flex-items-center justify-center rounded-lg border border-slate-700 bg-slate-800 p-2 text-slate-300 hover:bg-slate-700"
          title="Retry Task"
        >
          <RefreshCw className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Live Terminal / tmux Output */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between text-xs font-mono text-slate-400">
          <span className="flex items-center gap-1.5">
            <Terminal className="h-3.5 w-3.5 text-emerald-400" />
            TMUX OUTPUT STREAM
          </span>
          <span className="text-[10px] text-slate-500">pty: /dev/pts/2</span>
        </div>
        <div className="h-36 overflow-y-auto rounded-lg border border-slate-800 bg-slate-950 p-3 font-mono text-[11px] text-emerald-400 leading-relaxed">
          {logs.length === 0 ? (
            <p className="text-slate-600 italic">[Waiting for agent execution output...]</p>
          ) : (
            logs.map((log, idx) => (
              <div key={idx} className="whitespace-pre-wrap border-b border-slate-900/60 pb-1">
                {log}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
