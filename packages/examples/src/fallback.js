import { SendGridProvider } from "@email-sdk/provider-sendgrid";
import { SESProvider } from "@email-sdk/provider-ses";
import { SMTPProvider } from "@email-sdk/provider-smtp";
import { createEmailRuntime, SequentialFallback } from "@email-sdk/runtime";
async function main() {
    const runtime = createEmailRuntime({
        fallbackStrategy: new SequentialFallback()
    });
    runtime.registerProvider(SESProvider({
        region: "us-east-1",
        accessKeyId: "access",
        secretAccessKey: "secret",
        fromEmail: "noreply@example.com",
        behavior: "rate_limit"
    }));
    runtime.registerProvider(SendGridProvider({
        apiKey: "sg-key",
        fromEmail: "noreply@example.com",
        behavior: "unavailable"
    }));
    runtime.registerProvider(SMTPProvider({
        host: "smtp.example.com",
        port: 587,
        secure: false,
        username: "smtp-user",
        password: "smtp-pass",
        fromEmail: "noreply@example.com",
        behavior: "success"
    }));
    const response = await runtime.send({
        to: "user@example.com",
        subject: "Fallback test",
        html: "<p>Fell through providers until success</p>",
        provider: "auto"
    });
    console.log(response);
}
void main();
//# sourceMappingURL=fallback.js.map