export declare function signEventPayload(payload: Uint8Array, secret: string, keyId: string): Promise<Record<string, string>>;
export declare function verifyEventPayload(payload: Uint8Array, headers: Readonly<Record<string, string>>, secrets: Readonly<Record<string, string>>, required?: boolean): Promise<boolean>;
