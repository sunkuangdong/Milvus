import "dotenv/config";
import { RunnableLambda } from "@langchain/core/runnables";

let attempt = 0;

// A runnable that randomly fails, used to demonstrate withRetry.
const unstableRunnable = RunnableLambda.from(async (input) => {
  attempt += 1;
  console.log(`Attempt ${attempt}, input: ${input}`);

  // Simulate a 70% chance of failure.
  if (Math.random() < 0.7) {
    console.log("This attempt failed, throwing an error.");
    throw new Error("Simulated random error");
  }

  console.log("This attempt succeeded.");
  return `Processed successfully: ${input}`;
});

// Add retry logic to the runnable.
const runnableWithRetry = unstableRunnable.withRetry({
  // Maximum total attempts.
  stopAfterAttempt: 5,
});

try {
  const result = await runnableWithRetry.invoke("withRetry demo");
  console.log("✅ Final result:", result);
} catch (err) {
  console.error("❌ Still failed after retries:", err?.message ?? err);
}