export default class {
  #currentTime = 0;
  #state: "PLAYING" | "STOP" = "STOP";
  #timeIntervale = 15;
  constructor() {
    setInterval(() => {
      this.#tick();
    }, this.#timeIntervale);
  }
  #tick() {
    if (this.#state === "PLAYING") {
      this.#currentTime += this.#timeIntervale;
    }
  }
  play() {
    this.#state = "PLAYING";
  }
  pause() {
    this.#state = "STOP";
  }
  getElapsedTime() {
    return this.#currentTime;
  }

  setSeeking(seek: number) {
    this.#currentTime = seek;
  }

  resume() {}
}
