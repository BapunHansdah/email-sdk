import { createSendEmailTool } from "@email-sdk/mcp";
import { SendGridProvider } from "@email-sdk/provider-sendgrid";
import { createEmailRuntime, SequentialFallback } from "@email-sdk/runtime";
async function main() {
    const runtime = createEmailRuntime({
        fallbackStrategy: new SequentialFallback()
    });
    runtime.registerProvider(SendGridProvider({
        apiKey: "sg-key",
        fromEmail: "noreply@example.com"
    }));
    const tool = createSendEmailTool(runtime);
    const response = await tool.execute({
        to: "agent-user@example.com",
        subject: "Agent-triggered email",
        body: "<p>This was sent through MCP-compatible tool wiring.</p>"
    });
    console.log(tool.name);
    console.log(tool.input_schema);
    console.log(response);
}
void main();
//# sourceMappingURL=mcp.js.map