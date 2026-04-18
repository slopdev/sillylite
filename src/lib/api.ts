import type { Character, Chat, ChatMetadata, GlobalConfig, LMConfig } from "../types";

export const api = {
  async getCharacters(): Promise<Character[]> {
    const res = await fetch("/api/characters");
    return res.json();
  },
  async createCharacter(char: Partial<Character>): Promise<Character> {
    const res = await fetch("/api/characters", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(char),
    });
    return res.json();
  },
  async updateCharacter(id: string, char: Partial<Character>): Promise<Character> {
    const res = await fetch(`/api/characters/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(char),
    });
    return res.json();
  },
  async deleteCharacter(id: string): Promise<void> {
    await fetch(`/api/characters/${id}`, { method: "DELETE" });
  },
  async getChats(): Promise<Chat[]> {
    const res = await fetch("/api/chats");
    return res.json();
  },
  async getChat(id: string): Promise<Chat> {
    const res = await fetch(`/api/chats/${id}`);
    return res.json();
  },
  async getCharacterChatsMetadata(characterId: string): Promise<ChatMetadata[]> {
    const res = await fetch(`/api/characters/${characterId}/chats`);
    return res.json();
  },
  async createChat(chat: Partial<Chat>): Promise<Chat> {
    const res = await fetch("/api/chats", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(chat),
    });
    return res.json();
  },
  async updateChat(id: string, chat: Partial<Chat>): Promise<Chat> {
    const res = await fetch(`/api/chats/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(chat),
    });
    return res.json();
  },
  async deleteChat(id: string): Promise<void> {
    await fetch(`/api/chats/${id}`, { method: "DELETE" });
  },
  async getConfig(): Promise<GlobalConfig> {
    const res = await fetch("/api/config");
    return res.json();
  },
  async updateConfig(config: GlobalConfig): Promise<void> {
    await fetch("/api/config", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(config),
    });
  },
  async importCharacter(file: File): Promise<Character> {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/import/character", {
      method: "POST",
      body: formData,
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
};
