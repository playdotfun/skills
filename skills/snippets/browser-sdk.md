---
name: browser-sdk-snippets
description: Code snippets for the Play.fun Browser SDK
metadata:
  tags: playfun, sdk, browser, snippets, code
---

# Browser SDK Code Snippets

## Installation (CDN)

```html
<!-- Step 1: API key meta tag (creator UUID from dashboard — NOT the gameId) -->
<meta name="x-ogp-key" content="your-api-key" />
<!-- Step 2: SDK script -->
<script src="https://sdk.play.fun"></script>
```

## Installation (npm)

```bash
npm install @playdotfun/game-sdk
```

## Basic Setup

```javascript
// Always guard with typeof check - game works even if SDK fails to load
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
```

## With Theme

```javascript
if (typeof OpenGameSDK !== 'undefined') {
  sdk = new OpenGameSDK({
    ui: { usePointsWidget: true, theme: 'dark' }, // 'dark', 'light', or 'system'
    logLevel: 'info',
  });

  sdk.on('OnReady', () => { sdkReady = true; });
  sdk.init({ gameId: 'your-game-uuid' });
}
```

## Add Points and End Game

```javascript
// Add points during gameplay (updates widget display, accumulates locally)
// Always check sdk && sdkReady before calling
if (sdk && sdkReady) {
  sdk.addPoints(10);
}

// End game — saves all accumulated points via blocking modal
// IMPORTANT: Do NOT call during active gameplay!
// Auto-triggers login if player isn't authenticated
// Rate-limited to once per 5 seconds
if (sdk && sdkReady) {
  try {
    await sdk.endGame();
  } catch (e) {
    console.log('Save error:', e);
  }
}
```

## Best Practice: Track Improvements

```javascript
// To prevent duplicate rewards, only add the difference when players beat their best
let previousBest = 0;

function onScoreUpdate(newScore) {
  if (newScore > previousBest) {
    const improvement = newScore - previousBest;
    if (sdk && sdkReady) sdk.addPoints(improvement);
    previousBest = newScore;
  }
}
```

## Event Listeners

```javascript
sdk.on('OnReady', () => {
  console.log('SDK initialized');
  startGame();
});

sdk.on('SavePointsSuccess', () => {
  console.log('Points saved!');
});

sdk.on('SavePointsFailed', (error) => {
  console.error('Save failed:', error);
});

sdk.on('LoginSuccess', () => {
  console.log('Player logged in:', sdk.playerId);
  console.log('Session token:', sdk.sessionToken);
});

// IMPORTANT: Pause/resume gameplay when SDK modals appear
sdk.on('GamePause', () => {
  pauseGame(); // Stop game loop, physics, timers
});

sdk.on('GameResume', () => {
  resumeGame(); // Resume gameplay
});

// Listen to ALL events
sdk.onAll((eventName, data) => {
  console.log(`Event: ${eventName}`, data);
});

// Unsubscribe
sdk.off('OnReady', myCallback);
```

## Simple Clicker Game

