/**
 * Cricap Mini App SDK - Type Definitions
 * 
 * This file contains all TypeScript interfaces and types for the SDK.
 */

// ============================================================================
// SDK Configuration Types
// ============================================================================

export interface CricapSDKConfig {
  /** Mini App unique identifier */
  appId: string;
  /** Mini App secret key (server-side only) */
  appSecret?: string;
  /** Environment mode */
  environment: 'development' | 'staging' | 'production';
  /** SDK version */
  version?: string;
  /** Debug mode */
  debug?: boolean;
  /** Timeout for API calls in milliseconds */
  timeout?: number;
  /** Custom event handlers */
  eventHandlers?: Partial<EventHandlerMap>;
  /** Target origin for postMessage (defaults to parent origin) */
  targetOrigin?: string;
}

export interface SDKInstance {
  /** SDK configuration */
  config: CricapSDKConfig;
  /** Authentication module */
  auth: AuthModule;
  /** User module */
  user: UserModule;
  /** Platform module */
  platform: PlatformModule;
  /** UI module */
  ui: UIModule;
  /** Notification module */
  notifications: NotificationModule;
  /** Event emitter */
  events: EventEmitter;
  /** Initialize SDK */
  initialize(): Promise<InitResult>;
  /** Destroy SDK instance */
  destroy(): void;
}

export interface InitResult {
  success: boolean;
  error?: SDKError;
  session?: SessionInfo;
}

// ============================================================================
// Session & Authentication Types
// ============================================================================

export interface SessionInfo {
  sessionId: string;
  userId: string;
  expiresAt: number;
  permissions: string[];
}

export interface AuthState {
  authenticated: boolean;
  user?: UserInfo;
  token?: string;
  expiresAt?: number;
}

export interface AuthModule {
  /** Get current access token */
  getToken(): Promise<string>;
  /** Refresh access token */
  refreshToken(): Promise<void>;
  /** Check if user is authenticated */
  isAuthenticated(): boolean;
  /** Logout user */
  logout(): Promise<void>;
}

// ============================================================================
// User Types
// ============================================================================

export interface UserInfo {
  userId: string;
  username: string;
  displayName: string;
  avatarUrl: string;
  email: string;
  verified: boolean;
  createdAt: string;
  stats?: UserStats;
}

export interface UserStats {
  gamesPlayed: number;
  totalScore: number;
  rank: string;
}

export interface UserModule {
  /** Get current user profile */
  getInfo(): Promise<UserInfo>;
  /** Get granted permissions */
  getPermissions(): Promise<Permission[]>;
  /** Get wallet balance */
  getWalletBalance(): Promise<WalletBalance>;
  /** Get wallet transactions */
  getWalletTransactions(options?: TransactionQuery): Promise<TransactionResponse>;
}

export interface Permission {
  scope: string;
  grantedAt: string;
  expiresAt: string | null;
}

// ============================================================================
// Wallet Types
// ============================================================================

export interface WalletBalance {
  userId: string;
  balances: Record<string, TokenBalance>;
  totalUsdValue: string;
  updatedAt: string;
}

export interface TokenBalance {
  symbol: string;
  name: string;
  balance: string;
  decimals: number;
  usdValue: string;
}

export interface TransactionQuery {
  symbol?: string;
  type?: 'in' | 'out' | 'all';
  limit?: number;
  cursor?: string;
}

export interface TransactionResponse {
  transactions: Transaction[];
  pagination: PaginationInfo;
}

export interface Transaction {
  id: string;
  type: 'in' | 'out';
  symbol: string;
  amount: string;
  from: string;
  to: string;
  description: string;
  timestamp: string;
  status: 'pending' | 'completed' | 'failed';
}

export interface PaginationInfo {
  hasMore: boolean;
  nextCursor?: string;
  total: number;
}

// ============================================================================
// Platform Types (Leaderboard, Scores, Game Stats)
// ============================================================================

