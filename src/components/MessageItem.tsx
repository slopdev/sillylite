import React, { useState, memo} from "react";
import type { Message, Character, Swipe } from "../types";
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
import { cn } from "../lib/utils";
import { motion } from "motion/react";

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
  
  // callbacks
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
    onUpdate({
      content: editContent,
      modified_at: Date.now(),
    });
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditContent(message.content);
    setIsEditing(false);
  };

  // --------------------------------------------------
  //               private components
  // --------------------------------------------------

  const renderEditMode = () => (
    <div className="space-y-2">
      <textarea
        value={editContent}
        onChange={(e) => setEditContent(e.target.value)}
        className={cn(
          "w-full bg-transparent border-none focus:ring-0 resize-none min-h-[100px] font-sans text-sm p-0",
          isAssistant ? "text-black" : "text-white"
        )}
        autoFocus
      />
      <div className="flex justify-end gap-1">
        <button 
          onClick={handleCancelEdit}
          className={cn(
            "p-1.5 rounded transition-colors",
            isAssistant 
              ? "hover:bg-black/5 text-black/60" 
              : "hover:bg-white/10 text-white/60"
          )}
        >
          <X size={14} />
        </button>
        <button 
          onClick={handleSaveEdit}
          className={cn(
            "p-1.5 rounded transition-colors",
            isAssistant 
              ? "hover:bg-black/5 text-black/60" 
              : "hover:bg-white/10 text-white/60"
          )}
        >
          <Check size={14} />
        </button>
      </div>
    </div>
  );

  const renderViewMode = () => (
    <div className={cn(
      "prose prose-sm max-w-none prose-headings:font-mono prose-p:leading-relaxed",
      !isAssistant && "prose-invert"
    )}>
      <ReactMarkdown
        components={{
          p: ({ children }) => {
            if (typeof children === "string") {
              const parts = children.split(/(".*?")/g);
              return (
                <p>
                  {parts.map((part, i) => (
                    <span 
                      key={i} 
                      className={cn(
                        part.startsWith('"') && "dialogue italic"
                      )}
                    >
                      {part}
                    </span>
                  ))}
                </p>
              );
            }
            return <p>{children}</p>;
          }
        }}
      >
        {message.content}
      </ReactMarkdown>
    </div>
  );

  // --------------------------------------------------

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "group flex flex-col gap-2 max-w-4xl mx-auto w-full",
        isAssistant ? "items-start" : "items-end"
      )}
    >
      {/* Message Header */}
      <div className={cn(
        "flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-black/40",
        isAssistant ? "flex-row" : "flex-row-reverse"
      )}>
        <span className="font-bold text-black/60">
          {isAssistant ? character.name : "USER"}
        </span>
        <span className="text-black/20">•</span>
        <span className="text-black/40">
          {new Date(message.modified_at).toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </span>
      </div>

      {/* Message Content Container */}
      <div className={cn(
        "relative group/content max-w-[90%] p-4 border border-black/10 transition-all",
        isAssistant 
          ? "bg-white text-black" 
          : "bg-black text-white"
      )}>
        {isEditing ? renderEditMode() : renderViewMode()}

        {/* Action Buttons Overlay */}
        <div className={cn(
          "absolute top-0 opacity-0 group-hover/content:opacity-100 transition-opacity",
          "flex gap-0.5 p-1 bg-gray-100 border border-black/10 shadow-sm",
          isAssistant ? "left-full ml-2" : "right-full mr-2"
        )}>
          <button 
            onClick={() => setIsEditing(true)}
            className="p-1.5 hover:bg-black/5 rounded transition-colors text-black/60"
            title="Edit message"
          >
            <Edit3 size={14} />
          </button>
          
          {isAssistant && (
            <button 
              onClick={onRegenerate}
              className="p-1.5 hover:bg-black/5 rounded transition-colors text-black/60"
              title="Regenerate response"
            >
              <RotateCcw size={14} />
            </button>
          )}
          
          <button 
            onClick={onFork}
            className="p-1.5 hover:bg-black/5 rounded transition-colors text-black/60"
            title="Fork conversation"
          >
            <GitBranch size={14} />
          </button>
          
          <button 
            onClick={onDelete}
            className="p-1.5 hover:bg-red-500 hover:text-white rounded transition-colors text-black/60"
            title="Delete message"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Swipe Navigation Footer */}
      {hasSwipes && !isEditing && (
        <div className={cn(
          "swipey flex items-center gap-3 text-[10px] font-mono",
          isAssistant ? "text-black/50" : "text-white/50"
        )}>
          <button 
            onClick={() => handleSwipe(-1)}
            className={cn(
              "hover:opacity-100 transition-opacity",
              isAssistant ? "text-black/50" : "text-white/50"
            )}
          >
            <ChevronLeft size={12} />
          </button>
          
          <span>
            {currentSwipeIndex + 1} / {message.swipes?.length}
          </span>
          
          <button 
            onClick={() => handleSwipe(1)}
            className={cn(
              "hover:opacity-100 transition-opacity",
              isAssistant ? "text-black/50" : "text-white/50"
            )}
          >
            <ChevronRight size={12} />
          </button>
          
          {message.swipes?.[currentSwipeIndex]?.model && (
            <span className={cn(
              "ml-2 px-1.5 py-0.5 border rounded text-[9px]",
              isAssistant 
                ? "border-black/20 text-black/60" 
                : "border-white/20 text-white/60"
            )}>
              {message.swipes[currentSwipeIndex].model}
            </span>
          )}
        </div>
      )}
    </motion.div>
  );
}
