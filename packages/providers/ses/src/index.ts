import {
  type EmailProviderPlugin,
  type EmailRequest,
  type EmailResponse,
  DomainNotVerifiedError,
  InvalidConfigurationError,
  ProviderUnavailableError,
  RateLimitError,
  normalizeRecipients
} from "@email-sdk/core"

export interface SESConfig {
  region: string
  accessKeyId: string
  secretAccessKey: string
  fromEmail: string
  behavior?: "success" | "rate_limit" | "unavailable" | "invalid_config" | "domain_not_verified"
}

function mapBehaviorToError(config: SESConfig): never {
  switch (config.behavior) {
    case "rate_limit":
      throw new RateLimitError("SES rate limit reached", "ses")
    case "unavailable":
      throw new ProviderUnavailableError("SES service unavailable", "ses")
    case "invalid_config":
      throw new InvalidConfigurationError("SES configuration is invalid", "ses")
    case "domain_not_verified":
      throw new DomainNotVerifiedError("SES domain is not verified", "ses")
    default:
      throw new ProviderUnavailableError("SES failed unexpectedly", "ses")
  }
}

function validateConfig(config: SESConfig): void {
  if (!config.region || !config.accessKeyId || !config.secretAccessKey || !config.fromEmail) {
    throw new InvalidConfigurationError("SES config requires region, credentials, and fromEmail", "ses")
  }
}

function createMessageId(): string {
  return `ses_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
}

function mapRequestToSesPayload(request: EmailRequest, fromEmail: string): {
  source: string
  destination: string[]
  subject: string
  bodyHtml: string | undefined
  bodyText: string | undefined
} {
  return {
    source: request.from ?? fromEmail,
    destination: normalizeRecipients(request.to),
    subject: request.subject,
    bodyHtml: request.html,
    bodyText: request.text
  }
}

export function SESProvider(config: SESConfig): EmailProviderPlugin {
  validateConfig(config)

  return {
    name: "ses",
    async send(request: EmailRequest): Promise<EmailResponse> {
      if (config.behavior && config.behavior !== "success") {
        mapBehaviorToError(config)
      }

      const payload = mapRequestToSesPayload(request, config.fromEmail)
      const rejected = payload.destination.filter((recipient) => !recipient.includes("@"))
      const accepted = payload.destination.filter((recipient) => recipient.includes("@"))

      if (accepted.length === 0) {
        throw new ProviderUnavailableError("SES rejected all recipients", "ses")
      }

      return {
        provider: "ses",
        messageId: createMessageId(),
        accepted,
        rejected
      }
    }
  }
}
