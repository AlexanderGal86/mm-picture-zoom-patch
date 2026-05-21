#!/bin/bash
set -euo pipefail

if [ $# -lt 1 ]; then
    echo "Usage: $0 <mattermost-source-dir>"
    exit 1
fi

MM_DIR="$1"
PATCH_DIR="$(cd "$(dirname "$0")/.." && pwd)"

if [ ! -d "$MM_DIR/webapp/channels" ]; then
    echo "Error: '$MM_DIR' does not look like a Mattermost source directory (webapp/channels not found)"
    exit 1
fi

echo "Applying ImagePreview patch..."

cp "$PATCH_DIR/modified-files/image_preview.tsx" \
   "$MM_DIR/webapp/channels/src/components/file_preview_modal/image_preview.tsx"

cp "$PATCH_DIR/modified-files/image_preview.scss" \
   "$MM_DIR/webapp/channels/src/components/file_preview_modal/image_preview.scss"

echo "Copying unit tests..."
mkdir -p "$MM_DIR/webapp/channels/src/__tests__"
cp "$PATCH_DIR/src/__tests__/image_preview.test.tsx" \
   "$MM_DIR/webapp/channels/src/__tests__/image_preview.test.tsx"

echo "Adding @panzoom/panzoom dependency..."
cd "$MM_DIR/webapp"
npm add @panzoom/panzoom --workspace=channels

echo "Patches applied successfully."
