# Scripts

Utility scripts for Play.fun integration workflows.

## image-to-base64.sh

Converts jpeg/png/webp images to base64 encoded strings for use with Play.fun uploads.

### Usage

```bash
# Basic usage - outputs raw base64
./image-to-base64.sh <image_file>

# With data URI prefix (for embedding in HTML/CSS)
./image-to-base64.sh <image_file> --data-uri

# As JSON object (includes metadata)
./image-to-base64.sh <image_file> --json

# Copy result to clipboard
./image-to-base64.sh <image_file> --copy
```

### Options

| Option | Description |
|--------|-------------|
| `--data-uri` | Include data URI prefix (`data:image/type;base64,...`) |
| `--json` | Output as JSON with filename, mimeType, originalSize, encodedSize, and base64 |
| `--copy` | Copy result to clipboard (requires xclip, xsel, or pbcopy) |
| `--file FILE` | Write result to file instead of stdout (**recommended for AI agents**) |
| `--help` | Show help message |

### Supported Formats

- `.jpg` / `.jpeg` (image/jpeg)
- `.png` (image/png)
- `.webp` (image/webp)

### Examples

```bash
# Convert a game thumbnail
./image-to-base64.sh game-thumbnail.png

# Get JSON output for API integration
./image-to-base64.sh logo.png --json

# Output:
# {
#   "filename": "logo.png",
#   "mimeType": "image/png",
#   "originalSize": 45678,
#   "encodedSize": 60904,
#   "base64": "iVBORw0KGgoAAAANSUhEUgAA..."
# }

# Get data URI for embedding
./image-to-base64.sh banner.webp --data-uri

# Output: data:image/webp;base64,UklGRlYAAABXRUJQ...
```

### Agent Usage

**CRITICAL: AI agents must NEVER output base64 data to stdout/terminal.** Raw base64 in terminal output will be interpreted as image data by the agent runtime, causing errors. Always use `--file`:

```bash
# CORRECT: Write to file, then read with the Read tool
./skills/scripts/image-to-base64.sh /path/to/image.png --data-uri --file /tmp/game_image_b64.txt

# WRONG: Do NOT output to terminal
./skills/scripts/image-to-base64.sh /path/to/image.png --data-uri   # BAD!
```

The script outputs metadata to stderr (safe) and content to stdout or the specified file.

## playfun-auth.js

Manages Play.fun API credentials for AI coding agent integration. Supports web callback and manual credential entry.

### Usage

```bash
# Check current authentication status
node skills/scripts/playfun-auth.js status

# Start local server for web authentication
node skills/scripts/playfun-auth.js callback

# Save manually pasted base64 credentials
node skills/scripts/playfun-auth.js manual <base64-credentials>

# Remove all stored credentials
node skills/scripts/playfun-auth.js clear

# Interactive setup wizard
node skills/scripts/playfun-auth.js setup
```

### Commands

| Command | Description |
|---------|-------------|
| `status` | Check current authentication status |
| `callback` | Start local server on port 9876 for web authentication |
| `manual <base64>` | Save manually pasted base64-encoded credentials |
| `clear` | Remove all stored credentials |
| `setup` | Interactive setup wizard |

### Web Callback Flow

1. Run `node skills/scripts/playfun-auth.js callback`
2. Open browser to `https://app.play.fun/skills-auth?callback=http://localhost:9876`
3. Authenticate with Play.fun
4. Credentials are automatically saved when Play.fun redirects back

### Credential Storage

- **Credentials**: `~/.playfun/config.json` (permissions: 600)
- **Agent MCP config**: e.g. `~/.claude.json` (MCP server configuration)

### Agent Usage

```bash
# Check if credentials exist
node skills/scripts/playfun-auth.js status

# If no credentials, start callback server and open browser
node skills/scripts/playfun-auth.js callback
# Then open: https://app.play.fun/skills-auth?callback=http://localhost:9876

# Or manually provide credentials
node skills/scripts/playfun-auth.js manual YXBpLWtleTpzZWNyZXQta2V5
```

See [Auth Setup](../auth/setup.md) for complete documentation.
