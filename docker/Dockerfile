# syntax=docker/dockerfile:1
#
# Stage 1 — Build patched webapp
#
FROM node:18-bookworm AS webapp-builder
WORKDIR /build

RUN apt-get update && apt-get install -y --no-install-recommends git ca-certificates && \
    rm -rf /var/lib/apt/lists/*

COPY modified-files/ /build/modified-files/
COPY scripts/ /build/scripts/

RUN git clone --depth=1 --branch=v10.11.15 https://github.com/mattermost/mattermost.git /build/mm-source

RUN bash /build/scripts/apply-patches.sh /build/mm-source

RUN cd /build/mm-source/webapp && \
    npm ci && \
    npm run build --workspace=channels

#
# Stage 2 — Copy binary into a shell-capable image to patch it
#
FROM node:18-bookworm AS license-patcher
WORKDIR /tmp

COPY patch.sh /tmp/patch.sh
COPY license.mattermost-license /tmp/license.mattermost-license
COPY --from=mattermost/mattermost-enterprise-edition:10.11.15 /mattermost/bin/mattermost /tmp/mattermost.bin

RUN chmod +x /tmp/patch.sh && /tmp/patch.sh /tmp/mattermost.bin

#
# Stage 3 — Final image
#
FROM mattermost/mattermost-enterprise-edition:10.11.15
USER root

COPY --from=license-patcher --chown=2000:2000 /tmp/mattermost.bin /mattermost/bin/mattermost

RUN rm -rf /mattermost/client/*
COPY --from=webapp-builder --chown=2000:2000 /build/mm-source/webapp/channels/dist/ /mattermost/client/
COPY license.mattermost-license /mattermost/config/license.mattermost-license

USER mattermost
