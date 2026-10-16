'use client';

import React, { useState } from 'react';
import { AgentInfo, AutonomyLevel, MachineNode } from '@/lib/orchestra-types';
import { Send, Cpu, Shield, Sparkles } from 'lucide-react';

interface TaskDispatcherProps {
  agents: AgentInfo[];
  machines: MachineNode[];
  onDispatchTask: (
    agentId: string,
    taskPrompt: string,
    preferredMachine: string,
    autonomy: AutonomyLevel
  ) => void;
}

export const TaskDispatcher: React.FC<TaskDispatcherProps> = ({
  agents,
  machines,
  onDispatchTask,
}) => {
  const [taskPrompt, setTaskPrompt] = useState('');
  const [selectedAgent, setSelectedAgent] = useState(agents[0]?.id || 'engineer_01');
  const [preferredMachine, setPreferredMachine] = useState(machines[0]?.id || 'desktop_gpu');
  const [autonomy, setAutonomy] = useState<AutonomyLevel>('ask_before_tools');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskPrompt.trim()) return;
    onDispatchTask(selectedAgent, taskPrompt, preferredMachine, autonomy);
    setTaskPrompt('');
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 rounded-xl border border-slate-800 bg-slate-900 p-5 text-slate-200 shadow-xl"
    >
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <h3 className="font-semibold text-slate-100 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-indigo-400" />
          Dispatch Agent Task (Godot & Backend Broadcast)
        </h3>
        <span className="text-xs font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-2 py-0.5 rounded">
          WS Command Protocol v1.0
        </span>
      </div>

      <div>
        <label className="block text-xs font-mono text-slate-400 mb-1">TASK DESCRIPTION</label>
        <textarea
          rows={2}
          value={taskPrompt}
          onChange={(e) => setTaskPrompt(e.target.value)}
          placeholder="e.g. Build the SQLite export engine module and optimize vector pathfinding..."
          className="w-full rounded-lg border border-slate-800 bg-slate-950 p-3 text-xs text-slate-100 placeholder-slate-600 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
        />
      </div>

      <div className="grid grid-cols-3 gap-3">
        {/* Select Agent */}
        <div>
          <label className="block text-xs font-mono text-slate-400 mb-1">ASSIGN AGENT</label>
          <select
            value={selectedAgent}
            onChange={(e) => setSelectedAgent(e.target.value)}
            className="w-full rounded-lg border border-slate-800 bg-slate-950 p-2 text-xs text-slate-200 font-mono focus:border-indigo-500 focus:outline-none"
          >
            {agents.map((a) => (
              <option key={a.id} value={a.id}>
                {a.avatar} {a.name}
              </option>
            ))}
          </select>
        </div>

        {/* Preferred Hardware Machine */}
        <div>
          <label className="block text-xs font-mono text-slate-400 mb-1 flex items-center gap-1">
            <Cpu className="h-3 w-3" /> PREFERRED NODE
          </label>
          <select
            value={preferredMachine}
            onChange={(e) => setPreferredMachine(e.target.value)}
            className="w-full rounded-lg border border-slate-800 bg-slate-950 p-2 text-xs text-slate-200 font-mono focus:border-indigo-500 focus:outline-none"
          >
            {machines.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>

        {/* Autonomy Level */}
        <div>
          <label className="block text-xs font-mono text-slate-400 mb-1 flex items-center gap-1">
            <Shield className="h-3 w-3" /> AUTONOMY
          </label>
          <select
            value={autonomy}
            onChange={(e) => setAutonomy(e.target.value as AutonomyLevel)}
            className="w-full rounded-lg border border-slate-800 bg-slate-950 p-2 text-xs text-slate-200 font-mono focus:border-indigo-500 focus:outline-none"
          >
            <option value="chat_only">chat_only</option>
            <option value="ask_before_tools">ask_before_tools</option>
            <option value="trusted_tasks">trusted_tasks</option>
            <option value="autonomous">autonomous</option>
          </select>
        </div>
      </div>

      <button
        type="submit"
        className="mt-1 flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white shadow-lg transition-all hover:bg-indigo-500 active:scale-[0.99]"
      >
        <Send className="h-3.5 w-3.5" />
        DISPATCH TO ORCHESTRA NODE & GODOT
      </button>
    </form>
  );
};
