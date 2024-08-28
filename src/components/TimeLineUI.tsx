import { useEffect, useState } from "react";
import TimeLine from "../utilities/TimeLine";
import TimeLineItem from "./TimeLineItem";
import VideoResourceUI from "./VideoResourceUI";
import { Subscription } from "rxjs";

interface props {
  timeLine: TimeLine;
}
export default function TimeLineUI({ timeLine }: props) {
  const [resource, setResource] = useState(timeLine.getResources());

  useEffect(() => {
    const $subs: Subscription[] = [];
    $subs.push(timeLine.on("CHANGE_RESOURCES", () => setResource(timeLine.getResources())));
  }, []);

  return (
    <div style={{ width: 500, background: "gray" }}>
      <button onClick={() => timeLine.removeSelf()}>Remove Time Line</button>
      <button onClick={() => timeLine.addResourceFromInput()}>Add Resource</button>
      <button onClick={() => timeLine.control.reordenTimeLines(0, timeLine.id)}>to top</button>
      <div style={{ position: "relative", height: 32 }} onClick={() => timeLine.selectSelf()}>
        {resource.map((resource) => (
          <TimeLineItem resource={resource} key={resource.id} />
        ))}
      </div>
      <div>
        {resource.map((resource) => (
          <VideoResourceUI res={resource} key={resource.id} />
        ))}
      </div>
    </div>
  );
}
