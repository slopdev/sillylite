// TODO: zero clue how this works
import { useRef, useEffect, useState, ReactNode } from 'react';
import { createPortal } from 'react-dom';

interface DialogOptions {
  // Add any options you want to pass to the dialog
  className?: string;
  preventBackdropClose?: boolean;
}

interface DialogShowEventDetail {
  content: ReactNode;
  options?: DialogOptions;
}

// Global promise resolver
let dialogResolver: ((value: boolean | PromiseLike<boolean>) => void) | null = null;

export const dialogManager = {
  show(content: ReactNode, options: DialogOptions = {}): Promise<boolean> {
    window.dispatchEvent(new CustomEvent<DialogShowEventDetail>('dialog:show', { 
      detail: { content, options } 
    }));
    
    return new Promise<boolean>((resolve) => {
      dialogResolver = resolve;
    });
  }
};

export function DialogRoot(): ReactNode | null {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [content, setContent] = useState<ReactNode>(null);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  
  useEffect(() => {
    const handleShow = (e: Event) => {
      const customEvent = e as CustomEvent<DialogShowEventDetail>;
      setContent(customEvent.detail.content);
      setIsOpen(true);
    };
 
    window.addEventListener('dialog:show', handleShow);
    return () => window.removeEventListener('dialog:show', handleShow);
  }, []);

  useEffect(() => {
    if (isOpen) {
      dialogRef.current?.showModal();
    }
  }, [isOpen]);
  
  const handleClose = (returnValue: boolean): void => {
    dialogRef.current?.close();
    setIsOpen(false);
    
    if (dialogResolver) {
      dialogResolver(returnValue);
      dialogResolver = null;
    }
  };
  
  // Prevent light dismiss (clicking backdrop) if needed
  const handleCancel = (e: React.SyntheticEvent<HTMLDialogElement, Event>): void => {
    e.preventDefault();
    handleClose(false);
  };
  
  return createPortal(
    <dialog
      ref={dialogRef}
      onCancel={handleCancel}
      onClose={() => handleClose(false)}
      className="your-dialog-styles"
    >
      {isOpen && (
        <div className="dialog-content">
          {content}
          <div className="dialog-actions">
            <button onClick={() => handleClose(false)}>Cancel</button>
            <button onClick={() => handleClose(true)}>Confirm</button>
          </div>
        </div>
      )}
    </dialog>,
    document.body
  );
}