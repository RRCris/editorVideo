import React, { MouseEventHandler, useEffect, useState } from "react";
import VideoResource from "../utilities/VideoResource";
import css from "./VIdeoResource.module.css";
import { Subscription } from "rxjs";
interface props {
  res: VideoResource;
}
export default function VideoResourceUI({ res }: props) {
  const [name, setName] = useState(res.name);

  const [outputX, setOutputX] = useState(res.outputX);
  const [outputY, setOutputY] = useState(res.outputY);
  const [outputWidth, setOutputWidth] = useState(res.outputWidth);
  const [outputHeight, setOutputHeight] = useState(res.outputHeight);
  const [outputRotate, setOutputRotate] = useState(res.outputRotate);
  const [opacity, setOpacity] = useState(res.opacity);

  const [cropImageX, setCropImageX] = useState(res.cropImageX);
  const [cropImageY, setCropImageY] = useState(res.cropImageY);
  const [cropImageW, setCropImageW] = useState(res.cropImageW);
  const [cropImageH, setCropImageZ] = useState(res.cropImageH);

  const [offsetTime, setOffsetTime] = useState(res.offsetTime);
  const [hiddenTimeStart, setHiddenTimeStart] = useState(res.hiddenTimeStart);
  const [hiddenTimeEnd, setHiddenTimeEnd] = useState(res.hiddenTimeEnd);

  const [animations, setAnimation] = useState(res.getAnimations());

  const [, setEase] = useState(res.ease);
  const [animationIndex, setAnimationIndex] = useState(res.animationIndex);
  const [timePoint, setTimePoint] = useState(res.timePoint);
  const [timeAnimation, setTimeAnimation] = useState(res.timeAnimation);

  const [blur, setBlur] = useState(res.blur);
  const [brightness, setBrightness] = useState(res.brightness);
  const [grayscale, setGrayscale] = useState(res.grayscale);
  const [hueRotation, setHueRotation] = useState(res.hueRotation);
  const [contrast, setContrast] = useState(res.contrast);
  const [invert, setInvert] = useState(res.invert);
  const [saturate, setSaturate] = useState(res.saturate);
  const [sepia, setSepia] = useState(res.sepia);

  const [shadowOffsetX, setShadowOffsetX] = useState(res.shadowOffsetX);
  const [shadowOffsetY, setShadowOffsetY] = useState(res.shadowOffsetY);
  const [shadowBlur, setShadowBlur] = useState(res.shadowBlur);
  const [shadowColor, setShadowColor] = useState(res.shadowColor);

  useEffect(() => {
    const $subs: Subscription[] = [];
    //BASIC
    $subs.push(res.on("CHANGE_NAME", () => setName(res.name)));
    $subs.push(res.on("CHANGE_OUTPUTX", () => setOutputX(res.outputX)));
    $subs.push(res.on("CHANGE_OUTPUTY", () => setOutputY(res.outputY)));
    $subs.push(res.on("CHANGE_OUTPUT_WIDTH", () => setOutputWidth(res.outputWidth)));
    $subs.push(res.on("CHANGE_OUTPUT_HEIGHT", () => setOutputHeight(res.outputHeight)));
    $subs.push(res.on("CHANGE_OUTPUT_ROTATE", () => setOutputRotate(res.outputRotate)));
    $subs.push(res.on("CHANGE_OPACITY", () => setOpacity(res.opacity)));

    //CROP
    $subs.push(res.on("CHANGE_CROP_IMAGE_X", () => setCropImageX(res.cropImageX)));
    $subs.push(res.on("CHANGE_CROP_IMAGE_Y", () => setCropImageY(res.cropImageY)));
    $subs.push(res.on("CHANGE_CROP_IMAGE_W", () => setCropImageW(res.cropImageW)));
    $subs.push(res.on("CHANGE_CROP_IMAGE_H", () => setCropImageZ(res.cropImageH)));

    //TIME
    $subs.push(res.on("CHANGE_OFFSET_TIME", () => setOffsetTime(res.offsetTime)));
    $subs.push(res.on("CHANGE_HIDDEN_TIME_START", () => setHiddenTimeStart(res.hiddenTimeStart)));
    $subs.push(res.on("CHANGE_HIDDEN_TIME_END", () => setHiddenTimeEnd(res.hiddenTimeEnd)));

    //ANIMATED LIST
    $subs.push(res.on("CHANGE_ANIMATIONS_LIST", () => setAnimation(res.getAnimations())));

    //ANIMATED
    $subs.push(res.on("CHANGE_EASE", () => setEase(res.ease)));
    $subs.push(res.on("CHANGE_ANIMATION_INDEX", () => setAnimationIndex(res.animationIndex)));
    $subs.push(res.on("CHANGE_TIME_POINT", () => setTimePoint(res.timePoint)));
    $subs.push(res.on("CHANGE_TIME_ANIMATION", () => setTimeAnimation(res.timeAnimation)));

    //FILTERS
    $subs.push(res.on("CHANGE_FILTER_BLUR", () => setBlur(res.blur)));
    $subs.push(res.on("CHANGE_FILTER_BRIGHTNESS", () => setBrightness(res.brightness)));
    $subs.push(res.on("CHANGE_FILTER_GRAYSCALE", () => setGrayscale(res.grayscale)));
    $subs.push(res.on("CHANGE_FILTER_HUEROTATION", () => setHueRotation(res.hueRotation)));
    $subs.push(res.on("CHANGE_FILTER_CONTRAST", () => setContrast(res.contrast)));
    $subs.push(res.on("CHANGE_FILTER_INVERT", () => setInvert(res.invert)));
    $subs.push(res.on("CHANGE_FILTER_SATURATE", () => setSaturate(res.saturate)));
    $subs.push(res.on("CHANGE_FILTER_SEPIA", () => setSepia(res.sepia)));

    //SHADOW
    $subs.push(res.on("CHANGE_SHADOW_X", () => setShadowOffsetX(res.shadowOffsetX)));
    $subs.push(res.on("CHANGE_SHADOW_Y", () => setShadowOffsetY(res.shadowOffsetY)));
    $subs.push(res.on("CHANGE_SHADOW_BLUR", () => setShadowBlur(res.shadowBlur)));
    $subs.push(res.on("CHANGE_SHADOW_COLOR", () => setShadowColor(res.shadowColor)));

    return () => $subs.forEach(($sub) => $sub.unsubscribe());
  }, []);

  //handles
  const getPositionToNewAnimation: MouseEventHandler<HTMLButtonElement> = (e) => {
    const { width } = e.currentTarget.getBoundingClientRect();
    const percentage = Math.round((e.nativeEvent.layerX / width) * 100);
    res.addAnimation(percentage);
  };
  return (
    <div className={css.container}>
      <h2>{name}</h2>
      <input
        type="text"
        value={res.name}
        onChange={(e) => {
          res.name = e.target.value;
        }}
      />
      <h5>ANIMATION({animationIndex})</h5>
      <select value={res.ease} onChange={(e) => (res.ease = e.target.value)}>
        {res.presets.ease.map((e) => (
          <option value={e} key={e}>
            {e.toUpperCase()}
          </option>
        ))}
      </select>
      <label>
        Time Point ({timePoint})
        <input type="range" min={0} max={100} value={res.timePoint} onChange={(e) => (res.timePoint = parseInt(e.target.value))} />
      </label>
      <label>
        Time Animation ({timeAnimation})
        <input type="range" min={0} max={100} value={res.timeAnimation} onChange={(e) => (res.timeAnimation = parseInt(e.target.value))} />
      </label>
      <button onClick={() => res.removeAnimation(animations[animationIndex].id)}> Eliminar</button>
      <div className={css.container_animations}>
        <button className={css.item_new} onClick={getPositionToNewAnimation} />
        {animations.map((frame, index) => (
          <button
            className={`${css.item_animation} ${index === animationIndex && css.item_select}`}
            style={{ left: `${frame.timePoint}%`, width: `${frame.timeAnimation}%` }}
            onClick={() => (res.animationIndex = index)}
            key={index}
          />
        ))}
      </div>
      <h5>Basic({name})</h5>
      <label>
        Position X ({outputX})
        <input type="range" min={0} max={500} value={res.outputX} onChange={(e) => (res.outputX = parseInt(e.target.value))} />
      </label>
      <label>
        Position Y ({outputY})
        <input type="range" min={0} max={500} value={res.outputY} onChange={(e) => (res.outputY = parseInt(e.target.value))} />
      </label>
      <label>
        Width ({outputWidth})
        <input type="range" min={0} max={500} value={res.outputWidth} onChange={(e) => (res.outputWidth = parseInt(e.target.value))} />
      </label>
      <label>
        Height ({outputHeight})
        <input type="range" min={0} max={500} value={res.outputHeight} onChange={(e) => (res.outputHeight = parseInt(e.target.value))} />
      </label>
      <label>
        Rotate ({outputRotate})
        <input type="range" min={-180} max={180} value={res.outputRotate} onChange={(e) => (res.outputRotate = parseInt(e.target.value))} />
      </label>
      <label>
        Opacity ({opacity})
        <input type="range" min={0} max={100} value={res.opacity} onChange={(e) => (res.opacity = parseInt(e.target.value))} />
      </label>
      <br />
      <h5>Crop({name})</h5>
      <label>
        Crop X ({cropImageX})
        <input type="range" min={0} max={res.resourceWidth} value={res.cropImageX} onChange={(e) => (res.cropImageX = parseInt(e.target.value))} />
      </label>
      <label>
        Crop Y ({cropImageY})
        <input type="range" min={0} max={res.resourceHeight} value={res.cropImageY} onChange={(e) => (res.cropImageY = parseInt(e.target.value))} />
      </label>
      <label>
        Crop W ({cropImageW})
        <input type="range" min={0} max={res.resourceWidth} value={res.cropImageW} onChange={(e) => (res.cropImageW = parseInt(e.target.value))} />
      </label>
      <label>
        Crop H ({cropImageH})
        <input type="range" min={0} max={res.resourceHeight} value={res.cropImageH} onChange={(e) => (res.cropImageH = parseInt(e.target.value))} />
      </label>
      <br />
      <h5>TIME({name})</h5>
      <label>
        Offset Time ({offsetTime})
        <input type="range" min={0} max={3000} value={res.offsetTime} onChange={(e) => (res.offsetTime = parseInt(e.target.value))} />
      </label>
      <label>
        Hidden Time Start ({hiddenTimeStart})
        <input type="range" min={0} max={res.resourceDuration} value={res.hiddenTimeStart} onChange={(e) => (res.hiddenTimeStart = parseInt(e.target.value))} />
      </label>
      <label>
        Hidden Time End ({hiddenTimeEnd})
        <input type="range" min={0} max={res.resourceDuration} value={res.hiddenTimeEnd} onChange={(e) => (res.hiddenTimeEnd = parseInt(e.target.value))} />
      </label>
      <br />
      <h5>FILTERS({name})</h5>
      <label>
        Filter Blur ({blur})
        <input type="range" min={0} max={5} value={res.blur} onChange={(e) => (res.blur = parseInt(e.target.value))} />
      </label>
      <label>
        Filter brigness ({brightness})
        <input type="range" min={0} max={300} value={res.brightness} onChange={(e) => (res.brightness = parseInt(e.target.value))} />
      </label>
      <label>
        Filter grayscale ({grayscale})
        <input type="range" min={0} max={100} value={res.grayscale} onChange={(e) => (res.grayscale = parseInt(e.target.value))} />
      </label>
      <label>
        Filter hue-rotation ({hueRotation})
        <input type="range" min={0} max={500} value={res.hueRotation} onChange={(e) => (res.hueRotation = parseInt(e.target.value))} />
      </label>
      <label>
        Filter contrast ({contrast})
        <input type="range" min={0} max={100} value={res.contrast} onChange={(e) => (res.contrast = parseInt(e.target.value))} />
      </label>
      <label>
        Filter invert ({invert})
        <input type="range" min={0} max={100} value={res.invert} onChange={(e) => (res.invert = parseInt(e.target.value))} />
      </label>
      <label>
        Filter saturate ({saturate})
        <input type="range" min={0} max={300} value={res.saturate} onChange={(e) => (res.saturate = parseInt(e.target.value))} />
      </label>
      <label>
        Filter sepia ({sepia})
        <input type="range" min={0} max={100} value={res.sepia} onChange={(e) => (res.sepia = parseInt(e.target.value))} />
      </label>
      <br />
      <h5>SHADOW({name})</h5>
      <label>
        Shadow X ({shadowOffsetX})
        <input type="range" min={-30} max={30} value={res.shadowOffsetX} onChange={(e) => (res.shadowOffsetX = parseInt(e.target.value))} />
      </label>
      <label>
        Shadow Y ({shadowOffsetY})
        <input type="range" min={-30} max={30} value={res.shadowOffsetY} onChange={(e) => (res.shadowOffsetY = parseInt(e.target.value))} />
      </label>
      <label>
        Shadow blur ({shadowBlur})
        <input type="range" min={0} max={100} value={res.shadowBlur} onChange={(e) => (res.shadowBlur = parseInt(e.target.value))} />
      </label>
      <label>
        Shadow color ({shadowColor})
        <input type="color" value={res.shadowColor} onChange={(e) => (res.shadowColor = e.target.value)} />
      </label>
    </div>
  );
}
