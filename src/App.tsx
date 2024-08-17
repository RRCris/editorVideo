import { ChangeEventHandler, useEffect, useMemo, useRef, useState } from "react";
import Control from "./utilities/Control";
import video from "./assets/video 2.mp4";
import VideoResource from "./utilities/VideoResource";
import { Subscription } from "rxjs";
import VideoResourceUI from "./components/VideoResourceUI";
function App() {
  const refContainer = useRef<HTMLDivElement>(null);
  const refBar = useRef<HTMLInputElement>(null);
  const control = useMemo(() => new Control(), []);

  const [resources, setResources] = useState<VideoResource[]>([]);
  const [scale, setScale] = useState(control.scale);
  const [offsetX, setOffsetX] = useState(control.offsetX);
  const [offsetY, setOffsetY] = useState(control.offsetY);

  //HandleFiles
  const loadFile: ChangeEventHandler<HTMLInputElement> = (e) => {
    if (e.target.files) control.addResource(e.target.files[0]);
  };

  const handleBar = () => {
    if (refBar.current) {
      refBar.current.value = control.currentTime + "";
    }
  };
  //Control Object
  useEffect(() => {
    const node = refContainer.current;
    if (node) {
      control.couple(refContainer.current);
    }
    return () => {
      if (node) {
        try {
          control.disengage(node);
        } catch {}
      }
    };
  }, []);

  //Resources
  useEffect(() => {
    const $subs: Subscription[] = [];

    $subs.push(
      control.on("CHANGE_RESOURSE", () => {
        setResources(control.getResourceList());
      })
    );
    $subs.push(control.on("HOT_PLAYING", handleBar));
    $subs.push(control.on("CHANGE_SCALE", () => setScale(control.scale)));
    $subs.push(control.on("CHANGE_OFFSETX", () => setOffsetX(control.offsetX)));
    $subs.push(control.on("CHANGE_OFFSETY", () => setOffsetY(control.offsetY)));
    return () => $subs.forEach(($sub) => $sub.unsubscribe());
  }, []);

  return (
    <>
      <div style={{ position: "fixed", top: 0, right: 0 }}>
        <input type="file" onChange={loadFile} />
        <div>
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
        <button onClick={() => control.play()}>Play</button>
        <button onClick={() => control.pause()}>Pause</button>
        <button onClick={() => control.recording()}>Record</button>
        <input type="range" ref={refBar} min={0} max={control.timeEnd} onChange={(e) => control.setSeek(parseInt(e.target.value))} />
      </div>

      <div style={{ display: "flex" }}>
        {resources.map((res) => (
          <VideoResourceUI res={res} key={res.id} />
        ))}
      </div>
    </>
  );
}

export default App;