export interface PlatformModule {
  /** Get leaderboard */
  getLeaderboard(options: LeaderboardQuery): Promise<LeaderboardResponse>;
  /** Submit score */
  submitScore(data: ScoreSubmission): Promise<ScoreSubmissionResult>;
  /** Get game statistics */
  getGameStats(gameId: string): Promise<GameStats>;
  /** Get notifications */
  getNotifications(options?: NotificationQuery): Promise<NotificationResponse>;
  /** Mark notification as read */
  markNotificationRead(notificationId: string): Promise<void>;
}

export interface LeaderboardQuery {
  gameId: string;
  period?: 'daily' | 'weekly' | 'monthly' | 'all-time';
  limit?: number;
  cursor?: string;
}

export interface LeaderboardResponse {
  gameId: string;
  period: string;
  updatedAt: string;
  entries: LeaderboardEntry[];
  userRank?: UserRankInfo;
  pagination: PaginationInfo;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  displayName: string;
  avatarUrl: string;
  score: number;
  metadata?: Record<string, unknown>;
  achievedAt: string;
}

export interface UserRankInfo {
  rank: number;
  score: number;
  isInTop100: boolean;
}

export interface ScoreSubmission {
  gameId: string;
  score: number;
  metadata?: Record<string, unknown>;
  proof?: ScoreProof;
}

export interface ScoreProof {
  signature: string;
  timestamp: number;
}

export interface ScoreSubmissionResult {
  submissionId: string;
  rank: number;
  previousRank?: number;
  rankChange?: number;
  newHighScore: boolean;
  rewards?: Reward[];
}

export interface Reward {
  type: 'token' | 'badge' | 'item';
  symbol?: string;
  amount?: string;
  name?: string;
  description?: string;
}

export interface GameStats {
  gameId: string;
  totalPlayers: number;
  totalGamesPlayed: number;
  averageScore: number;
  topScore: number;
  userStats?: UserGameStats;
}

export interface UserGameStats {
  gamesPlayed: number;
  highScore: number;
  averageScore: number;
  totalPlayTime: number;
  lastPlayedAt: string;
}

// ============================================================================
// UI Types
// ============================================================================

export interface UIModule {
  /** Show mini app in container */
  show(options?: ShowOptions): Promise<void>;
  /** Close mini app */
  close(data?: CloseData): Promise<void>;
  /** Resize container */
  resize(dimensions: Dimensions): Promise<void>;
  /** Set header title */
  setTitle(title: string): Promise<void>;
  /** Show/hide loading indicator */
  setLoading(visible: boolean): Promise<void>;
  /** Request fullscreen mode */
  requestFullscreen(): Promise<void>;
  /** Exit fullscreen mode */
  exitFullscreen(): Promise<void>;
}

export interface ShowOptions {
  /** Animation type */
  animation?: 'slide-up' | 'fade' | 'none';
  /** Container style */
  style?: 'modal' | 'fullscreen' | 'sheet';
  /** Background overlay */
  overlay?: boolean;
  /** Close on backdrop click */
  closeOnBackdrop?: boolean;
  /** Initial dimensions */
  dimensions?: Dimensions;
}

export interface CloseData {
  /** Result data to pass to parent */
  result?: unknown;
  /** Close animation */
  animation?: 'slide-down' | 'fade' | 'none';
}

export interface Dimensions {
  width?: number | string;
  height?: number | string;
  maxWidth?: number | string;
  maxHeight?: number | string;
}

// ============================================================================
// Notification Types
// ============================================================================

export interface NotificationModule {
  /** Subscribe to notification topics */
  subscribe(topics: string[]): Promise<SubscriptionResult>;
  /** Unsubscribe from topics */
  unsubscribe(topics: string[]): Promise<void>;
  /** Register notification handler */
  onNotification(handler: NotificationHandler): () => void;
  /** Get pending notifications */
  getPending(): Promise<Notification[]>;
  /** Mark notification as read */
  markAsRead(notificationId: string): Promise<void>;
}

