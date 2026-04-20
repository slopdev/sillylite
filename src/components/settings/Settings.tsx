import React, { useState } from "react";
import type { GlobalConfig, LMConfig } from "@/src/types";
import { X, Plus, Trash2, Save } from "lucide-react";
import { motion } from "motion/react";
import { Tabs, TabItem } from "@/src/components/common/TabView";
import { AdapterSettings } from "./AdapterSettings";
import { GeneralSettings } from "./GeneralSettings";
import { FormatterSettings } from "./FormatterSettings";
import { dialogManager } from "../common/Modal";

interface SettingsProps {
  config: GlobalConfig;
  onUpdateConfig: (config: Partial<GlobalConfig>, write: boolean) => void;
  onClose: () => void;
}

export function Settings({
  config,
  onUpdateConfig,
  onClose 
}: SettingsProps) {

  const [stagedConfig, setStagedConfig] = useState<GlobalConfig>(config);
  const [unsaved, setUnsaved] = useState(false);
  const [currentTab, setCurrentTab] = useState("general");
  
  // --------------------------------------------------
  
  const handleUpdate = (updates: Partial<GlobalConfig>) => {
    const cfg = {...stagedConfig, ...updates};
    setStagedConfig(cfg);
    setUnsaved(true);
  };

  const handleSave = () => {
    onUpdateConfig(stagedConfig, true);
    setUnsaved(false);
  };

  const handleClose = async () => {
    if (unsaved) {
      const modalSaveStatus = await dialogManager.show(
        (
        <div>Save changes?</div>
        ),
        {
          positiveBtnText: "Yes",
          negativeBtnText: "Discard",
        }
      );

      if (modalSaveStatus === "yes") {    // save
        onUpdateConfig(stagedConfig, true);
        setUnsaved(false);
        onClose();
      }
      else if (modalSaveStatus === "no") {    // discard
        setStagedConfig(structuredClone(config));
        setUnsaved(false);
        onClose();
      }
      else {   // cancel
        return;
      }
    }
    onClose();
  }

  const handleTabChange = (id: string) => {
    setCurrentTab(id);
  }
  
  // --------------------------------------------------

  const adapterContent = (
    <AdapterSettings
      config={stagedConfig.lm_config}
      onUpdateConfig={handleUpdate}
    ></AdapterSettings>
  );

  const generalSettingsContent = (
    <GeneralSettings></GeneralSettings>
  )

  const formatterSettingsContent = (
    <FormatterSettings></FormatterSettings>
  )

  const tabs: TabItem[] = [
    { id: "general", label: "General", content: generalSettingsContent },
    { id: "adapters", label: "Adapters", content: adapterContent },
    { id: "formatters", label: "Formatters", content: formatterSettingsContent },
  ];

  // --------------------------------------------------

  return (
    <>
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#141414]/80 -sm p-4"
    >
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-[#E4E3E0] border border-[#141414] w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl"
      >

        {/* Header */}
        <div className="p-4 border-b border-[#141414] flex items-center justify-between bg-white">
          <h2 className="font-mono font-bold uppercase tracking-widest">System_Settings {unsaved ? "*" : ""}</h2>
          <button onClick={handleClose} className="btn-ico">
            <X size={20} />
          </button>
        </div>

        <Tabs
          tabs={tabs}
          defaultTab={currentTab}
          onChange={handleTabChange}
          orientation="vertical"
          style={{height: "80vh", overflowY: "scroll"}}
          ></Tabs>

        {/* Bottom bar */}
        <div className="p-4 border-t border-[#141414] bg-white flex justify-end">
          <button 
            onClick={handleSave}
            className="btn-rect"
          >
            <Save size={18} /> SAVE_CONFIG
          </button>
        </div>
      </motion.div>
    </motion.div>
    </>
  );
}
