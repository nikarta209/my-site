import React, { useEffect } from 'react';

const toText = (value) => {
  if (Array.isArray(value)) {
    return value.join('');
  }
  return typeof value === 'string' ? value : '';
};

const applyAttributes = (element, props) => {
  Object.entries(props).forEach(([key, value]) => {
    if (key === 'children' || key === 'dangerouslySetInnerHTML' || value == null) {
      return;
    }
    const attribute = key === 'className' ? 'class' : key;
    element.setAttribute(attribute, value);
  });
};

const removeExisting = (selector) => {
  if (!selector) return;
  document.head.querySelectorAll(selector).forEach(node => node.remove());
};

const processChild = (child, createdElements) => {
  if (!React.isValidElement(child)) {
    return null;
  }

  if (child.type === React.Fragment) {
    React.Children.forEach(child.props.children, (nested) => processChild(nested, createdElements));
    return null;
  }

  const { type, props } = child;

  switch (type) {
    case 'title': {
      const text = toText(props.children);
      if (text) {
        const previous = document.title;
        document.title = text;
        return () => {
          document.title = previous;
        };
      }
      return null;
    }
    case 'meta': {
      const meta = document.createElement('meta');
      applyAttributes(meta, props);
      if (props.name) {
        removeExisting(`meta[name="${props.name}"]`);
      }
      if (props.property) {
        removeExisting(`meta[property="${props.property}"]`);
      }
      document.head.appendChild(meta);
      createdElements.push(meta);
      return null;
    }
    case 'link': {
      const link = document.createElement('link');
      applyAttributes(link, props);
      if (props.rel && props.href) {
        removeExisting(`link[rel="${props.rel}"][href="${props.href}"]`);
      }
      document.head.appendChild(link);
      createdElements.push(link);
      return null;
    }
    case 'script': {
      const script = document.createElement('script');
      applyAttributes(script, props);
      if (props.dangerouslySetInnerHTML && props.dangerouslySetInnerHTML.__html) {
        script.innerHTML = props.dangerouslySetInnerHTML.__html;
      } else {
        script.textContent = toText(props.children);
      }
      document.head.appendChild(script);
      createdElements.push(script);
      return null;
    }
    default:
      return null;
  }
};

export const Helmet = ({ children }) => {
  useEffect(() => {
    if (typeof document === 'undefined') {
      return undefined;
    }

    const createdElements = [];
    const cleanups = [];

    React.Children.forEach(children, (child) => {
      const cleanup = processChild(child, createdElements);
      if (typeof cleanup === 'function') {
        cleanups.push(cleanup);
      }
    });

    return () => {
      cleanups.forEach((cleanup) => cleanup());
      createdElements.forEach((element) => {
        if (element?.parentNode) {
          element.parentNode.removeChild(element);
        }
      });
    };
  }, [children]);

  return null;
};

export const HelmetProvider = ({ children }) => children;

export default {
  Helmet,
  HelmetProvider
};
