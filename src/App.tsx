import { useEffect, useMemo, useRef, useState } from "react";
import Control from "./utilities/Control";
import { Subscription } from "rxjs";
import TimeLineUI from "./components/TimeLineUI";
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
    return () => $subs.forEach(($sub) => $sub.unsubscribe());
  }, []);
  return (
    <>
      <div style={{ position: "fixed", bottom: 0, right: 0, zIndex: 10 }}>
        <div>
          <button onClick={() => control.reset()}>Restablecer</button>
          <label>
            Zoom
            <input type="range" min={0} max={4} value={control.scale} onChange={(e) => (control.scale = parseInt(e.target.value))} />
          </label>
          <label>
            Offset X
            <input type="range" min={-300} max={300} value={control.offsetX} onChange={(e) => (control.offsetX = parseInt(e.target.value))} />
          </label>
          <label>
            Offset Y
            <input type="range" min={-300} max={300} value={control.offsetY} onChange={(e) => (control.offsetY = parseInt(e.target.value))} />
          </label>
        </div>
        <div ref={refContainer} />
        <div>
          <button onClick={() => control.play()}>Play</button>
          <button onClick={() => control.pause()}>Pause</button>
          <button onClick={handleRecording}>Records MAIN</button>
          <button onClick={() => control.setupWorker()}>Records WORKER</button>
          <button onClick={() => control.addTimeLine()}>Add Time Line</button>
          <input type="range" ref={refBar} min={0} max={control.duration} onChange={(e) => control.setSeek(parseInt(e.target.value))} />
        </div>
        <div>
          <label>
            time Zoom
            <input type="range" min={1} max={100} value={control.zoomTime} onChange={(e) => (control.zoomTime = parseInt(e.target.value))} />
          </label>
          <label>
            Mode Loop
            <input type="checkbox" checked={control.modeLoop} onChange={(e) => (control.modeLoop = e.target.checked)} />
          </label>
          <label>
            Format
            <select value={control.format} onChange={(e) => (control.format = e.target.value)}>
              <option value="MP4">MP4</option>
              <option value="WEBM">WEBM</option>
            </select>
          </label>
        </div>
      </div>
      <div style={{ width: 500, overflow: "scroll" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, width: duration / timeZoom, background: "gray" }}>
          {timeLines.map((line) => (
            <TimeLineUI timeLine={line} key={line.id} />
          ))}
        </div>
      </div>
    </>
  );
}

export default App;
