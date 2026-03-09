# Flow Test: Browser SDK Clicker Game

## Scenario
User has a simple HTML clicker game and wants to monetize it with Play.fun.

## Trigger
"monetize my game" (with a simple HTML game in the working directory)

## Expected Steps

### Phase 1: Auth
1. Runs `node skills/scripts/playfun-auth.js status`
2. If no credentials, starts callback server and instructs user to authenticate
3. Verifies with `test_connection` MCP tool
4. Saves returned user ID as API key

### Phase 2: Build
4. Confirms game works standalone (opens in browser)

### Phase 3: Register
5. Asks user for game name/description (or generates one)
6. Handles game image via `image-to-base64.sh` (never reads binary with Read tool)
7. Deploys to get a public URL (GitHub Pages or other)
8. Calls `register_game` MCP tool with correct parameters
9. Saves returned `id` as gameId

### Phase 4: SDK Integration
10. Adds `<meta name="x-ogp-key" content="API_KEY" />` to index.html
11. Adds `<script src="https://sdk.play.fun"></script>` to index.html
12. Uses `OpenGameSDK` (not PlayFunSDK)
13. Uses `typeof OpenGameSDK !== 'undefined'` guard
14. Uses `sdk && sdkReady` checks before API calls
15. Wires `sdk.addPoints()` during gameplay
16. Wires `sdk.endGame()` at game end (not during active play)
17. Adds `GamePause`/`GameResume` event handlers

### Phase 5: Deploy & Verify
18. Re-deploys with SDK integration
19. Verifies widget appears and points save

## Success Criteria
- [ ] Game loads without errors
- [ ] Play.fun widget visible
- [ ] Points accumulate during gameplay
- [ ] endGame() triggers modal at game end
- [ ] No failed API calls
- [ ] 0 clarifying questions about which SDK approach (should default to Browser for simple games)
- [ ] API key and game ID are not confused with each other
