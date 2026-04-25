import path from "path";
import readline from "readline";
import { v4 as uuidv4 } from "uuid";
import { IFileSystem } from "@/src/server/FileSystem";
import type { Character, Chat, ChatMetadata, GlobalConfig } from "@/src/types";

export class StorageService {
  private charactersDir: string;
  private configFile: string;

  constructor(private fs: IFileSystem, private dataDir: string) {
    this.charactersDir = path.join(dataDir, "characters");
    this.configFile = path.join(dataDir, "config.json");
  }

  async ensureDirs() {
    await this.fs.mkdir(this.charactersDir, { recursive: true });
    try {
      await this.fs.access(this.configFile);
    } catch {
      const defaultConfig: GlobalConfig = { lm_config: {} };
      await this.fs.writeFile(this.configFile, JSON.stringify(defaultConfig, null, 2));
    }
  }

  // --- Configuration ---

  async getConfig(): Promise<GlobalConfig> {
    const data = await this.fs.readFile(this.configFile, "utf-8");
    return JSON.parse(data);
  }

  async updateConfig(config: GlobalConfig): Promise<GlobalConfig> {
    await this.fs.writeFile(this.configFile, JSON.stringify(config, null, 2));
    return config;
  }

  // --- Characters ---

  async getCharacters(): Promise<Character[]> {
    const dirs = await this.fs.readdir(this.charactersDir);
    const characters: Character[] = [];
    for (const id of dirs) {
      try {
        const charData = await this.fs.readFile(path.join(this.charactersDir, id, "character.json"), "utf-8");
        characters.push(JSON.parse(charData));
      } catch (e) {
        console.error(`Failed to read character ${id}`, e);
      }
    }
    return characters;
  }

  async createCharacter(data: Partial<Character>): Promise<Character> {
    const char: Character = {
      id: data.id || uuidv4(),
      name: data.name || "New Character",
      globals: data.globals || {},
      created_at: Date.now(),
      modified_at: Date.now(),
      ...data,
    };
    const charDir = path.join(this.charactersDir, char.id);
    await this.fs.mkdir(charDir, { recursive: true });
    await this.fs.writeFile(path.join(charDir, "character.json"), JSON.stringify(char, null, 2));
    return char;
  }

  async updateCharacter(id: string, updates: Partial<Character>): Promise<Character> {
    const charDir = path.join(this.charactersDir, id);
    const charPath = path.join(charDir, "character.json");
    const existing = JSON.parse(await this.fs.readFile(charPath, "utf-8"));
    const updated = { ...existing, ...updates, modified_at: Date.now() };
    await this.fs.writeFile(charPath, JSON.stringify(updated, null, 2));
    return updated;
  }

  async deleteCharacter(id: string) {
    await this.fs.rm(path.join(this.charactersDir, id), { recursive: true, force: true });
  }

  async saveAvatar(id: string, buffer: Buffer): Promise<string> {
    const charDir = path.join(this.charactersDir, id);
    await this.fs.writeFile(path.join(charDir, "avatar.png"), buffer);
    return `/api/characters/${id}/avatar.png`;
  }

  // --- Chats ---

  private parseChatJsonl(content: string): Chat {
    const lines = content.trim().split("\n");
    const metadata = JSON.parse(lines[0]);
    const globals = JSON.parse(lines[1]);
    const messages = lines.slice(2).map((l) => JSON.parse(l));
    return { ...metadata, globals, messages };
  }

  private serializeChatJsonl(chat: Chat): string {
    const { id, character_id, title, fork_of, created_at, modified_at, globals, messages } = chat;
    const metadata = { id, character_id, title, fork_of, created_at, modified_at };
    const lines = [JSON.stringify(metadata), JSON.stringify(globals), ...messages.map((m) => JSON.stringify(m))];
    return lines.join("\n");
  }

  async findChatPath(chatId: string): Promise<string | null> {
    const charDirs = await this.fs.readdir(this.charactersDir);
    for (const charId of charDirs) {
      const chatPath = path.join(this.charactersDir, charId, "chats", `${chatId}.jsonl`);
      try {
        await this.fs.access(chatPath);
        return chatPath;
      } catch {}
    }
    return null;
  }

  async getChat(id: string): Promise<Chat | null> {
    const chatPath = await this.findChatPath(id);
    if (!chatPath) return null;
    return this.parseChatJsonl(await this.fs.readFile(chatPath, "utf-8"));
  }

  async getCharacterChatsMetadata(charId: string): Promise<ChatMetadata[]> {
    const charChatsDir = path.join(this.charactersDir, charId, "chats");
    const metadata: ChatMetadata[] = [];
    try {
      const files = await this.fs.readdir(charChatsDir);
      for (const file of files) {
        if (!file.endsWith(".jsonl")) continue;
        const filePath = path.join(charChatsDir, file);
        const rl = readline.createInterface({ input: this.fs.createReadStream(filePath), crlfDelay: Infinity });
        for await (const line of rl) {
          try { metadata.push(JSON.parse(line)); } catch {}
          rl.close();
          break;
        }
      }
    } catch {}
    return metadata;
  }

  async createChat(data: Partial<Chat>): Promise<Chat> {
    const chat: Chat = {
      id: uuidv4(),
      character_id: data.character_id || "__system__",
      globals: data.globals || {},
      messages: data.messages || [],
      created_at: Date.now(),
      modified_at: Date.now(),
      ...data,
    };
    const charChatsDir = path.join(this.charactersDir, chat.character_id, "chats");
    await this.fs.mkdir(charChatsDir, { recursive: true });
    await this.fs.writeFile(path.join(charChatsDir, `${chat.id}.jsonl`), this.serializeChatJsonl(chat));
    return chat;
  }

  async updateChat(id: string, updates: Partial<Chat>): Promise<Chat | null> {
    const chatPath = await this.findChatPath(id);
    if (!chatPath) return null;

    const existing = this.parseChatJsonl(await this.fs.readFile(chatPath, "utf-8"));
    const updated = { ...existing, ...updates, modified_at: Date.now() };

    if (updates.character_id && updates.character_id !== existing.character_id) {
      const newCharChatsDir = path.join(this.charactersDir, updates.character_id, "chats");
      await this.fs.mkdir(newCharChatsDir, { recursive: true });
      await this.fs.writeFile(path.join(newCharChatsDir, `${id}.jsonl`), this.serializeChatJsonl(updated));
      await this.fs.unlink(chatPath);
    } else {
      await this.fs.writeFile(chatPath, this.serializeChatJsonl(updated));
    }
    return updated;
  }

  async deleteChat(id: string) {
    const chatPath = await this.findChatPath(id);
    if (chatPath) await this.fs.unlink(chatPath);
  }

  // --- Generic Helpers ---
  
  getAvatarPath(charId: string): string {
    return path.join(this.charactersDir, charId, "avatar.png");
  }

  async checkFileExists(filePath: string): Promise<boolean> {
    try {
      await this.fs.access(filePath);
      return true;
    } catch { return false; }
  }
}