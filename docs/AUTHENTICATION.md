# Authentication

The notification SDK is a resource client for the Must Tip notification resource server. It is not an authentication SDK and it cannot make a caller a tenant.

## Required authority

Obtain access tokens from the Must Tip authentication system for audience:

`urn:musttip:notification-service`

The resource-server manifest recommends `client_credentials` with `private_key_jwt` for service integrations. The notification server validates the token, tenant status, application status, membership/status, authorization version and required OAuth scopes.

## No tenant override

The SDK intentionally has no `tenant_id` setting. It rejects tenant authority in headers, queries and top-level request bodies. It also blocks protected headers such as `Authorization`, `X-Tenant-ID`, and `X-Application-ID` from custom/default header maps.

This means a forged tenant identifier cannot create an alternate trust path. A forged/invalid token is rejected by the authentication/resource servers; the SDK does not attempt to trust unverified token claims.

## Application targeting

Application-scoped principals use the application embedded in the verified token. Tenant-wide principals may use the canonical `/applications/{application_id}/...` routes, but the notification service still verifies that the target application belongs to the authenticated tenant and that the principal holds the required tenant-wide authorization.

## Token provider

Prefer a callable token provider so normal token rotation/refresh can happen outside the notification client without rebuilding the client object. Never log access tokens.
