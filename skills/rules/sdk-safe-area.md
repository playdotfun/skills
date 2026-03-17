---
title: Browser SDK Safe Area
description: Guidelines for using the browser SDK which loads content at the top of the page, blocking clicks.
metadata:
  tags: ["browser", "sdk", "safe area"]
---

## Safe Top Inset

When the vanilla SDK mounts the Play.fun widget iframe, it continuously exposes the amount of top-of-screen space occupied by the widget UI.

Agents should account for this whenever they build or modify game layouts, HUDs, pause bars, fixed headers, or any top-aligned interactive element.

### What the SDK exposes

The SDK publishes the occupied top area in two places:

1. SDK state / instance getter

`sdk.safeTopInset`

This is a CSS-ready string such as:

- 0px
- 70px
- 100svh

2. Root CSS custom property

var(--ogp-safe-top-inset)

### Behavior

- When the points widget is collapsed but visible, the value reflects the live widget height.
- When the widget opens fullscreen modal UI, the value becomes 100svh.
- When the widget is hidden, the value resets to 0px.

### Agent guidance

Agents should treat --ogp-safe-top-inset as the source of truth for top safe area.

Use it when:

- positioning fixed or sticky top UI
- adding top padding to the game viewport
- calculating safe hit areas near the top edge
- preventing overlays, score bars, or buttons from sitting under the Play.fun widget

Avoid:

- hardcoding top offsets like 70px
- assuming the widget height is constant
- ignoring fullscreen modal states

### Recommended usage

CSS:

````css
.game-root {
  padding-top: var(--ogp-safe-top-inset);
}```

JS:

```js
const safeTopInset = sdk.safeTopInset;```

### Design rule

If an agent creates any UI that can appear near the top of the screen, it should explicitly check whether that UI needs to respect var(--ogp-safe-top-inset).
````
