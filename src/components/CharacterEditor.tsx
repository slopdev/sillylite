import React, { useState } from "react";
import type { Character } from "@/src/types";
import { X, Save, Trash2, User } from "lucide-react";
import { motion } from "motion/react";

interface CharacterEditorProps {
  character: Character;
  onSave: (updates: Partial<Character>) => void;
  onClose: () => void;
  onDeleteCharacter: (id: string) => void;
}

export function CharacterEditor({ character, onSave, onClose, onDeleteCharacter }: CharacterEditorProps) {
  const [name, setName] = useState(character.name);
  const [globals, setGlobals] = useState(character.globals);

  const handleSave = () => {
    onSave({ name, globals });
    onClose();
  };

  const handleDelete = () => {
    onDeleteCharacter(character.id);
    onClose();
  }

  const updateGlobal = (key: string, value: string) => {
    setGlobals(prev => ({ ...prev, [key]: value }));
  };

  // --------------------------------------------------

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="char-editor-overlay"
    >
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="char-editor-modal"
      >
        <div className="char-editor-header">
          <h2 className="char-editor-title">Character_Editor</h2>
          <button onClick={onClose} className="char-editor-close">
            <X size={20} />
          </button>
        </div>

        <div className="char-editor-body custom-scrollbar">
          <div style={{ display: 'flex', gap: '1.5rem' }}>
            <div className="char-editor-avatar-box">
              {character.avatar ? (
                <img src={character.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <User size={48} style={{ color: 'var(--hl-bg1)' }} />
              )}
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="char-editor-field">
                <label className="char-editor-label">Name</label>
                <input 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="char-editor-input"
                />
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {["description", "personality", "scenario", "first_mes", "mes_example"].map(key => (
              <div key={key} className="char-editor-field">
                <label className="char-editor-label">{key.replace("_", " ")}</label>
                <textarea 
                  value={String(globals[key] || "")}
                  onChange={(e) => updateGlobal(key, e.target.value)}
                  className="char-editor-textarea"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="char-editor-footer">
          <button 
            onClick={handleDelete}
            className="btn-ico"
          >
            <Trash2 size={18} /> 
          </button>
          <button 
            onClick={handleSave}
            className="btn-rect u-ml-auto"
          >
            <Save size={18} /> SAVE_CHARACTER
          </button>

        </div>
      </motion.div>
    </motion.div>
  );
}
