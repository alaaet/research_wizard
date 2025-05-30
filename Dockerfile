# -----------
# Builder Stage
# -----------
FROM node:20.14.0-bullseye AS builder

# Install system dependencies for electron-builder and headless builds
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
      libarchive-tools \
      libgtk-3-0 \
      libnss3 \
      libxss1 \
      libasound2 \
      libxtst6 \
      libx11-xcb1 \
      libxkbfile1 \
      xz-utils \
      rpm \
      fakeroot \
      build-essential \
      ca-certificates \
      git \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install --legacy-peer-deps

# Copy the rest of the project source code
COPY . .

# Build backend and frontend
RUN npm run build:backend && npm run build && npm run prepare-icons

# -----------
# Final Stage (for artifact extraction, not for running the app)
# -----------
FROM node:20.14.0-bullseye AS dist

WORKDIR /app

# Copy only the built app and node_modules from builder
COPY --from=builder /app /app

# Set environment variable for electron-builder
ENV CI=true

# Create a non-root user for better security
RUN useradd --user-group --create-home --shell /bin/false appuser
USER appuser

# Default command: build the Electron app (outputs to /app/dist)
CMD ["npm", "run", "dist"]