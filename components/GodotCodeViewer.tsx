'use client';

import React, { useState } from 'react';
import { FileCode2, Copy, Check, Terminal, Download, Play, ShieldAlert } from 'lucide-react';

interface CodeSnippet {
  filepath: string;
  language: string;
  code: string;
}

const SNIPPETS: CodeSnippet[] = [
  {
    filepath: 'godot_project/autoload/ws_client.gd',
    language: 'gdscript',
    code: `# ws_client.gd
# Autoload singleton for WebSocket connectivity to Orchestra Node backend.

extends Node

signal event_received(event_data: Dictionary)
signal connection_status_changed(is_connected: bool)

@export var server_url: String = "ws://localhost:8000/ws?token=dev_token_123"
@export var auto_reconnect: bool = true
@export var reconnect_delay: float = 3.0

var socket: WebSocketPeer = WebSocketPeer.new()
var is_connected_to_server: bool = false
var reconnect_timer: float = 0.0

func _ready() -> void:
	print("[WSClient] Initializing WebSocket client for Reverse Simulation...")
	connect_to_server()

func _process(delta: float) -> void:
	socket.poll()
	var state = socket.get_ready_state()

	match state:
		WebSocketPeer.STATE_OPEN:
			if not is_connected_to_server:
				is_connected_to_server = true
				connection_status_changed.emit(true)

			while socket.get_available_packet_count() > 0:
				var packet = socket.get_packet()
				var text = packet.get_string_from_utf8()
				_parse_and_emit_json(text)

		WebSocketPeer.STATE_CLOSED, WebSocketPeer.STATE_CLOSING:
			if is_connected_to_server:
				is_connected_to_server = false
				connection_status_changed.emit(false)

			if auto_reconnect:
				reconnect_timer += delta
				if reconnect_timer >= reconnect_delay:
					reconnect_timer = 0.0
					connect_to_server()

func connect_to_server() -> void:
	socket.connect_to_url(server_url)

func send_command(cmd_dict: Dictionary) -> void:
	if socket.get_ready_state() == WebSocketPeer.STATE_OPEN:
		socket.send_text(JSON.stringify(cmd_dict))

func _parse_and_emit_json(json_str: String) -> void:
	var json = JSON.new()
	if json.parse(json_str) == OK:
		var data = json.get_data()
		if typeof(data) == TYPE_DICTIONARY:
			event_received.emit(data)`
  },
  {
    filepath: 'godot_project/scripts/state_manager.gd',
    language: 'gdscript',
    code: `# state_manager.gd
# State Manager node for Reverse Simulation office world.

extends Node2D

@export var agent_actor_scene: PackedScene
@export var markers_container: Node2D
@export var agents_container: Node2D

var agent_nodes: Dictionary = {}
var location_markers: Dictionary = {}

func _ready() -> void:
	_cache_location_markers()
	if WSClient:
		WSClient.event_received.connect(_on_orchestra_event_received)

func _cache_location_markers() -> void:
	if markers_container:
		for child in markers_container.get_children():
			location_markers[child.name.to_lower()] = child

func _on_orchestra_event_received(event: Dictionary) -> void:
	var agent_id = event.get("agent_id", "")
	if agent_id.is_empty(): return
	var agent_actor = _get_or_create_agent_actor(agent_id, event)
	_apply_agent_event(agent_actor, event)

func _apply_agent_event(actor: Node, event: Dictionary) -> void:
	var target_location_str = event.get("location_target", "").to_lower()
	if location_markers.has(target_location_str):
		actor.move_to_position(location_markers[target_location_str].global_position)
	actor.update_status(
		event.get("status", "idle"),
		event.get("animation", "idle"),
		event.get("speech", ""),
		int(event.get("progress", 0))
	)`
  },
  {
    filepath: 'godot_project/scripts/agent_actor.gd',
    language: 'gdscript',
    code: `# agent_actor.gd
# AgentActor script controlling 2D top-down navigation & speech bubbles.

extends CharacterBody2D

signal agent_selected(agent_id: String)

@export var agent_id: String = "engineer_01"
@export var movement_speed: float = 120.0

@onready var nav_agent: NavigationAgent2D = $NavigationAgent2D
@onready var animated_sprite: AnimatedSprite2D = $AnimatedSprite2D

func move_to_position(target_pos: Vector2) -> void:
	nav_agent.target_position = target_pos

func update_status(status_str: String, animation_str: String, speech_str: String, progress_val: int) -> void:
	# Update sprite animation & speech bubble
	pass`
  },
  {
    filepath: 'backend/main.py',
    language: 'python',
    code: `from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from models import OrchestraCommand, OrchestraEvent
from connection_manager import manager

app = FastAPI(title="Reverse Simulation Orchestra Backend")

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket, token: str = "dev_token_123"):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            # Process Godot WS command JSON
    except WebSocketDisconnect:
        manager.disconnect(websocket)`
  },
  {
    filepath: 'backend/models.py',
    language: 'python',
    code: `from pydantic import BaseModel, Field
from enum import Enum
from typing import Optional, Dict, Any

class AgentStatus(str, Enum):
    IDLE = "idle"
    WRITING_CODE = "writing_code"
    USING_TOOL = "using_tool"

class OrchestraEvent(BaseModel):
    schema_version: str = "1.0"
    event_id: str
    event_type: str
    timestamp: str
    agent_id: str
    status: AgentStatus
    location_target: str
    animation: str
    speech: Optional[str] = None
    progress: int = 0`
  }
];

