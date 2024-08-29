import EventListener from "./EventListener";

const events = ["INIT", "PREPARATE", "DRAW", "PRINT_FRAME", "AUDIO_ENCODE", "EXPORT"] as const;
type TypeEvents = (typeof events)[number];

export const eventsReturned = ["OUTPUT", "NEXT_FRAME"] as const;
type TypeEventsReturned = (typeof eventsReturned)[number];
export default class WebWorker {
  type = "Worker";
  #worker = new Worker(new URL("./worker.ts", import.meta.url), { type: "module" });
  #subject = new EventListener();
  output: ArrayBuffer | null | number = null;

  constructor() {
    this.#worker.addEventListener("message", ({ data }) => this.processMessage(data));
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fire(event: TypeEvents, info?: any, trasfers?: Transferable[]) {
    if (events.includes(event)) {
      if (trasfers) this.#worker.postMessage({ event, info }, { transfer: trasfers });
      else this.#worker.postMessage({ event, info });
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  processMessage(message: { event: TypeEventsReturned; info: any }) {
    if (eventsReturned.includes(message.event)) {
      this.output = message.info;
      this.#subject.fire(message.event);
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
