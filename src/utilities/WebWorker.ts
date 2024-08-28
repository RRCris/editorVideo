import EventListener from "./EventListener";

const events = ["INIT", "PREPARATE", "DRAW", "PRINT_FRAME", "EXPORT"] as const;
type TypeEvents = (typeof events)[number];

const eventsReturned = ["OUTPUT"] as const;
type TypeEventsReturned = (typeof eventsReturned)[number];
export default class WebWorker {
  #worker = new Worker(new URL("./worker.ts", import.meta.url), { type: "module" });
  #subject = new EventListener();
  output: VideoFrame | null = null;

  constructor() {
    this.#worker.addEventListener("message", ({ data }) => this.processMessage(data));
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fire(event: TypeEvents, info?: any, trasfers?: Transferable[]) {
    if (events.includes(event)) {
      if (trasfers) this.#worker.postMessage({ event, info }, trasfers);
      else this.#worker.postMessage({ event, info });
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  processMessage(message: { event: TypeEventsReturned; info: any }) {
    if (eventsReturned.includes(message.event)) {
      this.output = message.info;
      this.#subject.fire("OUTPUT");
    }
  }

  on(event: TypeEventsReturned, callback: () => void) {
    //Acepta solo eventos registrados
    if (eventsReturned.includes(event)) {
      return this.#subject.on(event, callback);
    } else {
      throw new Error(`El evento de ${event} o esta en la lista de eventos del tpi ${this.type}`);
    }
  }
}
