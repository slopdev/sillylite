import { Character, Chat, GlobalConfig, LMConfig } from "@/src/types";
import { objIsEmpty } from "@/src/lib/utils";
import { Trash2 } from "lucide-react";
import { dialogManager } from "../common/Modal";

const INVALID_ADAPTER_ID = "invalid_adapter_id_sentinel"

const STATUS_MAP = {
  READY: { label: "READY", color: "text-green-600", icon: <span className="w-2.5 h-2.5 rounded-full bg-green-600" /> },
  BUSY: { label: "BUSY", color: "text-yellow-500", icon: <span className="w-2.5 h-2.5 rounded-full bg-yellow-500" /> },
  ERROR: { label: "ERROR", color: "text-red-500", icon: <span className="w-2.5 h-2.5 rounded-full bg-red-500" /> },
  OFFLINE: { label: "OFFLINE", color: "text-gray-400", icon: <span className="w-2.5 h-2.5 rounded-full bg-gray-400" /> },
} as const;

type StatusType = keyof typeof STATUS_MAP;

interface ChatHeaderProps {
  chat: Chat | null;
  character: Character;
  config: GlobalConfig;
  activeAdapterId: string;
  onAdapterSwitch: (adapterId: string) => void;
  onUpdateChatTitle: (newTitle: string) => void;
  onDeleteChat: (id: string) => void;
}

export function ChatHeader({
  chat,
  character,
  config,
  activeAdapterId,
  onAdapterSwitch,
  onUpdateChatTitle,
  onDeleteChat,
}: ChatHeaderProps) {

  if (chat === null) {
    return <div>nullchat placeholder</div>
  }

  const handleAdapterSwitch = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedAdapterId = event.target.value;
    console.log("[handleAdapterSwitch]: ", selectedAdapterId);
    onAdapterSwitch(selectedAdapterId);
  };

  // --------------------------------------------------

  const ActivityIndicator = () => {
    const status: StatusType = "READY";
    const { label, color, icon } = STATUS_MAP[status];

    const handleShowDetails = () => {
      dialogManager.show(
        <div className="space-y-4 p-2">
          <h3 className="font-mono font-bold border-b border-[#141414] pb-1 uppercase text-xs">Adapter_Metrics</h3>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] font-mono">
            <span className="opacity-50">STATUS:</span> <span className={`${color} font-bold`}>{label}</span>
            <span className="opacity-50">AVG_LATENCY:</span> <span>245ms</span>
            <span className="opacity-50">TOKENS_SEC:</span> <span>42.5/s</span>
            <span className="opacity-50">UPTIME:</span> <span>99.98%</span>
          </div>
          <div className="text-[11px] font-mono">
            {/* temp log content placeholder */}
            <span>LOG:</span>
            <div className="overflow-auto w-full">
              <pre><code>{JSON.stringify(config, null, 2)}</code></pre>
            </div>
          </div>
        </div>,
        { positiveBtnText: "ACKNOWLEDGE", negativeBtnText: "DISMISS" }
      );
    };

    return (
      <div className="relative group flex items-center">
        <button 
          onClick={handleShowDetails}
          className="p-1.5 hover:bg-[#141414] hover:text-[#E4E3E0] transition-colors flex items-center justify-center"
        >
          {icon}
        </button>
        <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 hidden group-hover:block z-50 pointer-events-none">
          <div className="bg-[#141414] text-[#E4E3E0] text-[10px] font-mono py-1 px-2 whitespace-nowrap border border-[#E4E3E0]">
            LATENCY: 245ms | {label}
          </div>
        </div>
      </div>
    );
  };

  const AdapterSwitcher = () => {
    return (!objIsEmpty(config.lm_config)) ? (
    <div>
      <label htmlFor="adapter-select" className="sr-only">
        Select adapter
      </label>
      <select
        defaultValue={activeAdapterId}
        name="adapter-select"
        id="adapter-select"
        onChange={handleAdapterSwitch}
        >
        <option value={INVALID_ADAPTER_ID} key={INVALID_ADAPTER_ID}>
          No Selection
        </option>
        {Object.entries(config.lm_config).map(([adapterId, a]) => (
          <option value={adapterId} key={adapterId}>
            {a.label}
          </option>
        ))}
      </select>
    </div>
  ) : (
    <div>
      no adapters found
    </div>
  )};


  return (
    <div className="px-6 py-3 border-b border-[#141414] flex items-center justify-between bg-white/50">
      <div>
        <label htmlFor="chat-rename" className="sr-only">
          Rename chat title
        </label>
        <input 
          value={chat.title || ""}
          onChange={(e) => onUpdateChatTitle(e.target.value)}
          placeholder="Untitled Chat"
          className="font-bold text-sm bg-transparent border-none p-0 focus:ring-0 w-full"
          name="chat-rename"
          id="chat-rename"
        />
        <p className="text-[10px] font-mono opacity-50 uppercase tracking-tight">
          {character.name} / {chat.messages.length} MESSAGES
        </p>
      </div>

      {/* header right side */}
      <div className="flex gap-2">
        <ActivityIndicator />
        <AdapterSwitcher />
        <button 
          onClick={() => onDeleteChat(chat.id)}
          className="p-1.5 hover:bg-red-500 hover:text-white transition-colors"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
}