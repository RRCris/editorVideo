import Clock from "./Clock";
import EventListener from "./EventListener";
import TimeLine, { TypeTimeLineObject } from "./TimeLine";
import { ArrayBufferTarget as MP4_ArrayBufferTarget, Muxer as MP4Muxer } from "mp4-muxer";
import { ArrayBufferTarget as WEBM_ArrayBufferTarget, Muxer as WEBMMuxer } from "webm-muxer";

import audioRaw from "../assets/gospel-choir.mp3";
import WebWorker from "./WebWorker";

const states = ["STOP", "PLAYING", "RECORDING"] as const;
type TypeState = (typeof states)[number];

const files = ["MP4", "WEBM"] as const;
type TypeFiles = (typeof files)[number];

const events = [
  "CHANGE_STATE",
  "HOT_PLAYING",
  "CHANGE_SCALE",
  "CHANGE_OFFSETX",
  "CHANGE_OFFSETY",
  "CHANGE_SELECT",
  "CHANGE_DURATION",
  "CHANGE_TIMELINES",
  "CHANGE_SELECT_TIMELINE",
  "CHANGE_ZOOM_TIME",
  "CHANGE_MODE_LOOP",
  "CHANGE_FORMAT",
  "ENDING",
] as const;
type TypeEvent = (typeof events)[number];

export default class Control {
  container = document.createElement("canvas");
  context = this.container.getContext("2d");
  clock = new Clock();
  subject = new EventListener();
  type = "CONTROL";

  #timeLines: TimeLine[] = [];
  #selectTimeLine: string | null = null;
  #selectResource: string | null = null;
  #state: TypeState = "STOP";
  #format: TypeFiles = "MP4";
  fps = 60;
  width = 720;
  height = 420;
  background = "hsl(104, 44%, 24%)";
  timeStart: number | null = null;
  timeEnd: number | null = null;
  #modeLoop: boolean = false;
  currentTime = 0;

  #zoomTime = 100;

  #scale = 1;
  #offsetX = 0;
  #offsetY = 0;
  duration: number = 0;

  #canvasRecord: OffscreenCanvas | null = null;
  #contextRecord: OffscreenCanvasRenderingContext2D | null = null;

  #worker: WebWorker | null = null;
  #muxerRecord: MP4Muxer<MP4_ArrayBufferTarget> | WEBMMuxer<WEBM_ArrayBufferTarget> | null = null;
  #videoEncoder: VideoEncoder | null = null;
  #audioEncoder: AudioEncoder | null = null;
  #trackAudio: MediaStreamTrack | null = null;
  #lastkey = 0;

  #totalFrames: number = 0;
  #currentFrame: number = 0;

  //file
  set format(newValue: "MP4" | "WEBM") {
    if (files.includes(newValue)) {
      this.#format = newValue;
      this.fire("CHANGE_FORMAT");
    }
  }
  get format() {
    return this.#format;
  }

  //modeLoop
  set modeLoop(newValue: boolean) {
    this.#modeLoop = newValue;
    this.fire("CHANGE_MODE_LOOP");
  }
  get modeLoop() {
    return this.#modeLoop;
  }
  //zoomTime
  set zoomTime(newValue: number) {
    this.#zoomTime = newValue;
    this.fire("CHANGE_ZOOM_TIME");
  }
  get zoomTime() {
    return this.#zoomTime;
  }

  //selectTimeLine
  set selectTimeLine(newID: string | null) {
    this.#selectTimeLine = newID;
    this.fire("CHANGE_SELECT_TIMELINE");
  }
  get selectTimeLine() {
    return this.#selectTimeLine;
  }

  //duration

  //selectResource
  set selectResource(newId: string | null) {
    this.#selectResource = newId;
    this.fire("CHANGE_SELECT");
  }
  get selectResource() {
    return this.#selectResource;
  }

  //scale
  set scale(newValue: number) {
    if (newValue !== this.#scale && this.state !== "RECORDING") {
      this.#scale = newValue;
      this.fire("CHANGE_SCALE");
    }
  }
  get scale() {
    return this.#scale;
  }

  //offsetX
  set offsetX(newValue: number) {
    if (newValue !== this.#offsetX && this.state !== "RECORDING") {
      this.#offsetX = newValue;
      this.fire("CHANGE_OFFSETX");
    }
  }
  get offsetX() {
    return this.#offsetX;
  }

  //offsetY
  set offsetY(newValue: number) {
    if (newValue !== this.#offsetY && this.state !== "RECORDING") {
      this.#offsetY = newValue;
      this.fire("CHANGE_OFFSETY");
    }
  }
  get offsetY() {
    return this.#offsetY;
  }

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

