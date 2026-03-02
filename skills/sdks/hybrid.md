---
name: sdk-hybrid
description: Hybrid SDK integration for Play.fun - combining Server and Browser SDKs
metadata:
  tags: playfun, sdk, hybrid, reference, docs
---

## Overview

The Hybrid approach combines the **Server SDK** for secure point submission with the **Browser SDK** for displaying the Play.fun widget. This gives you the best of both worlds: security and user experience.

## Why Hybrid?

| Component   | Purpose                                            |
| ----------- | -------------------------------------------------- |
| Server SDK  | Secure point submission with validation            |
| Browser SDK | Display points widget, leaderboard, wallet connect |

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                    BROWSER                          │
│  ┌─────────────────────────────────────────────┐   │
│  │  Your Game                                   │   │
│  │  - Game logic runs here                      │   │
│  │  - Gets sessionToken from SDK after login    │   │
│  │  - Sends score + token to YOUR server        │   │
│  └─────────────────────────────────────────────┘   │
│                        │                            │
│  ┌─────────────────────▼───────────────────────┐   │
│  │  Browser SDK (widget only)                   │   │
│  │  - Shows Play.fun widget                     │   │
│  │  - Displays points, leaderboard              │   │
│  │  - Handles wallet connect for claims         │   │
│  │  - Do NOT call endGame() here!               │   │
│  └─────────────────────────────────────────────┘   │
└────────────────────────┼────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────┐
│                   YOUR SERVER                        │
│  ┌─────────────────────────────────────────────┐    │
│  │  1. Receive score + sessionToken from browser│    │
│  │  2. Validate token via server SDK            │    │
│  │  3. Validate the score (anti-cheat)          │    │
│  │  4. Submit via Server SDK using ogpId        │    │
│  └─────────────────────────────────────────────┘    │
│                        │                             │
│  ┌─────────────────────▼───────────────────────┐    │
│  │  Server SDK                                  │    │
│  │  client.play.validateSessionToken(token)     │    │
│  │  client.play.savePoints(...)                 │    │
│  └─────────────────────────────────────────────┘    │
└────────────────────────┼────────────────────────────┘
                         │
                         ▼
                  Play.fun API
```

## Flow

1. **Client SDK initializes** — player logs in, SDK provides `sessionToken` and `playerId`
2. **Client sends game state to your server** — includes `sessionToken` and score
3. **Server validates session token** — calls `validateSessionToken()` to verify the player
4. **Server validates game logic** — your own anti-cheat checks
5. **Server saves points** — calls `savePoints()` using the `ogpId` from validation
6. **Client syncs widget** — calls `refreshPointsAndMultiplier()` to update the display

## Server Setup (Node.js/Express)

Install the Server SDK:

```bash
npm install @playdotfun/server-sdk
```

Create your score submission endpoint:

```typescript
import express from 'express';
import { OpenGameClient } from '@playdotfun/server-sdk';

const app = express();
app.use(express.json());

const client = new OpenGameClient({
  apiKey: process.env.OGP_API_KEY!,
  secretKey: process.env.OGP_API_SECRET_KEY!,
});

const GAME_ID = process.env.GAME_ID!;

