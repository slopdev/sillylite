import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import multer from "multer";
import { PNG } from "pngjs";
import { NodeFileSystem } from "@/src/server/FileSystem";
import { StorageService } from "@/src/server/services/StorageService";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, "data");

const upload = multer({ storage: multer.memoryStorage() });

async function startServer() {
  const storage = new StorageService(new NodeFileSystem(), DATA_DIR);
  await storage.ensureDirs();

  const app = express();
  app.use(express.json({ limit: "50mb" }));

  // API Routes
  app.get("/api/characters", async (req, res) => {
    res.json(await storage.getCharacters());
  });

  app.post("/api/characters", async (req, res) => {
    res.json(await storage.createCharacter(req.body));
  });

  app.put("/api/characters/:id", async (req, res) => {
    res.json(await storage.updateCharacter(req.params.id, req.body));
  });

  app.delete("/api/characters/:id", async (req, res) => {
    await storage.deleteCharacter(req.params.id);
    res.json({ success: true });
  });

  app.get("/api/chats/:id", async (req, res) => {
    const chat = await storage.getChat(req.params.id);
    if (!chat) return res.status(404).json({ error: "Chat not found" });
    res.json(chat);
  });

  app.get("/api/characters/:id/chats", async (req, res) => {
    res.json(await storage.getCharacterChatsMetadata(req.params.id));
  });

  app.post("/api/chats", async (req, res) => {
    res.json(await storage.createChat(req.body));
  });

  app.put("/api/chats/:id", async (req, res) => {
    const updated = await storage.updateChat(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: "Chat not found" });
    res.json(updated);
  });

  app.delete("/api/chats/:id", async (req, res) => {
    await storage.deleteChat(req.params.id);
    res.json({ success: true });
  });

  app.get("/api/config", async (req, res) => {
    res.json(await storage.getConfig());
  });

  app.put("/api/config", async (req, res) => {
    res.json(await storage.updateConfig(req.body));
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

      const char = await storage.createCharacter({
        name: charData.data?.name || charData.name || "Imported Character",
        globals: {
          description: charData.data?.description || charData.description || "",
          personality: charData.data?.personality || charData.personality || "",
          scenario: charData.data?.scenario || charData.scenario || "",
          first_mes: charData.data?.first_mes || charData.first_mes || "",
          mes_example: charData.data?.mes_example || charData.mes_example || ""
        },
        metadata: charData
      });

      if (req.file.mimetype === "image/png") {
        const avatarUrl = await storage.saveAvatar(char.id, req.file.buffer);
        await storage.updateCharacter(char.id, { avatar: avatarUrl });
      }

      res.json(await storage.updateCharacter(char.id, {})); // reload
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.get("/api/characters/:id/avatar.png", async (req, res) => {
    const avatarPath = storage.getAvatarPath(req.params.id);
    if (await storage.checkFileExists(avatarPath)) {
      res.sendFile(avatarPath);
    } else { res.status(404).send("Not found"); }
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
