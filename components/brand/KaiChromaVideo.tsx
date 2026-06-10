"use client";

import {
  useEffect,
  useRef,
  type CSSProperties,
  type HTMLAttributes,
} from "react";

interface KaiChromaVideoProps extends HTMLAttributes<HTMLDivElement> {
  /** Rendered square footprint, in px (or any CSS length). */
  size?: number | string;
  /** Green-screen source clip. */
  src?: string;
  /**
   * Whether Kai should be animating. When `true` the clip plays/loops;
   * when `false` it pauses on `restTime` (a mouth-closed "done talking"
   * frame). Drive this from narration state so Kai stops talking — with
   * her mouth closed — the moment the audio ends. Defaults to `true`.
   */
  playing?: boolean;
  /** Seconds to freeze on when not playing — a mouth-closed frame. */
  restTime?: number;
  /**
   * Seconds to (re)start playback from. Use this to skip a silent/closed
   * intro so Kai is already mid-talk the instant the audio starts.
   */
  playStart?: number;
  /**
   * If set, playback loops within [playStart, playEnd] instead of the whole
   * clip — keeps Kai in her "talking" window while narration plays.
   */
  playEnd?: number;
}

/**
 * KaiChromaVideo — renders a green-screen Kai clip with the background
 * keyed out in real time on the GPU, so Kai floats transparently over
 * the app (no frame, no halo, no card). The green is removed with a
 * chrominance-distance key + green-spill suppression in a WebGL shader,
 * which keeps the white blouse, skin, hair and glasses intact while
 * leaving clean, anti-aliased edges.
 *
 * No re-encoding required — the .mp4 stays green-screen on disk and the
 * transparency happens per frame in the browser.
 */
