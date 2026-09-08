# Authentication and tenancy

## Resource server

The notification API is an OAuth resource server with audience:

```text
urn:musttip:notification-service
```

The authentication service remains authoritative for tenants, OAuth clients, applications, service memberships, roles, permissions, scopes, client status, revocation, DPoP and mTLS.

## Recommended backend principal

Use a confidential service application and `client_credentials`. A verified principal should contain:

```json
{
  "sub": "service-membership-subject",
  "tenant_id": "tenant-a",
  "application_id": "app-a",
  "client_id": "oauth-client-a",
  "principal_type": "service",
  "session_type": "service",
  "aud": ["urn:musttip:notification-service"],
  "scope": "notifications.send notifications.read",
  "authz_version": 12,
  "permissions_hash": "<authorization-snapshot-hash>",
  "jti": "<unique-token-id>",
  "tenant_status": "active",
  "application_status": "active",
  "membership_status": "active",
  "verified": true
}
```

## Isolation

Application credentials may access only records where both identifiers match the verified principal and are non-empty. Tenant-wide access requires an explicit tenant scope and policy grant. The SDK never accepts tenant or application identifiers as an authority override.

## Token provider pattern

Use a token-provider callback so clients obtain short-lived tokens and rotate credentials without reconstructing the SDK client. Cache tokens only until shortly before expiration and never log them.

## Frontend rule

Management tokens belong only in trusted backends. Browser and mobile clients should use:

- the developer's own authenticated backend for management actions;
- narrowly scoped push-token registration flows;
- short-lived, single-use realtime recipient tickets.
