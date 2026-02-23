# Email SDK Monorepo

Production-grade, plugin-based TypeScript Email Abstraction SDK built as an npm workspace monorepo.

## Goals

- Unified email send interface across providers
- User-driven provider registration
- Auto fallback support
- MCP-compatible tool adapter for agents
- Strict TypeScript typing
- Clean architecture boundaries

## Architecture Rules

- `@email-sdk/core` does not depend on any provider package.
- `@email-sdk/runtime` does not import providers directly.
- Provider packages depend only on `@email-sdk/core`.
- Provider registration is explicit and done by the SDK consumer.
- No dynamic `require`.
- Strict TypeScript mode is enabled across all packages.

## Monorepo Structure

```text
.
├─ package.json
├─ tsconfig.base.json
├─ tsconfig.json
└─ packages
   ├─ core
   ├─ runtime
   ├─ mcp
   ├─ providers
   │  ├─ ses
   │  ├─ sendgrid
   │  ├─ smtp
   │  ├─ gmail
   │  └─ zeptomail
   └─ examples
```

## Packages

### `@email-sdk/core`

Contains shared contracts and canonical errors.

- `EmailRequest`
- `EmailResponse`
- `EmailProviderPlugin`
- `RetryPolicy`
- `FallbackStrategy`
- `Logger`
- `EmailError`
- `RateLimitError`
- `ProviderUnavailableError`
- `InvalidConfigurationError`
- `DomainNotVerifiedError`
- `AggregateSendError`

### `@email-sdk/runtime`

Orchestration engine.

- Registers provider plugins at runtime
- Sends with explicit provider or `"auto"`
- Applies retry policy (if configured)
- Applies fallback strategy

Includes `SequentialFallback`:

- tries providers in registration order
- retries next provider on `RateLimitError` or `ProviderUnavailableError`
- throws immediately on `InvalidConfigurationError`
- throws `AggregateSendError` if all providers fail

### Provider Packages

- `@email-sdk/provider-ses`
- `@email-sdk/provider-sendgrid`
- `@email-sdk/provider-smtp`
- `@email-sdk/provider-gmail`
- `@email-sdk/provider-zeptomail`

Each package exports a factory function returning `EmailProviderPlugin`.

### `@email-sdk/mcp`

Exports `createSendEmailTool(runtime)` that returns an MCP-style tool definition:

- `name: "send_email"`
- `description: "Send transactional email"`
- JSON input schema for `to`, `subject`, `body`
- `execute(input)` implementation using runtime send

### `@email-sdk/examples`

Example entrypoints:

- `src/basic.ts`
- `src/fallback.ts`
- `src/mcp.ts`
- `src/gmail.ts`
- `src/zeptomail.ts`

## Install

Install only what you use.

For SDK consumers (app projects):

```bash
npm install @email-sdk/runtime @email-sdk/provider-ses
```

Install multiple providers:

```bash
npm install @email-sdk/runtime @email-sdk/provider-sendgrid @email-sdk/provider-smtp
```

Install MCP adapter:

```bash
npm install @email-sdk/mcp
```

For contributors working in this monorepo:

```bash
npm install
```

## Typecheck / Build

```bash
npm run typecheck
npm run build
```

## Quick Start

```ts
import { createEmailRuntime, SequentialFallback } from "@email-sdk/runtime"
import { SESProvider } from "@email-sdk/provider-ses"
import { SendGridProvider } from "@email-sdk/provider-sendgrid"

const runtime = createEmailRuntime({
  fallbackStrategy: new SequentialFallback()
})

runtime.registerProvider(
  SESProvider({
    region: "us-east-1",
    accessKeyId: "access",
    secretAccessKey: "secret",
    fromEmail: "noreply@example.com"
  })
)

runtime.registerProvider(
  SendGridProvider({
    apiKey: "sg-key",
    fromEmail: "noreply@example.com"
  })
)

await runtime.send({
  to: "user@example.com",
  subject: "Hello",
  html: "<p>Sent via provider abstraction</p>",
  provider: "auto"
})
```

## Provider Selection

- Explicit provider:
  - `provider: "ses"` (or any registered provider name)
- Automatic fallback:
  - `provider: "auto"` or omit `provider`

## MCP Tool Example

```ts
import { createSendEmailTool } from "@email-sdk/mcp"
import { createEmailRuntime, SequentialFallback } from "@email-sdk/runtime"
import { SMTPProvider } from "@email-sdk/provider-smtp"

const runtime = createEmailRuntime({
  fallbackStrategy: new SequentialFallback()
})

runtime.registerProvider(
  SMTPProvider({
    host: "smtp.example.com",
    port: 587,
    secure: false,
    username: "user",
    password: "pass",
    fromEmail: "noreply@example.com"
  })
)

const tool = createSendEmailTool(runtime)
```

## Adding a New Provider

1. Create `packages/providers/<name>/`.
2. Add `package.json` + `tsconfig.json` with a reference to `../../core`.
3. Export `<Name>Provider(config): EmailProviderPlugin`.
4. Map provider-specific errors into canonical core errors.
5. Add project reference in root `tsconfig.json`.
6. Add provider dependency in `packages/examples/package.json` if used in examples.
7. Add reference in `packages/examples/tsconfig.json` if used in examples.

## Notes on Real Provider APIs

- SES, SendGrid, and SMTP providers in this repo are mock-safe abstractions for architecture and contract validation.
- Gmail and ZeptoMail providers include real client wiring patterns and error normalization.
- Use environment variables and secret managers for credentials in production.

## License

Private/internal by default. Add your preferred license before publishing.
