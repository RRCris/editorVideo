import Clock from "./Clock";
import EventListener from "./EventListener";
import VideoResource from "./VideoResource";

const states = ["STOP", "PLAYING"] as const;
type TypeState = (typeof states)[number];

const events = ["CHANGE_STATE", "CHANGE_RESOURSE", "HOT_PLAYING"] as const;
type TypeEvent = (typeof events)[number];

export default class {
  container = document.createElement("canvas");
  context = this.container.getContext("2d");
  clock = new Clock();
  subject = new EventListener();

  type = "CONTROL";
  #resources: VideoResource[] = [];
  #state: TypeState = "STOP";
  fps = 30;
  width = 500;
  height = 400;
  background = "hsl(104, 44%, 24%)";
  timeStart = 0;
  timeEnd = 16000;
  currentTime = 0;

  set state(newState: TypeState) {
    if (states.includes(newState)) {
      this.#state = newState;
      this.fire("CHANGE_STATE");
    }
  }
  get state() {
    return this.#state;
  }

  constructor() {
    this.container.width = this.width;
    this.container.height = this.height;
    //initializer
    this.clock.pause();
    this.emit();
  }
  couple(root: HTMLDivElement) {
    root.appendChild(this.container);
  }
  disengage(root: HTMLDivElement) {
    root.removeChild(this.container);
  }
  #addResourceList(resource: VideoResource) {
    if (resource.state !== "UNLOAD") {
      this.#resources.push(resource);
      this.fire("CHANGE_RESOURSE");
    }
  }
  getResourceList(type?: string) {
    return [...this.#resources];
  }
  addResource(raw: File | string) {
    /**
     * Espera hasta que el componente se cargue para añadirlo a la lista
     * Coming soon: aceptar varios archivos
     * Verficar de que tipo son
     * Verificar que tipi de recurso quiere que se cargue
     */
    return new Promise<void>((resolve, reject) => {
      const videoResource = new VideoResource(raw);
      const $subLoad = videoResource.on("LOADED", () => {
        this.#addResourceList(videoResource);
        resolve();
        $subLoad.unsubscribe();
        $subError.unsubscribe();
      });
      const $subError = videoResource.on("LOAD_ERROR", () => {
        reject();
        $subLoad.unsubscribe();
        $subError.unsubscribe();
      });
    });
  }
  play() {
    if (this.state === "STOP") {
      this.clock.play();
      this.state = "PLAYING";
    }
  }
  pause() {
    if (this.state === "PLAYING") {
      this.clock.pause();
      this.state = "STOP";
    }
  }
  setSeek(seek: number) {
    this.clock.setSeeking(seek);
  }
  emit() {
    if (this.context) {
      this.currentTime = this.clock.getElapsedTime();
      //Si ha terminado la emision
      if (this.currentTime >= this.timeEnd) {
        this.pause();
        this.clock.setSeeking(0);
      }
      //!Ojo con este evento se dispara 60 veces por segundo
      this.fire("HOT_PLAYING");
      //Clear
      this.setupContext();
      this.context.fillStyle = this.background;
      this.context.fillRect(0, 0, this.width, this.height);
    }
    this.#resources.forEach((resource) => {
      if (this.context) {
        this.setupContext();
        return resource.emit(this.context, this.currentTime, this.state === "PLAYING");
      }
    });

    setTimeout(() => {
      this.emit();
    }, 1000 / this.fps);
  }

  setupContext() {
    if (this.context) {
      this.context.filter = "none";
      this.context.fillStyle = "";
      this.context.strokeStyle = "";
      this.context.font = "";
    }
  }

  recording() {
    this.#resources.forEach((resource) => {
      resource.startRecording();
    });
    setTimeout(() => {
      this.#resources.forEach((resource) => {
        resource.endRecording();
      });
    }, 2000);
  }

  getAxisNear(x: number, y: number) {
    return [];
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
}
