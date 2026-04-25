import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs/promises";
import { createReadStream } from "fs";
import readline from "readline";
import { fileURLToPath } from "url";
import { v4 as uuidv4 } from "uuid";
import multer from "multer";
import { PNG } from "pngjs";
import type { Character, Chat, ChatMetadata, GlobalConfig } from "./src/types";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, "data");
const CHARACTERS_DIR = path.join(DATA_DIR, "characters");
const CONFIG_FILE = path.join(DATA_DIR, "config.json");
const DEFAULT_CONFIG: GlobalConfig = {
  lm_config: {}
};

async function ensureDirs() {
  await fs.mkdir(CHARACTERS_DIR, { recursive: true });
  try {
    await fs.access(CONFIG_FILE);
  } catch {
    await fs.writeFile(CONFIG_FILE, JSON.stringify(DEFAULT_CONFIG, null, 2));
  }
}

const upload = multer({ storage: multer.memoryStorage() });

// TODO: this will be inefficient with many chats. deprecate eventually
async function findChatPath(chatId: string): Promise<string | null> {
  try {
    const charDirs = await fs.readdir(CHARACTERS_DIR);
    for (const charId of charDirs) {
      const chatPath = path.join(CHARACTERS_DIR, charId, "chats", `${chatId}.jsonl`);
      try {
        await fs.access(chatPath);
        return chatPath;
      } catch {}
    }
  } catch (e) {
    console.error("Error searching for chat path", e);
  }
  return null;
}

// old format
function parseChatJsonl(content: string): Chat {
  const lines = content.trim().split("\n");
  const metadata = JSON.parse(lines[0]);
  const globals = JSON.parse(lines[1]);
  const messages = lines.slice(2).map((l) => JSON.parse(l));
  return { ...metadata, globals, messages };
}

// old format
function serializeChatJsonl(chat: Chat): string {
  const { id, character_id, title, fork_of, created_at, modified_at, globals, messages } = chat;
  const metadata = { id, character_id, title, fork_of, created_at, modified_at };
  const lines = [JSON.stringify(metadata), JSON.stringify(globals), ...messages.map((m) => JSON.stringify(m))];
  return lines.join("\n");
}

