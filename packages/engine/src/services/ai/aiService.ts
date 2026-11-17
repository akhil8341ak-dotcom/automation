export interface GenerateTextOptions {
  prompt: string;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  jsonOutput?: boolean;
  provider?: 'gemini' | 'openai' | 'anthropic' | 'ollama' | 'mock' | 'auto';
  model?: string;
}

export interface GenerateTextResult {
  text: string;
  json?: any;
  providerUsed: string;
  modelUsed: string;
  tokensUsed?: { prompt: number; completion: number; total: number };
  estimatedCostUsd: number;
}

export class AiProviderService {
  private geminiKey?: string;
  private openaiKey?: string;
  private anthropicKey?: string;
  private ollamaHost?: string;
  private defaultProvider: string;

  constructor(env: Record<string, string | undefined> = process.env) {
    this.geminiKey = env.GEMINI_API_KEY;
    this.openaiKey = env.OPENAI_API_KEY;
    this.anthropicKey = env.ANTHROPIC_API_KEY;
    this.ollamaHost = env.OLLAMA_HOST || 'http://localhost:11434';
    this.defaultProvider = env.DEFAULT_AI_PROVIDER || 'gemini';
  }

  public getActiveProvider(requested?: string): string {
    if (requested && requested !== 'auto') {
      return requested;
    }
    if (this.geminiKey && this.geminiKey !== 'your_gemini_api_key_here') return 'gemini';
    if (this.openaiKey && this.openaiKey !== 'your_openai_api_key_here') return 'openai';
    if (this.anthropicKey && this.anthropicKey !== 'your_anthropic_api_key_here') return 'anthropic';
    return 'mock'; // Default to reliable high-quality offline generator
  }

  public async generate(options: GenerateTextOptions): Promise<GenerateTextResult> {
    const provider = this.getActiveProvider(options.provider);

    try {
      if (provider === 'gemini') {
        return await this.callGemini(options);
      } else if (provider === 'openai') {
        return await this.callOpenAI(options);
      } else if (provider === 'anthropic') {
        return await this.callAnthropic(options);
      } else if (provider === 'ollama') {
        return await this.callOllama(options);
      } else {
        return await this.callMock(options);
      }
    } catch (err: any) {
      // Fallback gracefully to mock if live API has quota exhaustion or network failure
      console.warn(`[AI Provider ${provider} Error]: ${err.message}. Gracefully falling back to structured generator.`);
      return await this.callMock(options, `Fallback from ${provider} error: ${err.message}`);
    }
  }

