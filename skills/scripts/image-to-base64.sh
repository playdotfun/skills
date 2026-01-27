#!/bin/bash
# image-to-base64.sh
# Converts jpeg/png/webp images to base64 encoded strings for Play.fun uploads
#
# Usage:
#   ./image-to-base64.sh <image_file>
#   ./image-to-base64.sh <image_file> --data-uri    # Include data URI prefix
#   ./image-to-base64.sh <image_file> --json        # Output as JSON object
#   ./image-to-base64.sh <image_file> --copy        # Copy to clipboard (requires xclip/pbcopy)
#
# Examples:
#   ./image-to-base64.sh game-thumbnail.png
#   ./image-to-base64.sh logo.jpg --data-uri
#   ./image-to-base64.sh banner.webp --json

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

usage() {
    echo "Usage: $0 <image_file> [options]"
    echo ""
    echo "Converts jpeg/png/webp images to base64 encoded strings."
    echo ""
    echo "Options:"
    echo "  --data-uri    Include data URI prefix (data:image/type;base64,...)"
    echo "  --json        Output as JSON object with filename, mimeType, and base64"
    echo "  --copy        Copy result to clipboard"
    echo "  --help        Show this help message"
    echo ""
    echo "Supported formats: .jpg, .jpeg, .png, .webp"
    exit 1
}

error() {
    echo -e "${RED}Error: $1${NC}" >&2
    exit 1
}

# Check if file argument provided
if [ $# -lt 1 ] || [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
    usage
fi

IMAGE_FILE="$1"
shift

# Parse options
DATA_URI=false
JSON_OUTPUT=false
COPY_CLIPBOARD=false

while [ $# -gt 0 ]; do
    case "$1" in
        --data-uri)
            DATA_URI=true
            ;;
        --json)
            JSON_OUTPUT=true
            ;;
        --copy)
            COPY_CLIPBOARD=true
            ;;
        *)
            error "Unknown option: $1"
            ;;
    esac
    shift
done

# Check if file exists
if [ ! -f "$IMAGE_FILE" ]; then
    error "File not found: $IMAGE_FILE"
fi

# Get file extension and determine MIME type
FILENAME=$(basename "$IMAGE_FILE")
EXTENSION="${FILENAME##*.}"
EXTENSION_LOWER=$(echo "$EXTENSION" | tr '[:upper:]' '[:lower:]')

case "$EXTENSION_LOWER" in
    jpg|jpeg)
        MIME_TYPE="image/jpeg"
        ;;
    png)
        MIME_TYPE="image/png"
        ;;
    webp)
        MIME_TYPE="image/webp"
        ;;
    *)
        error "Unsupported file format: .$EXTENSION_LOWER (supported: jpg, jpeg, png, webp)"
        ;;
esac

# Get file size for info
FILE_SIZE=$(stat -c%s "$IMAGE_FILE" 2>/dev/null || stat -f%z "$IMAGE_FILE" 2>/dev/null)
FILE_SIZE_KB=$((FILE_SIZE / 1024))

# Encode to base64
# Use -w0 on Linux (no line wrapping) or no flag on macOS
if base64 --help 2>&1 | grep -q '\-w'; then
    BASE64_CONTENT=$(base64 -w0 "$IMAGE_FILE")
else
    BASE64_CONTENT=$(base64 "$IMAGE_FILE" | tr -d '\n')
fi

# Calculate encoded size
ENCODED_SIZE=${#BASE64_CONTENT}
ENCODED_SIZE_KB=$((ENCODED_SIZE / 1024))

# Build output based on options
if [ "$JSON_OUTPUT" = true ]; then
    OUTPUT=$(cat <<EOF
{
  "filename": "$FILENAME",
  "mimeType": "$MIME_TYPE",
  "originalSize": $FILE_SIZE,
  "encodedSize": $ENCODED_SIZE,
  "base64": "$BASE64_CONTENT"
}
EOF
)
elif [ "$DATA_URI" = true ]; then
    OUTPUT="data:$MIME_TYPE;base64,$BASE64_CONTENT"
else
    OUTPUT="$BASE64_CONTENT"
fi

# Copy to clipboard if requested
if [ "$COPY_CLIPBOARD" = true ]; then
    if command -v pbcopy &> /dev/null; then
        echo -n "$OUTPUT" | pbcopy
        echo -e "${GREEN}Copied to clipboard!${NC}" >&2
    elif command -v xclip &> /dev/null; then
        echo -n "$OUTPUT" | xclip -selection clipboard
        echo -e "${GREEN}Copied to clipboard!${NC}" >&2
    elif command -v xsel &> /dev/null; then
        echo -n "$OUTPUT" | xsel --clipboard
        echo -e "${GREEN}Copied to clipboard!${NC}" >&2
    else
        echo -e "${YELLOW}Warning: No clipboard tool found (pbcopy/xclip/xsel)${NC}" >&2
    fi
fi

# Print info to stderr so it doesn't interfere with piping
echo -e "${GREEN}Converted:${NC} $FILENAME" >&2
echo -e "  MIME type: $MIME_TYPE" >&2
echo -e "  Original size: ${FILE_SIZE_KB}KB ($FILE_SIZE bytes)" >&2
echo -e "  Encoded size: ${ENCODED_SIZE_KB}KB ($ENCODED_SIZE chars)" >&2

# Output the result
echo "$OUTPUT"
