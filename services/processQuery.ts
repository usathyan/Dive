import { BaseChatModel, BindToolsInput } from "@langchain/core/language_models/chat_models";
import { AIMessage, BaseMessage, HumanMessage, MessageContentComplex, ToolMessage } from "@langchain/core/messages";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { imageToBase64 } from "./utils/image.js";
import logger from "./utils/logger.js";
import { iQueryInput, iStreamMessage } from "./utils/types.js";

export async function handleProcessQuery(
  toolToClientMap: Map<string, Client>,
  availableTools: BindToolsInput[],
  model: BaseChatModel | null,
  input: string | iQueryInput,
  history: BaseMessage[],
  onStream?: (text: string) => void
) {
  // Handle input format
  let messages: BaseMessage[] = history;

  if (!model) {
    throw new Error("Model not initialized");
  }

  if (typeof input === "string") {
    messages.push(new HumanMessage(input));
  } else {
    // Handle input with images
    const content: MessageContentComplex[] = [];

    // Add text content if exists
    if (input.text) {
      content.push({ type: "text", text: input.text });
    }

    // Add image content if exists
    if (input.images && input.images.length > 0) {
      for (const imagePath of input.images) {
        // Get actual file path from URL
        const localPath = `${imagePath}`;
        const base64Image = await imageToBase64(localPath);
        content.push({
          type: "text",
          text: `![Image](${localPath})`,
        });
        content.push({
          type: "image_url",
          image_url: {
            url: base64Image,
          },
        });
      }
    }

    // Add image content if exists
    if (input.documents && input.documents.length > 0) {
      for (const documentPath of input.documents) {
        const localPath = `${documentPath}`;
        content.push({
          type: "text",
          text: `![Document](${localPath})`,
        });
      }
    }

    messages.push(new HumanMessage({ content }));
  }

  let hasToolCalls = true;
  let finalResponse = "";

  const runModel = model.bindTools?.(availableTools) || model;

  while (hasToolCalls) {
    const stream = await runModel.stream(messages);
    let currentContent = "";
    let toolCalls: any[] = [];

    // Handle streaming response
    for await (const chunk of stream) {
      if (chunk.content) {
        currentContent += chunk.content;
        onStream?.(
          JSON.stringify({
            type: "text",
            content: chunk.content,
          } as iStreamMessage)
        );
      }

      // Handle tool call stream
      /** Note: When using stream, read tool_call_chunks to get tool call results
       *  tool_calls arguments are empty.
       */
      if (chunk.tool_calls || chunk.tool_call_chunks) {
        const toolCallChunks = chunk.tool_call_chunks || [];

        for (const chunks of toolCallChunks) {
          // Use index to find or create tool call record
          let index = chunks.index;
          if (index !== undefined && index >= 0 && !toolCalls[index]) {
            // No corresponding tool call record found, create new record
            index = toolCalls.length;
            toolCalls.push({
              id: chunks.id,
              type: "function",
              function: {
                name: chunks.name,
                arguments: "",
              },
            });
          }

          if (index !== undefined && index >= 0) {
            if (chunks.name) {
              toolCalls[index].function.name = chunks.name;
            }

            if (chunks.args) {
              toolCalls[index].function.arguments += chunks.args;
            }

            // Try to parse complete arguments
            try {
              if (
                toolCalls[index].function.arguments.startsWith("{") &&
                toolCalls[index].function.arguments.endsWith("}")
              ) {
                const parsedArgs = JSON.parse(toolCalls[index].function.arguments);
                toolCalls[index].function.arguments = JSON.stringify(parsedArgs);
              }
            } catch (e) {
              // If parsing fails, arguments are not complete, continue accumulating
            }
          }
        }
      }
    }

    // Update final response
    finalResponse += currentContent;

    // If no tool calls, end loop
    if (toolCalls.length === 0) {
      hasToolCalls = false;
      continue;
    }

    // Add AI tool call record to conversation
    // This is necessary to correspond with tool results (toolCall.id)
    messages.push(
      new AIMessage({
        content: currentContent,
        additional_kwargs: {
          tool_calls: toolCalls.map((toolCall) => ({
            id: toolCall.id,
            type: "function",
            function: {
              name: toolCall.function.name,
              arguments: toolCall.function.arguments,
            },
          })),
        },
      })
    );

    // Send call info before tool execution
    if (toolCalls.length > 0) {
      onStream?.(
        JSON.stringify({
          type: "tool_calls",
          content: toolCalls.map((call) => ({
            name: call.function.name,
            arguments: JSON.parse(call.function.arguments),
          })),
        } as iStreamMessage)
      );
    }

    // Execute all tool calls in parallel
    const toolResults = await Promise.all(
      toolCalls.map(async (toolCall) => {
        const toolName = toolCall.function.name;
        const toolArgs = JSON.parse(toolCall.function.arguments);
        const client = toolToClientMap.get(toolName);

        const result = await client?.callTool({
          name: toolName,
          arguments: toolArgs,
        });

        if (result?.isError) logger.error(`[MCP Tool][${toolName}] ${JSON.stringify(result, null, 2)}`);

        // Send tool execution results
        onStream?.(
          JSON.stringify({
            type: "tool_result",
            content: {
              name: toolName,
              result: result,
            },
          } as iStreamMessage)
        );

        return {
          tool_call_id: toolCall.id,
          role: "tool" as const,
          content: JSON.stringify(result),
        };
      })
    );

    // Add tool results to conversation
    messages.push(...toolResults.map((result) => new ToolMessage(result)));
  }

  return finalResponse;
}
