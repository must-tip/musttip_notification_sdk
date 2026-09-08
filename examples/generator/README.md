# Client generation

The REST SDK is generated from `specs/openapi-v1.yaml`. The generator configs cover Python, TypeScript Fetch, Go, Java, C#, PHP, Ruby, Kotlin, Swift, Rust and Dart/Dio.

```bash
python generator/generate.py typescript-fetch --output generated/typescript --clean
python generator/generate.py go --output generated/go --clean
```

Install and **pin** `openapi-generator-cli` in CI. Do not silently upgrade generator versions because model naming and nullability may change. After generation, run the language package's formatter, compiler and tests, then run the repository conformance checks.

The AsyncAPI contract is transport/protocol documentation. Realtime clients should use their language's maintained WebSocket implementation while preserving the envelopes, subprotocols and security rules in `specs/asyncapi-v1.yaml`.
