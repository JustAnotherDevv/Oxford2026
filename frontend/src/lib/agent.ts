const AGENT_URL = `${import.meta.env.VITE_AGENT_API_URL}/api/chat`;

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

const DOC_SYSTEM_PROMPT = `You are a professional document writer for a corporate neobank platform. You generate clean, well-structured content for business documents such as invoices, receipts, and agreements.

Rules:
- Output raw HTML using tags: <h2>, <p>, <ul>, <ol>, <li>, <strong>, <em>
- Do NOT wrap output in markdown code fences or backticks
- Be concise and professional
- Use proper business language
- Structure content with clear sections
- CRITICAL: You will be given real metadata (date, amount, recipient, sender address, document number). You MUST use these exact values in the generated content. NEVER use placeholders like [Due Date], [Amount], [Recipient], [Your Name], [Company], etc. If a value is not provided, simply omit that detail — do not insert a bracket placeholder.
- When given existing content to improve, maintain the core information but enhance clarity, formatting, and professionalism. Replace any bracket placeholders with the real values from the metadata.`;

export async function streamChat(
  messages: ChatMessage[],
  onChunk: (content: string) => void,
  onDone: () => void,
  onError: (error: string) => void,
): Promise<AbortController> {
  const controller = new AbortController();

  const fullMessages: ChatMessage[] = [
    { role: "system", content: DOC_SYSTEM_PROMPT },
    ...messages,
  ];

  try {
    const response = await fetch(AGENT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: fullMessages }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const err = await response.text();
      onError(err);
      return controller;
    }

    const reader = response.body?.getReader();
    if (!reader) {
      onError("No response body");
      return controller;
    }

    const decoder = new TextDecoder();
    let buffer = "";

    (async () => {
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || !trimmed.startsWith("data: ")) continue;

            const data = trimmed.slice(6);
            if (data === "[DONE]") {
              onDone();
              return;
            }

            try {
              const parsed = JSON.parse(data);
              if (parsed.content) {
                onChunk(parsed.content);
              }
            } catch {
              // skip malformed chunks
            }
          }
        }
        onDone();
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          onError(err instanceof Error ? err.message : "Stream failed");
        }
      }
    })();
  } catch (err) {
    if ((err as Error).name !== "AbortError") {
      onError(err instanceof Error ? err.message : "Connection failed");
    }
  }

  return controller;
}
