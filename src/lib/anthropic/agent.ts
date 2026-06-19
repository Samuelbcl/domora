import "server-only";

import Anthropic from "@anthropic-ai/sdk";

import { env } from "@/lib/env";
import { advisorTools } from "./tools";

/**
 * Manual tool-use loop for the advisor agent.
 *
 * The model is read from env (never hardcoded). `thinking` is intentionally
 * omitted so the same code works across model families (Sonnet/Opus/Haiku).
 * Replies are short (mobile), so a small max_tokens is fine.
 */

export type ToolExecutor = (
  name: string,
  input: Record<string, unknown>,
) => Promise<string>;

const MAX_ITERATIONS = 6;

export async function runAdvisor(opts: {
  system: string;
  messages: Anthropic.MessageParam[];
  executeTool: ToolExecutor;
}): Promise<string> {
  const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
  const model = env.ANTHROPIC_MODEL as string;

  const messages = [...opts.messages];
  let lastText = "";

  for (let i = 0; i < MAX_ITERATIONS; i++) {
    const response = await client.messages.create({
      model,
      max_tokens: 2048,
      system: opts.system,
      tools: advisorTools,
      messages,
    });

    lastText = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("\n")
      .trim();

    if (response.stop_reason !== "tool_use") {
      return lastText;
    }

    // Execute every tool_use block, then feed the results back.
    const toolUses = response.content.filter(
      (b): b is Anthropic.ToolUseBlock => b.type === "tool_use",
    );

    messages.push({ role: "assistant", content: response.content });

    const toolResults: Anthropic.ToolResultBlockParam[] = [];
    for (const tool of toolUses) {
      let result: string;
      try {
        result = await opts.executeTool(
          tool.name,
          (tool.input ?? {}) as Record<string, unknown>,
        );
      } catch {
        result = "Erreur lors de l'exécution de l'outil.";
      }
      toolResults.push({
        type: "tool_result",
        tool_use_id: tool.id,
        content: result,
      });
    }

    messages.push({ role: "user", content: toolResults });
  }

  return lastText || "Désolé, je n'ai pas pu finaliser ma réponse.";
}
