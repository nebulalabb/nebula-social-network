"use client";

import { useEffect, useRef, useState } from "react";

export function useLipSync(stream: MediaStream | null) {
  const [mouthOpen, setMouthOpen] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const rafRef = useRef<number | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    if (!stream) return;

    const ctx = new AudioContext();
    ctxRef.current = ctx;
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    const source = ctx.createMediaStreamSource(stream);
    source.connect(analyser);

    const data = new Uint8Array(analyser.frequencyBinCount);

    const tick = () => {
      analyser.getByteFrequencyData(data);
      const avg = data.reduce((a, b) => a + b, 0) / data.length;
      // Map 0-100 avg to 0-1 mouth open, with threshold
      const value = Math.min(1, Math.max(0, (avg - 10) / 60));
      setMouthOpen(value);
      setIsSpeaking(avg > 15);
      rafRef.current = requestAnimationFrame(tick);
    };

    tick();

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      ctx.close();
      ctxRef.current = null;
    };
  }, [stream]);

  return { mouthOpen, isSpeaking };
}
