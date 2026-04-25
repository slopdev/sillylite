import React, { useState, useEffect } from 'react';
import '@/src/styles/SearchModal.css'; // vim jump: ./src/styles/SearchModal.css

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({ isOpen, onClose }) => {
  // Mock data to match the screenshot's length
  const totalResults = 22;
  const mockResults = Array.from({ length: totalResults }, (_, i) => `Result ${i + 1}`);

  const [query, setQuery] = useState('');
  // Defaulting to index 9 to show "Result 10" selected, as in the image
  const [selectedIndex, setSelectedIndex] = useState(9);

  // Optional: Handle escape key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="search-modal-overlay" onClick={onClose}>
      {/* Stop click propagation so clicking inside modal doesn't close it */}
      <div className="search-modal-container" onClick={(e) => e.stopPropagation()}>
        
        <div className="search-modal-main">
          {/* Left Side: Results List */}
          <div className="search-modal-list">
            {mockResults.map((result, index) => (
              <div
                key={index}
                className={`search-modal-item ${index === selectedIndex ? 'selected' : ''}`}
                onClick={() => setSelectedIndex(index)}
              >
                {result}
              </div>
            ))}
          </div>

          {/* Right Side: Preview Area */}
          <div className="search-modal-preview">
            <div className="preview-placeholder">Preview</div>
          </div>
        </div>

        {/* Bottom Area: Input and Counter */}
        <div className="search-modal-footer">
          <input
            type="text"
            className="search-modal-input"
            placeholder="Query"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
          <div className="search-modal-counter">
            {selectedIndex + 1}/{totalResults}
          </div>
        </div>

      </div>
    </div>
  );
};