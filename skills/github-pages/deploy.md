---
name: github-pages-deploy
description: Deploy games and web apps to GitHub Pages for free hosting
metadata:
  tags: github, pages, deploy, hosting, web
---

# Deploy to GitHub Pages

This guide helps you deploy a game or web app to GitHub Pages to get a public URL for Play.fun registration.

## Prerequisites

- **GitHub CLI (`gh`)** - Install with `brew install gh` (macOS) or see [cli.github.com](https://cli.github.com)
- **Authenticated** - Run `gh auth login` if not already logged in

## Quick Deploy

### Check Prerequisites

```bash
# Verify gh is installed and authenticated
gh auth status
```

If not authenticated, run `gh auth login` and follow the prompts.

### Deploy Workflow

```bash
# 1. Navigate to your game directory
cd /path/to/your/game

# 2. Initialize git if needed
git init
git add .
git commit -m "Initial commit"

# 3. Create GitHub repo and push (replace <repo-name> with your game name)
gh repo create <repo-name> --public --source=. --push

# 4. Enable GitHub Pages on master branch
gh api repos/$(gh api user --jq '.login')/<repo-name>/pages -X POST --input - <<< '{"build_type":"legacy","source":{"branch":"master","path":"/"}}'

# 5. Your game is live at:
# https://<username>.github.io/<repo-name>/
```

## Step-by-Step Guide

### 1. Check if Already a Git Repo

```bash
git status
```

If you see "not a git repository", initialize one:

```bash
git init
git add .
git commit -m "Initial commit"
```

If already a repo with a GitHub remote, skip to step 4.

### 2. Create GitHub Repository

```bash
# Create public repo and push in one command
gh repo create my-game --public --source=. --push
```

Options:
- `--public` - Makes repo public (required for free GitHub Pages)
- `--private` - Private repo (requires GitHub Pro for Pages)
- `--source=.` - Use current directory
- `--push` - Push after creating

### 3. Enable GitHub Pages

```bash
# Get your GitHub username
GITHUB_USER=$(gh api user --jq '.login')

# Enable Pages on master branch, root directory
gh api repos/$GITHUB_USER/my-game/pages -X POST --input - <<< '{"build_type":"legacy","source":{"branch":"master","path":"/"}}'
```

### 4. Check Build Status

```bash
# Check if build is complete
gh api repos/$GITHUB_USER/my-game/pages/builds --jq '.[0].status'
```

Status will be `building`, then `built` when ready.

### 5. Get Your URL

```bash
# Get the Pages URL
gh api repos/$GITHUB_USER/my-game/pages --jq '.html_url'
```

Format: `https://<username>.github.io/<repo-name>/`

## One-Liner Deploy Script

For an existing directory with game files:

```bash
REPO_NAME="my-game" && \
git init && git add . && git commit -m "Initial commit" && \
gh repo create $REPO_NAME --public --source=. --push && \
sleep 2 && \
gh api repos/$(gh api user --jq '.login')/$REPO_NAME/pages -X POST --input - <<< '{"build_type":"legacy","source":{"branch":"master","path":"/"}}' && \
echo "Deploying to: https://$(gh api user --jq '.login').github.io/$REPO_NAME/"
```

## Updating Your Game

After making changes:

```bash
git add .
git commit -m "Update game"
git push
```

GitHub Pages automatically rebuilds on push.

## Troubleshooting

### "gh: command not found"

Install GitHub CLI:
```bash
# macOS
brew install gh

# Linux
sudo apt install gh

# Windows
winget install GitHub.cli
```

### "You are not logged into any GitHub hosts"

```bash
gh auth login
# Follow prompts to authenticate
```

### "Pages build failed"

Check your `index.html` exists in the root directory. GitHub Pages needs an entry point.

### 404 after deploy

Wait 1-2 minutes for the build to complete. Check status:
```bash
gh api repos/OWNER/REPO/pages/builds --jq '.[0]'
```

## Using with Play.fun

Once deployed, use the GitHub Pages URL as your `gameUrl` when registering:

```typescript
await client.games.register({
  name: 'My Awesome Game',
  description: 'A fun clicker game',
  gameUrl: 'https://username.github.io/my-game/',  // Your GitHub Pages URL
  platform: 'web',
});
```

## Alternative: Deploy to Subdirectory

If your game is in a `dist/` or `build/` folder:

```bash
# Enable Pages from a subdirectory
gh api repos/$GITHUB_USER/$REPO_NAME/pages -X POST --input - <<< '{"build_type":"legacy","source":{"branch":"master","path":"/docs"}}'
```

Note: GitHub Pages only supports `/` (root) or `/docs` as source paths.