app.post('/api/submit-score', async (req, res) => {
  const { sessionToken, score, gameSessionId } = req.body;

  // Step 1: Validate the Play.fun session token
  const { valid, ogpId } = await client.play.validateSessionToken(sessionToken);
  if (!valid || !ogpId) {
    return res.status(401).json({ error: 'Invalid session token' });
  }

  // Step 2: YOUR VALIDATION LOGIC HERE
  const isValid = await validateScore(ogpId, score, gameSessionId);
  if (!isValid) {
    return res.status(400).json({ error: 'Invalid score' });
  }

  // Step 3: Save to Play.fun using ogpId (fastest resolution)
  try {
    await client.play.savePoints({
      gameId: GAME_ID,
      playerId: ogpId,
      points: score,
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Failed to save points:', error);
    res.status(500).json({ error: 'Failed to save points' });
  }
});

async function validateScore(playerId: string, score: number, sessionId: string): Promise<boolean> {
  // Implement your validation logic:
  // - Check session validity
  // - Verify score is reasonable for session duration
  // - Check for duplicate submissions
  // - Apply rate limiting
  return true;
}

app.listen(3000);
```

## Browser Setup

Add the Browser SDK for the widget — **do NOT call `endGame()` in hybrid setups**:

```html
<!DOCTYPE html>
<html>
  <head>
    <title>My Game</title>
    <meta name="x-ogp-key" content="your-api-key" id="ogp-key-meta" />
    <script src="https://sdk.play.fun"></script>
  </head>
  <body>
    <div id="game-container"></div>

    <script>
      // SDK for widget display only - NOT for point submission
      const sdk = new OpenGameSDK({
        ui: { usePointsWidget: true },
        logLevel: 'info',
      });

      sdk.on('OnReady', () => console.log('SDK ready'));
      sdk.on('LoginSuccess', () => {
        console.log('Player logged in');
        console.log('Session token:', sdk.sessionToken);
        console.log('Player ID:', sdk.playerId);
      });

      sdk.init({ gameId: 'your-game-uuid' });

      // Submit scores to YOUR server (not directly to Play.fun)
      async function submitScore(score) {
        const response = await fetch('/api/submit-score', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionToken: sdk.sessionToken,  // 30-min scoped token
            score: score,
            gameSessionId: currentSessionId,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to submit score');
        }

        // CRITICAL: Sync the widget after server saves points
        await sdk.refreshPointsAndMultiplier();

        return response.json();
      }
    </script>
  </body>
</html>
```

## Complete Example

### Server (server.ts)

```typescript
import express from 'express';
import { OpenGameClient } from '@playdotfun/server-sdk';

const app = express();
app.use(express.json());
app.use(express.static('public'));

const client = new OpenGameClient({
  apiKey: process.env.OGP_API_KEY!,
  secretKey: process.env.OGP_API_SECRET_KEY!,
});

const GAME_ID = process.env.GAME_ID!;

// In-memory session store (use Redis in production)
const sessions = new Map<string, { ogpId: string; startTime: number; maxScore: number }>();

// Start a game session
app.post('/api/start-session', async (req, res) => {
  const { sessionToken } = req.body;

  // Validate the Play.fun session token
  const { valid, ogpId } = await client.play.validateSessionToken(sessionToken);
  if (!valid || !ogpId) {
    return res.status(401).json({ error: 'Invalid session' });
  }

  const sessionId = crypto.randomUUID();
  sessions.set(sessionId, {
    ogpId,
    startTime: Date.now(),
    maxScore: 0,
  });

  res.json({ sessionId });
});

// Submit score with validation
app.post('/api/submit-score', async (req, res) => {
  const { sessionToken, score, gameSessionId } = req.body;

  // Re-validate the Play.fun session token
  const { valid, ogpId } = await client.play.validateSessionToken(sessionToken);
  if (!valid || !ogpId) {
    return res.status(401).json({ error: 'Invalid session token' });
  }

  const session = sessions.get(gameSessionId);

  // Validation checks
  if (!session) {
    return res.status(400).json({ error: 'Invalid game session' });
  }

  if (session.ogpId !== ogpId) {
    return res.status(400).json({ error: 'Player mismatch' });
  }

  const sessionDuration = Date.now() - session.startTime;
  const maxPossibleScore = Math.floor(sessionDuration / 1000) * 10; // 10 points per second max

  if (score > maxPossibleScore) {
    return res.status(400).json({ error: 'Score too high for session duration' });
  }

  // Save to Play.fun
  await client.play.savePoints({
    gameId: GAME_ID,
    playerId: ogpId,
    points: score,
  });

  // Clean up session
  sessions.delete(gameSessionId);

  res.json({ success: true });
});

app.listen(3000);
```

### Browser (public/index.html)

```html
<!DOCTYPE html>
<html>
  <head>
    <title>My Hybrid Game</title>
    <meta name="x-ogp-key" content="your-api-key" id="ogp-key-meta" />
    <script src="https://sdk.play.fun"></script>
  </head>
  <body>
    <h1>Click Game</h1>
    <button id="login-btn">Login to Play</button>
    <button id="start-btn" disabled>Start Game</button>
    <button id="click-btn" disabled>Click Me!</button>
    <button id="end-btn" disabled>End Game</button>
    <p>Score: <span id="score">0</span></p>

    <script>
      const sdk = new OpenGameSDK({
        ui: { usePointsWidget: true },
        logLevel: 'info',
      });

      let sessionId = null;
      let score = 0;

      sdk.on('LoginSuccess', () => {
        document.getElementById('login-btn').disabled = true;
        document.getElementById('start-btn').disabled = false;
        console.log('Logged in, token:', sdk.sessionToken);
      });

      sdk.init({ gameId: 'your-game-uuid' });

      document.getElementById('login-btn').onclick = () => sdk.login();

      document.getElementById('start-btn').onclick = async () => {
        const res = await fetch('/api/start-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionToken: sdk.sessionToken }),
        });
        const data = await res.json();
        sessionId = data.sessionId;
        score = 0;
        document.getElementById('score').textContent = '0';
        document.getElementById('click-btn').disabled = false;
        document.getElementById('end-btn').disabled = false;
        document.getElementById('start-btn').disabled = true;
      };

      document.getElementById('click-btn').onclick = () => {
        score += 10;
        document.getElementById('score').textContent = score;
        // Update widget display (not saving to server yet)
        sdk.addPoints(10);
      };

      document.getElementById('end-btn').onclick = async () => {
        await fetch('/api/submit-score', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionToken: sdk.sessionToken,
            score: score,
            gameSessionId: sessionId,
          }),
        });

        // Sync the widget with server-saved points
        await sdk.refreshPointsAndMultiplier();

        document.getElementById('click-btn').disabled = true;
        document.getElementById('end-btn').disabled = true;
        document.getElementById('start-btn').disabled = false;
        sessionId = null;
      };
    </script>
  </body>
</html>
```

## Session Token Details

- **Format:** `player_xxx...`
- **Expiry:** 30 minutes
- **Scope:** Game-specific — cannot be used across different games
- **Security:** Does not expose underlying authentication credentials
- **Access:** `sdk.sessionToken` after login
- **Validation:** Use `client.play.validateSessionToken(token)` on the server

## Important Notes

- **Do NOT call `endGame()` in hybrid setups** — use server SDK for point submission
- **Always call `refreshPointsAndMultiplier()`** after the server saves points to sync the widget
- **Session tokens expire after 30 minutes** — handle expiration gracefully
- **Use `ogpId`** from `validateSessionToken()` as the `playerId` in `savePoints()` for optimal performance
- **Server validates, browser displays**: Never trust client-side scores
- **Session management**: Track game sessions to prevent replay attacks
- **Rate limiting**: Implement server-side rate limiting to prevent abuse
