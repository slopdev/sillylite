import React, { useState } from "react";
import type { GlobalConfig, LMConfig } from "@/src/types";
import { X, Plus, Trash2, Save } from "lucide-react";
import { motion } from "motion/react";
import { v4 as uuidv4 } from "uuid";

interface AdapterSettingsProps {
  config: LMConfig[];
  onUpdateConfig: (config: Partial<GlobalConfig>) => void;
}

export function AdapterSettings({
  config,
  onUpdateConfig,
}: AdapterSettingsProps) {
  const [adapters, setAdapters] = useState<LMConfig[]>(config);

  const handleAdd = () => {
    const newAdapter: LMConfig = {
      id: uuidv4(),
      adapter_id: "openai",
      label: "New OpenAI Adapter",
      endpoint: "https://api.openai.com/v1",
      apiKey: "",
      model: "gpt-3.5-turbo",
      parameters: { temperature: 0.7 }
    };
    const adaptersNew = [...adapters, newAdapter];
    setAdapters(adaptersNew);
    onUpdateConfig({ lm_config: adaptersNew });
  };

  const handleUpdate = (idx: number, updates: Partial<LMConfig>) => {
    const next = [...adapters];
    next[idx] = { ...next[idx], ...updates };
    setAdapters(next);
    onUpdateConfig({ lm_config: next });
  };

  const handleRemove = (idx: number) => {
    const adaptersNew = adapters.filter((_, i) => i !== idx);
    setAdapters(adaptersNew);
    onUpdateConfig({ lm_config: adaptersNew });
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
      <section>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-mono text-xs opacity-50 uppercase tracking-widest">LLM Adapters</h3>
          <button 
            onClick={handleAdd}
            className="flex items-center gap-2 px-3 py-1 bg-[#141414] text-[#E4E3E0] text-xs font-mono hover:bg-[#141414]/90 transition-colors"
          >
            <Plus size={14} /> ADD_ADAPTER
          </button>
        </div>

        <div className="space-y-4">
          {adapters.map((adapter, idx) => (
            <div key={idx} className="p-4 border border-[#141414] bg-white space-y-4">
              <div className="flex items-center justify-between">
                <div className="font-bold text-sm uppercase tracking-widest font-mono">
                  {adapter.label} ADAPTER
                </div>
                <button onClick={() => handleRemove(idx)} className="text-red-500 hover:bg-red-50 p-1">
                  <Trash2 size={16} />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-mono text-[10px] opacity-50 uppercase">Type</label>
                  <select 
                    value={adapter.id}
                    onChange={(e) => handleUpdate(idx, { id: e.target.value })}
                    className="w-full text-xs p-2 border border-[#141414] focus:outline-none bg-white"
                  >
                    <option value="openai">OpenAI / Compatible</option>
                    <option value="gemini">Google Gemini</option>
                    <option value="echo">Echo (Test)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-mono text-[10px] opacity-50 uppercase">Label</label>
                  <input 
                    value={adapter.label}
                    onChange={(e) => handleUpdate(idx, { label: e.target.value })}
                    className="w-full text-xs p-2 border border-[#141414] focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-mono text-[10px] opacity-50 uppercase">Endpoint</label>
                  <input 
                    value={adapter.endpoint}
                    onChange={(e) => handleUpdate(idx, { endpoint: e.target.value })}
                    className="w-full text-xs p-2 border border-[#141414] focus:outline-none"
                    placeholder={adapter.id === "gemini" ? "Not needed" : "https://..."}
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-mono text-[10px] opacity-50 uppercase">Model</label>
                  <input 
                    value={adapter.model}
                    onChange={(e) => handleUpdate(idx, { model: e.target.value })}
                    className="w-full text-xs p-2 border border-[#141414] focus:outline-none"
                  />
                </div>
                <div className="space-y-1 col-span-2">
                  <label className="font-mono text-[10px] opacity-50 uppercase">API Key</label>
                  <input 
                    type="password"
                    value={adapter.apiKey}
                    onChange={(e) => handleUpdate(idx, { apiKey: e.target.value })}
                    className="w-full text-xs p-2 border border-[#141414] focus:outline-none"
                  />
                </div>
              </div>
            </div>
          ))}
          {adapters.length === 0 && (
            <div className="text-center py-8 border border-dashed border-[#141414]/30 font-mono text-xs opacity-40">
              NO_ADAPTERS_CONFIGURED
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
