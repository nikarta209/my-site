import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

export function Helmet({ children }) {
  const [headElement, setHeadElement] = useState(null);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      setHeadElement(document.head);
    }
  }, []);

  if (!headElement) {
    return null;
  }

  return createPortal(children, headElement);
}

export default Helmet;
