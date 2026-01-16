# Use the official Node.js 22 image as base
FROM mcr.microsoft.com/devcontainers/javascript-node:1-22-bookworm

# Install system dependencies for canvas and other native modules
RUN apt-get update && export DEBIAN_FRONTEND=noninteractive \
    && apt-get -y install --no-install-recommends \
        build-essential \
        libcairo2-dev \
        libpango1.0-dev \
        libjpeg-dev \
        libgif-dev \
        librsvg2-dev \
        pkg-config \
        python3 \
        python3-pip \
        git \
        curl \
        wget \
        ca-certificates \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Install pnpm globally
RUN npm install -g pnpm@latest

# Set default shell to bash
SHELL ["/bin/bash", "-c"]

# Create a non-root user (already exists in base image, but ensure it's configured)
USER node

# Set working directory
WORKDIR /workspace

# Set environment variables
ENV PNPM_HOME=/home/node/.local/share/pnpm
ENV PATH=$PNPM_HOME:$PATH

# Default command
CMD ["sleep", "infinity"]
