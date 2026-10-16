'use client';

import React, { useRef, useEffect, useState } from 'react';
import { AgentInfo, LocationTarget } from '@/lib/orchestra-types';
import { ROOM_COORDINATES } from '@/lib/orchestra-state';

interface OfficeCanvasProps {
  agents: AgentInfo[];
  selectedAgentId: string | null;
  onSelectAgent: (agentId: string) => void;
  onSelectRoom?: (roomKey: LocationTarget) => void;
}

export const OfficeCanvas: React.FC<OfficeCanvasProps> = ({
  agents,
  selectedAgentId,
  onSelectAgent,
  onSelectRoom,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Smooth local positions for animation interpolation
  const agentPosRef = useRef<Record<string, { x: number; y: number }>>({});

  useEffect(() => {
    agents.forEach((agent) => {
      if (!agentPosRef.current[agent.id]) {
        const targetCoord = ROOM_COORDINATES[agent.assigned_desk] || { x: 200, y: 200 };
        agentPosRef.current[agent.id] = { x: targetCoord.x, y: targetCoord.y };
      }
    });
  }, [agents]);

  useEffect(() => {
    let animationFrameId: number;

    const render = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const width = canvas.width;
      const height = canvas.height;

      // 1. Background Grid & Floor
      ctx.fillStyle = '#0F172A'; // Slate 900
      ctx.fillRect(0, 0, width, height);

      // Grid lines
      ctx.strokeStyle = '#1E293B'; // Slate 800
      ctx.lineWidth = 1;
      const gridSize = 40;
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // 2. Draw Office Rooms & Zones
      const rooms = [
        { key: 'desk_01', name: 'Desk 1 (Kira)', x: 180, y: 180, w: 100, h: 80, color: '#1E293B' },
        { key: 'desk_02', name: 'Desk 2 (Orion)', x: 360, y: 180, w: 100, h: 80, color: '#1E293B' },
        { key: 'desk_03', name: 'Desk 3 (Rox)', x: 180, y: 420, w: 100, h: 80, color: '#1E293B' },
        { key: 'desk_04', name: 'Desk 4 (Vesper)', x: 360, y: 420, w: 100, h: 80, color: '#1E293B' },
        { key: 'meeting_table', name: '🤝 Meeting Table', x: 500, y: 340, w: 160, h: 100, color: '#312E81' },
        { key: 'tool_room', name: '🛠️ Tool Room', x: 740, y: 160, w: 140, h: 100, color: '#064E3B' },
        { key: 'review_board', name: '📋 Review Board', x: 520, y: 140, w: 140, h: 80, color: '#78350F' },
        { key: 'water_cooler', name: '☕ Rest Area', x: 740, y: 360, w: 140, h: 90, color: '#134E4A' },
        { key: 'alert_zone', name: '⚠️ Alert Zone', x: 740, y: 520, w: 140, h: 90, color: '#7F1D1D' },
        { key: 'terminal_room', name: '🖥️ Terminal Room', x: 180, y: 560, w: 280, h: 80, color: '#1E1B4B' },
        { key: 'machine_room', name: '⚡ Server Rack', x: 500, y: 560, w: 160, h: 80, color: '#4C1D95' },
      ];

      rooms.forEach((r) => {
        // Room background fill
        ctx.fillStyle = r.color;
        ctx.beginPath();
        ctx.roundRect(r.x - r.w / 2, r.y - r.h / 2, r.w, r.h, 12);
        ctx.fill();

        // Room border
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Label
        ctx.fillStyle = '#94A3B8';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(r.name, r.x, r.y - r.h / 2 + 18);
      });

      // 3. Update & Draw Agents
      agents.forEach((agent) => {
        const targetPos = ROOM_COORDINATES[agent.assigned_desk] || { x: 200, y: 200 };

        // Determine destination position based on current target/location
        let destX = targetPos.x;
        let destY = targetPos.y;

        if (agent.target_x && agent.target_y) {
          destX = agent.target_x;
          destY = agent.target_y;
        }

        // Lerp position for smooth movement
        const currentPos = agentPosRef.current[agent.id] || { x: destX, y: destY };
        const dx = destX - currentPos.x;
        const dy = destY - currentPos.y;

        currentPos.x += dx * 0.08; // Smooth factor
        currentPos.y += dy * 0.08;
        agentPosRef.current[agent.id] = currentPos;

        const isSelected = agent.id === selectedAgentId;

        // Draw Selection Glow
        if (isSelected) {
          ctx.beginPath();
          ctx.arc(currentPos.x, currentPos.y, 32, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(59, 130, 246, 0.25)';
          ctx.fill();
          ctx.strokeStyle = '#3B82F6';
          ctx.lineWidth = 3;
          ctx.stroke();
        }

        // Draw Agent Avatar Circle
        ctx.beginPath();
        ctx.arc(currentPos.x, currentPos.y, 22, 0, Math.PI * 2);
        ctx.fillStyle = agent.color || '#3B82F6';
        ctx.fill();
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Avatar Emoji / Symbol
        ctx.font = '20px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(agent.avatar || '🤖', currentPos.x, currentPos.y);

        // Status Indicator Badge
        let statusColor = '#10B981'; // Green
        if (agent.current_status === 'thinking' || agent.current_status === 'planning') statusColor = '#8B5CF6';
        if (agent.current_status === 'using_tool') statusColor = '#F59E0B';
        if (agent.current_status === 'failed' || agent.current_status === 'blocked') statusColor = '#EF4444';
        if (agent.current_status === 'offline') statusColor = '#64748B';

        ctx.beginPath();
        ctx.arc(currentPos.x + 16, currentPos.y - 16, 8, 0, Math.PI * 2);
        ctx.fillStyle = statusColor;
        ctx.fill();
        ctx.strokeStyle = '#0F172A';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Agent Name
        ctx.font = 'bold 12px sans-serif';
        ctx.fillStyle = '#F8FAFC';
        ctx.textAlign = 'center';
        ctx.fillText(agent.name, currentPos.x, currentPos.y + 36);

        // Status label
        ctx.font = '10px sans-serif';
        ctx.fillStyle = '#94A3B8';
        ctx.fillText(`${agent.current_status} (${agent.progress}%)`, currentPos.x, currentPos.y + 48);

        // Speech Bubble
        if (agent.speech_bubble) {
          ctx.font = '11px sans-serif';
          const textMetrics = ctx.measureText(agent.speech_bubble);
          const bubbleW = Math.min(Math.max(textMetrics.width + 16, 80), 220);
          const bubbleH = 26;
          const bubbleX = currentPos.x - bubbleW / 2;
          const bubbleY = currentPos.y - 54;

          ctx.fillStyle = '#1E293B';
          ctx.beginPath();
          ctx.roundRect(bubbleX, bubbleY, bubbleW, bubbleH, 6);
          ctx.fill();
          ctx.strokeStyle = '#3B82F6';
          ctx.lineWidth = 1;
          ctx.stroke();

          ctx.fillStyle = '#E2E8F0';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(
            agent.speech_bubble.length > 30 ? agent.speech_bubble.slice(0, 28) + '...' : agent.speech_bubble,
            currentPos.x,
            bubbleY + bubbleH / 2
          );
        }
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [agents, selectedAgentId]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // Check if clicked an agent
    for (const agent of agents) {
      const pos = agentPosRef.current[agent.id] || { x: 0, y: 0 };
      const dist = Math.hypot(clickX - pos.x, clickY - pos.y);
      if (dist <= 26) {
        onSelectAgent(agent.id);
        return;
      }
    }
  };

  return (
    <div className="relative w-full overflow-hidden rounded-xl border border-slate-800 bg-slate-900 shadow-2xl">
      <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/80 px-4 py-2 text-xs font-mono text-slate-400">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
          </span>
          <span>GODOT 2D OFFICE VIEWPORT (REAL-TIME AGENT NAVIGATION)</span>
        </div>
        <div className="flex items-center gap-4 text-slate-500">
          <span>Engine: Godot 4.6 / Canvas2D Sync</span>
          <span>FPS: 60</span>
        </div>
      </div>
      <canvas
        ref={canvasRef}
        width={960}
        height={680}
        onClick={handleCanvasClick}
        className="w-full h-auto cursor-pointer block"
      />
    </div>
  );
};
