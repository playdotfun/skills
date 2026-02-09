---
name: browser-sdk-snippets
description: Code snippets for the Play.fun Browser SDK
metadata:
  tags: playfun, sdk, browser, snippets, code
---

# Browser SDK Code Snippets

## Installation (CDN)

```html
<meta name="x-ogp-key" content="YOUR_API_KEY" />
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
```

## With Theme

```javascript
if (typeof OpenGameSDK !== 'undefined') {
  sdk = new OpenGameSDK({
    ui: { usePointsWidget: true, theme: 'dark' },
    logLevel: 1,
  });

  sdk.on('OnReady', () => { sdkReady = true; });
  sdk.init({ gameId: 'your-game-uuid' });
}
```

## Add and Save Points

```javascript
// Add points during gameplay (updates widget display)
// Always check sdk && sdkReady before calling
if (sdk && sdkReady) {
  sdk.addPoints(10);
}

// Save total score to server at game over (triggers auto-login if needed)
if (sdk && sdkReady && totalScore > 0) {
  try {
    await sdk.savePoints(totalScore);
  } catch (e) {
    console.log('Save error:', e);
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
});
```

## Simple Clicker Game

```html
<!DOCTYPE html>
<html>
  <head>
    <title>Clicker Game</title>
    <meta name="x-ogp-key" content="YOUR_API_KEY" />
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

    <script>
      let score = 0;
      let sdk = null;
      let sdkReady = false;

      if (typeof OpenGameSDK !== 'undefined') {
        sdk = new OpenGameSDK({
          ui: { usePointsWidget: true },
          logLevel: 1,
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

      // Auto-save every 30 seconds
      setInterval(() => {
        if (sdk && sdkReady && score > 0) sdk.savePoints(score);
      }, 30000);

      // Save on page close
      window.addEventListener('beforeunload', () => {
        if (sdk && sdkReady) sdk.savePoints(score);
      });
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
    <meta name="x-ogp-key" content="YOUR_API_KEY" />
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
          logLevel: 1,
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
        if (sdk && sdkReady && score > 0) {
          try {
            await sdk.savePoints(score);
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

declare global {
  interface Window {
    OpenGameSDK: any;
  }
}

export function usePlayFun(gameId: string) {
  const sdkRef = useRef<any>(null);
  const [ready, setReady] = useState(false);
  const [points, setPoints] = useState(0);

  useEffect(() => {
    // Load SDK script
    const meta = document.createElement('meta');
    meta.name = 'x-ogp-key';
    meta.content = 'YOUR_API_KEY';
    document.head.appendChild(meta);

    const script = document.createElement('script');
    script.src = 'https://sdk.play.fun';
    script.onload = () => {
      if (typeof window.OpenGameSDK === 'undefined') return;

      const sdk = new window.OpenGameSDK({
        ui: { usePointsWidget: true },
        logLevel: 1,
      });

      sdk.on('OnReady', () => {
        sdkRef.current = sdk;
        setReady(true);
      });

      sdk.on('SavePointsSuccess', () => console.log('Score saved!'));
      sdk.on('SavePointsFailed', () => console.log('Save failed'));

      sdk.init({ gameId });
    };
    document.head.appendChild(script);

    return () => {
      meta.remove();
      script.remove();
    };
  }, [gameId]);

  const addPoints = (amount: number) => {
    if (sdkRef.current) {
      sdkRef.current.addPoints(amount);
      setPoints((p) => p + amount);
    }
  };

  const savePoints = async (score: number) => {
    if (sdkRef.current) {
      try {
        await sdkRef.current.savePoints(score);
      } catch (e) {
        console.log('Save error:', e);
      }
    }
  };

  return { ready, points, addPoints, savePoints };
}

// Usage
function Game() {
  const { ready, points, addPoints, savePoints } = usePlayFun('your-game-uuid');

  if (!ready) return <div>Loading...</div>;

  return (
    <div>
      <p>Points: {points}</p>
      <button onClick={() => addPoints(10)}>+10 Points</button>
      <button onClick={() => savePoints(points)}>Save</button>
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
        logLevel: 1,
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
    // Save points when game ends
    if (this.sdk && this.sdkReady && this.score > 0) {
      try {
        await this.sdk.savePoints(this.score);
      } catch (e) {
        console.log('Save error:', e);
      }
    }
    this.scene.start('GameOverScene', { score: this.score });
  }
}
```

## Auto-Save with Debounce

```javascript
let sdk = null;
let sdkReady = false;
let saveTimeout = null;
let totalScore = 0;
let unsavedPoints = 0;

if (typeof OpenGameSDK !== 'undefined') {
  sdk = new OpenGameSDK({
    ui: { usePointsWidget: true },
    logLevel: 1,
  });

  sdk.on('OnReady', () => { sdkReady = true; });
  sdk.init({ gameId: 'your-game-uuid' });
}

function addPointsWithAutoSave(points) {
  totalScore += points;
  if (sdk && sdkReady) sdk.addPoints(points);
  unsavedPoints += points;

  if (saveTimeout) clearTimeout(saveTimeout);

  // Save after 5 seconds of inactivity, or immediately if 100+ unsaved points
  if (unsavedPoints >= 100) {
    if (sdk && sdkReady) sdk.savePoints(totalScore);
    unsavedPoints = 0;
  } else {
    saveTimeout = setTimeout(() => {
      if (sdk && sdkReady) sdk.savePoints(totalScore);
      unsavedPoints = 0;
    }, 5000);
  }
}
```

## Hybrid: Browser Widget + Server Validation

```javascript
// Browser code - widget display only, scores go to YOUR server
let sdk = null;
let sdkReady = false;

if (typeof OpenGameSDK !== 'undefined') {
  sdk = new OpenGameSDK({
    ui: { usePointsWidget: true },
    logLevel: 1,
  });

  sdk.on('OnReady', () => { sdkReady = true; });
  sdk.init({ gameId: 'your-game-uuid' });
}

let sessionId = null;
let score = 0;

// Start game session via your server
async function startGame() {
  const res = await fetch('/api/start-session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ playerId: getPlayerId() }),
  });
  const data = await res.json();
  sessionId = data.sessionId;
  score = 0;
}

// Add score locally (display only)
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
      playerId: getPlayerId(),
      score: score,
      sessionId: sessionId,
    }),
  });
}

function getPlayerId() {
  let id = localStorage.getItem('playerId');
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem('playerId', id);
  }
  return id;
}
```

## Player ID Management

```javascript
// Get or create persistent player ID
function getPlayerId() {
  let playerId = localStorage.getItem('playfun_player_id');

  if (!playerId) {
    playerId = crypto.randomUUID();
    localStorage.setItem('playfun_player_id', playerId);
  }

  return playerId;
}

// Or use wallet address if available
async function getPlayerIdFromWallet() {
  if (window.solana && window.solana.isPhantom) {
    const response = await window.solana.connect();
    return response.publicKey.toString();
  }
  return getPlayerId(); // Fallback to UUID
}

// Or use sdk.playerId after login (Privy ID)
function getPlayerIdFromSDK() {
  if (sdk.playerId) {
    return sdk.playerId;
  }
  return getPlayerId(); // Fallback to UUID
}
```