```html
<!DOCTYPE html>
<html>
  <head>
    <title>Clicker Game</title>
    <meta name="x-ogp-key" content="your-api-key" id="ogp-key-meta" />
    <script src="https://sdk.play.fun"></script>
    <style>
      body {
        font-family: sans-serif;
        text-align: center;
        margin: 0;
        width: 100vw;
        height: 100vh;
        overflow: hidden;
        /* Safe area: offset UI from Play.fun header and Safari controls */
        padding-top: var(--ogp-safe-top-inset, 50px);
        padding-bottom: var(--ogp-safe-bottom-inset, 0px);
        box-sizing: border-box;
      }
      #click-btn {
        font-size: 24px;
        padding: 20px 40px;
        cursor: pointer;
      }
      #score {
        font-size: 48px;
        margin: 20px;
      }
    </style>
  </head>
  <body>
    <h1>Click the Button!</h1>
    <div id="score">0</div>
    <button id="click-btn">Click Me!</button>
    <button id="end-btn">End Game</button>

    <script>
      let score = 0;
      let sdk = null;
      let sdkReady = false;

      if (typeof OpenGameSDK !== 'undefined') {
        sdk = new OpenGameSDK({
          ui: { usePointsWidget: true },
          logLevel: 'info',
        });

        sdk.on('OnReady', () => { sdkReady = true; });
        sdk.on('SavePointsSuccess', () => console.log('Saved!'));
        sdk.on('SavePointsFailed', () => console.log('Save failed'));

        sdk.init({ gameId: 'your-game-uuid' });
      }

      document.getElementById('click-btn').onclick = () => {
        score += 1;
        document.getElementById('score').textContent = score;
        if (sdk && sdkReady) sdk.addPoints(1);
      };

      // End game button saves all accumulated points
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

## Safe Area Insets

The SDK sets CSS variables on `document.documentElement` for safe area positioning. Games should let backgrounds fill the full viewport while keeping UI within the safe area.

### HTML/CSS Games

```css
/* Full-bleed background */
body {
  margin: 0;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
}

/* UI elements respect safe area */
.hud-top {
  position: absolute;
  top: 0;
  padding-top: var(--ogp-safe-top-inset, 0px);
}

.hud-bottom {
  position: absolute;
  bottom: 0;
  padding-bottom: var(--ogp-safe-bottom-inset, 0px);
}

.game-ui-container {
  position: absolute;
  inset: 0;
  margin-top: var(--ogp-safe-top-inset, 0px);
  margin-bottom: var(--ogp-safe-bottom-inset, 0px);
}
```

### Canvas Games (JS)

```javascript
// Read safe area insets from CSS variables (set by the SDK)
function getSafeAreaInsets() {
  const style = getComputedStyle(document.documentElement);
  return {
    top: parseInt(style.getPropertyValue('--ogp-safe-top-inset')) || 0,
    bottom: parseInt(style.getPropertyValue('--ogp-safe-bottom-inset')) || 0,
  };
}

// Or use SDK properties directly
function getSafeAreaInsetsFromSDK(sdk) {
  return {
    top: parseInt(sdk.safeTopInset) || 0,
    bottom: parseInt(sdk.safeBottomInset) || 0,
  };
}

// Apply to canvas drawing
const { top, bottom } = getSafeAreaInsets();
const safeHeight = canvas.height - top - bottom;
// Draw UI elements offset by `top` from the top
// Draw bottom UI elements offset by `bottom` from the bottom
```

### Phaser 3 Safe Area

```javascript
// In your Phaser scene's create() method:
const style = getComputedStyle(document.documentElement);
const topInset = parseInt(style.getPropertyValue('--ogp-safe-top-inset')) || 0;
const bottomInset = parseInt(style.getPropertyValue('--ogp-safe-bottom-inset')) || 0;

// Position HUD text within the safe area
this.scoreText = this.add.text(16, 16 + topInset, 'Score: 0', {
  fontSize: '32px',
  fill: '#fff',
}).setScrollFactor(0).setDepth(1000);

// Position bottom UI within the safe area
const gameHeight = this.scale.height;
this.bottomUI = this.add.text(16, gameHeight - 48 - bottomInset, 'Lives: 3', {
  fontSize: '32px',
  fill: '#fff',
}).setScrollFactor(0).setDepth(1000);

