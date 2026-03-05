#!/bin/bash
#
# Scheduled - Production Startup Script
# Starts the Node.js application in production mode
#

# Change to script directory
cd "$(dirname "$0")"

echo "========================================"
echo " Starting Scheduled Application"
echo "========================================"
echo ""

# Load environment variables
if [ ! -f .env ]; then
    echo "[ERROR] .env file not found!"
    echo "Please create .env with your database and API configuration"
    exit 1
fi

echo "[INFO] Loading environment variables..."
set -a
source .env
set +a

# Verify critical environment variables
if [ -z "$DATABASE_URL" ]; then
    echo "[ERROR] DATABASE_URL not set in .env"
    exit 1
fi

echo "[INFO] Environment variables loaded"

# Check if port is already in use
PORT=${PORT:-5000}
if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo "[ERROR] Port $PORT is already in use!"
    echo "Run ./stop-production.sh first or check for other processes:"
    lsof -i :$PORT
    exit 1
fi

# Start the application
echo "[INFO] Starting application on port $PORT..."
nohup node dist/index.js > app.log 2>&1 &
PID=$!

# Wait a moment for the app to start
sleep 2

# Check if process is still running
if ps -p $PID > /dev/null 2>&1; then
    echo "✓ Scheduled Application started successfully!"
    echo "  Process ID: $PID"
    echo "  Port: $PORT"
    echo "  Log file: app.log"
    echo ""
    echo "To view logs: tail -f app.log"
    echo "To stop: ./stop-production.sh"
else
    echo "[ERROR] Application failed to start!"
    echo "Check app.log for errors:"
    tail -20 app.log
    exit 1
fi

echo ""
echo "========================================"
