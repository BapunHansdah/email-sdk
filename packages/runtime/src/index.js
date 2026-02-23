import { AggregateSendError, InvalidConfigurationError, ProviderUnavailableError, RateLimitError, selectProviders, toEmailError } from "@email-sdk/core";
class NoRetryPolicy {
    shouldRetry() {
        return false;
    }
    getDelayMs() {
        return 0;
    }
}
class NoopLogger {
    debug() { }
    info() { }
    warn() { }
    error() { }
}
export class SequentialFallback {
    async execute(providers, request) {
        const errors = [];
        for (const provider of providers) {
            try {
                return await provider.send(request);
            }
            catch (error) {
                const normalized = toEmailError(error, provider.name);
                if (normalized instanceof InvalidConfigurationError) {
                    throw normalized;
                }
                if (normalized instanceof RateLimitError ||
                    normalized instanceof ProviderUnavailableError) {
                    errors.push(normalized);
                    continue;
                }
                throw normalized;
            }
        }
        throw new AggregateSendError("All providers failed during sequential fallback", errors);
    }
}
export function createEmailRuntime(options) {
    const providers = new Map();
    const retryPolicy = options.retryPolicy ?? new NoRetryPolicy();
    const logger = options.logger ?? new NoopLogger();
    function registerProvider(provider) {
        providers.set(provider.name, provider);
        logger.info("Registered provider", { provider: provider.name });
    }
    async function sendWithRetry(provider, request) {
        let attempt = 1;
        while (true) {
            try {
                return await provider.send(request);
            }
            catch (error) {
                const normalized = toEmailError(error, provider.name);
                const shouldRetry = retryPolicy.shouldRetry(normalized, attempt);
                if (!shouldRetry) {
                    throw normalized;
                }
                const delayMs = retryPolicy.getDelayMs(attempt);
                logger.warn("Retrying provider send", {
                    provider: provider.name,
                    attempt,
                    delayMs,
                    code: normalized.code
                });
                if (delayMs > 0) {
                    await new Promise((resolve) => {
                        setTimeout(() => resolve(), delayMs);
                    });
                }
                attempt += 1;
            }
        }
    }
    function wrapProvider(provider) {
        return {
            name: provider.name,
            async send(request) {
                return sendWithRetry(provider, request);
            }
        };
    }
    async function send(request) {
        const registeredProviders = Array.from(providers.values());
        const selectedProviders = selectProviders(registeredProviders, request.provider);
        if (selectedProviders.length === 0) {
            throw new ProviderUnavailableError(`No provider available for selection: ${request.provider ?? "auto"}`);
        }
        const wrappedProviders = selectedProviders.map((provider) => wrapProvider(provider));
        if (request.provider !== undefined && request.provider !== "auto") {
            const selected = wrappedProviders[0];
            if (selected === undefined) {
                throw new ProviderUnavailableError("Selected provider unavailable");
            }
            return selected.send(request);
        }
        return options.fallbackStrategy.execute(wrappedProviders, request);
    }
    return {
        registerProvider,
        listProviders() {
            return Array.from(providers.keys());
        },
        send
    };
}
//# sourceMappingURL=index.js.map