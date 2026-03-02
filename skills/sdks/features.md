---
name: sdk-features
description: Built-in Play.fun features - Streaks, Multipliers, and upcoming features
metadata:
  tags: playfun, features, streaks, multipliers
---

## Overview

Play.fun includes built-in features that enhance player engagement and game monetization. These features work automatically when you integrate the SDK — no additional development required.

## Check-in Streaks

Streaks reward players for consistent daily engagement. They track consecutive days a player has earned points in a game.

### How Streaks Work

- Count consecutive days a player has earned points
- Reset when a day is missed
- Tracked per game, up to 30 days of history
- Use UTC date calculations
- Any points earned count toward that day's streak

### No Integration Required

Streaks are automatically tracked when players earn points through the SDK.

### API Endpoints

**Player-facing (via session token):**

```typescript
const response = await fetch('https://api.play.fun/play/streak', {
  headers: {
    Authorization: `Bearer ${sessionToken}`,
  },
});
const { today, streak } = await response.json();
// today: boolean - has the player earned points today?
// streak: number (0-30) - consecutive days
```

**Developer-facing (via HMAC auth):**

```typescript
const response = await fetch(`https://api.play.fun/games/streak?gameId=${gameId}`, {
  headers: {
    Authorization: `HMAC-SHA256 apiKey=... signature=... timestamp=...`,
  },
});
const { today, streak } = await response.json();
```

### UI Suggestions

- Display streak icon with count
- Celebrate milestones (7 days, 30 days)
- Show "earned today" indicator

## Score Multipliers

Players can purchase score multipliers using playcoins or SOL to boost their leaderboard position. All purchases flow back into the player reward pool.

### How Multipliers Work

- Players purchase multipliers (2x, 3x, 5x, etc.) for a specific game
- Multiplier applies to **today's points only** — resets daily at UTC midnight
- Higher tiers follow a quadratic bonding curve pricing model
- All multiplier spending enters the daily player reward pool
- Leaderboards show **effective points** = `base points × multiplier`

### No Integration Required

Multipliers work automatically with SDK integration. The SDK handles display, payment processing, multiplier application, and leaderboard calculations.

### Leaderboard Impact

A player with 500 base points and a 3x multiplier (1,500 effective) outranks a player with 1,000 base points and no multiplier.

### API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/multiplier/cost` | GET | Get cost for next multiplier level |
| `/multiplier/current` | GET | Get active multiplier and today's spend |
| `/multiplier/cost-for-placement` | GET | Calculate cost for desired leaderboard position |
| `/multiplier/purchase` | POST | Purchase a multiplier (requires auth) |

### Pricing

Uses quadratic bonding curves:
- Per-level cost: `baseCost × level²`
- Global demand scaling
- Daily spend caps with exponential pricing triggers

## Coming Soon

- **Achievements** — Unlock badges and rewards for accomplishments
- **Tournaments** — Time-limited competitive events with prize pools
- **Referrals** — Earn rewards for bringing new players to games
