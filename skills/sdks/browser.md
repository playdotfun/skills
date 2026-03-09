---
name: sdk-browser
description: Browser SDK reference for Play.fun - for simple games and prototypes
metadata:
  tags: playfun, sdk, browser, reference, docs, vanilla-js
---

## Overview

The Browser SDK (`@playdotfun/game-sdk`) provides client-side integration for Play.fun games. It includes a points widget, built-in authentication via Privy, and a simple API for tracking gameplay.

## When to Use

| Use Browser SDK                                  | Use Server SDK Instead                  |
| ------------------------------------------------ | --------------------------------------- |
| Simple prototypes and demos                      | Production games with token rewards     |
| "Vibe coded" games                               | Games where cheating prevention matters |
| Game jam entries                                 | When you need to validate scores        |
| Quick integrations where accuracy doesn't matter | Any game with real value at stake       |

**For production games, use the [Server SDK](server.md) instead.**

## Architecture

```
Browser Game → OpenGame SDK → Play.fun API (no server-side validation)
```

## Installation

### Step 1: Add Your API Key Meta Tag

Add this meta tag to the `<head>` of your HTML file. This is **required** for the SDK to authenticate with the Play.fun API. The value is your **creator API key** from the [Play.fun developer dashboard](https://play.fun/dashboard) (this is your user/creator UUID — NOT the gameId or gameKey).

```html
<meta name="x-ogp-key" content="your-api-key" />
```

### Step 2: Add the SDK Script

Add the SDK script tag **after** the meta tag:

```html
<script src="https://sdk.play.fun"></script>
```

This loads `OpenGameSDK` into the global window.

### Step 3: Initialize with Game ID

The `gameId` is the UUID you get back from registering your game (via the MCP `register_game` tool or the API). This is different from your API key.

```javascript
const sdk = new OpenGameSDK({ ui: { usePointsWidget: true } });
sdk.init({ gameId: 'your-game-id' }); // Game UUID from registration
```

### Full Installation Example

```html
<head>
  <meta name="x-ogp-key" content="your-api-key" />
  <script src="https://sdk.play.fun"></script>
</head>
<body>
  <script>
    const sdk = new OpenGameSDK({ ui: { usePointsWidget: true } });
    sdk.init({ gameId: 'your-game-id' }).then(() => {
      console.log('SDK ready');
    });
  </script>
</body>
```

### npm Alternative

```bash
npm install @playdotfun/game-sdk
```

```javascript
import OpenGameSDK from '@playdotfun/game-sdk';
```

The `x-ogp-key` meta tag must still be present in your HTML, or pass the key as `apiKey` in the SDK constructor.

### Two Different IDs — Don't Confuse Them

| Value | Where it goes | Where to get it |
|-------|--------------|-----------------|
| **API Key** (creator UUID) | `<meta name="x-ogp-key" content="HERE" />` | `test_connection` or `get_user_profile` response (`ID` field), or [Play.fun dashboard](https://play.fun/dashboard) > Creator Credentials |
| **Game ID** (game UUID) | `sdk.init({ gameId: 'HERE' })` | `register_game` response (`id` field) |

These are completely different values. The API key identifies **you** (the creator). The game ID identifies **your game**.

## Basic Usage

```javascript
// Initialize SDK with typeof guard (game works even if SDK fails to load)
let sdk = null;
let sdkReady = false;

if (typeof OpenGameSDK !== 'undefined') {
  sdk = new OpenGameSDK({
    ui: { usePointsWidget: true },
    logLevel: 'info',
  });

  sdk.on('OnReady', () => {
    sdkReady = true;
    console.log('SDK ready!');
  });

  sdk.on('SavePointsSuccess', () => console.log('Score saved!'));
  sdk.on('SavePointsFailed', () => console.log('Save failed'));

  sdk.init({ gameId: 'your-game-uuid' });
}

// Add points during gameplay (always check ready state)
if (sdk && sdkReady) {
  sdk.addPoints(100);
}

// End game and save all accumulated points (triggers auto-login if needed)
// IMPORTANT: This opens a gameplay-blocking modal! Do NOT call during active gameplay.
if (sdk && sdkReady) {
  await sdk.endGame();
}
```

## Configuration Options

```javascript
const sdk = new OpenGameSDK({
  ui: {
    usePointsWidget: true,  // Show Play.fun points widget (default: true)
    theme: 'system',        // 'dark', 'light', or 'system' (default: 'system')
    useCustomUI: false,     // Disable built-in widgets/modals (default: false)
  },
  logLevel: 'info',         // 'debug', 'info', 'warn', 'error'
  apiKey: 'optional',       // Auto-reads from meta tag if omitted
  gameId: 'optional',       // Can also be set via init()
  baseUrl: 'optional',      // Override API endpoint for development
});

sdk.init({ gameId: 'your-game-uuid' });
```

## Points Flow

The SDK uses an **addPoints → endGame** pattern:

1. **`addPoints(amount)`** — Accumulates points locally during gameplay. Points display in the widget but are not finalized until `endGame()`.
2. **`endGame()`** — Commits all accumulated points. Opens a blocking modal showing loading, success (with points boost prompt), or error. Auto-triggers login if player isn't authenticated.

**Best practice:** To prevent duplicate rewards, only add the *difference* when players beat their best:

```javascript
// Track improvements, not absolute scores
let previousBest = 0;

function onScoreUpdate(newScore) {
  if (newScore > previousBest) {
    const improvement = newScore - previousBest;
    if (sdk && sdkReady) sdk.addPoints(improvement);
    previousBest = newScore;
  }
}
```

## Events

```javascript
// Listen to specific events
sdk.on('OnReady', () => {
  console.log('SDK initialized and ready');
});

sdk.on('SessionStarted', () => {
  console.log('Game session started');
});

sdk.on('SavePointsSuccess', () => {
  console.log('Points saved to server');
});

sdk.on('SavePointsFailed', (err) => {
  console.error('Failed to save points:', err);
});

sdk.on('LoginSuccess', () => {
  console.log('Player logged in, ID:', sdk.playerId);
});

// Listen to ALL events
sdk.onAll((eventName, data) => {
  console.log(`Event: ${eventName}`, data);
});

// Unsubscribe from events
sdk.off('OnReady', callback);
sdk.off('*', callback); // Unsubscribe from onAll
```

## Game Pause / Resume

The SDK emits `GamePause` and `GameResume` events when modals open and close (savePoints widget, login, claim, etc.). **Games MUST listen for these events to pause gameplay while modals are visible.** Without this, gameplay continues behind the modal, causing player deaths, missed inputs, and a broken experience.

```javascript
sdk.on('GamePause', () => {
  // Pause your game loop, physics, timers, etc.
  pauseGame();
});

sdk.on('GameResume', () => {
  // Resume gameplay
  resumeGame();
});
```

### Phaser 3

```javascript
sdk.on('GamePause', () => scene.scene.pause());
sdk.on('GameResume', () => scene.scene.resume());
```

### Three.js / custom loop

```javascript
let paused = false;
sdk.on('GamePause', () => { paused = true; });
sdk.on('GameResume', () => { paused = false; });

function gameLoop() {
  requestAnimationFrame(gameLoop);
  if (paused) return;
  // ... update & render
}
```

## Complete Example

```html
<!DOCTYPE html>
<html>
  <head>
    <title>My Simple Game</title>
    <meta name="x-ogp-key" content="your-api-key" id="ogp-key-meta" />
    <script src="https://sdk.play.fun"></script>
  </head>
  <body>
    <h1>Click the Button!</h1>
    <button id="click-btn">Click Me (+10 points)</button>
    <button id="end-btn">End Game</button>
    <p>Points: <span id="points">0</span></p>

    <script>
      let totalPoints = 0;
      let sdk = null;
      let sdkReady = false;

      // Guard against SDK load failure - game still works without it
      if (typeof OpenGameSDK !== 'undefined') {
        sdk = new OpenGameSDK({
          ui: { usePointsWidget: true },
          logLevel: 'info',
        });

        sdk.on('OnReady', () => {
          sdkReady = true;
          console.log('SDK ready!');
        });

        sdk.on('SavePointsSuccess', () => console.log('Score saved!'));
        sdk.on('SavePointsFailed', () => console.log('Save failed'));

        sdk.init({ gameId: 'your-game-uuid' });
      }

      document.getElementById('click-btn').onclick = () => {
        totalPoints += 10;
        document.getElementById('points').textContent = totalPoints;
        if (sdk && sdkReady) sdk.addPoints(10);
      };

      // End game - saves all accumulated points via blocking modal
      document.getElementById('end-btn').onclick = async () => {
        if (sdk && sdkReady) {
          try {
            await sdk.endGame();
          } catch (e) {
            console.log('Save error:', e);
          }
        }
      };
    </script>
  </body>
</html>
```

## Points Widget

The SDK includes a built-in widget that displays:

- Current points
- Leaderboard position
- Reward information
- Wallet connection for claiming rewards

Enable it with:

```javascript
const sdk = new OpenGameSDK({
  ui: { usePointsWidget: true },
});

sdk.init({ gameId: 'your-game-uuid' });
```

## UI Methods

```javascript
sdk.showPoints();           // Show the points widget
sdk.hidePoints();           // Hide the points widget
sdk.setTheme('dark');       // Toggle 'light', 'dark', or 'system' theme
```

## Session Token

After login, the SDK provides a session token for server-side validation:

```javascript
const token = sdk.sessionToken; // string | undefined
// Format: 'player_xxx...'
// Expires after 30 minutes
// Scoped to current game
```

Use this token with the Server SDK's `validateSessionToken()` for hybrid integrations.

## API Reference

### `new OpenGameSDK(config)`

Creates a new SDK instance.

| Option               | Type    | Default    | Description                                    |
| -------------------- | ------- | ---------- | ---------------------------------------------- |
| `ui.usePointsWidget` | boolean | `true`     | Show the points widget                         |
| `ui.theme`           | string  | `'system'` | Widget theme: `'dark'`, `'light'`, or `'system'` |
| `ui.useCustomUI`     | boolean | `false`    | Disable built-in widgets and modals            |
| `logLevel`           | string  | `'warn'`   | `'debug'`, `'info'`, `'warn'`, `'error'`       |
| `apiKey`             | string  | -          | Auto-reads from meta tag if omitted            |
| `gameId`             | string  | -          | Can also be set via `init()`                   |
| `baseUrl`            | string  | -          | Override API endpoint for development          |

### `sdk.init({ gameId })`

Initialize the SDK with your game ID. Returns a Promise. Game ID can come from `init()`, the constructor, or URL query parameters.

### `sdk.addPoints(amount)`

Accumulate points locally during gameplay. Updates the widget display. Points are not finalized until `endGame()` is called.

### `sdk.endGame()`

Save all accumulated points to the Play.fun server. **Opens a gameplay-blocking modal** — do NOT call during active gameplay. Triggers auto-login if the player is not authenticated. Rate-limited to once per 5 seconds. Throws an error if no points were added. Returns a Promise.

### `sdk.savePoints()`

Alias for `endGame()`. Identical behavior.

### `sdk.getPoints()`

Retrieve the player's current points and multiplier from the server.

```javascript
const { points, activeMultiplier } = await sdk.getPoints();
// points: string (today's points)
// activeMultiplier: number
```

### `sdk.login()` / `sdk.logout()`

Manual authentication control. Login opens the Privy login modal. Login is automatically handled when `endGame()` is called without an active session.

### `sdk.listUserRewards()`

Fetch available rewards for the player, grouped by game and token breakdown.

### `sdk.claimRewards(tokenMintAddresses)`

Claim rewards for specified token mint addresses. Returns a mapping of `gameId:tokenAddress` to transaction signatures.

```javascript
await sdk.claimRewards(['token-address-1', 'token-address-2']);
```

### `sdk.refreshPointsAndMultiplier()`

Fetch latest points data from the API and update the widget. Essential for hybrid integrations after the server saves points. No blocking UI. Alias: `refreshWidget()`.

### `sdk.sessionToken`

After login, returns the player's session token (`string | undefined`). Format: `player_xxx...`. Expires after 30 minutes. Scoped to current game. Use for server-side validation via the Server SDK.

### `sdk.playerId`

After login, this contains the player's Privy ID. Use it as the canonical user key for backend identification.

### `sdk.on(event, callback)`

Listen for SDK events.

| Event                  | Description                                    |
| ---------------------- | ---------------------------------------------- |
| `OnReady`              | SDK initialized                                |
| `SessionStarted`       | Game session started                           |
| `SessionEnded`         | Game session ended                             |
| `LoginRequest`         | Login flow initiated                           |
| `LoginSuccess`         | Player logged in successfully                  |
| `LoginFailed`          | Login failed                                   |
| `LoginCancelled`       | Player cancelled login                         |
| `Logout`               | Player logged out                              |
| `SavePointsSuccess`    | Points saved to server                         |
| `SavePointsFailed`     | Points save failed                             |
| `SavePointsCancelled`  | Points save cancelled                          |
| `ClaimRequest`         | Reward claim initiated                         |
| `ClaimSuccess`         | Reward claimed successfully                    |
| `ClaimFailed`          | Reward claim failed                            |
| `ClaimCancelled`       | Reward claim cancelled                         |
| `GamePause`            | A modal is about to open — pause your game     |
| `GameResume`           | The modal has closed — safe to resume gameplay |

### `sdk.onAll(callback)`

Listen for all events: `sdk.onAll((eventName, data) => { ... })`.

### `sdk.off(event, callback)`

Unsubscribe from events. Use `sdk.off('*', callback)` to unsubscribe from `onAll`.

## Demo Repository

Public examples: [https://github.com/playdotfun/ogp-demos](https://github.com/playdotfun/ogp-demos)

## Important Notes

- **No server-side validation**: Points are submitted directly from the browser
- **Vulnerable to cheating**: Users can manipulate point submissions
- **Use for prototypes only**: For production games, use the Server SDK
- **Blocking modal**: `endGame()` opens a modal — never call during active gameplay
- **Auto-login on endGame**: `endGame()` triggers login if the player isn't authenticated
- **Player ID**: After login, `sdk.playerId` provides the player's Privy ID
- **Hybrid note**: For hybrid integrations, do NOT call `endGame()` on the client. Save via Server SDK and call `refreshPointsAndMultiplier()` to sync the widget
