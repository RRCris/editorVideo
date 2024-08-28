import gsap from "gsap";
import EventListener from "./EventListener";
import Control from "./Control";
import TimeLine from "./TimeLine";
import { presetsAnimations, TypeAnimationOptional } from "../data/presetsVideo";
import WebWorker from "./WebWorker";

export interface TypeObjectVideo {
  id: string;
  name: string;
  container: HTMLVideoElement;
  frames: TypeAnimationFrame[];
  offsetTime: number;
  hiddenTimeStart: number;
  hiddenTimeEnd: number;
  animationIndex: number;
  animationIn: string;
  animationOut: string;
}
interface TypeAnimationFrame {
  id: string;
  type: "relativeBack" | "relativeFront" | "absolute";

  cropImageX: number;
  cropImageY: number;
  cropImageW: number;
  cropImageH: number;

  outputWidth: number;
  outputHeight: number;
  outputX: number;
  outputY: number;
  outputRotate: number;
  opacity: number;

  timePoint: number;
  timeAnimation: number;
  ease: gsap.EaseString;

  blur: number;
  brightness: number;
  grayscale: number;
  hueRotation: number;
  contrast: number;
  invert: number;
  saturate: number;
  sepia: number;

  shadowOffsetX: number;
  shadowOffsetY: number;
  shadowBlur: number;
  shadowColor: string;
}

const states = ["UNLOAD", "STOP", "LOADERROR", "PLAYING", "RECORDING", "PREVIEW"] as const;
type TypeState = (typeof states)[number];

const events = [
  "LOADED",
  "LOAD_ERROR",
  "CHANGE_STATE",
  "CHANGE_DURATION",
  "CHANGE_NAME",
  "CHANGE_OUTPUTX",
  "CHANGE_OUTPUTY",
  "CHANGE_OUTPUT_WIDTH",
  "CHANGE_OUTPUT_HEIGHT",
  "CHANGE_OUTPUT_ROTATE",
  "CHANGE_OPACITY",
  "CHANGE_CROP_IMAGE_X",
  "CHANGE_CROP_IMAGE_Y",
  "CHANGE_CROP_IMAGE_W",
  "CHANGE_CROP_IMAGE_H",
  "CHANGE_OFFSET_TIME",
  "CHANGE_HIDDEN_TIME_START",
  "CHANGE_HIDDEN_TIME_END",
  "CHANGE_ANIMATION_INDEX",
  "CHANGE_TIME_POINT",
  "CHANGE_TIME_ANIMATION",
  "CHANGE_EASE",
  "CHANGE_ANIMATIONS_LIST",
  "CHANGE_FILTER_BLUR",
  "CHANGE_FILTER_BRIGHTNESS",
  "CHANGE_FILTER_GRAYSCALE",
  "CHANGE_FILTER_HUEROTATION",
  "CHANGE_FILTER_CONTRAST",
  "CHANGE_FILTER_INVERT",
  "CHANGE_FILTER_SATURATE",
  "CHANGE_FILTER_SEPIA",
  "CHANGE_SHADOW_X",
  "CHANGE_SHADOW_Y",
  "CHANGE_SHADOW_BLUR",
  "CHANGE_SHADOW_COLOR",
  "CHANGE_DURATION_IN",
  "CHANGE_ANIMATION_IN",
  "CHANGE_DURATION_OUT",
  "CHANGE_ANIMATION_OUT",
] as const;
type TypeEvent = (typeof events)[number];

export default class VideoResource {
  containerVideo = document.createElement("video");
  control: null | Control = null;
  timeLine: TimeLine = new TimeLine(new Control());

  subject = new EventListener();
  type = "VIDEO";
  id = crypto.randomUUID();
  #state: TypeState = "UNLOAD";
  #raw: File | null = null;

  resourceType: string | undefined;
  resourceWidth: number | undefined;
  resourceHeight: number | undefined;
  resourceDuration: number | undefined;

  #name: string = "unnamedvideo";

  #offsetTime: number = 0;
  #hiddenTimeStart: number = 0;
  #hiddenTimeEnd: number = 0;

  #animationIn: string = "NONE";
  #animationInDuration: number = 1000;
  #animationInObject: null | TypeAnimationOptional = null;

  #animationOut: string = "NONE";
  #animationOutDuration: number = 1000;
  #animationOutObject: null | TypeAnimationOptional = null;

