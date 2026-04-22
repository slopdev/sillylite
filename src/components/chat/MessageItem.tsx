import React, { useState } from "react";
import type { Message, Character } from "../../types";
import ReactMarkdown from "react-markdown";
import { 
  ChevronLeft, 
  ChevronRight, 
  Edit3, 
  Trash2, 
  RotateCcw, 
  GitBranch, 
  Check, 
  X 
} from "lucide-react";

interface MessageItemProps {
  message: Message;
  character: Character;
  onUpdate: (updates: Partial<Message>) => void;
  onDelete: () => void;
  onRegenerate: () => void;
  onFork: () => void;
}

export function MessageItem({ 
  message, 
  character,
  onUpdate, 
  onDelete, 
  onRegenerate, 
  onFork 
}: MessageItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);

  const isAssistant = message.role === "assistant";
  const hasSwipes = isAssistant && message.swipes && message.swipes.length > 1;
  const currentSwipeIndex = message.swipe_index || 0;

  const handleSwipe = (direction: number) => {
    if (!message.swipes) return;
    const nextIndex = (currentSwipeIndex + direction + message.swipes.length) % message.swipes.length;
    onUpdate({
      swipe_index: nextIndex,
      content: message.swipes[nextIndex].text
    });
  };

  const handleSaveEdit = () => {
    onUpdate({ content: editContent, modified_at: Date.now() });
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditContent(message.content);
    setIsEditing(false);
  };

  // Action buttons moved to the header for better mobile UX and to remove hover-dependent visibility
  const Actions = () => (
    <div style={{ display: "flex", gap: "4px" }}>
      <button 
        onClick={() => setIsEditing(true)}
        style={actionBtnStyle}
        title="Edit message"
      >
        <Edit3 size={14} />
      </button>
      {isAssistant && (
        <button onClick={onRegenerate} style={actionBtnStyle} title="Regenerate response">
          <RotateCcw size={14} />
        </button>
      )}
      <button onClick={onFork} style={actionBtnStyle} title="Fork conversation">
        <GitBranch size={14} />
      </button>
      <button 
        onClick={onDelete} 
        style={{ ...actionBtnStyle, color: "#dc2626" }} 
        title="Delete message"
      >
        <Trash2 size={14} />
      </button>
    </div>
  );

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      gap: "8px",
      maxWidth: "896px",
      width: "100%",
      margin: "0 auto",
      alignItems: isAssistant ? "flex-start" : "flex-end",
      padding: "8px 0"
    }}>
      {/* Header: Name, Time, and Actions */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        fontSize: "12px",
        fontFamily: "monospace",
        color: isAssistant ? "#666" : "#999"
      }}>
        <div style={{ display: "flex", gap: "8px" }}>
          <span style={{ fontWeight: "bold", color: isAssistant ? "#333" : "#ccc" }}>
            {isAssistant ? character.name : "USER"}
          </span>
          <span>
            {new Date(message.modified_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>

      {/* Content Container */}
      <div style={{
        maxWidth: "90%",
        width: "fit-content",
        padding: "16px",
        borderRadius: "8px",
        backgroundColor: isAssistant ? "#fff" : "#111",
        color: isAssistant ? "#000" : "#fff",
        border: `1px solid ${isAssistant ? "#e5e5e5" : "#333"}`,
      }}>
        {isEditing ? (
          <div>
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              style={{
                width: "100%",
                background: "transparent",
                border: "none",
                outline: "none",
                resize: "none",
                color: "inherit",
                fontFamily: "inherit",
                fontSize: "14px"
              }}
              autoFocus
            />
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "4px", marginTop: "8px" }}>
              <button onClick={handleCancelEdit} style={editBtnStyle}><X size={14} /></button>
              <button onClick={handleSaveEdit} style={editBtnStyle}><Check size={14} /></button>
            </div>
          </div>
        ) : (
          <div style={{ fontSize: "14px", lineHeight: "1.6" }}>
            <ReactMarkdown>{message.content}</ReactMarkdown>
          </div>
        )}
      </div>

      {/* Actions */}
      <Actions />

      {/* Swipe Navigation */}
      {hasSwipes && !isEditing && (
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          fontSize: "12px",
          fontFamily: "monospace",
          color: isAssistant ? "#666" : "#999",
          paddingLeft: "16px"
        }}>
          <button onClick={() => handleSwipe(-1)} style={{ background: "none", border: "none", color: "inherit", cursor: "pointer", padding: 0 }}>
            <ChevronLeft size={14} />
          </button>
          <span>{currentSwipeIndex + 1} / {message.swipes?.length}</span>
          <button onClick={() => handleSwipe(1)} style={{ background: "none", border: "none", color: "inherit", cursor: "pointer", padding: 0 }}>
            <ChevronRight size={14} />
          </button>
          {message.swipes?.[currentSwipeIndex]?.model && (
            <span style={{
              marginLeft: "8px",
              padding: "2px 6px",
              border: `1px solid ${isAssistant ? "#ccc" : "#444"}`,
              borderRadius: "4px",
              fontSize: "10px"
            }}>
              {message.swipes[currentSwipeIndex].model}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

// Extracted vanilla CSS properties to reduce repetition
const actionBtnStyle: React.CSSProperties = {
  background: "none",
  border: "none",
  cursor: "pointer",
  padding: "4px",
  color: "#888",
  display: "flex",
  alignItems: "center"
};

const editBtnStyle: React.CSSProperties = {
  background: "none",
  border: "none",
  cursor: "pointer",
  padding: "4px",
  color: "inherit",
  opacity: 0.7,
  display: "flex"
};

