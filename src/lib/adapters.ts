import type { FlatChat, LMConfig } from "../types";

export interface TextChunk {
  content: string;
  extra?: Record<string, unknown>;
}

export interface LMAdapterV2 {
  id: string;
  label: string;
  complete(chat: FlatChat, config: LMConfig, signal: AbortSignal): AsyncIterable<TextChunk>;
}

export const EchoAdapterV2: LMAdapterV2 = {
  id: "echo",
  label: "Echo (Test)",
  async *complete(chat, config, signal) {
    const text = (chat.messages.at(-1) ?? {content: ""}).content;
    const chunks = text.split(" ");
    for (const chunk of chunks) {
      if (signal.aborted) break;
      yield {content: chunk + " "};
      await new Promise(r => setTimeout(r, 50));
    }
  }
};

export const OpenAIAdapterV2: LMAdapterV2 = {
  id: "openai",
  label: "OpenAI Chat Completions",
  async *complete(chat, config, signal) {
    const messages = chat.messages.map(({ role, content }) => ({ role, content }));

    const response = await fetch(config.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(config.apiKey ? { Authorization: `Bearer ${config.apiKey}` } : {}),
      },
      body: JSON.stringify({
        model: config.model,
        messages,
        stream: true,
        ...config.parameters,
      }),
      signal,
    });

    if (!response.ok) {
      const error = await response.text().catch(() => response.statusText);
      throw new Error(`OpenAI request failed (${response.status}): ${error}`);
    }

    if (!response.body) throw new Error("Response body is null");

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        // Keep the last (potentially incomplete) line in the buffer
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed === "data: [DONE]") continue;
          if (!trimmed.startsWith("data: ")) continue;

          try {
            const json = JSON.parse(trimmed.slice(6));
            const chunk = castOAI2TextChunk(json);
            if (chunk) yield chunk;
          } catch {
            // Malformed JSON — skip
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  },
};

export const adaptersRegistry: Record<string, LMAdapterV2> = {
  echo: EchoAdapterV2,
  openai: OpenAIAdapterV2,
};

// --------------------------------------------------

function castOAI2TextChunk(json: unknown): TextChunk | null {
  if (!json || typeof json !== "object") return null;
  const obj = json as Record<string, unknown>;

  // Standard OpenAI streaming delta
  const choices = obj.choices;
  if (Array.isArray(choices) && choices.length > 0) {
    const choice = choices[0] as Record<string, unknown>;
    const delta = choice.delta as Record<string, unknown> | undefined;
    const content = delta?.content;

    if (typeof content === "string") {
      const extra: Record<string, unknown> = {};
      if (choice.finish_reason != null) extra.finish_reason = choice.finish_reason;
      if (choice.index != null) extra.index = choice.index;
      if (obj.id) extra.id = obj.id;
      if (obj.model) extra.model = obj.model;
      if (obj.usage) extra.usage = obj.usage;

      return { content, ...(Object.keys(extra).length ? { extra } : {}) };
    }

    // finish chunk with no content (e.g. finish_reason: "stop")
    if (content == null && choice.finish_reason != null) {
      return { content: "", extra: { finish_reason: choice.finish_reason } };
    }
  }

  // Non-streaming response shape (just in case)
  const message = (obj as any)?.choices?.[0]?.message;
  if (typeof message?.content === "string") {
    return { content: message.content };
  }

  return null;
}
