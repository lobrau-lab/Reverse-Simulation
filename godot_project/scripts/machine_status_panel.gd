# machine_status_panel.gd
# Node Hardware status panel monitoring VRAM, RAM, and active engines across Tailscale cluster.

extends Control

@onready var desktop_status: Label = $Grid/DesktopNode/Status
@onready var macbook_status: Label = $Grid/MacBookNode/Status
@onready var spare_status: Label = $Grid/SpareNode/Status
@onready var android_status: Label = $Grid/AndroidNode/Status

func _ready() -> void:
	if WSClient:
		WSClient.event_received.connect(_on_event_received)

func _on_event_received(event: Dictionary) -> void:
	if event.get("event_type", "") == "machine_status":
		var machine_id = event.get("machine_id", "")
		var info_str = "Active: " + str(event.get("speech", "Online"))
		match machine_id:
			"desktop_gpu":
				desktop_status.text = info_str
			"macbook_mlx":
				macbook_status.text = info_str
			"spare_pc":
				spare_status.text = info_str
			"android_termux":
				android_status.text = info_str