  private async callGemini(options: GenerateTextOptions): Promise<GenerateTextResult> {
    const apiKey = this.geminiKey;
    if (!apiKey || apiKey === 'your_gemini_api_key_here') {
      throw new Error('GEMINI_API_KEY not configured.');
    }

    const model = options.model || 'gemini-1.5-flash';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const promptText = options.systemPrompt 
      ? `${options.systemPrompt}\n\nTask:\n${options.prompt}`
      : options.prompt;

    const requestBody: any = {
      contents: [{ parts: [{ text: promptText }] }],
      generationConfig: {
        temperature: options.temperature ?? 0.7,
        maxOutputTokens: options.maxTokens ?? 2048,
      },
    };

    if (options.jsonOutput) {
      requestBody.generationConfig.responseMimeType = 'application/json';
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Gemini API error (${response.status}): ${errText}`);
    }

    const data: any = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    let parsedJson: any = undefined;
    if (options.jsonOutput) {
      try {
        parsedJson = JSON.parse(text);
      } catch {
        parsedJson = this.extractJsonFromText(text);
      }
    }

    const promptTokens = data.usageMetadata?.promptTokenCount || 200;
    const completionTokens = data.usageMetadata?.candidatesTokenCount || 400;

    return {
      text,
      json: parsedJson,
      providerUsed: 'gemini',
      modelUsed: model,
      tokensUsed: {
        prompt: promptTokens,
        completion: completionTokens,
        total: promptTokens + completionTokens,
      },
      estimatedCostUsd: 0.00002, // Gemini 1.5 flash has generous free tier
    };
  }

  private async callOpenAI(options: GenerateTextOptions): Promise<GenerateTextResult> {
    const apiKey = this.openaiKey;
    if (!apiKey || apiKey === 'your_openai_api_key_here') {
      throw new Error('OPENAI_API_KEY not configured.');
    }

    const model = options.model || 'gpt-4o-mini';
    const messages: any[] = [];
    if (options.systemPrompt) {
      messages.push({ role: 'system', content: options.systemPrompt });
    }
    messages.push({ role: 'user', content: options.prompt });

    const reqBody: any = {
      model,
      messages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 2048,
    };

    if (options.jsonOutput) {
      reqBody.response_format = { type: 'json_object' };
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(reqBody),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`OpenAI API error (${response.status}): ${err}`);
    }

    const data: any = await response.json();
    const text = data.choices?.[0]?.message?.content || '';
    let parsedJson: any = undefined;
    if (options.jsonOutput) {
      try {
        parsedJson = JSON.parse(text);
      } catch {
        parsedJson = this.extractJsonFromText(text);
      }
    }

    return {
      text,
      json: parsedJson,
      providerUsed: 'openai',
      modelUsed: model,
      tokensUsed: {
        prompt: data.usage?.prompt_tokens || 100,
        completion: data.usage?.completion_tokens || 200,
        total: data.usage?.total_tokens || 300,
      },
      estimatedCostUsd: 0.0003,
    };
  }

  private async callAnthropic(options: GenerateTextOptions): Promise<GenerateTextResult> {
    const apiKey = this.anthropicKey;
    if (!apiKey || apiKey === 'your_anthropic_api_key_here') {
      throw new Error('ANTHROPIC_API_KEY not configured.');
    }

    const model = options.model || 'claude-3-5-haiku-20241022';
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        system: options.systemPrompt || '',
        messages: [{ role: 'user', content: options.prompt }],
        max_tokens: options.maxTokens ?? 2048,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Anthropic API error (${response.status}): ${err}`);
    }

    const data: any = await response.json();
    const text = data.content?.[0]?.text || '';
    let parsedJson: any = undefined;
    if (options.jsonOutput) {
      parsedJson = this.extractJsonFromText(text);
    }

