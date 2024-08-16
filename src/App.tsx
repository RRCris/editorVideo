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

    return () => $subs.forEach(($sub) => $sub.unsubscribe());
  }, []);

  return (
    <>
      <div style={{ position: "fixed", top: 0, right: 0 }}>
        <input type="file" onChange={loadFile} />
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
