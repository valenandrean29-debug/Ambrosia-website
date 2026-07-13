import { Annotation, MessagesAnnotation } from "@langchain/langgraph";

// Define the state for the LangGraph agent
export const AgentState = Annotation.Root({
  ...MessagesAnnotation.spec,
  category: Annotation<string | undefined>(),
  price: Annotation<number | undefined>(),
  description: Annotation<string | undefined>(),
  scraped_products: Annotation<any[] | undefined>(),
});
