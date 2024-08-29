console.log("worker loaded");
import { ArrayBufferTarget as MP4_ArrayBufferTarget, Muxer as MP4Muxer } from "mp4-muxer";
import { ArrayBufferTarget as WEBM_ArrayBufferTarget, Muxer as WEBMMuxer } from "webm-muxer";
import { eventsReturned } from "./WebWorker";

type TypeEventsReturned = (typeof eventsReturned)[number];

let canvas: null | OffscreenCanvas = null;
let context: null | OffscreenCanvasRenderingContext2D = null;

let width: null | number = null;
let height: null | number = null;
let format: null | "MP4" | "WEBM" = null;
let fps: number = 30;
let currentTime: number = 0;
let lastKeyframe = 0;

let muxerRecord: MP4Muxer<MP4_ArrayBufferTarget> | WEBMMuxer<WEBM_ArrayBufferTarget> | null = null;
let videoEncoder: VideoEncoder | null = null;
let audioEncoder: AudioEncoder | null = null;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function fire(event: TypeEventsReturned, info?: any, trasfers?: Transferable[]) {
  if (eventsReturned.includes(event)) {
    if (trasfers) self.postMessage({ event, info }, { transfer: trasfers });
    else self.postMessage({ event, info });
  }
}

interface infoInit {
  width: number;
  height: number;
  format: "MP4" | "WEBM";
  fps: number;
}

interface infoPreparate {
  background: string;
  currentTime: number;
}

const events = {
  INIT: (info: infoInit) => {
    width = info.width;
    height = info.height;
    format = info.format;
    fps = info.fps;
    canvas = new OffscreenCanvas(info.width, info.height);
    context = canvas.getContext("2d", {
      willReadFrequently: true,
      desynchronized: true,
    });

    muxerRecord =
      format === "MP4"
        ? new MP4Muxer({
            target: new MP4_ArrayBufferTarget(),
            video: {
              codec: "avc",
              width: canvas.width,
              height: canvas.height,
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
              width: canvas.width,
              height: canvas.height,
            },
            audio: {
              codec: "A_OPUS",
              numberOfChannels: 2,
              sampleRate: 48000,
            },
            firstTimestampBehavior: "offset",
          });
    videoEncoder = new VideoEncoder({
      output: (chunck, meta) => muxerRecord?.addVideoChunk(chunck, meta),
      error: (e) => console.log(e),
    });

    videoEncoder.configure(
      format === "MP4"
        ? {
            codec: "avc1.42001f",
            width: width,
            height: height,
            bitrate: 500_000,
            bitrateMode: "constant",
          }
        : {
            codec: "vp09.00.10.08",
            width: width,
            height: height,
            bitrate: 1e6,
          }
    );

    //AUDIO

    audioEncoder = new AudioEncoder({
      output: (chunck, meta) => muxerRecord?.addAudioChunk(chunck, meta),
      error: (e) => console.log(e),
    });

    audioEncoder.configure(
      format === "MP4"
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
  },
  PREPARATE: (info: infoPreparate) => {
    currentTime = info.currentTime;

    if (context && width && height) {
      context.clearRect(0, 0, width, height);

      //Background;
      context.save();
      context.fillStyle = info.background;
      context.fillRect(0, 0, width, height);
      context.restore();
    }
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  DRAW: ({ frame, ...animated }: any) => {
    if (context) {
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
      context.drawImage(frame, animated.cropImageX, animated.cropImageY, animated.cropImageW, animated.cropImageH, 0, 0, animated.outputWidth, animated.outputHeight);
      context.restore();
      frame.close();
    }
  },
  PRINT_FRAME: () => {
    if (canvas && videoEncoder) {
      const currentFrame = Math.floor((currentTime / 1000) * fps);
      const key = currentTime > lastKeyframe + 2000;
      if (key) lastKeyframe = currentTime;
      console.log(currentTime, key);

      const frame = new VideoFrame(canvas, {
        timestamp: (currentFrame * 1e6) / fps,
      });
      videoEncoder.encode(frame, { keyFrame: key });

      frame.close();
      fire("NEXT_FRAME");
    }
  },
  AUDIO_ENCODE: (audioData: AudioData) => {
    if (audioEncoder) {
      audioEncoder.encode(audioData);
      audioData.close();
    }
  },
  EXPORT: async () => {
    if (videoEncoder && audioEncoder && muxerRecord) {
      lastKeyframe = 0;
      currentTime = 0;
      await videoEncoder.flush();
      await audioEncoder.flush();
      muxerRecord.finalize();
      const buffer = muxerRecord.target.buffer;
      fire("OUTPUT", buffer, [buffer]);
      audioEncoder.close();
      audioEncoder = null;
      videoEncoder.close();
      videoEncoder = null;
      muxerRecord = null;
      canvas = null;

      context = null;
    }
  },
};

export interface propReceiveData {
  event: keyof typeof events;
  info: unknown;
}
self.addEventListener("message", ({ data }: { data: propReceiveData }) => {
  const actionSelect = events[data.event];
  if (actionSelect) {
    actionSelect(data.info);
  }
});
