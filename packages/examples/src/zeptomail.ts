import { ZeptoMailProvider } from "@email-sdk/provider-zeptomail"
import { createEmailRuntime, SequentialFallback } from "@email-sdk/runtime"

async function main(): Promise<void> {
  const runtime = createEmailRuntime({
    fallbackStrategy: new SequentialFallback()
  })

  runtime.registerProvider(
    ZeptoMailProvider({
      url: "api.zeptomail.com/",
      apiKey: "zepto-api-key",
      fromEmail: "noreply@example.com",
      fromName: "Email SDK"
    })
  )

  const response = await runtime.send({
    to: "user@example.com",
    subject: "Hello from ZeptoMail provider",
    html: "<p>ZeptoMail provider is active</p>",
    provider: "zeptomail"
  })

  console.log(response)
}

void main()
