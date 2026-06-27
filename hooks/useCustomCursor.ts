import { useEffect, useState } from 'react';

export function useCustomCursor() {
  const [disableCustomCursor, setDisableCustomCursor] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('disableCustomCursor');
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (stored === 'true') setDisableCustomCursor(true);
  }, []);

  const toggle = (value: boolean) => {
    setDisableCustomCursor(value);
    localStorage.setItem('disableCustomCursor', String(value));
    window.dispatchEvent(new Event('cursorToggle'));
  };

  return { disableCustomCursor, toggle };
}
