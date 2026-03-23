"use client";

import { useEffect, useRef } from "react";

interface JoystickControllerProps {
  onMove: (x: number, y: number) => void;
  onStop: () => void;
}

export default function JoystickController({ onMove, onStop }: JoystickControllerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const joystickRef = useRef<any>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Dynamic import nipplejs
    import("nipplejs").then(({ default: nipplejs }) => {
      const manager = nipplejs.create({
        zone: containerRef.current!,
        mode: "static",
        position: { left: "50%", top: "50%" },
        color: "rgba(236, 72, 153, 0.8)",
        size: 100,
        restOpacity: 0.6,
      });

      joystickRef.current = manager;

      manager.on("move", (_, data) => {
        if (!data.vector) return;
        onMove(data.vector.x, -data.vector.y); // y is inverted
      });

      manager.on("end", () => {
        onStop();
      });
    });

    return () => {
      joystickRef.current?.destroy();
    };
  }, [onMove, onStop]);

  return (
    <div
      ref={containerRef}
      className="w-32 h-32 relative"
      style={{ touchAction: "none" }}
    />
  );
}
