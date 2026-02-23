import {
  type EmailProviderPlugin,
  type EmailRequest,
  type EmailResponse,
  InvalidConfigurationError,
  ProviderUnavailableError,
  RateLimitError,
  normalizeRecipients
} from "@email-sdk/core"

export interface SMTPConfig {
  host: string
  port: number
  secure: boolean
  username: string
  password: string
  fromEmail: string
  behavior?: "success" | "rate_limit" | "unavailable" | "invalid_config"
}

function validateConfig(config: SMTPConfig): void {
  if (!config.host || config.port <= 0 || !config.username || !config.password || !config.fromEmail) {
    throw new InvalidConfigurationError(
      "SMTP config requires host, port, credentials, and fromEmail",
      "smtp"
    )
  }
}

function mapBehavior(config: SMTPConfig): never {
  switch (config.behavior) {
    case "rate_limit":
      throw new RateLimitError("SMTP server rate limit reached", "smtp")
    case "unavailable":
      throw new ProviderUnavailableError("SMTP server unavailable", "smtp")
    case "invalid_config":
      throw new InvalidConfigurationError("SMTP configuration is invalid", "smtp")
    default:
      throw new ProviderUnavailableError("SMTP failed unexpectedly", "smtp")
  }
}

function createMessageId(): string {
  return `smtp_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
}

function mapRequestToSmtpPayload(request: EmailRequest, fromEmail: string): {
  hostMessageFrom: string
  recipients: string[]
  subject: string
  html: string | undefined
  text: string | undefined
} {
  return {
    hostMessageFrom: request.from ?? fromEmail,
    recipients: normalizeRecipients(request.to),
    subject: request.subject,
    html: request.html,
    text: request.text
  }
}

export function SMTPProvider(config: SMTPConfig): EmailProviderPlugin {
  validateConfig(config)

  return {
    name: "smtp",
    async send(request: EmailRequest): Promise<EmailResponse> {
      if (config.behavior && config.behavior !== "success") {
        mapBehavior(config)
      }

      const payload = mapRequestToSmtpPayload(request, config.fromEmail)
      const accepted = payload.recipients.filter((recipient) => recipient.includes("@"))
      const rejected = payload.recipients.filter((recipient) => !recipient.includes("@"))

      if (accepted.length === 0) {
        throw new ProviderUnavailableError("SMTP rejected all recipients", "smtp")
      }

      return {
        provider: "smtp",
        messageId: createMessageId(),
        accepted,
        rejected
      }
    }
  }
}
