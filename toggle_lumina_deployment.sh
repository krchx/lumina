#!/bin/bash

# Get the directory where the script is located
APP_DIR=$(dirname "$(realpath "$0")")

# --- Configuration ---
# Adjust these names if your executable/AppImage files are named differently.
APPIMAGE_NAME="lumina_0.1.0.AppImage"
EXECUTABLE_NAME="lumina"
# --- End Configuration ---

LUMINA_APPIMAGE_PATH="$APP_DIR/$APPIMAGE_NAME"
LUMINA_EXECUTABLE_PATH="$APP_DIR/$EXECUTABLE_NAME"

LUMINA_TO_RUN=""

if [ -f "$LUMINA_APPIMAGE_PATH" ]; then
    LUMINA_TO_RUN="$LUMINA_APPIMAGE_PATH"
    echo "Found AppImage: $LUMINA_TO_RUN"
elif [ -f "$LUMINA_EXECUTABLE_PATH" ]; then
    LUMINA_TO_RUN="$LUMINA_EXECUTABLE_PATH"
    echo "Found executable: $LUMINA_TO_RUN"
else
    echo "Error: Lumina executable or AppImage not found in $APP_DIR"
    echo "Looked for: $LUMINA_APPIMAGE_PATH"
    echo "And: $LUMINA_EXECUTABLE_PATH"
    exit 1
fi

# Execute Lumina with the toggle visibility argument
"$LUMINA_TO_RUN" --toggle-visibility
    