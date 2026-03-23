---
name: sdk-best-practices
description: Best practices for integrating with Play.fun SDKs
metadata:
  tags: playfun, sdk, best-practices, guide
---

## SDK Selection Guide

| Scenario                                 | Recommended SDK               |
| ---------------------------------------- | ----------------------------- |
| Production game with token rewards       | **Server SDK**                |
| Game where cheating would be problematic | **Server SDK**                |
| Want both security and Play.fun widget   | **Hybrid** (Server + Browser) |
| Quick prototype / demo                   | Browser SDK                   |
| "Vibe coded" simple game                 | Browser SDK                   |
| Game jam entry                           | Browser SDK                   |

## Core Concepts

### Games

A **Game** is your registered application on Play.fun. Each game has:

- Unique UUID identifier
- Anti-cheat configuration (score limits)
- Metadata (name, description, URLs)
- Optional playcoin (game token)

### Points

**Points** are the in-game scores tracked per player. They:

- Form the basis for token rewards
- Are tracked per player per game
- Should be validated server-side for production games

### Playcoins

A **Playcoin** is a game-specific Solana token that:

- Has a bonding curve for trading
- Rewards players based on gameplay points
- Can "graduate" to full DEX trading

## Anti-Cheat Configuration

When registering your game, set these limits to prevent abuse:

```typescript
await client.games.register({
  name: "My Game",
  description: "Description",
  gameUrl: "https://mygame.com",
  platform: "web",
  // Anti-cheat limits:
  maxScorePerSession: 1000, // Max points per play session
  maxSessionsPerDay: 10, // Max sessions per player per day
  maxCumulativePointsPerDay: 5000, // Hard daily cap per player
});
```

### Choosing Limits

| Game Type        | maxScorePerSession | maxSessionsPerDay | maxCumulativePointsPerDay |
| ---------------- | ------------------ | ----------------- | ------------------------- |
| Casual clicker   | 100-500            | 20-50             | 2,000-5,000               |
| Skill-based game | 500-2,000          | 5-10              | 5,000-10,000              |
| Competitive game | 1,000-5,000        | 3-5               | 10,000-20,000             |

## Security Best Practices

### Credential Management

```typescript
// GOOD: Use environment variables
const client = new OpenGameClient({
  apiKey: process.env.OGP_API_KEY!,
  secretKey: process.env.OGP_API_SECRET_KEY!,
});

// BAD: Never hardcode credentials
const client = new OpenGameClient({
  apiKey: "abc123", // DON'T DO THIS
  secretKey: "xyz789",
});
```

### Server-Side Validation

Always validate scores before submitting to Play.fun:

```typescript
app.post("/api/submit-score", async (req, res) => {
  const { playerId, score, sessionId } = req.body;

  // 1. Validate session exists
  const session = await getSession(sessionId);
  if (!session) return res.status(400).json({ error: "Invalid session" });

  // 2. Check session ownership
  if (session.playerId !== playerId) {
    return res.status(400).json({ error: "Session mismatch" });
  }

  // 3. Validate score is reasonable
  const maxPossible = calculateMaxPossibleScore(session);
  if (score > maxPossible) {
    return res.status(400).json({ error: "Score too high" });
  }

  // 4. Check for replay attacks
  if (session.submitted) {
    return res.status(400).json({ error: "Already submitted" });
  }

  // 5. Submit to Play.fun
  await client.play.savePoints({ gameId, playerId, points: score });
  await markSessionSubmitted(sessionId);

  res.json({ success: true });
});
```

### Rate Limiting

Implement rate limiting on your server:

```typescript
import rateLimit from "express-rate-limit";

const scoreLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 requests per minute
  message: "Too many score submissions",
});

app.post("/api/submit-score", scoreLimiter, async (req, res) => {
  // ... handler
});
```

## Player Identification

The Server SDK accepts flexible player ID formats:

| Format          | Example                    | Notes                                   |
| --------------- | -------------------------- | --------------------------------------- |
| Solana wallet   | `sol:9qdvVLY3v...`         | Looks up/creates user by Solana address |
| Ethereum wallet | `eth:0x123...`             | Looks up/creates user by ETH address    |
| Email           | `email:player@example.com` | Looks up/creates user by email          |
| Twitter/X       | `twitter:username`         | Looks up/creates user by handle         |
| Privy ID        | `did:privy:abc123`         | Direct Privy user ID                    |
| OGP User ID     | `550e8400-e29b-...`        | Raw UUID format (fastest)               |

### Session Token (Recommended for Hybrid)

```typescript
// Use validateSessionToken for hybrid integrations
const { valid, ogpId } = await client.play.validateSessionToken(sessionToken);
// Use ogpId as playerId for best performance
```

### Anonymous (Browser SDK only)

```typescript
// Generate and persist a UUID
let playerId = localStorage.getItem("playerId");
if (!playerId) {
  playerId = crypto.randomUUID();
  localStorage.setItem("playerId", playerId);
}
```

## Error Handling

