FROM node:22-bookworm-slim

ENV DEBIAN_FRONTEND=noninteractive

RUN corepack enable pnpm

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libcap-dev \
    libseccomp-dev \
    pkg-config \
    libsystemd-dev \
    git \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

RUN git clone https://github.com/ioi/isolate.git /tmp/isolate \
    && cd /tmp/isolate \
    && make isolate \
    && make install \
    && rm -rf /tmp/isolate

WORKDIR /app

# (For development phase, we keep it alive. In production, this will be `CMD ["pnpm", "start"]`)
CMD ["tail", "-f", "/dev/null"]