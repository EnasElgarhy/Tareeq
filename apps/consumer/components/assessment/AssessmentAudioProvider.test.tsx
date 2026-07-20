import { act, createElement, useEffect } from "react";
import { createRoot, type Root } from "react-dom/client";
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
  type MockInstance,
} from "vitest";
import {
  AssessmentAudioProvider,
  useAssessmentAudio,
} from "./AssessmentAudioProvider";

type AssessmentAudioApi = ReturnType<typeof useAssessmentAudio>;

type FakeAnalyser = {
  fftSize: number;
  smoothingTimeConstant: number;
  connect: ReturnType<typeof vi.fn>;
  getByteTimeDomainData: ReturnType<typeof vi.fn>;
};

class FakeAudioContext {
  state: AudioContextState = "running";
  destination = {};
  sourceConnect = vi.fn();
  analyser: FakeAnalyser = {
    fftSize: 0,
    smoothingTimeConstant: 0,
    connect: vi.fn(),
    getByteTimeDomainData: vi.fn((data: Uint8Array) => data.fill(128)),
  };
  createAnalyser = vi.fn(() => this.analyser);
  createMediaElementSource = vi.fn(() => ({ connect: this.sourceConnect }));
  resume = vi.fn(async () => {
    this.state = "running";
  });
  close = vi.fn(async () => {
    this.state = "closed";
  });
}

let root: Root | null = null;
let container: HTMLDivElement | null = null;
let latestApi: AssessmentAudioApi | null = null;
let audioContexts: FakeAudioContext[] = [];
let audioContextMock: ReturnType<typeof vi.fn>;
let playSpy: MockInstance<HTMLMediaElement["play"]>;
let pauseSpy: MockInstance<HTMLMediaElement["pause"]>;
let loadSpy: MockInstance<HTMLMediaElement["load"]>;
let fetchMock: ReturnType<typeof vi.fn>;
let createObjectUrlSpy: MockInstance<typeof URL.createObjectURL>;
let revokeObjectUrlSpy: MockInstance<typeof URL.revokeObjectURL>;

function Probe({ onReady }: { onReady(api: AssessmentAudioApi): void }) {
  const audio = useAssessmentAudio();
  useEffect(() => {
    onReady(audio);
  }, [audio, onReady]);
  return null;
}

function getApi() {
  if (!latestApi) throw new Error("Assessment audio API was not mounted.");
  return latestApi;
}

async function renderProvider() {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  const handleReady = vi.fn((api: AssessmentAudioApi) => {
    latestApi = api;
  });

  await act(async () => {
    root?.render(
      createElement(
        AssessmentAudioProvider,
        null,
        createElement(Probe, { onReady: handleReady }),
      ),
    );
  });

  return getApi();
}

async function flushPlayback() {
  for (let index = 0; index < 6; index += 1) {
    await Promise.resolve();
  }
}

