export declare class NotificationSdkError extends Error {
}
export declare class ConfigurationError extends NotificationSdkError {
}
export declare class TransportError extends NotificationSdkError {
}
export declare class ProtocolError extends NotificationSdkError {
}
export declare class ApiError extends NotificationSdkError {
    readonly statusCode: number;
    readonly requestId: string;
    readonly errorCode: string;
    readonly retryable: boolean;
    readonly details: unknown;
    readonly headers: Readonly<Record<string, string>>;
    constructor(statusCode: number, message: string, requestId?: string, errorCode?: string, retryable?: boolean, details?: unknown, headers?: Readonly<Record<string, string>>);
}
export declare class AuthenticationError extends ApiError {
}
export declare class AuthorizationError extends ApiError {
}
export declare class NotFoundError extends ApiError {
}
export declare class ConflictError extends ApiError {
}
export declare class PreconditionError extends ApiError {
}
export declare class RateLimitError extends ApiError {
}
export declare class ServiceUnavailableError extends ApiError {
}
