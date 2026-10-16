# Reverse Simulation - Godot 4.x Setup Guide

This directory contains the Godot 4.x game frontend for **Reverse Simulation / Orchestra Node**.

## Scene Hierarchy Setup (`scenes/office_world.tscn`)

```
Node2D (OfficeWorld)
├── TileMap (Office Floors, Walls, Furniture)
├── NavigationRegion2D (2D Navigation Polygon for agent pathfinding)
│   ├── MarkersContainer (Node2D)
│   │   ├── Marker2D (desk_01) [Pos: 180, 180]
│   │   ├── Marker2D (desk_02) [Pos: 360, 180]
│   │   ├── Marker2D (desk_03) [Pos: 180, 420]
│   │   ├── Marker2D (desk_04) [Pos: 360, 420]
│   │   ├── Marker2D (meeting_table) [Pos: 500, 340]
│   │   ├── Marker2D (tool_room) [Pos: 740, 160]
│   │   ├── Marker2D (review_board) [Pos: 520, 140]
│   │   ├── Marker2D (water_cooler) [Pos: 740, 360]
│   │   ├── Marker2D (alert_zone) [Pos: 740, 520]
│   │   ├── Marker2D (terminal_room) [Pos: 300, 560]
│   │   └── Marker2D (machine_room) [Pos: 540, 560]
│   └── AgentsContainer (Node2D)
└── StateManager (Node2D) [Script: res://scripts/state_manager.gd]
└── CanvasLayer (UI)
    ├── TaskPanel [Script: res://scripts/task_panel.gd]
    ├── AgentInspector [Script: res://scripts/agent_inspector.gd]
    └── MachineStatusPanel [Script: res://scripts/machine_status_panel.gd]
```

## How to Run in Godot

1. Download or copy the `godot_project/` folder into your local environment.
2. Open **Godot Engine 4.3+** or **4.6**.
3. Import `project.godot`.
4. Ensure `res://autoload/ws_client.gd` is registered under **Project -> Project Settings -> Autoload**.
5. Start the Python FastAPI Backend (`uvicorn main:app --reload --port 8000`).
6. Press **F5** in Godot to launch `res://scenes/office_world.tscn`.
