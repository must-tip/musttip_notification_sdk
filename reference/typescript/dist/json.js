import { ProtocolError } from "./errors.js";
const FORBIDDEN_KEYS = new Set(["__proto__", "prototype", "constructor"]);
export function stringifySafeJson(value, maximumBytes = 1_048_576) {
    const seen = new Set();
    let nodes = 0;
    function validate(item, depth) {
        nodes += 1;
        if (nodes > 50_000 || depth > 32)
            throw new ProtocolError("JSON value is too complex");
        if (item === null || typeof item === "string" || typeof item === "boolean")
            return;
        if (typeof item === "number") {
            if (!Number.isFinite(item))
                throw new ProtocolError("non-finite JSON numbers are forbidden");
            return;
        }
        if (typeof item !== "object")
            throw new ProtocolError(`unsupported JSON type: ${typeof item}`);
        if (seen.has(item))
            throw new ProtocolError("cyclic JSON values are forbidden");
        seen.add(item);
        if (Array.isArray(item)) {
            if (item.length > 10_000)
                throw new ProtocolError("JSON collection is too large");
            for (const child of item)
                validate(child, depth + 1);
        }
        else {
            for (const [key, child] of Object.entries(item)) {
                if (!key || key.length > 256 || FORBIDDEN_KEYS.has(key.toLowerCase()))
                    throw new ProtocolError("JSON contains a forbidden key");
                validate(child, depth + 1);
            }
        }
        seen.delete(item);
    }
    validate(value, 0);
    const text = JSON.stringify(value);
    if (new TextEncoder().encode(text).byteLength > maximumBytes)
        throw new ProtocolError("JSON exceeds the configured maximum");
    return text;
}
export function parseStrictJson(text, maximumBytes = 8_388_608) {
    if (new TextEncoder().encode(text).byteLength > maximumBytes)
        throw new ProtocolError("JSON exceeds the configured maximum");
    let index = 0;
    let nodes = 0;
    const length = text.length;
    function fail() { throw new ProtocolError("malformed or duplicate-key JSON"); }
    function whitespace() { while (index < length && /[\t\n\r ]/.test(text[index]))
        index += 1; }
    function stringValue() {
        const start = index;
        if (text[index] !== '"')
            fail();
        index += 1;
        while (index < length) {
            const char = text[index];
            if (char === '"') {
                index += 1;
                try {
                    return JSON.parse(text.slice(start, index));
                }
                catch {
                    fail();
                }
            }
            if (char === "\\") {
                index += 2;
                if (index > length)
                    fail();
            }
            else {
                if (char.charCodeAt(0) < 0x20)
                    fail();
                index += 1;
            }
        }
        fail();
    }
    function value(depth) {
        nodes += 1;
        if (nodes > 50_000 || depth > 64)
            fail();
        whitespace();
        const char = text[index];
        if (char === "{") {
            index += 1;
            whitespace();
            const keys = new Set();
            if (text[index] === "}") {
                index += 1;
                return;
            }
            while (true) {
                whitespace();
                const key = stringValue();
                if (keys.has(key))
                    fail();
                keys.add(key);
                whitespace();
                if (text[index] !== ":")
                    fail();
                index += 1;
                value(depth + 1);
                whitespace();
                if (text[index] === "}") {
                    index += 1;
                    return;
                }
                if (text[index] !== ",")
                    fail();
                index += 1;
            }
        }
        if (char === "[") {
            index += 1;
            whitespace();
            if (text[index] === "]") {
                index += 1;
                return;
            }
            while (true) {
                value(depth + 1);
                whitespace();
                if (text[index] === "]") {
                    index += 1;
                    return;
                }
                if (text[index] !== ",")
                    fail();
                index += 1;
            }
        }
        if (char === '"') {
            stringValue();
            return;
        }
        const remaining = text.slice(index);
        const literal = /^(true|false|null)/.exec(remaining);
        if (literal) {
            index += literal[0].length;
            return;
        }
        const number = /^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/.exec(remaining);
        if (number) {
            if (!Number.isFinite(Number(number[0])))
                fail();
            index += number[0].length;
            return;
        }
        fail();
    }
    value(0);
    whitespace();
    if (index !== length)
        fail();
    try {
        return JSON.parse(text);
    }
    catch {
        fail();
    }
}
