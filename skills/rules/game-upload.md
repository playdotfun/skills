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

## Image Conversion

When uploading images for games, convert them to base64 first using the provided script:

```bash
# Within the skills directory
./scripts/image-to-base64.sh <image_path> [options]
```

### Supported Formats

- JPEG (.jpg, .jpeg)
- PNG (.png)
- WebP (.webp)

### How to use

```bash
# Use the --data-uri option to encode the image as a URI for upload
./scripts/image-to-base64.sh logo.png --data-uri
```

## Best Practices

1. **Keep images 256x256 pixels or smaller** — Larger images (512x512+) can fail to process during registration. Resize before converting to base64
2. **Optimize images before converting** — Use tools like `optipng`, `jpegoptim`, or `cwebp` to reduce file size
3. **Use appropriate formats**:
   - PNG for images with transparency
   - WebP for best compression (when supported)
   - JPEG for photographs without transparency
4. **Check encoded size** — Base64 increases file size by ~33%. The script reports both original and encoded sizes
5. **Square images for tokens** — Playcoin icons should be square (1:1 aspect ratio)
6. **Prefer manual base64 encoding** — The `image-to-base64.sh` script outputs base64 to stdout, which AI tools may interpret as image data rather than text. If that happens, use `base64 -i <file> | tr -d '\n'` directly instead

## Workflow

1. Prepare your image file (resize/optimize as needed)
2. Convert to base64 using the script
3. Use the base64 string in your API call or store for later use

## How to use in the MCP `register_game` and `update_game` methods

The `register_game` and `update_game` methods accept a `base64Image` parameter for uploading game images. Check the authentication status of the user with the [auth/setup](auth/setup.md) skill and script. If they are not authenticated, start the callback server and instruct the user to authenticate. Once authenticated, they can re-authenticate with the MCP server and you can start the upload process.