  #animationIndex = 0;
  #animations: TypeAnimationFrame[] = [
    {
      //Fixed
      id: crypto.randomUUID(),
      type: "absolute",
      //crop
      cropImageX: 0,
      cropImageY: 0,
      cropImageH: 0,
      cropImageW: 0,
      //basic
      outputWidth: 720,
      outputHeight: 420,
      outputX: 0,
      outputY: 0,
      outputRotate: 0,
      opacity: 100,
      //animation
      ease: "none",
      timePoint: 0,
      timeAnimation: 0,
      //filters
      blur: 0,
      brightness: 100,
      grayscale: 0,
      hueRotation: 0,
      contrast: 100,
      invert: 0,
      saturate: 100,
      sepia: 0,
      //shadow
      shadowOffsetX: 0,
      shadowOffsetY: 0,
      shadowBlur: 0,
      shadowColor: "#000000",
    },
  ];
  /**
   * ______________________________________________Setters
   */
  //state
  set state(newState: TypeState) {
    if (states.includes(newState)) {
      this.#state = newState;
      this.fire("CHANGE_STATE");
    }
  }
  get state() {
    return this.#state;
  }
  //duration
  get duration() {
    return this.#hiddenTimeEnd - this.#hiddenTimeStart;
  }
  //name
  set name(newValue: string) {
    if (newValue !== this.#name) {
      this.#name = newValue;
      this.fire("CHANGE_NAME");
    }
  }
  get name() {
    return this.#name;
  }
  //outputX
  set outputX(newValue: number) {
    if (this.state !== "RECORDING") {
      if (this.state === "PREVIEW") {
        const near = this.control?.getAxisNear(newValue, this.outputY, this.outputWidth, this.outputHeight, this.id);
        if (near && near.x) newValue = near.x;
      }
      const curr = this.#animations[this.#animationIndex].outputX;

      if (newValue !== curr) {
        this.#animations[this.#animationIndex].outputX = newValue;
        this.fire("CHANGE_OUTPUTX");
      }
    }
  }
  get outputX() {
    return this.#animations[this.#animationIndex].outputX;
  }

  //outputY
  set outputY(newValue: number) {
    if (this.state !== "RECORDING") {
      if (this.state === "PREVIEW") {
        const near = this.control?.getAxisNear(this.outputX, newValue, this.outputWidth, this.outputHeight, this.id);
        if (near && near.y) newValue = near.y;
      }
      const curr = this.#animations[this.#animationIndex].outputY;

      if (newValue !== curr) {
        this.#animations[this.#animationIndex].outputY = newValue;
        this.fire("CHANGE_OUTPUTY");
      }
    }
  }
  get outputY() {
    return this.#animations[this.#animationIndex].outputY;
  }

  //outputWidth
  set outputWidth(newValue: number) {
    if (this.state !== "RECORDING") {
      const curr = this.#animations[this.#animationIndex].outputWidth;

      if (newValue !== curr) {
        this.#animations[this.#animationIndex].outputWidth = newValue;
        this.fire("CHANGE_OUTPUT_WIDTH");
      }
    }
  }
  get outputWidth() {
    return this.#animations[this.#animationIndex].outputWidth;
  }

  //outputHeight
  set outputHeight(newValue: number) {
    if (this.state !== "RECORDING") {
      const curr = this.#animations[this.#animationIndex].outputHeight;

      if (newValue !== curr) {
        this.#animations[this.#animationIndex].outputHeight = newValue;
        this.fire("CHANGE_OUTPUT_HEIGHT");
      }
    }
  }
  get outputHeight() {
    return this.#animations[this.#animationIndex].outputHeight;
  }

  //outputRotate
  set outputRotate(newValue: number) {
    if (this.state !== "RECORDING") {
      const curr = this.#animations[this.#animationIndex].outputRotate;

      if (newValue !== curr) {
        this.#animations[this.#animationIndex].outputRotate = newValue;
        this.fire("CHANGE_OUTPUT_ROTATE");
      }
    }
  }
  get outputRotate() {
    return this.#animations[this.#animationIndex].outputRotate;
  }

  //opacity
  set opacity(newValue: number) {
    if (this.state !== "RECORDING" && newValue <= 100 && newValue >= 0) {
      const curr = this.#animations[this.#animationIndex].opacity;

      if (newValue !== curr) {
        this.#animations[this.#animationIndex].opacity = newValue;
        this.fire("CHANGE_OPACITY");
      }
    }
  }
  get opacity() {
    return this.#animations[this.#animationIndex].opacity;
  }

  //cropImageX
  set cropImageX(newValue: number) {
    if (this.state !== "RECORDING") {
      const curr = this.#animations[this.#animationIndex].cropImageX;
      if (newValue !== curr && newValue >= 0 && newValue <= (this.resourceWidth || 0)) {
        this.#animations[this.#animationIndex].cropImageX = newValue;
        this.fire("CHANGE_CROP_IMAGE_X");
      }
    }
  }
  get cropImageX() {
    return this.#animations[this.#animationIndex].cropImageX;
  }

  //cropImageY
  set cropImageY(newValue: number) {
    if (this.state !== "RECORDING") {
      const curr = this.#animations[this.#animationIndex].cropImageY;
      if (newValue !== curr && newValue >= 0 && newValue <= (this.resourceHeight || 0)) {
        this.#animations[this.#animationIndex].cropImageY = newValue;
        this.fire("CHANGE_CROP_IMAGE_Y");
      }
    }
  }
  get cropImageY() {
    return this.#animations[this.#animationIndex].cropImageY;
  }

  //cropImageW
  set cropImageW(newValue: number) {
    if (this.state !== "RECORDING") {
      const curr = this.#animations[this.#animationIndex].cropImageW;

      if (newValue !== curr && newValue >= 0 && newValue <= (this.resourceWidth || 0)) {
        this.#animations[this.#animationIndex].cropImageW = newValue;
        this.fire("CHANGE_CROP_IMAGE_W");
      }
    }
  }
  get cropImageW() {
    return this.#animations[this.#animationIndex].cropImageW;
  }

  //cropImageH
  set cropImageH(newValue: number) {
    if (this.state !== "RECORDING") {
      const curr = this.#animations[this.#animationIndex].cropImageH;

      if (newValue !== curr && newValue >= 0 && newValue <= (this.resourceHeight || 0)) {
        this.#animations[this.#animationIndex].cropImageH = newValue;
        this.fire("CHANGE_CROP_IMAGE_H");
      }
    }
  }
  get cropImageH() {
    return this.#animations[this.#animationIndex].cropImageH;
  }

  //offsetTime
  set offsetTime(newValue: number) {
    if (this.state !== "RECORDING") {
      const start = newValue;
      const end = start + this.duration;
      if (this.timeLine && !this.timeLine.checkColisions(start, end, this.id) && newValue !== this.#offsetTime) {
        this.#offsetTime = newValue;
        this.fire("CHANGE_OFFSET_TIME");
      }
    }
  }
  get offsetTime() {
    return this.#offsetTime;
  }

  //hiddenTimeStart
  set hiddenTimeStart(newValue: number) {
    if (this.state !== "RECORDING") {
      const start = this.offsetTime;
      const end = start + (this.hiddenTimeEnd - newValue);
      if (this.timeLine && !this.timeLine.checkColisions(start, end, this.id) && newValue !== this.#hiddenTimeStart && newValue <= this.hiddenTimeEnd) {
        this.#hiddenTimeStart = newValue;
        this.fire("CHANGE_HIDDEN_TIME_START");
        this.fire("CHANGE_DURATION");
      }
    }
  }
  get hiddenTimeStart() {
    return this.#hiddenTimeStart;
  }

  //hiddenTimeEnd
  set hiddenTimeEnd(newValue: number) {
    if (this.state !== "RECORDING") {
      const start = this.offsetTime;
      const end = start + (newValue - this.hiddenTimeStart);
      if (newValue !== this.#hiddenTimeEnd && newValue >= this.hiddenTimeStart && newValue <= (this.resourceDuration || 0) && !this.timeLine.checkColisions(start, end, this.id)) {
        this.#hiddenTimeEnd = newValue;
        this.fire("CHANGE_HIDDEN_TIME_END");
        this.fire("CHANGE_DURATION");
      }
    }
  }
  get hiddenTimeEnd() {
    return this.#hiddenTimeEnd;
  }

  //timePoint
  set timePoint(newValue: number) {
    if (this.state !== "RECORDING") {
      const minPosicionCurrent = newValue;
      const maxPositionCurrent = this.#animations[this.#animationIndex].timeAnimation + minPosicionCurrent;
      const idCurrent = this.#animations[this.#animationIndex].id;
      let colitions = false;
      if (maxPositionCurrent > 100 || minPosicionCurrent < 0) colitions = true;
      for (const frame of this.getAnimations()) {
        if (idCurrent !== frame.id) {
          const minPosition = frame.timePoint;
          const maxPosition = frame.timeAnimation + minPosition;
          if (maxPositionCurrent > minPosition && maxPosition > minPosicionCurrent) {
            colitions = true;
          }
        }
      }

      if (!colitions) {
        this.#animations[this.#animationIndex].timePoint = newValue;
        this.fire("CHANGE_TIME_POINT");
      }
    }
  }
  get timePoint() {
    return this.#animations[this.#animationIndex].timePoint;
  }

  //timeAnimation
  set timeAnimation(newValue: number) {
    if (this.state !== "RECORDING") {
      const minPosicionCurrent = this.#animations[this.#animationIndex].timePoint;
      const maxPositionCurrent = newValue + minPosicionCurrent;
      const idCurrent = this.#animations[this.#animationIndex].id;
      let colitions = false;
      if (maxPositionCurrent > 100 || minPosicionCurrent < 0) colitions = true;
      for (const frame of this.getAnimations()) {
        if (idCurrent !== frame.id) {
          const minPosition = frame.timePoint;
          const maxPosition = frame.timeAnimation + minPosition;
          if (maxPositionCurrent > minPosition && maxPosition > minPosicionCurrent) {
            colitions = true;
          }
        }
      }

      if (!colitions) {
        this.#animations[this.#animationIndex].timeAnimation = newValue;
        this.fire("CHANGE_TIME_ANIMATION");
      }
    }
  }
  get timeAnimation() {
    return this.#animations[this.#animationIndex].timeAnimation;
  }

  //ease
  set ease(newValue: string) {
    if (newValue !== this.#animations[this.#animationIndex].ease) {
      this.#animations[this.#animationIndex].ease = newValue;
      this.fire("CHANGE_EASE");
    }
  }
  get ease() {
    return this.#animations[this.#animationIndex].ease;
  }

  //animationIndex
  set animationIndex(newIndex: number) {
    if (this.state !== "RECORDING") {
      if (this.#animationIndex !== newIndex && newIndex >= 0 && newIndex < this.#animations.length) {
        this.#animationIndex = newIndex;
        this.fire("CHANGE_ANIMATION_INDEX");

        //CROP
        this.fire("CHANGE_CROP_IMAGE_H");
        this.fire("CHANGE_CROP_IMAGE_W");
        this.fire("CHANGE_CROP_IMAGE_X");
        this.fire("CHANGE_CROP_IMAGE_Y");
        //BASIC
        this.fire("CHANGE_OUTPUTX");
        this.fire("CHANGE_OUTPUTY");
        this.fire("CHANGE_OUTPUT_HEIGHT");
        this.fire("CHANGE_OUTPUT_WIDTH");
        this.fire("CHANGE_OUTPUT_ROTATE");
        this.fire("CHANGE_OPACITY");
        //TIME
        this.fire("CHANGE_TIME_POINT");
        this.fire("CHANGE_TIME_ANIMATION");
        this.fire("CHANGE_EASE");
        //FILTER
        this.fire("CHANGE_FILTER_BLUR");
        this.fire("CHANGE_FILTER_BRIGHTNESS");
        this.fire("CHANGE_FILTER_GRAYSCALE");
        this.fire("CHANGE_FILTER_HUEROTATION");
        this.fire("CHANGE_FILTER_CONTRAST");
        this.fire("CHANGE_FILTER_INVERT");
        this.fire("CHANGE_FILTER_SATURATE");
        this.fire("CHANGE_FILTER_SEPIA");
        //SHADOW
        this.fire("CHANGE_SHADOW_X");
        this.fire("CHANGE_SHADOW_Y");
        this.fire("CHANGE_SHADOW_BLUR");
        this.fire("CHANGE_SHADOW_COLOR");
      }
    }
  }

  get animationIndex() {
    return this.#animationIndex;
  }
  //blur
  set blur(newValue: number) {
    const curr = this.#animations[this.#animationIndex].blur;
    if (this.state !== "RECORDING" && newValue !== curr && newValue >= 0 && newValue <= 5) {
      this.#animations[this.#animationIndex].blur = newValue;
      this.fire("CHANGE_FILTER_BLUR");
    }
  }
  get blur() {
    return this.#animations[this.#animationIndex].blur;
  }

  //brightness
  set brightness(newValue: number) {
    const curr = this.#animations[this.#animationIndex].brightness;
    if (this.state !== "RECORDING" && newValue !== curr && newValue >= 0 && newValue <= 300) {
      this.#animations[this.#animationIndex].brightness = newValue;
      this.fire("CHANGE_FILTER_BRIGHTNESS");
    }
  }
  get brightness() {
    return this.#animations[this.#animationIndex].brightness;
  }

  //grayscale
  set grayscale(newValue: number) {
    const curr = this.#animations[this.#animationIndex].grayscale;
    if (this.state !== "RECORDING" && newValue !== curr && newValue >= 0 && newValue <= 100) {
      this.#animations[this.#animationIndex].grayscale = newValue;
      this.fire("CHANGE_FILTER_GRAYSCALE");
    }
  }
  get grayscale() {
    return this.#animations[this.#animationIndex].grayscale;
  }

  //hueRotation
  set hueRotation(newValue: number) {
    const curr = this.#animations[this.#animationIndex].hueRotation;
    if (this.state !== "RECORDING" && newValue !== curr) {
      const mod = newValue % 360;
      this.#animations[this.#animationIndex].hueRotation = mod;
      this.fire("CHANGE_FILTER_HUEROTATION");
    }
  }
  get hueRotation() {
    return this.#animations[this.#animationIndex].hueRotation;
  }

  //contrast
  set contrast(newValue: number) {
    const curr = this.#animations[this.#animationIndex].contrast;
    if (this.state !== "RECORDING" && newValue !== curr && newValue >= 0 && newValue <= 100) {
      this.#animations[this.#animationIndex].contrast = newValue;
      this.fire("CHANGE_FILTER_CONTRAST");
    }
  }
  get contrast() {
    return this.#animations[this.#animationIndex].contrast;
  }

  //invert
  set invert(newValue: number) {
    const curr = this.#animations[this.#animationIndex].invert;
    if (this.state !== "RECORDING" && newValue !== curr && newValue >= 0 && newValue <= 100) {
      this.#animations[this.#animationIndex].invert = newValue;
      this.fire("CHANGE_FILTER_INVERT");
    }
  }
  get invert() {
    return this.#animations[this.#animationIndex].invert;
  }

  //saturate
  set saturate(newValue: number) {
    const curr = this.#animations[this.#animationIndex].saturate;
    if (this.state !== "RECORDING" && newValue !== curr && newValue >= 0 && newValue <= 300) {
      this.#animations[this.#animationIndex].saturate = newValue;
      this.fire("CHANGE_FILTER_SATURATE");
    }
  }
  get saturate() {
    return this.#animations[this.#animationIndex].saturate;
  }

  //sepia
  set sepia(newValue: number) {
    const curr = this.#animations[this.#animationIndex].sepia;
    if (this.state !== "RECORDING" && newValue !== curr && newValue >= 0 && newValue <= 100) {
      this.#animations[this.#animationIndex].sepia = newValue;
      this.fire("CHANGE_FILTER_SEPIA");
    }
  }
  get sepia() {
    return this.#animations[this.#animationIndex].sepia;
  }

  //shadowOffsetX
  set shadowOffsetX(newValue: number) {
    const curr = this.#animations[this.#animationIndex].shadowOffsetX;
    if (this.state !== "RECORDING" && newValue !== curr) {
      this.#animations[this.#animationIndex].shadowOffsetX = newValue;
      this.fire("CHANGE_SHADOW_X");
    }
  }
  get shadowOffsetX() {
    return this.#animations[this.#animationIndex].shadowOffsetX;
  }

  //shadowOffsetY
  set shadowOffsetY(newValue: number) {
    const curr = this.#animations[this.#animationIndex].shadowOffsetY;
    if (this.state !== "RECORDING" && newValue !== curr) {
      this.#animations[this.#animationIndex].shadowOffsetY = newValue;
      this.fire("CHANGE_SHADOW_Y");
    }
  }
  get shadowOffsetY() {
    return this.#animations[this.#animationIndex].shadowOffsetY;
  }

  //shadowBlur
  set shadowBlur(newValue: number) {
    const curr = this.#animations[this.#animationIndex].shadowBlur;
    if (this.state !== "RECORDING" && newValue !== curr && newValue >= 0) {
      this.#animations[this.#animationIndex].shadowBlur = newValue;
      this.fire("CHANGE_SHADOW_BLUR");
    }
  }
  get shadowBlur() {
    return this.#animations[this.#animationIndex].shadowBlur;
  }

  //shadowColor
  set shadowColor(newValue: string) {
    const curr = this.#animations[this.#animationIndex].shadowColor;
    if (this.state !== "RECORDING" && newValue !== curr) {
      this.#animations[this.#animationIndex].shadowColor = newValue;
      this.fire("CHANGE_SHADOW_COLOR");
    }
  }
  get shadowColor() {
    return this.#animations[this.#animationIndex].shadowColor;
  }
  //animationIn
  set animationIn(newValue: string) {
    if (this.#animationIn !== newValue && Object.keys(presetsAnimations).includes(newValue)) {
      this.#animationIn = newValue;
      this.#animationInObject = presetsAnimations[newValue];
      this.fire("CHANGE_ANIMATION_IN");
    }
  }
  get animationIn() {
    return this.#animationIn;
  }

  //animationInDuration
  set animationInDuration(newValue: number) {
    if (this.#animationInDuration !== newValue && newValue >= 0) {
      this.#animationInDuration = newValue;
      this.fire("CHANGE_DURATION_IN");
    }
  }
  get animationInDuration() {
    return this.#animationInDuration;
  }

  //animationOut
  set animationOut(newValue: string) {
    if (this.#animationOut !== newValue && Object.keys(presetsAnimations).includes(newValue)) {
      this.#animationOut = newValue;
      this.#animationOutObject = presetsAnimations[newValue];
      this.fire("CHANGE_ANIMATION_OUT");
    }
  }
  get animationOut() {
    return this.#animationOut;
  }

  //animationOutDuration
  set animationOutDuration(newValue: number) {
    if (this.#animationOutDuration !== newValue && newValue >= 0) {
      this.#animationOutDuration = newValue;
      this.fire("CHANGE_DURATION_OUT");
    }
  }
  get animationOutDuration() {
    return this.#animationOutDuration;
  }
  /**
   * ______________________________________________Metodos para eventos,listeners,observables
   */

  on(event: TypeEvent, callback: () => void) {
    //Acepta solo eventos registrados
    if (events.includes(event)) {
      return this.subject.on(event, callback);
    } else {
      throw new Error(`El evento de ${event} o esta en la lista de eventos del tpi ${this.type}`);
    }
  }

  fire(event: TypeEvent) {
    if (events.includes(event)) {
      this.subject.fire(event);
    } else {
      throw new Error(`El evento de ${event} o esta en la lista de eventos del tpi ${this.type}`);
    }
  }

  /**
   * ______________________________________________Funciones
   */
  addControl(control: Control) {
    this.control = control;
    this.control.on("CHANGE_SELECT", () => {
      this.previewSet(control.selectResource === this.id);
    });
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  draw(context: CanvasRenderingContext2D, animated: TypeAnimationFrame | any) {
    //draw
    context.save();

    context.translate(animated.outputX, animated.outputY);
    context.rotate((animated.outputRotate * Math.PI) / 180);

    context.filter = `
      blur(${animated.blur}px) 
      brightness(${animated.brightness}%) 
      grayscale(${animated.grayscale}%) 
      hue-rotate(${animated.hueRotation}deg) 
      contrast(${animated.contrast}%) 
      invert(${animated.invert}%) 
      saturate(${animated.saturate}%) 
      sepia(${animated.sepia}%) 
      opacity(${animated.opacity}%)
      drop-shadow(${animated.shadowOffsetX}px ${animated.shadowOffsetY}px ${animated.shadowBlur}px ${animated.shadowColor})
      `;
    context.drawImage(this.containerVideo, animated.cropImageX, animated.cropImageY, animated.cropImageW, animated.cropImageH, 0, 0, animated.outputWidth, animated.outputHeight);
    context.restore();
  }
  emit(context: CanvasRenderingContext2D | WebWorker, seek: number, isPlaying: boolean) {
    //verificamos si esta a tiempo para reproduccir o estamos en preview
    const timeleft = seek - this.offsetTime;
    const durationLeft = this.#hiddenTimeEnd - this.#hiddenTimeStart;

    ///________________MAIN
    if (timeleft >= 0 && timeleft < durationLeft) {
      //Update Time
      const idealTime = seek - this.offsetTime + this.hiddenTimeStart;
      const offset = 50;
      const curr = this.containerVideo.currentTime * 1000;
      if (curr > idealTime + offset || curr < idealTime - offset) {
        /**
         * No se puede estar seteando currentTime constantemente por lo que  solo lo seteo
         * cuando la diferencia entre el tiempo que deberia tener y el que tiene supera los 100 milisegundos
         */
        console.count("correction");
        this.containerVideo.currentTime = idealTime / 1000; // esta en milisegundos y currentTime recibe segundos
      }
      //Playing Video
      if (isPlaying) {
        this.containerVideo.play();
      } else {
        this.containerVideo.pause();
      }
      //Animations
      const procesed = this.processAnimations();
      const tl = gsap.timeline({ paused: true });
      const animated = procesed[0].properties;
      procesed.forEach((frame, i) => {
        if (frame.type === "relativeFront") {
          const nextFrame = procesed[i + 1];
          tl.fromTo(animated, frame.properties, { ...nextFrame.properties, duration: frame.duration, ease: frame.ease }, frame.timeStart);
        } else if (frame.type === "absolute") {
          tl.to(animated, { ...frame.properties, duration: frame.duration, ease: frame.ease }, frame.timeStart);
        } else if (frame.type === "relativeBack") {
          const backFrame = procesed[i - 1];
          tl.fromTo(animated, backFrame.properties, { ...frame.properties, duration: frame.duration, ease: frame.ease }, frame.timeStart);
        }
      });
      tl.seek((seek - this.offsetTime) / 1000);

      if (context instanceof WebWorker) {
        const frame = new VideoFrame(this.containerVideo, {
          timestamp: 0,
        });
        context.fire("DRAW", { ...animated, _gsap: undefined, frame }, [frame]);
      } else {
        this.draw(context, animated);
      }

      tl.kill();
    }
    //______________ANIMATION IN
    else if (this.#animationInObject && timeleft < 0 && timeleft + this.animationInDuration >= 0) {
      const duration = this.animationInDuration / 1000;
      const seek = duration + timeleft / 1000;
      const procesed = this.processAnimations();
      const tl = gsap.timeline({ paused: true });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const animated: any = { ...procesed[0].properties, ...this.#animationInObject };
      tl.to(animated, { ...procesed[0].properties, duration, ease: this.#animationInObject.ease });
      tl.seek(seek);

      //draw
      if (context instanceof WebWorker) {
        const frame = new VideoFrame(this.containerVideo, {
          timestamp: 0,
        });
        context.fire("DRAW", { ...animated, _gsap: undefined, frame }, [frame]);
      } else {
        this.draw(context, animated);
      }
      tl.kill();
    }
    ///______________ANIMATION OUT
    else if (this.#animationOutObject && timeleft >= durationLeft && timeleft - this.animationOutDuration < durationLeft) {
      const seek = (timeleft - durationLeft) / 1000;
      const duration = this.animationOutDuration / 1000;
      const procesed = this.processAnimations().reverse();
      const tl = gsap.timeline({ paused: true });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const animated: any = procesed[0].properties;
      tl.to(animated, { ...this.#animationOutObject, duration, ease: this.#animationOutObject.ease });
      tl.seek(seek);
      //draw
      if (context instanceof WebWorker) {
        const frame = new VideoFrame(this.containerVideo, {
          timestamp: 0,
        });
        context.fire("DRAW", { ...animated, _gsap: undefined, frame }, [frame]);
      } else {
        this.draw(context, animated);
      }
    }

    //____________AXIS_HELPER
    if (this.state === "PREVIEW" && !(context instanceof WebWorker)) {
      const near = this.control?.getAxisNear(this.outputX, this.outputY, this.outputWidth, this.outputHeight, this.id);
      if (near) {
        context.save();
        context.lineWidth = 5;
        context.strokeStyle = "#73FFF3";
        if (near.x !== null) {
          context.beginPath();
          context.moveTo(near.x + near.offX, 0);
          context.lineTo(near.x + near.offX, this.control?.height || 0);
          context.stroke();
        }
        if (near.y !== null) {
          context.beginPath();
          context.moveTo(0, near.y + near.offY);
          context.lineTo(this.control?.width || 0, near.y + near.offY);
          context.stroke();
        }
        context.restore();
      }

      context.save();
      const animated = this.#animations[this.animationIndex];
      context.translate(animated.outputX, animated.outputY);
      context.rotate((animated.outputRotate * Math.PI) / 180);

      context.filter = `
      blur(${animated.blur}px) 
      brightness(${animated.brightness}%) 
      grayscale(${animated.grayscale}%) 
      hue-rotate(${animated.hueRotation}deg) 
      contrast(${animated.contrast}%) 
      invert(${animated.invert}%) 
      saturate(${animated.saturate}%) 
      sepia(${animated.sepia}%) 
      opacity(${20}%)
      drop-shadow(${animated.shadowOffsetX}px ${animated.shadowOffsetY}px ${animated.shadowBlur}px ${animated.shadowColor})
      `;
      context.drawImage(this.containerVideo, animated.cropImageX, animated.cropImageY, animated.cropImageW, animated.cropImageH, 0, 0, animated.outputWidth, animated.outputHeight);
      context.restore();
    }

    //_______PAUSA
    if (this.state !== "PREVIEW" && !(timeleft >= 0 && timeleft < durationLeft)) {
      this.containerVideo.pause();
      this.containerVideo.currentTime = 0;
    }
  }

  load(url: string) {
    //verificar tipo y compatibilidad
    //cargar en nuestro container
    this.containerVideo.addEventListener("loadeddata", () => {
      //adquirir tamaño
      document.body.appendChild(this.containerVideo);
      this.containerVideo.play();
      const { width, height } = this.containerVideo.getBoundingClientRect();
      this.resourceHeight = height;
      this.cropImageH = this.resourceHeight;

      this.resourceWidth = width;
      this.cropImageW = this.resourceWidth;

      this.resourceDuration = this.containerVideo.duration * 1000;
      this.hiddenTimeEnd = this.resourceDuration;

      this.containerVideo.pause();
      document.body.removeChild(this.containerVideo);
      //avisar que ya podemos emitir
      this.state = "STOP";
      this.fire("LOADED");
      //alistarvideo
    });
    this.containerVideo.addEventListener("error", () => {
      this.state = "LOADERROR";
      this.fire("LOAD_ERROR");
    });

    this.containerVideo.src = url;
  }
  recording(start: boolean) {
    this.state = start ? "RECORDING" : "STOP";
  }
  previewSet(preview: boolean) {
    this.state = preview ? "PREVIEW" : "STOP";
  }
  removeSelf() {
    this.timeLine.removeResource(this.id);
  }

  /**
   * Animations
   */
  getAnimations() {
    return [...this.#animations.sort((a, b) => a.timePoint - b.timePoint)];
  }
  processAnimations() {
    const maxTime = this.#hiddenTimeEnd - this.#hiddenTimeStart;
    // const animations = this.#animations;
    const animations: TypeAnimationFrame[] = this.#animations;

    //Organizar propiedades
    const parseObjects = animations.map((raw) => {
      const exclude = ["type", "timePoint", "timeAnimation", "id", "ease"];
      return {
        id: raw.id,
        type: raw.type,
        timeStart: ((raw.timePoint / 100) * maxTime) / 1000, // de Porcentaje a milisegundos y de milisegundos a segundos
        duration: ((raw.timeAnimation / 100) * maxTime) / 1000,
        ease: raw.ease,
        properties: { ...Object.fromEntries(Object.entries(raw).filter(([key]) => !exclude.includes(key))) },
      };
    });

    //Interpolar Frames Relativos
    const processInterpolations = parseObjects.map((raw, i) => {
      if (raw.type === "relativeFront") {
        const frontFrame = parseObjects[i + 1];
        if (frontFrame && frontFrame.type === "absolute") {
          const newProperties = { ...frontFrame.properties };
          Object.entries(newProperties).forEach(([key, value]) => {
            if (value !== undefined) {
              newProperties[key] = value + raw.properties[key];
            }
          });
          raw.properties = newProperties;
          return raw;
        }
      }
      if (raw.type === "relativeBack") {
        const backFrame = parseObjects[i - 1];
        if (backFrame && backFrame.type === "absolute") {
          const newProperties = { ...backFrame.properties };
          Object.entries(newProperties).forEach(([key, value]) => {
            newProperties[key] = value + raw.properties[key];
          });
          raw.properties = newProperties;
          return raw;
        }
      }
      return raw;
    });

    //Organizar frames del primero al ultimo
    const sortedInterpolations = processInterpolations.sort((a, b) => {
      return a.timeStart - b.timeStart;
    });

    return sortedInterpolations;
  }
  addAnimation(percentage: number) {
    const listNearest = this.#animations
      .sort((a, b) => {
        const diferenceA = a.timePoint - percentage;
        const diferenceB = b.timePoint - percentage;
        return diferenceA - diferenceB;
      })
      .filter((frame) => frame.type === "absolute");
    if (listNearest[0]) {
      const newAnimation: TypeAnimationFrame = { ...listNearest[0], timePoint: percentage, timeAnimation: 0, id: crypto.randomUUID() };
      this.#animations.push(newAnimation);
      this.animationIndex = this.#animations.length - 1;
    }
    this.fire("CHANGE_ANIMATIONS_LIST");
  }
  removeAnimation(id: string) {
    const filterList = this.#animations.filter((frames) => frames.id !== id);
    if (filterList.length >= 1) {
      this.#animations = filterList;
      this.#animationIndex = 0;
      this.fire("CHANGE_ANIMATION_INDEX");
      this.fire("CHANGE_ANIMATIONS_LIST");
    }
  }

  /**
   *  Workers
   */

  toObject(): TypeObjectVideo | undefined {
    if (this.#raw) {
      return {
        id: this.id,
        name: this.name,
        container: this.containerVideo,
        frames: this.getAnimations(),
        offsetTime: this.offsetTime,
        hiddenTimeStart: this.hiddenTimeStart,
        hiddenTimeEnd: this.hiddenTimeEnd,
        animationIndex: this.animationIndex,
        animationIn: this.animationIn,
        animationOut: this.animationOut,
      };
    }
  }

  constructor(raw: File | string) {
    this.containerVideo.muted = true;
    if (raw instanceof File) {
      this.#raw = raw;
      this.name = raw.name.split(".")[0];
      this.resourceType = raw.type;

      const reader = new FileReader();
      reader.onloadend = (event) => {
        if (event.target) this.load(event.target.result as string);
      };
      reader.onerror = () => {
        this.state = "LOADERROR";
        this.fire("LOAD_ERROR");
      };
      reader.readAsDataURL(raw);
    } else {
      this.name = crypto.randomUUID().slice(0, 7);
      this.resourceType = "video/" + raw.split(".").reverse()[0];
      this.load(raw);
    }
  }

  static fromObject(object: TypeObjectVideo) {
    const instanced = new VideoResource(object.file);
    instanced.on("LOADED", () => {
      instanced.name = object.name;
      instanced.#animations = object.frames;

      instanced.hiddenTimeStart = object.hiddenTimeStart;
      instanced.hiddenTimeEnd = object.hiddenTimeEnd;
      instanced.offsetTime = object.offsetTime;

      instanced.animationIndex = object.animationIndex;
      instanced.animationIn = object.animationIn;
      instanced.animationOut = object.animationOut;
    });

    return instanced;
    //tiempo despues de devolver la instancia se actualizan los valores
  }
}
