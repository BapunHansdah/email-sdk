import { type EmailProviderPlugin, type EmailRequest, type EmailResponse, type FallbackStrategy, type Logger, type RetryPolicy } from "@email-sdk/core";
export interface EmailRuntime {
    registerProvider(provider: EmailProviderPlugin): void;
    listProviders(): string[];
    send(request: EmailRequest): Promise<EmailResponse>;
}
export interface RuntimeOptions {
    fallbackStrategy: FallbackStrategy;
    retryPolicy?: RetryPolicy;
    logger?: Logger;
}
export declare class SequentialFallback implements FallbackStrategy {
    execute(providers: EmailProviderPlugin[], request: EmailRequest): Promise<EmailResponse>;
}
export declare function createEmailRuntime(options: RuntimeOptions): EmailRuntime;
//# sourceMappingURL=index.d.ts.map