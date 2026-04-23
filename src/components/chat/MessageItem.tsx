import React, { useState } from "react";
import type { Message, Character } from "../../types";
import { cn } from "../../lib/utils";
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
    <div className="message-item__actions">
      <button 
        onClick={() => setIsEditing(true)}
        className="message-item__action-btn"
        title="Edit message"
      >
        <Edit3 size={14} />
      </button>
      {isAssistant && (
        <button onClick={onRegenerate} className="message-item__action-btn" title="Regenerate response">
          <RotateCcw size={14} />
        </button>
      )}
      <button onClick={onFork} className="message-item__action-btn" title="Fork conversation">
        <GitBranch size={14} />
      </button>
      <button 
        onClick={onDelete} 
        className="message-item__action-btn message-item__action-btn--delete"
        title="Delete message"
      >
        <Trash2 size={14} />
      </button>
    </div>
  );

  return (
    <div className={cn(
      "message-item",
      isAssistant ? "message-item--assistant" : "message-item--user"
    )}>
      {/* Header: Name, Time, and Actions */}
      <div className="message-item__header">
        <div className="message-item__meta">
          <span className="message-item__name">
            {isAssistant ? character.name : "USER"}
          </span>
          <span className="message-item__time">
            {new Date(message.modified_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>

      {/* Content Container */}
      <div className="message-item__bubble">
        {isEditing ? (
          <div className="message-item__edit-container">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="message-item__textarea"
              autoFocus
            />
            <div className="message-item__edit-actions">
              <button onClick={handleCancelEdit} className="message-item__action-btn"><X size={14} /></button>
              <button onClick={handleSaveEdit} className="message-item__action-btn"><Check size={14} /></button>
            </div>
          </div>
        ) : (
          <div className="message-item__text">
            <ReactMarkdown>{message.content}</ReactMarkdown>
          </div>
        )}
      </div>

      {/* Actions */}
      <Actions />

      {/* Swipe Navigation */}
      {hasSwipes && !isEditing && (
        <div className="message-item__swipes">
          <button onClick={() => handleSwipe(-1)} className="message-item__action-btn p-0">
            <ChevronLeft size={14} />
          </button>
          <span>{currentSwipeIndex + 1} / {message.swipes?.length}</span>
          <button onClick={() => handleSwipe(1)} className="message-item__action-btn p-0">
            <ChevronRight size={14} />
          </button>
          {message.swipes?.[currentSwipeIndex]?.model && (
            <span className="message-item__swipe-model">
              {message.swipes[currentSwipeIndex].model}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
