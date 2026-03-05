#!/bin/bash
#
# Scheduled - Production Stop Script
# Stops the running Node.js application
#

echo "========================================"
echo " Stopping Scheduled Application"
echo "========================================"
echo ""

# Find the process
PID=$(lsof -ti:${PORT:-5000} 2>/dev/null)

if [ -z "$PID" ]; then
    echo "[INFO] No application found running on port ${PORT:-5000}"

    # Try to find by process name
    PID=$(pgrep -f "node dist/index.js" 2>/dev/null)

    if [ -z "$PID" ]; then
        echo "[INFO] Application is not running"
        exit 0
    fi
fi

# Kill the process
echo "[INFO] Stopping process $PID..."
kill $PID

# Wait for graceful shutdown
sleep 2

# Check if still running
if ps -p $PID > /dev/null 2>&1; then
    echo "[WARNING] Process did not stop gracefully, forcing..."
    kill -9 $PID
    sleep 1
fi

# Verify stopped
if ps -p $PID > /dev/null 2>&1; then
    echo "[ERROR] Failed to stop process $PID"
    exit 1
else
    echo "✓ Application stopped successfully"
fi

echo ""
echo "========================================"
