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
  await Promise.resolve();
  await Promise.resolve();
}

function preloadLinks() {
  return Array.from(
    document.head.querySelectorAll<HTMLLinkElement>(
      'link[rel="preload"][as="audio"]',
    ),
  );
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
    document.head
      .querySelectorAll('link[rel="preload"][as="audio"]')
      .forEach((link) => link.remove());
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

  it("preloads only static candidates and keeps the cache bounded", async () => {
    const api = await renderProvider();

    await act(async () => {
      api.preloadNarration({ audioId: "Q2", locale: "en" });
      api.preloadNarration({ audioId: "Q2", locale: "en" });
      api.preloadNarration({ audioId: "Q3", locale: "ar" });
    });

    expect(preloadLinks().map((link) => link.getAttribute("href"))).toEqual([
      "/audio/Q2.m4a",
    ]);

    await act(async () => {
      for (let question = 3; question <= 10; question += 1) {
        getApi().preloadNarration({ audioId: `Q${question}`, locale: "en" });
      }
    });

    expect(preloadLinks()).toHaveLength(6);
    expect(preloadLinks().map((link) => link.getAttribute("href"))).toEqual([
      "/audio/Q5.m4a",
      "/audio/Q6.m4a",
      "/audio/Q7.m4a",
      "/audio/Q8.m4a",
      "/audio/Q9.m4a",
      "/audio/Q10.m4a",
    ]);
  });

  it("cleans up the provider-owned audio context and preloads on unmount", async () => {
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

    expect(preloadLinks()).toHaveLength(1);
    expect(audioContexts[0]?.close).not.toHaveBeenCalled();

    await act(async () => {
      root?.unmount();
    });
    root = null;

    expect(audioContexts[0]?.close).toHaveBeenCalledTimes(1);
    expect(preloadLinks()).toHaveLength(0);
    expect(loadSpy).toHaveBeenCalled();
  });
});
