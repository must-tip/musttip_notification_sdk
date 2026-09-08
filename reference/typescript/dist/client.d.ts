import { type OperationId } from "./operations.js";
export interface SdkConfig {
    baseUrl: string;
    accessToken: string | (() => string | Promise<string>);
    timeoutMs?: number;
    maximumAttempts?: number;
    baseRetryDelayMs?: number;
    maximumRetryDelayMs?: number;
    maximumRequestBytes?: number;
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
    private readonly maximumRequestBytes;
    private readonly maximumResponseBytes;
    private readonly defaultHeaders;
    constructor(config: SdkConfig);
    callOperation<T = unknown>(operationId: OperationId, options?: CallOptions): Promise<ApiResponse<T>>;
    private readBounded;
    capabilities(): Promise<ApiResponse>;
    forApplication(applicationId: string): ApplicationNotificationsClient;
    forUser(applicationId: string, recipientIdentifier: string): UserNotificationsClient;
    createNotification(notification: Readonly<Record<string, unknown>>, idempotencyKey?: string): Promise<ApiResponse>;
    listNotifications(query?: Readonly<Record<string, unknown>>): Promise<ApiResponse>;
    getNotification(publicId: string): Promise<ApiResponse>;
    deleteNotification(publicId: string, recipientIdentifier: string, idempotencyKey?: string): Promise<ApiResponse>;
    listApplicationNotifications(applicationId: string, query?: Readonly<Record<string, unknown>>): Promise<ApiResponse>;
    createApplicationNotification(applicationId: string, notification: Readonly<Record<string, unknown>>, idempotencyKey?: string): Promise<ApiResponse>;
    getApplicationNotification(applicationId: string, publicId: string): Promise<ApiResponse>;
    deleteApplicationNotification(applicationId: string, publicId: string, recipientIdentifier: string, idempotencyKey?: string): Promise<ApiResponse>;
    listUserNotifications(applicationId: string, recipientIdentifier: string, query?: Readonly<Record<string, unknown>>): Promise<ApiResponse>;
    createUserNotification(applicationId: string, recipientIdentifier: string, notification: Readonly<Record<string, unknown>>, idempotencyKey?: string): Promise<ApiResponse>;
    getUserNotification(applicationId: string, recipientIdentifier: string, publicId: string): Promise<ApiResponse>;
    deleteUserNotification(applicationId: string, recipientIdentifier: string, publicId: string, idempotencyKey?: string): Promise<ApiResponse>;
    listGroupNotifications(groupName: string, query?: Readonly<Record<string, unknown>>): Promise<ApiResponse>;
    createGroupNotification(groupName: string, notification: Readonly<Record<string, unknown>>, idempotencyKey?: string): Promise<ApiResponse>;
    private resolveToken;
    private buildUrl;
    private rejectAuthorityOverrides;
    private apiError;
    private sleep;
    private identifier;
    private group;
    private key;
    private validateHeaderValue;
}
export declare class ApplicationNotificationsClient {
    private readonly client;
    readonly applicationId: string;
    constructor(client: NotificationsClient, applicationId: string);
    list(query?: Readonly<Record<string, unknown>>): Promise<ApiResponse>;
    create(notification: Readonly<Record<string, unknown>>, idempotencyKey?: string): Promise<ApiResponse>;
    get(publicId: string): Promise<ApiResponse>;
    delete(publicId: string, recipientIdentifier: string, idempotencyKey?: string): Promise<ApiResponse>;
    forUser(recipientIdentifier: string): UserNotificationsClient;
}
export declare class UserNotificationsClient {
    private readonly client;
    readonly applicationId: string;
    readonly recipientIdentifier: string;
    constructor(client: NotificationsClient, applicationId: string, recipientIdentifier: string);
    list(query?: Readonly<Record<string, unknown>>): Promise<ApiResponse>;
    create(notification: Readonly<Record<string, unknown>>, idempotencyKey?: string): Promise<ApiResponse>;
    get(publicId: string): Promise<ApiResponse>;
    delete(publicId: string, idempotencyKey?: string): Promise<ApiResponse>;
}