  constructor() {
    if (window.AudioEncoder !== undefined) console.log("soport Audio Encoder");
    if (window.VideoEncoder !== undefined) console.log("soport Video Encoder");
    if (window.VideoFrame !== undefined) console.log("soport Video Frame");
    if (window.MediaStreamTrackProcessor !== undefined) console.log("soport MediaStreamTrackProcessor");
    if (MediaRecorder.isTypeSupported("video/mp4;codecs=avc1,mp4a.40.2")) console.log("soport export MP4");
    if (MediaRecorder.isTypeSupported("video/webm;codecs=vp9,Opus")) console.log("soport export WEBM");
    this.container.width = this.width;
    this.container.height = this.height;

    this.addTimeLine();

    //initializer
    this.clock.pause();
    requestAnimationFrame(() => this.emit());
  }
  couple(root: HTMLDivElement) {
    root.appendChild(this.container);
  }
  disengage(root: HTMLDivElement) {
    root.removeChild(this.container);
  }

  //CLOCK
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
    if (this.context && this.state !== "RECORDING") {
      this.currentTime = this.clock.getElapsedTime();

      //Si ha terminado la emision
      if (this.currentTime >= (this.timeEnd || this.duration)) {
        this.fire("ENDING");
        if (!this.modeLoop) this.pause();
        this.clock.setSeeking(this.timeStart || 0);
      }

      this.draw(this.context, this.currentTime, this.state === "PLAYING");
      //!Ojo con este evento se dispara 60 veces por segundo
      this.fire("HOT_PLAYING");
    }
    setTimeout(() => this.emit(), 1000 / this.fps);
  }
  draw(context: OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D | WebWorker, currentTime: number, play: boolean) {
    if (context instanceof WebWorker) {
      context.fire("PREPARATE", { background: this.background, currentTime });
      this.#timeLines.toReversed().forEach((timeline) => {
        timeline.emit(context, currentTime, play);
      });
    } else {
      //addMutations & clear
      context.clearRect(0, 0, this.width, this.height);
      context.save();
      if (this.state !== "RECORDING") {
        context.scale(this.scale, this.scale);
        context.translate(this.offsetX, this.offsetY);
      }

      //Background
      context.save(); //Background;
      context.fillStyle = this.background;
      context.fillRect(0, 0, this.width, this.height);
      context.restore();

      //DRAW
      this.#timeLines.toReversed().forEach((timeline) => {
        timeline.emit(context, currentTime, play);
      });
      context.restore();
    }
  }

  async setupRecord() {
    //conteo de  tiempo
    console.time("record");
    console.log("start");

    //Prepate scene
    this.state = "RECORDING";
    this.#timeLines.forEach((tl) => tl.recording(true));
    this.pause();

    // Prepare resourceRecord
    this.#canvasRecord = new OffscreenCanvas(this.width, this.height);
    this.#contextRecord = this.#canvasRecord.getContext("2d", {
      willReadFrequently: true,
      desynchronized: true,
    });

    //Create muxer
    this.#muxerRecord =
      this.format === "MP4"
        ? new MP4Muxer({
            target: new MP4_ArrayBufferTarget(),
            video: {
              codec: "avc",
              width: this.#canvasRecord.width,
              height: this.#canvasRecord.height,
            },
            audio: {
              codec: "aac",
              numberOfChannels: 2,
              sampleRate: 48000,
            },
            fastStart: false,
            firstTimestampBehavior: "offset",
          })
        : new WEBMMuxer({
            target: new WEBM_ArrayBufferTarget(),
            video: {
              codec: "V_VP9",
              width: this.width,
              height: this.height,
            },
            audio: {
              codec: "A_OPUS",
              numberOfChannels: 2,
              sampleRate: 48000,
            },
            firstTimestampBehavior: "offset",
          });

    this.#videoEncoder = new VideoEncoder({
      output: (chunck, meta) => this.#muxerRecord?.addVideoChunk(chunck, meta),
      error: (e) => console.log(e),
    });

    this.#videoEncoder.configure(
      this.format === "MP4"
        ? {
            codec: "avc1.42001f",
            width: this.width,
            height: this.height,
            bitrate: 500_000,
            bitrateMode: "constant",
          }
        : {
            codec: "vp09.00.10.08",
            width: this.width,
            height: this.height,
            bitrate: 1e6,
          }
    );

    // //AUDIO
    const context = new AudioContext();
    const temporalBuffer = context.createBufferSource();
    fetch(audioRaw)
      .then((res) => res.arrayBuffer())
      .then((bufferRaw) => new AudioContext().decodeAudioData(bufferRaw))
      .then((bufferAudio) => {
        const audioNode = context.createMediaStreamDestination();
        temporalBuffer.buffer = bufferAudio;
        temporalBuffer.connect(audioNode);
        this.#trackAudio = audioNode.stream.getAudioTracks()[0];

        this.#audioEncoder = new AudioEncoder({
          output: (chunck, meta) => this.#muxerRecord?.addAudioChunk(chunck, meta),
          error: (e) => console.log(e),
        });

        this.#audioEncoder.configure(
          this.format === "MP4"
            ? {
                codec: "mp4a.40.2",
                sampleRate: 48000,
                numberOfChannels: 2,
                bitrate: 128_000,
              }
            : {
                codec: "opus",
                numberOfChannels: 2,
                sampleRate: 48000,
                bitrate: 64000,
              }
        );
        const audioEncoder = this.#audioEncoder;
        const state = this.state;

        const trackProcessor = new MediaStreamTrackProcessor({ track: this.#trackAudio });
        const consumer = new WritableStream({
          write(audioData) {
            if (state !== "RECORDING") return;
            audioEncoder.encode(audioData);
          },
        });
        trackProcessor.readable.pipeTo(consumer);
        //     //start record
        if (this.#contextRecord) {
          this.draw(this.#contextRecord, 0, false);

          setTimeout(() => {
            this.loopRecord();
            temporalBuffer.start();
            this.clock.play();
          }, 30);
        }
      });
  }
  async loopRecord() {
    if (this.#contextRecord && this.#canvasRecord && this.#videoEncoder && this.#muxerRecord && this.#audioEncoder) {
      //draw
      const currentTime = this.clock.getElapsedTime();
      const currentFrame = Math.floor((currentTime / 1000) * this.fps);

      const key = currentTime > this.#lastkey + 2000;
      if (key) {
        this.#lastkey = currentTime;
      }
      this.draw(this.#contextRecord, currentTime, true);

      //Put frame
      const frame = new VideoFrame(this.#canvasRecord, {
        timestamp: (currentFrame * 1e6) / this.fps,
      });
      this.#videoEncoder.encode(frame, { keyFrame: key });

      frame.close();

      //loop
      if (currentTime >= (this.timeEnd || this.duration)) {
        //reestart
        this.state = "STOP";
        this.#lastkey = 0;
        this.clock.pause();

        //Terminate Video
        this.#trackAudio?.stop();
        await this.#videoEncoder.flush();
        await this.#audioEncoder.flush();
        this.#muxerRecord.finalize();
        const buffer = this.#muxerRecord.target.buffer;
        const blob = new Blob([buffer]);

        //Download
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.style.display = "none";
        a.href = url;
        a.download = "animation." + (this.format === "MP4" ? "mp4" : "webm");
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);

        //time end
        console.timeEnd("record");
      } else {
        setTimeout(() => this.loopRecord(), 1000 / this.fps);
      }
    }
  }
  setupWorker() {
    //conteo de  tiempo
    console.time("record");
    console.log("start");

    //Prepate scene
    this.state = "RECORDING";
    this.#timeLines.forEach((tl) => tl.recording(true));
    this.pause();

    this.#totalFrames = (this.duration / 1000) * this.fps;
    this.#currentFrame = 0;
    //AUDIO
    const context = new AudioContext();
    const temporalBuffer = context.createBufferSource();
    fetch(audioRaw)
      .then((res) => res.arrayBuffer())
      .then((bufferRaw) => new AudioContext().decodeAudioData(bufferRaw))
      .then((bufferAudio) => {
        //Extraer Stram de AudioContext
        const audioNode = context.createMediaStreamDestination();
        temporalBuffer.buffer = bufferAudio;
        temporalBuffer.connect(audioNode);
        this.#trackAudio = audioNode.stream.getAudioTracks()[0];

        //Worker
        this.#worker = new WebWorker();
        this.#worker.fire("INIT", { width: this.width, height: this.height, format: this.format, fps: this.fps });

        //Procesar Audio
        const worker = this.#worker;
        const trackProcessor = new MediaStreamTrackProcessor({ track: this.#trackAudio });
        const consumer = new WritableStream({
          write(audioData) {
            worker.fire("AUDIO_ENCODE", audioData, [audioData]);
          },
        });
        trackProcessor.readable.pipeTo(consumer);

        //start record
        setTimeout(() => {
          this.drawWorker();
          temporalBuffer.start();
          this.clock.play();
        }, 30);
        // }
      });
  }
  drawWorker() {
    if (this.#worker) {
      // const currentTime = this.clock.getElapsedTime();
      // if (currentTime >= (this.timeEnd || this.duration)) {
      if (this.#currentFrame >= this.#totalFrames) {
        const $sub = this.#worker.on("OUTPUT", () => {
          const output = this.#worker?.output;
          if (typeof output !== "number" && output) {
            //Restart Services
            this.state = "STOP";
            this.#lastkey = 0;
            this.clock.pause();
            this.#timeLines.forEach((tl) => tl.recording(false));

            //Download
            const blob = new Blob([output]);
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.style.display = "none";
            a.href = url;
            a.download = "animation." + (this.format === "MP4" ? "mp4" : "webm");
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);

            //time end
            console.timeEnd("record");
          }
          $sub.unsubscribe();
        });
        this.#trackAudio?.stop();
        this.#worker.fire("EXPORT");
      } else {
        const $sub = this.#worker.on("NEXT_FRAME", () => {
          $sub.unsubscribe();
          requestAnimationFrame(() => this.drawWorker());
        });
        const currentTime = (this.#currentFrame / this.#totalFrames) * this.duration;
        this.draw(this.#worker, currentTime, true);
        this.#worker.fire("PRINT_FRAME");
        this.#currentFrame++;
      }
    }
  }

  reset() {
    this.scale = 1;
    this.offsetX = 0;
    this.offsetY = 0;
  }

  //TIMELINES
  addTimeLine(timeline?: TimeLine) {
    timeline = timeline || new TimeLine(this);
    timeline.on("CHANGE_DURATION", () => this.verifyDuration());
    this.#timeLines.push(timeline);
    this.fire("CHANGE_TIMELINES");
  }
  removeTimeLine(id: string) {
    this.#timeLines = this.#timeLines.filter((tl) => tl.id !== id);
    this.fire("CHANGE_TIMELINES");
  }

  getTimeLines() {
    return [...this.#timeLines];
  }

  verifyDuration() {
    let maxDuration = 0;
    for (const timeline of this.#timeLines) {
      maxDuration = Math.max(maxDuration, timeline.totalDuration);
    }
    this.duration = maxDuration;
    this.fire("CHANGE_DURATION");
  }
  reordenTimeLines(toIndex: number, id: string) {
    const newTimeLines: TimeLine[] = [];
    const moveTimeline = this.#timeLines.find((tl) => tl.id === id);
    if (moveTimeline) {
      for (const i in this.#timeLines) {
        if (toIndex === parseInt(i)) {
          newTimeLines.push(moveTimeline);
          if (moveTimeline.id !== this.#timeLines[i].id) newTimeLines.push(this.#timeLines[i]);
        } else if (moveTimeline.id === this.#timeLines[i].id) {
          //
        } else {
          newTimeLines.push(this.#timeLines[i]);
        }
      }
      this.#timeLines = newTimeLines;
      this.fire("CHANGE_TIMELINES");
    }
  }

  //HELPERS
  getAxisNear(x: number, y: number, w: number, h: number, idExeption: string) {
    const response: {
      x: null | number;
      y: null | number;
      offX: number;
      offY: number;
    } = {
      x: null,
      y: null,
      offX: 0,
      offY: 0,
    };
    const offset = 10;

    function checkBounds(compareX: number, compareY: number, compareW: number, compareH: number) {
      //x
      if (compareX + offset > x && compareX - offset < x) {
        response.x = compareX;
      }
      if (compareX + compareW + offset > x && compareX + compareW - offset < x) {
        response.x = compareX + compareW;
      }
      //x + w
      if (compareX + offset > x + w && compareX - offset < x + w) {
        response.x = compareX - w;
        response.offX = w;
      }
      if (compareX + compareW + offset > x + w && compareX + compareW - offset < x + w) {
        response.x = compareX + compareW - w;
        response.offX = w;
      }
      //y
      if (compareY + offset > y && compareY - offset < y) {
        response.y = compareY;
      }
      if (compareY + compareH + offset > y && compareX + compareH - offset < y) {
        response.y = compareY + compareH;
      }
      //y + h
      if (compareY + offset > y + h && compareY - offset < y + h) {
        response.y = compareY - h;
        response.offY = h;
      }
      if (compareY + compareH + offset > y + h && compareY + compareH - offset < y + h) {
        response.y = compareY + compareH - h;
        response.offY = h;
      }
    }
    //Comprobamos con los bordes
    checkBounds(0, 0, this.width, this.height);
    //comprobamos con los recursos
    for (const timeLine of this.#timeLines) {
      for (const resource of timeLine.getResources()) {
        if (resource.id !== idExeption) {
          checkBounds(resource.outputX, resource.outputY, resource.outputWidth, resource.outputHeight);
        }
      }
    }
    return response;
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
  importTimeLines(timeLineObjects: TypeTimeLineObject[]) {
    for (const timeLineObject of timeLineObjects) {
      const timeline = TimeLine.fromObject(timeLineObject, this);
      this.addTimeLine(timeline);
    }
  }
}
