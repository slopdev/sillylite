import React, { useState, useEffect, useCallback } from "react";
import { api } from "./lib/api";
import type { Char2ChatIndex, Character, Chat, ChatMetadata, GlobalConfig, LMConfig, Message } from "./types";
import { Sidebar } from "./components/sidebar/Sidebar";
import { ChatWindow } from "./components/ChatWindow";
import { Settings } from "./components/settings/Settings";
import { MessageSquare } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";


export default function App() {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [chatIndex, setChatIndex] = useState<Char2ChatIndex>({});
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [config, setConfig] = useState<GlobalConfig>({ lm_config: [] });
  const [showSettings, setShowSettings] = useState(false);
  const [loading, setLoading] = useState(true);

  const activeCharacter = characters.find(c => c.id === "__system__");

  // init
  useEffect(() => {
    async function init() {
      try {
        const [chars, cfg] = await Promise.all([
          api.getCharacters(),
          api.getConfig()
        ]);
        
        // Ensure system character exists
        if (!chars.find(c => c.id === "__system__")) {
          const systemChar = await api.createCharacter({
            id: "__system__",
            name: "System",
            globals: { description: "Default system character" }
          });
          chars.push(systemChar);
        }

        const index: Char2ChatIndex = {};
        await Promise.all(
          chars.map(async (char) => {
            index[char.id] = await api.getCharacterChatsMetadata(char.id);
          })
        );

        setCharacters(chars);
        setChatIndex(index);
        setConfig(cfg);
        
      } catch (e) {
        console.error("[app init] Failed to initialize data", e);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  // --------------------------------------------------

  const handleUpdateConfig = (cfgChange: Partial<GlobalConfig>, write: boolean) => {
    const cfg = { ...config, ...cfgChange }
    setConfig(cfg);

    if (write){
      api.updateConfig({ lm_config: cfg.lm_config});
    }
  }

  const handleCreateChat = async (characterId: string = "__system__") => {
    const newChat = await api.createChat({
      character_id: characterId,
      title: "New Chat",
      messages: []
    });
    
    setChatIndex(prev => ({
      ...prev,
      [characterId]: [
        {
          id: newChat.id,
          character_id: newChat.character_id,
          title: newChat.title,
          created_at: newChat.created_at,
          modified_at: newChat.modified_at,
        },
        ...(prev[characterId] || []),
      ],
    }));
    setActiveChatId(newChat.id);
  };

  const handleUpdateChatMetadata = async (id: string, updates: Partial<ChatMetadata>) => {
    const updated = await api.updateChat(id, updates);
    
    // for now, keep this for legacy reasons
    // setChats(prev => prev.map(c => c.id === id ? updated : c));

    setChatIndex(prev => {
      const currentCharId = Object.keys(prev).find(key => prev[key].some(c => c.id === id));
      if (!currentCharId) return prev;

      const metadata: ChatMetadata = {
        id: updated.id,
        character_id: updated.character_id,
        title: updated.title,
        created_at: updated.created_at,
        modified_at: updated.modified_at,
      };

      // If the chat was moved to a different character, update both buckets
      if (currentCharId !== updated.character_id) {
        return {
          ...prev,
          [currentCharId]: prev[currentCharId].filter(c => c.id !== id),
          [updated.character_id]: [metadata, ...(prev[updated.character_id] || [])]
        };
      }

      // Otherwise, update the metadata in place within the current bucket
      return {
        ...prev,
        [currentCharId]: prev[currentCharId].map(c => c.id === id ? metadata : c)
      };
    });
  };

  const handleDeleteChat = async (id: string) => {
    await api.deleteChat(id);
    
    // Update chatIndex by finding the character bucket containing this chat ID
    setChatIndex(prev => {
      const charId = Object.keys(prev).find(key => prev[key].some(c => c.id === id));
      if (!charId) return prev;
      return {
        ...prev,
        [charId]: prev[charId].filter(c => c.id !== id)
      };
    });

    // if (activeChatId === id) setActiveChatId(chats.find(c => c.id !== id)?.id || null);
    setActiveChatId(null);
  };

  const handleUpdateCharacter = async (id: string, updates: Partial<Character>) => {
    const updated = await api.updateCharacter(id, updates);
    setCharacters(prev => prev.map(c => c.id === id ? updated : c));
  };

  const handleCreateCharacter = async () => {
    const newChar = await api.createCharacter({ name: "New Character" });
    setCharacters(prev => [...prev, newChar]);
  };

  const handleDeleteCharacter = async (id: string) => {
    if (id === "__system__") return;
    await api.deleteCharacter(id);
    setCharacters(prev => prev.filter(c => c.id !== id));
  };

  const handleImportCharacter = async (file: File) => {
    try {
      const newChar = await api.importCharacter(file);
      setCharacters(prev => [...prev, newChar]);
    } catch (e) {
      alert(`Import failed: ${e instanceof Error ? e.message : String(e)}`);
    }
  };

  const handleFork = async (chat: Chat | null, index: number) => {
    if (!chat) return;
    const newChat = await api.createChat({
      character_id: chat.character_id,
      title: `${chat.title || "Chat"} (Fork)`,
      messages: chat.messages.slice(0, index + 1),
      fork_of: { chat_id: chat.id, message_index: index }
    });

    setChatIndex(prev => ({
      ...prev,
      [newChat.character_id]: [
        {
          id: newChat.id,
          character_id: newChat.character_id,
          title: newChat.title,
          created_at: newChat.created_at,
          modified_at: newChat.modified_at,
        },
        ...(prev[newChat.character_id] || []),
      ],
    }));

    setActiveChatId(newChat.id);
  }

  // --------------------------------------------------

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#E4E3E0] font-mono">
        <motion.div
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
        >
          LOADING_SYSTEM...
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#E4E3E0] text-[#141414] font-sans selection:bg-[#141414] selection:text-[#E4E3E0]">
      <Sidebar
        characters={characters}
        chatIndex={chatIndex}
        activeChatId={activeChatId}
        onSelectChat={setActiveChatId}
        onCreateChat={handleCreateChat}
        onDeleteChat={handleDeleteChat}
        onCreateCharacter={handleCreateCharacter}
        onUpdateCharacter={handleUpdateCharacter}
        onDeleteCharacter={handleDeleteCharacter}
        onImportCharacter={handleImportCharacter}
        onShowSettings={() => setShowSettings(true)}
      />

      <main className="flex-1 flex flex-col relative overflow-hidden border-l border-[#141414]">
        {activeChatId ? (
          <ChatWindow
            chatId={activeChatId}
            character={activeCharacter!}
            onUpdateChatMetadata={handleUpdateChatMetadata}
            onDeleteChat={handleDeleteChat}
            onForkChat={handleFork}
            config={config}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center opacity-30">
            <MessageSquare size={64} strokeWidth={1} />
            <p className="mt-4 font-mono text-sm">SELECT_OR_CREATE_CHAT</p>
          </div>
        )}

        <AnimatePresence>
          {showSettings && (
            <Settings
              config={config}
              onUpdateConfig={handleUpdateConfig}
              onClose={() => setShowSettings(false)}
            />
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
