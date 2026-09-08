import {
  ApiError,
  AuthenticationError,
  AuthorizationError,
  ConflictError,
  ConfigurationError,
  NotFoundError,
  PreconditionError,
  ProtocolError,
  RateLimitError,
  ServiceUnavailableError,
  TransportError,
} from "./errors.js";
import { OPERATIONS, type OperationId } from "./operations.js";
import { parseStrictJson, stringifySafeJson } from "./json.js";

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

const RETRYABLE = new Set([408, 425, 429, 500, 502, 503, 504]);

export class NotificationsClient {
  private readonly baseUrl: string;
  private readonly fetchImpl: typeof fetch;
  private readonly timeoutMs: number;
  private readonly maximumAttempts: number;
  private readonly baseRetryDelayMs: number;
  private readonly maximumRetryDelayMs: number;
  private readonly maximumResponseBytes: number;

  constructor(private readonly config: SdkConfig) {
    const url = new URL(config.baseUrl);
    if (!["https:", "http:"].includes(url.protocol) || url.username || url.password || url.search || url.hash) {
      throw new ConfigurationError("baseUrl must be an absolute HTTP(S) URL without credentials, query or fragment");
    }
    if (url.protocol !== "https:" && !["localhost", "127.0.0.1", "::1"].includes(url.hostname)) {
      throw new ConfigurationError("HTTPS is required outside local development");
    }
    this.baseUrl = config.baseUrl.replace(/\/+$/, "");
    this.fetchImpl = config.fetchImpl ?? fetch;
    this.timeoutMs = config.timeoutMs ?? 10_000;
    this.maximumAttempts = config.maximumAttempts ?? 4;
    this.baseRetryDelayMs = config.baseRetryDelayMs ?? 250;
    this.maximumRetryDelayMs = config.maximumRetryDelayMs ?? 30_000;
    this.maximumResponseBytes = config.maximumResponseBytes ?? 8_388_608;
  }

  async callOperation<T = unknown>(operationId: OperationId, options: CallOptions = {}): Promise<ApiResponse<T>> {
    const operation = OPERATIONS[operationId];
    if (operation.idempotencyRequired && !options.idempotencyKey) {
      throw new ProtocolError(`${operationId} requires an idempotency key`);
    }
    const url = this.buildUrl(operation.path, options.path ?? {}, options.query ?? {});
    const token = await this.resolveToken();
    const headers: Record<string, string> = {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
      "X-MustTip-SDK-Version": "1.0.0",
      ...(this.config.defaultHeaders ?? {}),
      ...(options.headers ?? {}),
    };
    if (options.idempotencyKey) headers["Idempotency-Key"] = options.idempotencyKey;
    if (options.expectedVersion !== undefined) headers["If-Match"] = `"${options.expectedVersion}"`;
    let body: string | undefined;
    if (options.body !== undefined) {
      body = stringifySafeJson(options.body);
      headers["Content-Type"] = "application/json";
    }
    const retryable = ["GET", "HEAD", "OPTIONS"].includes(operation.method) || Boolean(options.idempotencyKey);
    for (let attempt = 0; attempt < this.maximumAttempts; attempt += 1) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
      try {
        const response = await this.fetchImpl(url, { method: operation.method, headers, body, signal: controller.signal });
        const responseHeaders = Object.fromEntries([...response.headers.entries()].map(([key, value]) => [key.toLowerCase(), value]));
        const raw = new Uint8Array(await response.arrayBuffer());
        if (raw.byteLength > this.maximumResponseBytes) throw new ProtocolError("response exceeds configured maximum");
        const text = new TextDecoder("utf-8", { fatal: true }).decode(raw);
        const data = text ? parseStrictJson(text, this.maximumResponseBytes) : null;
        if (response.ok) {
          return { statusCode: response.status, data: data as T, headers: responseHeaders, requestId: responseHeaders["x-request-id"] ?? "" };
        }
        if (retryable && RETRYABLE.has(response.status) && attempt + 1 < this.maximumAttempts) {
          await this.sleep(attempt, responseHeaders["retry-after"]);
          continue;
        }
        throw this.apiError(response.status, data, responseHeaders);
      } catch (error) {
        if (error instanceof ApiError || error instanceof ProtocolError) throw error;
        if (retryable && attempt + 1 < this.maximumAttempts) {
          await this.sleep(attempt);
          continue;
        }
        throw new TransportError("notification API transport failed", { cause: error });
      } finally {
        clearTimeout(timeout);
      }
    }
    throw new TransportError("notification API request exhausted retries");
  }

  createNotification(notification: Readonly<Record<string, unknown>>, idempotencyKey = `notification-${crypto.randomUUID()}`): Promise<ApiResponse> {
    return this.callOperation("createNotification", { body: notification, idempotencyKey });
  }

  listNotifications(query: Readonly<Record<string, unknown>> = {}): Promise<ApiResponse> {
    return this.callOperation("listNotifications", { query });
  }

  getNotification(publicId: string): Promise<ApiResponse> {
    return this.callOperation("getNotification", { path: { public_id: publicId } });
  }

  private async resolveToken(): Promise<string> {
    const value = typeof this.config.accessToken === "function" ? await this.config.accessToken() : this.config.accessToken;
    const token = String(value ?? "").trim();
    if (!token || token.length > 16_384 || /\s/.test(token)) throw new ConfigurationError("token provider returned an invalid bearer token");
    return token;
  }

  private buildUrl(template: string, pathValues: Readonly<Record<string, unknown>>, query: Readonly<Record<string, unknown>>): string {
    const required = [...template.matchAll(/\{([A-Za-z_][A-Za-z0-9_]*)\}/g)].map((match) => match[1]!);
    let path = template;
    for (const name of required) {
      if (!(name in pathValues)) throw new ProtocolError(`missing path parameter ${name}`);
      path = path.replace(`{${name}}`, encodeURIComponent(String(pathValues[name])));
    }
    const url = new URL(`${this.baseUrl}${path}`);
    for (const [key, raw] of Object.entries(query)) {
      if (raw === undefined || raw === null) continue;
      const values = Array.isArray(raw) ? raw : [raw];
      for (const value of values) url.searchParams.append(key, typeof value === "boolean" ? String(value).toLowerCase() : String(value));
    }
    return url.toString();
  }

  private apiError(status: number, details: unknown, headers: Readonly<Record<string, string>>): ApiError {
    const record = details && typeof details === "object" && !Array.isArray(details) ? details as Record<string, unknown> : {};
    const detail = record.detail ?? record.message ?? record.error;
    const message = typeof detail === "string" ? detail : typeof detail === "object" && detail ? String((detail as Record<string, unknown>).message ?? "Notification API request failed") : "Notification API request failed";
    const ErrorType = ({ 401: AuthenticationError, 403: AuthorizationError, 404: NotFoundError, 409: ConflictError, 412: PreconditionError, 428: PreconditionError, 429: RateLimitError, 503: ServiceUnavailableError } as const)[status as 401] ?? ApiError;
    return new ErrorType(status, message, headers["x-request-id"] ?? "", "", RETRYABLE.has(status), details, headers);
  }

  private async sleep(attempt: number, retryAfter?: string): Promise<void> {
    let delay = retryAfter && /^\d+$/.test(retryAfter) ? Number(retryAfter) * 1000 : undefined;
    if (delay === undefined) {
      const cap = Math.min(this.maximumRetryDelayMs, this.baseRetryDelayMs * 2 ** attempt);
      delay = Math.random() * cap;
    }
    await new Promise((resolve) => setTimeout(resolve, Math.min(this.maximumRetryDelayMs, Math.max(0, delay!))));
  }
}
