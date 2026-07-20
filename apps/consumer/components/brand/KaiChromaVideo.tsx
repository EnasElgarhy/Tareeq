"use client";

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type HTMLAttributes,
  type RefObject,
} from "react";

// Audio is treated as audible once its currentTime passes this many seconds.
// currentTime only advances when sound is genuinely playing, so this gates
// Kai's mouth to the real voice (unlike play/playing events, which fire early).
const AUDIBLE_EPS = 0.02;

interface KaiChromaVideoProps extends HTMLAttributes<HTMLDivElement> {
  /** Rendered square footprint, in px (or any CSS length). */
  size?: number | string;
  /** Green-screen source clip. */
  src?: string;
  /** Transparent still shown immediately and retained if video/WebGL fails. */
  posterSrc?: string;
  /** Signals when narration can begin without outrunning the video decoder. */
  onReadyChange?: (ready: boolean) => void;
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
  src = "/kai/kai-intro-green-v2.mp4",
  posterSrc = "/kai/kai-rest-v2.webp",
  onReadyChange,
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
  const [hasRenderedFrame, setHasRenderedFrame] = useState(false);
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

    setHasRenderedFrame(false);
    onReadyChange?.(false);
    const releasePlaybackGate = () => onReadyChange?.(true);
    const gl = canvas.getContext("webgl", {
      premultipliedAlpha: false,
      alpha: true,
      antialias: false,
      preserveDrawingBuffer: false,
    });

