---
name: server-sdk-snippets
description: Code snippets for the Play.fun Server SDK
metadata:
  tags: playfun, sdk, server, snippets, code
---

# Server SDK Code Snippets

## Installation

```bash
npm install @playdotfun/server-sdk
# or: pnpm i / yarn add / bun add @playdotfun/server-sdk
```

## Initialize Client

```typescript
import { OpenGameClient } from '@playdotfun/server-sdk';

const client = new OpenGameClient({
  apiKey: process.env.OGP_API_KEY!,
  secretKey: process.env.OGP_API_SECRET_KEY!,
});
```

## Register a Game

```typescript
const game = await client.games.register({
  name: 'My Awesome Game',
  description: 'A fun play-to-earn game',
  gameUrl: 'https://mygame.com',
  platform: 'HTML',   // 'HTML' or 'EXTERNAL_URL'
  isHTMLGame: true,
  iframable: true,
  // Anti-cheat limits (recommended)
  maxScorePerSession: 1000,
  maxSessionsPerDay: 10,
  maxCumulativePointsPerDay: 5000,
});

console.log('Game registered:', game.id);
```

## Save Points (Single Player)

```typescript
await client.play.savePoints({
  gameId: 'your-game-uuid',
  playerId: 'player-wallet-or-id',
  points: 100,
});
```

## Save Points (Batch - Object Format)

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

## Save Points (Batch - Array Format)

```typescript
await client.play.batchSavePoints({
  gameId: 'your-game-uuid',
  pointsRecord: [
    { playerId: 'player-1', points: 100 },
    { playerId: 'player-2', points: 250 },
  ],
});
// Max 1,000 entries per batch. Rate limit: 3 req/sec.
```

## Player ID Formats

```typescript
// All these formats are valid as playerId:
await client.play.savePoints({ gameId, playerId: 'sol:9qdvVLY3v...', points: 100 }); // Solana wallet
await client.play.savePoints({ gameId, playerId: 'eth:0x123...', points: 100 });      // Ethereum wallet
await client.play.savePoints({ gameId, playerId: 'email:user@example.com', points: 100 }); // Email
await client.play.savePoints({ gameId, playerId: 'twitter:handle', points: 100 });    // Twitter/X
await client.play.savePoints({ gameId, playerId: 'did:privy:abc123', points: 100 });  // Privy ID
await client.play.savePoints({ gameId, playerId: '550e8400-e29b-41d4-...', points: 100 }); // UUID (fastest)

// Response includes mapping for caching:
// { savedCount: 1, playerIdToOgpId: { 'twitter:handle': 'uuid-...' } }
// Cache the OGP UUID and use it directly for faster lookups
```

## Validate Session Token

```typescript
// Validate a session token from the Browser SDK (for hybrid integrations)
const { valid, playerId, ogpId, gameId } =
  await client.play.validateSessionToken('player_xxx...');

if (valid && ogpId) {
  // Use ogpId as playerId in savePoints for best performance
  await client.play.savePoints({
    gameId: 'your-game-uuid',
    playerId: ogpId,
    points: 100,
  });
}
// Token expires after 30 minutes, scoped to game
```

## Get Player Points

```typescript
const { points } = await client.play.getPoints({
  gameId: 'your-game-uuid',
  playerId: 'player-wallet-or-id',
});

console.log('Player has', points, 'points');
```

## Get Leaderboard

```typescript
const leaderboard = await client.play.getLeaderboard({
  gameId: 'your-game-uuid',
});

leaderboard.forEach((entry, index) => {
  console.log(`${index + 1}. ${entry.playerId}: ${entry.points} points`);
});
```

## Express.js API Endpoint

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

