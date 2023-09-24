import React, { useEffect, useRef } from "react";
import createREGL from "regl";

const VideoPlayer: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  let regl: any;
  let texture: any;

  const playVideo: (video: HTMLVideoElement) => void = (video) => {
    if (!regl) {
      regl = createREGL({
        canvas: canvasRef.current as HTMLCanvasElement,
      });
    }
    texture = regl.texture({
      width: video.videoWidth,
      height: video.videoHeight,
      format: "rgba",
    });
    if (!texture) {
      texture = regl.texture({
        width: video.videoWidth,
        height: video.videoHeight,
        format: "rgba",
      });
    }

    const drawVideo = regl({
      frag: `
        precision mediump float;
        uniform sampler2D videoTexture;
        varying vec2 uv;
        void main () {
          gl_FragColor = texture2D(videoTexture, uv);
        }
      `,
      vert: `
        attribute vec2 position;
        varying vec2 uv;
        void main () {
          uv = position;
          gl_Position = vec4(1.0 - 2.0 * position, 0, 1);
        }
      `,
      attributes: {
        position: [
          [0, 0],
          [1, 0],
          [0, 1],
          [1, 1],
        ],
      },
      uniforms: {
        videoTexture: texture,
      },
      elements: [
        [0, 1, 2],
        [2, 1, 3],
      ],
    });

    regl.frame(() => {
      texture.subimage(video);
      drawVideo();
    });
  };

  const loadVideo: (src: string) => Promise<HTMLVideoElement> = (src) =>
    new Promise<HTMLVideoElement>((resolve) => {
      const video = document.createElement("video");
      video.src = src;
      video.loop = false;
      video.muted = true;
      video.play();
      video.onloadedmetadata = () => {
        resolve(video);
      };
      video.onended = () => {
        playNextVideo();
      };
    });

  const playNextVideo: () => void = () => {
    if (regl) {
      // eslint-disable-next-line no-underscore-dangle
      regl._gl.flush();
      regl.destroy();
      regl = null;
      texture = null;
    }
    const nextVideoSrc = require("./2.mp4");
    loadVideo(nextVideoSrc).then((video) => {
      playVideo(video);
    });
  };

  useEffect(() => {
    const initialVideoSrc = require("./1.mp4");
    loadVideo(initialVideoSrc).then((video) => {
      playVideo(video);
    });
  }, []);

  return (
    <div>
      <canvas ref={canvasRef} style={{ width: "800px", height: "600px" }} />
    </div>
  );
};

export default VideoPlayer;
