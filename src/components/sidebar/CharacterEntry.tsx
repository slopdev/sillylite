
import React, { useState } from "react";
import { Plus, MessageSquare, User, Settings, Trash2, ChevronRight, ChevronDown, Upload } from "lucide-react";
import type { Character, Chat, ChatMetadata } from "@/src/types";
import { cn } from "@/src/lib/utils";

interface CharacterEntryProps{
  character: Character;
  chats: ChatMetadata[];
  activeChatId: string | null;
  onSelectChat: (id: string) => void;
  onCreateChat: (characterId?: string) => void;
  onDeleteChat: (id: string) => void;
  onEditChar: (id: string | null) => void;
}

export function CharacterEntry({
  character,
  chats,
  activeChatId,
  onSelectChat,
  onCreateChat,
  onDeleteChat,
  onEditChar
}: CharacterEntryProps){

  const [expanded, setExpanded] = useState<boolean>(false)
  const toggleExpanded = () => setExpanded(prev => !prev); 

  return (
    <div key={character.id} className="character-entry group">
      <div 
        className={cn(
          "flex items-center gap-2 px-2 py-1.5 cursor-pointer hover:bg-[#141414]/5 transition-colors",
          expanded && "bg-[#141414]/5"
        )}
        onClick={toggleExpanded}
      >
        {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}

        {/* avatar thumbnail */}
        <div 
          className="w-6 h-6 bg-[#141414] flex items-center justify-center overflow-hidden cursor-pointer hover:opacity-80"
          onClick={(e) => { e.stopPropagation(); onEditChar(character.id); }}
        >
          {character.avatar ? (
            <img src={character.avatar} alt="" className="w-full h-full object-cover" />
          ) : (
            <User size={12} className="text-[#E4E3E0]" />
          )}
        </div>

        <span className="flex-1 truncate text-sm font-medium">{character.name}</span>
        <button 
          onClick={(e) => { e.stopPropagation(); onCreateChat(character.id); }}
          className="btn-ico"
        >
          <Plus size={12} />
        </button>
      </div>

      {expanded && (
        <div className="ml-6 mt-1 space-y-0.5 border-l border-[#141414]/20">
          {chats.filter(c => c.character_id === character.id).map(chat => (
            <div 
              key={chat.id}
              className={cn(
                "group/chat flex items-center gap-2 px-3 py-1.5 cursor-pointer text-sm transition-colors",
                activeChatId === chat.id ? "bg-[#141414] text-[#E4E3E0]" : "hover:bg-[#141414]/10"
              )}
              onClick={() => onSelectChat(chat.id)}
            >
              <MessageSquare size={12} className={activeChatId === chat.id ? "opacity-100" : "opacity-40"} />
              <span className="flex-1 truncate">{chat.title || "Untitled Chat"}</span>
              <button 
                onClick={(e) => { e.stopPropagation(); onDeleteChat(chat.id); }}
                className="opacity-0 group-hover/chat:opacity-100 p-1 hover:bg-red-500 hover:text-white transition-all"
              >
                <Trash2 size={10} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}