```typescript
try {
  await client.play.savePoints({ gameId, playerId, points });
} catch (error) {
  if (error.code === "RATE_LIMITED") {
    // Retry with backoff
  } else if (error.code === "INVALID_GAME") {
    // Check game ID
  } else if (error.code === "POINTS_EXCEEDED") {
    // Player hit daily limit
  } else {
    // Log and handle unexpected errors
    console.error("Failed to save points:", error);
  }
}
```

## Batch Operations

For efficiency, batch multiple point saves:

```typescript
// Instead of multiple single saves:
await client.play.savePoints({ gameId, playerId: "p1", points: 100 });
await client.play.savePoints({ gameId, playerId: "p2", points: 200 });
await client.play.savePoints({ gameId, playerId: "p3", points: 150 });

// Use batch save:
await client.play.batchSavePoints({
  gameId,
  pointsRecord: {
    p1: 100,
    p2: 200,
    p3: 150,
  },
});
```

## Safe Area Layout

Games on Play.fun run fullscreen on mobile Safari. The SDK provides safe area insets so game UI stays visible while backgrounds bleed behind browser controls.

### The Rules

1. **Backgrounds fill the full viewport** — canvas, background images, and decorative elements should use `100vw × 100vh` with no margin. This ensures no gaps appear behind Safari's URL bar or bottom toolbar
2. **UI elements respect safe area insets** — HUD, buttons, score displays, and interactive controls must be offset by the inset values so they remain visible and tappable
3. **Always provide a 0px fallback** — when games run standalone (not in the dashboard), the CSS variables are unset. Use `var(--ogp-safe-top-inset, 0px)` to fall back gracefully
4. **Never hardcode inset pixel values** — the bottom inset varies by Safari tab mode (Top/Bottom/Compact). Always read the CSS variable or SDK property

### HUD Placement Rules

HUD elements must be **fully inside** the safe zone, not just positioned at its edge:

- **Add margin inside the safe zone** — position elements with an additional margin (e.g. 16px) inward from the safe area boundary so they don't sit flush against the edge
- **Top-anchored UI** stacks downward from `safeTop + margin`
- **Bottom-anchored UI** stacks upward from `gameHeight - safeBottom - elementHeight - margin`
- **Never overlap the inset area** — the entire element (including its full height/width) must fit within the safe zone, not just its anchor point

Example for canvas games:
```javascript
const margin = 16;
const safeTop = parseInt(sdk.safeTopInset) || 0;
const safeBottom = parseInt(sdk.safeBottomInset) || 0;

// Top-left: score text
ctx.fillText(`Score: ${score}`, margin, safeTop + margin + fontSize);

// Bottom-left: lives text — stack upward from safe bottom
const bottomY = canvas.height - safeBottom - margin;
ctx.fillText(`Lives: ${lives}`, margin, bottomY);
```

### CSS Variables (set automatically by SDK)

```css
.game-hud-top    { margin-top: var(--ogp-safe-top-inset, 0px); }
.game-hud-bottom { margin-bottom: var(--ogp-safe-bottom-inset, 0px); }
```

### JS Properties

```javascript
const topInset = parseInt(sdk.safeTopInset) || 0;
const bottomInset = parseInt(sdk.safeBottomInset) || 0;
const safeHeight = window.innerHeight - topInset - bottomInset;
```

### Canvas / Phaser / Three.js

For canvas-based games, read the insets via JS and offset your camera, UI overlay, or drawing coordinates. See [Browser SDK Snippets](../snippets/browser-sdk.md#safe-area-insets) for complete examples.

## Game Pause / Resume on Modals

**Critical UX requirement**: The SDK opens fullscreen modals for `savePoints()`, `login()`, and `showClaim()`. Games **MUST** pause gameplay when these modals appear. Without pausing, players die, miss inputs, or lose progress while the modal blocks the screen.

The SDK emits `GamePause` before any modal opens and `GameResume` when the modal closes:

```javascript
// Browser SDK — wire pause/resume to your game engine
sdk.on("GamePause", () => {
  // Phaser: scene.scene.pause()
  // Three.js: set a paused flag, skip update in rAF loop
  // Custom: cancelAnimationFrame, pause timers, etc.
});

sdk.on("GameResume", () => {
  // Phaser: scene.scene.resume()
  // Three.js: clear paused flag
  // Custom: restart rAF loop, resume timers
});
```

This covers all modal-showing methods: `savePoints()` / `endGame()`, `login()`, and `showClaim()`.

## Testing

### Development Mode

Use a test game for development:

```typescript
const GAME_ID =
  process.env.NODE_ENV === "production"
    ? process.env.PROD_GAME_ID
    : process.env.DEV_GAME_ID;
```

### Verifying Integration

```typescript
// Test connection
const user = await client.users.me();
console.log("Connected as:", user.id);

// Test game access
const game = await client.games.getById({ gameId: GAME_ID });
console.log("Game:", game.name);

// Test point submission
await client.play.savePoints({
  gameId: GAME_ID,
  playerId: "test-player",
  points: 1,
});
console.log("Points saved successfully");
```