// Adjust camera bounds if needed
this.cameras.main.setViewport(0, topInset, this.scale.width, this.scale.height - topInset - bottomInset);
```

## Canvas Game Integration

```html
<!DOCTYPE html>
<html>
  <head>
    <title>Canvas Game</title>
    <meta name="x-ogp-key" content="your-api-key" id="ogp-key-meta" />
    <script src="https://sdk.play.fun"></script>
    <style>
      /* Full-bleed canvas — backgrounds fill entire viewport */
      * { margin: 0; padding: 0; }
      canvas { display: block; width: 100vw; height: 100vh; }
    </style>
  </head>
  <body>
    <canvas id="game"></canvas>

    <script>
      const canvas = document.getElementById('game');
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      const ctx = canvas.getContext('2d');
      let score = 0;
      let gameOver = false;
      let sdk = null;
      let sdkReady = false;

      let paused = false;

      // Safe area insets — UI stays within these bounds
      let safeTop = 0;
      let safeBottom = 0;

      if (typeof OpenGameSDK !== 'undefined') {
        sdk = new OpenGameSDK({
          ui: { usePointsWidget: true },
          logLevel: 'info',
        });

        sdk.on('OnReady', () => {
          sdkReady = true;
          // Read safe area insets after SDK is ready
          safeTop = parseInt(sdk.safeTopInset) || 0;
          safeBottom = parseInt(sdk.safeBottomInset) || 0;
          startGame();
        });

        sdk.on('SavePointsSuccess', () => console.log('Score saved!'));
        sdk.on('SavePointsFailed', () => console.log('Save failed'));

        sdk.init({ gameId: 'your-game-uuid' });
        // Pause/resume when SDK modals appear/disappear
        sdk.on('GamePause', () => { paused = true; });
        sdk.on('GameResume', () => { paused = false; });
      } else {
        // SDK not available, start game anyway
        startGame();
      }

      function startGame() {
        score = 0;
        gameOver = false;
        gameLoop();
      }

      function addScore(points) {
        score += points;
        if (sdk && sdkReady) sdk.addPoints(points);
      }

      async function endGame() {
        gameOver = true;
        if (sdk && sdkReady) {
          try {
            await sdk.endGame();
          } catch (e) {
            console.log('Save error:', e);
          }
        }
      }

      function gameLoop() {
        if (gameOver) return;

        // Skip update while SDK modal is open
        if (!paused) {
          // Draw full-bleed background
          ctx.fillStyle = '#1a1a2e';
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          // Draw UI within safe area
          ctx.fillStyle = '#fff';
          ctx.font = '24px sans-serif';
          ctx.fillText(`Score: ${score}`, 16, 32 + safeTop);
        }

        requestAnimationFrame(gameLoop);
      }
    </script>
  </body>
</html>
```

## React Integration

```tsx
import { useEffect, useRef, useState } from 'react';
import OpenGameSDK from '@playdotfun/game-sdk';
import type { SDKOpts } from '@playdotfun/game-sdk';

export function usePlayFun(gameId: string) {
  const sdkRef = useRef<any>(null);
  const [ready, setReady] = useState(false);
  const [points, setPoints] = useState(0);

  useEffect(() => {
    const sdk = new OpenGameSDK({
      ui: { usePointsWidget: true },
    } as SDKOpts);

    sdk.on('OnReady', () => {
      sdkRef.current = sdk;
      setReady(true);
    });

    sdk.init({ gameId });

    return () => {
      // Cleanup if needed
    };
  }, [gameId]);

  const addPoints = (amount: number) => {
    if (sdkRef.current) {
      sdkRef.current.addPoints(amount);
      setPoints((p) => p + amount);
    }
  };

  const endGame = async () => {
    if (sdkRef.current) {
      try {
        await sdkRef.current.endGame();
      } catch (e) {
        console.log('Save error:', e);
      }
    }
  };

  return { ready, points, addPoints, endGame };
}

// Usage
function Game() {
  const { ready, points, addPoints, endGame } = usePlayFun('your-game-uuid');

  if (!ready) return <div>Loading...</div>;

  return (
    <div>
      <p>Points: {points}</p>
      <button onClick={() => addPoints(10)}>+10 Points</button>
      <button onClick={endGame}>End Game</button>
    </div>
  );
}
```

## Phaser 3 Integration

```javascript
import Phaser from 'phaser';

