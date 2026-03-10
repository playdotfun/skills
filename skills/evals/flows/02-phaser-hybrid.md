# Flow Test: Phaser 3 Hybrid Integration

## Scenario
User has a Phaser 3 game and wants production-grade monetization with server-side validation.

## Trigger
"add Play.fun rewards to my Phaser game, I want anti-cheat"

## Expected Steps

### Phase 1: Auth
1. Checks credentials, sets up if missing

### Phase 2: Build
2. Confirms Phaser game runs standalone

### Phase 3: Register
3. Registers game with appropriate anti-cheat limits for game type
4. Gets public URL via deployment

### Phase 4: SDK Integration (Hybrid)
5. Recommends Hybrid approach (browser widget + server validation)
6. Adds Browser SDK for widget display only
7. Creates server endpoint for score validation
8. Uses `sdk.addPoints()` for widget display
9. Does NOT call `sdk.endGame()` on client
10. Server calls `savePoints()` via Server SDK
11. Client calls `sdk.refreshPointsAndMultiplier()` after server save
12. Adds `GamePause`/`GameResume` handlers

### Phase 5: Deploy & Verify
13. Deploys both client and server
14. Verifies end-to-end flow

## Success Criteria
- [ ] Server SDK used for point submission (not browser-only)
- [ ] Anti-cheat limits set appropriately
- [ ] Widget displays but doesn't submit points directly
- [ ] Session token validation on server
- [ ] No `endGame()` called on client in hybrid mode
