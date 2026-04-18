import React, { useState } from "react";
import type { Character } from "@/src/types";
import { X, Save, User } from "lucide-react";
import { motion } from "motion/react";

interface CharacterEditorProps {
  character: Character;
  onSave: (updates: Partial<Character>) => void;
  onClose: () => void;
}

export function CharacterEditor({ character, onSave, onClose }: CharacterEditorProps) {
  const [name, setName] = useState(character.name);
  const [globals, setGlobals] = useState(character.globals);

  const handleSave = () => {
    onSave({ name, globals });
    onClose();
  };

  const updateGlobal = (key: string, value: string) => {
    setGlobals(prev => ({ ...prev, [key]: value }));
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#141414]/80 p-4"
    >
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-[#E4E3E0] border border-[#141414] w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl"
      >
        <div className="p-4 border-b border-[#141414] flex items-center justify-between bg-white">
          <h2 className="font-mono font-bold uppercase tracking-widest">Character_Editor</h2>
          <button onClick={onClose} className="p-1 hover:bg-[#141414] hover:text-[#E4E3E0] transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          <div className="flex gap-6">
            <div className="w-32 h-32 bg-[#141414] flex items-center justify-center shrink-0">
              {character.avatar ? (
                <img src={character.avatar} alt="" className="w-full h-full object-cover" />
              ) : (
                <User size={48} className="text-[#E4E3E0]" />
              )}
            </div>
            <div className="flex-1 space-y-4">
              <div className="space-y-1">
                <label className="font-mono text-[10px] opacity-50 uppercase">Name</label>
                <input 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full text-sm p-2 border border-[#141414] focus:outline-none bg-white"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {["description", "personality", "scenario", "first_mes", "mes_example"].map(key => (
              <div key={key} className="space-y-1">
                <label className="font-mono text-[10px] opacity-50 uppercase">{key.replace("_", " ")}</label>
                <textarea 
                  value={String(globals[key] || "")}
                  onChange={(e) => updateGlobal(key, e.target.value)}
                  className="w-full text-xs p-2 border border-[#141414] focus:outline-none bg-white min-h-[80px] font-sans"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 border-t border-[#141414] bg-white flex justify-end">
          <button 
            onClick={handleSave}
            className="flex items-center gap-2 px-6 py-2 bg-[#141414] text-[#E4E3E0] font-mono text-sm hover:bg-[#141414]/90 transition-colors"
          >
            <Save size={18} /> SAVE_CHARACTER
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
