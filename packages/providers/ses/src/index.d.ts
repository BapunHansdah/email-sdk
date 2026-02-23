import { type EmailProviderPlugin } from "@email-sdk/core";
export interface SESConfig {
    region: string;
    accessKeyId: string;
    secretAccessKey: string;
    fromEmail: string;
    behavior?: "success" | "rate_limit" | "unavailable" | "invalid_config" | "domain_not_verified";
}
export declare function SESProvider(config: SESConfig): EmailProviderPlugin;
//# sourceMappingURL=index.d.ts.map