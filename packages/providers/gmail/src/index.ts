import { JWT } from "google-auth-library"
import { google } from "googleapis"
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

export interface GmailConfig {
  clientEmail: string
  privateKey: string
  fromEmail: string
}

function validateConfig(config: GmailConfig): void {
  if (!config.clientEmail || !config.privateKey || !config.fromEmail) {
    throw new InvalidConfigurationError(
      "Gmail config requires clientEmail, privateKey, and fromEmail",
      "gmail"
    )
  }
}

function createMimeMessage(
  to: string[],
  subject: string,
  htmlContent: string,
  from: string
): string {
  const messageParts = [
    `From: ${from}`,
    `To: ${to.join(",")}`,
    `Subject: ${subject}`,
    "MIME-Version: 1.0",
    "Content-Type: multipart/alternative; boundary=\"email_sdk_boundary\"",
    "",
    "--email_sdk_boundary",
    "Content-Type: text/plain; charset=UTF-8",
    "Content-Transfer-Encoding: 7bit",
    "",
    subject,
    "",
    "--email_sdk_boundary",
    "Content-Type: text/html; charset=UTF-8",
    "Content-Transfer-Encoding: 7bit",
    "",
    htmlContent,
    "",
    "--email_sdk_boundary--"
  ]

  const message = messageParts.join("\n")
  return Buffer.from(message)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "")
}

function mapGmailError(error: unknown): Error {
  if (!(error instanceof Error)) {
    return new ProviderUnavailableError("Unknown Gmail error", "gmail")
  }

  const message = error.message.toLowerCase()
  if (message.includes("quota") || message.includes("rate")) {
    return new RateLimitError(error.message, "gmail", error)
  }
  if (message.includes("domain") && message.includes("verify")) {
    return new DomainNotVerifiedError(error.message, "gmail", error)
  }
  if (message.includes("invalid") || message.includes("unauthorized") || message.includes("permission")) {
    return new InvalidConfigurationError(error.message, "gmail", error)
  }

  return new ProviderUnavailableError(error.message, "gmail", error)
}

export function GmailProvider(config: GmailConfig): EmailProviderPlugin {
  validateConfig(config)

  return {
    name: "gmail",
    async send(request: EmailRequest): Promise<EmailResponse> {
      try {
        const to = normalizeRecipients(request.to)
        const accepted = to.filter((recipient) => recipient.includes("@"))
        const rejected = to.filter((recipient) => !recipient.includes("@"))

        if (accepted.length === 0) {
          throw new ProviderUnavailableError("Gmail rejected all recipients", "gmail")
        }

        const jwtClient = new JWT({
          email: config.clientEmail,
          key: config.privateKey.split(String.raw`\n`).join("\n"),
          scopes: [
            "https://www.googleapis.com/auth/gmail.send",
            "https://www.googleapis.com/auth/gmail.readonly"
          ],
          subject: config.fromEmail
        })

        await jwtClient.authorize()
        const gmail = google.gmail({ version: "v1", auth: jwtClient })
        const raw = createMimeMessage(
          accepted,
          request.subject,
          request.html ?? request.text ?? request.subject,
          request.from ?? config.fromEmail
        )

        const response = await gmail.users.messages.send({
          userId: "me",
          requestBody: { raw }
        })

        const messageId = response.data.id
        if (!messageId) {
          throw new ProviderUnavailableError("Gmail did not return a message id", "gmail")
        }

        return {
          provider: "gmail",
          messageId,
          accepted,
          rejected
        }
      } catch (error) {
        throw mapGmailError(error)
      }
    }
  }
}
