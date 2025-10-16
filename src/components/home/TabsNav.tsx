import { useEffect, useMemo, useRef } from 'react';
import type { KeyboardEvent } from 'react';
import clsx from 'clsx';

type TabKey = 'novelties' | 'readers' | 'taste' | 'editors';

type TabItem = {
  key: TabKey;
  label: string;
  description?: string;
};

type TabsNavProps = {
  tabs: TabItem[];
  activeKey: TabKey;
  onChange: (key: TabKey) => void;
};

export function TabsNav({ tabs, activeKey, onChange }: TabsNavProps) {
  const buttonsRef = useRef<(HTMLButtonElement | null)[]>([]);
  const orderedTabs = useMemo(() => tabs, [tabs]);

  useEffect(() => {
    const index = orderedTabs.findIndex((tab) => tab.key === activeKey);
    const button = buttonsRef.current[index];
    if (button && document.activeElement !== button) {
      button.setAttribute('tabindex', '0');
    }
    orderedTabs.forEach((tab, tabIndex) => {
      const element = buttonsRef.current[tabIndex];
      if (!element) return;
      if (tab.key === activeKey) {
        element.setAttribute('tabindex', '0');
      } else {
        element.setAttribute('tabindex', '-1');
      }
    });
  }, [activeKey, orderedTabs]);

  const focusTab = (index: number) => {
    const normalized = ((index % orderedTabs.length) + orderedTabs.length) % orderedTabs.length;
    const tab = orderedTabs[normalized];
    if (!tab) return;
    onChange(tab.key);
    const element = buttonsRef.current[normalized];
    element?.focus();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        event.preventDefault();
        focusTab(orderedTabs.findIndex((tab) => tab.key === activeKey) + 1);
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        event.preventDefault();
        focusTab(orderedTabs.findIndex((tab) => tab.key === activeKey) - 1);
        break;
      case 'Home':
        event.preventDefault();
        focusTab(0);
        break;
      case 'End':
        event.preventDefault();
        focusTab(orderedTabs.length - 1);
        break;
      default:
        break;
    }
  };

  return (
    <div
      role="tablist"
      aria-label="Разделы домашней страницы"
      className="mx-auto flex w-full flex-wrap items-center justify-center gap-2 rounded-3xl border border-border/60 bg-card/80 px-3 py-2 shadow-lg backdrop-blur"
      onKeyDown={handleKeyDown}
    >
      {orderedTabs.map((tab, index) => {
        const isActive = tab.key === activeKey;
        return (
          <button
            key={tab.key}
            ref={(element) => {
              buttonsRef.current[index] = element;
            }}
            type="button"
            role="tab"
            aria-selected={isActive}
            aria-controls={`home-tabpanel-${tab.key}`}
            id={`home-tab-${tab.key}`}
            className={clsx(
              'relative flex min-w-[140px] flex-col items-center rounded-2xl px-4 py-2 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
              isActive
                ? 'bg-primary text-primary-foreground shadow-[0_8px_24px_-12px_rgba(99,102,241,0.75)]'
                : 'bg-muted/50 text-muted-foreground hover:bg-muted/70'
            )}
            onClick={() => onChange(tab.key)}
          >
            <span>{tab.label}</span>
            {tab.description && (
              <span className="mt-0.5 text-xs font-normal text-muted-foreground/70">{tab.description}</span>
            )}
            {isActive && (
              <span className="pointer-events-none absolute inset-x-4 bottom-1 h-1 rounded-full bg-primary-foreground/30" />
            )}
          </button>
        );
      })}
    </div>
  );
}

export type { TabKey, TabItem };
