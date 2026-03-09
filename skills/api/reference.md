---
name: api-reference
description: Complete API Reference for Play.fun
metadata:
  tags: playfun, api, openapi, sdk, reference
---

## Base URL

- **Production**: `https://api.play.fun`
- **Interactive Docs**: [https://api.play.fun/api-reference](https://api.play.fun/api-reference)

All authenticated endpoints require HMAC-SHA256 authentication (see [Authentication](../rules/api-authentication.md)).

## OpenAPI Specification

| Format      | URL                                     |
| ----------- | --------------------------------------- |
| Interactive | https://api.play.fun/api-reference      |
| JSON        | https://api.play.fun/api-reference-json |

## Rate Limits

- **Default:** 60 requests per minute per IP
- **Flush (client SDK):** 1 request per second
- **Commit/endGame (client SDK):** 1 request per 5 seconds
- **Batch save (server SDK):** 3 requests per second, max 1,000 entries

## Games

### GET /games

List all games with pagination and filtering.

**Query Parameters:**

| Parameter | Type   | Default                  | Description               |
| --------- | ------ | ------------------------ | ------------------------- |
| `limit`   | number | 50                       | Results per page (1-100)  |
| `cursor`  | string | -                        | Pagination cursor         |
| `query`   | string | -                        | Search by game name       |
| `sortBy`  | string | totalRewardsPoolValueUsd | Sort field                |
| `sort`    | string | desc                     | Sort direction (asc/desc) |

**sortBy Options:** `totalRewardsPoolValueUsd`, `totalRewardsAllocatedUsd`, `createdAt`, `estimatedDailyRewardsUsd`, `name`, `marketCap`, `playerCount`

### GET /games/id/:id

Get a specific game by UUID. Optionally includes associated tokens.

### POST /games

Register a new game. **Requires authentication.** Accepts multipart form data.

**Request Body:**

```json
{
  "name": "string",
  "description": "string",
  "gameUrl": "string",
  "platform": "WEB|DESKTOP|MOBILE|CONSOLE",
  "gameCoinSymbol": "string?",
  "twitter": "string?",
  "discord": "string?",
  "telegram": "string?",
  "isHTMLGame": "boolean?",
  "iframable": "boolean?",
  "maxScorePerSession": "number?",
  "maxSessionsPerDay": "number?",
  "maxCumulativePointsPerDay": "number?",
  "orgRewardsSplit": "object?"
}
```

**`orgRewardsSplit`**: Distribute creator rewards using basis points (10,000 BPS = 100%). Values must sum to 10,000. Accepts OGP User IDs, Privy IDs, wallet addresses, email, or Twitter handles.

### POST /games/update/:gameId

Update an existing game. **Requires authentication. Must be game owner.**

### GET /games/me

Get games owned by authenticated user. **Requires authentication.**

### POST /games/toggle-visibility/:id

Show or hide a game from public listings. Hidden games remain accessible via direct link. **Requires authentication.**

### POST /games/claim-ownership/:gameId

Verify domain ownership by checking for a meta tag containing the API key in the game's HTML. **Requires authentication.**

### Batch Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/games/batch/ids` | POST | Fetch up to 100 games by ID |
| `/games/batch/token-ids` | POST | Find games by up to 100 token addresses |
| `/games/token-id/:tokenAddress/full` | GET | Get games for a specific token |

## Play (Points) — Dev Endpoints

Server-to-server endpoints requiring HMAC authentication with `x-auth-provider: hmac`.

### POST /play/dev/batch-save-points

Save points for one or more players. **Requires authentication.**

**Request Body:**

```json
{
  "gameApiKey": "game-uuid",
  "points": [{ "playerId": "string", "points": "number" }]
}
```

**Player ID formats:** `sol:address`, `eth:0x...`, `email:user@example.com`, `twitter:handle`, `did:privy:id`, or raw UUID.

**Constraints:** Max 1,000 entries per request. Rate limit: 3 requests/second. Points accumulate daily per user/game.

### GET /play/dev/points

Get points for a specific player. **Requires authentication.** Query params: `gameId`, `playerId`.

### GET /play/dev/leaderboard/:gameId

Get the developer leaderboard for a game. Supports pagination and date filtering. **Requires authentication.**

### POST /play/dev/validate-session-token

Validate a player's session token from the Browser SDK. **Requires authentication.**

```json
{
  "sessionToken": "player_xxx..."
}
```

Returns: `{ valid, playerId, ogpId, gameId }`

### GET /play/dev/sessions/:gameId

Get player session data including anti-cheat metrics. **Requires authentication.**

Response includes `riskScore` (0-1 scale), `riskReasons` arrays, and session duration tracking.

### GET /play/dev/risky-sessions/:gameId

Filter to sessions where `riskScore > 0.5` for fraud review. **Requires authentication.**

### POST /play/dev/invalidate-sessions

Remove fraudulent sessions and their associated points. Max 100 sessions per request. Cascades removal to referrer and distributor points. **Requires authentication.**

## Play (Points) — Client Endpoints

Browser SDK endpoints using session tokens.

| Endpoint | Method | Rate Limit | Description |
|----------|--------|------------|-------------|
| `/play/flush` | POST | 1/sec | Flush accumulated points |
| `/play/commit` | POST | 1/5sec | Commit/save points (endGame) |
| `/play/streak` | GET | - | Get player's check-in streak |

## Rewards

### GET /rewards/game-rewards-pool/:gameId

Get total rewards pool value, token breakdowns, and USD valuations for a game.

## Multiplier

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/multiplier/cost` | GET | Cost for next multiplier level |
| `/multiplier/current` | GET | Active multiplier and today's spend |
| `/multiplier/cost-for-placement` | GET | Cost to reach desired leaderboard position |
| `/multiplier/purchase` | POST | Purchase a multiplier (requires auth) |

## Streaks

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/play/streak` | GET | Session token | Player's streak data |
| `/games/streak` | GET | HMAC | Game-level streak data |

## Token Launcher

### POST /token-launcher/launch

Launch a playcoin for a game. **Requires Privy bearer token authentication** (not HMAC). This endpoint needs wallet signing via a delegated embedded Solana wallet, so it cannot be called via the MCP server's HMAC credentials. Use the [Play.fun dashboard](https://play.fun/dashboard) to launch playcoins. Costs ~0.07 SOL plus optional `buyAmount`.

**Request Body:**

```json
{
  "gameId": "uuid",
  "emissionDays": 7,
  "buyAmount": "string?",
  "gameCoinSymbol": "string?"
}
```

| Field            | Type    | Description                    |
| ---------------- | ------- | ------------------------------ |
| `gameId`         | uuid    | Your game's UUID               |
| `emissionDays`   | 7 \| 30 | Reward distribution period     |
| `buyAmount`      | string? | Initial buy amount in lamports |
| `gameCoinSymbol` | string? | Token symbol (max 10 chars)    |

### GET /token-launcher/launch/:jobId

Check playcoin launch job status. Response includes `status` (`completed`, `active`, `waiting`, `failed`), `progress` (0-100), `bundleTx`, `gtokenAddress`. Poll every 2-5 seconds; typically completes in ~30 seconds.

### POST /token-launcher/complete-launch

Finalize a launch by verifying on-chain state.

### Snapshot Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/token-launcher/snapshot/:tokenMint` | GET | Merkle snapshot summary |
| `/token-launcher/snapshot/:tokenMint/proof/:userAddress` | GET | Individual merkle proof |
| `/token-launcher/snapshot/:tokenMint/holders` | GET | Complete holder list |

### Exercise Claim Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/token-launcher/exercise-claim/build-transactions` | POST | Build claim transactions |
| `/token-launcher/exercise-claim/:gtokenAddress/status/:wallet` | GET | Check claim eligibility |

## Tokens

### GET /tokens

List all tokens with pagination.

### GET /tokens/:mint

Get token details by Solana mint address.

## User

### GET /user/me

Get current authenticated user profile. **Requires authentication.**

### GET /user/balance

Get user wallet balances. **Requires authentication.**

### POST /user/hmac-signature

Generate HMAC signature for authenticated requests. Accepts `apiKey`, `secretKey`, `method`, `path`.

### POST /user/reset-secret

Reset API secret key. **Requires authentication.**

## Response Format

All responses follow this structure:

```json
{
  "data": { ... },
  "error": null
}
```

Error responses:

```json
{
  "statusCode": 400,
  "message": "Error description",
  "error": "Bad Request"
}
```

Common error codes: 400 (validation), 401 (auth failure), 403 (insufficient permissions), 404 (not found), 429 (rate limited), 500 (server error).
