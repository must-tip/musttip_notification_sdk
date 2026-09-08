# Tenant, application, user and group scoping

The SDK is an external developer client. It is not a tenant authority and it does not create or validate Must Tip tenants.

## Authority model

`tenant_id` is never accepted as SDK configuration, a request header, query parameter or request-body authority field. The notification service obtains tenant identity only from the OAuth access token after the authentication system has verified the principal, tenant, application, membership/status and authorization version.

An application-scoped access token remains pinned to its authenticated application. Tenant-wide tokens may target an application only through the server-defined `/applications/{application_id}/...` routes and only when the notification service confirms that the application belongs to the authenticated tenant and the principal has the tenant-wide scope.

The SDK deliberately cannot send `X-Tenant-ID`, `X-Application-ID`, or override `Authorization`. This prevents SDK consumers from creating a forged authority channel beside OAuth.

## Recommended hierarchy

Use the narrowest route that matches the operation:

- application feed: `/applications/{application_id}/notifications/`
- user-owned feed: `/applications/{application_id}/users/{recipient_identifier}/notifications/`
- group feed: `/groups/{group_name}/notifications/`
- generic feed: `/notifications/` only when the authenticated application context is already sufficient

The user-owned routes are preferred when an SDK consumer is manipulating one user's notifications because the recipient is bound in the route and cannot be replaced by the body.

## Delete ownership

Deletion requires `notifications.delete` and an idempotency key. Generic/application detail deletion also requires `recipient_identifier`; the notification service validates tenant + application + recipient ownership and returns a non-disclosing not-found response on mismatch.

## Token handling

The SDK treats access tokens as opaque credentials. It does not trust unverified JWT claims to establish tenant membership. Tokens should be obtained from the Must Tip authentication system using the notification audience `urn:musttip:notification-service`; service integrations should use the server's recommended `client_credentials` + `private_key_jwt` profile.

## Transport controls

Reference clients require HTTPS outside localhost, reject protected security-header overrides, bound request/response sizes, use timeouts, use idempotency-aware retries, and reject redirects to avoid forwarding bearer tokens to another location.
