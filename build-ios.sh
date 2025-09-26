#!/bin/bash
# iOS Build Script for the Scheduled App

echo "========================================="
echo "Scheduled - iOS Build Script"
echo "========================================="

# Check for required tools
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is not installed or not in PATH"
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo "Error: npm is not installed or not in PATH"
    exit 1
fi

if [ "$(uname)" != "Darwin" ]; then
    echo "Error: This script must be run on macOS"
    exit 1
fi

echo "Checking for Xcode..."
if ! xcode-select -p &> /dev/null; then
    echo "Error: Xcode is not installed or not properly configured"
    echo "Please install Xcode from the App Store and run 'xcode-select --install'"
    exit 1
fi

# Install or update Capacitor CLI
echo "Installing/updating Capacitor CLI..."
npm install -g @capacitor/cli

# Install dependencies
echo "Installing project dependencies..."
npm install

# Install iOS-specific Capacitor plugins
echo "Installing Capacitor plugins for iOS..."
npm install @capacitor/ios @capacitor/core

# Optional: Install additional plugins if needed
read -p "Do you want to install additional Capacitor plugins for iOS? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Installing additional plugins..."
    npm install @capacitor/splash-screen @capacitor/status-bar @capacitor/app
fi

# Build the web application
echo "Building the web application..."
npm run build

# Add iOS platform if it doesn't exist
if [ ! -d "ios" ]; then
    echo "Adding iOS platform..."
    npx cap add ios
else
    echo "iOS platform already exists."
fi

# Copy web assets to iOS platform
echo "Copying web assets to iOS platform..."
npx cap copy ios

# Update native plugins
echo "Updating native plugins..."
npx cap update ios

# Sync capacitor.config.ts with native projects
echo "Syncing capacitor.config.ts with native projects..."
npx cap sync

echo "========================================="
echo "Build completed successfully!"
echo "========================================="
echo "Next steps:"
echo "1. Open the iOS project in Xcode: npx cap open ios"
echo "2. Configure app icons and splash screens"
echo "3. Set up signing identity in Xcode"
echo "4. Build and test on a simulator or device"
echo "5. Archive and submit to App Store"
echo ""
echo "For detailed instructions, refer to the ios-assets/app-store-build-guide.md file"

# Ask if user wants to open the iOS project in Xcode
read -p "Do you want to open the iOS project in Xcode now? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Opening iOS project in Xcode..."
    npx cap open ios
fi

echo "Done!"