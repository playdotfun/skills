#!/usr/bin/env node

/**
 * Play.fun Credential Management Script
 *
 * Manages API credentials for Play.fun integration with Claude Code.
 * Supports two authentication methods:
 * 1. Web Callback - Local server receives credentials via redirect
 * 2. Manual Paste - User pastes base64-encoded credentials
 *
 * Usage:
 *   node playfun-auth.js status   - Check current auth status
 *   node playfun-auth.js callback - Start local server for web auth
 *   node playfun-auth.js manual <base64> - Save manually pasted credentials
 *   node playfun-auth.js clear    - Remove stored credentials
 *   node playfun-auth.js setup    - Interactive setup
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');
const readline = require('readline');

// Configuration
const CLAUDE_CONFIG_FILE = path.join(os.homedir(), '.claude.json');
const CALLBACK_PORT = 9876;
const CALLBACK_TIMEOUT = 5 * 60 * 1000; // 5 minutes
const MCP_SERVER_NAME = 'play-fun';

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  dim: '\x1b[2m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✓ ${message}`, 'green');
}

function logError(message) {
  log(`✗ ${message}`, 'red');
}

function logInfo(message) {
  log(`ℹ ${message}`, 'blue');
}

function logWarning(message) {
  log(`⚠ ${message}`, 'yellow');
}

/**
 * Read the Claude config file
 */
function readClaudeConfig() {
  if (!fs.existsSync(CLAUDE_CONFIG_FILE)) {
    return {};
  }
  try {
    const content = fs.readFileSync(CLAUDE_CONFIG_FILE, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    return {};
  }
}

/**
 * Read credentials from Claude config
 */
function readCredentialsFromClaudeConfig() {
  const config = readClaudeConfig();
  const serverConfig = config.mcpServers?.[MCP_SERVER_NAME];

  if (!serverConfig?.headers?.['x-api-key'] || !serverConfig?.headers?.['x-secret-key']) {
    return null;
  }

  return {
    apiKey: serverConfig.headers['x-api-key'],
    secretKey: serverConfig.headers['x-secret-key'],
  };
}

/**
 * Save credentials to Claude config
 */
function saveCredentialsToClaudeConfig(apiKey, secretKey) {
  const config = readClaudeConfig();

  // Ensure mcpServers object exists
  if (!config.mcpServers) {
    config.mcpServers = {};
  }

  // Update or create the play-fun MCP server config
  config.mcpServers[MCP_SERVER_NAME] = {
    type: 'http',
    url: 'https://mcp.play.fun/mcp',
    headers: {
      'x-api-key': apiKey,
      'x-secret-key': secretKey,
    },
  };

  fs.writeFileSync(CLAUDE_CONFIG_FILE, JSON.stringify(config, null, 2));
  return true;
}

/**
 * Remove Play.fun credentials from Claude config
 */
function clearCredentialsFromClaudeConfig() {
  const config = readClaudeConfig();

  if (config.mcpServers && config.mcpServers[MCP_SERVER_NAME]) {
    delete config.mcpServers[MCP_SERVER_NAME];
    fs.writeFileSync(CLAUDE_CONFIG_FILE, JSON.stringify(config, null, 2));
    return true;
  }
  return false;
}

/**
 * Decode base64 credentials
 * Format: base64(apiKey:secretKey)
 */
function decodeCredentials(base64String) {
  try {
    const decoded = Buffer.from(base64String, 'base64').toString('utf8');
    const parts = decoded.split(':');

    if (parts.length !== 2) {
      throw new Error('Invalid credential format');
    }

    const [apiKey, secretKey] = parts;

    if (!apiKey || !secretKey) {
      throw new Error('Missing apiKey or secretKey');
    }

    return { apiKey, secretKey };
  } catch (error) {
    throw new Error(`Failed to decode credentials: ${error.message}`);
  }
}

/**
 * Check status of stored credentials
 */
function checkStatus() {
  const creds = readCredentialsFromClaudeConfig();

  console.log('\n--- Play.fun Authentication Status ---\n');

  if (!creds) {
    logWarning('No credentials found');
    logInfo(`Config location: ${CLAUDE_CONFIG_FILE}`);
    console.log('\nRun "node playfun-auth.js setup" to configure credentials.\n');
    return false;
  }

  logSuccess('Credentials configured');
  console.log(`  API Key: ${creds.apiKey.substring(0, 8)}...`);
  console.log(`  Config: ${CLAUDE_CONFIG_FILE}`);

  console.log('\nUse the test_connection MCP tool to verify credentials work.\n');
  return true;
}

/**
 * Start the callback server for web authentication
 */
function startCallbackServer() {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      const url = new URL(req.url, `http://localhost:${CALLBACK_PORT}`);

      if (url.pathname === '/callback') {
        const credentials = url.searchParams.get('credentials');

        if (!credentials) {
          res.writeHead(400, { 'Content-Type': 'text/html' });
          res.end(`
            <!DOCTYPE html>
            <html>
            <head><title>Error</title></head>
            <body style="font-family: system-ui; padding: 40px; text-align: center;">
              <h1 style="color: #e74c3c;">Error</h1>
              <p>No credentials received. Please try again.</p>
            </body>
            </html>
          `);
          return;
        }

        try {
          const { apiKey, secretKey } = decodeCredentials(credentials);

          // Save credentials to Claude config
          saveCredentialsToClaudeConfig(apiKey, secretKey);

          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(`
            <!DOCTYPE html>
            <html>
            <head><title>Success</title></head>
            <body style="font-family: system-ui; padding: 40px; text-align: center;">
              <h1 style="color: #27ae60;">Authentication Successful!</h1>
              <p>Your Play.fun credentials have been saved.</p>
              <p>You can close this window and return to Claude Code.</p>
            </body>
            </html>
          `);

          logSuccess('Credentials received and saved!');

          // Shutdown server after response
          setTimeout(() => {
            server.close();
            resolve(true);
          }, 1000);

        } catch (error) {
          res.writeHead(400, { 'Content-Type': 'text/html' });
          res.end(`
            <!DOCTYPE html>
            <html>
            <head><title>Error</title></head>
            <body style="font-family: system-ui; padding: 40px; text-align: center;">
              <h1 style="color: #e74c3c;">Error</h1>
              <p>${error.message}</p>
            </body>
            </html>
          `);
        }
      } else if (url.pathname === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'ok' }));
      } else {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(`
          <!DOCTYPE html>
          <html>
          <head><title>Play.fun Auth</title></head>
          <body style="font-family: system-ui; padding: 40px; text-align: center;">
            <h1>Play.fun Authentication Server</h1>
            <p>Waiting for credentials...</p>
            <p>Please complete the authentication process at Play.fun.</p>
          </body>
          </html>
        `);
      }
    });

    // Set timeout
    const timeout = setTimeout(() => {
      logWarning('Server timed out after 5 minutes');
      server.close();
      resolve(false);
    }, CALLBACK_TIMEOUT);

    server.on('error', (error) => {
      clearTimeout(timeout);
      if (error.code === 'EADDRINUSE') {
        logError(`Port ${CALLBACK_PORT} is already in use`);
        reject(new Error(`Port ${CALLBACK_PORT} is already in use`));
      } else {
        reject(error);
      }
    });

    server.listen(CALLBACK_PORT, 'localhost', () => {
      console.log('\n--- Play.fun Callback Server ---\n');
      logSuccess(`Server listening on http://localhost:${CALLBACK_PORT}`);
      console.log('\nWaiting for credentials from Play.fun...');
      console.log(`Server will auto-shutdown after 5 minutes.\n`);
      logInfo('Callback URL: http://localhost:9876/callback?credentials=BASE64');
      console.log('\nPress Ctrl+C to cancel.\n');
    });
  });
}

