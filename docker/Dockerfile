# syntax=docker/dockerfile:1
#
# Stage 1 — Build patched webapp
#
FROM node:18-bookworm AS webapp-builder
WORKDIR /build

RUN apt-get update && apt-get install -y --no-install-recommends git ca-certificates && \
    rm -rf /var/lib/apt/lists/*

COPY patches/ /build/patches/
COPY modified-files/ /build/modified-files/
COPY scripts/ /build/scripts/

RUN git clone --depth=1 --branch=v10.11.15 https://github.com/mattermost/mattermost.git /build/mm-source

RUN bash /build/scripts/apply-patches.sh /build/mm-source

RUN cd /build/mm-source/webapp && \
    npm ci && \
    npm run build --workspace=channels

#
# Stage 2 — Patch license validation in binary
#
FROM mattermost/mattermost-enterprise-edition:10.11.15 AS license-patcher
USER root

COPY patch.sh /tmp/patch.sh
COPY license.mattermost-license /tmp/license.mattermost-license

RUN chmod +x /tmp/patch.sh && /tmp/patch.sh /mattermost/bin/mattermost

#
# Stage 3 — Final image
#
FROM mattermost/mattermost-enterprise-edition:10.11.15
USER root

COPY --from=license-patcher --chown=2000:2000 /mattermost/bin/mattermost /mattermost/bin/mattermost

RUN rm -rf /mattermost/client/*
COPY --from=webapp-builder --chown=2000:2000 /build/mm-source/webapp/channels/dist/ /mattermost/client/
COPY license.mattermost-license /mattermost/config/license.mattermost-license

USER mattermost
