# Game Upload Rules

Guidelines for uploading game assets and images to Play.fun.

## Game Details

When uploading games, the following fields are required:

- Game Name: The name of the game, if not obvious or provided by the game developer, come up with a name that is fun and descriptive towards the game
- Game Description: A short description of the game, including any relevant details about the gameplay, rules, or objectives
- Game URL: the URL of the game's website where it can be played, if iframable, this should be a direct link to the game. If the user needs to host it, consider using the [GitHub Pages Deploy](github-pages/deploy.md) skill.
- Platform: The platform the game is built for, either `web` or `desktop`
- Base 64 Image: The base 64 encoded image of the game's logo. Find the one the user is using already, or ask for them to provide one, unless you have the ability to generate one on the fly.

The rest of the fields should be filled out based on the game the user is trying to upload.

## Image Handling for AI Agents

### ⚠️ MANDATORY: Base64 Image Safety Rules

**You MUST follow these rules or you WILL crash the agent session:**

1. **NEVER run ANY bash command that outputs base64 or image data to stdout.** This includes `base64`, `echo`, `cat`, `head`, `python3 -c "...print(b64)..."`, variable interpolation like `echo "data:...$(base64 ...)"`, or any other command that would cause encoded image data to appear in the terminal. The agent runtime intercepts stdout, tries to parse image data, and crashes with "Could not process image".

2. **NEVER use the Read tool on binary image files** (png, jpg, webp). The Read tool will also try to interpret the image data and crash.

3. **ALL base64 conversion MUST write to a file using `> /tmp/file.txt` or `--file /tmp/file.txt`.** The output must NEVER appear in terminal.

4. **Use the Read tool ONLY on the resulting text file** (which contains the data URI string, not binary image data).

### The ONE Safe Workflow

Follow these exact steps. Do not deviate.

**Step 1: Get or create an image file on disk (≤ 256x256 pixels)**

If the user has one, use it. If you need a placeholder:
```bash
python3 -c "
import struct, zlib
def png(w,h,r,g,b):
    raw=b''
    for _ in range(h): raw+=b'\x00'+bytes([r,g,b])*w
    def chunk(t,d): return struct.pack('>I',len(d))+t+d+struct.pack('>I',zlib.crc32(t+d)&0xffffffff)
    return b'\x89PNG\r\n\x1a\n'+chunk(b'IHDR',struct.pack('>IIBBBBB',w,h,8,2,0,0,0))+chunk(b'IDAT',zlib.compress(raw))+chunk(b'IEND',b'')
open('/tmp/game_thumb.png','wb').write(png(64,64,74,144,226))
print('wrote /tmp/game_thumb.png')
"
```

**Step 2: Convert to base64 data URI — write to file, NEVER to stdout**
```bash
./skills/scripts/image-to-base64.sh /tmp/game_thumb.png --data-uri --file /tmp/game_image_b64.txt
```

**Step 3: Read the text file with the Read tool**
Use the Read tool on `/tmp/game_image_b64.txt`. This gives you a safe text string (the data URI).

**Step 4: Pass the data URI string to `register_game` or `update_game`**
Use the string from Step 3 as the `base64Image` parameter.

### What Will Crash The Agent (DO NOT DO THESE)

```bash
# ALL OF THESE WILL CRASH — they output image/base64 data to the terminal:
base64 -i image.png                                          # raw base64 to stdout
base64 -i image.png | tr -d '\n'                             # still goes to stdout
echo "data:image/png;base64,$(base64 -i image.png)"          # interpolation hits stdout
cat /tmp/game_image_b64.txt                                  # cat outputs to stdout
head -c 100 <(base64 -i image.png)                           # still outputs base64
python3 -c "import base64; print(base64.b64encode(...))"     # print sends to stdout
./skills/scripts/image-to-base64.sh image.png --data-uri     # no --file = stdout
```

```
# ALSO CRASHES — reading binary image files:
Read tool on .png/.jpg/.webp files                           # agent tries to render
```

### Image Size Requirements

- **Keep images ≤ 256x256 pixels** — larger images cause "Could not process image" errors from the API
- Square images (1:1 aspect ratio) work best for game thumbnails
- Supported formats: PNG, JPEG, WebP

## Supported Formats

- JPEG (.jpg, .jpeg)
- PNG (.png)
- WebP (.webp)

## Best Practices

1. **Optimize images before converting** - Use tools like `optipng`, `jpegoptim`, or `cwebp` to reduce file size
2. **Use appropriate formats**:
   - PNG for images with transparency
   - WebP for best compression (when supported)
   - JPEG for photographs without transparency
3. **Check encoded size** - Base64 increases file size by ~33%. The script reports both original and encoded sizes
4. **Square images for tokens** - Playcoin icons should be square (1:1 aspect ratio)

## How to use in the MCP `register_game` and `update_game` methods

The `register_game` and `update_game` methods accept a `base64Image` parameter for uploading game images. The workflow is:

1. Generate or find an image (≤256x256)
2. Convert to base64 data URI and **write to a file**: `./skills/scripts/image-to-base64.sh image.png --data-uri --file /tmp/b64.txt`
3. Read the file contents using the Read tool
4. Pass the contents as the `base64Image` parameter to the MCP `register_game` or `update_game` tool

Check the authentication status of the user with the [auth/setup](auth/SKILL.md) skill and script. If they are not authenticated, start the callback server and instruct the user to authenticate.
