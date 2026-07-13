import { StateGraph, START, END, MemorySaver } from "@langchain/langgraph";
import { ChatOpenAI } from "@langchain/openai";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { AgentState } from "./state";
import { searchProductsTool } from "./tools";
import { SystemMessage, AIMessage } from "@langchain/core/messages";

const llm = new ChatOpenAI({
  modelName: "deepseek-v4-pro", // Menggunakan model OpenAI ringan & cepat
  temperature: 0,
  apiKey: process.env.OPENAI_API_KEY,
  configuration: {
    baseURL: process.env.BASE_URL,
  },
});

const tools = [searchProductsTool];
const toolNode = new ToolNode(tools);
const boundLlm = llm.bindTools(tools);

const systemPrompt = `Nama Anda adalah Heracles, asisten konsultan suplemen untuk toko "Ambrosia".
Tugas utama Anda adalah memahami kebutuhan kesehatan pengguna dan merekomendasikan produk HANYA dari database toko Ambrosia.
Pada awal percakapan, selalu perkenalkan diri Anda dengan ramah sebagai Heracles.
Gaya bicara wajib bersemangat layaknya seorang sales yang seru dan menyenangkan, namun tetap singkat, padat, dan to-the-point.
PENTING: DILARANG menggunakan format markdown seperti bold (tanda bintang * atau **), header (#), list markdown (-), tabel markdown, atau emoji apa pun dalam jawaban Anda. Tulis dalam bentuk teks polos (plain text) dengan paragraf atau baris baru yang rapi saja.
JIKA pengguna mencari rekomendasi produk, Anda WAJIB memanggil tool "search_products". JANGAN PERNAH menyuruh pengguna mencari di supermarket atau toko online lain.
Jika informasi kebutuhan pengguna sangat tidak jelas, Anda boleh bertanya untuk klarifikasi. Namun jika sudah ada kata kunci (misal: "protein", "tidur", "energi"), langsung panggil tool search_products.`;

// Node: planningUserRequest
async function planningUserRequest(state: typeof AgentState.State) {
  const messages = state.messages;

  // Menambahkan system prompt jika belum ada
  const hasSystem = messages.some((m) => m._getType() === "system");
  const messagesToRun = hasSystem
    ? messages
    : [new SystemMessage(systemPrompt), ...messages];

  const response = await boundLlm.invoke(messagesToRun);

  return { messages: [response] };
}

// Node: evaluateAndResult
// Node ini dipanggil HANYA setelah tool pencarian selesai
async function evaluateAndResult(state: typeof AgentState.State) {
  const messages = state.messages;

  const evalSystemPrompt = new SystemMessage(
    `Berdasarkan data produk yang baru saja diambil dari database (pada pesan tool sebelumnya), tolong evaluasi produk-produk tersebut.
    1. Pilih maksimal 2 produk yang paling relevan dengan masalah/kebutuhan user.
    2. Berikan skor (dalam penjelasan) dan alasan mengapa produk tersebut direkomendasikan.
    3. Jika tidak ada produk yang cocok, sampaikan permintaan maaf dengan sopan dan tawarkan konsultasi lebih lanjut.
    4. Gaya bicara wajib bersemangat layaknya seorang sales yang seru dan menyenangkan, namun tetap singkat, padat, dan to-the-point.
    5. PENTING: DILARANG menggunakan format markdown seperti bold (tanda bintang * atau **), header (#), list markdown (-), tabel markdown, atau emoji apa pun dalam jawaban Anda. Tulis dalam bentuk teks polos (plain text) dengan paragraf atau baris baru yang rapi saja.`
  );

  const response = await llm.invoke([...messages, evalSystemPrompt]);

  return { messages: [response] };
}

// Node: answerUser
// Jika tidak ada tool yang dipanggil, pesan dari planningUserRequest sudah cukup
async function answerUser(state: typeof AgentState.State) {
  return {};
}

// Fungsi Router (Conditional Edge)
function router(state: typeof AgentState.State) {
  const messages = state.messages;
  const lastMessage = messages[messages.length - 1] as AIMessage;

  // Cek apakah LLM memutuskan untuk memanggil tool
  if (lastMessage.tool_calls && lastMessage.tool_calls.length > 0) {
    return "toolsToScrape";
  }

  return "answerUser";
}

// Menyusun graph sesuai arsitektur diagram
const workflow = new StateGraph(AgentState)
  .addNode("planningUserRequest", planningUserRequest)
  .addNode("toolsToScrape", toolNode)
  .addNode("evaluateAndResult", evaluateAndResult)
  .addNode("answerUser", answerUser)

  .addEdge(START, "planningUserRequest")
  .addConditionalEdges("planningUserRequest", router, {
    toolsToScrape: "toolsToScrape",
    answerUser: "answerUser",
  })
  .addEdge("toolsToScrape", "evaluateAndResult")
  .addEdge("evaluateAndResult", END)
  .addEdge("answerUser", END);

// Menambahkan memori persisten agar agent ingat percakapan tiap user id
const memory = new MemorySaver();

export const agent = workflow.compile({ checkpointer: memory });
