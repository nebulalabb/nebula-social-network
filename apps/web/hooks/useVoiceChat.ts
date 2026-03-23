"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import {
  Room,
  RoomEvent,
  Track,
  RemoteParticipant,
  RemoteTrackPublication,
  RemoteTrack,
  LocalParticipant,
  ConnectionState,
} from "livekit-client";
import apiClient from "../lib/api-client";

interface RemoteAudioNode {
  gainNode: GainNode;
  analyser: AnalyserNode;
  source: MediaStreamAudioSourceNode;
}

interface UseVoiceChatOptions {
  roomId: string;
  getRemotePosition?: (userId: string) => { x: number; z: number } | null;
  getLocalPosition?: () => { x: number; z: number };
  onSpeakingChange?: (userId: string, isSpeaking: boolean) => void;
}

export function useVoiceChat({
  roomId,
  getRemotePosition,
  getLocalPosition,
  onSpeakingChange,
}: UseVoiceChatOptions) {
  const roomRef = useRef<Room | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const remoteNodesRef = useRef<Map<string, RemoteAudioNode>>(new Map());
  const rafRef = useRef<number | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [connectionState, setConnectionState] = useState<ConnectionState>(ConnectionState.Disconnected);

  // Spatial audio update loop
  const updateSpatialAudio = useCallback(() => {
    if (!getLocalPosition || !getRemotePosition || !audioCtxRef.current) {
      rafRef.current = requestAnimationFrame(updateSpatialAudio);
      return;
    }
    const local = getLocalPosition();
    remoteNodesRef.current.forEach((node, identity) => {
      const remote = getRemotePosition(identity);
      if (!remote) return;
      const dist = Math.sqrt((local.x - remote.x) ** 2 + (local.z - remote.z) ** 2);
      const maxDist = 15;
      const volume = dist > maxDist ? 0 : Math.max(0, 1 - dist / maxDist);
      node.gainNode.gain.setTargetAtTime(volume, audioCtxRef.current!.currentTime, 0.1);

      // Speaking detection via analyser
      const data = new Uint8Array(node.analyser.frequencyBinCount);
      node.analyser.getByteFrequencyData(data);
      const avg = data.reduce((a, b) => a + b, 0) / data.length;
      onSpeakingChange?.(identity, avg > 15);
    });
    rafRef.current = requestAnimationFrame(updateSpatialAudio);
  }, [getLocalPosition, getRemotePosition, onSpeakingChange]);

  const attachRemoteAudio = useCallback((participant: RemoteParticipant, track: RemoteTrack) => {
    if (track.kind !== Track.Kind.Audio) return;
    const stream = new MediaStream([track.mediaStreamTrack]);

    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioContext();
    }
    const ctx = audioCtxRef.current;
    const source = ctx.createMediaStreamSource(stream);
    const gainNode = ctx.createGain();
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;

    source.connect(analyser);
    analyser.connect(gainNode);
    gainNode.connect(ctx.destination);

    remoteNodesRef.current.set(participant.identity, { gainNode, analyser, source });
  }, []);

  const detachRemoteAudio = useCallback((identity: string) => {
    const node = remoteNodesRef.current.get(identity);
    if (node) {
      node.source.disconnect();
      node.gainNode.disconnect();
      remoteNodesRef.current.delete(identity);
    }
  }, []);

  const start = useCallback(async () => {
    try {
      // Fetch LiveKit token from our server
      const res = await apiClient.get(`/livekit/token/${roomId}`);
      const { token, url } = res.data?.data ?? {};
      if (!token || !url) throw new Error("No token/url from server");

      const room = new Room({
        adaptiveStream: true,
        dynacast: true,
        audioCaptureDefaults: { echoCancellation: true, noiseSuppression: true },
      });
      roomRef.current = room;

      // Event listeners
      room.on(RoomEvent.ConnectionStateChanged, (state: ConnectionState) => {
        setConnectionState(state);
      });

      room.on(RoomEvent.TrackSubscribed, (track: RemoteTrack, _pub: RemoteTrackPublication, participant: RemoteParticipant) => {
        attachRemoteAudio(participant, track);
      });

      room.on(RoomEvent.TrackUnsubscribed, (_track: RemoteTrack, _pub: RemoteTrackPublication, participant: RemoteParticipant) => {
        detachRemoteAudio(participant.identity);
        onSpeakingChange?.(participant.identity, false);
      });

      room.on(RoomEvent.ParticipantDisconnected, (participant: RemoteParticipant) => {
        detachRemoteAudio(participant.identity);
        onSpeakingChange?.(participant.identity, false);
      });

      // Connect and publish mic
      await room.connect(url, token);
      await room.localParticipant.setMicrophoneEnabled(true);

      setIsActive(true);
      rafRef.current = requestAnimationFrame(updateSpatialAudio);
    } catch (err) {
      console.error("LiveKit voice chat error:", err);
    }
  }, [roomId, attachRemoteAudio, detachRemoteAudio, onSpeakingChange, updateSpatialAudio]);

  const stop = useCallback(async () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    remoteNodesRef.current.forEach((_, id) => detachRemoteAudio(id));
    remoteNodesRef.current.clear();

    await roomRef.current?.disconnect();
    roomRef.current = null;

    audioCtxRef.current?.close();
    audioCtxRef.current = null;

    setIsActive(false);
    setIsMuted(false);
  }, [detachRemoteAudio]);

  const toggleMute = useCallback(async () => {
    const lp = roomRef.current?.localParticipant;
    if (!lp) return;
    const newMuted = !isMuted;
    await lp.setMicrophoneEnabled(!newMuted);
    setIsMuted(newMuted);
  }, [isMuted]);

  // Lip sync helper — returns mouth open value from local mic analyser
  const getLipSyncValue = useCallback((): number => {
    // Lip sync is handled by useLipSync hook separately
    return 0;
  }, []);

  useEffect(() => {
    return () => { stop(); };
  }, []);

  return { start, stop, toggleMute, isMuted, isActive, connectionState };
}
