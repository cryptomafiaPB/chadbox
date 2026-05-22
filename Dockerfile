FROM ubuntu:22.04

ENV DEBIAN_FRONTEND=noninteractive

# Install core dependencies
RUN apt-get update && apt-get install -y \
    curl \
    build-essential \
    libcap-dev \
    libseccomp-dev \
    pkg-config \
    libsystemd-dev \
    git \
    && curl -fsSL https://deb.nodesource.com/setup_22.x | bash - \
    && apt-get install -y nodejs \
    && npm install -g pnpm \
    && rm -rf /var/lib/apt/lists/*

# Clone and compile ioi/isolate from source
RUN git clone https://github.com/ioi/isolate.git /tmp/isolate \
    && cd /tmp/isolate \
    && make isolate \
    && make install \
    && rm -rf /tmp/isolate

# working directory
WORKDIR /app

# Keep the container running in the background for testing
CMD ["tail", "-f", "/dev/null"]