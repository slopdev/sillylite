import nunjucks from "nunjucks";
import type { Chat, FlatChat, Globals } from "../types";

const env = new nunjucks.Environment();

export function formatMessage(content: string, globals: Globals): string {
  try {
    return env.renderString(content, globals).trim();
  } catch (e) {
    console.error("Formatting error", e);
    return content;
  }
}

export interface FormattedChat {
  messages: { role: string; content: string; name?: string }[];
}

export interface stdFormatterArgs {
  template: boolean
}

// To deprecate
export function formatChat(chat: Chat, characterGlobals: Globals): FormattedChat {
  const mergedGlobals = { ...characterGlobals, ...chat.globals };
  
  // Apply templating to each message
  const templatedMessages = chat.messages.map(msg => ({
    ...msg,
    content: formatMessage(msg.content, mergedGlobals)
  }));

  // Grouping logic (optional, but requested)
  // For now, let's just return the templated messages in a standard format
  return {
    messages: templatedMessages.map(m => ({
      role: m.role,
      content: m.content,
      name: m.name
    }))
  };
}

// wip
export function applyStdFormatter(
  chat: FlatChat,
  characterGlobals: Globals,
  opts: stdFormatterArgs = {
    template: true
  }
): FlatChat {
  const mergedGlobals = { ...characterGlobals, ...chat.globals };
  let currMessages = chat.messages;
  
  if (opts.template){
    currMessages = chat.messages.map(msg => ({
      ...msg,
      content: formatMessage(msg.content, mergedGlobals)
    }));
  }

  return {
    ...chat,
    messages: currMessages.map(m => ({
      role: m.role,
      content: m.content,
    }))
  };
}

// Custom JS formatter support
export async function applyCustomFormatter(chat: Chat, jsCode: string): Promise<Chat> {
  try {
    const fn = new Function("chat", jsCode);
    const result = await fn(JSON.parse(JSON.stringify(chat)));
    return result || chat;
  } catch (e) {
    console.error("Custom formatter error", e);
    return chat;
  }
}
