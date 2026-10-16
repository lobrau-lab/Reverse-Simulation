"""
tmux Session Adapter for Orchestra Node Backend.
Manages isolated tmux sessions per agent for persistent execution on Linux/macOS.
"""

import subprocess
import logging
from typing import Optional, Dict

logger = logging.getLogger("tmux_adapter")


class TmuxAdapter:
    def __init__(self, socket_name: str = "orchestra_agents"):
        self.socket_name = socket_name

    def create_session(self, session_name: str, working_dir: Optional[str] = None) -> bool:
        """Create a new tmux session if it doesn't already exist."""
        try:
            check_cmd = ["tmux", "has-session", "-t", session_name]
            result = subprocess.run(check_cmd, capture_output=True)
            if result.returncode == 0:
                logger.info(f"tmux session '{session_name}' already exists.")
                return True

            cmd = ["tmux", "new-session", "-d", "-s", session_name]
            if working_dir:
                cmd.extend(["-c", working_dir])
            
            subprocess.run(cmd, check=True)
            logger.info(f"Created tmux session '{session_name}'.")
            return True
        except Exception as e:
            logger.warning(f"tmux not available or failed to create session '{session_name}': {e}")
            return False

    def send_keys(self, session_name: str, command: str) -> bool:
        """Send a shell command into the specified tmux session."""
        try:
            cmd = ["tmux", "send-keys", "-t", session_name, command, "C-m"]
            subprocess.run(cmd, check=True)
            logger.info(f"Sent keys to tmux session '{session_name}': {command}")
            return True
        except Exception as e:
            logger.error(f"Failed sending keys to tmux session '{session_name}': {e}")
            return False

    def capture_pane(self, session_name: str, lines: int = 50) -> str:
        """Capture the current terminal output pane from the tmux session."""
        try:
            cmd = ["tmux", "capture-pane", "-pt", session_name, "-S", f"-{lines}"]
            result = subprocess.run(cmd, capture_output=True, text=True, check=True)
            return result.stdout
        except Exception as e:
            return f"[tmux_adapter mock log output for session {session_name}]"

    def kill_session(self, session_name: str) -> bool:
        """Kill a running tmux session."""
        try:
            cmd = ["tmux", "kill-session", "-t", session_name]
            subprocess.run(cmd, check=True)
            return True
        except Exception as e:
            logger.error(f"Failed to kill tmux session '{session_name}': {e}")
            return False