/**
 * Handle manual credential input
 */
function handleManual(base64String) {
  if (!base64String) {
    logError('No credentials provided');
    console.log('\nUsage: node playfun-auth.js manual <base64-credentials>');
    console.log('\nThe credentials should be base64-encoded in format: apiKey:secretKey');
    process.exit(1);
  }

  try {
    const { apiKey, secretKey } = decodeCredentials(base64String);

    // Save credentials to Claude config
    saveCredentialsToClaudeConfig(apiKey, secretKey);

    console.log('\n--- Credentials Saved ---\n');
    logSuccess('Credentials saved to Claude config');
    console.log(`\nAPI Key: ${apiKey.substring(0, 8)}...`);
    console.log(`Config: ${CLAUDE_CONFIG_FILE}`);
    console.log('\nUse the test_connection MCP tool to verify credentials work.\n');

  } catch (error) {
    logError(error.message);
    process.exit(1);
  }
}

/**
 * Clear all stored credentials
 */
function handleClear() {
  console.log('\n--- Clearing Credentials ---\n');

  const cleared = clearCredentialsFromClaudeConfig();

  if (cleared) {
    logSuccess('Removed credentials from Claude config');
  } else {
    logWarning('No credentials found in Claude config');
  }

  console.log('\nCredentials cleared.\n');
}

/**
 * Interactive setup
 */
async function interactiveSetup() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const question = (prompt) => new Promise((resolve) => {
    rl.question(prompt, resolve);
  });

  console.log('\n--- Play.fun Credential Setup ---\n');
  console.log('Choose an authentication method:\n');
  console.log('  1. Web Callback - Start local server and authenticate via Play.fun');
  console.log('  2. Manual Paste - Paste base64-encoded credentials directly');
  console.log('  3. Cancel\n');

  const choice = await question('Enter choice (1-3): ');

  rl.close();

  switch (choice.trim()) {
    case '1':
      console.log('\nStarting callback server...');
      console.log('After the server starts, go to Play.fun to complete authentication.\n');
      await startCallbackServer();
      break;

    case '2':
      const rl2 = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });
      const creds = await new Promise((resolve) => {
        rl2.question('\nPaste your base64 credentials: ', resolve);
      });
      rl2.close();
      handleManual(creds.trim());
      break;

    case '3':
      console.log('\nSetup cancelled.\n');
      break;

    default:
      logError('Invalid choice');
      process.exit(1);
  }
}

// Main entry point
async function main() {
  const command = process.argv[2];
  const arg = process.argv[3];

  switch (command) {
    case 'status':
      checkStatus();
      break;

    case 'callback':
      try {
        const success = await startCallbackServer();
        if (!success) {
          process.exit(1);
        }
      } catch (error) {
        logError(error.message);
        process.exit(1);
      }
      break;

    case 'manual':
      handleManual(arg);
      break;

    case 'clear':
      handleClear();
      break;

    case 'setup':
      await interactiveSetup();
      break;

    default:
      console.log(`
Play.fun Credential Management

Usage:
  node playfun-auth.js <command> [options]

Commands:
  status    Check current authentication status
  callback  Start local server for web authentication
  manual    Save manually pasted base64 credentials
  clear     Remove all stored credentials
  setup     Interactive setup wizard

Examples:
  node playfun-auth.js status
  node playfun-auth.js callback
  node playfun-auth.js manual YXBpLWtleTpzZWNyZXQta2V5
  node playfun-auth.js clear
  node playfun-auth.js setup
      `);
      break;
  }
}

main().catch((error) => {
  logError(error.message);
  process.exit(1);
});
