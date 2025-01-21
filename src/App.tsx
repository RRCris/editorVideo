import { useEffect, useMemo, useRef, useState } from "react";
import Control from "./utilities/Control";
import { Subscription } from "rxjs";
import TimeLineUI from "./components/TimeLineUI";
import { button, useControls } from "leva";

function App() {
  const refContainer = useRef<HTMLDivElement>(null);
  const refBar = useRef<HTMLInputElement>(null);
  const control = useMemo(() => new Control(), []);

  const [, setScale] = useState(control.scale);
  const [, setOffsetX] = useState(control.offsetX);
  const [, setOffsetY] = useState(control.offsetY);
  const [timeLines, setTimeLines] = useState(control.getTimeLines());
  const [duration, setDuration] = useState(control.duration);
  const [timeZoom, setTimeZoom] = useState(control.zoomTime);
  const [, setModeLoop] = useState(control.modeLoop);
  const [, setFormat] = useState(control.format);
  const [, setFPS] = useState(control.fps);

  //HandleFiles

  const handleBar = () => {
    if (refBar.current) {
      refBar.current.value = control.currentTime + "";
    }
  };

  const handleRecording = () => {
    control.setupRecord();
  };
  //Control Object
  useEffect(() => {
    const node = refContainer.current;
    if (node) {
      control.couple(refContainer.current);
    }
    return () => {
      if (node) {
        control.disengage(node);
      }
    };
  }, []);

  //Resources
  useEffect(() => {
    const $subs: Subscription[] = [];

    $subs.push(control.on("HOT_PLAYING", handleBar));
    $subs.push(control.on("CHANGE_SCALE", () => setScale(control.scale)));
    $subs.push(control.on("CHANGE_OFFSETX", () => setOffsetX(control.offsetX)));
    $subs.push(control.on("CHANGE_OFFSETY", () => setOffsetY(control.offsetY)));
    $subs.push(control.on("CHANGE_TIMELINES", () => setTimeLines(control.getTimeLines())));
    $subs.push(control.on("CHANGE_DURATION", () => setDuration(control.duration)));
    $subs.push(control.on("CHANGE_ZOOM_TIME", () => setTimeZoom(control.zoomTime)));
    $subs.push(control.on("CHANGE_MODE_LOOP", () => setModeLoop(control.modeLoop)));
    $subs.push(control.on("CHANGE_FORMAT", () => setFormat(control.format)));
    $subs.push(control.on("CHANGE_FPS", () => setFPS(control.fps)));
    return () => $subs.forEach(($sub) => $sub.unsubscribe());
  }, []);

  useControls("Reproduccion", {
    Loop: { value: control.modeLoop, onChange: (v) => (control.modeLoop = v) },
    "Play/Pause": button(() => (control.state === "STOP" ? control.play() : control.pause())),
  });
  useControls("Editor", {
    "scale time": {
      value: control.scale,
      min: 0,
      max: 100,
      onChange: (newValue) => (control.zoomTime = newValue),
    },
    zoom: {
      value: control.scale,
      min: 0,
      max: 3,
      step: 0.01,
      onChange: (newValue) => (control.scale = newValue),
    },

    offsets: {
      value: { x: control.offsetX, y: control.offsetY },
      step: 3,
      onChange: ({ x, y }) => {
        control.offsetX = x;
        control.offsetY = y;
      },
    },
    restablecer: button(() => control.reset()),
    "Add TimeLine": button(() => control.addTimeLine()),
  });
  useControls("Recording", {
    Format: { options: ["MP4", "WEBM"], value: control.format, onChange: (v) => (control.format = v) },
    FPS: { options: [24, 30, 45, 60], value: control.fps, onChange: (v) => (control.fps = v) },
    Recording: button(handleRecording),
  });

  return (
    <>
      <div>
        <div ref={refContainer} />
        <div>
          <input
            type="range"
            ref={refBar}
            min={0}
            max={control.duration}
            onChange={(e) => control.setSeek(parseInt(e.target.value))}
          />
        </div>
      </div>
      <div style={{ width: 600, overflow: "auto", background: "#99C" }}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 10,
            width: duration / timeZoom,
          }}
        >
          {timeLines.map((line) => (
            <TimeLineUI timeLine={line} key={line.id} />
          ))}
        </div>
      </div>
    </>
  );
}

export default App;
