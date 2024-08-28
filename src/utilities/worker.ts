console.log("worker loaded");
import { ArrayBufferTarget as MP4_ArrayBufferTarget, Muxer as MP4Muxer } from "mp4-muxer";
import { ArrayBufferTarget as WEBM_ArrayBufferTarget, Muxer as WEBMMuxer } from "webm-muxer";

import audioRaw from "../assets/gospel-choir.mp3";

const eventsReturned = ["OUTPUT"];
type TypeEvents = (typeof eventsReturned)[number];

let canvas: null | OffscreenCanvas = null;
let context: null | OffscreenCanvasRenderingContext2D = null;

let width: null | number = null;
let height: null | number = null;
let format: null | "MP4" | "WEBM" = null;

let muxerRecord: MP4Muxer<MP4_ArrayBufferTarget> | WEBMMuxer<WEBM_ArrayBufferTarget> | null = null;
let videoEncoder: VideoEncoder | null = null;
let trackAudio: MediaStreamTrack | null = null;
let audioEncoder: AudioEncoder | null = null;

interface infoInit {
  width: number;
  height: number;
  format: "MP4" | "WEBM";
}

interface infoPreparate {
  background: string;
}

const events = {
  INIT: (info: infoInit) => {
    width = info.width;
    height = info.height;
    format = info.format;
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
    const oof = new OfflineAudioContext({ length: 0, sampleRate: 0, numberOfChannels: 0 });
    const contextAudio = new AudioContext();
    const temporalBuffer = contextAudio.createBufferSource();
    fetch(audioRaw)
      .then((res) => res.arrayBuffer())
      .then((bufferRaw) => new AudioContext().decodeAudioData(bufferRaw))
      .then((bufferAudio) => {
        const audioNode = contextAudio.createMediaStreamDestination();
        temporalBuffer.buffer = bufferAudio;
        temporalBuffer.connect(audioNode);
        trackAudio = audioNode.stream.getAudioTracks()[0];

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

        const trackProcessor = new MediaStreamTrackProcessor({ track: trackAudio });
        const consumer = new WritableStream({
          write(audioData) {
            if (audioEncoder) {
              audioEncoder.encode(audioData);
              audioData.close();
            }
          },
        });
        trackProcessor.readable.pipeTo(consumer);
        temporalBuffer.start();
      });
  },
  PREPARATE: (info: infoPreparate) => {
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
    }
  },
  PRINT_FRAME: () => {
    if (canvas) {
      const outputFrame = new self.VideoFrame(canvas, {
        timestamp: 0,
      });
      postMessage({ event: "OUTPUT", info: outputFrame }, [outputFrame]);
    }
  },
  EXPORT: () => {
    console.log("EXPORT");
  },
};

interface propReceiveData {
  event: keyof typeof events;
  info: unknown;
}
self.addEventListener("message", ({ data }: { data: propReceiveData }) => {
  const actionSelect = events[data.event];
  if (actionSelect) {
    actionSelect(data.info);
  }
});
