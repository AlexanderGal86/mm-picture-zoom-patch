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
COPY src/ /build/src/

RUN git clone --depth=1 --branch=v10.11.15 https://github.com/mattermost/mattermost.git /build/mm-source

RUN bash /build/scripts/apply-patches.sh /build/mm-source

RUN cd /build/mm-source/webapp && \
    npm ci && \
    npm run build --workspace=channels

#
# Stage 2 — Copy binary into a shell-capable image to patch it and prepare
# an empty client directory
#
FROM node:18-bookworm AS patcher
WORKDIR /tmp

RUN apt-get update && apt-get install -y --no-install-recommends bsdmainutils xxd && \
    rm -rf /var/lib/apt/lists/*

COPY patch.sh /tmp/patch.sh
COPY license.mattermost-license /tmp/license.mattermost-license
COPY --from=mattermost/mattermost-enterprise-edition:10.11.15 /mattermost/bin/mattermost /tmp/mattermost.bin

RUN cp /tmp/mattermost.bin /tmp/mattermost.patched && \
    chmod +x /tmp/patch.sh && \
    /tmp/patch.sh /tmp/mattermost.patched && \
    cp /tmp/mattermost.patched /tmp/mattermost.bin

#
# Stage 3 — Final image
#
FROM scratch

# Copy entire enterprise image, then overlay our modifications
COPY --from=mattermost/mattermost-enterprise-edition:10.11.15 / /

COPY --from=patcher --chown=2000:2000 /tmp/mattermost.bin /mattermost/bin/mattermost
COPY --from=webapp-builder --chown=2000:2000 /build/mm-source/webapp/channels/dist/ /mattermost/client/
COPY license.mattermost-license /mattermost/config/license.mattermost-license

USER mattermost
WORKDIR /mattermost

ENV PATH=/mattermost/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin \
    SSL_CERT_FILE=/etc/ssl/certs/ca-certificates.crt \
    MM_SERVICESETTINGS_ENABLELOCALMODE=true

EXPOSE 8065/tcp 8067/tcp 8074/tcp 8075/tcp

VOLUME ["/mattermost/client/plugins", "/mattermost/config", "/mattermost/data", "/mattermost/logs", "/mattermost/plugins"]

HEALTHCHECK --interval=30s --timeout=10s \
  CMD ["/mattermost/bin/mmctl", "system", "status", "--local"]

CMD ["/mattermost/bin/mattermost"]
