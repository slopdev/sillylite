import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { Chat, FlatChat, Message, FlatMessage } from "../types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}


// --------------------------------------------------

// cast a message with swipes to flat message format
export function flattenMessage(msg: Message): FlatMessage{
  return {
    role: msg.role,
    content: msg.content,
    extra: msg.extra,
  };
}

export function flattenChat(chat: Chat): FlatChat{
  let flatMsg: FlatMessage[] = chat.messages.map((m) => {
    return flattenMessage(m);
  });

  return {
    ...chat,
    messages: flatMsg
  }
}
