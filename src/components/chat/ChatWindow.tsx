import React, { useState, useRef, useEffect } from "react";
import { MessageItem } from "./MessageItem";
import { Send, RotateCcw, Trash2 } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import { motion, AnimatePresence } from "motion/react";

import type { Chat, Character, Message, Swipe, ChatMetadata, GlobalConfig } from "../../types";
import { applyStdFormatter } from "../../lib/formatter";
import { flattenChat, objIsEmpty } from "../../lib/utils";
import { adaptersRegistry } from "../../lib/adapters";
import { api } from "../../lib/api";
import { ChatHeader } from "./ChatHeader";

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
const INVALID_ADAPTER_ID = "invalid_adapter_id_sentinel"

function _wrapContainer(Component: React.ReactNode): React.ReactNode{
    return (
      <div className="chat-window-container">
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
  config: GlobalConfig;
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
  const [activeAdapterId, setActiveAdapterId] = useState<string>(INVALID_ADAPTER_ID);
  const activeAdapter = config.lm_config[activeAdapterId] ?? null;

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
    if ( objIsEmpty(config.lm_config) || activeAdapter === null) {
      alert("No active adapter");
      return;
    }

    setIsGenerating(true);

    const adapter = adaptersRegistry[activeAdapter.adapter_kind] || adaptersRegistry.echo;
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
        api: activeAdapter.adapter_kind
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

  const handleAdapterSwitch = (selectedAdapterId: string) => {
    setActiveAdapterId(selectedAdapterId);
  };

  const handleUpdateChatTitle = (newTitle: string) => {
    onUpdateChatMetadata(chat.id, { title: newTitle});
    setChatTitle(newTitle);
  };

  // --------------------------------------------------

  let layout = (
    <div className="chat-window">
      <ChatHeader
        chat={chat}
        character={character}
        config={config}
        activeAdapterId={activeAdapterId}
        onAdapterSwitch={handleAdapterSwitch}
        onUpdateChatTitle={handleUpdateChatTitle}
        onDeleteChat={onDeleteChat}
      />

      {/* Messages */}
      <div className="chat-window__messages custom-scrollbar">
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
            className="chat-window__loading"
          >
            <div className="chat-window__loading-dot" />
            GENERATING_RESPONSE...
          </motion.div>
        )}
      </div>

      {/* Input */}
      <div className="chat-window__footer">
        <div className="chat-window__input-container">
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
            className="chat-window__input"
            style={{ width: '100%', boxSizing: 'border-box', flex: 1 }}
          />

          <div className="chat-window__input-actions">
            {isGenerating ? (
              <button 
                onClick={handleStop}
                className="chat-window__stop-btn"
              >
                <RotateCcw size={18} className="u-spin" />
              </button>
            ) : (
              <button 
                onClick={handleSend}
                disabled={!input.trim()}
                className="chat-window__send-btn"
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
