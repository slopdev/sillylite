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
    <div className="adapter-settings custom-scrollbar">
      <section className="adapter-settings__section">
        <div className="adapter-settings__section-header">
          <h3 className="adapter-settings__section-title">LLM Adapters</h3>
          <button 
            onClick={handleAdd}
            className="btn-rect-minor"
          >
            <Plus size={14} /> ADD_ADAPTER
          </button>
        </div>

        <div className="adapter-settings__list">
          {!adaptersIsEmpty ? Object.entries(adapters).map(([adapterId, adapter]) => (
            <div key={adapterId} className="adapter-card">
              <div className="adapter-card__header">
                <div className="adapter-card__title">
                  {adapter.label}
                </div>
                <button onClick={() => handleRemove(adapterId)} className="adapter-card__delete-btn">
                  <Trash2 size={16} />
                </button>
              </div>

              <div className="adapter-card__grid">
                <div className="adapter-card__field">
                  <label className="adapter-card__label">Type</label>
                  <select 
                    value={adapter.adapter_kind}
                    onChange={(e) => handleUpdate(adapterId, { adapter_kind: e.target.value })}
                    className="adapter-card__select"
                  >
                    <option value="openai">OpenAI / Compatible</option>
                    <option value="gemini">Google Gemini</option>
                    <option value="echo">Echo (Test)</option>
                  </select>
                </div>
                <div className="adapter-card__field">
                  <label className="adapter-card__label">Label</label>
                  <input 
                    value={adapter.label}
                    onChange={(e) => handleUpdate(adapterId, { label: e.target.value })}
                    className="adapter-card__input"
                  />
                </div>
                <div className="adapter-card__field">
                  <label className="adapter-card__label">Endpoint</label>
                  <input 
                    value={adapter.endpoint}
                    onChange={(e) => handleUpdate(adapterId, { endpoint: e.target.value })}
                    className="adapter-card__input"
                    placeholder={adapter.id === "gemini" ? "Not needed" : "https://..."}
                  />
                </div>
                <div className="adapter-card__field">
                  <label className="adapter-card__label">Model</label>
                  <input 
                    value={adapter.model}
                    onChange={(e) => handleUpdate(adapterId, { model: e.target.value })}
                    className="adapter-card__input"
                  />
                </div>
                <div className="adapter-card__field adapter-card__field--full">
                  <label className="adapter-card__label">API Key</label>
                  <input 
                    type="password"
                    value={adapter.apiKey}
                    onChange={(e) => handleUpdate(adapterId, { apiKey: e.target.value })}
                    className="adapter-card__input"
                  />
                </div>
              </div>
            </div>
          )) :
          (
            <div className="adapter-settings__empty">
              NO_ADAPTERS_CONFIGURED
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
