export const presetsEasing: gsap.EaseString[] = ["none", "back", "bounce", "elastic", "circ", "expo", "power1", "power2", "power3", "power4", "sine"];

export interface TypeAnimationOptional {
  cropImageX?: number;
  cropImageY?: number;
  cropImageW?: number;
  cropImageH?: number;

  outputWidth?: number;
  outputHeight?: number;
  outputX?: number;
  outputY?: number;
  outputRotate?: number;
  opacity?: number;

  ease: gsap.EaseString;

  blur?: number;
  brightness?: number;
  grayscale?: number;
  hueRotation?: number;
  contrast?: number;
  invert?: number;
  saturate?: number;
  sepia?: number;

  shadowOffsetX?: number;
  shadowOffsetY?: number;
  shadowBlur?: number;
  shadowColor?: string;
}

export type TypeAnimationPresets = {
  [k: string]: TypeAnimationOptional | null;
};

export const presetsAnimations: TypeAnimationPresets = {
  NONE: null,
  FADE_IN: {
    ease: "power1",
    opacity: 0,
  },
  BOUNCE_DOWN: {
    ease: "bounce",
    outputY: -400,
  },
  BOUNCE_UP: {
    ease: "bounce",
    outputY: 400,
  },
  BOUNCE_LEFT: {
    ease: "bounce",
    outputX: 400,
  },
  BOUNCE_RIGHT: {
    ease: "bounce",
    outputX: -400,
  },
  SCALE_IN: {
    ease: "power4",
    opacity: 0,
    outputWidth: 0,
    outputHeight: 0,
  },
  CROP_IN: {
    ease: "power4",
    opacity: 0,
    outputWidth: 0,
    outputHeight: 0,
    cropImageW: 0,
    cropImageH: 0,
  },
  WRAP_HORIZONTAL: {
    ease: "power1",
    outputWidth: 0,
  },
  WRAP_VERTICAL: {
    ease: "power1",
    outputHeight: 0,
  },
  FLIP_UP: {
    ease: "sin",
    outputRotate: 90,
    outputHeight: 0,
  },
  FLIP_DOWN: {
    ease: "sin",
    outputRotate: -90,
    outputHeight: 0,
  },
  NEWSPAPER: {
    ease: "power1.out",
    outputRotate: 600,
    outputWidth: 300,
    outputHeight: 300,
    outputX: 300,
    outputY: 300,
  },
};
