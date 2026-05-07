import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";

const ticketSchema = {
  type: "object",
  properties: {
    summary: {
      type: "string",
      description: "A concise one or two sentence summary of the customer issue.",
    },
    category: {
      type: "string",
      enum: [
        "Billing",
        "Technical Support",
        "Account Access",
        "Product Feedback",
        "Cancellation",
        "Sales",
        "Other",
      ],
    },
    urgency: {
      type: "string",
      enum: ["Low", "Medium", "High"],
    },
    sentiment: {
      type: "string",
      enum: ["Positive", "Neutral", "Negative", "Frustrated"],
    },
    suggested_customer_reply: {
      type: "string",
      description:
        "A clear, empathetic customer-facing response that a support agent could send.",
    },
    internal_team_note: {
      type: "string",
      description:
        "A concise internal note with routing guidance, likely owner, and next action.",
    },
  },
  required: [
    "summary",
    "category",
    "urgency",
    "sentiment",
    "suggested_customer_reply",
    "internal_team_note",
  ],
  additionalProperties: false,
};

function extractOutputText(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const response = payload as {
    output_text?: unknown;
    output?: Array<{
      content?: Array<{
        text?: unknown;
        type?: string;
      }>;
    }>;
  };

  if (typeof response.output_text === "string") {
    return response.output_text;
  }

  for (const item of response.output ?? []) {
    for (const content of item.content ?? []) {
      if (typeof content.text === "string") {
        return content.text;
      }
    }
  }

  return null;
}

export async function POST(request: Request) {
  try {
    const { ticket } = (await request.json()) as { ticket?: unknown };

    if (typeof ticket !== "string" || ticket.trim().length < 10) {
      return NextResponse.json(
        { error: "Paste a support ticket with enough detail to analyze." },
        { status: 400 },
      );
    }

    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey || apiKey === "your_api_key_here") {
      return NextResponse.json(
        {
          error:
            "OPENAI_API_KEY is not configured. Add it to your local environment and restart the dev server.",
        },
        { status: 500 },
      );
    }

    const openai = new OpenAI({
      apiKey,
    });

    const response = await openai.responses.create({
      model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
      input: [
        {
          role: "system",
          content:
            "You are a senior customer support operations analyst. Analyze customer tickets for SaaS support teams. Return JSON that matches the provided schema exactly.",
        },
        {
          role: "user",
          content: `Analyze this support ticket:\n\n${ticket.trim()}`,
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "support_ticket_analysis",
          strict: true,
          schema: ticketSchema,
        },
      },
    });

    const outputText = extractOutputText(response);

    if (!outputText) {
      return NextResponse.json(
        { error: "OpenAI returned an unexpected response shape." },
        { status: 502 },
      );
    }

    return NextResponse.json({ analysis: JSON.parse(outputText) });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Something went wrong while analyzing the ticket.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
