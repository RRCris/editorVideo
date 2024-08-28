import { useEffect, useMemo, useState } from "react";
import VideoResource from "../utilities/VideoResource";
import { Subscription } from "rxjs";

interface props {
  resource: VideoResource;
}
export default function TimeLineItem({ resource }: props) {
  const color = useMemo(() => Math.random() * 10, []);
  const [offsetTime, setOffsetTime] = useState(resource.offsetTime);
  const [duration, setDuration] = useState(resource.duration);
  const [timeZoom, setTimeZoom] = useState(resource.control?.zoomTime || 0);
  useEffect(() => {
    const $subs: Subscription[] = [];
    $subs.push(resource.on("CHANGE_OFFSET_TIME", () => setOffsetTime(resource.offsetTime)));
    $subs.push(resource.on("CHANGE_DURATION", () => setDuration(resource.duration)));
    if (resource.control) $subs.push(resource.control.on("CHANGE_ZOOM_TIME", () => setTimeZoom(resource.control?.zoomTime || 0)));

    return () => $subs.forEach((res) => res.unsubscribe());
  }, []);

  const handleClick = () => {
    if (resource.control) {
      resource.control.selectResource = resource.id;
    }
  };
  return (
    <div
      style={{
        background: `hsla(${color * 25}, 69%, 68%, 1)`,
        position: "absolute",
        left: offsetTime / timeZoom,
        top: 0,
        bottom: 0,
        width: duration / timeZoom,
        height: "100%",
      }}
      onClick={handleClick}
    />
  );
}
