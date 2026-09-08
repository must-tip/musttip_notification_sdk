export class NotificationSdkError extends Error {}
export class ConfigurationError extends NotificationSdkError {}
export class TransportError extends NotificationSdkError {}
export class ProtocolError extends NotificationSdkError {}

export class ApiError extends NotificationSdkError {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly requestId = "",
    public readonly errorCode = "",
    public readonly retryable = false,
    public readonly details: unknown = undefined,
    public readonly headers: Readonly<Record<string, string>> = {},
  ) {
    super(message);
  }
}
export class AuthenticationError extends ApiError {}
export class AuthorizationError extends ApiError {}
export class NotFoundError extends ApiError {}
export class ConflictError extends ApiError {}
export class PreconditionError extends ApiError {}
export class RateLimitError extends ApiError {}
export class ServiceUnavailableError extends ApiError {}
