# Play.fun Skills for AI Coding Agents

Best practices, references, and templates for integrating games with the Play.fun ecosystem.

## What is Play.fun?

Play.fun is a platform for integrating games with Web3 rewards. Games can register on Play.fun, track player points, and launch Playcoins (game-specific Solana tokens) that reward players based on their gameplay.

## Installation

```bash
npx skills add playdotfun/skills
```

## Skill Contents

| Topic | Description |
|-------|-------------|
| [API Reference](skills/api/reference.md) | Complete API endpoint reference |
| [API Authentication](skills/api/authentication.md) | HMAC-SHA256 authentication guide |
| [Server SDK](skills/sdks/server.md) | Server SDK reference (recommended for production) |
| [Browser SDK](skills/sdks/browser.md) | Browser SDK reference (for prototypes) |
| [Hybrid SDK](skills/sdks/hybrid.md) | Combined Server + Browser approach |
| [SDK Best Practices](skills/sdks/best-practices.md) | Security, validation, and SDK selection |
| [MCP Quickstart](skills/mcp/quickstart.md) | MCP server setup for AI assistants |
| [Glossary](skills/glossary.md) | Play.fun terminology and concepts |

### Deployment

| Guide | Description |
|-------|-------------|
| [GitHub Pages Deploy](skills/github-pages/deploy.md) | Deploy games to GitHub Pages for free hosting |

### Code Snippets

| Snippet | Description |
|---------|-------------|
| [Server SDK Snippets](skills/snippets/server-sdk.md) | Express.js, Next.js, session validation examples |
| [Browser SDK Snippets](skills/snippets/browser-sdk.md) | Vanilla JS, React, Phaser 3 examples |

## SDK Selection Guide

| Scenario | Recommended SDK |
|----------|-----------------|
| Production game with token rewards | **Server SDK** |
| Games where cheating prevention matters | **Server SDK** |
| Security + Play.fun widget | **Hybrid** (Server + Browser) |
| Quick prototype / demo | Browser SDK |
| Game jam entry | Browser SDK |

## Quick Start

### Server SDK (Recommended)

```typescript
import { OpenGameClient } from '@playdotfun/server-sdk';

const client = new OpenGameClient({
  apiKey: process.env.OGP_API_KEY!,
  secretKey: process.env.OGP_API_SECRET_KEY!,
});

await client.play.savePoints({
  gameId: 'your-game-uuid',
  playerId: 'player-123',
  points: 100,
});
```

### Browser SDK (Prototypes)

```html
<meta name="x-ogp-key" content="YOUR_API_KEY" />
<script src="https://sdk.play.fun"></script>
<script>
  let sdk = null;
  let sdkReady = false;

  if (typeof OpenGameSDK !== 'undefined') {
    sdk = new OpenGameSDK({
      ui: { usePointsWidget: true },
      logLevel: 1,
    });

    sdk.on('OnReady', () => {
      sdkReady = true;
    });

    sdk.on('SavePointsSuccess', () => console.log('Saved!'));
    sdk.on('SavePointsFailed', () => console.log('Failed'));

    sdk.init({ gameId: 'your-game-uuid' });
  }

  // During gameplay:
  // if (sdk && sdkReady) sdk.addPoints(10);
  //
  // At game over:
  // if (sdk && sdkReady) sdk.savePoints(totalScore);
</script>
```

## Resources

- [Play.fun Website](https://play.fun)
- [API Documentation](https://api.play.fun/api-reference)
- [Creator Dashboard](https://app.play.fun)

## License

MIT
