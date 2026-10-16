'use client';

import React, { useState } from 'react';
import { OrchestraEvent } from '@/lib/orchestra-types';
import { Radio, Filter, Code2, Trash2 } from 'lucide-react';

interface EventLogConsoleProps {
  events: OrchestraEvent[];
  onClear: () => void;
}

export const EventLogConsole: React.FC<EventLogConsoleProps> = ({ events, onClear }) => {
  const [filterType, setFilterType] = useState<string>('all');

  const filteredEvents = events.filter((e) => {
    if (filterType === 'all') return true;
    return e.event_type === filterType || e.severity === filterType;
  });

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-slate-800 bg-slate-900 p-5 text-slate-200 shadow-xl">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2 font-mono text-xs text-slate-300">
          <Radio className="h-4 w-4 text-emerald-400 animate-pulse" />
          <span className="font-semibold text-slate-100">WEBSOCKET JSON EVENT LOG (PROTOCOL V1.0)</span>
          <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] text-slate-400">
            {events.length} Events
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 font-mono text-xs text-slate-400">
            <Filter className="h-3.5 w-3.5" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="rounded border border-slate-800 bg-slate-950 px-2 py-1 text-xs text-slate-300 font-mono focus:outline-none"
            >
              <option value="all">All Events</option>
              <option value="agent_update">agent_update</option>
              <option value="task_progress">task_progress</option>
              <option value="tool_call_started">tool_call_started</option>
              <option value="approval_requested">approval_requested</option>
              <option value="command_ack">command_ack</option>
            </select>
          </div>

          <button
            onClick={onClear}
            className="p-1.5 rounded text-slate-400 hover:text-rose-400 hover:bg-slate-800"
            title="Clear Logs"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="h-48 overflow-y-auto rounded-lg border border-slate-800 bg-slate-950 p-3 font-mono text-[11px] space-y-2">
        {filteredEvents.length === 0 ? (
          <p className="text-slate-600 italic">[No WebSocket events received yet...]</p>
        ) : (
          filteredEvents.map((evt) => (
            <div
              key={evt.event_id}
              className="rounded border border-slate-900 bg-slate-900/60 p-2.5 space-y-1"
            >
              <div className="flex items-center justify-between text-[10px] text-slate-400">
                <span className="font-semibold text-indigo-400">
                  {evt.event_type} | Agent: {evt.agent_id}
                </span>
                <span>{evt.timestamp}</span>
              </div>
              <p className="text-slate-200">
                [{evt.status}] {evt.speech} (Target: {evt.location_target}, Node: {evt.machine_id})
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
