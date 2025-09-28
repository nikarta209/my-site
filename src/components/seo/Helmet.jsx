import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';

export function Helmet({ children }) {
  const [mounted, setMounted] = useState(false);
  const container = useMemo(() => {
    if (typeof document === 'undefined') {
      return null;
    }

    const element = document.createElement('div');
    element.setAttribute('data-helmet-portal', '');
    return element;
  }, []);

  useEffect(() => {
    if (!container || typeof document === 'undefined') {
      return undefined;
    }

    document.head.appendChild(container);
    setMounted(true);

    return () => {
      document.head.removeChild(container);
    };
  }, [container]);

  if (!container || !mounted) {
    return null;
  }

  return createPortal(children, container);
}

export default Helmet;
