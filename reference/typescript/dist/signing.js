import { ConfigurationError, ProtocolError } from "./errors.js";
function base64Url(bytes) {
    let binary = "";
    for (const byte of bytes)
        binary += String.fromCharCode(byte);
    return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}
function decodeBase64Url(value) {
    const padded = value.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - value.length % 4) % 4);
    const binary = atob(padded);
    return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}
export async function signEventPayload(payload, secret, keyId) {
    if (secret.length < 32)
        throw new ConfigurationError("event signing secret must contain at least 32 characters");
    if (!keyId || keyId.length > 64 || /\s/.test(keyId))
        throw new ConfigurationError("event signing key ID is invalid");
    const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
    const signature = new Uint8Array(await crypto.subtle.sign("HMAC", key, new Uint8Array(payload)));
    return { signature: base64Url(signature), "signature-key-id": keyId };
}
export async function verifyEventPayload(payload, headers, secrets, required = true) {
    const signature = headers.signature;
    const keyId = headers["signature-key-id"];
    if (!signature && !keyId) {
        if (required)
            throw new ProtocolError("event signature is required");
        return false;
    }
    if (!signature || !keyId)
        throw new ProtocolError("event signature headers are incomplete");
    if (!/^[A-Za-z0-9_-]{43}$/.test(signature))
        throw new ProtocolError("event signature is invalid");
    const secret = Object.hasOwn(secrets, keyId) ? secrets[keyId] : undefined;
    if (!secret)
        throw new ProtocolError("event signing key is unknown");
    if (secret.length < 32)
        throw new ConfigurationError("event signing secret must contain at least 32 characters");
    const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["verify"]);
    let supplied;
    try {
        supplied = decodeBase64Url(signature);
    }
    catch {
        throw new ProtocolError("event signature is invalid");
    }
    const valid = await crypto.subtle.verify("HMAC", key, new Uint8Array(supplied), new Uint8Array(payload));
    if (!valid)
        throw new ProtocolError("event signature is invalid");
    return true;
}
