import type { LLMProvider, LLMRequest, LLMResponse } from '../interfaces/llm';

export class OpenRouterLLM implements LLMProvider {
  name = 'openrouter';
  model: string;
  private apiKey: string;
  private reasoningEffort?: 'low' | 'medium' | 'high';

  constructor(model: string, apiKey?: string, reasoningEffort?: 'low' | 'medium' | 'high') {
    this.model = model;
    const envKey = process.env.OPENROUTER_API_KEY || '';
    this.apiKey = (apiKey || envKey).trim();
    if (!this.apiKey) throw new Error('OpenRouter: API key not set. Set OPENROUTER_API_KEY.');
    this.reasoningEffort = reasoningEffort;
  }

  async getResponse(request: LLMRequest): Promise<LLMResponse> {
    const prompt = request.prompt;
    const system = request.system?.trim();
    const url = 'https://openrouter.ai/api/v1/chat/completions';
    const messages: Array<{ role: 'system' | 'user'; content: string }> = [];
    if (system) messages.push({ role: 'system', content: system });
    messages.push({ role: 'user', content: prompt });

    const body: Record<string, unknown> = {
      model: this.model,
      messages,
      temperature: 0.2,
      max_tokens: 2000,
      usage: { include: true },
    };

    if (this.reasoningEffort) {
      body.include_reasoning = true;
      body.reasoning = { effort: this.reasoningEffort };
    }

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
        'HTTP-Referer': 'https://yumcut-cheap-image-generation',
        'X-Title': 'yumcut cheap image generation',
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`OpenRouter error ${res.status}: ${txt}`);
    }

    const data = await res.json() as any;
    const content = data?.choices?.[0]?.message?.content || '';

    let cost: number | string | undefined;
    const usageCost = data?.usage?.cost ?? data?.meta?.usage?.cost;
    if (typeof usageCost === 'number' || typeof usageCost === 'string') {
      cost = usageCost;
    } else {
      const id = data?.id || data?.choices?.[0]?.id;
      if (id) {
        try {
          const genRes = await fetch(`https://openrouter.ai/api/v1/generation?id=${encodeURIComponent(id)}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${this.apiKey}`,
              'HTTP-Referer': 'https://yumcut-cheap-image-generation',
              'X-Title': 'yumcut cheap image generation',
            },
          });
          if (genRes.ok) {
            const gen = await genRes.json() as any;
            const total = gen?.data?.total_cost ?? gen?.usage?.cost ?? gen?.cost;
            if (typeof total === 'number' || typeof total === 'string') cost = total;
          }
        } catch {}
      }
    }

    const response: LLMResponse = {
      text: String(content ?? '').trim(),
      cost,
      usage: data?.usage,
      id: data?.id,
    };

    if (!response.text) {
      const err = new Error('OpenRouter: empty response') as Error & Partial<LLMResponse>;
      err.cost = response.cost;
      err.usage = response.usage;
      err.id = response.id;
      throw err;
    }

    return response;
  }
}
