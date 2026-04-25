import { Chat, Message } from "../types";

/**
 * CHSL Alphabet: 0-9, a-z, A-Z (62 characters)
 * Used for lexicographic succession.
 */
const ALPHABET = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

/**
 * Generates the lexicographical successor of a 6-character block code.
 * Following the spec: 00000z -> 000010 (if using base-36) or 
 * 00000Z -> 000010 (using base-62).
 */
export function _getNextCode(code: string): string {
  const chars = code.split("");
  for (let i = chars.length - 1; i >= 0; i--) {
    const index = ALPHABET.indexOf(chars[i]);
    if (index === -1) {
      // Fallback for invalid characters
      chars[i] = ALPHABET[0];
      continue;
    }
    if (index < ALPHABET.length - 1) {
      chars[i] = ALPHABET[index + 1];
      return chars.join("");
    }
    chars[i] = ALPHABET[0];
  }
  return chars.join(""); // Wraparound
}

/**
 * Serializes a Chat object into the CHSL format.
 * Returns both the .chsl text and the .json auxiliary data.
 */
export function serializeToChsl(chat: Chat): { chsl: string; json: string } {
  const jsonData: Record<string, any> = {
    __globals__: {
      id: chat.id,
      character_id: chat.character_id,
      title: chat.title,
      globals: chat.globals,
      fork_of: chat.fork_of,
      created_at: chat.created_at,
      modified_at: chat.modified_at,
    },
  };

  let chsl = "";
  let currentCode = "000000";

  for (const msg of chat.messages) {
    // Generate or preserve a 6-char code
    const code = msg.id.length === 6 ? msg.id : currentCode;
    
    // Format Header: Role: Name (if available)
    const header = `${msg.role.charAt(0).toUpperCase() + msg.role.slice(1)}${msg.name ? `: ${msg.name}` : ""}:`;
    
    // Indent body lines with a single hard tab
    const body = msg.content
      .split(/\r?\n/)
      .map((line) => `\t${line}`)
      .join("\n");

    chsl += `@${code}\n${header}\n${body}\n\n`;

    // Metadata
    jsonData[code] = {
      modified_at: msg.modified_at,
      swipes: msg.swipes,
      swipe_index: msg.swipe_index,
      extra: msg.extra,
    };

    currentCode = _getNextCode(code);
  }

  return {
    chsl: chsl.trimEnd() + "\n",
    json: JSON.stringify(jsonData, null, 2),
  };
}

/**
 * Parses a CHSL file and optional auxiliary JSON into a Chat object.
 */
export function parseFromChsl(chsl: string, jsonContent?: string): Chat {
  const auxiliary = jsonContent ? JSON.parse(jsonContent) : {};
  const globals = auxiliary.__globals__ || {};
  const lines = chsl.split(/\r?\n/);

  const messages: Message[] = [];
  let currentCode: string | null = null;
  let currentHeader: string | null = null;
  let currentBody: string[] = [];

  const commitSegment = () => {
    if (currentHeader && currentBody.length > 0) {
      const meta = currentCode ? auxiliary[currentCode] : {};
      const content = currentBody.join("\n");
      
      // Attempt to infer role from header "Role: Name"
      const headerMatch = currentHeader.match(/^(user|assistant|system):?(?:\s+(.*))?:?$/i);
      const role = (headerMatch ? headerMatch[1].toLowerCase() : (meta.role || "user")) as Message["role"];
      const name = headerMatch?.[2] || meta.name;

      messages.push({
        id: currentCode || crypto.randomUUID(),
        role,
        name,
        content,
        modified_at: meta.modified_at || Date.now(),
        swipes: meta.swipes,
        swipe_index: meta.swipe_index,
        extra: meta.extra,
      });
    }
    currentBody = [];
  };

  for (const line of lines) {
    if (line.startsWith("@") && line.length === 7) {
      commitSegment();
      currentCode = line.substring(1);
      currentHeader = null;
    } else if (line.startsWith("\t")) {
      currentBody.push(line.substring(1));
    } else if (line.trim().length > 0) {
      if (currentHeader && currentBody.length === 0) {
        // Handle cases where multiple header lines appear before body
        currentHeader = line.trim();
      } else {
        if (currentHeader) commitSegment();
        currentHeader = line.trim();
      }
    }
  }
  commitSegment();

  return {
    id: globals.id || crypto.randomUUID(),
    character_id: globals.character_id || "__system__",
    title: globals.title,
    globals: globals.globals || {},
    messages,
    created_at: globals.created_at || Date.now(),
    modified_at: globals.modified_at || Date.now(),
    fork_of: globals.fork_of,
  };
}