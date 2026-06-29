import { useEffect, useRef, useState } from 'react';

export function useFormDraft(storageKey, form, step, setForm, setStep, initialForm) {
  const [draftRestored, setDraftRestored] = useState(false);
  const isInitialMount = useRef(true);

  // Restore on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.form && typeof parsed.step === 'number') {
          setForm(parsed.form);
          setStep(parsed.step);
          setDraftRestored(true);
        }
      }
    } catch (e) {
      console.warn('Failed to restore draft', e);
    }
  }, [storageKey, setForm, setStep]);

  // Save on change
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    
    try {
      const timeout = setTimeout(() => {
        localStorage.setItem(storageKey, JSON.stringify({ form, step }));
      }, 500);
      return () => clearTimeout(timeout);
    } catch (e) {
      console.warn('Failed to save draft', e);
    }
  }, [form, step, storageKey]);

  // Warn on accidental tab close if progress exists
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (step > 0) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [step]);

  const clearDraft = () => {
    localStorage.removeItem(storageKey);
    setDraftRestored(false);
  };

  const startOver = () => {
    clearDraft();
    setForm(initialForm);
    setStep(0);
  };

  const continueDraft = () => {
    setDraftRestored(false); // Just dismiss the banner
  };

  return { draftRestored, clearDraft, startOver, continueDraft };
}