// Submit score endpoint with session token validation
app.post('/api/submit-score', async (req, res) => {
  try {
    const { sessionToken, score } = req.body;

    // Validate the Play.fun session token
    const { valid, ogpId } = await client.play.validateSessionToken(sessionToken);
    if (!valid || !ogpId) {
      return res.status(401).json({ error: 'Invalid session' });
    }

    // Validate score (add your own logic)
    if (score < 0 || score > 10000) {
      return res.status(400).json({ error: 'Invalid score' });
    }

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

// Get leaderboard endpoint
app.get('/api/leaderboard', async (req, res) => {
  try {
    const leaderboard = await client.play.getLeaderboard({ gameId: GAME_ID });
    res.json(leaderboard);
  } catch (error) {
    console.error('Failed to get leaderboard:', error);
    res.status(500).json({ error: 'Failed to get leaderboard' });
  }
});

app.listen(3000, () => console.log('Server running on port 3000'));
```

## Next.js API Route

```typescript
// app/api/submit-score/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { OpenGameClient } from '@playdotfun/server-sdk';

const client = new OpenGameClient({
  apiKey: process.env.OGP_API_KEY!,
  secretKey: process.env.OGP_API_SECRET_KEY!,
});

export async function POST(request: NextRequest) {
  try {
    const { sessionToken, score } = await request.json();

    // Validate session token
    const { valid, ogpId } = await client.play.validateSessionToken(sessionToken);
    if (!valid || !ogpId) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    await client.play.savePoints({
      gameId: process.env.GAME_ID!,
      playerId: ogpId,
      points: score,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to save points' }, { status: 500 });
  }
}
```

## Session-Based Validation

```typescript
import { OpenGameClient } from '@playdotfun/server-sdk';

const client = new OpenGameClient({
  apiKey: process.env.OGP_API_KEY!,
  secretKey: process.env.OGP_API_SECRET_KEY!,
});

// In-memory session store (use Redis in production)
const sessions = new Map<string, {
  ogpId: string;
  startTime: number;
  events: Array<{ type: string; timestamp: number }>;
}>();

// Start a game session
async function startSession(sessionToken: string): Promise<string> {
  const { valid, ogpId } = await client.play.validateSessionToken(sessionToken);
  if (!valid || !ogpId) throw new Error('Invalid session token');

  const sessionId = crypto.randomUUID();
  sessions.set(sessionId, {
    ogpId,
    startTime: Date.now(),
    events: [],
  });
  return sessionId;
}

// Record game event
function recordEvent(sessionId: string, eventType: string): boolean {
  const session = sessions.get(sessionId);
  if (!session) return false;

  session.events.push({ type: eventType, timestamp: Date.now() });
  return true;
}

// Validate and submit score
async function submitScore(
  sessionId: string,
  sessionToken: string,
  score: number
): Promise<boolean> {
  const session = sessions.get(sessionId);
  if (!session) throw new Error('Invalid session');

  // Re-validate the session token
  const { valid, ogpId } = await client.play.validateSessionToken(sessionToken);
  if (!valid || ogpId !== session.ogpId) throw new Error('Session mismatch');

  // Check if score is reasonable based on session duration
  const duration = Date.now() - session.startTime;
  const maxPossibleScore = Math.floor(duration / 1000) * 10; // 10 points/second max

  if (score > maxPossibleScore) {
    throw new Error('Score exceeds maximum possible for session duration');
  }

  // Submit to Play.fun
  await client.play.savePoints({
    gameId: process.env.GAME_ID!,
    playerId: ogpId,
    points: score,
  });

  // Clean up session
  sessions.delete(sessionId);

  return true;
}
```

## Error Handling

```typescript
import { OpenGameClient } from '@playdotfun/server-sdk';

const client = new OpenGameClient({
  apiKey: process.env.OGP_API_KEY!,
  secretKey: process.env.OGP_API_SECRET_KEY!,
});

async function savePointsWithRetry(
  gameId: string,
  playerId: string,
  points: number,
  maxRetries = 3
): Promise<void> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await client.play.savePoints({ gameId, playerId, points });
      return;
    } catch (error: any) {
      if (error.code === 'RATE_LIMITED' && attempt < maxRetries) {
        // Exponential backoff
        await new Promise((r) => setTimeout(r, 1000 * Math.pow(2, attempt)));
        continue;
      }

      if (error.code === 'POINTS_EXCEEDED') {
        console.log('Player hit daily limit');
        throw error;
      }

      throw error;
    }
  }
}
```

## List Your Games

```typescript
const { items: myGames } = await client.games.getAuthedGames();

myGames.forEach((game) => {
  console.log(`${game.name} (${game.id})`);
  console.log(`  Players: ${game.playerCount}`);
  console.log(`  Rewards Pool: $${game.totalRewardsPoolValueUsd}`);
});
```

## Update Game Settings

```typescript
await client.games.update({
  gameId: 'your-game-uuid',
  maxScorePerSession: 2000,
  maxSessionsPerDay: 15,
  description: 'Updated game description',
});
```
