import { SendMailClient } from "zeptomail"
import {
  type EmailProviderPlugin,
  type EmailRequest,
  type EmailResponse,
  InvalidConfigurationError,
  ProviderUnavailableError,
  RateLimitError,
  normalizeRecipients
} from "@email-sdk/core"

export interface ZeptoMailConfig {
  url: string
  apiKey: string
  fromEmail: string
  fromName?: string
}

interface ZeptoResponse {
  data?: Array<{ message_id?: string }>
}

function validateConfig(config: ZeptoMailConfig): void {
  if (!config.url || !config.apiKey || !config.fromEmail) {
    throw new InvalidConfigurationError(
      "ZeptoMail config requires url, apiKey, and fromEmail",
      "zeptomail"
    )
  }
}

function mapZeptoError(error: unknown): Error {
  if (!(error instanceof Error)) {
    return new ProviderUnavailableError("Unknown ZeptoMail error", "zeptomail")
  }

  const message = error.message.toLowerCase()
  if (message.includes("rate") || message.includes("quota") || message.includes("429")) {
    return new RateLimitError(error.message, "zeptomail", error)
  }
  if (message.includes("invalid") || message.includes("auth") || message.includes("token")) {
    return new InvalidConfigurationError(error.message, "zeptomail", error)
  }

  return new ProviderUnavailableError(error.message, "zeptomail", error)
}

function readMessageId(value: unknown): string | undefined {
  if (typeof value !== "object" || value === null) {
    return undefined
  }
  const response = value as ZeptoResponse
  return response.data?.[0]?.message_id
}

export function ZeptoMailProvider(config: ZeptoMailConfig): EmailProviderPlugin {
  validateConfig(config)

  return {
    name: "zeptomail",
    async send(request: EmailRequest): Promise<EmailResponse> {
      try {
        const recipients = normalizeRecipients(request.to)
        const accepted = recipients.filter((recipient) => recipient.includes("@"))
        const rejected = recipients.filter((recipient) => !recipient.includes("@"))

        if (accepted.length === 0) {
          throw new ProviderUnavailableError("ZeptoMail rejected all recipients", "zeptomail")
        }

        const client = new SendMailClient({
          url: config.url,
          token: config.apiKey
        })

        const response = await client.sendMail({
          from: {
            address: request.from ?? config.fromEmail,
            name: config.fromName ?? ""
          },
          to: accepted.map((address) => ({
            email_address: {
              address,
              name: ""
            }
          })),
          subject: request.subject,
          htmlbody: request.html ?? request.text ?? request.subject
        })

        const messageId = readMessageId(response)
        if (!messageId) {
          throw new ProviderUnavailableError("ZeptoMail did not return a message id", "zeptomail")
        }

        return {
          provider: "zeptomail",
          messageId,
          accepted,
          rejected
        }
      } catch (error) {
        throw mapZeptoError(error)
      }
    }
  }
}
