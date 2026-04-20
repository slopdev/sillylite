import React, { useState, useRef, useEffect } from "react";
import { MessageItem } from "./MessageItem";
import { Send, RotateCcw, Trash2 } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import { motion, AnimatePresence } from "motion/react";
import e from "express";

import type { Chat, Character, Message, LMConfig, Swipe, ChatMetadata } from "../types";
import { applyStdFormatter } from "../lib/formatter";
import { flattenChat } from "../lib/utils";
import { adaptersRegistry } from "../lib/adapters";
import { api } from "../lib/api";

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

function _wrapContainer(Component: React.ReactNode): React.ReactNode{
    return (
      <div className="chat-window-container h-full">
        {Component}
      </div>
    );
}

// --------------------------------------------------

interface ChatWindowProps {
  chatId: string;
  character: Character;
  onUpdateChatMetadata: (id: string, updates: Partial<ChatMetadata>) => void;
  onDeleteChat: (id: string) => void;
  onForkChat: (id: Chat | null, index: number) => void;
  config: { lm_config: LMConfig[] };
}


export function ChatWindow({ 
  character,
  chatId,

  // callbacks
  onUpdateChatMetadata,
  onDeleteChat,
  onForkChat,
  config 
}: ChatWindowProps) {
  const [input, setInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [chatTitle, setChatTitle] = useState("");
  const [chat, setChat] = useState<Chat | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null);

  // TODO: get rid of hard-coded value
  const [activeAdapter, setActiveAdapter] = useState<LMConfig | null>(null);
  
  useEffect(() => {
    const newAdapter = config.lm_config?.[0] ?? null;
    setActiveAdapter(newAdapter);
  }, [config]);

  useEffect(() => {
    async function loadMessages() {
      setLoaded(false);
      // TODO: error handling
      let resChat = await api.getChat(chatId);
      console.log("[chat window] chat loaded", resChat);

      await sleep(500);   // simulate a slow load
      setChat(resChat);
      setChatTitle(resChat.title ?? "");
      setLoaded(true);
    }
    loadMessages();
  }, [chatId]);

  // --------------------------------------------------

  // short-circuits
  if (!loaded){
    return _wrapContainer((
      <div>
        loooooading
      </div>
    ))
  }
  
  if (chat === null){
    return _wrapContainer((
      <div>
        loaded flag set, but chat object isn't. idk how you got here.
      </div>
    ))
  }

  // TODO: write checkpoints for streaming responses
  // preparation for sparse msg updates
  const handleUpdateMsgs = async (updatedMessages: Message[], write: boolean = true) => {
    let chatUpdates = { messages: updatedMessages }
    if (write){
      const _updated = await api.updateChat(chatId, chatUpdates);
    }
    setChat({...chat, messages: updatedMessages});
  };

  const handleSend = async () => {
    if (!input.trim() || isGenerating) return;

    const userMsg: Message = {
      id: uuidv4(),
      role: "user",
      content: input.trim(),
      modified_at: Date.now(),
    };
    
    const updatedMessages = [...chat.messages, userMsg];
    handleUpdateMsgs(updatedMessages)
    setInput("");
    await generateResponse(updatedMessages);
  };

  // lm call for send message
  const generateResponse = async (messagesToLM: Message[], swipeIndex?: number) => {
    if (config.lm_config.length === 0 || activeAdapter === null) {
      alert("No LLM adapters configured. Go to Settings.");
      return;
    }

    setIsGenerating(true);

    const adapter = adaptersRegistry[activeAdapter.adapter_id] || adaptersRegistry.echo;
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    const assistantMsgId = uuidv4();
    const assistantMsg: Message = {
      id: assistantMsgId,
      role: "assistant",
      content: "",
      swipes: [],
      swipe_index: 0,
      modified_at: Date.now(),
    };

    // Swiping existing message
    let stagedMsgs = [...messagesToLM];
    const lastMsg = stagedMsgs[stagedMsgs.length - 1];
    if (swipeIndex !== undefined && lastMsg?.role === "assistant") {
      assistantMsg.id = lastMsg.id;
      assistantMsg.swipes = lastMsg.swipes || [];
      assistantMsg.swipe_index = assistantMsg.swipes.length;
      stagedMsgs = stagedMsgs.slice(0, -1);
    }

    // broadcast intermediate messages update
    handleUpdateMsgs([...stagedMsgs, assistantMsg]);

    try {

      // sampling
      let fullText = "";
      const flatChat = flattenChat({ ...chat, messages: stagedMsgs })
      const formatted = applyStdFormatter(flatChat, character.globals);
      for await (const chunk of adapter.complete(formatted, activeAdapter, abortController.signal)) {
        fullText += chunk.content;
        handleUpdateMsgs([...stagedMsgs, { ...assistantMsg, content: fullText }]);
      }

      // new objects
      const newSwipe: Swipe = {
        text: fullText,
        created_at: Date.now(),
        model: activeAdapter.model,
        api: activeAdapter.adapter_id
      };

      const finalAssistantMsg: Message = {
        ...assistantMsg,
        content: fullText,
        swipes: [...(assistantMsg.swipes || []), newSwipe],
        swipe_index: assistantMsg.swipes?.length || 0
      };

      handleUpdateMsgs([...stagedMsgs, finalAssistantMsg]);

    } catch (e: any) {
      if (e.name !== "AbortError") {
        console.error("Generation failed", e);
        alert(`Generation failed: ${e.message}`);
      }
    } finally {
      setIsGenerating(false);
      abortControllerRef.current = null;
    }
  };

  const handleStop = () => {
    abortControllerRef.current?.abort();
  };

  const handleAdapterSwitch = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = event.target.value;
    const selectedAdapter = config.lm_config.find((a) => a.id === selectedId) ?? null;
    setActiveAdapter(selectedAdapter);
  };

  const handleUpdateChatTitle = (newTitle: string) => {
    onUpdateChatMetadata(chat.id, { title: newTitle});
    setChatTitle(newTitle);
  };

  // --------------------------------------------------

  const adapterSwitcherContent = activeAdapter !== null ? (
    <div>
      <label htmlFor="adapter-select" className="sr-only">
        Select adapter
      </label>
      <select defaultValue={activeAdapter !== null ? activeAdapter.id : -1} name="adapter-select" id="adapter-select">
        {config.lm_config.map((a) => (
          <option value={a.id} key={a.id}>
            {a.label}
          </option>
        ))}
      </select>
    </div>
  ) : (
    <div>
      no adapters selected
    </div>
  )

  // --------------------------------------------------

  let layout = (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#E4E3E0]">
      {/* Header */}
      <div className="px-6 py-3 border-b border-[#141414] flex items-center justify-between bg-white/50">
        <div>
          <label htmlFor="chat-rename" className="sr-only">
            Rename chat title
          </label>
          <input 
            value={chatTitle || ""}
            onChange={(e) => handleUpdateChatTitle(e.target.value)}
            placeholder="Untitled Chat"
            className="font-bold text-sm bg-transparent border-none p-0 focus:ring-0 w-full"
            name="chat-rename"
            id="chat-rename"
          />
          <p className="text-[10px] font-mono opacity-50 uppercase tracking-tight">
            {character.name} / {chat.messages.length} MESSAGES
          </p>
        </div>

        {/* header right side */}
        <div className="flex gap-2">

          {adapterSwitcherContent}
          <button 
            onClick={() => onDeleteChat(chat.id)}
            className="p-1.5 hover:bg-red-500 hover:text-white transition-colors"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div 
        className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar"
      >
        <AnimatePresence initial={false}>
          {chat.messages.map((msg, idx) => (
            <MessageItem
              key={msg.id}
              message={msg}
              character={character}
              onUpdate={(updates) => {
                const newMsgs = [...chat.messages];
                newMsgs[idx] = { ...msg, ...updates };
                handleUpdateMsgs(newMsgs);
              }}
              onDelete={() => {
                handleUpdateMsgs(chat.messages.filter((_, i) => i !== idx));
              }}
              onRegenerate={() => generateResponse(chat.messages.slice(0, idx), idx)}
              onFork={() => onForkChat(chat, idx)}
            />
          ))}
        </AnimatePresence>
        {isGenerating && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex gap-2 items-center text-[10px] font-mono opacity-50"
          >
            <div className="w-1 h-1 bg-[#141414] animate-ping" />
            GENERATING_RESPONSE...
          </motion.div>
        )}
      </div>

      {/* Input */}
      <div className="p-6 border-t border-[#141414] bg-white/30">
        <div className="max-w-4xl mx-auto relative">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Type a message..."
            className="w-full bg-white border border-[#141414] p-4 pr-12 min-h-[100px] max-h-[300px] resize-none focus:outline-none focus:ring-1 focus:ring-[#141414] transition-all font-sans text-sm"
          />

          <div className="absolute right-3 bottom-3 flex gap-2">
            {isGenerating ? (
              <button 
                onClick={handleStop}
                className="p-2 bg-red-500 text-white hover:bg-red-600 transition-colors"
              >
                <RotateCcw size={18} className="animate-spin" />
              </button>
            ) : (
              <button 
                onClick={handleSend}
                disabled={!input.trim()}
                className="p-2 bg-[#141414] text-[#E4E3E0] hover:bg-[#141414]/90 disabled:opacity-30 transition-colors"
              >
                <Send size={18} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return _wrapContainer(layout);
}
