import { SESProvider } from "@email-sdk/provider-ses"
import { createEmailRuntime, SequentialFallback } from "@email-sdk/runtime"

async function main(): Promise<void> {
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

  const response = await runtime.send({
    to: "user@example.com",
    subject: "Welcome",
    html: "<h1>Hello</h1>",
    provider: "ses"
  })

  console.log(response)
}

void main()
