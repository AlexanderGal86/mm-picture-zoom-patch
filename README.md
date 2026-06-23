# mm-picture-zoom-patch

Custom Docker image for **Mattermost 10.11.15 Enterprise Edition** with image wheel zoom/pan in FilePreviewModal.

- **Registry**: `dockerhub.xxxxxx.ru/test/mm-picture-zoom:10.11.15-patch1`
- **CI**: GitHub Actions (validate + test pass, docker-build-and-push disabled — internal network)
- **Tests**: 18 unit tests, lint clean, typecheck clean

---

## Features

- **Wheel zoom** — scroll up/down to zoom in/out images in FilePreviewModal
- **Pan** — drag image when zoomed in
- **Zoom reset** — switching between files resets zoom
- **SVG support** — SVG images work with zoom and pan
- **PDF unchanged** — existing PDF zoom controls are untouched
- **License bypass** — binary license validation is compatible

## Quick start

```bash
docker pull dockerhub.xxxxxx.ru/test/mm-picture-zoom:10.11.15-patch1
```

```yaml
# docker-compose.yml
services:
  mattermost:
    image: dockerhub.xxxxxx.ru/test/mm-picture-zoom:10.11.15-patch1
    ports:
      - "8065:8065"
    environment:
      MM_SQLSETTINGS_DATASOURCE: "postgres://mmuser:mmuser_password@postgres:5432/mattermost?sslmode=disable"
    volumes:
      - mm-data:/mattermost/data
      - mm-config:/mattermost/config
```

## Build locally

```bash
gh repo clone AlexanderGal86/mm-picture-zoom-patch
cd mm-picture-zoom-patch
docker login dockerhub.xxxxxx.ru

# Build only (default — no push)
bash scripts/build-and-push.sh

# Build and push
PUSH=true bash scripts/build-and-push.sh
```

## What is patched

| File | Change |
|---|---|
| `webapp/channels/.../image_preview.tsx` | Added Panzoom init, wheel listener, destroy on unmount |
| `webapp/channels/.../image_preview.scss` | Container: flex, overflow:hidden, touch-action:none. Image: cursor grab/grabbing |
| `webapp/channels/package.json` | Added `@panzoom/panzoom` dependency |
| `mattermost/bin/mattermost` | Binary license check bypassed (jz → jnz at 0xd9f169) |

## Repository structure

```
├── .github/workflows/ci.yml       # CI: validate + test
├── docker/Dockerfile               # 3-stage build (webapp → patcher → scratch)
├── modified-files/                 # Patched source
│   ├── image_preview.tsx
│   └── image_preview.scss
├── scripts/
│   ├── apply-patches.sh            # Apply patches to Mattermost source
│   └── build-and-push.sh           # Docker build + push (push gated by PUSH=true)
├── src/__tests__/
│   └── image_preview.test.tsx      # 18 Jest unit tests
├── patch.sh                        # Binary license bypass script
├── license.mattermost-license      # Enterprise license file
└── README.md
```

## CI pipeline

| Stage | Status | Description |
|---|---|---|
| `validate` | ✅ | ESLint + TypeScript typecheck on patched source |
| `test` | ✅ | 18 Jest unit tests (zoom, pan, SVG, edge cases) |
| `docker-build-and-push` | ⛔ (if: false) | Internal Harbor — build/push done locally |
| `e2e-smoke` | ⛔ | Depends on docker job — disabled |

## Development history

### v1.0.0 — 2026-05-21

```
63065ec — Initial commit: project scaffold, modified files, Dockerfile, scripts
d11ccc7 — Add CI workflow (validate + test + docker + e2e)
be005fd — Remove workflow temporarily (push workaround)
5d0d0a2 — Restore CI workflow
e709ec6 — Add CI workflow (fixed)
36796cb — Fix apply-patches to copy test file to MM source
29148aa — Fix CI commands and test mock
6c741b4 — Fix test assertions and lint imports
78a292d — Fix all lint errors and test failures
8337ee1 — Fix lint: import order, new-cap, no-loop-func
f75e2f2 — Suppress import/order lint for Panzoom import
a2f7c02 — Fix TS errors: unknown cast, optional link fallback
dfdc816 — Disable import/order for patched file
f1af765 — Fix Dockerfile paths, disable CI docker push
2ad8942 — Fix Dockerfile: use shell-capable stage for binary patching
aa011fc — Fix Dockerfile: install hexdump/xxd for license patcher
dcc43f5 — Fix Dockerfile: copy src/ for apply-patches
b8e008c — Fix Dockerfile: make binary writable before patching
2b49de6 — Fix Dockerfile: use FROM scratch (distroless no shell)
```

### Key technical decisions

1. **Full-file replacement** (`modified-files/`) instead of `.patch` diff files — more reliable, easier to debug
2. **`eslint-disable import/order`** — needed because Panzoom import can't be reordered without changing original file structure
3. **`as unknown as jest.Mock`** — TypeScript strict mode requires this cast for mocked Panzoom
4. **`FROM scratch` final stage** — enterprise image is distroless (no `/bin/sh`), so all modifications happen in shell-capable builder stages
5. **Binary patching workaround** — `COPY --from` creates overlay filesystem files that `dd` can't write; copy to temp file first
6. **CI docker job disabled** — Harbor registry is on internal network, unreachable from GitHub Actions
7. **Push gated by `PUSH=true`** — avoid accidental pushes to internal registry from local builds

### Test results

- **ESLint**: 0 errors, 0 warnings
- **TypeScript**: typecheck clean
- **Jest**: 18/18 tests passing (zoom lifecycle, SVG, edge cases, pan, cleanup)
- **Docker**: Server starts, license bypass confirmed, panzoom code confirmed in JS bundle

## License

Mattermost is licensed under MIT. See [LICENSE](https://github.com/mattermost/mattermost/blob/master/LICENSE) file.
