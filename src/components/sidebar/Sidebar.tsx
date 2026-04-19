import React, { useState } from "react";
import { Plus, Settings, Upload } from "lucide-react";
import type { Char2ChatIndex, Character, Chat, ChatMetadata } from "@/src/types";

import { CharacterEntry } from "./CharacterEntry";

interface SidebarProps {
  characters: Character[];
  chatIndex: Char2ChatIndex;
  activeChatId: string | null;
  onSelectChat: (id: string) => void;
  onCreateChat: (characterId?: string) => void;
  onDeleteChat: (id: string) => void;
  onCreateCharacter: () => void;
  onUpdateCharacter: (id: string, updates: Partial<Character>) => void;
  onDeleteCharacter: (id: string) => void;
  onImportCharacter: (file: File) => void;
  onShowSettings: () => void;
}

import { CharacterEditor } from "./CharacterEditor";
import { AnimatePresence } from "motion/react";

export function Sidebar({
  characters,
  chatIndex,
  activeChatId,
  onSelectChat,
  onCreateChat,
  onDeleteChat,
  onCreateCharacter,
  onUpdateCharacter,
  onDeleteCharacter,
  onImportCharacter,
  onShowSettings
}: SidebarProps) {
  const [expandedChars, setExpandedChars] = useState<Record<string, boolean>>({ "__system__": true });
  const [editingCharId, setEditingCharId] = useState<string | null>(null);

  const editingChar = characters.find(c => c.id === editingCharId);

  const toggleChar = (id: string) => {
    setExpandedChars(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onImportCharacter(file);
  };

  return (
    <div className="w-72 h-full flex flex-col bg-[#E4E3E0] border-r border-[#141414] overflow-hidden">
      <div className="p-4 border-bottom border-[#141414] flex items-center justify-between">
        <h1 className="font-mono font-bold text-lg tracking-tighter">SILLY_LITE</h1>
        <button 
          onClick={onShowSettings}
          className="btn-ico"
        >
          <Settings size={18} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="p-2 space-y-4">
          
          {/* characters */}
          <div className="characters-container">

            {/* character section header*/}
            <div className="flex items-center justify-between px-2 mb-2">
              <span className="font-mono text-[10px] opacity-50 uppercase tracking-widest">Characters</span>
              <div className="flex gap-1">
                <label className="btn-ico">
                  <Upload size={14} />
                  <input type="file" className="hidden" onChange={handleFileChange} accept=".json,.png" />
                </label>
                <button 
                  onClick={onCreateCharacter}
                  className="btn-ico"
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>
            
            {/* character entries */}
            <div className="character-entry-container space-y-1">
              {characters.map(char => (
                <CharacterEntry 
                  key={char.id}
                  character={char}
                  chats={chatIndex[char.id]}
                  activeChatId={activeChatId}
                  onSelectChat={onSelectChat}
                  onCreateChat={onCreateChat}
                  onDeleteChat={onDeleteChat}
                  onEditChar={setEditingCharId}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {editingChar && (
          <CharacterEditor
            character={editingChar}
            onSave={(updates) => onUpdateCharacter(editingChar.id, updates)}
            onClose={() => setEditingCharId(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
