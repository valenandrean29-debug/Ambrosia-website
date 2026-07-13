import { NextRequest, NextResponse } from "next/server";
import { agent } from "@/lib/agent/graph";
import { HumanMessage } from "@langchain/core/messages";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, threadId } = body;

    if (!message || !threadId) {
      return NextResponse.json(
        { error: "Message and threadId are required" },
        { status: 400 }
      );
    }

    const config = { configurable: { thread_id: threadId } };

    const state = await agent.invoke(
      { messages: [new HumanMessage(message)] },
      config
    );

    const lastMessage = state.messages[state.messages.length - 1];

    return NextResponse.json({
      response: lastMessage.content,
    });
  } catch (error: any) {
    console.error("Error in chat API:", error);
    return NextResponse.json(
      { error: "Failed to process chat request", details: error.message },
      { status: 500 }
    );
  }
}
