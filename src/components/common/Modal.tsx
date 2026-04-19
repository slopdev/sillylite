// TODO: zero clue how this works
import { useRef, useEffect, useState, ReactNode, CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { X } from "lucide-react";

interface DialogOptions {
  className?: string;
  preventBackdropClose?: boolean;
  positiveBtnText?: string;
  negativeBtnText?: string;
}

interface DialogShowEventDetail {
  content: ReactNode;
  options?: DialogOptions;
}

const MODAL_CLOSE_BTN_STYLE: CSSProperties = {
  marginLeft: "auto"
};

/* common/Modal */
const DIALOG_ROOT_STYLE: CSSProperties = {
  //centering
  position: "fixed",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",

  //rest
  padding: "0.5rem",
};

const DIALOG_CONTENT_STYLE: CSSProperties = {
  display: "flex",
  flexDirection: "column",
}

const DIALOG_ACTIONS_STYLE: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
}

// --------------------------------------------------

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

// --------------------------------------------------

export function DialogRoot(): ReactNode | null {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [content, setContent] = useState<ReactNode>(null);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [yesBtnText, setYesBtnText] = useState("Yea");
  const [noBtnText, setNoBtnText] = useState("Nah");
  
  useEffect(() => {
    const handleShow = (e: Event) => {
      const customEvent = e as CustomEvent<DialogShowEventDetail>;
      const deet = customEvent.detail;
      setContent(deet.content);

      if (deet.options !== undefined) {
        if (deet.options.positiveBtnText !== undefined) {
          setYesBtnText(deet.options.positiveBtnText);
        }
        if (deet.options.negativeBtnText !== undefined) {
          setNoBtnText(deet.options.negativeBtnText);
        }
      }
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

  // --------------------------------------------------
  
  const handleClose = (returnValue: boolean): void => {
    dialogRef.current?.close();
    setIsOpen(false);
    
    if (dialogResolver) {
      dialogResolver(returnValue);
      dialogResolver = null;
    }
  };
  
  const handleCancel = (e: React.SyntheticEvent<HTMLDialogElement, Event>): void => {
    e.preventDefault();
    handleClose(false);
  };
  
  // --------------------------------------------------
 
  return createPortal(
    <dialog
      ref={dialogRef}
      onCancel={handleCancel}
      onClose={() => handleClose(false)}
      className="dialog-root"
      style={DIALOG_ROOT_STYLE}
    >
      {isOpen && (
        <div className="dialog-content" style={DIALOG_CONTENT_STYLE}>
          <button 
            className="dialog-close-x btn-ico" 
            onClick={() => handleClose(false)}
            aria-label="Close dialog"
            style={MODAL_CLOSE_BTN_STYLE}
          >
            <X size={15}/>
          </button>
          
          {content}
          
          <div className="dialog-actions" style={DIALOG_ACTIONS_STYLE}>
            <button className="btn-rect-minor" onClick={() => handleClose(false)}>{noBtnText}</button>
            <button className="btn-rect-minor" onClick={() => handleClose(true)}>{yesBtnText}</button>
          </div>
        </div>
      )}
    </dialog>,
    document.body
  );
}