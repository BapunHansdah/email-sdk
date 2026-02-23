import {
  type EmailProviderPlugin,
  type EmailRequest,
  type EmailResponse,
  InvalidConfigurationError,
  ProviderUnavailableError,
  RateLimitError,
  normalizeRecipients
} from "@email-sdk/core"

export interface SendGridConfig {
  apiKey: string
  fromEmail: string
  behavior?: "success" | "rate_limit" | "unavailable" | "invalid_config"
}

function validateConfig(config: SendGridConfig): void {
  if (!config.apiKey || !config.fromEmail) {
    throw new InvalidConfigurationError("SendGrid config requires apiKey and fromEmail", "sendgrid")
  }
}

function mapBehavior(config: SendGridConfig): never {
  switch (config.behavior) {
    case "rate_limit":
      throw new RateLimitError("SendGrid rate limit reached", "sendgrid")
    case "unavailable":
      throw new ProviderUnavailableError("SendGrid service unavailable", "sendgrid")
    case "invalid_config":
      throw new InvalidConfigurationError("SendGrid configuration is invalid", "sendgrid")
    default:
      throw new ProviderUnavailableError("SendGrid failed unexpectedly", "sendgrid")
  }
}

function createMessageId(): string {
  return `sendgrid_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
}

function mapRequestToSendGridPayload(request: EmailRequest, fromEmail: string): {
  from: string
  to: string[]
  subject: string
  contentHtml: string | undefined
  contentText: string | undefined
} {
  return {
    from: request.from ?? fromEmail,
    to: normalizeRecipients(request.to),
    subject: request.subject,
    contentHtml: request.html,
    contentText: request.text
  }
}

export function SendGridProvider(config: SendGridConfig): EmailProviderPlugin {
  validateConfig(config)

  return {
    name: "sendgrid",
    async send(request: EmailRequest): Promise<EmailResponse> {
      if (config.behavior && config.behavior !== "success") {
        mapBehavior(config)
      }

      const payload = mapRequestToSendGridPayload(request, config.fromEmail)
      const accepted = payload.to.filter((recipient) => recipient.includes("@"))
      const rejected = payload.to.filter((recipient) => !recipient.includes("@"))

      if (accepted.length === 0) {
        throw new ProviderUnavailableError("SendGrid rejected all recipients", "sendgrid")
      }

      return {
        provider: "sendgrid",
        messageId: createMessageId(),
        accepted,
        rejected
      }
    }
  }
}