    // The transparent poster remains visible if WebGL is unavailable.
    // Revealing the raw green-screen source would be worse than a still Kai.
    if (!gl) {
      releasePlaybackGate();
      return;
    }
    const canvasElement: HTMLCanvasElement = canvas;
    const videoElement: HTMLVideoElement = video;
    const webGl: WebGLRenderingContext = gl;

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
      const shader = webGl.createShader(type);
      if (!shader) return null;
      webGl.shaderSource(shader, source);
      webGl.compileShader(shader);
      if (!webGl.getShaderParameter(shader, webGl.COMPILE_STATUS)) {
        console.warn(
          "KaiChromaVideo shader error:",
          webGl.getShaderInfoLog(shader),
        );
        webGl.deleteShader(shader);
        return null;
      }
      return shader;
    }

    const vertexShader = compile(gl.VERTEX_SHADER, VERT);
    const fragmentShader = compile(gl.FRAGMENT_SHADER, FRAG);
    const program = gl.createProgram();
    if (!vertexShader || !fragmentShader || !program) {
      if (vertexShader) gl.deleteShader(vertexShader);
      if (fragmentShader) gl.deleteShader(fragmentShader);
      if (program) gl.deleteProgram(program);
      releasePlaybackGate();
      return;
    }
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.warn("KaiChromaVideo link error:", gl.getProgramInfoLog(program));
      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);
      gl.deleteProgram(program);
      releasePlaybackGate();
      return;
    }
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
    gl.uniform1f(gl.getUniformLocation(program, "u_t1"), 0.2);
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

    type FrameVideo = {
      requestVideoFrameCallback?: (callback: () => void) => number;
      cancelVideoFrameCallback?: (handle: number) => void;
    };

    const frameVideo = videoElement as unknown as FrameVideo;
    let syncRaf = 0;
    let renderRaf = 0;
    let videoFrameHandle: number | null = null;
    let disposed = false;
    let pausedFrames = 0;
    let prevWant = false;
    let revealedFrame = false;

    function sizeCanvas() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const cssSize = canvasElement.clientWidth || 240;
      const px = Math.round(cssSize * dpr);
      if (canvasElement.width !== px || canvasElement.height !== px) {
        canvasElement.width = px;
        canvasElement.height = px;
        webGl.viewport(0, 0, px, px);
      }
    }

    function renderFrame() {
      if (
        disposed ||
        videoElement.readyState < HTMLMediaElement.HAVE_CURRENT_DATA
      ) {
        return;
      }
      try {
        sizeCanvas();
        webGl.clear(webGl.COLOR_BUFFER_BIT);
        webGl.texImage2D(
          webGl.TEXTURE_2D,
          0,
          webGl.RGBA,
          webGl.RGBA,
          webGl.UNSIGNED_BYTE,
          videoElement,
        );
        webGl.drawArrays(webGl.TRIANGLES, 0, 6);
        if (!revealedFrame) {
          revealedFrame = true;
          setHasRenderedFrame(true);
          releasePlaybackGate();
        }
      } catch {
        // Keep the matching transparent poster visible on decode/context loss.
      }
    }

    function scheduleDecodedFrame() {
      if (
        disposed ||
        videoFrameHandle != null ||
        !frameVideo.requestVideoFrameCallback
      ) {
        return;
      }
      videoFrameHandle = frameVideo.requestVideoFrameCallback(() => {
        videoFrameHandle = null;
        renderFrame();
        if (!disposed && !videoElement.paused && playingRef.current) {
          scheduleDecodedFrame();
        }
      });
    }

    function scheduleFallbackFrame() {
      if (disposed || renderRaf !== 0 || frameVideo.requestVideoFrameCallback) {
        return;
      }
      const tick = () => {
        renderRaf = 0;
        renderFrame();
        if (!disposed && !videoElement.paused && playingRef.current) {
          renderRaf = window.requestAnimationFrame(tick);
        }
      };
      renderRaf = window.requestAnimationFrame(tick);
    }

    const tryPlay = () => {
      if (disposed || !playingRef.current) return;
      const playPromise = videoElement.play();
      scheduleDecodedFrame();
      scheduleFallbackFrame();
      if (playPromise && typeof playPromise.catch === "function") {
        playPromise.catch(() => {});
      }
    };

    function seekTo(time: number) {
      try {
        videoElement.currentTime = time;
      } catch {
        // Metadata is not ready yet. loadedmetadata will reconcile the seek.
      }
    }

    function syncPlayback() {
      if (disposed) return;
      const {
        playStart: ps,
        playEnd: pe,
        restTime: rt,
        loop: lp,
      } = cfgRef.current;
      const audioEl = audioRef?.current ?? null;
      const want = audioEl
        ? !audioEl.paused && !audioEl.ended && audioEl.currentTime > AUDIBLE_EPS
        : playingRef.current;
      playingRef.current = want;
      const holding = !lp && pe == null && videoElement.ended;

      if (want && !prevWant) {
        const fresh =
          videoElement.ended ||
          videoElement.currentTime <= ps + 0.05 ||
          (pe != null && videoElement.currentTime >= pe);
        if (fresh) {
          seekTo(ps);
        }
        tryPlay();
        pausedFrames = 0;
      } else if (!want && prevWant) {
        videoElement.pause();
        seekTo(rt);
      } else if (want) {
        if (pe != null && videoElement.currentTime >= pe) {
          seekTo(ps);
        } else if (lp && videoElement.ended) {
          seekTo(ps);
        }
        if (videoElement.paused && videoElement.readyState >= 2 && !holding) {
          if (pausedFrames++ % 20 === 0) tryPlay();
        } else {
          pausedFrames = 0;
        }
      } else if (videoElement.readyState >= 2 && !videoElement.paused) {
        videoElement.pause();
        seekTo(rt);
      }

      if (want) {
        scheduleDecodedFrame();
        scheduleFallbackFrame();
      }
      prevWant = want;
      syncRaf = window.requestAnimationFrame(syncPlayback);
    }

    const reconcileRestFrame = () => {
      if (!playingRef.current) {
        videoElement.pause();
        seekTo(cfgRef.current.restTime);
      }
      renderFrame();
    };
    const handleSeeked = () => renderFrame();
    const handleContextLost = (event: Event) => {
      event.preventDefault();
      revealedFrame = false;
      setHasRenderedFrame(false);
    };
    const handleMediaError = () => releasePlaybackGate();

    videoElement.addEventListener("loadedmetadata", reconcileRestFrame);
    videoElement.addEventListener("loadeddata", reconcileRestFrame);
    videoElement.addEventListener("seeked", handleSeeked);
    videoElement.addEventListener("error", handleMediaError);
    canvasElement.addEventListener("webglcontextlost", handleContextLost);

    if (videoElement.readyState >= HTMLMediaElement.HAVE_METADATA) {
      reconcileRestFrame();
    }
    syncRaf = window.requestAnimationFrame(syncPlayback);

    return () => {
      disposed = true;
      window.cancelAnimationFrame(syncRaf);
      if (renderRaf !== 0) window.cancelAnimationFrame(renderRaf);
      if (videoFrameHandle != null && frameVideo.cancelVideoFrameCallback) {
        frameVideo.cancelVideoFrameCallback(videoFrameHandle);
      }
      videoElement.removeEventListener("loadedmetadata", reconcileRestFrame);
      videoElement.removeEventListener("loadeddata", reconcileRestFrame);
      videoElement.removeEventListener("seeked", handleSeeked);
      videoElement.removeEventListener("error", handleMediaError);
      canvasElement.removeEventListener("webglcontextlost", handleContextLost);
      videoElement.pause();
      webGl.deleteTexture(texture);
      webGl.deleteBuffer(buffer);
      webGl.deleteProgram(program);
      webGl.deleteShader(vertexShader);
      webGl.deleteShader(fragmentShader);
    };
  }, [src, audioRef, onReadyChange]);

  useEffect(() => {
    if (audioRef) return;
    playingRef.current = playing;
  }, [audioRef, playing, restTime, playStart, playEnd]);

  const visualSize = typeof size === "number" ? `${size}px` : size;

  return (
    <div
      {...rest}
      aria-hidden="true"
      className={["kai-chroma", className].filter(Boolean).join(" ")}
      data-frame-ready={hasRenderedFrame ? "true" : "false"}
      style={
        { width: visualSize, height: visualSize, ...style } as CSSProperties
      }
    >
      <span
        className="kai-chroma__poster"
        data-visible={hasRenderedFrame ? "false" : "true"}
        style={{ backgroundImage: `url("${posterSrc}")` }}
      />
      <video
        ref={videoRef}
        className="kai-chroma__source"
        src={src}
        muted
        playsInline
        preload="auto"
        crossOrigin="anonymous"
      />
      <canvas
        ref={canvasRef}
        className="kai-chroma__canvas"
        data-visible={hasRenderedFrame ? "true" : "false"}
      />
    </div>
  );
}
