import { HumanMessage } from "@langchain/core/messages";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local", override: true });

async function run() {
  const { agent } = await import("./lib/agent/graph");
  // Simulasi thread per user
  const userId = "user_test_999";
  const config = { configurable: { thread_id: userId } };

  console.log("=== Memulai Testing Chatbot Consultant ===");

  // Pertanyaan 1
  const input1 = "Halo, saya ingin memenuhi kebutuhan protein saya untuk cutting ";
  console.log(`\nUser: ${input1}`);
  console.log("Loading...");

  let state = await agent.invoke(
    { messages: [new HumanMessage(input1)] },
    config
  );

  let lastMessage = state.messages[state.messages.length - 1];
  console.log(`\nAgent: ${lastMessage.content}`);

  // Pertanyaan 2
  const input2 = "Terima kasih infonya! Kalau harganya di bawah 300 ribu ada?";
  console.log(`\nUser: ${input2}`);
  console.log("Loading...");

  state = await agent.invoke(
    { messages: [new HumanMessage(input2)] },
    config
  );

  lastMessage = state.messages[state.messages.length - 1];
  console.log(`\nAgent: ${lastMessage.content}`);
  console.log("\n=== Selesai ===");
}

run().catch(console.error);
