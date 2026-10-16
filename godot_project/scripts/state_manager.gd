# state_manager.gd
# State Manager node for Reverse Simulation office world.
# Processes Orchestra WebSocket events and dispatches targets/animations to AgentActor instances.

extends Node2D

@export var agent_actor_scene: PackedScene
@export var markers_container: Node2D
@export var agents_container: Node2D

var agent_nodes: Dictionary = {} # Dict[String, AgentActor]
var location_markers: Dictionary = {} # Dict[String, Marker2D]

func _ready() -> void:
	print("[StateManager] Initializing state manager...")
	_cache_location_markers()

	if WSClient:
		WSClient.event_received.connect(_on_orchestra_event_received)
		WSClient.connection_status_changed.connect(_on_ws_status_changed)

func _cache_location_markers() -> void:
	if markers_container:
		for child in markers_container.get_children():
			if child is Marker2D or child is Node2D:
				location_markers[child.name.to_lower()] = child
	print("[StateManager] Cached location markers: ", location_markers.keys())

func _on_orchestra_event_received(event: Dictionary) -> void:
	var event_type = event.get("event_type", "")
	var agent_id = event.get("agent_id", "")

	if agent_id.is_empty():
		return

	# Ensure AgentActor instance exists for this agent_id
	var agent_actor = _get_or_create_agent_actor(agent_id, event)

	match event_type:
		"agent_update", "task_progress", "task_created", "task_completed", "task_failed", "tool_call_started", "tool_call_finished":
			_apply_agent_event(agent_actor, event)
		"command_ack":
			print("[StateManager] Command acknowledged for agent ", agent_id)

func _apply_agent_event(actor: Node, event: Dictionary) -> void:
	var target_location_str = event.get("location_target", "").to_lower()
	var status = event.get("status", "idle")
	var animation = event.get("animation", "idle")
	var speech = event.get("speech", "")
	var progress = event.get("progress", 0)

	# 1. Resolve position marker
	if location_markers.has(target_location_str):
		var marker_node = location_markers[target_location_str]
		actor.move_to_position(marker_node.global_position)

	# 2. Update agent visual state
	actor.update_status(status, animation, speech, progress)

func _get_or_create_agent_actor(agent_id: String, event_data: Dictionary) -> Node:
	if agent_nodes.has(agent_id):
		return agent_nodes[agent_id]

	print("[StateManager] Spawning new AgentActor for ID: ", agent_id)
	var actor_instance = agent_actor_scene.instantiate()
	actor_instance.agent_id = agent_id
	actor_instance.agent_name = event_data.get("metadata", {}).get("name", agent_id.capitalize())

	agents_container.add_child(actor_instance)
	agent_nodes[agent_id] = actor_instance

	# Default spawn location at desk or origin
	var target_loc = event_data.get("location_target", "desk_01").to_lower()
	if location_markers.has(target_loc):
		actor_instance.global_position = location_markers[target_loc].global_position

	return actor_instance

func _on_ws_status_changed(is_connected: bool) -> void:
	print("[StateManager] WebSocket connectivity state: ", is_connected)
