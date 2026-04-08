import { NextRequest, NextResponse } from 'next/server';

const CHATBOT_API_URL = process.env.CHATBOT_API_URL;

export async function POST(req: NextRequest) {
  const body = await req.json();
  const message: string | undefined = body?.message;

  if (!message || typeof message !== 'string') {
    return NextResponse.json({ error: 'message is required' }, { status: 400 });
  }

  // If a backend chatbot URL is configured, proxy the request
  if (CHATBOT_API_URL) {
    try {
      const upstream = await fetch(`${CHATBOT_API_URL}/chatbot/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      });

      if (!upstream.ok) {
        return NextResponse.json({ reply: 'The assistant is temporarily unavailable.' }, { status: 502 });
      }

      const data = await upstream.json();
      return NextResponse.json({ reply: data.reply });
    } catch {
      return NextResponse.json({ reply: 'The assistant is temporarily unavailable.' }, { status: 502 });
    }
  }

  // Mock response while backend is not yet available
  return NextResponse.json({
    reply: `Thanks for your message! Our chatbot backend is being set up. We received: "${message}"`,
  });
}
