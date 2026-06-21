export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

/**
 * Strip trailing slashes. User's baseUrl already includes /v1
 * (e.g. https://yunwu.ai/v1), so we just append /chat/completions.
 */
export function normalizeBaseUrl(url: string): string {
  return url.replace(/\/+$/, "");
}

export interface StreamChatOptions {
  baseUrl: string;
  apiKey: string;
  model: string;
  messages: ChatMessage[];
  maxTokens?: number;
  signal?: AbortSignal;
  onDelta: (delta: string) => void;
}

export async function streamChat(options: StreamChatOptions): Promise<void> {
  const { baseUrl, apiKey, model, messages, maxTokens, signal, onDelta } = options;
  const url = `${normalizeBaseUrl(baseUrl)}/chat/completions`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      stream: true,
      ...(maxTokens ? { max_tokens: maxTokens } : {}),
    }),
    signal,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `AI 请求失败：${res.status}${text ? ` – ${text.slice(0, 120)}` : ""}`,
    );
  }

  const reader = res.body?.getReader();
  const decoder = new TextDecoder();
  if (!reader) throw new Error("无法读取响应流");

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    for (const line of decoder.decode(value, { stream: true }).split("\n")) {
      const t = line.trim();
      if (!t.startsWith("data:")) continue;
      const json = t.slice(5).trim();
      if (json === "[DONE]") return;
      try {
        const delta = JSON.parse(json).choices?.[0]?.delta?.content ?? "";
        if (delta) onDelta(delta);
      } catch {}
    }
  }
}

export interface ChatCompletionOptions {
  baseUrl: string;
  apiKey: string;
  model: string;
  messages: ChatMessage[];
  maxTokens?: number;
}

export async function chatCompletion(
  options: ChatCompletionOptions,
): Promise<string> {
  const { baseUrl, apiKey, model, messages, maxTokens } = options;
  const url = `${normalizeBaseUrl(baseUrl)}/chat/completions`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      stream: false,
      ...(maxTokens ? { max_tokens: maxTokens } : {}),
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `AI 请求失败：${res.status}${text ? ` – ${text.slice(0, 120)}` : ""}`,
    );
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "";
}
