import type { EmailRequest, EmailResponse } from "@email-sdk/core";
export interface RuntimeLike {
    send(request: EmailRequest): Promise<EmailResponse>;
}
export interface SendEmailInput {
    to: string;
    subject: string;
    body: string;
}
export interface SendEmailTool {
    name: "send_email";
    description: string;
    input_schema: {
        type: "object";
        properties: {
            to: {
                type: "string";
            };
            subject: {
                type: "string";
            };
            body: {
                type: "string";
            };
        };
        required: ["to", "subject", "body"];
        additionalProperties: false;
    };
    execute(input: SendEmailInput): Promise<EmailResponse>;
}
export declare function createSendEmailTool(runtime: RuntimeLike): SendEmailTool;
//# sourceMappingURL=index.d.ts.map