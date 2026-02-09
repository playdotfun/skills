---
name: playdotfun
description: Best practices, references, and templates for integrating games with the Play.fun ecosystem.
metadata:
  tags: playfun, games, sdks, templates
---

## When to use

Use this skill whenever users need to integrate a game with Play.fun or fetch data from Play.fun. You can also use this skill to help guide users through different workflows of Play.fun.

## How to use

When a user asks you to integrate a game with Play.fun, you MUST follow the integration workflow below. Do not skip steps. Create a task list to track progress through each phase.

### Integration Workflow

When integrating a game (new or existing) with Play.fun, follow these phases in order. Create tasks for each step and complete them sequentially.

#### Phase 1: Authentication

Before any authenticated operation, verify credentials are set up.

1. **Check auth status** — Run `node skills/scripts/playfun-auth.js status` to see if credentials exist
2. **Set up credentials if missing** — Follow the [Auth Setup](auth/SKILL.md) guide. Start the callback server and instruct the user to authenticate via their browser
3. **Verify credentials work** — Use the `test_connection` MCP tool to confirm access

Do NOT proceed to Phase 2 until credentials are verified.

#### Phase 2: Build the Game

4. **Build or modify the game** — Create/update the game code. Do NOT add any Play.fun SDK integration yet — get the core game working first
5. **Test the game works standalone** — Open in browser and verify gameplay functions correctly without SDK

#### Phase 3: Register the Game on Play.fun

6. **Choose a game name and description** — Ask the user or generate a fun, descriptive name
7. **Prepare a game image** — Find an existing logo/screenshot or ask the user for one. Convert to base64: `./skills/scripts/image-to-base64.sh <image_path> --data-uri`
8. **Deploy the game to get a public URL** — If the game needs hosting, use the [GitHub Pages Deploy](github-pages/deploy.md) guide. The game URL must be publicly accessible
9. **Register the game** — Use the MCP `register_game` tool with: name, description, gameUrl, platform, base64Image, and anti-cheat limits (see [Best Practices](sdks/best-practices.md) for limit recommendations based on game type). Save the returned `gameId` — you will need it for SDK integration
10. **Confirm registration** — Use the MCP `get_my_games` tool to verify the game appears in the user's game list

Do NOT proceed to Phase 4 until you have a valid `gameId` from registration.

#### Phase 4: Integrate the Play.fun SDK

11. **Choose SDK approach** — Ask the user or decide based on their needs:
    - **Browser SDK** ([Reference](sdks/browser.md)) — For prototypes, demos, game jams. No server-side validation
    - **Server SDK** ([Reference](sdks/server.md)) — For production games with token rewards and anti-cheat
    - **Hybrid** ([Reference](sdks/hybrid.md)) — Both Browser widget + Server validation (recommended for production)
12. **Add the SDK with the real `gameId`** — Follow the chosen SDK reference. For Browser SDK integration:
    - Add meta tag: `<meta name="x-ogp-key" content="REAL_GAME_ID" />`
    - Add script: `<script src="https://sdk.play.fun/"></script>`
    - Use `OpenGameSDK` class (NOT PlayFunSDK)
    - Use defensive patterns: `typeof` guard, `sdkReady` flag, `sdk && sdkReady` checks, try/catch, score > 0 check (see [Browser SDK Snippets](snippets/browser-sdk.md))
    - Init with real gameId: `sdk.init({ gameId: 'REAL_GAME_ID' })`
13. **Wire up scoring** — Integrate `sdk.addPoints()` during gameplay and `sdk.savePoints()` at game end or periodically
14. **Test SDK integration** — Open the game, verify the Play.fun widget appears, play a round, and confirm points are submitted

#### Phase 5: Deploy and Verify

15. **Re-deploy with SDK integration** — Push updated code to the hosted URL
16. **Update game registration if URL changed** — Use MCP `update_game` tool if the game URL changed
17. **Final verification** — Play the game at its public URL, verify points save, check the leaderboard with MCP `get_game_leaderboard`

### Quick Reference

| Resource | Description |
|----------|-------------|
| [API Reference](api/reference.md) | Complete API endpoint reference |
| [API Authentication](api/authentication.md) | HMAC-SHA256 authentication guide |
| [SDK Best Practices](sdks/best-practices.md) | SDK selection and anti-cheat configuration |
| [Server SDK Reference](sdks/server.md) | Server-side SDK reference |
| [Browser SDK Reference](sdks/browser.md) | Browser SDK reference |
| [Hybrid SDK Reference](sdks/hybrid.md) | Browser + Server combined reference |
| [MCP Quickstart](mcp/quickstart.md) | MCP tools for game registration and management |
| [Glossary](glossary.md) | Play.fun terms and concepts |
| [Auth Setup](auth/SKILL.md) | Credential setup guide |
| [GitHub Pages Deploy](github-pages/deploy.md) | Free game hosting via GitHub Pages |
| [Game Upload Rules](rules/game-upload.md) | Required fields and image guidelines |
| [Server SDK Snippets](snippets/server-sdk.md) | Copy-paste server code examples |
| [Browser SDK Snippets](snippets/browser-sdk.md) | Copy-paste browser code examples |
