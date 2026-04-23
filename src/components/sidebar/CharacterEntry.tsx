
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
          "character-entry__header",
          expanded && "character-entry__header--expanded"
        )}
        onClick={toggleExpanded}
      >
        {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}

        {/* avatar thumbnail */}
        <div 
          className="character-entry__avatar"
          onClick={(e) => { e.stopPropagation(); onEditChar(character.id); }}
        >
          {character.avatar ? (
            <img src={character.avatar} alt="" className="w-full h-full object-cover" />
          ) : (
            <User size={12} className="text-[#E4E3E0]" />
          )}
        </div>

        <span className="character-entry__name">{character.name}</span>
        <button 
          onClick={(e) => { e.stopPropagation(); onCreateChat(character.id); }}
          className="btn-ico"
        >
          <Plus size={12} />
        </button>
      </div>

      {expanded && (
        <div className="character-entry__chats">
          {chats.filter(c => c.character_id === character.id).map(chat => (
            <div 
              key={chat.id}
              className={cn(
                "chat-entry",
                activeChatId === chat.id && "chat-entry--active"
              )}
              onClick={() => onSelectChat(chat.id)}
            >
              <MessageSquare size={12} className="chat-entry__icon" />
              <span className="chat-entry__title">{chat.title || "Untitled Chat"}</span>
              <button 
                onClick={(e) => { e.stopPropagation(); onDeleteChat(chat.id); }}
                className="chat-entry__delete"
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