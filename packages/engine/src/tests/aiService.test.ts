
import { test, describe } from 'node:test';
import * as assert from 'node:assert/strict';
import { AiProviderService } from '../services/ai/aiService.js';

describe('AI Provider Service', () => {
    test('uses the explicitly requested provider', () => {
        const ai = new AiProviderService({
            DEFAULT_AI_PROVIDER: 'mock',
            GEMINI_API_KEY: 'test-gemini-key',
            OPENAI_API_KEY: 'test-openai-key',
        });

        assert.strictEqual(ai.getActiveProvider('openai'), 'openai');
        assert.strictEqual(ai.getActiveProvider('gemini'), 'gemini');
    });

    test('uses mock when auto selection has no configured API keys', () => {
        const ai = new AiProviderService({
            DEFAULT_AI_PROVIDER: 'mock',
        });

        assert.strictEqual(ai.getActiveProvider('auto'), 'mock');
    });

    test('generates text using the mock provider', async () => {
        const ai = new AiProviderService({
            DEFAULT_AI_PROVIDER: 'mock',
        });

        const result = await ai.generate({
            prompt: 'Generate a short introduction',
            provider: 'mock',
        });

        assert.strictEqual(result.providerUsed, 'mock');
        assert.ok(typeof result.text === 'string');
        assert.ok(result.text.length > 0);
    });

    test('uses DEFAULT_AI_PROVIDER when no provider is explicitly requested', () => {
        const ai = new AiProviderService({
            DEFAULT_AI_PROVIDER: 'openai',
            GEMINI_API_KEY: 'test-gemini-key',
            OPENAI_API_KEY: 'test-openai-key',
        });

        assert.strictEqual(ai.getActiveProvider(), 'openai');
    });

    test('uses OLLAMA_MODEL from environment configuration', async () => {
        const originalFetch = globalThis.fetch;
        let requestBody: any;

        globalThis.fetch = async (_input, init) => {
            requestBody = JSON.parse(String(init?.body));

            return new Response(
                JSON.stringify({ response: 'Hello from Ollama' }),
                {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' },
                }
            );
        };

        try {
            const ai = new AiProviderService({
                DEFAULT_AI_PROVIDER: 'ollama',
                OLLAMA_MODEL: 'test-model',
            });

            await ai.generate({
                prompt: 'Say hello',
            });

            assert.strictEqual(requestBody.model, 'test-model');
        } finally {
            globalThis.fetch = originalFetch;
        }
    });
    test('defaults to gemini when no provider is configured', () => {
        const ai = new AiProviderService({});

        assert.strictEqual(ai.getActiveProvider(), 'gemini');
    });



});
