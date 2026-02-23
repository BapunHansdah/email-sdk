export class EmailError extends Error {
    code;
    provider;
    constructor(message, code, provider, cause) {
        super(message, cause !== undefined ? { cause } : undefined);
        this.name = "EmailError";
        this.code = code;
        this.provider = provider;
    }
}
export class RateLimitError extends EmailError {
    constructor(message = "Rate limit reached", provider, cause) {
        super(message, "RATE_LIMIT", provider, cause);
        this.name = "RateLimitError";
    }
}
export class ProviderUnavailableError extends EmailError {
    constructor(message = "Provider unavailable", provider, cause) {
        super(message, "PROVIDER_UNAVAILABLE", provider, cause);
        this.name = "ProviderUnavailableError";
    }
}
export class InvalidConfigurationError extends EmailError {
    constructor(message = "Invalid provider configuration", provider, cause) {
        super(message, "INVALID_CONFIGURATION", provider, cause);
        this.name = "InvalidConfigurationError";
    }
}
export class DomainNotVerifiedError extends EmailError {
    constructor(message = "Domain not verified", provider, cause) {
        super(message, "DOMAIN_NOT_VERIFIED", provider, cause);
        this.name = "DomainNotVerifiedError";
    }
}
export class AggregateSendError extends EmailError {
    errors;
    constructor(message, errors) {
        super(message, "ALL_PROVIDERS_FAILED");
        this.name = "AggregateSendError";
        this.errors = errors;
    }
}
export function toEmailError(error, provider) {
    if (error instanceof EmailError) {
        return error;
    }
    if (error instanceof Error) {
        return new ProviderUnavailableError(error.message, provider, error);
    }
    return new ProviderUnavailableError("Unknown provider error", provider);
}
export function normalizeRecipients(value) {
    return Array.isArray(value) ? value : [value];
}
export function selectProviders(providers, providerName) {
    if (providerName === undefined || providerName === "auto") {
        return providers;
    }
    return providers.filter((provider) => provider.name === providerName);
}
//# sourceMappingURL=index.js.map