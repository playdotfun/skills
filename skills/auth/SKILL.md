# Play.fun Authentication Setup

This guide helps users configure Play.fun API credentials for Claude Code integration.

## When to Use

Use this skill when:

- A user wants to register or update a game on Play.fun
- A user wants to launch a playcoin
- A user wants to perform any authenticated Play.fun operation
- The `test_connection` MCP tool fails with authentication errors

## Prerequisites

Users need a Play.fun account with creator credentials:

1. Go to https://app.play.fun and sign in

## Authentication Methods

### Method 1: Web Callback (Recommended)

This method starts a local server that receives credentials via redirect from Play.fun.

**Steps:**

1. Run the callback server in the background and ensure it is running:
   ```bash
   node skills/scripts/playfun-auth.js callback
   ```
2. The server will start on `http://localhost:9876`
3. Prompt the user to open the browser to: `https://app.play.fun/skills-auth?callback=http://localhost:9876/callback`
4. The user will be prompted to authenticate with Play.fun if not done already, and then the redirect will occur with the credentials (also displayed in the browser window to be pasted into the terminal if needed)
5. The script automatically saves credentials to `~/.claude.json`

**Notes:**

- Server auto-shuts down after 5 minutes if no credentials received
- Server only listens on localhost for security

### Method 2: Manual Paste

For users who have their credentials in base64 format.

**Steps:**

1. User provides base64-encoded credentials (format: `base64(apiKey:secretKey)`)
2. Run:
   ```bash
   node skills/scripts/playfun-auth.js manual <base64-credentials>
   ```
3. Credentials are decoded and saved

**Example:**

```bash
node skills/scripts/playfun-auth.js manual YXBpLWtleTpzZWNyZXQta2V5
```

### Interactive Setup

For a guided experience:

```bash
node skills/scripts/playfun-auth.js setup
```

This prompts the user to choose between callback and manual methods.

## Verifying Credentials

After setup, verify credentials work using the MCP tool:

```
Use the test_connection MCP tool to verify the credentials are valid.
```

## Checking Status

To check current authentication status:

```bash
node skills/scripts/playfun-auth.js status
```

This shows:

- Whether credentials exist
- Partial API key (for identification)
- When credentials were created
- Source method (callback or manual)
- Claude config status

## Clearing Credentials

To remove stored credentials:

```bash
node skills/scripts/playfun-auth.js clear
```

This removes credentials from:

- `~/.claude.json` MCP server config

## Credential Storage

**Locations:**

- Claude config: `~/.claude.json`

**Config format:**

```json
{
  "apiKey": "user-uuid",
  "secretKey": "secret-key",
  "createdAt": "2026-01-26T00:00:00Z",
  "source": "callback|manual"
}
```

## Troubleshooting

### Port 9876 already in use

Another process is using the callback port. Either:

- Kill the process using port 9876
- Use the manual method instead

### Invalid credentials

- Ensure the base64 string is correctly formatted
- Format must be: `base64(apiKey:secretKey)` with a colon separator
- Get fresh credentials from Play.fun dashboard

### Claude config not updating

- Check that `~/.claude.json` is writable
- Restart Claude Code after credential setup

### test_connection fails after setup

- Credentials may be invalid or expired
- Run `node skills/scripts/playfun-auth.js clear` and set up again with fresh credentials

## Workflow for Claude

When performing authenticated Play.fun operations:

1. **Check credentials exist:**

   ```bash
   node skills/scripts/playfun-auth.js status
   ```

2. **If no credentials, offer setup options:**
   - Ask if user prefers callback or manual method
   - For callback: Run server and provide instructions
   - For manual: Ask for base64 credentials string

3. **After setup, validate:**
   - Use `test_connection` MCP tool
   - If valid, proceed with the requested operation

4. **Handle errors:**
   - If authentication fails, suggest clearing and re-setting credentials
   - Provide link to Play.fun dashboard for credential generation
