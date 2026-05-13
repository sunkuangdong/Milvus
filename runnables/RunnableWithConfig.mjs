import "dotenv/config";
import { RunnableLambda, RunnableSequence } from "@langchain/core/runnables";

// Simulate a simple "user database".
const mockUsers = new Map([
  [
    "user-123",
    {
      id: "user-123",
      name: "Guang",
      email: "guang@example.com",
    },
  ],
]);

// Step 1: fetch user by config.configurable.userId.
const fetchUserFromConfig = RunnableLambda.from(async (input, config) => {
  const userId = config?.configurable?.userId;

  console.log("[Step 1] Received notification:", input);
  console.log("[Step 1] userId from config:", userId);

  const user = userId ? mockUsers.get(userId) : null;

  if (!user) {
    throw new Error("User not found. Cannot send notification.");
  }

  return {
    user,
    notification: input,
  };
});

// Step 2: permission check by config.configurable.role.
const checkPermissionByRole = RunnableLambda.from(async (state, config) => {
  const role = config?.configurable?.role ?? "viewer";

  console.log("[Step 2] Current role:", role);

  const canSend =
    role === "admin" ||
    role === "operator" ||
    role === "system";

  if (!canSend) {
    throw new Error(`Role "${role}" does not have permission to send system notifications.`);
  }

  return {
    ...state,
    role,
  };
});

// Step 3: format the final notification content by locale.
const formatNotificationByLocale = RunnableLambda.from(async (state, config) => {
  const locale = config?.configurable?.locale ?? "zh-CN";

  console.log("[Step 3] locale:", locale);

  let content;
  if (locale === "en-US") {
    content = `Dear ${state.user.name},\n\n${state.notification}\n\n(from role: ${state.role})`;
  } else {
    content = `Dear ${state.user.name},\n\n${state.notification}\n\n(sender role: ${state.role})`;
  }

  return {
    ...state,
    locale,
    finalContent: content,
  };
});

// Chain the three steps together.
const chain = RunnableSequence.from([
  fetchUserFromConfig,
  checkPermissionByRole,
  formatNotificationByLocale,
]);

// Bind default config for the whole chain.
const chainWithConfig = chain.withConfig({
  tags: ["demo", "withConfig", "notification"],
  metadata: {
    demoName: "RunnableWithConfig",
  },
  configurable: {
    userId: "user-123",
    role: "admin",
    locale: "zh-CN",
  },
});

// Create another chain config using English locale.
const chainWithConfig2 = chain.withConfig({
  tags: ["demo", "withConfig", "notification-en"],
  metadata: {
    demoName: "RunnableWithConfig2",
  },
  configurable: {
    userId: "user-123",
    role: "operator",
    locale: "en-US",
  },
});

// Input is the notification text to be sent.
const result = await chainWithConfig.invoke("You have a new system notification. Please check it soon.");
console.log("✅ Final notification content:\n", result.finalContent);

console.log("\n--- chainWithConfig2 ---\n");

const result2 = await chainWithConfig2.invoke("System maintenance scheduled tonight.");
console.log("✅ Final notification content:\n", result2.finalContent);