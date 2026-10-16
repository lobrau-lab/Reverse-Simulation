# agent_inspector.gd
# Inspector Panel showing detailed agent state, control actions, and logs.

extends Control

@onready var agent_name_label: Label = $VBox/Header/AgentName
@onready var status_label: Label = $VBox/StatusLabel
@onready var machine_label: Label = $VBox/MachineLabel
@onready var autonomy_label: Label = $VBox/AutonomyLabel
@onready var progress_bar: ProgressBar = $VBox/ProgressBar
@onready var log_text_edit: TextEdit = $VBox/LogTextEdit

@onready var pause_button: Button = $VBox/Actions/PauseButton
@onready var resume_button: Button = $VBox/Actions/ResumeButton
@onready var interrupt_button: Button = $VBox/Actions/InterruptButton

var current_agent_id: String = "engineer_01"

func _ready() -> void:
	pause_button.pressed.connect(func(): _send_agent_cmd("pause_agent"))
	resume_button.pressed.connect(func(): _send_agent_cmd("resume_agent"))
	interrupt_button.pressed.connect(func(): _send_agent_cmd("interrupt_agent"))

	if WSClient:
		WSClient.event_received.connect(_on_event_received)

func inspect_agent(agent_id: String) -> void:
	current_agent_id = agent_id
	agent_name_label.text = "Agent Inspector: " + agent_id.capitalize()
	log_text_edit.text = "[System] Inspector bound to agent: " + agent_id + "\n"

func _send_agent_cmd(cmd_type: String) -> void:
	var payload = {
		"command_type": cmd_type,
		"agent_id": current_agent_id
	}
	WSClient.send_command(payload)

func _on_event_received(event: Dictionary) -> void:
	if event.get("agent_id", "") == current_agent_id:
		status_label.text = "Status: " + str(event.get("status", "idle"))
		machine_label.text = "Node: " + str(event.get("machine_id", "desktop_gpu"))
		progress_bar.value = int(event.get("progress", 0))

		var log_entry = "[%s] %s: %s\n" % [
			event.get("timestamp", "00:00"),
			event.get("status", ""),
			event.get("speech", "")
		]
		log_text_edit.text += log_entry
