import { type OperationId } from "./operations.js";
export interface SdkConfig {
    baseUrl: string;
    accessToken: string | (() => string | Promise<string>);
    timeoutMs?: number;
    maximumAttempts?: number;
    baseRetryDelayMs?: number;
    maximumRetryDelayMs?: number;
    maximumResponseBytes?: number;
    defaultHeaders?: Readonly<Record<string, string>>;
    fetchImpl?: typeof fetch;
}
export interface ApiResponse<T = unknown> {
    statusCode: number;
    data: T;
    headers: Readonly<Record<string, string>>;
    requestId: string;
}
export interface CallOptions {
    path?: Readonly<Record<string, unknown>>;
    query?: Readonly<Record<string, unknown>>;
    body?: unknown;
    idempotencyKey?: string;
    expectedVersion?: number;
    headers?: Readonly<Record<string, string>>;
}
export declare class NotificationsClient {
    private readonly config;
    private readonly baseUrl;
    private readonly fetchImpl;
    private readonly timeoutMs;
    private readonly maximumAttempts;
    private readonly baseRetryDelayMs;
    private readonly maximumRetryDelayMs;
    private readonly maximumResponseBytes;
    constructor(config: SdkConfig);
    callOperation<T = unknown>(operationId: OperationId, options?: CallOptions): Promise<ApiResponse<T>>;
    createNotification(notification: Readonly<Record<string, unknown>>, idempotencyKey?: string): Promise<ApiResponse>;
    listNotifications(query?: Readonly<Record<string, unknown>>): Promise<ApiResponse>;
    getNotification(publicId: string): Promise<ApiResponse>;
    private resolveToken;
    private buildUrl;
    private apiError;
    private sleep;
}
