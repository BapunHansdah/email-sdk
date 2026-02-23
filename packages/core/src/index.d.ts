export interface EmailRequest {
    to: string | string[];
    subject: string;
    html?: string;
    text?: string;
    from?: string;
    cc?: string | string[];
    bcc?: string | string[];
    headers?: Record<string, string>;
    metadata?: Record<string, string>;
    provider?: string | "auto";
}
export interface EmailResponse {
    provider: string;
    messageId: string;
    accepted: string[];
    rejected: string[];
}
export interface EmailProviderPlugin {
    name: string;
    send(request: EmailRequest): Promise<EmailResponse>;
}
export interface RetryPolicy {
    shouldRetry(error: unknown, attempt: number): boolean;
    getDelayMs(attempt: number): number;
}
export interface FallbackStrategy {
    execute(providers: EmailProviderPlugin[], request: EmailRequest): Promise<EmailResponse>;
}
export interface Logger {
    debug(message: string, meta?: Record<string, unknown>): void;
    info(message: string, meta?: Record<string, unknown>): void;
    warn(message: string, meta?: Record<string, unknown>): void;
    error(message: string, meta?: Record<string, unknown>): void;
}
export declare class EmailError extends Error {
    readonly code: string;
    readonly provider?: string;
    constructor(message: string, code: string, provider?: string, cause?: unknown);
}
export declare class RateLimitError extends EmailError {
    constructor(message?: string, provider?: string, cause?: unknown);
}
export declare class ProviderUnavailableError extends EmailError {
    constructor(message?: string, provider?: string, cause?: unknown);
}
export declare class InvalidConfigurationError extends EmailError {
    constructor(message?: string, provider?: string, cause?: unknown);
}
export declare class DomainNotVerifiedError extends EmailError {
    constructor(message?: string, provider?: string, cause?: unknown);
}
export declare class AggregateSendError extends EmailError {
    readonly errors: ReadonlyArray<EmailError>;
    constructor(message: string, errors: ReadonlyArray<EmailError>);
}
export declare function toEmailError(error: unknown, provider?: string): EmailError;
export declare function normalizeRecipients(value: string | string[]): string[];
export declare function selectProviders(providers: EmailProviderPlugin[], providerName: string | "auto" | undefined): EmailProviderPlugin[];
//# sourceMappingURL=index.d.ts.map