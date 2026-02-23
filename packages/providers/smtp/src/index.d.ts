import { type EmailProviderPlugin } from "@email-sdk/core";
export interface SMTPConfig {
    host: string;
    port: number;
    secure: boolean;
    username: string;
    password: string;
    fromEmail: string;
    behavior?: "success" | "rate_limit" | "unavailable" | "invalid_config";
}
export declare function SMTPProvider(config: SMTPConfig): EmailProviderPlugin;
//# sourceMappingURL=index.d.ts.map