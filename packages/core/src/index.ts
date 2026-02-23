export interface EmailRequest {
  to: string | string[]
  subject: string
  html?: string
  text?: string
  from?: string
  cc?: string | string[]
  bcc?: string | string[]
  headers?: Record<string, string>
  metadata?: Record<string, string>
  provider?: string | "auto"
}

export interface EmailResponse {
  provider: string
  messageId: string
  accepted: string[]
  rejected: string[]
}

export interface EmailProviderPlugin {
  name: string
  send(request: EmailRequest): Promise<EmailResponse>
}

export interface RetryPolicy {
  shouldRetry(error: unknown, attempt: number): boolean
  getDelayMs(attempt: number): number
}

export interface FallbackStrategy {
  execute(
    providers: EmailProviderPlugin[],
    request: EmailRequest
  ): Promise<EmailResponse>
}

export interface Logger {
  debug(message: string, meta?: Record<string, unknown>): void
  info(message: string, meta?: Record<string, unknown>): void
  warn(message: string, meta?: Record<string, unknown>): void
  error(message: string, meta?: Record<string, unknown>): void
}

export class EmailError extends Error {
  readonly code: string
  readonly provider: string | undefined

  constructor(message: string, code: string, provider?: string, cause?: unknown) {
    super(message, cause !== undefined ? { cause } : undefined)
    this.name = "EmailError"
    this.code = code
    this.provider = provider
  }
}

export class RateLimitError extends EmailError {
  constructor(message = "Rate limit reached", provider?: string, cause?: unknown) {
    super(message, "RATE_LIMIT", provider, cause)
    this.name = "RateLimitError"
  }
}

export class ProviderUnavailableError extends EmailError {
  constructor(message = "Provider unavailable", provider?: string, cause?: unknown) {
    super(message, "PROVIDER_UNAVAILABLE", provider, cause)
    this.name = "ProviderUnavailableError"
  }
}

export class InvalidConfigurationError extends EmailError {
  constructor(message = "Invalid provider configuration", provider?: string, cause?: unknown) {
    super(message, "INVALID_CONFIGURATION", provider, cause)
    this.name = "InvalidConfigurationError"
  }
}

export class DomainNotVerifiedError extends EmailError {
  constructor(message = "Domain not verified", provider?: string, cause?: unknown) {
    super(message, "DOMAIN_NOT_VERIFIED", provider, cause)
    this.name = "DomainNotVerifiedError"
  }
}

export class AggregateSendError extends EmailError {
  readonly errors: ReadonlyArray<EmailError>

  constructor(message: string, errors: ReadonlyArray<EmailError>) {
    super(message, "ALL_PROVIDERS_FAILED")
    this.name = "AggregateSendError"
    this.errors = errors
  }
}

export function toEmailError(error: unknown, provider?: string): EmailError {
  if (error instanceof EmailError) {
    return error
  }

  if (error instanceof Error) {
    return new ProviderUnavailableError(error.message, provider, error)
  }

  return new ProviderUnavailableError("Unknown provider error", provider)
}

export function normalizeRecipients(value: string | string[]): string[] {
  return Array.isArray(value) ? value : [value]
}

export function selectProviders(
  providers: EmailProviderPlugin[],
  providerName: string | "auto" | undefined
): EmailProviderPlugin[] {
  if (providerName === undefined || providerName === "auto") {
    return providers
  }

  return providers.filter((provider) => provider.name === providerName)
}
