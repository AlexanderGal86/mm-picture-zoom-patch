# mm-picture-zoom-patch

Custom Docker image for **Mattermost 10.11.15 Enterprise Edition** with image wheel zoom/pan in FilePreviewModal and license patch.

## Features

- **Wheel zoom** — scroll up/down to zoom in/out images in FilePreviewModal
- **Pan** — drag image when zoomed in
- **Zoom reset** — switching between files resets zoom
- **SVG support** — SVG images work with zoom and pan
- **PDF unchanged** — existing PDF zoom controls are untouched
- **License bypass** — binary license validation is patched

## Usage

```bash
docker pull dockerhub.katharsis.ru/test/mm-picture-zoom:10.11.15-patch1
```

In your `docker-compose.yml`:

```yaml
services:
  mattermost:
    image: dockerhub.katharsis.ru/test/mm-picture-zoom:10.11.15-patch1
    # ...
```

## Build locally

```bash
gh repo clone AlexanderGal86/mm-picture-zoom-patch
cd mm-picture-zoom-patch

# Place license file and patch script
cp /path/to/license.mattermost-license .
cp /path/to/patch.sh .

# Build and push
docker login dockerhub.katharsis.ru
bash scripts/build-and-push.sh
```

## Repository structure

```
├── .github/workflows/ci.yml   # CI pipeline
├── docker/Dockerfile           # Multi-stage build
├── modified-files/             # Patched source files
│   ├── image_preview.tsx
│   └── image_preview.scss
├── scripts/
│   ├── apply-patches.sh        # Applies patches to Mattermost source
│   └── build-and-push.sh       # Docker build + push
├── src/__tests__/              # Jest unit tests
│   └── image_preview.test.tsx
└── README.md
```

## What is patched

| File | Change |
|---|---|
| `webapp/channels/.../image_preview.tsx` | Added Panzoom init, wheel listener, destroy on unmount |
| `webapp/channels/.../image_preview.scss` | Container: flex, overflow:hidden, touch-action:none. Image: cursor grab/grabbing |
| `webapp/channels/package.json` | Added `@panzoom/panzoom` dependency |

## CI pipeline

| Stage | Description |
|---|---|
| `validate` | Lint + typecheck on patched source |
| `test` | 18 Jest unit tests covering zoom lifecycle, SVG, edge cases |
| `docker-build-and-push` | Multi-stage Docker build → push to Harbor |
| `e2e-smoke` | Starts Mattermost container, checks HTTP 200 + static assets |

## License

Mattermost is licensed under MIT. See [LICENSE](https://github.com/mattermost/mattermost/blob/master/LICENSE) file.
