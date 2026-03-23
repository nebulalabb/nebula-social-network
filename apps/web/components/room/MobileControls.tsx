"use client";

import { useEffect, useRef, useState } from "react";
import JoystickController from "./JoystickController";
import { ArrowUp } from "lucide-react";

interface MobileControlsProps {
  onJoystick: (x: number, y: number) => void;
  onJoystickStop: () => void;
  onJump: () => void;
}

export default function MobileControls({ onJoystick, onJoystickStop, onJump }: MobileControlsProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(/Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || window.innerWidth < 768);
  }, []);

  if (!isMobile) return null;

  return (
    <div className="absolute bottom-24 left-4 z-20 flex items-end gap-4">
      <JoystickController onMove={onJoystick} onStop={onJoystickStop} />
      <button
        onTouchStart={onJump}
        className="w-14 h-14 rounded-full bg-pink-600/80 backdrop-blur-sm border border-pink-400/30 flex items-center justify-center text-white active:scale-90 transition-transform"
      >
        <ArrowUp size={24} />
      </button>
    </div>
  );
}