export const GodotCodeViewer: React.FC = () => {
  const [selectedSnippetIdx, setSelectedSnippetIdx] = useState(0);
  const [copied, setCopied] = useState(false);

  const snippet = SNIPPETS[selectedSnippetIdx];

  const handleCopy = () => {
    navigator.clipboard.writeText(snippet.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-slate-800 bg-slate-900 p-5 text-slate-200 shadow-xl">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <FileCode2 className="h-4 w-4 text-indigo-400" />
          <h3 className="font-semibold text-slate-100">Godot 4.x GDScript & Python Backend Code Center</h3>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-mono text-slate-200 transition-all hover:bg-slate-700"
        >
          {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? 'COPIED!' : 'COPY SCRIPT'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* File List */}
        <div className="flex flex-col gap-1 border-r border-slate-800 pr-2 font-mono text-xs">
          {SNIPPETS.map((snip, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedSnippetIdx(idx)}
              className={`text-left rounded-md px-3 py-2 transition-all ${
                selectedSnippetIdx === idx
                  ? 'bg-indigo-600/30 text-indigo-300 font-semibold border border-indigo-500/50'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              {snip.filepath.split('/').pop()}
            </button>
          ))}
        </div>

        {/* Code Content */}
        <div className="md:col-span-3 flex flex-col gap-2">
          <div className="flex items-center justify-between font-mono text-xs text-slate-400 bg-slate-950 px-3 py-1.5 rounded border border-slate-800">
            <span>FILE: {snippet.filepath}</span>
            <span>LANG: {snippet.language}</span>
          </div>
          <pre className="h-96 overflow-auto rounded-lg border border-slate-800 bg-slate-950 p-4 font-mono text-xs text-indigo-200 leading-relaxed">
            <code>{snippet.code}</code>
          </pre>
        </div>
      </div>

      {/* Commands & Testing checklist */}
      <div className="mt-2 rounded-lg border border-slate-800 bg-slate-950 p-4 font-mono text-xs text-slate-300 space-y-2">
        <div className="flex items-center gap-2 text-emerald-400 font-semibold">
          <Terminal className="h-4 w-4" /> Quick Backend Run Command:
        </div>
        <div className="bg-slate-900 p-2.5 rounded border border-slate-800 text-emerald-300 select-all">
          cd backend && pip install -r requirements.txt && uvicorn main:app --reload --port 8000
        </div>
      </div>
    </div>
  );
};
