import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { npcName, personality, backstory, knownAnime, history, message } = body;

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      // Fallback khi không có API key — trả về response mẫu
      return NextResponse.json({ reply: getFallback(npcName) });
    }

    const systemPrompt = [
      `Tên bạn là ${npcName}.`,
      personality,
      `Backstory: ${backstory}`,
      knownAnime?.length
        ? `Bạn biết về các anime: ${knownAnime.join(", ")}.`
        : "",
      "Trả lời bằng tiếng Việt, ngắn gọn (1-3 câu), đúng tính cách.",
      "Không được phá vỡ nhân vật. Không nhắc đến AI hay ChatGPT.",
    ]
      .filter(Boolean)
      .join(" ");

    const messages = [
      { role: "system", content: systemPrompt },
      ...(history ?? []).slice(-10),
      { role: "user", content: message },
    ];

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages,
        max_tokens: 150,
        temperature: 0.85,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("[AI NPC] OpenAI error:", err);
      return NextResponse.json({ reply: getFallback(npcName) });
    }

    const data = await res.json();
    const reply = data.choices?.[0]?.message?.content ?? getFallback(npcName);
    return NextResponse.json({ reply });
  } catch (err) {
    console.error("[AI NPC] route error:", err);
    return NextResponse.json({ reply: "..." }, { status: 200 });
  }
}

function getFallback(name: string): string {
  const lines = [
    `Xin chào! Mình là ${name}~`,
    "Hôm nay bạn xem anime gì chưa?",
    "Thế giới này thật kỳ diệu nhỉ...",
    "Bạn có muốn nghe câu chuyện của mình không?",
  ];
  return lines[Math.floor(Math.random() * lines.length)];
}
