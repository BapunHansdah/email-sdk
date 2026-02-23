export function createSendEmailTool(runtime) {
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
        async execute(input) {
            return runtime.send({
                to: input.to,
                subject: input.subject,
                html: input.body,
                provider: "auto"
            });
        }
    };
}
//# sourceMappingURL=index.js.map