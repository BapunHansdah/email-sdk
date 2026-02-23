import type { EmailRequest, EmailResponse } from "@email-sdk/core"

export interface RuntimeLike {
  send(request: EmailRequest): Promise<EmailResponse>
}

export interface SendEmailInput {
  to: string
  subject: string
  body: string
}

export interface SendEmailTool {
  name: "send_email"
  description: string
  input_schema: {
    type: "object"
    properties: {
      to: { type: "string" }
      subject: { type: "string" }
      body: { type: "string" }
    }
    required: ["to", "subject", "body"]
    additionalProperties: false
  }
  execute(input: SendEmailInput): Promise<EmailResponse>
}

export function createSendEmailTool(runtime: RuntimeLike): SendEmailTool {
  return {
    name: "send_email",
    description: "Send transactional email",
    input_schema: {
      type: "object",
      properties: {
        to: { type: "string" },
        subject: { type: "string" },
        body: { type: "string" }
      },
      required: ["to", "subject", "body"],
      additionalProperties: false
    },
    async execute(input: SendEmailInput): Promise<EmailResponse> {
      return runtime.send({
        to: input.to,
        subject: input.subject,
        html: input.body,
        provider: "auto"
      })
    }
  }
}
