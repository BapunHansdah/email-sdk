import { type EmailProviderPlugin } from "@email-sdk/core";
export interface SendGridConfig {
    apiKey: string;
    fromEmail: string;
    behavior?: "success" | "rate_limit" | "unavailable" | "invalid_config";
}
export declare function SendGridProvider(config: SendGridConfig): EmailProviderPlugin;
//# sourceMappingURL=index.d.ts.map