import Control from "./Control";
import EventListener from "./EventListener";
import VideoResource, { TypeObjectVideo } from "./VideoResource";
import WebWorker from "./WebWorker";

const events = ["CHANGE_RESOURCES", "CHANGE_IS_SELECT", "CHANGE_DURATION"] as const;
type TypeEvent = (typeof events)[number];

export interface TypeTimeLineObject {
  resource: TypeObjectVideo[];
  visible: boolean;
}
export default class TimeLine {
  id: string = crypto.randomUUID();
  type = "TIMELINE";
  visible = true;
  #resources: VideoResource[] = [];
  subject = new EventListener();
  control: Control;
  isSelect: boolean = false;

  totalDuration = 0;

  constructor(control: Control) {
    this.control = control;
    control?.on("CHANGE_SELECT_TIMELINE", () => {
      this.isSelect = this.control.selectTimeLine === this.id;
      this.fire("CHANGE_IS_SELECT");
    });
  }

  recording(start: boolean) {
    this.#resources.forEach((res) => {
      res.recording(start);
    });
  }
  emit(context: CanvasRenderingContext2D | WebWorker, seek: number, isPlaying: boolean) {
    this.#resources.forEach((resource) => {
      if (context) {
        return resource.emit(context, seek, isPlaying);
      }
    });
  }

  checkColisions(start: number, end: number, idExeption?: string) {
    let colition = false;
    if (start < 0) colition = true;
    for (const resource of this.#resources) {
      if (idExeption !== resource.id) {
        const minPosition = resource.offsetTime;
        const maxPosition = resource.offsetTime + resource.duration;
        if (end > minPosition && maxPosition > start) {
          colition = true;
        }
      }
    }
    return colition;
  }

  getFreeTime() {
    let freeTime = 0;
    for (const resource of this.#resources) {
      const maxTime = resource.offsetTime + resource.duration;
      freeTime = Math.max(freeTime, maxTime);
    }
    return freeTime;
  }

  removeSelf() {
    this.control.removeTimeLine(this.id);
  }
  selectSelf() {
    this.control.selectTimeLine = this.id;
  }
  #processResource(files: File[]) {
    const admittedTypes = ["video/mp4", "video/webp"];
    const promises: Promise<void>[] = [];
    for (const raw of files) {
      promises.push(
        new Promise<void>((resolve, reject) => {
          if (admittedTypes.includes(raw.type)) {
            const videoResource = new VideoResource(raw);
            const $subLoad = videoResource.on("LOADED", () => {
              //setea el recurso ya cargado
              videoResource.addControl(this.control);
              videoResource.offsetTime = this.getFreeTime();
              videoResource.timeLine = this;

              //añade el nuevo recurso
              this.#resources.push(videoResource);
              this.fire("CHANGE_RESOURCES");
              resolve();

              //observa la duracion
              this.verifyDuration();
              videoResource.on("CHANGE_DURATION", () => this.verifyDuration());
              videoResource.on("CHANGE_OFFSET_TIME", () => this.verifyDuration());

              //limia los observables
              $subLoad.unsubscribe();
              $subError.unsubscribe();
            });

            //en caso de fallar la carga
            const $subError = videoResource.on("LOAD_ERROR", () => {
              reject();
              $subLoad.unsubscribe();
              $subError.unsubscribe();
            });
          } else {
            // si no esta dentro de los tipos incluidos
            reject("tipo no admitido");
          }
        })
      );
    }
    return Promise.all(promises);
  }
  addResourceFromInput() {
    const inputElement = document.createElement("input");
    inputElement.type = "file";
    inputElement.multiple = true;
    inputElement.addEventListener("change", (e) => {
      if (e.target) {
        return this.#processResource([...e.target.files]);
      }
    });
    inputElement.click();
  }

  addResourcesProcesed(resources: VideoResource[]) {
    for (const videoResource of resources) {
      const $subLoad = videoResource.on("LOADED", () => {
        //setea el recurso ya cargado
        videoResource.addControl(this.control);
        videoResource.offsetTime = this.getFreeTime();
        videoResource.timeLine = this;

        //añade el nuevo recurso
        this.#resources.push(videoResource);
        this.fire("CHANGE_RESOURCES");

        //observa la duracion
        this.verifyDuration();
        videoResource.on("CHANGE_DURATION", () => this.verifyDuration());
        videoResource.on("CHANGE_OFFSET_TIME", () => this.verifyDuration());

        //limia los observables
        $subLoad.unsubscribe();
        $subError.unsubscribe();
      });

      //en caso de fallar la carga
      const $subError = videoResource.on("LOAD_ERROR", () => {
        $subLoad.unsubscribe();
        $subError.unsubscribe();
      });
    }
  }
  removeResource(id: string) {
    this.#resources = this.#resources.filter((res) => res.id !== id);
    this.fire("CHANGE_RESOURCES");
    this.verifyDuration();
  }
  getResources() {
    return [...this.#resources];
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
  verifyDuration() {
    let maxDuration = 0;
    for (const resource of this.#resources) {
      maxDuration = Math.max(maxDuration, resource.offsetTime + resource.duration);
    }
    if (maxDuration !== this.totalDuration) {
      this.totalDuration = maxDuration;
      this.fire("CHANGE_DURATION");
    }
  }
  toObject(): TypeTimeLineObject {
    return {
      resource: this.getResources()
        .map((res) => res.toObject())
        .filter((res) => !!res),
      visible: this.visible,
    };
  }
  static fromObject(object: TypeTimeLineObject, control: Control) {
    const instansed = new TimeLine(control);
    instansed.visible = object.visible;
    const instancedVideos = object.resource.map((objectVideo) => {
      return VideoResource.fromObject(objectVideo);
    });
    instansed.addResourcesProcesed(instancedVideos);
    return instansed;
  }
}
