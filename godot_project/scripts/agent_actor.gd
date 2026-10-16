# agent_actor.gd
# AgentActor script controlling 2D top-down navigation, animations, speech bubbles, and selection.

extends CharacterBody2D

signal agent_selected(agent_id: String)

@export var agent_id: String = "engineer_01"
@export var agent_name: String = "Kira"
@export var movement_speed: float = 120.0

@onready var nav_agent: NavigationAgent2D = $NavigationAgent2D
@onready var animated_sprite: AnimatedSprite2D = $AnimatedSprite2D
@onready var name_label: Label = $UI/NameLabel
@onready var speech_bubble: PanelContainer = $UI/SpeechBubble
@onready var speech_label: Label = $UI/SpeechBubble/MarginContainer/SpeechLabel
@onready var progress_bar: ProgressBar = $UI/ProgressBar
@onready var selection_ring: Sprite2D = $SelectionRing

var current_status: String = "idle"
var is_selected: bool = false
var speech_timer: float = 0.0

func _ready() -> void:
	name_label.text = agent_name
	selection_ring.visible = false
	speech_bubble.visible = false
	
	nav_agent.velocity_computed.connect(_on_velocity_computed)
	input_pickable = true

func _physics_process(delta: float) -> void:
	if nav_agent.is_navigation_finished():
		velocity = Vector2.ZERO
		return

	var next_path_pos = nav_agent.get_next_path_position()
	var current_pos = global_position
	var new_velocity = (next_path_pos - current_pos).normalized() * movement_speed

	if nav_agent.avoidance_enabled:
		nav_agent.set_velocity(new_velocity)
	else:
		_on_velocity_computed(new_velocity)

	# Speech bubble auto-hide timer
	if speech_bubble.visible:
		speech_timer -= delta
		if speech_timer <= 0.0:
			speech_bubble.visible = false

func _on_velocity_computed(safe_velocity: Vector2) -> void:
	velocity = safe_velocity
	move_and_slide()

	# Sprite flip based on movement direction
	if velocity.x < -10:
		animated_sprite.flip_h = true
	elif velocity.x > 10:
		animated_sprite.flip_h = false

func move_to_position(target_pos: Vector2) -> void:
	nav_agent.target_position = target_pos

func update_status(status_str: String, animation_str: String, speech_str: String, progress_val: int) -> void:
	current_status = status_str
	progress_bar.value = progress_val

	# Update Speech Bubble
	if not speech_str.is_empty():
		speech_label.text = speech_str
		speech_bubble.visible = true
		speech_timer = 5.0 # Show for 5 seconds

	# Update Animation
	match animation_str:
		"typing", "writing_code":
			_play_animation("typing")
		"thinking", "planning":
			_play_animation("thinking")
		"walking":
			_play_animation("walk")
		"celebrating", "completed_task":
			_play_animation("celebrate")
		"offline":
			_play_animation("asleep")
		_:
			_play_animation("idle")

func set_selection_state(selected: bool) -> void:
	is_selected = selected
	selection_ring.visible = selected

func _play_animation(anim_name: String) -> void:
	if animated_sprite and animated_sprite.sprite_frames and animated_sprite.sprite_frames.has_animation(anim_name):
		animated_sprite.play(anim_name)

func _input_event(_viewport: Node, event: InputEvent, _shape_idx: int) -> void:
	if event is InputEventMouseButton and event.button_index == MOUSE_BUTTON_LEFT and event.pressed:
		print("[AgentActor] Agent clicked: ", agent_id)
		agent_selected.emit(agent_id)
