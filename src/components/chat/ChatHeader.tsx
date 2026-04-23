import { Character, Chat, GlobalConfig, LMConfig } from "@/src/types";
import { objIsEmpty } from "@/src/lib/utils";
import { Trash2 } from "lucide-react";
import { dialogManager } from "../common/Modal";

const INVALID_ADAPTER_ID = "invalid_adapter_id_sentinel"

// TODO: READY_WEAK should be faint/washed out green
const STATUS_MAP = {
  READY_WEAK: { label: "READY_WEAK", color: "status-text--ready", icon: <span className="status-icon status-icon--ready" /> },
  READY: { label: "READY", color: "status-text--ready", icon: <span className="status-icon status-icon--ready" /> },
  BUSY: { label: "BUSY", color: "status-text--busy", icon: <span className="status-icon status-icon--busy" /> },
  ERROR: { label: "ERROR", color: "status-text--error", icon: <span className="status-icon status-icon--error" /> },
  OFFLINE: { label: "OFFLINE", color: "status-text--offline", icon: <span className="status-icon status-icon--offline" /> },
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

  // ./src/index.css:2
  const ActivityIndicator = () => {
    const status: StatusType = "READY";
    const { label, color, icon } = STATUS_MAP[status];

    const handleShowDetails = () => {
      dialogManager.show(
        <div className="activity-dialog">
          <h3 className="activity-dialog__title">Adapter_Metrics</h3>
          <div className="activity-dialog__metrics">
            <span className="activity-dialog__label">STATUS:</span>
            <span className={`activity-dialog__value ${color}`}>{label}</span>
            
            <span className="activity-dialog__label">AVG_LATENCY:</span>
            <span className="activity-dialog__value">245ms</span>
            
            <span className="activity-dialog__label">TOKENS_SEC:</span>
            <span className="activity-dialog__value">42.5/s</span>
            
            <span className="activity-dialog__label">UPTIME:</span>
            <span className="activity-dialog__value">99.98%</span>
          </div>
          <div className="activity-dialog__log">
            <span className="activity-dialog__log-label">LOG:</span>
            <div className="activity-dialog__log-content">
              <pre className="activity-dialog__code">
                <code>{JSON.stringify(config, null, 2)}</code>
              </pre>
            </div>
          </div>
        </div>,
        { positiveBtnText: "ACKNOWLEDGE", negativeBtnText: "DISMISS" }
      );
    };

    return (
      <div id="activity-indicator" className="activity-indicator">
        <button 
          id="activity-indicator__button"
          onClick={handleShowDetails}
          className="activity-indicator__button"
        >
          {icon}
        </button>
        <div id="activity-indicator__tooltip" className="activity-indicator__tooltip">
          <div className="activity-indicator__tooltip-content">
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
    <div className="chat-header">
      <div>
        <label htmlFor="chat-rename" className="sr-only">
          Rename chat title
        </label>
        <input 
          value={chat.title || ""}
          onChange={(e) => onUpdateChatTitle(e.target.value)}
          placeholder="Untitled Chat"
          className="chat-header__title-input"
          name="chat-rename"
          id="chat-rename"
        />
        <p className="chat-header__subtitle">
          {character.name} / {chat.messages.length} MESSAGES
        </p>
      </div>

      {/* header right side */}
      <div className="chat-header__actions">
        <ActivityIndicator />
        <AdapterSwitcher />
        <button 
          onClick={() => onDeleteChat(chat.id)}
          className="chat-header__delete-btn btn-ico"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
}