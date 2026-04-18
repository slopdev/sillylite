export type Globals = Record<string, string | number | boolean | null>;

export interface Character {
  id: string;
  name: string;
  globals: Globals;
  avatar?: string;
  created_at: number;
  modified_at: number;
  metadata?: Record<string, unknown>;
}

export interface Swipe {
  text: string;
  created_at: number;
  gen_started?: number;
  gen_finished?: number;
  model?: string;
  api?: string;
  extra?: Record<string, unknown>;
}

export interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  name?: string;
  content: string;
  swipes?: Swipe[];
  swipe_index?: number;
  modified_at: number;
  extra?: Record<string, unknown>;
}

export interface Chat {
  id: string;
  character_id: string;
  title?: string;
  globals: Globals;
  messages: Message[];
  fork_of?: {
    chat_id: string;
    message_index: number;
  };
  created_at: number;
  modified_at: number;
}

// --------------------------------------------------

export interface GlobalConfig {
  lm_config: LMConfig[]
}

export interface LMConfig {
  id: string;
  adapter_id: string;
  label: string;
  endpoint: string;
  apiKey?: string;
  model: string;
  parameters: Record<string, unknown>;
}

// --------------------------------------------------
//                   internal 
// --------------------------------------------------

export interface ChatMetadata {
  id: string;
  character_id: string;
  title?: string;
  created_at: number;
  modified_at: number;
}

export interface Char2ChatIndex {
  [key: string]: ChatMetadata[];
}

// chat object to be used by formatter/lm
export interface FlatChat {
  character_id: string;
  title?: string;
  globals: Globals;
  messages: FlatMessage[];
}

export interface FlatMessage {
  role: "user" | "assistant" | "system";
  content: string;
  extra?: Record<string, unknown>;
}

