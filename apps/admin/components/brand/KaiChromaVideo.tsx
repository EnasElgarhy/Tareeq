"use client";

import {
  useEffect,
  useRef,
  type CSSProperties,
  type HTMLAttributes,
  type RefObject,
} from "react";

interface KaiChromaVideoProps extends HTMLAttributes<HTMLDivElement> {
  /** Rendered square footprint, in px (or any CSS length). */
  size?: number | string;
  /** Green-screen source clip. */
  src?: string;
  /**
   * Frame-accurate audio sync. When provided, the clip plays only while
   * this <audio> element is actually playing, and freezes on `restTime`
   * (a mouth-closed frame) the instant the audio pauses or ends — driven
   * directly off the element's media events (no React-state lag). Takes
   * precedence over `playing`.
   */
  audioRef?: RefObject<HTMLAudioElement | null>;
  /**
   * Fallback play control for screens with no narration. When `true` the
   * clip plays/loops; when `false` it rests on `restTime`. Ignored if
   * `audioRef` is given. Defaults to `true`.
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
  /**
   * When `true`, the clip loops continuously (for idle "doing some moves"
   * usage like the Did-you-know chip). When `false` (default) it plays
   * through once and holds its last frame.
   */
  loop?: boolean;
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
  src = "/kai/kai-intro-green.mp4",
  audioRef,
  playing = true,
  restTime = 0,
  playStart = 0,
  playEnd,
  loop = false,
  className,
  style,
  ...rest
}: KaiChromaVideoProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  // Whether the clip should currently be animating. For audio-driven
  // screens this starts false (waits for the audio to play); otherwise it
  // tracks the `playing` prop.
  const playingRef = useRef(audioRef ? false : playing);
  // Loop window + rest frame + flags, read by the rAF without re-running setup.
  const cfgRef = useRef({ playStart, playEnd, restTime, loop });
  cfgRef.current = { playStart, playEnd, restTime, loop };

  useEffect(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;

    const gl = canvas.getContext("webgl", {
      premultipliedAlpha: false,
      alpha: true,
      antialias: true,
      // Readable buffer (lets us scan the keyed output for fringes; the
      // cost is negligible for a small avatar canvas).
      preserveDrawingBuffer: true,
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
        // Aggressively suppress green spill across the whole figure: clamp
        // the green channel so it can never exceed the brighter of R/B by
        // more than a hair. This kills green AND yellow-green fringes
        // (yellow = high R+G, low B → clamping G removes the green half).
        float ceilG = max(c.r, c.b) + 0.02;
        c.g = min(c.g, ceilG);
        // Edge despill: at soft anti-aliased edges, pull any residual warm/
        // green cast toward neutral luma so motion-blurred fringes never
        // read as a colored glow. Solid interior (alpha ~ 1) is untouched.
        float warmth = max(max(c.g, c.r) - c.b, 0.0);
        float deCast = clamp(warmth * (1.0 - alpha) * 3.0, 0.0, 0.85);
        float luma = dot(c.rgb, vec3(0.299, 0.587, 0.114));
        c.rgb = mix(c.rgb, vec3(luma), deCast);
        if (alpha <= 0.02) discard;
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
    gl.uniform1f(gl.getUniformLocation(program, "u_t0"), 0.06);
    gl.uniform1f(gl.getUniformLocation(program, "u_t1"), 0.20);
    gl.uniform1f(gl.getUniformLocation(program, "u_spill"), 1.0);

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
    // Start as "true" so the first frame with want=false fires a falling
    // edge → seek to the rest frame and pause (clean initial rest state).
    let prevWant = true;

    const tryPlay = () => {
      if (disposed || !playingRef.current) return;
      const p = video!.play();
      if (p && typeof p.catch === "function") p.catch(() => {});
    };

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
      // ── Deterministic playback reconciliation ──────────────────────
      // Events only flip playingRef (the "want playing" flag); ALL video
      // play/pause/seek happens here, edge-detected, so there are no
      // event-race conflicts between seeking and play().
      const { playStart: ps, playEnd: pe, restTime: rt, loop: lp } =
        cfgRef.current;
      // Slaved to the audio element's play/pause state (frame-accurate;
      // freezes within ~1 frame of the audio stopping).
      const want = playingRef.current;
      // A play-once clip that has finished → hold its last (smiling) frame.
      const holding = !lp && pe == null && video!.ended;

      if (want && !prevWant) {
        // Rising edge. Fresh start → jump to playStart; resume after a brief
        // quiet gap → keep the current position (don't restart the sentence).
        const fresh =
          video!.ended ||
          video!.currentTime <= ps + 0.05 ||
          (pe != null && video!.currentTime >= pe);
        if (fresh) {
          try {
            video!.currentTime = ps;
          } catch {
            /* metadata not ready yet */
          }
        }
        tryPlay();
        pausedFrames = 0;
      } else if (!want && prevWant) {
        // Falling edge: stop the mouth. Snap to the closed-mouth rest frame
        // ONLY when the audio has truly stopped; if we paused merely because
        // the voice went quiet (audio still running), hold the current frame
        // so a resume continues smoothly.
        video!.pause();
        if (!playingRef.current) {
          try {
            video!.currentTime = rt;
          } catch {
            /* metadata not ready yet */
          }
        }
      } else if (want) {
        // Sustained playing: loop the talking window, loop the whole clip if
        // `loop`, otherwise play once and hold the final frame.
        if (pe != null && video!.currentTime >= pe) {
          try {
            video!.currentTime = ps;
          } catch {
            /* ignore */
          }
        } else if (lp && video!.ended) {
          try {
            video!.currentTime = ps;
          } catch {
            /* ignore */
          }
        }
        if (video!.paused && video!.readyState >= 2 && !holding) {
          if (pausedFrames++ % 20 === 0) tryPlay();
        } else {
          pausedFrames = 0;
        }
      } else if (video!.readyState >= 2) {
        // Sustained rest: keep her frozen. Kill any stray playback that would
        // make her mouth move after she's "done talking".
        if (!video!.paused) {
          video!.pause();
          if (!playingRef.current) {
            try {
              video!.currentTime = rt;
            } catch {
              /* ignore */
            }
          }
        }
      }
      prevWant = want;
      raf = requestAnimationFrame(frame);
    }

    raf = requestAnimationFrame(frame);

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      video.pause();
      gl.deleteTexture(texture);
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
    };
  }, [src]);

  // Playback control = just maintain the "want playing" flag. The rAF loop
  // (above) reconciles the actual video play/pause/seek with edge detection,
  // which avoids all the seek-vs-play() race conditions of doing it here.
  //
  //  · audio mode: want = the <audio> is actually playing (frame-accurate
  //    start on play, freeze on pause/ended).
  //  · static mode: want = the `playing` prop.
  useEffect(() => {
    const audio = audioRef?.current ?? null;

    if (audio) {
      const setTrue = () => {
        playingRef.current = true;
      };
      const setFalse = () => {
        playingRef.current = false;
      };
      playingRef.current = !audio.paused && !audio.ended;
      audio.addEventListener("play", setTrue);
      audio.addEventListener("playing", setTrue);
      audio.addEventListener("pause", setFalse);
      audio.addEventListener("ended", setFalse);
      return () => {
        audio.removeEventListener("play", setTrue);
        audio.removeEventListener("playing", setTrue);
        audio.removeEventListener("pause", setFalse);
        audio.removeEventListener("ended", setFalse);
      };
    }

    playingRef.current = playing;
  }, [audioRef, playing, restTime, playStart, playEnd]);

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
        playsInline
        preload="auto"
        crossOrigin="anonymous"
      />
      <canvas ref={canvasRef} className="kai-chroma__canvas" />
    </div>
  );
}