export function KaiChromaVideo({
  size = 240,
  src = "/kai/kai-waving-green.mp4",
  playing = true,
  restTime = 0,
  playStart = 0,
  playEnd,
  className,
  style,
  ...rest
}: KaiChromaVideoProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const playingRef = useRef(playing);
  // Loop window + rest frame, read by the rAF loop without re-running setup.
  const cfgRef = useRef({ playStart, playEnd, restTime });
  cfgRef.current = { playStart, playEnd, restTime };

  useEffect(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;

    const gl = canvas.getContext("webgl", {
      premultipliedAlpha: false,
      alpha: true,
      antialias: true,
      preserveDrawingBuffer: false,
    });

    // Graceful fallback: if WebGL is unavailable, just reveal the raw
    // <video> (still better than a blank box). Very rare on modern UAs.
    if (!gl) {
      video.style.opacity = "1";
      void video.play().catch(() => {});
      return;
    }

    const VERT = `
      attribute vec2 a_pos;
      varying vec2 v_uv;
      void main() {
        v_uv = vec2((a_pos.x + 1.0) * 0.5, (1.0 - a_pos.y) * 0.5);
        gl_Position = vec4(a_pos, 0.0, 1.0);
      }
    `;

    // Chrominance-distance green key + spill suppression.
    //  greenness = G - max(R, B)  → high on background, ~0 on Kai
    //  alpha fades across [u_t0, u_t1] for soft anti-aliased edges
    //  spill: pull excess green back toward max(R,B) to kill the fringe
    const FRAG = `
      precision mediump float;
      varying vec2 v_uv;
      uniform sampler2D u_tex;
      uniform float u_t0;
      uniform float u_t1;
      uniform float u_spill;
      void main() {
        vec4 c = texture2D(u_tex, v_uv);
        float greenness = c.g - max(c.r, c.b);
        float alpha = 1.0 - smoothstep(u_t0, u_t1, greenness);
        // Suppress green spill on the kept pixels / edges.
        float spill = c.g - max(c.r, c.b);
        if (spill > 0.0) {
          c.g -= spill * u_spill;
        }
        if (alpha <= 0.003) discard;
        gl_FragColor = vec4(c.rgb, alpha);
      }
    `;

    function compile(type: number, source: string) {
      const shader = gl!.createShader(type)!;
      gl!.shaderSource(shader, source);
      gl!.compileShader(shader);
      if (!gl!.getShaderParameter(shader, gl!.COMPILE_STATUS)) {
        console.warn("KaiChromaVideo shader error:", gl!.getShaderInfoLog(shader));
      }
      return shader;
    }

    const program = gl.createProgram()!;
    gl.attachShader(program, compile(gl.VERTEX_SHADER, VERT));
    gl.attachShader(program, compile(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(program);
    gl.useProgram(program);

    // Full-screen quad.
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW,
    );
    const aPos = gl.getAttribLocation(program, "a_pos");
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    // Tunable key. These defaults are matched to Kai's bright-green
    // backdrop while preserving the polka-dot blouse and skin tones.
    gl.uniform1f(gl.getUniformLocation(program, "u_t0"), 0.07);
    gl.uniform1f(gl.getUniformLocation(program, "u_t1"), 0.22);
    gl.uniform1f(gl.getUniformLocation(program, "u_spill"), 0.85);

    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    // The vertex shader already maps screen-top → texture-top, so the
    // texture upload must NOT also flip Y (that would invert Kai).
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);

    gl.clearColor(0, 0, 0, 0);
    gl.disable(gl.DEPTH_TEST);
    gl.disable(gl.BLEND);

    let raf = 0;
    let disposed = false;
    let pausedFrames = 0;

    const tryPlay = () => {
      if (disposed || !playingRef.current) return;
      const p = video!.play();
      if (p && typeof p.catch === "function") p.catch(() => {});
    };
    // Autoplay can be deferred/blocked on client-side navigation; retry on
    // the relevant media events and on the first user gesture as a fallback.
    video.addEventListener("loadeddata", tryPlay);
    video.addEventListener("canplay", tryPlay);
    const onGesture = () => tryPlay();
    window.addEventListener("pointerdown", onGesture, { once: true });

    function sizeCanvas() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const cssSize = canvas!.clientWidth || 240;
      const px = Math.round(cssSize * dpr);
      if (canvas!.width !== px || canvas!.height !== px) {
        canvas!.width = px;
        canvas!.height = px;
        gl!.viewport(0, 0, px, px);
      }
    }

    function frame() {
      if (disposed) return;
      if (video!.readyState >= 2) {
        sizeCanvas();
        gl!.clear(gl!.COLOR_BUFFER_BIT);
        gl!.texImage2D(
          gl!.TEXTURE_2D,
          0,
          gl!.RGBA,
          gl!.RGBA,
          gl!.UNSIGNED_BYTE,
          video!,
        );
        gl!.drawArrays(gl!.TRIANGLES, 0, 6);
      }
      // Loop within the talking window so Kai keeps speaking (and never
      // drifts into the silent/closed intro) while narration plays.
      const { playStart: ps, playEnd: pe } = cfgRef.current;
      if (playingRef.current && pe != null && video!.currentTime >= pe) {
        video!.currentTime = ps;
      }
      // Self-heal only while we WANT playback (deferred/blocked autoplay).
      if (playingRef.current && video!.paused && video!.readyState >= 2) {
        if (pausedFrames++ % 30 === 0) tryPlay();
      } else {
        pausedFrames = 0;
      }
      raf = requestAnimationFrame(frame);
    }

    tryPlay();
    raf = requestAnimationFrame(frame);

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      video.removeEventListener("loadeddata", tryPlay);
      video.removeEventListener("canplay", tryPlay);
      window.removeEventListener("pointerdown", onGesture);
      video.pause();
      gl.deleteTexture(texture);
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
    };
  }, [src]);

  // Play while `playing`; otherwise pause on the mouth-closed rest frame
  // so Kai looks like she has finished her sentence (not frozen mid-word).
  useEffect(() => {
    playingRef.current = playing;
    const video = videoRef.current;
    if (!video) return;

    if (playing) {
      // Jump straight to the talking window so her mouth is moving the
      // moment the voice starts (skips the clip's closed-mouth intro).
      const enter = () => {
        try {
          if (video.currentTime < playStart || (playEnd != null && video.currentTime >= playEnd)) {
            video.currentTime = playStart;
          }
        } catch {
          /* metadata not ready yet — will retry on loadeddata */
        }
        const p = video.play();
        if (p && typeof p.catch === "function") p.catch(() => {});
      };
      enter();
      video.addEventListener("loadeddata", enter);
      return () => video.removeEventListener("loadeddata", enter);
    }

    const settle = () => {
      try {
        video.pause();
        video.currentTime = restTime;
      } catch {
        /* seeking before metadata is ready — retry on load below */
      }
    };
    settle();
    // If metadata wasn't ready yet, land on the rest frame once it loads.
    video.addEventListener("loadeddata", settle);
    return () => video.removeEventListener("loadeddata", settle);
  }, [playing, restTime, playStart, playEnd]);

  const visualSize = typeof size === "number" ? `${size}px` : size;

  return (
    <div
      {...rest}
      aria-hidden="true"
      className={["kai-chroma", className].filter(Boolean).join(" ")}
      style={{ width: visualSize, height: visualSize, ...style } as CSSProperties}
    >
      <video
        ref={videoRef}
        className="kai-chroma__source"
        src={src}
        muted
        loop
        playsInline
        preload="auto"
        crossOrigin="anonymous"
      />
      <canvas ref={canvasRef} className="kai-chroma__canvas" />
    </div>
  );
}
