---
name: sdk-browser
description: Browser SDK reference for Play.fun - for simple games and prototypes
metadata:
  tags: playfun, sdk, browser, reference, docs, vanilla-js
---

## Overview

The Browser SDK (`@playdotfun/game-sdk`) provides client-side integration for Play.fun games. It includes a points widget and simple API for tracking gameplay.

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

### CDN (Recommended for simple games)

```html
<meta name="x-ogp-key" content="YOUR_CREATOR_ID" id="ogp-key-meta" />
<script src="https://sdk.play.fun"></script>
```

### npm

```bash
npm install @playdotfun/game-sdk
```

## Basic Usage

```javascript
// Initialize SDK with typeof guard (game works even if SDK fails to load)
let sdk = null;
let sdkReady = false;

if (typeof OpenGameSDK !== 'undefined') {
  sdk = new OpenGameSDK({
    ui: { usePointsWidget: true },
    logLevel: 1, // 0 none, 1 errors, 2 warnings, 3 info
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

// Save score to server at game over (triggers auto-login if needed)
if (sdk && sdkReady) {
  await sdk.savePoints(totalScore);
}
```

## Configuration Options

```javascript
const sdk = new OpenGameSDK({
  ui: {
    usePointsWidget: true, // Show Play.fun points widget
    theme: 'dark',         // 'dark' or 'light'
  },
  logLevel: 1, // 0 none, 1 errors, 2 warnings, 3 info
});

sdk.init({ gameId: 'your-game-uuid' });
```

## Events

```javascript
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
```

## Complete Example

```html
<!DOCTYPE html>
<html>
  <head>
    <title>My Simple Game</title>
    <meta name="x-ogp-key" content="YOUR_CREATOR_ID" id="ogp-key-meta" />
    <script src="https://sdk.play.fun"></script>
  </head>
  <body>
    <h1>Click the Button!</h1>
    <button id="click-btn">Click Me (+10 points)</button>
    <p>Points: <span id="points">0</span></p>

    <script>
      let totalPoints = 0;
      let sdk = null;
      let sdkReady = false;

      // Guard against SDK load failure - game still works without it
      if (typeof OpenGameSDK !== 'undefined') {
        sdk = new OpenGameSDK({
          ui: { usePointsWidget: true },
          logLevel: 1,
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

      // Auto-save every 30 seconds
      setInterval(() => {
        if (sdk && sdkReady && totalPoints > 0) {
          sdk.savePoints(totalPoints);
        }
      }, 30000);

      // Save on page unload
      window.addEventListener('beforeunload', () => {
        if (sdk && sdkReady) sdk.savePoints(totalPoints);
      });
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
sdk.ui.showPoints();         // Show the points widget
sdk.ui.hidePoints();         // Hide the points widget
sdk.ui.setTheme('dark');     // Toggle 'light' or 'dark' theme
```

## API Reference

### `new OpenGameSDK(config)`

Creates a new SDK instance.

| Option               | Type    | Description                                    |
| -------------------- | ------- | ---------------------------------------------- |
| `ui.usePointsWidget` | boolean | Show the points widget                         |
| `ui.theme`           | string  | Widget theme: `'dark'` or `'light'`            |
| `logLevel`           | number  | 0 none, 1 errors, 2 warnings, 3 info          |

### `sdk.init({ gameId })`

Initialize the SDK with your game ID. Returns a Promise.

### `sdk.addPoints(amount)`

Update the points widget display during gameplay. Points are visual until `savePoints()` is called.

### `sdk.savePoints(score)`

Save the score to the Play.fun server. Triggers auto-login if the player is not authenticated. Returns a Promise.

### `sdk.getPoints()`

Retrieve the player's current points from the server.

### `sdk.login()` / `sdk.logout()`

Manual authentication control.

### `sdk.claimRewards(showModal?)`

Open the rewards claiming flow.

### `sdk.listPlayerRewards()`

Fetch available rewards for the player.

### `sdk.getTimeUntilNextClaim()`

Get the cooldown time until the next reward claim.

### `sdk.playerId`

After login, this contains the player's Privy ID. Use it as the canonical user key for backend identification.

### `sdk.on(event, callback)`

Listen for SDK events.

| Event                  | Description                          |
| ---------------------- | ------------------------------------ |
| `OnReady`              | SDK initialized                      |
| `SessionStarted`       | Game session started                 |
| `SessionFailed`        | Session failed to start              |
| `LoginRequest`         | Login flow initiated                 |
| `LoginSuccess`         | Player logged in successfully        |
| `LoginFailed`          | Login failed                         |
| `LoginCancelled`       | Player cancelled login               |
| `Logout`               | Player logged out                    |
| `SavePointsSuccess`    | Points saved to server               |
| `SavePointsFailed`     | Points save failed                   |
| `SavePointsCancelled`  | Points save cancelled                |
| `ClaimRequest`         | Reward claim initiated               |
| `ClaimSuccess`         | Reward claimed successfully          |
| `ClaimFailure`         | Reward claim failed                  |
| `ClaimCancelled`       | Reward claim cancelled               |

## Important Notes

- **No server-side validation**: Points are submitted directly from the browser
- **Vulnerable to cheating**: Users can manipulate point submissions
- **Use for prototypes only**: For production games, use the Server SDK
- **Auto-login on save**: `savePoints()` triggers login if the player isn't authenticated
- **Player ID**: After login, `sdk.playerId` provides the player's Privy ID
