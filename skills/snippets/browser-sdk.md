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
        padding: 50px;
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

## Canvas Game Integration

```html
<!DOCTYPE html>
<html>
  <head>
    <title>Canvas Game</title>
    <meta name="x-ogp-key" content="your-api-key" id="ogp-key-meta" />
    <script src="https://sdk.play.fun"></script>
  </head>
  <body>
    <canvas id="game" width="800" height="600"></canvas>

    <script>
      const canvas = document.getElementById('game');
      const ctx = canvas.getContext('2d');
      let score = 0;
      let gameOver = false;
      let sdk = null;
      let sdkReady = false;

      if (typeof OpenGameSDK !== 'undefined') {
        sdk = new OpenGameSDK({
          ui: { usePointsWidget: true },
          logLevel: 'info',
        });

        sdk.on('OnReady', () => {
          sdkReady = true;
          startGame();
        });

        sdk.on('SavePointsSuccess', () => console.log('Score saved!'));
        sdk.on('SavePointsFailed', () => console.log('Save failed'));

        sdk.init({ gameId: 'your-game-uuid' });
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
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillText(`Score: ${score}`, 10, 30);
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

      this.sdk.init({ gameId: 'your-game-uuid' });
    }

    // Score text
    this.scoreText = this.add.text(16, 16, 'Score: 0', {
      fontSize: '32px',
      fill: '#fff',
    });

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
