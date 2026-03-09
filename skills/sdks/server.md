---
name: sdk-server
description: Server SDK reference for Play.fun - recommended for production games
metadata:
  tags: playfun, sdk, server, reference, docs
---

## Overview

The Server SDK (`@playdotfun/server-sdk`) is the **recommended** way to integrate with Play.fun for production games. It handles HMAC authentication automatically and provides secure server-side point tracking.

## When to Use

| Use Server SDK                          | Use Browser SDK Instead             |
| --------------------------------------- | ----------------------------------- |
| Production games with token rewards     | Quick prototypes                    |
| Games where cheating prevention matters | "Vibe coded" simple games           |
| When you need to validate scores        | Game jam entries                    |
| Any game with real value at stake       | Demos where accuracy doesn't matter |

## Architecture

```
Browser Game → Your Server (validates) → Server SDK → Play.fun API
```

## Installation

```bash
npm install @playdotfun/server-sdk
# or: pnpm i / yarn add / bun add @playdotfun/server-sdk
```

**Requirements:** Node.js 20+, Deno 1.28+, Bun 1.0+, or Nitro 2.6+

## Initialize Client

```typescript
import { OpenGameClient } from '@playdotfun/server-sdk';

const client = new OpenGameClient({
  apiKey: process.env.OGP_API_KEY!,
  secretKey: process.env.OGP_API_SECRET_KEY!,
});
```

## Games API

### List Games

```typescript
const { items } = await client.games.get({
  limit: 50,
  query: 'search term',
});
```

### Get Game by ID

```typescript
const game = await client.games.getById({ gameId: 'your-game-uuid' });
```

### Get Multiple Games

```typescript
const games = await client.games.getManyByIds({ gameIds: ['uuid-1', 'uuid-2'] });
```

### Get Your Games

```typescript
const { items } = await client.games.getAuthedGames();
```

### Get Game by Token

```typescript
const game = await client.games.getByTokenId({ tokenId: 'token-mint-address' });
```

### Register a New Game

```typescript
const game = await client.games.register({
  name: 'My Game',
  description: 'A description of more than 10 characters',
  gameUrl: 'https://mygame.com',
  platform: 'HTML',        // 'HTML' or 'EXTERNAL_URL'
  isHTMLGame: true,
  iframable: true,
  // Optional social links:
  twitter: 'https://x.com/myhandle',
  discord: 'https://discord.gg/invite',
  telegram: 'https://t.me/mychannel',
  // Optional anti-cheat limits (recommended):
  maxScorePerSession: 1000,
  maxSessionsPerDay: 10,
  maxCumulativePointsPerDay: 5000,
  // Optional images (base64 data URIs):
  base64Image: '...',
  base64CoverImage: '...',
});

console.log('Game ID:', game.id);
```

### Update a Game

```typescript
await client.games.update({
  gameId: 'your-game-uuid',
  name: 'New Name',
  maxScorePerSession: 2000,
});
```

## Points API

### Save Points (Single Player)

```typescript
await client.play.savePoints({
  gameId: 'your-game-uuid',
  playerId: 'player-123',
  points: 100,
});
```

### Batch Save Points (Object Format)

```typescript
await client.play.batchSavePoints({
  gameId: 'your-game-uuid',
  pointsRecord: {
    'player-1': 100,
    'player-2': 250,
    'player-3': 75,
  },
});
```

### Batch Save Points (Array Format)

```typescript
await client.play.batchSavePoints({
  gameId: 'your-game-uuid',
  pointsRecord: [
    { playerId: 'player-1', points: 100 },
    { playerId: 'player-2', points: 250 },
  ],
});
```

**Constraints:** Max 1,000 entries per batch. Rate limit: 3 requests per second.

### Get Player Points

```typescript
const { points } = await client.play.getPoints({
  gameId: 'your-game-uuid',
  playerId: 'player-123',
});
```

### Get Leaderboard

```typescript
const leaderboard = await client.play.getLeaderboard({
  gameId: 'your-game-uuid',
});
```

## Player ID Formats

The Server SDK accepts flexible player identifiers:

| Format | Example | Notes |
|--------|---------|-------|
| Solana wallet | `sol:9qdvVLY3v...` | Looks up/creates user by Solana address |
| Ethereum wallet | `eth:0x123...` | Looks up/creates user by ETH address |
| Email | `email:player@example.com` | Looks up/creates user by email |
| Twitter/X | `twitter:username` or `x:username` | Looks up/creates user by handle |
| Privy ID | `did:privy:abc123` | Direct Privy user ID |
| OGP User ID | `550e8400-e29b-41d4-...` | Raw UUID format (fastest) |

Responses include a `playerIdToOgpId` mapping. Cache these OGP UUIDs and use them directly in future requests to skip resolution.

## Session Token Validation

Validate player session tokens from the Browser SDK:

```typescript
const { valid, playerId, ogpId, gameId } =
  await client.play.validateSessionToken('player_xxx...');
```

**Response:**

```typescript
interface ValidateSessionTokenResponse {
  valid: boolean;
  playerId?: string; // Privy ID format
  gameId?: string;
  ogpId?: string;    // Use as playerId in savePoints for best performance
}
```

Tokens expire after 30 minutes and are game-scoped.

## User API

```typescript
const user = await client.users.me();
```

## Express.js Integration Example

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
  const { sessionToken, score } = req.body;

  // Validate the player's session token
  const { valid, ogpId } = await client.play.validateSessionToken(sessionToken);
  if (!valid || !ogpId) {
    return res.status(401).json({ error: 'Invalid session' });
  }

  // YOUR VALIDATION LOGIC HERE
  // - Verify the player actually earned this score
  // - Check for suspicious patterns
  // - Validate session data
  // - Apply your own anti-cheat rules

  try {
    await client.play.savePoints({
      gameId: GAME_ID,
      playerId: ogpId, // Use ogpId for best performance
      points: score,
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Failed to save points:', error);
    res.status(500).json({ error: 'Failed to save points' });
  }
});

app.get('/api/leaderboard', async (req, res) => {
  const leaderboard = await client.play.getLeaderboard({ gameId: GAME_ID });
  res.json(leaderboard);
});

app.listen(3000);
```

## Important Notes

- **Always validate scores server-side** before submitting to Play.fun
- **Set anti-cheat limits** when registering your game to prevent abuse
- **Store credentials in environment variables**, never in code
- **The SDK handles HMAC authentication** automatically
- **Use `ogpId`** from `validateSessionToken()` as `playerId` for optimal performance
- **Rate limits:** Batch save is 3/sec with max 1,000 entries; general API is 60 req/min
- **Points accumulate daily** per user per game — only the game owner/creator can submit