class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
    this.sdk = null;
    this.sdkReady = false;
    this.score = 0;
  }

  create() {
    // Initialize Play.fun SDK with typeof guard
    if (typeof OpenGameSDK !== 'undefined') {
      this.sdk = new OpenGameSDK({
        ui: { usePointsWidget: true },
        logLevel: 'info',
      });

      this.sdk.on('OnReady', () => { this.sdkReady = true; });
      this.sdk.on('SavePointsSuccess', () => console.log('Score saved!'));
      this.sdk.on('SavePointsFailed', () => console.log('Save failed'));

      // Pause/resume when SDK modals appear
      this.sdk.on('GamePause', () => this.scene.pause());
      this.sdk.on('GameResume', () => this.scene.resume());

      this.sdk.init({ gameId: 'your-game-uuid' });
    }

    // Read safe area insets for UI positioning
    const style = getComputedStyle(document.documentElement);
    this.safeTop = parseInt(style.getPropertyValue('--ogp-safe-top-inset')) || 0;
    this.safeBottom = parseInt(style.getPropertyValue('--ogp-safe-bottom-inset')) || 0;

    // Score text — offset by safe top inset
    this.scoreText = this.add.text(16, 16 + this.safeTop, 'Score: 0', {
      fontSize: '32px',
      fill: '#fff',
    }).setScrollFactor(0).setDepth(1000);

    // Example: award points on enemy kill
    this.events.on('enemyKilled', (points) => {
      this.score += points;
      this.scoreText.setText(`Score: ${this.score}`);
      if (this.sdk && this.sdkReady) this.sdk.addPoints(points);
    });
  }

  async gameOver() {
    // End game saves all accumulated points
    if (this.sdk && this.sdkReady) {
      try {
        await this.sdk.endGame();
      } catch (e) {
        console.log('Save error:', e);
      }
    }
    this.scene.start('GameOverScene', { score: this.score });
  }
}
```

## Hybrid: Browser Widget + Server Validation

```javascript
// Browser code - widget display only, scores go to YOUR server
// Do NOT call endGame() in hybrid setups!
let sdk = null;
let sdkReady = false;

if (typeof OpenGameSDK !== 'undefined') {
  sdk = new OpenGameSDK({
    ui: { usePointsWidget: true },
    logLevel: 'info',
  });

  sdk.on('OnReady', () => { sdkReady = true; });
  sdk.on('LoginSuccess', () => {
    console.log('Logged in, token:', sdk.sessionToken);
  });
  sdk.init({ gameId: 'your-game-uuid' });
}

let sessionId = null;
let score = 0;

// Start game session via your server
async function startGame() {
  const res = await fetch('/api/start-session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionToken: sdk.sessionToken }),
  });
  const data = await res.json();
  sessionId = data.sessionId;
  score = 0;
}

// Add score locally (updates widget display)
function addScore(points) {
  score += points;
  if (sdk && sdkReady) sdk.addPoints(points);
  updateScoreDisplay(score);
}

// Submit score to YOUR server (not directly to Play.fun)
async function endGame() {
  await fetch('/api/submit-score', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionToken: sdk.sessionToken,
      score: score,
      sessionId: sessionId,
    }),
  });

  // CRITICAL: Sync the widget after server saves points
  if (sdk && sdkReady) await sdk.refreshPointsAndMultiplier();
}
```

## Player ID Management

```javascript
// After login, use sdk.playerId (Privy ID) as the canonical identifier
function getPlayerId() {
  if (sdk && sdk.playerId) {
    return sdk.playerId;
  }

  // Fallback: generate and persist a UUID
  let playerId = localStorage.getItem('playfun_player_id');
  if (!playerId) {
    playerId = crypto.randomUUID();
    localStorage.setItem('playfun_player_id', playerId);
  }
  return playerId;
}

// For hybrid integrations, use sessionToken instead of playerId
function getSessionToken() {
  return sdk ? sdk.sessionToken : undefined;
  // Format: 'player_xxx...'
  // Expires after 30 minutes
  // Scoped to current game
}
```
