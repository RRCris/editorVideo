import gsap from "gsap";
import EventListener from "./EventListener";

interface TypePresets {
  ease: gsap.EaseString[];
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

  timePoint: number;
  timeAnimation: number;
  ease: gsap.EaseString;

  blur: number;
  brightness: number;
  grayscale: number;
  hueRotation: number;
  contrast: number;
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const states = ["UNLOAD", "STOP", "LOADERROR", "PLAYING", "RECORDING"] as const;
type TypeState = (typeof states)[number];

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const events = [
  "LOADED",
  "LOAD_ERROR",
  "CHANGE_NAME",
  "CHANGE_OUTPUTX",
  "CHANGE_OUTPUTY",
  "CHANGE_OUTPUT_WIDTH",
  "CHANGE_OUTPUT_HEIGHT",
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
] as const;
type TypeEvent = (typeof events)[number];

export default class {
  containerVideo = document.createElement("video");
  subject = new EventListener();
  type = "VIDEO";
  id = crypto.randomUUID();
  state: TypeState = "UNLOAD";

  presets: TypePresets = {
    ease: ["none", "back", "bounce", "elastic", "circ", "expo", "power1", "power2", "power3", "power4", "sine"],
  };
  resourceType: string | undefined;
  resourceWidth: number | undefined;
  resourceHeight: number | undefined;
  resourceDuration: number | undefined;

  #name: string = "unnamedvideo";

  #offsetTime: number = 0;
  #hiddenTimeStart: number = 0;
  #hiddenTimeEnd: number = 0;

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
      outputWidth: 240,
      outputHeight: 140,
      outputX: 0,
      outputY: 0,
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
    },
  ];
  /**
   * ______________________________________________Setters
   */

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
      if (newValue !== this.#offsetTime && newValue >= 0) {
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
      if (newValue !== this.#hiddenTimeStart && newValue >= 0 && newValue <= this.hiddenTimeEnd) {
        this.#hiddenTimeStart = newValue;
        this.fire("CHANGE_HIDDEN_TIME_START");
      }
    }
  }
  get hiddenTimeStart() {
    return this.#hiddenTimeStart;
  }

  //hiddenTimeEnd
  set hiddenTimeEnd(newValue: number) {
    if (this.state !== "RECORDING") {
      if (newValue !== this.#hiddenTimeEnd && newValue >= this.hiddenTimeStart && newValue <= (this.resourceDuration || 0)) {
        this.#hiddenTimeEnd = newValue;
        this.fire("CHANGE_HIDDEN_TIME_END");
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
      }
    }
  }

  get animationIndex() {
    return this.#animationIndex;
  }

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
  emit(context: CanvasRenderingContext2D, seek: number, isPlaying: boolean) {
    //verificamos si esta a tiempo para reproduccir
    const timeleft = seek - this.offsetTime;
    const durationLeft = this.#hiddenTimeEnd - this.#hiddenTimeStart;
    if (timeleft >= 0 && timeleft < durationLeft) {
      const idealTime = timeleft + this.hiddenTimeStart;
      //Update Time
      const offset = 100;
      const curr = this.containerVideo.currentTime * 1000;
      if (curr > idealTime + offset || curr < idealTime - offset) {
        /**
         * No se puede estar seteando currentTime constantemente por lo que  solo lo seteo
         * cuando la diferencia entre el tiempo que deberia tener y el que tiene supera los 100 milisegundos
         */
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
      context.filter = `
      blur(${animated.blur}px) 
      brightness(${animated.brightness}%) 
      grayscale(${animated.grayscale}%) 
      hue-rotate(${animated.hueRotation}deg) 
      contrast(${animated.contrast}%)
      `;
      context.drawImage(
        this.containerVideo,
        animated.cropImageX,
        animated.cropImageY,
        animated.cropImageW,
        animated.cropImageH,
        animated.outputX,
        animated.outputY,
        animated.outputWidth,
        animated.outputHeight
      );

      tl.kill();
    } else {
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
  startRecording() {
    this.state = "RECORDING";
  }
  endRecording() {
    this.state = "STOP";
  }
  /**
   * Animations
   */
  getAnimations() {
    return [...this.#animations];
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

  constructor(raw: File | string) {
    if (raw instanceof File) {
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
}
