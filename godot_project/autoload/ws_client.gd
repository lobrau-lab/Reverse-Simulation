# ws_client.gd
# Autoload singleton for WebSocket connectivity to Orchestra Node backend.
# Handles auto-reconnect, JSON deserialization, typed signals, and sending commands.

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
				print("[WSClient] Connected to Orchestra backend at: ", server_url)
				connection_status_changed.emit(true)

			# Process incoming WebSocket frames
			while socket.get_available_packet_count() > 0:
				var packet = socket.get_packet()
				var text = packet.get_string_from_utf8()
				_parse_and_emit_json(text)

		WebSocketPeer.STATE_CLOSED, WebSocketPeer.STATE_CLOSING:
			if is_connected_to_server:
				is_connected_to_server = false
				print("[WSClient] Disconnected from Orchestra backend.")
				connection_status_changed.emit(false)

			if auto_reconnect:
				reconnect_timer += delta
				if reconnect_timer >= reconnect_delay:
					reconnect_timer = 0.0
					print("[WSClient] Attempting reconnect to Orchestra backend...")
					connect_to_server()

func connect_to_server() -> void:
	var err = socket.connect_to_url(server_url)
	if err != OK:
		print("[WSClient] Connection attempt error code: ", err)

func send_command(cmd_dict: Dictionary) -> void:
	if socket.get_ready_state() == WebSocketPeer.STATE_OPEN:
		var json_str = JSON.stringify(cmd_dict)
		socket.send_text(json_str)
		print("[WSClient] Sent command to backend: ", json_str)
	else:
		printerr("[WSClient] Cannot send command: WebSocket is not connected.")

func _parse_and_emit_json(json_str: String) -> void:
	var json = JSON.new()
	var parse_result = json.parse(json_str)
	if parse_result == OK:
		var data = json.get_data()
		if typeof(data) == TYPE_DICTIONARY:
			event_received.emit(data)
		else:
			printerr("[WSClient] Received non-dictionary JSON payload: ", json_str)
	else:
		printerr("[WSClient] Failed to parse JSON frame: ", json_str)
