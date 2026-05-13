import "dotenv/config";
import { RunnableLambda } from "@langchain/core/runnables";

// Simulate three translation services, from highest to lowest priority.
const premiumTranslator = RunnableLambda.from(async (text) => {
  console.log("[Premium] Attempting translation...");
  // Simulate premium service being unavailable.
  throw new Error("Premium service timeout");
});

const standardTranslator = RunnableLambda.from(async (text) => {
  console.log("[Standard] Attempting translation...");
  // Simulate standard service also failing.
  throw new Error("Standard service rate limited");
});

const localTranslator = RunnableLambda.from(async (text) => {
  console.log("[Local] Using local dictionary...");
  const dict = { hello: "hello", world: "world", goodbye: "goodbye" };
  const words = text.toLowerCase().split(" ");
  return words.map((w) => dict[w] ?? w).join(" ");
});

// withFallbacks: try premium -> standard -> local in order.
const translator = premiumTranslator.withFallbacks({
  fallbacks: [standardTranslator, localTranslator],
});

const result = await translator.invoke("hello world");
console.log("Translation result:", result);