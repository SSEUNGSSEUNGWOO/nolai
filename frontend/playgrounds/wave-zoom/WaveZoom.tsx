"use client";

import { useMemo, useRef, useState } from "react";
import type { SoundsDataset } from "@/lib/dataset-schema";
import type { PlaygroundProps } from "../types";
import { isMuted, unlockAudio } from "@/lib/sound";
import { samplesOf, samplesPerWave, toPolyline } from "./geometry";

/**
 * 소리를 눈으로 보는 놀이터.
 *
 * 그림에 쓰는 값과 소리에 쓰는 값이 같은 배열이다. 재생은 오실레이터가 아니라
 * 이 배열을 그대로 담은 AudioBuffer로 한다 -- 그래야 "네가 보는 이 숫자가
 * 방금 들은 그 소리"라고 말할 수 있다.
 */
export default function WaveZoom({
  data,
  onEvent,
  onArtifact,
}: PlaygroundProps) {
  const dataset = data as SoundsDataset;
  const [soundId, setSoundId] = useState(dataset.sounds[0].id);
  const [picked, setPicked] = useState<number | null>(null);
  const heardRef = useRef<string[]>([]);
  const [heard, setHeard] = useState<string[]>([]);

  const sound = dataset.sounds.find((one) => one.id === soundId)!;

  const playSamples = useMemo(
    () =>
      samplesOf(
        sound.frequency,
        sound.harmonics,
        dataset.sampleRate,
        Math.round((dataset.sampleRate * dataset.playMs) / 1000),
      ),
    [sound.frequency, sound.harmonics, dataset.sampleRate, dataset.playMs],
  );
  // 화면에는 앞부분만 그린다. 전부 그리면 물결이 뭉개져 아무것도 안 보인다.
  const shown = playSamples.slice(0, dataset.showSamples);

  function play(id: string) {
    setSoundId(id);
    setPicked(null);

    if (!heardRef.current.includes(id)) {
      const next = [...heardRef.current, id];
      heardRef.current = next;
      setHeard(next);
      onArtifact({
        kind: "wave-zoom",
        payload: { datasetId: dataset.id, soundIds: next },
      });
    }
    onEvent({ type: "heard", payload: { soundId: id, count: heardRef.current.length } });

    if (isMuted()) return;
    unlockAudio();

    const one = dataset.sounds.find((s) => s.id === id)!;
    const samples = samplesOf(
      one.frequency,
      one.harmonics,
      dataset.sampleRate,
      Math.round((dataset.sampleRate * dataset.playMs) / 1000),
    );

    try {
      const Ctor =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (!Ctor) return;

      const context = new Ctor();
      const buffer = context.createBuffer(1, samples.length, dataset.sampleRate);
      const channel = buffer.getChannelData(0);
      // 갑자기 끊기면 딸깍 소리가 난다. 끝을 부드럽게 줄인다.
      const fade = Math.floor(samples.length * 0.15);
      samples.forEach((value, i) => {
        const tail = i > samples.length - fade ? (samples.length - i) / fade : 1;
        channel[i] = value * 0.3 * tail;
      });

      const source = context.createBufferSource();
      source.buffer = buffer;
      source.connect(context.destination);
      source.start();
    } catch {
      // 소리를 못 내는 것이 놀이를 막아서는 안 된다.
    }
  }

  const perWave = samplesPerWave(sound.frequency, dataset.sampleRate);

  return (
    <div className="flex flex-col gap-3">
      <div
        data-testid="wave-view"
        data-samples={shown.length}
        className="relative aspect-[3/2] w-full rounded-pop border-[3px] border-ink bg-paper shadow-[0_4px_0_var(--color-ink)]"
      >
        <svg
          className="absolute inset-0 h-full w-full"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          <line x1="0" y1="50" x2="100" y2="50" stroke="var(--color-muted)"
            strokeWidth={1} vectorEffect="non-scaling-stroke" strokeDasharray="4 4" />
          <polyline
            data-testid="wave-line"
            points={toPolyline(shown)}
            fill="none"
            stroke="var(--color-candy-red)"
            strokeWidth={3}
            vectorEffect="non-scaling-stroke"
            strokeLinejoin="round"
          />
          {/* 샘플 하나하나가 점이라는 것을 보여준다. 이 점이 곧 숫자다. */}
          {shown.map((value, index) => (
            <circle
              key={index}
              data-testid={`sample-${index}`}
              cx={(index / (shown.length - 1)) * 100}
              cy={50 - Math.max(-1, Math.min(1, value)) * 45}
              r={picked === index ? 2.4 : 1.1}
              fill={picked === index ? "var(--color-ink)" : "var(--color-candy-red)"}
              onClick={() => setPicked(index)}
              style={{ cursor: "pointer" }}
            />
          ))}
        </svg>
      </div>

      <div
        data-testid="wave-readout"
        className="rounded-pop border-[2.5px] border-ink bg-paper px-3 py-2 font-mono text-sm font-extrabold"
      >
        {picked === null ? (
          <span className="font-sans text-muted">물결 위의 점을 눌러봐!</span>
        ) : (
          <>
            {picked + 1}번째 숫자 = {shown[picked].toFixed(3)}
          </>
        )}
      </div>

      <p data-testid="per-wave" data-count={Math.round(perWave)} className="text-xs font-bold text-muted">
        물결 하나에 숫자 {perWave.toFixed(0)}개가 들어가 있어
      </p>

      <div data-testid="sound-picker" className="flex flex-wrap gap-2">
        {dataset.sounds.map((one) => (
          <button
            key={one.id}
            type="button"
            data-testid={`sound-${one.id}`}
            data-current={soundId === one.id ? "true" : undefined}
            data-heard={heard.includes(one.id) ? "true" : undefined}
            onClick={() => play(one.id)}
            className="rounded-full border-[2.5px] border-ink px-3 py-1 text-sm font-extrabold text-ink shadow-[0_3px_0_var(--color-ink)]"
            style={{
              backgroundColor:
                soundId === one.id ? "var(--color-candy-teal)" : "var(--color-paper)",
            }}
          >
            ▶ {one.emoji} {one.label}
          </button>
        ))}
      </div>
    </div>
  );
}
