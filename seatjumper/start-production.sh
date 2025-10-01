#!/bin/bash

# Production startup script with memory optimizations

# Set production environment
export NODE_ENV=production

# Set memory limits (3GB heap, leaving 1GB for system)
export NODE_OPTIONS="--max-old-space-size=3072 --max-semi-space-size=32"

# Enable garbage collection logging in production (optional, remove if not needed)
# export NODE_OPTIONS="$NODE_OPTIONS --trace-gc --trace-gc-verbose"

# Set connection pool limit for database
export DATABASE_CONNECTION_LIMIT=5

# Build the application if not already built
if [ ! -d ".next" ]; then
  echo "Building application..."
  npm run build
fi

# Start the production server
echo "Starting production server with memory limit of 3GB..."
echo "NODE_OPTIONS: $NODE_OPTIONS"
exec npm start