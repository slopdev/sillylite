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
      "sidebar",
      isCollapsed && "sidebar--collapsed"
    )}>
      <div className={cn(
        "sidebar__header",
        isCollapsed && "sidebar__header--collapsed"
      )}>
        {!isCollapsed && <h1 className="sidebar__logo">SILLY_LITE</h1>}
        <div className={cn("sidebar__actions", isCollapsed && "sidebar__actions--collapsed")}>
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
        "sidebar__content custom-scrollbar",
        isCollapsed && "sidebar__content--collapsed"
      )}>
        <div className="sidebar__inner">
          
          {/* characters */}
          <div className="sidebar__section">

            {/* character section header*/}
            <div className="sidebar__section-header">
              <span className="sidebar__section-label">Characters</span>
              <div className="sidebar__section-actions">
                <label className="btn-ico">
                  <Upload size={14} />
                  <input type="file" className="u-hidden" onChange={handleFileChange} accept=".json,.png" />
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
            <div className="sidebar__list">
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