export type NotificationType = 
  | 'LEADERBOARD_UPDATE'
  | 'WALLET_UPDATE'
  | 'GAME_EVENT'
  | 'SYSTEM'
  | 'CUSTOM';

export interface Notification {
  id: string;
  type: NotificationType;
  topic: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  timestamp: number;
  read: boolean;
  priority: 'low' | 'normal' | 'high' | 'urgent';
}

export type NotificationHandler = (notification: Notification) => void;

export interface SubscriptionResult {
  success: boolean;
  subscribed: string[];
  failed: string[];
}

export interface NotificationQuery {
  unreadOnly?: boolean;
  limit?: number;
  cursor?: string;
}

export interface NotificationResponse {
  notifications: Notification[];
  unreadCount: number;
  pagination: PaginationInfo;
}

// ============================================================================
// Event Types
// ============================================================================

export interface EventHandlerMap {
  /** SDK initialized */
  onInit: (session: SessionInfo) => void;
  /** Authentication state changed */
  onAuthChange: (auth: AuthState) => void;
  /** Mini app became visible */
  onShow: () => void;
  /** Mini app hidden */
  onHide: () => void;
  /** Mini app closing */
  onClose: (data: CloseData) => void;
  /** Visibility change (foreground/background) */
  onVisibilityChange: (visible: boolean) => void;
  /** Network status change */
  onNetworkChange: (online: boolean) => void;
  /** Deep link received */
  onDeepLink: (url: string, params: Record<string, string>) => void;
  /** Platform data updated */
  onPlatformDataUpdate: (data: PlatformData) => void;
  /** Notification received */
  onNotification: (notification: Notification) => void;
  /** Error occurred */
  onError: (error: SDKError) => void;
}

export interface PlatformData {
  type: string;
  payload: unknown;
}

// ============================================================================
// Message Protocol Types
// ============================================================================

export type MessageType = 
  | 'INIT'
  | 'AUTH_REQUEST'
  | 'AUTH_RESPONSE'
  | 'AUTH_REFRESH'
  | 'USER_INFO_REQUEST'
  | 'USER_INFO_RESPONSE'
  | 'WALLET_BALANCE_REQUEST'
  | 'WALLET_BALANCE_RESPONSE'
  | 'LEADERBOARD_REQUEST'
  | 'LEADERBOARD_RESPONSE'
  | 'NOTIFICATION_SUBSCRIBE'
  | 'NOTIFICATION_RECEIVE'
  | 'UI_SHOW'
  | 'UI_CLOSE'
  | 'UI_RESIZE'
  | 'EVENT_LIFECYCLE'
  | 'EVENT_VISIBILITY'
  | 'ERROR';

export interface CricapMessage {
  /** Unique message ID */
  id: string;
  /** Message type */
  type: MessageType;
  /** Message payload */
  payload: unknown;
  /** Timestamp */
  timestamp: number;
  /** Source identifier */
  source: 'miniapp' | 'container';
}

export interface MessageResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: MessageError;
}

export interface MessageError {
  code: string;
  message: string;
  details?: unknown;
}

// ============================================================================
// Error Types
// ============================================================================

export interface SDKError {
  code: string;
  message: string;
  details?: unknown;
  recoverable: boolean;
}

export class CricapSDKError extends Error {
  public code: string;
  public details?: unknown;
  public recoverable: boolean;

  constructor(code: string, message: string, recoverable = false, details?: unknown) {
    super(message);
    this.name = 'CricapSDKError';
    this.code = code;
    this.recoverable = recoverable;
    this.details = details;
  }
}

// ============================================================================
// Event Emitter Types
// ============================================================================

export type EventListener = (...args: any[]) => void;

export interface EventEmitter {
  on(event: string, listener: EventListener): () => void;
  off(event: string, listener: EventListener): void;
  emit(event: string, ...args: any[]): void;
  once(event: string, listener: EventListener): () => void;
}
