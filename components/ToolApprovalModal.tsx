'use client';

import React from 'react';
import { ShieldAlert, CheckCircle2, XCircle } from 'lucide-react';

interface ToolApprovalModalProps {
  isOpen: boolean;
  agentId: string;
  toolName: string;
  toolArgs: Record<string, any>;
  onApprove: () => void;
  onDeny: () => void;
}

export const ToolApprovalModal: React.FC<ToolApprovalModalProps> = ({
  isOpen,
  agentId,
  toolName,
  toolArgs,
  onApprove,
  onDeny,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-xl border border-amber-500/40 bg-slate-900 p-6 text-slate-100 shadow-2xl">
        <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/20 text-amber-400">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-100">Tool Approval Requested</h3>
            <p className="text-xs font-mono text-slate-400">Agent: {agentId} (ask_before_tools)</p>
          </div>
        </div>

        <div className="my-4 space-y-2 text-xs font-mono">
          <div>
            <span className="text-slate-500 block">TOOL NAME:</span>
            <span className="text-emerald-400 font-semibold">{toolName}</span>
          </div>
          <div>
            <span className="text-slate-500 block">ARGUMENTS:</span>
            <pre className="mt-1 rounded border border-slate-800 bg-slate-950 p-2 text-[11px] text-slate-300 overflow-x-auto">
              {JSON.stringify(toolArgs, null, 2)}
            </pre>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800">
          <button
            onClick={onDeny}
            className="flex items-center gap-1.5 rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-xs font-medium text-rose-400 hover:bg-rose-500/20"
          >
            <XCircle className="h-4 w-4" /> Deny Tool
          </button>
          <button
            onClick={onApprove}
            className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-lg hover:bg-emerald-500"
          >
            <CheckCircle2 className="h-4 w-4" /> Approve Execution
          </button>
        </div>
      </div>
    </div>
  );
};
