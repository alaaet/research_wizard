# Use a specific Node 20 LTS version for better reproducibility
FROM node:20.14.0-bullseye

# Install required system dependencies for electron-builder
# Using --no-install-recommends can reduce image size
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

# Copy package files
COPY package*.json ./

# Pin electron-builder and install with legacy peer deps
RUN npm install --save-dev electron-builder@24.6.0 --legacy-peer-deps
RUN npm install --legacy-peer-deps
RUN npm install buffer-from

# Copy the rest of the project source code
COPY . .

# Set environment variable for electron-builder
ENV CI=true

# Default command: build the Electron app
CMD ["npm", "run", "dist"]