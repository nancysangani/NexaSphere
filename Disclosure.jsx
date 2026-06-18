import React, { useState, useRef, useEffect } from 'react';
import './Disclosure.css';

const Disclosure = ({ title, children, isOpen: initialOpen = false, className = '', id }) => {
  const [isOpen, setIsOpen] = useState(() => {
    if (id) {
      const saved = localStorage.getItem(`disclosure-${id}`);
      return saved !== null ? JSON.parse(saved) : initialOpen;
    }
    return initialOpen;
  });
  const [contentHeight, setContentHeight] = useState('0px');
  const contentRef = useRef(null);
  const triggerId = `disclosure-trigger-${id || Math.random().toString(36).substr(2, 9)}`;
  const panelId = `disclosure-panel-${id || Math.random().toString(36).substr(2, 9)}`;

  useEffect(() => {
    if (!isOpen) {
      setContentHeight('0px');
      if (id) localStorage.setItem(`disclosure-${id}`, JSON.stringify(false));
      return;
    }

    const updateHeight = () => {
      if (contentRef.current) {
        setContentHeight(`${contentRef.current.scrollHeight}px`);
      }
    };

    updateHeight();
    const resizeObserver = new ResizeObserver(updateHeight);
    if (contentRef.current) resizeObserver.observe(contentRef.current);

    if (id) {
      localStorage.setItem(`disclosure-${id}`, JSON.stringify(isOpen));
    }

    return () => resizeObserver.disconnect();
  }, [isOpen, id]);

  const toggle = () => setIsOpen(!isOpen);

  return (
    <div className={`disclosure-container ${isOpen ? 'is-open' : ''} ${className}`}>
      <button
        type="button"
        id={triggerId}
        className="disclosure-trigger"
        onClick={toggle}
        aria-expanded={isOpen}
        aria-controls={panelId}
      >
        <span className="disclosure-title">{title}</span>
        <svg
          className="disclosure-icon"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </button>
      <div
        id={panelId}
        role="region"
        aria-labelledby={triggerId}
        className="disclosure-content-wrapper"
        style={{ maxHeight: contentHeight }}
      >
        <div ref={contentRef} className="disclosure-content">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Disclosure;
