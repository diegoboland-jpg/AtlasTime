import { Children, type ReactNode, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Props = {
  activePanel: number;
  labels: string[];
  children: ReactNode;
  onActivePanelChange: (index: number) => void;
};

export function MobileWorkspaceDeck({ activePanel, labels, children, onActivePanelChange }: Props) {
  const viewport = useRef<HTMLDivElement>(null);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const scrollTimer = useRef<number | undefined>(undefined);
  const [isMobile, setIsMobile] = useState(false);
  const panels = Children.toArray(children);

  function goTo(index: number, behavior: ScrollBehavior = "smooth") {
    const normalized = (index + panels.length) % panels.length;
    onActivePanelChange(normalized);
    const element = viewport.current;
    if (element && window.matchMedia("(max-width: 640px)").matches) {
      element.scrollTo({ left: normalized * element.clientWidth, behavior });
    }
  }

  useEffect(() => {
    const media = window.matchMedia("(max-width: 640px)");
    const update = () => setIsMobile(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const resetOnReturn = () => {
      if (document.visibilityState === "visible") goTo(0, "auto");
    };
    document.addEventListener("visibilitychange", resetOnReturn);
    window.addEventListener("pageshow", resetOnReturn);
    return () => {
      document.removeEventListener("visibilitychange", resetOnReturn);
      window.removeEventListener("pageshow", resetOnReturn);
    };
  });

  useEffect(() => {
    const element = viewport.current;
    if (!element || !window.matchMedia("(max-width: 640px)").matches) return;
    element.scrollTo({ left: activePanel * element.clientWidth, behavior: "smooth" });
  }, [activePanel]);

  useEffect(() => () => window.clearTimeout(scrollTimer.current), []);

  return (
    <section className="mobile-workspace-deck" aria-label="AtlasTime mobile workspace">
      <nav className="mobile-workspace-nav" aria-label="Workspace sections">
        <button type="button" onClick={() => goTo(activePanel - 1)} aria-label="Previous section">
          <ChevronLeft size={17} aria-hidden="true" />
        </button>
        <div className="mobile-workspace-position">
          <strong>{labels[activePanel]}</strong>
          <span aria-label={`${activePanel + 1} of ${panels.length}`}>
            {panels.map((_, index) => (
              <button
                type="button"
                key={labels[index]}
                className={index === activePanel ? "active" : ""}
                onClick={() => goTo(index)}
                aria-label={`Open ${labels[index]}`}
                aria-current={index === activePanel ? "page" : undefined}
              />
            ))}
          </span>
        </div>
        <button type="button" onClick={() => goTo(activePanel + 1)} aria-label="Next section">
          <ChevronRight size={17} aria-hidden="true" />
        </button>
      </nav>
      <div
        className="mobile-workspace-viewport"
        ref={viewport}
        onScroll={(event) => {
          const element = event.currentTarget;
          window.clearTimeout(scrollTimer.current);
          scrollTimer.current = window.setTimeout(() => {
            if (!element.clientWidth) return;
            const index = Math.max(0, Math.min(panels.length - 1, Math.round(element.scrollLeft / element.clientWidth)));
            if (index !== activePanel) onActivePanelChange(index);
          }, 120);
        }}
        onTouchStart={(event) => {
          const touch = event.touches[0];
          touchStart.current = { x: touch.clientX, y: touch.clientY };
        }}
        onTouchEnd={(event) => {
          const start = touchStart.current;
          touchStart.current = null;
          if (!start || !event.changedTouches[0]) return;
          const deltaX = event.changedTouches[0].clientX - start.x;
          const deltaY = event.changedTouches[0].clientY - start.y;
          if (Math.abs(deltaX) < 55 || Math.abs(deltaX) < Math.abs(deltaY)) return;
          if (activePanel === panels.length - 1 && deltaX < 0) goTo(0);
          if (activePanel === 0 && deltaX > 0) goTo(panels.length - 1);
        }}
      >
        {panels.map((panel, index) => (
          <div
            className="mobile-workspace-panel"
            key={labels[index]}
            aria-hidden={isMobile && index !== activePanel ? true : undefined}
            inert={isMobile && index !== activePanel ? true : undefined}
          >
            {panel}
          </div>
        ))}
      </div>
    </section>
  );
}
