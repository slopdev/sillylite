import React, { useState } from "react";
import { Plus, Settings, Upload, ChevronsLeft, ChevronsRight } from "lucide-react";
import type { Char2ChatIndex, Character, Chat, ChatMetadata } from "@/src/types";
import { cn } from "@/src/lib/utils";
import { AnimatePresence } from "motion/react";

import { CharacterEntry } from "./CharacterEntry";
import { CharacterEditor } from "../CharacterEditor";

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
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [editingCharId, setEditingCharId] = useState<string | null>(null);
  const editingChar = characters.find(c => c.id === editingCharId);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onImportCharacter(file);
  };

  return (
    <div className={cn(
      "h-full flex flex-col bg-[#E4E3E0] border-r border-[#141414] overflow-hidden transition-all duration-300",
      isCollapsed ? "w-12" : "w-72"
    )}>
      <div className={cn(
        "p-4 border-bottom border-[#141414] flex items-center",
        isCollapsed ? "flex-col gap-4 px-0" : "justify-between"
      )}>
        {!isCollapsed && <h1 className="font-mono font-bold text-lg tracking-tighter">SILLY_LITE</h1>}
        <div className={cn("flex", isCollapsed ? "flex-col gap-4" : "gap-1")}>
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="btn-ico"
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? <ChevronsRight size={18} /> : <ChevronsLeft size={18} />}
          </button>
          <button 
            onClick={onShowSettings}
            className="btn-ico"
          >
            <Settings size={18} />
          </button>
        </div>
      </div>

      <div className={cn(
        "flex-1 overflow-y-auto custom-scrollbar transition-all duration-300",
        isCollapsed ? "opacity-0 pointer-events-none" : "opacity-100"
      )}>
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
            onDeleteCharacter={onDeleteCharacter}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
