import EventListener from "./EventListener";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const states = ["UNLOAD", "STOP", "LOADERROR", "PLAYING"] as const;
type TypeState = (typeof states)[number];

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const events = [
  "LOADED",
  "LOADERROR",
  "CHANGE_NAME",
  "CHANGE_OUTPUTX",
  "CHANGE_OUTPUTY",
  "CHANGE_OUTPUTWIDTH",
  "CHANGE_OUTPUTHEIGHT",
  "CHANGE_CROPIMAGEX",
  "CHANGE_CROPIMAGEY",
  "CHANGE_CROPIMAGEW",
  "CHANGE_CROPIMAGEH",
] as const;
type TypeEvent = (typeof events)[number];

export default class {
  containerVideo = document.createElement("video");
  subject = new EventListener();
  type = "VIDEO";
  id = crypto.randomUUID();
  state: TypeState = "UNLOAD";

  resourceType: string | undefined;
  resourceWidth: number | undefined;
  resourceHeight: number | undefined;

  #name: string = "unnamedvideo";

  #cropImageX: number = 0;
  #cropImageY: number = 0;
  #cropImageW: number = 0;
  #cropImageH: number = 0;

  #outputWidth: number = 240;
  #outputHeight: number = 140;
  #outputX: number = 0;
  #outputY: number = 0;
  /*
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
    if (newValue !== this.#outputX) {
      this.#outputX = newValue;
      this.fire("CHANGE_OUTPUTX");
    }
  }
  get outputX() {
    return this.#outputX;
  }

  //outputY
  set outputY(newValue: number) {
    if (newValue !== this.#outputY) {
      this.#outputY = newValue;
      this.fire("CHANGE_OUTPUTY");
    }
  }
  get outputY() {
    return this.#outputY;
  }

  //outputWidth
  set outputWidth(newValue: number) {
    if (newValue !== this.#outputWidth) {
      this.#outputWidth = newValue;
      this.fire("CHANGE_OUTPUTWIDTH");
    }
  }
  get outputWidth() {
    return this.#outputWidth;
  }

  //outputHeight
  set outputHeight(newValue: number) {
    if (newValue !== this.#outputHeight) {
      this.#outputHeight = newValue;
      this.fire("CHANGE_OUTPUTHEIGHT");
    }
  }
  get outputHeight() {
    return this.#outputHeight;
  }

  //cropImageX
  set cropImageX(newValue: number) {
    if (newValue !== this.#cropImageX && newValue >= 0 && newValue <= (this.resourceWidth || 0)) {
      this.#cropImageX = newValue;
      this.fire("CHANGE_CROPIMAGEX");
    }
  }
  get cropImageX() {
    return this.#cropImageX;
  }

  //cropImageY
  set cropImageY(newValue: number) {
    if (newValue !== this.#cropImageY && newValue >= 0 && newValue <= (this.resourceHeight || 0)) {
      this.#cropImageY = newValue;
      this.fire("CHANGE_CROPIMAGEY");
    }
  }
  get cropImageY() {
    return this.#cropImageY;
  }

  //cropImageW
  set cropImageW(newValue: number) {
    if (newValue !== this.#cropImageW && newValue >= 0 && newValue <= (this.resourceWidth || 0)) {
      this.#cropImageW = newValue;
      this.fire("CHANGE_CROPIMAGEW");
    }
  }
  get cropImageW() {
    return this.#cropImageW;
  }

  //cropImageH
  set cropImageH(newValue: number) {
    if (newValue !== this.#cropImageH && newValue >= 0 && newValue <= (this.resourceHeight || 0)) {
      this.#cropImageH = newValue;
      this.fire("CHANGE_CROPIMAGEH");
    }
  }
  get cropImageH() {
    return this.#cropImageH;
  }

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
  emit(context: AudioContext | CanvasRenderingContext2D, seek: number, isPlaying: boolean) {
    if (context instanceof CanvasRenderingContext2D) {
      const offset = 100;
      const curr = this.containerVideo.currentTime * 1000;
      if (curr > seek + offset || curr < seek - offset) {
        /**
         * No se puede estar seteando currentTime constantemente por lo que  solo lo seteo
         * cuando la diferencia entre el tiempo que deberia tener o el que tiene supera los 100 milisegundos
         */

        console.log("actualizacion");
        this.containerVideo.currentTime = seek / 1000; //"seek" esta en milisegundos y currentTime recibe segundo
      }
      if (isPlaying) {
        this.containerVideo.play();
      } else {
        this.containerVideo.pause();
      }
      context.drawImage(this.containerVideo, this.#cropImageX, this.#cropImageY, this.#cropImageW, this.#cropImageH, this.outputX, this.outputY, this.outputWidth, this.outputHeight);
    }
  }

  load(url: string) {
    //verificar tipo y compatibilidad
    //cargar en nuestro container
    this.containerVideo.addEventListener("loadeddata", () => {
      //adquirir tamaño
      document.body.appendChild(this.containerVideo);
      const { width, height } = this.containerVideo.getBoundingClientRect();
      this.resourceHeight = height;
      this.resourceWidth = width;
      this.cropImageW = this.resourceWidth;
      this.cropImageH = this.resourceHeight;
      document.body.removeChild(this.containerVideo);
      //avisar que ya podemos emitir
      this.state = "STOP";
      this.fire("LOADED");
      //alistarvideo
    });
    this.containerVideo.addEventListener("error", () => {
      this.state = "LOADERROR";
      this.fire("LOADERROR");
    });

    this.containerVideo.src = url;
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
        this.fire("LOADERROR");
      };
      reader.readAsDataURL(raw);
    } else {
      this.name = crypto.randomUUID().slice(0, 7);
      this.resourceType = "video/" + raw.split(".").reverse()[0];
      this.load(raw);
    }
  }
}
