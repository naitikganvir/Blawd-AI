export type AiAction = 'summarize' | 'explain' | 'highlight' | 'quiz';

const BOOK_AI_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/book-ai`;

export async function streamBookAi({
  text,
  action,
  onDelta,
  onDone,
  onError,
}: {
  text: string;
  action: AiAction;
  onDelta: (chunk: string) => void;
  onDone: () => void;
  onError: (msg: string) => void;
}) {
  try {
    const resp = await fetch(BOOK_AI_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({ text, action }),
    });

    if (!resp.ok) {
      const data = await resp.json().catch(() => ({}));
      onError(data.error || `Request failed (${resp.status})`);
      return;
    }

    if (!resp.body) { onError("No response body"); return; }

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let textBuffer = "";
    let streamDone = false;

    while (!streamDone) {
      const { done, value } = await reader.read();
      if (done) break;
      textBuffer += decoder.decode(value, { stream: true });

      let newlineIndex: number;
      while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
        let line = textBuffer.slice(0, newlineIndex);
        textBuffer = textBuffer.slice(newlineIndex + 1);
        if (line.endsWith("\r")) line = line.slice(0, -1);
        if (line.startsWith(":") || line.trim() === "") continue;
        if (!line.startsWith("data: ")) continue;
        const jsonStr = line.slice(6).trim();
        if (jsonStr === "[DONE]") { streamDone = true; break; }
        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content as string | undefined;
          if (content) onDelta(content);
        } catch {
          textBuffer = line + "\n" + textBuffer;
          break;
        }
      }
    }

    onDone();
  } catch (e) {
    onError(e instanceof Error ? e.message : "Unknown error");
  }
}