    return {
      text,
      json: parsedJson,
      providerUsed: 'anthropic',
      modelUsed: model,
      estimatedCostUsd: 0.0005,
    };
  }

  private async callOllama(options: GenerateTextOptions): Promise<GenerateTextResult> {
    const host = this.ollamaHost;
    const model = options.model || 'llama3:8b';

    const response = await fetch(`${host}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        prompt: options.prompt,
        system: options.systemPrompt,
        stream: false,
        format: options.jsonOutput ? 'json' : undefined,
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama connection error: ${response.statusText}`);
    }

    const data: any = await response.json();
    const text = data.response || '';
    let parsedJson: any = undefined;
    if (options.jsonOutput) {
      try {
        parsedJson = JSON.parse(text);
      } catch {
        parsedJson = this.extractJsonFromText(text);
      }
    }

    return {
      text,
      json: parsedJson,
      providerUsed: 'ollama',
      modelUsed: model,
      estimatedCostUsd: 0.0,
    };
  }

  /**
   * Deterministic, zero-cost, context-aware Mock AI Provider.
   * Enables 100% offline development, test suites, and ₹0 operation without hitting quotas.
   */
  private async callMock(options: GenerateTextOptions, note?: string): Promise<GenerateTextResult> {
    // Generate contextually intelligent output based on keywords in prompt
    const prompt = options.prompt.toLowerCase();
    let text = '';
    let json: any = null;

    if (prompt.includes('topic') || prompt.includes('research')) {
      json = {
        topics: [
          {
            id: 'mock-top-1',
            title: 'Why Developers Are Switching to Local AI Models in 2026',
            premise: 'How offline open-weight models have reached parity with cloud APIs, transforming developer privacy and API budgets.',
            targetAudience: 'Software engineers & tech founders',
            noveltyScore: 88,
            audienceInterestScore: 92,
            productionFeasibility: 95,
            viralAngle: 'Cut your monthly cloud API bill to $0 with open models',
            factualRiskScore: 12,
            searchIntentKeywords: ['local llm 2026', 'ollama tutorial', 'self hosted ai'],
            format: 'shorts',
            estimatedDurationSec: 52,
            sourcesFound: [
              { title: 'Local AI Benchmark Report 2026', url: 'https://huggingface.co/blog' },
              { title: 'Privacy in Enterprise AI', url: 'https://arxiv.org' },
            ],
          },
          {
            id: 'mock-top-2',
            title: 'The Hidden Architecture of Autonomous Coding Agents',
            premise: 'A step-by-step look into how modern agentic systems inspect runtimes, fix terminal errors, and orchestrate DAGs.',
            targetAudience: 'Senior full-stack developers',
            noveltyScore: 85,
            audienceInterestScore: 89,
            productionFeasibility: 90,
            viralAngle: 'The real reason AI assistants write better code than you expect',
            factualRiskScore: 15,
            searchIntentKeywords: ['ai agent architecture', 'dag workflow engine'],
            format: 'shorts',
            estimatedDurationSec: 48,
            sourcesFound: [
              { title: 'Autonomous Workflow Engines Spec', url: 'https://n8n.io' },
            ],
          },
        ],
      };
      text = JSON.stringify(json, null, 2);
    } else if (prompt.includes('script')) {
      json = {
        title: 'Why Local AI Models Are Winning in 2026',
        format: 'shorts',
        hookOptions: [
          'Most developers are still wasting hundreds of dollars a month on cloud API tokens.',
          'What if your laptop could run an AI model faster than cloud endpoints?',
          'Here is the secret architecture that made local AI models take over in 2026.',
        ],
        chosenHookIndex: 0,
        sections: [
          {
            id: 'sec-1',
            index: 0,
            sectionTitle: 'The Hook',
            narrativePurpose: 'hook',
            narrationText: 'Most developers are still wasting hundreds of dollars every month on cloud API tokens. But that changed completely this year.',
            estimatedSec: 8,
            visualDirection: 'Zooming dynamic chart of escalating cloud API bills dropping to zero.',
          },
          {
            id: 'sec-2',
            index: 1,
            sectionTitle: 'The Revelation',
            narrativePurpose: 'explanation',
            narrationText: 'New 8-bit quantized models now execute locally on standard laptops at over 80 tokens per second, with zero latency and zero privacy leaks.',
            estimatedSec: 14,
            visualDirection: 'B-roll of high-speed terminal output and local GPU resource graph.',
          },
          {
            id: 'sec-3',
            index: 2,
            sectionTitle: 'The Workflow',
            narrativePurpose: 'explanation',
            narrationText: 'By connecting these local models into visual DAG workflows, you can automate video production, data pipelines, and code reviews entirely offline.',
            estimatedSec: 16,
            visualDirection: 'Visual workflow canvas with connecting nodes glowing green.',
          },
          {
            id: 'sec-4',
            index: 3,
            sectionTitle: 'Call to Action',
            narrativePurpose: 'cta',
            narrationText: 'Want the full workflow template? Hit subscribe and grab the open-source blueprint in the description.',
            estimatedSec: 10,
            visualDirection: 'Clean animated subscription button and code repository card.',
          },
        ],
        totalWordCount: 118,
        estimatedDurationSec: 48,
        targetWpm: 150,
        factCheckAudit: {
          claims: [
            {
              id: 'claim-1',
              claim: 'Quantized models run at over 80 tokens/sec on consumer silicon.',
              sourceOrRationale: 'Verified on modern Apple Silicon and RTX hardware benchmarks.',
              confidence: 'high',
              riskCategory: 'none',
              status: 'verified',
            },
          ],
          overallTrustScore: 94,
          advertiserSafe: true,
          reusedContentRisk: 'low',
          aiDisclosureRequired: true,
          warnings: [],
        },
      };
      text = JSON.stringify(json, null, 2);
    } else if (prompt.includes('fact') || prompt.includes('audit')) {
      json = {
        trustScore: 95,
        advertiserSafe: true,
        reusedContentRisk: 'low',
        aiDisclosureRequired: true,
        claims: [
          {
            id: 'c1',
            claim: 'Cloud API spending has risen for AI native development teams.',
            sourceOrRationale: 'Public developer surveys and cloud billing benchmarks.',
            confidence: 'high',
            status: 'verified',
          },
        ],
        warnings: [],
      };
      text = JSON.stringify(json, null, 2);
    } else if (prompt.includes('storyboard') || prompt.includes('scene')) {
      json = {
        scenes: [
          {
            id: 'sc-1',
            sceneIndex: 0,
            narrationSnippet: 'Most developers are still wasting hundreds of dollars on cloud API tokens.',
            estimatedDurationSec: 8,
            visualObjective: 'Show monetary cost and cloud infrastructure',
            assetSearchQuery: 'cloud computing servers code money',
            transition: 'zoom',
            confidenceScore: 92,
            onScreenText: 'Cloud API Bills: $0',
          },
          {
            id: 'sc-2',
            sceneIndex: 1,
            narrationSnippet: 'New quantized models now execute locally on standard laptops at high speed.',
            estimatedDurationSec: 14,
            visualObjective: 'High tech developer typing code on laptop',
            assetSearchQuery: 'software developer coding dark room laptop',
            transition: 'fade',
            confidenceScore: 95,
            onScreenText: '80+ Tokens/Sec Offline',
          },
          {
            id: 'sc-3',
            sceneIndex: 2,
            narrationSnippet: 'Connect local models into visual DAG workflows to automate production.',
            estimatedDurationSec: 16,
            visualObjective: 'Network nodes connecting and data flowing',
            assetSearchQuery: 'digital network abstract connections tech',
            transition: 'zoom',
            confidenceScore: 90,
            onScreenText: 'Visual DAG Workflows',
          },
          {
            id: 'sc-4',
            sceneIndex: 3,
            narrationSnippet: 'Hit subscribe and grab the open-source blueprint in the description.',
            estimatedDurationSec: 10,
            visualObjective: 'Clean modern branding end screen',
            assetSearchQuery: 'technology modern minimalist',
            transition: 'fade',
            confidenceScore: 94,
            onScreenText: 'Subscribe for Blueprints',
          },
        ],
      };
      text = JSON.stringify(json, null, 2);
    } else if (prompt.includes('fact-check') || prompt.includes('audit') || prompt.includes('policy') || prompt.includes('factual')) {
      json = {
        overallTrustScore: 94,
        advertiserSafe: true,
        reusedContentRisk: 'low',
        aiDisclosureRequired: true,
        claims: [
          {
            id: 'claim-1',
            claim: 'Quantized models execute locally at high tokens per second on consumer silicon.',
            sourceOrRationale: 'Verified against local hardware benchmarks.',
            confidence: 'high',
            riskCategory: 'none',
            status: 'verified',
          },
        ],
        warnings: [],
      };
      text = JSON.stringify(json, null, 2);
    } else if (prompt.includes('metadata') || prompt.includes('title')) {
      json = {
        titleCandidates: [
          'Why Developers Are Quitting Cloud APIs in 2026',
          'How to Run AI Workflows with $0 API Bills',
          'The Rise of Local AI: 80 Tokens/Sec on Your Laptop',
        ],
        selectedTitle: 'Why Developers Are Quitting Cloud APIs in 2026',
        description: 'Discover how modern local quantized models and visual workflow automation are transforming developer productivity without recurring API bills.\n\n0:00 The Hook\n0:08 The Revelation\n0:22 Visual DAG Workflows\n0:38 Conclusion & Setup Guide\n\n#AI #DevOps #SoftwareEngineering #Automation',
        tags: ['AI', 'Local AI', 'Workflow Automation', 'Developer Tools', 'Open Source', 'Software Architecture'],
        categoryId: '28',
        containsSyntheticMedia: true,
        privacyStatus: 'private',
      };
      text = JSON.stringify(json, null, 2);
    } else {
      text = `[CreatorFlow AI Response]: Processed prompt successfully.\nContext: ${options.prompt.slice(0, 100)}...`;
      if (options.jsonOutput) {
        json = { success: true, result: text, note };
      }
    }

    return {
      text,
      json: options.jsonOutput ? json : undefined,
      providerUsed: 'mock',
      modelUsed: 'creatorflow-offline-v1',
      tokensUsed: { prompt: 120, completion: 240, total: 360 },
      estimatedCostUsd: 0.0,
    };
  }

  private extractJsonFromText(text: string): any {
    try {
      const match = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (match && match[1]) {
        return JSON.parse(match[1]);
      }
      return JSON.parse(text);
    } catch {
      return null;
    }
  }
}
