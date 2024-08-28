export default class Clock {
  #currentTime = 0;
  #state: "PLAYING" | "STOP" = "STOP";
  #timeIntervale = 5;
  startlimit: number | null = null;
  endlimit: number | null = null;
  loop: boolean = false;
  constructor() {
    setInterval(() => {
      this.#tick();
    }, this.#timeIntervale);
  }
  #tick() {
    if (this.#state === "PLAYING") {
      this.#currentTime += this.#timeIntervale;
      if (this.endlimit && this.endlimit <= this.#currentTime) {
        this.#currentTime = this.startlimit || 0;
        if (!this.loop) this.pause();
      }
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
  getState() {
    return this.#state;
  }
  setSeeking(seek: number) {
    this.#currentTime = seek;
  }

  resume() {}
}
