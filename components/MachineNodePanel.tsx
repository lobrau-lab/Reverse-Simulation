'use client';

import React from 'react';
import { MachineNode } from '@/lib/orchestra-types';
import { HardDrive, Cpu, Server, Wifi, Activity } from 'lucide-react';

interface MachineNodePanelProps {
  machines: MachineNode[];
}

export const MachineNodePanel: React.FC<MachineNodePanelProps> = ({ machines }) => {
  return (
    <div className="flex flex-col gap-4 rounded-xl border border-slate-800 bg-slate-900 p-5 text-slate-200 shadow-xl">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Server className="h-4 w-4 text-emerald-400" />
          <h3 className="font-semibold text-slate-100">Multi-Node Hardware Cluster</h3>
        </div>
        <span className="flex items-center gap-1 text-xs font-mono text-slate-400">
          <Wifi className="h-3 w-3 text-emerald-400" /> Tailscale Network Ready
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {machines.map((node) => {
          const vramPct = node.gpu_vram_total_gb
            ? Math.round((node.gpu_vram_used_gb / node.gpu_vram_total_gb) * 100)
            : 0;

          return (
            <div
              key={node.id}
              className="flex flex-col justify-between rounded-lg border border-slate-800 bg-slate-950 p-4 transition-all hover:border-slate-700"
            >
              <div>
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-semibold text-xs text-slate-200 flex items-center gap-1.5">
                    <Activity className="h-3.5 w-3.5 text-indigo-400" />
                    {node.name}
                  </h4>
                  <span className="rounded bg-emerald-950 px-1.5 py-0.5 text-[10px] font-mono text-emerald-400 border border-emerald-800">
                    {node.status}
                  </span>
                </div>

                <p className="text-[11px] font-mono text-slate-500 mb-3">
                  IP: {node.ip} | Tailscale: {node.tailscale_ip || 'N/A'}
                </p>

                {/* VRAM Bar if applicable */}
                {node.gpu_vram_total_gb > 0 && (
                  <div className="mb-2.5">
                    <div className="flex justify-between text-[10px] font-mono text-slate-400 mb-1">
                      <span className="flex items-center gap-1">
                        <HardDrive className="h-3 w-3 text-indigo-400" /> GPU VRAM
                      </span>
                      <span>
                        {node.gpu_vram_used_gb} / {node.gpu_vram_total_gb} GB ({vramPct}%)
                      </span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full bg-indigo-500"
                        style={{ width: `${vramPct}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                {/* CPU Bar */}
                <div className="mb-3">
                  <div className="flex justify-between text-[10px] font-mono text-slate-400 mb-1">
                    <span className="flex items-center gap-1">
                      <Cpu className="h-3 w-3 text-emerald-400" /> CPU Load
                    </span>
                    <span>{node.cpu_usage_pct}%</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-emerald-500"
                      style={{ width: `${node.cpu_usage_pct}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              <div>
                <span className="block text-[10px] font-mono text-slate-500 mb-1">ACTIVE ENGINES</span>
                <div className="flex flex-wrap gap-1">
                  {node.active_engines.map((eng, idx) => (
                    <span
                      key={idx}
                      className="rounded bg-slate-900 border border-slate-800 px-1.5 py-0.5 text-[10px] font-mono text-slate-300"
                    >
                      {eng}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
