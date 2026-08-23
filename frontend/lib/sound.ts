/**
 * 보상 순간의 효과음.
 *
 * 음원 파일을 쓰지 않고 Web Audio로 합성한다. 필요한 소리가 배지를 받을 때의
 * 짧은 소리 하나뿐이라(설계 문서 9장 "보상 순간에만"), 파일과 라이선스를
 * 들여올 값을 하지 않는다. 나중에 음원으로 바꾸고 싶으면 playReward 안만
 * 갈아끼우면 된다.
 */

const MUTE_KEY = "nolai:muted";

/** 배지 획득음의 음높이(Hz). 도-미-솔-도 상행. */
const REWARD_NOTES = [1046.5, 1318.5, 1568.0, 2093.0];

type AudioContextCtor = typeof AudioContext;

let context: AudioContext | null = null;

function contextCtor(): AudioContextCtor | null {
  if (typeof window === "undefined") return null;

  // 사파리는 오랫동안 접두어가 붙은 이름만 제공했다.
  const legacy = (window as unknown as { webkitAudioContext?: AudioContextCtor })
    .webkitAudioContext;

  return window.AudioContext ?? legacy ?? null;
}

/**
 * 소리를 낼 준비를 한다. 반드시 사용자가 누른 순간에 불러야 한다.
 *
 * 브라우저는 사용자 조작 없이 소리를 내지 못하게 막는다. 특히 iOS는
 * AudioContext를 만든 뒤 "정지" 상태로 두고, 사용자 조작 중에만 깨어난다.
 * 배지가 뜰 때 처음 만들면 이미 늦다.
 */
export function unlockAudio(): void {
  const Ctor = contextCtor();
  if (!Ctor) return;

  try {
    context ??= new Ctor();
    if (context.state === "suspended") void context.resume();
  } catch {
    // 소리를 못 내는 것이 놀이를 막아서는 안 된다.
    context = null;
  }
}

/**
 * 음소거 상태가 바뀌면 알려준다.
 *
 * 화면은 이 값을 useSyncExternalStore로 읽는다. localStorage는 서버에 없으므로
 * 첫 렌더는 서버와 같은 값(소리 켜짐)으로 그리고, 브라우저에서 붙은 뒤 실제
 * 값으로 맞춰진다. useEffect로 setState 하는 것보다 깜빡임이 없다.
 */
const listeners = new Set<() => void>();

export function subscribeMuted(listener: () => void): () => void {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

/** 서버에는 localStorage가 없다. 늘 소리가 켜진 것으로 그린다. */
export function mutedServerSnapshot(): boolean {
  return false;
}

/** localStorage를 못 쓰는 브라우저에서만 쓰이는 대비값. */
let fallbackMuted = false;

export function isMuted(): boolean {
  if (typeof window === "undefined") return false;

  try {
    return window.localStorage.getItem(MUTE_KEY) === "true";
  } catch {
    return fallbackMuted;
  }
}

export function setMuted(muted: boolean): void {
  if (typeof window === "undefined") return;

  fallbackMuted = muted;

  try {
    window.localStorage.setItem(MUTE_KEY, muted ? "true" : "false");
  } catch {
    // 저장을 막아둔 브라우저에서도 이번 세션 동안은 조용하다.
  }

  listeners.forEach((listener) => listener());
}

/** 배지를 받을 때 나는 짧은 상행음. 음소거면 아무 일도 하지 않는다. */
export function playReward(): void {
  if (isMuted()) return;

  unlockAudio();
  if (!context || context.state !== "running") return;

  const now = context.currentTime;

  REWARD_NOTES.forEach((frequency, index) => {
    const start = now + index * 0.09;
    const oscillator = context!.createOscillator();
    const gain = context!.createGain();

    // 삼각파는 사인보다 밝고 사각파보다 덜 거칠다. 아이 귀에 편한 쪽이다.
    oscillator.type = "triangle";
    oscillator.frequency.setValueAtTime(frequency, start);

    // 딸깍 소리를 막으려면 0에서 올렸다가 0으로 내려야 한다.
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.18, start + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.28);

    oscillator.connect(gain).connect(context!.destination);
    oscillator.start(start);
    oscillator.stop(start + 0.3);
  });
}

/** 하나의 음을 짧게 낸다. pop·ding이 공유한다. */
function blip(frequency: number, at: number, duration: number, peak: number, type: OscillatorType): void {
  const oscillator = context!.createOscillator();
  const gain = context!.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, at);
  gain.gain.setValueAtTime(0.0001, at);
  gain.gain.exponentialRampToValueAtTime(peak, at + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, at + duration);
  oscillator.connect(gain).connect(context!.destination);
  oscillator.start(at);
  oscillator.stop(at + duration + 0.02);
}

/** 단어를 내려놓거나 카드를 고를 때 나는 "뿅". 짧고 낮아서 연달아 나도 안 시끄럽다. */
export function playPop(): void {
  if (isMuted()) return;
  unlockAudio();
  if (!context || context.state !== "running") return;
  const now = context.currentTime;
  // 음을 살짝 올리면서 끝내면 "뿅"이 된다
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(420, now);
  oscillator.frequency.exponentialRampToValueAtTime(760, now + 0.08);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.14, now + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);
  oscillator.connect(gain).connect(context.destination);
  oscillator.start(now);
  oscillator.stop(now + 0.14);
}

/** 맞았을 때 나는 두 음 "띵동". 배지 소리보다 짧다 -- 배지는 따로 있다. */
export function playDing(): void {
  if (isMuted()) return;
  unlockAudio();
  if (!context || context.state !== "running") return;
  const now = context.currentTime;
  blip(784, now, 0.16, 0.16, "triangle");
  blip(1175, now + 0.11, 0.26, 0.16, "triangle");
}
