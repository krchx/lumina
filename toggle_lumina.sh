#!/bin/bash

# Script to toggle the Lumina search application
# This script is intended to be called by a global hotkey (e.g., Ctrl+Space)

# Detect the directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"

# Assuming the Lumina executable is in 'src-tauri/target/release' or 'src-tauri/target/debug'
# relative to the project root (SCRIPT_DIR).
# For a typical release build:
LUMINA_EXEC_PATH="${SCRIPT_DIR}/src-tauri/target/release/lumina"

# If you are testing with a debug build, you might use:
# LUMINA_EXEC_PATH_DEBUG="${SCRIPT_DIR}/src-tauri/target/debug/lumina"

if [ ! -f "$LUMINA_EXEC_PATH" ]; then
    # Fallback to debug path if release not found (useful during development)
    LUMINA_EXEC_PATH_DEBUG="${SCRIPT_DIR}/src-tauri/target/debug/lumina"
    if [ -f "$LUMINA_EXEC_PATH_DEBUG" ]; then
        LUMINA_EXEC_PATH="$LUMINA_EXEC_PATH_DEBUG"
    else
        echo "Error: Lumina executable not found at $LUMINA_EXEC_PATH or $LUMINA_EXEC_PATH_DEBUG" >&2
        # Optionally, try to notify the user via desktop notification
        if command -v notify-send &> /dev/null; then
            notify-send "Lumina Error" "Lumina executable not found. Please check the path in toggle_lumina.sh and ensure the app is built."
        fi
        exit 1
    fi
fi

# Check if Lumina is already running by trying to send the toggle command
# The single-instance plugin will handle this. If it's not running, this will start it.
"$LUMINA_EXEC_PATH" --toggle-visibility

exit 0
