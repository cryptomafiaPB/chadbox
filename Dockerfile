FROM node:22-bookworm-slim

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get install -y --no-install-recommends \
    curl build-essential libcap-dev libseccomp-dev pkg-config \
    libsystemd-dev git uidmap tini \
    && rm -rf /var/lib/apt/lists/*

# Create the isolate user (required for user namespaces)
RUN useradd -m isolate

# Clone and compile isolate
RUN git clone https://github.com/ioi/isolate.git /tmp/isolate \
    && cd /tmp/isolate \
    && make isolate \
    && make install \
    && rm -rf /tmp/isolate

WORKDIR /app

# Enable pnpm natively
RUN corepack enable pnpm

# Set tini as the absolute PID 1 master process
ENTRYPOINT ["/usr/bin/tini", "--"]

# We use sleep infinity to keep the container alive during this core development phase
CMD ["sleep", "infinity"]