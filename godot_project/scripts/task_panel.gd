# task_panel.gd
# UI Panel for assigning new tasks to agents and transmitting JSON commands via WSClient.

extends Control

@onready var agent_option_button: OptionButton = $VBoxContainer/AgentSelector
@onready var task_line_edit: LineEdit = $VBoxContainer/TaskLineEdit
@onready var machine_option_button: OptionButton = $VBoxContainer/MachineSelector
@onready var autonomy_option_button: OptionButton = $VBoxContainer/AutonomySelector
@onready var dispatch_button: Button = $VBoxContainer/DispatchButton

func _ready() -> void:
	dispatch_button.pressed.connect(_on_dispatch_pressed)
	_populate_dropdowns()

func _populate_dropdowns() -> void:
	agent_option_button.clear()
	agent_option_button.add_item("engineer_01 (Kira)", 0)
	agent_option_button.add_item("planner_02 (Orion)", 1)
	agent_option_button.add_item("toolrunner_03 (Rox)", 2)
	agent_option_button.add_item("evaluator_04 (Vesper)", 3)

	machine_option_button.clear()
	machine_option_button.add_item("desktop_gpu (RTX 4090)", 0)
	machine_option_button.add_item("macbook_mlx (M3 Max)", 1)
	machine_option_button.add_item("spare_pc (i3 Linux)", 2)
	machine_option_button.add_item("android_termux (S24)", 3)

	autonomy_option_button.clear()
	autonomy_option_button.add_item("chat_only", 0)
	autonomy_option_button.add_item("ask_before_tools", 1)
	autonomy_option_button.add_item("trusted_tasks", 2)
	autonomy_option_button.add_item("autonomous", 3)
	autonomy_option_button.select(1) # Default ask_before_tools

func _on_dispatch_pressed() -> void:
	var task_text = task_line_edit.text.strip_edges()
	if task_text.is_empty():
		return

	var agent_idx = agent_option_button.selected
	var agent_ids = ["engineer_01", "planner_02", "toolrunner_03", "evaluator_04"]
	var selected_agent = agent_ids[agent_idx]

	var machine_idx = machine_option_button.selected
	var machine_ids = ["desktop_gpu", "macbook_mlx", "spare_pc", "android_termux"]
	var selected_machine = machine_ids[machine_idx]

	var autonomy_idx = autonomy_option_button.selected
	var autonomy_levels = ["chat_only", "ask_before_tools", "trusted_tasks", "autonomous"]
	var selected_autonomy = autonomy_levels[autonomy_idx]

	var cmd_payload = {
		"command_type": "assign_task",
		"agent_id": selected_agent,
		"task": task_text,
		"autonomy": selected_autonomy,
		"preferred_machine": selected_machine
	}

	WSClient.send_command(cmd_payload)
	task_line_edit.clear()
