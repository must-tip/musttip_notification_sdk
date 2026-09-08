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

const SDK_VERSION = "1.1.0";
const RETRYABLE = new Set([408, 425, 429, 500, 502, 503, 504]);
const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1", "[::1]"]);
const PROTECTED_HEADERS = new Set([
  "accept", "authorization", "connection", "content-length", "content-type", "cookie", "host",
  "idempotency-key", "if-match", "proxy-authorization", "transfer-encoding", "x-application-id",
  "x-musttip-application-id", "x-musttip-sdk-version", "x-musttip-tenant-id", "x-tenant-id",
]);
const FORBIDDEN_AUTHORITY_INPUTS = new Set(["tenant_id", "tenant", "x_tenant_id"]);
const FORBIDDEN_QUERY_INPUTS = new Set([...FORBIDDEN_AUTHORITY_INPUTS, "application_id"]);
const GROUP_RE = /^[a-z][a-z0-9]*(?:[._-][a-z0-9]+)*$/;

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

function validateExtensionHeaders(headers: Readonly<Record<string, string>>, source: string): void {
  for (const [name, value] of Object.entries(headers)) {
    if (!/^[!#$%&'*+.^_`|~0-9A-Za-z-]{1,128}$/.test(name)) {
      throw new ConfigurationError(`${source} contains an invalid header name`);
    }
    if (PROTECTED_HEADERS.has(name.toLowerCase())) {
      throw new ConfigurationError(`${source} cannot override protected header ${name}`);
    }
    if (!value || value.length > 4096 || /[\r\n\0]/.test(value)) {
      throw new ConfigurationError(`${source} contains an invalid header value`);
    }
  }
}

export class NotificationsClient {
  private readonly baseUrl: string;
  private readonly fetchImpl: typeof fetch;
  private readonly timeoutMs: number;
  private readonly maximumAttempts: number;
  private readonly baseRetryDelayMs: number;
  private readonly maximumRetryDelayMs: number;
  private readonly maximumRequestBytes: number;
  private readonly maximumResponseBytes: number;
  private readonly defaultHeaders: Readonly<Record<string, string>>;

  constructor(private readonly config: SdkConfig) {
    const url = new URL(config.baseUrl);
    if (!["https:", "http:"].includes(url.protocol) || url.username || url.password || url.search || url.hash) {
      throw new ConfigurationError("baseUrl must be an absolute HTTP(S) URL without credentials, query or fragment");
    }
    if (url.protocol !== "https:" && !LOCAL_HOSTS.has(url.hostname)) {
      throw new ConfigurationError("HTTPS is required outside local development");
    }
    this.baseUrl = url.toString().replace(/\/+$/, "");
    this.fetchImpl = config.fetchImpl ?? fetch;
    this.timeoutMs = config.timeoutMs ?? 10_000;
    this.maximumAttempts = config.maximumAttempts ?? 4;
    this.baseRetryDelayMs = config.baseRetryDelayMs ?? 250;
    this.maximumRetryDelayMs = config.maximumRetryDelayMs ?? 30_000;
    this.maximumRequestBytes = config.maximumRequestBytes ?? 1_048_576;
    this.maximumResponseBytes = config.maximumResponseBytes ?? 8_388_608;
    this.defaultHeaders = Object.freeze({ ...config.defaultHeaders });

    if (!(this.timeoutMs >= 100 && this.timeoutMs <= 300_000)) throw new ConfigurationError("timeoutMs must be between 100 and 300000");
    if (!(this.maximumAttempts >= 1 && this.maximumAttempts <= 10)) throw new ConfigurationError("maximumAttempts must be between 1 and 10");
    if (!(this.baseRetryDelayMs >= 0 && this.baseRetryDelayMs <= 60_000)) throw new ConfigurationError("baseRetryDelayMs is outside the supported range");
    if (!(this.maximumRetryDelayMs >= this.baseRetryDelayMs && this.maximumRetryDelayMs <= 300_000)) throw new ConfigurationError("maximumRetryDelayMs is outside the supported range");
    if (!(this.maximumRequestBytes >= 1_024 && this.maximumRequestBytes <= 16_777_216)) throw new ConfigurationError("maximumRequestBytes is outside the supported range");
    if (!(this.maximumResponseBytes >= 4_096 && this.maximumResponseBytes <= 16_777_216)) throw new ConfigurationError("maximumResponseBytes is outside the supported range");
    for (const value of [this.maximumAttempts, this.maximumRequestBytes, this.maximumResponseBytes]) {
      if (!Number.isSafeInteger(value)) throw new ConfigurationError("attempt and byte limits must be integers");
    }
    validateExtensionHeaders(this.defaultHeaders, "defaultHeaders");
  }

  async callOperation<T = unknown>(operationId: OperationId, options: CallOptions = {}): Promise<ApiResponse<T>> {
    const operation = OPERATIONS[operationId];
    if (operation.idempotencyRequired && !options.idempotencyKey) {
      throw new ProtocolError(`${operationId} requires an idempotency key`);
    }
    const path = options.path ?? {};
    const query = options.query ?? {};
    this.rejectAuthorityOverrides(path, query, options.body);
    const url = this.buildUrl(operation.path, path, query);
    const token = await this.resolveToken();
    const extensionHeaders = options.headers ?? {};
    validateExtensionHeaders(extensionHeaders, "headers");

    const headers: Record<string, string> = {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
      "X-MustTip-SDK-Version": SDK_VERSION,
      ...this.defaultHeaders,
      ...extensionHeaders,
    };
    if (options.idempotencyKey) {
      this.validateHeaderValue(options.idempotencyKey, "Idempotency-Key", 128);
      headers["Idempotency-Key"] = options.idempotencyKey;
    }
    if (options.expectedVersion !== undefined) {
      if (!Number.isSafeInteger(options.expectedVersion) || options.expectedVersion < 0) throw new ProtocolError("expectedVersion must be a non-negative safe integer");
      headers["If-Match"] = `"${options.expectedVersion}"`;
    }

    let body: string | undefined;
    if (options.body !== undefined) {
      body = stringifySafeJson(options.body);
      if (new TextEncoder().encode(body).byteLength > this.maximumRequestBytes) throw new ProtocolError("request body exceeds configured maximum");
      headers["Content-Type"] = "application/json";
    }

    const retryable = ["GET", "HEAD", "OPTIONS"].includes(operation.method) || Boolean(options.idempotencyKey);
    for (let attempt = 0; attempt < this.maximumAttempts; attempt += 1) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
      try {
        const response = await this.fetchImpl(url, {
          method: operation.method,
          headers,
          body,
          signal: controller.signal,
          redirect: "error",
          credentials: "omit",
          referrerPolicy: "no-referrer",
        });
        const responseHeaders = Object.fromEntries([...response.headers.entries()].map(([key, value]) => [key.toLowerCase(), value]));
        const raw = await this.readBounded(response);
        if (raw.byteLength > this.maximumResponseBytes) throw new ProtocolError("response exceeds configured maximum");
        let data: unknown = null;
        try {
          const text = new TextDecoder("utf-8", { fatal: true }).decode(raw);
          data = text ? parseStrictJson(text, this.maximumResponseBytes) : null;
        } catch (error) {
          if (response.ok) throw new ProtocolError("response contains invalid JSON or UTF-8");
        }
        if (response.ok) {
          if (operation.successStatuses.length > 0 && !(operation.successStatuses as readonly number[]).includes(response.status)) {
            throw new ProtocolError(`${operationId} returned undocumented success status ${response.status}`);
          }
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

  private async readBounded(response: Response): Promise<Uint8Array> {
    if (!response.body) return new Uint8Array();
    const reader = response.body.getReader();
    const chunks: Uint8Array[] = [];
    let size = 0;
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        size += value.byteLength;
        if (size > this.maximumResponseBytes) {
          await reader.cancel();
          throw new ProtocolError("response exceeds configured maximum");
        }
        chunks.push(value);
      }
    } finally {
      reader.releaseLock();
    }
    const result = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) { result.set(chunk, offset); offset += chunk.byteLength; }
    return result;
  }

  capabilities(): Promise<ApiResponse> { return this.callOperation("getExternalNotificationCapabilities"); }
  forApplication(applicationId: string): ApplicationNotificationsClient { return new ApplicationNotificationsClient(this, this.identifier(applicationId, "applicationId")); }
  forUser(applicationId: string, recipientIdentifier: string): UserNotificationsClient {
    return new UserNotificationsClient(this, this.identifier(applicationId, "applicationId"), this.identifier(recipientIdentifier, "recipientIdentifier"));
  }
  createNotification(notification: Readonly<Record<string, unknown>>, idempotencyKey = this.key("notification")): Promise<ApiResponse> {
    return this.callOperation("createNotification", { body: notification, idempotencyKey });
  }
  listNotifications(query: Readonly<Record<string, unknown>> = {}): Promise<ApiResponse> { return this.callOperation("listNotifications", { query }); }
  getNotification(publicId: string): Promise<ApiResponse> { return this.callOperation("getNotification", { path: { public_id: publicId } }); }
  deleteNotification(publicId: string, recipientIdentifier: string, idempotencyKey = this.key(`delete-${publicId}`)): Promise<ApiResponse> {
    return this.callOperation("deleteNotification", { path: { public_id: publicId }, query: { recipient_identifier: this.identifier(recipientIdentifier, "recipientIdentifier") }, idempotencyKey });
  }

  listApplicationNotifications(applicationId: string, query: Readonly<Record<string, unknown>> = {}): Promise<ApiResponse> {
    return this.callOperation("listApplicationNotifications", { path: { application_id: this.identifier(applicationId, "applicationId") }, query });
  }
  createApplicationNotification(applicationId: string, notification: Readonly<Record<string, unknown>>, idempotencyKey = this.key("app-notification")): Promise<ApiResponse> {
    return this.callOperation("createApplicationNotification", { path: { application_id: this.identifier(applicationId, "applicationId") }, body: notification, idempotencyKey });
  }
  getApplicationNotification(applicationId: string, publicId: string): Promise<ApiResponse> {
    return this.callOperation("getApplicationNotification", { path: { application_id: this.identifier(applicationId, "applicationId"), public_id: publicId } });
  }
  deleteApplicationNotification(applicationId: string, publicId: string, recipientIdentifier: string, idempotencyKey = this.key(`delete-app-${publicId}`)): Promise<ApiResponse> {
    return this.callOperation("deleteApplicationNotification", { path: { application_id: this.identifier(applicationId, "applicationId"), public_id: publicId }, query: { recipient_identifier: this.identifier(recipientIdentifier, "recipientIdentifier") }, idempotencyKey });
  }

  listUserNotifications(applicationId: string, recipientIdentifier: string, query: Readonly<Record<string, unknown>> = {}): Promise<ApiResponse> {
    return this.callOperation("listOwnedApplicationNotifications", { path: { application_id: this.identifier(applicationId, "applicationId"), recipient_identifier: this.identifier(recipientIdentifier, "recipientIdentifier") }, query });
  }
  createUserNotification(applicationId: string, recipientIdentifier: string, notification: Readonly<Record<string, unknown>>, idempotencyKey = this.key("user-notification")): Promise<ApiResponse> {
    return this.callOperation("createOwnedApplicationNotification", { path: { application_id: this.identifier(applicationId, "applicationId"), recipient_identifier: this.identifier(recipientIdentifier, "recipientIdentifier") }, body: notification, idempotencyKey });
  }
  getUserNotification(applicationId: string, recipientIdentifier: string, publicId: string): Promise<ApiResponse> {
    return this.callOperation("getOwnedApplicationNotification", { path: { application_id: this.identifier(applicationId, "applicationId"), recipient_identifier: this.identifier(recipientIdentifier, "recipientIdentifier"), public_id: publicId } });
  }
  deleteUserNotification(applicationId: string, recipientIdentifier: string, publicId: string, idempotencyKey = this.key(`delete-user-${publicId}`)): Promise<ApiResponse> {
    return this.callOperation("deleteOwnedApplicationNotification", { path: { application_id: this.identifier(applicationId, "applicationId"), recipient_identifier: this.identifier(recipientIdentifier, "recipientIdentifier"), public_id: publicId }, idempotencyKey });
  }

  listGroupNotifications(groupName: string, query: Readonly<Record<string, unknown>> = {}): Promise<ApiResponse> {
    return this.callOperation("listGroupedNotifications", { path: { group_name: this.group(groupName) }, query });
  }
  createGroupNotification(groupName: string, notification: Readonly<Record<string, unknown>>, idempotencyKey = this.key("group-notification")): Promise<ApiResponse> {
    return this.callOperation("createGroupedNotification", { path: { group_name: this.group(groupName) }, body: notification, idempotencyKey });
  }

  private async resolveToken(): Promise<string> {
    const value = typeof this.config.accessToken === "function" ? await this.config.accessToken() : this.config.accessToken;
    if (typeof value !== "string") throw new ConfigurationError("token provider must return a string");
    const token = value.trim();
    if (!token || token.length > 16_384 || !/^[A-Za-z0-9._~+/-]+=*$/.test(token)) throw new ConfigurationError("token provider returned an invalid bearer token");
    return token;
  }

  private buildUrl(template: string, pathValues: Readonly<Record<string, unknown>>, query: Readonly<Record<string, unknown>>): string {
    const required = [...template.matchAll(/\{([A-Za-z_][A-Za-z0-9_]*)\}/g)].map((match) => match[1]!);
    const requiredSet = new Set(required);
    const provided = Object.keys(pathValues);
    const missing = required.filter((name) => !(name in pathValues));
    const unknown = provided.filter((name) => !requiredSet.has(name));
    if (missing.length || unknown.length) throw new ProtocolError(`path parameters mismatch; missing=${missing.join(",")} unknown=${unknown.join(",")}`);
    let path = template;
    for (const name of required) path = path.replace(`{${name}}`, encodeURIComponent(this.identifier(pathValues[name], name, 1024)));
    const url = new URL(`${this.baseUrl}${path}`);
    for (const [key, raw] of Object.entries(query)) {
      if (raw === undefined || raw === null) continue;
      if (!key || key.length > 128 || /[\r\n\0]/.test(key)) throw new ProtocolError("invalid query parameter name");
      const values = Array.isArray(raw) ? raw : [raw];
      for (const value of values) {
        const rendered = typeof value === "boolean" ? String(value).toLowerCase() : String(value);
        if (rendered.length > 4096 || /[\r\n\0]/.test(rendered)) throw new ProtocolError(`query parameter ${key} is invalid`);
        url.searchParams.append(key, rendered);
      }
    }
    return url.toString();
  }

  private rejectAuthorityOverrides(path: Readonly<Record<string, unknown>>, query: Readonly<Record<string, unknown>>, body: unknown): void {
    if (Object.keys(path).some((key) => FORBIDDEN_AUTHORITY_INPUTS.has(key.toLowerCase())) || Object.keys(query).some((key) => FORBIDDEN_QUERY_INPUTS.has(key.toLowerCase()))) {
      throw new ProtocolError("tenant/application authority cannot be supplied outside canonical application routes");
    }
    if (body && typeof body === "object" && !Array.isArray(body)) {
      const keys = Object.keys(body as Record<string, unknown>).map((key) => key.toLowerCase());
      if (keys.some((key) => FORBIDDEN_AUTHORITY_INPUTS.has(key) || key === "application_id")) {
        throw new ProtocolError("tenant/application authority cannot be supplied in request bodies");
      }
    }
  }

  private apiError(status: number, details: unknown, headers: Readonly<Record<string, string>>): ApiError {
    const record = details && typeof details === "object" && !Array.isArray(details) ? details as Record<string, unknown> : {};
    const detail = record.detail ?? record.message ?? record.error;
    const message = typeof detail === "string" ? detail : typeof detail === "object" && detail ? String((detail as Record<string, unknown>).message ?? "Notification API request failed") : "Notification API request failed";
    const errorCode = typeof record.code === "string" ? record.code : typeof detail === "object" && detail && typeof (detail as Record<string, unknown>).code === "string" ? String((detail as Record<string, unknown>).code) : "";
    const ErrorType = ({ 401: AuthenticationError, 403: AuthorizationError, 404: NotFoundError, 409: ConflictError, 412: PreconditionError, 428: PreconditionError, 429: RateLimitError, 503: ServiceUnavailableError } as const)[status as 401] ?? ApiError;
    return new ErrorType(status, message.slice(0, 500), (headers["x-request-id"] ?? "").slice(0, 256), errorCode.slice(0, 128), RETRYABLE.has(status), details, headers);
  }

  private async sleep(attempt: number, retryAfter?: string): Promise<void> {
    let delay = retryAfter && /^\d+$/.test(retryAfter) ? Number(retryAfter) * 1000 : undefined;
    if (delay === undefined) {
      const cap = Math.min(this.maximumRetryDelayMs, this.baseRetryDelayMs * 2 ** attempt);
      delay = Math.random() * cap;
    }
    await new Promise((resolve) => setTimeout(resolve, Math.min(this.maximumRetryDelayMs, Math.max(0, delay!))));
  }

  private identifier(value: unknown, name: string, maximum = 255): string {
    const rendered = String(value ?? "").trim();
    if ([".", ".."].includes(rendered)) throw new ProtocolError(`invalid ${name}`);
    if (!rendered || rendered.length > maximum || /[\r\n\0]/.test(rendered)) throw new ProtocolError(`invalid ${name}`);
    return rendered;
  }

  private group(value: unknown): string {
    const group = this.identifier(value, "groupName", 64).toLowerCase();
    if (!GROUP_RE.test(group)) throw new ProtocolError("groupName must be a safe lowercase notification-group slug");
    return group;
  }

  private key(prefix: string): string {
    const safe = prefix.replace(/[^A-Za-z0-9._:@/-]+/g, "-").slice(0, 72).replace(/^-+|-+$/g, "") || "request";
    return `${safe}-${crypto.randomUUID()}`.slice(0, 128);
  }

  private validateHeaderValue(value: string, name: string, maximum: number): void {
    if (!value || value.length > maximum || /[\r\n\0]/.test(value)) throw new ProtocolError(`${name} header value is invalid`);
  }
}


export class ApplicationNotificationsClient {
  constructor(private readonly client: NotificationsClient, public readonly applicationId: string) {}

  list(query: Readonly<Record<string, unknown>> = {}): Promise<ApiResponse> {
    return this.client.listApplicationNotifications(this.applicationId, query);
  }

  create(notification: Readonly<Record<string, unknown>>, idempotencyKey?: string): Promise<ApiResponse> {
    return this.client.createApplicationNotification(this.applicationId, notification, idempotencyKey);
  }

  get(publicId: string): Promise<ApiResponse> { return this.client.getApplicationNotification(this.applicationId, publicId); }

  delete(publicId: string, recipientIdentifier: string, idempotencyKey?: string): Promise<ApiResponse> {
    return this.client.deleteApplicationNotification(this.applicationId, publicId, recipientIdentifier, idempotencyKey);
  }

  forUser(recipientIdentifier: string): UserNotificationsClient {
    return new UserNotificationsClient(this.client, this.applicationId, String(recipientIdentifier).trim());
  }
}

export class UserNotificationsClient {
  constructor(
    private readonly client: NotificationsClient,
    public readonly applicationId: string,
    public readonly recipientIdentifier: string,
  ) {
    if (!recipientIdentifier || recipientIdentifier.length > 255 || /[\r\n\0]/.test(recipientIdentifier)) {
      throw new ProtocolError("invalid recipientIdentifier");
    }
  }

  list(query: Readonly<Record<string, unknown>> = {}): Promise<ApiResponse> {
    return this.client.listUserNotifications(this.applicationId, this.recipientIdentifier, query);
  }

  create(notification: Readonly<Record<string, unknown>>, idempotencyKey?: string): Promise<ApiResponse> {
    return this.client.createUserNotification(this.applicationId, this.recipientIdentifier, notification, idempotencyKey);
  }

  get(publicId: string): Promise<ApiResponse> {
    return this.client.getUserNotification(this.applicationId, this.recipientIdentifier, publicId);
  }

  delete(publicId: string, idempotencyKey?: string): Promise<ApiResponse> {
    return this.client.deleteUserNotification(this.applicationId, this.recipientIdentifier, publicId, idempotencyKey);
  }
}
