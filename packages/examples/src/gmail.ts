import { GmailProvider } from "@email-sdk/provider-gmail"
import { createEmailRuntime, SequentialFallback } from "@email-sdk/runtime"

async function main(): Promise<void> {
  const runtime = createEmailRuntime({
    fallbackStrategy: new SequentialFallback()
  })

  runtime.registerProvider(
    GmailProvider({
      clientEmail: "service-account@project.iam.gserviceaccount.com",
      privateKey: "-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----\\n",
      fromEmail: "noreply@example.com"
    })
  )

  const response = await runtime.send({
    to: "user@example.com",
    subject: "Hello from Gmail provider",
    html: "<p>Gmail provider is active</p>",
    provider: "gmail"
  })

  console.log(response)
}

void main()