describe("AssessmentAudioProvider", () => {
  beforeEach(() => {
    (
      globalThis as typeof globalThis & {
        IS_REACT_ACT_ENVIRONMENT?: boolean;
      }
    ).IS_REACT_ACT_ENVIRONMENT = true;
    latestApi = null;
    audioContexts = [];
    window.localStorage.clear();

    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: vi.fn(() => ({
        matches: false,
        media: "",
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });

    audioContextMock = vi.fn(function AudioContext() {
      const context = new FakeAudioContext();
      audioContexts.push(context);
      return context;
    });
    Object.defineProperty(window, "AudioContext", {
      configurable: true,
      value: audioContextMock,
    });

    vi.spyOn(window, "requestAnimationFrame").mockReturnValue(1);
    vi.spyOn(window, "cancelAnimationFrame").mockImplementation(() => {});

    playSpy = vi
      .spyOn(HTMLMediaElement.prototype, "play")
      .mockImplementation(function play(this: HTMLMediaElement) {
        this.dispatchEvent(new Event("playing"));
        return Promise.resolve();
      });
    pauseSpy = vi
      .spyOn(HTMLMediaElement.prototype, "pause")
      .mockImplementation(function pause(this: HTMLMediaElement) {
        this.dispatchEvent(new Event("pause"));
      });
    loadSpy = vi
      .spyOn(HTMLMediaElement.prototype, "load")
      .mockImplementation(() => {});
    fetchMock = vi.fn(async () => {
      return new Response(new Blob(["audio"]), {
        status: 200,
        headers: { "content-type": "audio/mpeg" },
      });
    });
    vi.stubGlobal("fetch", fetchMock);
    createObjectUrlSpy = vi
      .spyOn(URL, "createObjectURL")
      .mockImplementation(
        () => `blob:assessment-${createObjectUrlSpy.mock.calls.length}`,
      );
    revokeObjectUrlSpy = vi
      .spyOn(URL, "revokeObjectURL")
      .mockImplementation(() => {});
  });

  afterEach(async () => {
    if (root) {
      await act(async () => {
        root?.unmount();
      });
    }
    root = null;
    container?.remove();
    container = null;
    latestApi = null;
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("keeps one audio element, AudioContext, and analyser graph across owners", async () => {
    const firstApi = await renderProvider();
    const audioElement = document.querySelector("audio");

    await act(async () => {
      firstApi.playNarration({
        audioId: "Q1",
        locale: "en",
        ownerId: "question:Q1",
      });
      await flushPlayback();
    });

    expect(audioContextMock).toHaveBeenCalledTimes(1);
    expect(audioContexts[0]?.createMediaElementSource).toHaveBeenCalledTimes(1);
    expect(document.querySelectorAll("audio")).toHaveLength(1);
    expect(document.querySelector("audio")).toBe(audioElement);

    await act(async () => {
      getApi().playNarration({
        audioId: "Q2",
        locale: "en",
        ownerId: "question:Q2",
      });
      await flushPlayback();
    });

    expect(audioContextMock).toHaveBeenCalledTimes(1);
    expect(audioContexts[0]?.createAnalyser).toHaveBeenCalledTimes(1);
    expect(audioContexts[0]?.createMediaElementSource).toHaveBeenCalledTimes(1);
    expect(document.querySelectorAll("audio")).toHaveLength(1);
    expect(document.querySelector("audio")).toBe(audioElement);
    expect(getApi().activeOwnerId).toBe("question:Q2");
    expect(getApi().currentAudioId).toBe("Q2");
  });

  it("does not restart duplicate play requests for the active owner/audio", async () => {
    const api = await renderProvider();

    await act(async () => {
      api.playNarration({
        audioId: "Q1",
        locale: "en",
        ownerId: "question:Q1",
      });
      api.playNarration({
        audioId: "Q1",
        locale: "en",
        ownerId: "question:Q1",
      });
      await flushPlayback();
    });

    expect(playSpy).toHaveBeenCalledTimes(1);
    expect(getApi().activeOwnerId).toBe("question:Q1");
  });

  it("restarts the active narration when its locale changes", async () => {
    const api = await renderProvider();

    await act(async () => {
      api.playNarration({
        audioId: "kai_intro",
        locale: "ar",
        ownerId: "intro:kai_intro",
      });
      await flushPlayback();
    });

    expect(document.querySelector("audio")?.getAttribute("src")).toBe(
      "/audio/kai_intro.ar.mp3",
    );

    await act(async () => {
      getApi().playNarration({
        audioId: "kai_intro",
        locale: "en",
        ownerId: "intro:kai_intro",
      });
      await flushPlayback();
    });

    expect(playSpy).toHaveBeenCalledTimes(2);
    expect(document.querySelector("audio")?.getAttribute("src")).toBe(
      "/audio/en-british-v1/kai_intro.mp3",
    );
  });

  it("ignores stale owner stops after a newer owner starts", async () => {
    const api = await renderProvider();

    await act(async () => {
      api.playNarration({
        audioId: "Q1",
        locale: "en",
        ownerId: "question:Q1",
      });
      await flushPlayback();
    });
    await act(async () => {
      getApi().playNarration({
        audioId: "Q2",
        locale: "en",
        ownerId: "question:Q2",
      });
      await flushPlayback();
    });
    await act(async () => {
      getApi().stopNarration("question:Q1");
    });

    expect(getApi().activeOwnerId).toBe("question:Q2");
    expect(getApi().currentAudioId).toBe("Q2");
  });

  it("replays the current owner and preserves mute preference", async () => {
    const api = await renderProvider();

    await act(async () => {
      api.playNarration({
        audioId: "Q1",
        locale: "en",
        ownerId: "question:Q1",
      });
      await flushPlayback();
    });
    const firstPlayCount = playSpy.mock.calls.length;

    await act(async () => {
      getApi().replayNarration("question:Q1");
      await flushPlayback();
    });

    expect(playSpy.mock.calls.length).toBe(firstPlayCount + 1);

    await act(async () => {
      getApi().setMuted(true);
    });

    expect(getApi().isMuted).toBe(true);
    expect(window.localStorage.getItem("tareeq:sound")).toBe("off");
    expect(pauseSpy).toHaveBeenCalled();

    await act(async () => {
      getApi().setMuted(false);
      await flushPlayback();
    });

    expect(getApi().isMuted).toBe(false);
    expect(window.localStorage.getItem("tareeq:sound")).toBe("on");
    expect(playSpy.mock.calls.length).toBeGreaterThan(firstPlayCount + 1);
  });

  it("preloads static candidates for both locales and reuses the cached blob", async () => {
    const api = await renderProvider();

    await act(async () => {
      api.preloadNarration({ audioId: "Q2", locale: "en" });
      api.preloadNarration({ audioId: "Q2", locale: "en" });
      api.preloadNarration({ audioId: "Q3", locale: "ar" });
      await flushPlayback();
    });

    expect(fetchMock.mock.calls.map(([url]) => url)).toEqual([
      "/audio/en-british-v1/Q2.mp3",
      "/audio/Q3.ar.mp3",
    ]);
    expect(createObjectUrlSpy).toHaveBeenCalledTimes(2);

    await act(async () => {
      getApi().playNarration({
        audioId: "Q2",
        locale: "en",
        ownerId: "question:Q2",
      });
      await flushPlayback();
    });

    expect(document.querySelector("audio")?.getAttribute("src")).toBe(
      "blob:assessment-1",
    );
  });

  it("keeps the real preload cache bounded and revokes evicted blobs", async () => {
    await renderProvider();

    await act(async () => {
      for (let question = 1; question <= 7; question += 1) {
        getApi().preloadNarration({ audioId: `Q${question}`, locale: "en" });
        await flushPlayback();
      }
    });

    expect(fetchMock).toHaveBeenCalledTimes(7);
    expect(createObjectUrlSpy).toHaveBeenCalledTimes(7);
    expect(revokeObjectUrlSpy).toHaveBeenCalledTimes(3);
  });

  it("cleans up the provider-owned audio context and cached blobs on unmount", async () => {
    const api = await renderProvider();

    await act(async () => {
      api.preloadNarration({ audioId: "Q2", locale: "en" });
      api.playNarration({
        audioId: "Q1",
        locale: "en",
        ownerId: "question:Q1",
      });
      await flushPlayback();
    });

    expect(createObjectUrlSpy).toHaveBeenCalledTimes(1);
    expect(audioContexts[0]?.close).not.toHaveBeenCalled();

    await act(async () => {
      root?.unmount();
    });
    root = null;

    expect(audioContexts[0]?.close).toHaveBeenCalledTimes(1);
    expect(revokeObjectUrlSpy).toHaveBeenCalledWith("blob:assessment-1");
    expect(loadSpy).toHaveBeenCalled();
  });
});