async function startServer() {
  await ensureDirs();

  const app = express();
  app.use(express.json({ limit: "50mb" }));

  // API Routes
  app.get("/api/characters", async (req, res) => {
    const dirs = await fs.readdir(CHARACTERS_DIR);
    const characters: Character[] = [];
    for (const id of dirs) {
      try {
        const charData = await fs.readFile(path.join(CHARACTERS_DIR, id, "character.json"), "utf-8");
        characters.push(JSON.parse(charData));
      } catch (e) {
        console.error(`Failed to read character ${id}`, e);
      }
    }
    res.json(characters);
  });

  app.post("/api/characters", async (req, res) => {
    const char: Character = {
      id: uuidv4(),
      name: req.body.name || "New Character",
      globals: req.body.globals || {},
      created_at: Date.now(),
      modified_at: Date.now(),
      ...req.body,
    };
    const charDir = path.join(CHARACTERS_DIR, char.id);
    await fs.mkdir(charDir, { recursive: true });
    await fs.writeFile(path.join(charDir, "character.json"), JSON.stringify(char, null, 2));
    res.json(char);
  });

  app.put("/api/characters/:id", async (req, res) => {
    const charDir = path.join(CHARACTERS_DIR, req.params.id);
    const charPath = path.join(charDir, "character.json");
    const existing = JSON.parse(await fs.readFile(charPath, "utf-8"));
    const updated = { ...existing, ...req.body, modified_at: Date.now() };
    await fs.writeFile(charPath, JSON.stringify(updated, null, 2));
    res.json(updated);
  });

  app.delete("/api/characters/:id", async (req, res) => {
    await fs.rm(path.join(CHARACTERS_DIR, req.params.id), { recursive: true, force: true });
    res.json({ success: true });
  });

  // get all chats
  app.get("/api/chats", async (req, res) => {
    const charDirs = await fs.readdir(CHARACTERS_DIR);
    const chats: Chat[] = [];
    for (const charId of charDirs) {
      const charChatsDir = path.join(CHARACTERS_DIR, charId, "chats");
      try {
        const files = await fs.readdir(charChatsDir);
        for (const file of files) {
          if (!file.endsWith(".jsonl")) continue;
          try {
            chats.push(parseChatJsonl(await fs.readFile(path.join(charChatsDir, file), "utf-8")));
          } catch (e) {
            console.error(`Failed to read chat ${file}`, e);
          }
        }
      } catch {}
    }
    res.json(chats);
  });

  app.get("/api/chats/:id", async (req, res) => {
    const chatPath = await findChatPath(req.params.id);
    if (!chatPath) return res.status(404).json({ error: "Chat not found" });
    res.json(parseChatJsonl(await fs.readFile(chatPath, "utf-8")));
  });

  // retrieve chat metadata by char id
  app.get("/api/characters/:id/chats", async (req, res) => {
    const charId = req.params.id;
    const charChatsDir = path.join(CHARACTERS_DIR, charId, "chats");
    const metadata: ChatMetadata[] = [];

    try {
      const files = await fs.readdir(charChatsDir);
      for (const file of files) {
        if (!file.endsWith(".jsonl")) continue;
        const filePath = path.join(charChatsDir, file);

        const fileStream = createReadStream(filePath);
        const rl = readline.createInterface({
          input: fileStream,
          crlfDelay: Infinity,
        });

        for await (const line of rl) {
          try {
            metadata.push(JSON.parse(line));
          } catch (e) {}
          rl.close();
          break; // Stop after reading the first line (metadata)
        }
      }
    } catch (e) {}
    res.json(metadata);
  });

  app.post("/api/chats", async (req, res) => {
    const chat: Chat = {
      id: uuidv4(),
      character_id: req.body.character_id || "__system__",
      globals: req.body.globals || {},
      messages: req.body.messages || [],
      created_at: Date.now(),
      modified_at: Date.now(),
      ...req.body,
    };
    const charChatsDir = path.join(CHARACTERS_DIR, chat.character_id, "chats");
    await fs.mkdir(charChatsDir, { recursive: true });
    await fs.writeFile(path.join(charChatsDir, `${chat.id}.jsonl`), serializeChatJsonl(chat));
    res.json(chat);
  });

  // updateChat
  app.put("/api/chats/:id", async (req, res) => {
    const chatPath = await findChatPath(req.params.id);
    if (!chatPath) return res.status(404).json({ error: "Chat not found" });

    console.log(chatPath);

    const existing = parseChatJsonl(await fs.readFile(chatPath, "utf-8"));
    const updated = { ...existing, ...req.body, modified_at: Date.now() };

    if (req.body.character_id && req.body.character_id !== existing.character_id) {
      const newCharChatsDir = path.join(CHARACTERS_DIR, req.body.character_id, "chats");
      await fs.mkdir(newCharChatsDir, { recursive: true });
      await fs.writeFile(path.join(newCharChatsDir, `${req.params.id}.jsonl`), serializeChatJsonl(updated));
      await fs.unlink(chatPath);
    } else {
      await fs.writeFile(chatPath, serializeChatJsonl(updated));
    }

    res.json(updated);
  });

  app.delete("/api/chats/:id", async (req, res) => {
    const chatPath = await findChatPath(req.params.id);
    if (chatPath) await fs.unlink(chatPath);
    res.json({ success: true });
  });

  app.get("/api/config", async (req, res) => {
    const config = JSON.parse(await fs.readFile(CONFIG_FILE, "utf-8"));
    res.json(config);
  });

  app.put("/api/config", async (req, res) => {
    await fs.writeFile(CONFIG_FILE, JSON.stringify(req.body, null, 2));
    res.json(req.body);
  });

  app.post("/api/import/character", upload.single("file"), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });
    
    try {
      let charData: any = null;
      if (req.file.mimetype === "application/json") {
        charData = JSON.parse(req.file.buffer.toString("utf-8"));
      } else if (req.file.mimetype === "image/png") {
        const png = PNG.sync.read(req.file.buffer);
        // Find tEXt chunks
        // pngjs doesn't expose chunks easily in sync mode, but we can try to find them
        // Actually, let's use a simpler approach for PNG chunks if possible or a different library
        // For now, let's assume JSON or standard PNG if I can find a better way.
        // Wait, I can use the 'pngjs' library to parse chunks.
        // Let's try to find 'chara' or 'ccv3' in the buffer.
        const buffer = req.file.buffer;
        let offset = 8; // Skip PNG signature
        while (offset < buffer.length) {
          const length = buffer.readUInt32BE(offset);
          const type = buffer.toString("ascii", offset + 4, offset + 8);
          if (type === "tEXt") {
            const data = buffer.toString("utf-8", offset + 8, offset + 8 + length);
            if (data.startsWith("chara\0")) {
              const base64Data = data.slice(6);
              charData = JSON.parse(Buffer.from(base64Data, "base64").toString("utf-8"));
              break;
            } else if (data.startsWith("ccv3\0")) {
              const base64Data = data.slice(5);
              charData = JSON.parse(Buffer.from(base64Data, "base64").toString("utf-8"));
              break;
            }
          }
          offset += length + 12; // length + type + data + crc
        }
      }

      if (!charData) throw new Error("Could not find character data in file");

      // Normalize to our Character format
      const char: Character = {
        id: uuidv4(),
        name: charData.data?.name || charData.name || "Imported Character",
        globals: {
          description: charData.data?.description || charData.description || "",
          personality: charData.data?.personality || charData.personality || "",
          scenario: charData.data?.scenario || charData.scenario || "",
          first_mes: charData.data?.first_mes || charData.first_mes || "",
          mes_example: charData.data?.mes_example || charData.mes_example || "",
        },
        created_at: Date.now(),
        modified_at: Date.now(),
        metadata: charData,
      };

      const charDir = path.join(CHARACTERS_DIR, char.id);
      await fs.mkdir(charDir, { recursive: true });
      await fs.writeFile(path.join(charDir, "character.json"), JSON.stringify(char, null, 2));
      
      if (req.file.mimetype === "image/png") {
        await fs.writeFile(path.join(charDir, "avatar.png"), req.file.buffer);
        char.avatar = `/api/characters/${char.id}/avatar.png`;
        await fs.writeFile(path.join(charDir, "character.json"), JSON.stringify(char, null, 2));
      }

      res.json(char);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/characters/:id/avatar.png", async (req, res) => {
    const avatarPath = path.join(CHARACTERS_DIR, req.params.id, "avatar.png");
    try {
      await fs.access(avatarPath);
      res.sendFile(avatarPath);
    } catch {
      res.status(404).send("Not found");
    }
  });

  // Vite middleware
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  const PORT = 3000;
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
