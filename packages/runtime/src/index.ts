import {
  AggregateSendError,
  type EmailProviderPlugin,
  type EmailRequest,
  type EmailResponse,
  type FallbackStrategy,
  InvalidConfigurationError,
  type Logger,
  ProviderUnavailableError,
  RateLimitError,
  type RetryPolicy,
  selectProviders,
  toEmailError
} from "@email-sdk/core"

export interface EmailRuntime {
  registerProvider(provider: EmailProviderPlugin): void
  listProviders(): string[]
  send(request: EmailRequest): Promise<EmailResponse>
}

export interface RuntimeOptions {
  fallbackStrategy: FallbackStrategy
  retryPolicy?: RetryPolicy
  logger?: Logger
}

class NoRetryPolicy implements RetryPolicy {
  shouldRetry(): boolean {
    return false
  }

  getDelayMs(): number {
    return 0
  }
}

class NoopLogger implements Logger {
  debug(): void {}
  info(): void {}
  warn(): void {}
  error(): void {}
}

export class SequentialFallback implements FallbackStrategy {
  async execute(providers: EmailProviderPlugin[], request: EmailRequest): Promise<EmailResponse> {
    const errors: Array<ReturnType<typeof toEmailError>> = []

    for (const provider of providers) {
      try {
        return await provider.send(request)
      } catch (error) {
        const normalized = toEmailError(error, provider.name)

        if (normalized instanceof InvalidConfigurationError) {
          throw normalized
        }

        if (
          normalized instanceof RateLimitError ||
          normalized instanceof ProviderUnavailableError
        ) {
          errors.push(normalized)
          continue
        }

        throw normalized
      }
    }

    throw new AggregateSendError("All providers failed during sequential fallback", errors)
  }
}

export function createEmailRuntime(options: RuntimeOptions): EmailRuntime {
  const providers = new Map<string, EmailProviderPlugin>()
  const retryPolicy = options.retryPolicy ?? new NoRetryPolicy()
  const logger = options.logger ?? new NoopLogger()

  function registerProvider(provider: EmailProviderPlugin): void {
    providers.set(provider.name, provider)
    logger.info("Registered provider", { provider: provider.name })
  }

  async function sendWithRetry(provider: EmailProviderPlugin, request: EmailRequest): Promise<EmailResponse> {
    let attempt = 1

    while (true) {
      try {
        return await provider.send(request)
      } catch (error) {
        const normalized = toEmailError(error, provider.name)
        const shouldRetry = retryPolicy.shouldRetry(normalized, attempt)

        if (!shouldRetry) {
          throw normalized
        }

        const delayMs = retryPolicy.getDelayMs(attempt)
        logger.warn("Retrying provider send", {
          provider: provider.name,
          attempt,
          delayMs,
          code: normalized.code
        })

        if (delayMs > 0) {
          await new Promise<void>((resolve) => {
            setTimeout(() => resolve(), delayMs)
          })
        }

        attempt += 1
      }
    }
  }

  function wrapProvider(provider: EmailProviderPlugin): EmailProviderPlugin {
    return {
      name: provider.name,
      async send(request: EmailRequest): Promise<EmailResponse> {
        return sendWithRetry(provider, request)
      }
    }
  }

  async function send(request: EmailRequest): Promise<EmailResponse> {
    const registeredProviders = Array.from(providers.values())
    const selectedProviders = selectProviders(registeredProviders, request.provider)

    if (selectedProviders.length === 0) {
      throw new ProviderUnavailableError(
        `No provider available for selection: ${request.provider ?? "auto"}`
      )
    }

    const wrappedProviders = selectedProviders.map((provider) => wrapProvider(provider))

    if (request.provider !== undefined && request.provider !== "auto") {
      const selected = wrappedProviders[0]
      if (selected === undefined) {
        throw new ProviderUnavailableError("Selected provider unavailable")
      }
      return selected.send(request)
    }

    return options.fallbackStrategy.execute(wrappedProviders, request)
  }

  return {
    registerProvider,
    listProviders(): string[] {
      return Array.from(providers.keys())
    },
    send
  }
}
