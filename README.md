# @cricap/miniapp-sdk

Official TypeScript SDK for the Cricap Mini App Ecosystem. Build powerful mini apps that integrate seamlessly with the Cricap platform.

[![npm version](https://badge.fury.io/js/@cricap%2Fminiapp-sdk.svg)](https://badge.fury.io/js/@cricap%2Fminiapp-sdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Features

- 🔒 **Secure Communication** - postMessage API with origin validation
- 📱 **Multi-Platform** - Works in WebView, iframe, and browser environments
- 🎯 **TypeScript First** - Full type definitions and IntelliSense support
- ⚡ **Promise-Based** - Modern async/await API
- 🔄 **Event-Driven** - Subscribe to platform events and lifecycle changes
- 🐛 **Debug Mode** - Built-in debugging and logging capabilities
- 🔄 **Retry Logic** - Automatic retry with exponential backoff

## Installation

```bash
# npm
npm install @cricap/miniapp-sdk

# yarn
yarn add @cricap/miniapp-sdk

# pnpm
pnpm add @cricap/miniapp-sdk
```

## Quick Start

```typescript
import { initCricapSDK } from '@cricap/miniapp-sdk';

// Initialize the SDK
const sdk = initCricapSDK({
  appId: 'your-miniapp-id',
  environment: 'production',
  version: '1.0.0',
  debug: true,
});

// Initialize and start your mini app
async function startApp() {
  const result = await sdk.initialize();
  
  if (result.success) {
    console.log('SDK initialized!', result.session);
    
    // Show the mini app container
    await sdk.ui.show({
      animation: 'slide-up',
      style: 'sheet',
    });
    
    // Get user info
    const user = await sdk.user.getInfo();
    console.log('Welcome,', user.displayName);
    
  } else {
    console.error('Initialization failed:', result.error);
  }
}

startApp();
```

## Usage Examples

### Authentication

```typescript
// Check if user is authenticated
const isAuth = await sdk.auth.isAuthenticated();

// Get current token
const token = await sdk.auth.getToken();

// Refresh token
await sdk.auth.refreshToken();

// Logout
await sdk.auth.logout();
```

### User Information

```typescript
// Get user profile
const user = await sdk.user.getInfo();
console.log(user.displayName, user.avatarUrl);

// Get wallet balance
const wallet = await sdk.user.getWalletBalance();
console.log('CRICAP Balance:', wallet.balances.CRICAP.balance);

// Get transactions
const transactions = await sdk.user.getWalletTransactions({
  symbol: 'CRICAP',
  limit: 10,
});
```

### Leaderboard & Scores

```typescript
// Get leaderboard
const leaderboard = await sdk.platform.getLeaderboard({
  gameId: 'my-game',
  period: 'daily',
  limit: 100,
});

// Submit score
const result = await sdk.platform.submitScore({
  gameId: 'my-game',
  score: 15000,
  metadata: {
    level: 5,
    timeElapsed: 120,
  },
});

console.log('New rank:', result.rank);
```

### UI Controls

```typescript
// Show mini app
await sdk.ui.show({
  animation: 'slide-up',
  style: 'sheet',
  overlay: true,
  dimensions: {
    height: '80%',
    maxWidth: 600,
  },
});

// Set loading state
sdk.ui.setLoading(true);
// ... perform operation
sdk.ui.setLoading(false);

// Close mini app
await sdk.ui.close({
  result: { score: 15000, completed: true },
  animation: 'slide-down',
});
```

### Event Handling

```typescript
// Subscribe to events
sdk.events.on('lifecycle:show', () => {
  console.log('Mini app is now visible');
  resumeGame();
});

sdk.events.on('lifecycle:hide', () => {
  console.log('Mini app is hidden');
  pauseGame();
});

sdk.events.on('auth:change', (authState) => {
  if (!authState.authenticated) {
    showLoginPrompt();
  }
});

// Listen for notifications
const unsubscribe = sdk.notifications.onNotification((notification) => {
  if (notification.type === 'LEADERBOARD_UPDATE') {
    refreshLeaderboard();
  }
});

// Cleanup
unsubscribe();
```

### Notifications

```typescript
// Subscribe to topics
await sdk.notifications.subscribe([
  'leaderboard.updates',
  'wallet.transactions',
  'game.events',
]);

// Handle notifications
sdk.notifications.onNotification((notification) => {
  console.log('New notification:', notification.title);
});

// Mark as read
await sdk.notifications.markAsRead('notification-id');
```

## Configuration Options

```typescript
interface CricapSDKConfig {
  /** Mini App unique identifier (required) */
  appId: string;
  
  /** Environment mode (required) */
  environment: 'development' | 'staging' | 'production';
  
  /** SDK version */
  version?: string;
  
  /** Enable debug logging */
  debug?: boolean;
  
  /** API call timeout in milliseconds */
  timeout?: number;
  
  /** Custom event handlers */
  eventHandlers?: {
    onInit?: (session: SessionInfo) => void;
    onAuthChange?: (auth: AuthState) => void;
    onShow?: () => void;
    onHide?: () => void;
    onClose?: (data: CloseData) => void;
    onVisibilityChange?: (visible: boolean) => void;
    onNotification?: (notification: Notification) => void;
    onError?: (error: SDKError) => void;
  };
}
```

## Browser Usage (UMD)

```html
<script src="https://unpkg.com/@cricap/miniapp-sdk@latest/dist/index.umd.min.js"></script>
<script>
  const sdk = CricapSDK.initCricapSDK({
    appId: 'your-miniapp-id',
    environment: 'production',
  });
  
  sdk.initialize().then((result) => {
    if (result.success) {
      console.log('SDK ready!');
    }
  });
</script>
```

## API Reference

See the full API documentation at https://docs.cricap.com/sdk for detailed information about all available methods and types.

## Development

```bash
# Install dependencies
npm install

# Run tests
npm test

# Build for production
npm run build

# Run in watch mode
npm run dev
```

## Support

- 📖 [Documentation](https://docs.cricap.com)
- 🐛 [Issue Tracker](https://github.com/CricapHQ/cricap-miniapp-sdk/issues)
- 💬 Discord Community: discord.gg/cricap-dev
- 📧 Email Support: hi@cricap.com

## License

[MIT](https://opensource.org/licenses/MIT) © [Cricap](https://www.cricap.com)
