import { useState, useRef, useEffect, CSSProperties, ReactNode, KeyboardEvent } from "react";

export type TabVariant = "underline" | "pill" | "boxed";
export type TabOrientation = "horizontal" | "vertical";

export interface TabItem {
  id: string;
  label: ReactNode;
  content: ReactNode;
  disabled?: boolean;
}

export interface TabsProps {
  tabs: TabItem[];
  defaultTab?: string;
  onChange?: (id: string) => void;
  orientation?: TabOrientation;
  variant?: TabVariant;
  className?: string;
  style?: CSSProperties;
}

const BASE: CSSProperties = {
  fontFamily: "inherit",
  fontSize: "inherit",
  color: "inherit",
  boxSizing: "border-box",
};

export function Tabs({
  tabs,
  defaultTab,
  onChange,
  orientation = "horizontal",
  variant = "underline",
  className,
  style,
}: TabsProps) {
  const firstId = tabs.find((t) => !t.disabled)?.id ?? null;
  const [active, setActive] = useState<string | null>(defaultTab ?? firstId);
  const [indicatorStyle, setIndicatorStyle] = useState<CSSProperties>({});
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const listRef = useRef<HTMLUListElement>(null);
  const isVertical = orientation === "vertical";

  useEffect(() => {
    const el = active ? tabRefs.current[active] : null;
    const list = listRef.current;
    if (!el || !list || variant !== "underline") return;

    const elRect = el.getBoundingClientRect();
    const listRect = list.getBoundingClientRect();

    setIndicatorStyle(
      isVertical
        ? { top: elRect.top - listRect.top, height: elRect.height, width: 2, right: 0, left: "auto" }
        : { left: elRect.left - listRect.left, width: elRect.width, height: 2, bottom: 0 }
    );
  }, [active, variant, isVertical]);

  const select = (id: string) => {
    setActive(id);
    onChange?.(id);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const ids = tabs.filter((t) => !t.disabled).map((t) => t.id);
    const cur = ids.indexOf(tabs[index].id);

    const goTo = (next: number) => {
      const id = ids[(next + ids.length) % ids.length];
      select(id);
      tabRefs.current[id]?.focus();
    };

    if ((isVertical && e.key === "ArrowDown") || (!isVertical && e.key === "ArrowRight")) {
      e.preventDefault(); goTo(cur + 1);
    } else if ((isVertical && e.key === "ArrowUp") || (!isVertical && e.key === "ArrowLeft")) {
      e.preventDefault(); goTo(cur - 1);
    } else if (e.key === "Home") {
      e.preventDefault(); goTo(0);
    } else if (e.key === "End") {
      e.preventDefault(); goTo(ids.length - 1);
    }
  };

  const getTabStyle = (id: string, disabled?: boolean): CSSProperties => {
    const isActive = id === active;
    const base: CSSProperties = {
      ...BASE,
      padding: "8px 16px",
      cursor: disabled ? "not-allowed" : "pointer",
      border: "none",
      background: "transparent",
      outline: "none",
      transition: "background 0.15s, color 0.15s, opacity 0.15s",
      whiteSpace: "nowrap",
      lineHeight: 1.5,
      borderRadius: variant === "pill" ? 999 : variant === "boxed" ? "6px 6px 0 0" : 4,
      opacity: disabled ? 0.3 : isActive ? 1 : 0.55,
      // ↓ fontWeight removed. handled by the bold-ghost span below
    };

    if (variant === "pill") {
      return {
        ...base,
        background: isActive ? "currentColor" : "transparent",
        border: `1.5px solid ${isActive ? "currentColor" : "transparent"}`,
        filter: isActive ? "invert(1)" : "none",
        mixBlendMode: isActive ? "difference" : "normal",
      };
    }

    if (variant === "boxed") {
      return {
        ...base,
        border: "1px solid",
        borderColor: isActive ? "currentColor" : "transparent",
        borderBottom: isActive ? "1px solid transparent" : "none",
        marginBottom: isActive ? -1 : 0,
      };
    }

    return base;
  };

  const listStyle: CSSProperties = {
    ...BASE,
    display: "flex",
    flexDirection: isVertical ? "column" : "row",
    position: "relative",
    listStyle: "none",
    margin: 0,
    padding: 0,
    gap: variant === "pill" ? 4 : 0,
    ...(variant === "underline" && !isVertical ? { borderBottom: "1.5px solid currentColor" } : {}),
    ...(variant === "underline" && isVertical ? { borderRight: "1.5px solid currentColor" } : {}),
    ...(variant === "boxed" && !isVertical ? { borderBottom: "1px solid currentColor" } : {}),
  };

  const wrapperStyle: CSSProperties = {
    ...BASE,
    display: "flex",
    flexDirection: isVertical ? "row" : "column",
    gap: variant === "pill" ? 12 : 0,
    width: "100%",
    ...style,
  };

  const panelStyle: CSSProperties = {
    ...BASE,
    flex: 1,
    padding: isVertical ? "0 0 0 16px" : "16px 0 0",
  };

  return (
    <div style={wrapperStyle} className={className}>
      <div style={{ position: "relative" }}>
        <ul ref={listRef} role="tablist" aria-orientation={orientation} style={listStyle}>
          {tabs.map((tab, i) => {
            const isActive = tab.id === active;
            return (
              <li key={tab.id} role="none">
                <button
                  ref={(el) => { tabRefs.current[tab.id] = el; }}
                  role="tab"
                  id={`tab-${tab.id}`}
                  aria-selected={tab.id === active}
                  aria-controls={`panel-${tab.id}`}
                  aria-disabled={tab.disabled}
                  tabIndex={tab.id === active ? 0 : -1}
                  disabled={tab.disabled}
                  style={getTabStyle(tab.id, tab.disabled)}
                  onClick={() => !tab.disabled && select(tab.id)}
                  onKeyDown={(e) => handleKeyDown(e, i)}
                >
                  {/*
                   * Bold-ghost technique: both spans are stacked in the same
                   * grid cell. The ghost is always bold (reserving that width)
                   * but invisible; the visible span inherits font-weight from
                   * the outer style so it animates without reflowing.
                   */}
                  <span style={{ display: "grid" }}>
                    <span
                      style={{
                        gridArea: "1 / 1",
                        fontWeight: isActive ? 600 : 400,
                        transition: "font-weight 0s",
                      }}
                    >
                      {tab.label}
                    </span>
                    <span
                      aria-hidden="true"
                      style={{
                        gridArea: "1 / 1",
                        fontWeight: 600,
                        visibility: "hidden",
                        pointerEvents: "none",
                        userSelect: "none",
                      }}
                    >
                      {tab.label}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}

          {variant === "underline" && (
            <span
              aria-hidden="true"
              style={{
                position: "absolute",
                background: "currentColor",
                borderRadius: 2,
                transition: "left 0.2s ease, width 0.2s ease, top 0.2s ease, height 0.2s ease",
                pointerEvents: "none",
                ...indicatorStyle,
              }}
            />
          )}
        </ul>
      </div>

      {tabs.map((tab) => (
        <div
          key={tab.id}
          role="tabpanel"
          id={`panel-${tab.id}`}
          aria-labelledby={`tab-${tab.id}`}
          hidden={tab.id !== active}
          style={tab.id === active ? panelStyle : {}}
        >
          {tab.id === active ? tab.content : null}
        </div>
      ))}
    </div>
  );
}
