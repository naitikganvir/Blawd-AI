import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const { action } = body;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Handle OCR action for images
    if (action === "ocr") {
      const { imageBase64, mimeType } = body;
      if (!imageBase64) throw new Error("Missing image data");

      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "image_url",
                  image_url: { url: `data:${mimeType || "image/png"};base64,${imageBase64}` },
                },
                {
                  type: "text",
                  text: "Extract ALL text from this image. Return only the extracted text, preserving the original formatting, paragraphs, and structure as much as possible. Do not add any commentary.",
                },
              ],
            },
          ],
          stream: false,
        }),
      });

      if (!response.ok) {
        const t = await response.text();
        console.error("AI gateway OCR error:", response.status, t);
        throw new Error("Failed to extract text from image");
      }

      const data = await response.json();
      const extractedText = data.choices?.[0]?.message?.content || "";

      return new Response(JSON.stringify({ text: extractedText }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Handle standard text-based actions
    const { text } = body;
    if (!text || !action) throw new Error("Missing text or action");

    const prompts: Record<string, string> = {
      summarize: `You are an expert book summarizer. Summarize the following text into a clear, concise summary. Use markdown formatting with headers for sections if the text is long. Focus on key ideas, arguments, and conclusions.\n\nText:\n${text.slice(0, 8000)}`,
      explain: `You are an expert teacher. Identify the most difficult or complex concepts in the following text and explain each one in simple, easy-to-understand language. Use analogies and examples. Format with markdown headers for each concept.\n\nText:\n${text.slice(0, 8000)}`,
      highlight: `You are an expert reader. Extract the most important points, key takeaways, and memorable quotes from the following text. Format as a markdown bullet list grouped by theme. Use **bold** for the most critical points.\n\nText:\n${text.slice(0, 8000)}`,
      quiz: `You are an expert educator. Based on the following text, create 5 multiple-choice quiz questions to test understanding. Format each question with:\n\n### Question N\n**Question text**\n\n- A) Option\n- B) Option\n- C) Option\n- D) Option\n\n**Answer: X) Correct answer**\n**Explanation:** Brief explanation\n\nText:\n${text.slice(0, 8000)}`,
    };

    const systemPrompt = prompts[action];
    if (!systemPrompt) throw new Error(`Unknown action: ${action}`);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: "Please process the text above according to the instructions." },
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits in Settings." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error("AI gateway error");
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("book-ai error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
