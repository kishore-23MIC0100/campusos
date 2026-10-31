import { Component, lazy, Suspense, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { RotateCcw, Pause, Play, ArrowUpRight } from "lucide-react";
import type { CampusArea } from "./ModernCampus";
const Scene = lazy(() => import("./ModernCampus"));
const areas = {
  academic: {
    name: "Academic wing",
    detail:
      "A connected space for attendance, timetables, and everyday learning.",
    tag: "Learning & teaching",
  },
  library: {
    name: "Knowledge centre",
    detail: "Keep homework, assessments, and student progress in one place.",
    tag: "Resources & discovery",
  },
  sports: {
    name: "Campus life",
    detail: "Bring school events, activities, and campus operations together.",
    tag: "Beyond the classroom",
  },
};
class SceneBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}
export function CampusExperience({
  reduced,
  onToggleMotion,
}: {
  reduced: boolean;
  onToggleMotion: () => void;
}) {
  const [area, setArea] = useState<CampusArea>("academic");
  const [supported, setSupported] = useState(false);
  const [sceneKey, setSceneKey] = useState(0);
  const container = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(true);
  useEffect(() => {
    if (!container.current || !("IntersectionObserver" in window)) return;
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { rootMargin: "80px" });
    observer.observe(container.current);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    try {
      const canvas = document.createElement("canvas");
      const gl = canvas.getContext("webgl2");
      setSupported(Boolean(gl));
      gl?.getExtension("WEBGL_lose_context")?.loseContext();
    } catch {
      setSupported(false);
    }
  }, []);
  const fallback = (
    <img
      className="campus-fallback"
      src="/campus_aerial_panoramic.jpg"
      alt="Aerial view of a landscaped school campus"
    />
  );
  return (
    <div ref={container} className="campus-experience">
      <div className="scene-heading">
        <span>Explore your connected campus</span>
        <span className="scene-dimension">Interactive 3D</span>
      </div>
      <div
        className="campus-scene"
        aria-label="Interactive campus illustration. Select an area using the buttons below."
      >
        {supported ? (
          <SceneBoundary fallback={fallback}>
            <Suspense fallback={fallback}>
              <Scene
                key={sceneKey}
                area={area}
                setArea={setArea}
                reduced={reduced || !inView}
              />
            </Suspense>
          </SceneBoundary>
        ) : (
          fallback
        )}
      </div>
      <div className="scene-controls">
        <button
          onClick={() => setSceneKey((x) => x + 1)}
          title="Reset campus view"
          aria-label="Reset campus view"
        >
          <RotateCcw size={15} />
        </button>
        <button
          onClick={onToggleMotion}
          aria-label={reduced ? "Enable campus motion" : "Pause campus motion"}
          aria-pressed={reduced}
        >
          {reduced ? <Play size={15} /> : <Pause size={15} />}
        </button>
      </div>
      <div
        className="campus-tabs"
        role="tablist"
        aria-label="Explore campus areas"
      >
        {Object.entries(areas).map(([key, value]) => (
          <button
            role="tab"
            id={`tab-${key}`}
            aria-controls="campus-area"
            aria-selected={area === key}
            tabIndex={area === key ? 0 : -1}
            key={key}
            onClick={() => setArea(key as CampusArea)}
            onKeyDown={(e) => {
              if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
                e.preventDefault();
                const keys = Object.keys(areas) as CampusArea[];
                const next =
                  keys[
                    (keys.indexOf(area) + (e.key === "ArrowRight" ? 1 : 2)) % 3
                  ];
                setArea(next);
                document.getElementById(`tab-${next}`)?.focus();
              }
            }}
          >
            {value.name}
          </button>
        ))}
      </div>
      <div
        className="campus-caption"
        id="campus-area"
        role="tabpanel"
        aria-labelledby={`tab-${area}`}
      >
        <div>
          <span>{areas[area].tag}</span>
          <p>{areas[area].detail}</p>
        </div>
        <ArrowUpRight size={22} />
      </div>
    </div>
  );
}
