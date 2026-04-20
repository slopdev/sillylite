import React from "react";
import type { GlobalConfig, LMConfig } from "@/src/types";
import { Plus, Trash2 } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import { objIsEmpty } from "@/src/lib/utils"

interface AdapterSettingsProps {
  adapters: Record<string, LMConfig>;
  onUpdateConfig: (config: Partial<GlobalConfig>) => void;
}

export function AdapterSettings({
  adapters,
  onUpdateConfig,
}: AdapterSettingsProps) {
  const adaptersIsEmpty = objIsEmpty(adapters);

  const handleAdd = () => {
    const newAdapterId = uuidv4();
    const newAdapter: LMConfig = {
      id: newAdapterId,
      adapter_kind: "openai",
      label: "New Adapter",
      endpoint: "https://api.openai.com/v1",
      apiKey: "",
      model: "gpt-3.5-turbo",
      parameters: { temperature: 0.7 }
    };
    const adaptersNew = {...adapters};
    adaptersNew[newAdapterId] = newAdapter;
    onUpdateConfig({ lm_config: adaptersNew });
  };

  const handleUpdate = (adapterId: string, updates: Partial<LMConfig>) => {
    const adaptersNew = {...adapters};
    adaptersNew[adapterId] = {...adapters[adapterId], ...updates};
    onUpdateConfig({ lm_config: adaptersNew });
  };

  const handleRemove = (adapterId: string) => {
    const {[adapterId]: removed, ...adaptersNew} = adapters;
    onUpdateConfig({ lm_config: adaptersNew });
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
      <section>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-mono text-xs opacity-50 uppercase tracking-widest">LLM Adapters</h3>
          <button 
            onClick={handleAdd}
            className="btn-rect-minor"
          >
            <Plus size={14} /> ADD_ADAPTER
          </button>
        </div>

        <div className="space-y-4">
          {!adaptersIsEmpty ? Object.entries(adapters).map(([adapterId, adapter]) => (
            <div key={adapterId} className="p-4 border border-[#141414] bg-white space-y-4">
              <div className="flex items-center justify-between">
                <div className="font-bold text-sm uppercase tracking-widest font-mono">
                  {adapter.label}
                </div>
                <button onClick={() => handleRemove(adapterId)} className="text-red-500 hover:bg-red-50 p-1">
                  <Trash2 size={16} />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-mono text-[10px] opacity-50 uppercase">Type</label>
                  <select 
                    value={adapter.adapter_kind}
                    onChange={(e) => handleUpdate(adapterId, { adapter_kind: e.target.value })}
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
                    onChange={(e) => handleUpdate(adapterId, { label: e.target.value })}
                    className="w-full text-xs p-2 border border-[#141414] focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-mono text-[10px] opacity-50 uppercase">Endpoint</label>
                  <input 
                    value={adapter.endpoint}
                    onChange={(e) => handleUpdate(adapterId, { endpoint: e.target.value })}
                    className="w-full text-xs p-2 border border-[#141414] focus:outline-none"
                    placeholder={adapter.id === "gemini" ? "Not needed" : "https://..."}
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-mono text-[10px] opacity-50 uppercase">Model</label>
                  <input 
                    value={adapter.model}
                    onChange={(e) => handleUpdate(adapterId, { model: e.target.value })}
                    className="w-full text-xs p-2 border border-[#141414] focus:outline-none"
                  />
                </div>
                <div className="space-y-1 col-span-2">
                  <label className="font-mono text-[10px] opacity-50 uppercase">API Key</label>
                  <input 
                    type="password"
                    value={adapter.apiKey}
                    onChange={(e) => handleUpdate(adapterId, { apiKey: e.target.value })}
                    className="w-full text-xs p-2 border border-[#141414] focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )) :
          (
            <div className="text-center py-8 border border-dashed border-[#141414]/30 font-mono text-xs opacity-40">
              NO_ADAPTERS_CONFIGURED
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
