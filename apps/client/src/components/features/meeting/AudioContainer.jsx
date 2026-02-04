import React, { useEffect, useRef } from 'react';
import useMeetingStore from '@/store/useMeetingStore';

// 개별 참가자 오디오 재생
const ParticipantAudio = ({ participant }) => {
  const audioRef = useRef(null);

  useEffect(() => {
    if (audioRef.current && participant.stream) {
      // OpenVidu subscriber의 addVideoElement는 audio 태그에도 동작
      if (participant.stream.addVideoElement) {
        participant.stream.addVideoElement(audioRef.current);
      }
    }
  }, [participant.stream]);

  if (!participant.stream) return null;
  return <audio ref={audioRef} autoPlay />;
};

// 모든 원격 참가자의 오디오를 렌더링하는 컨테이너
const AudioContainer = () => {
  const participants = useMeetingStore((state) => state.participants);

  return (
    <div style={{ display: 'none' }}>
      {participants
        .filter((p) => !p.isLocal) // 본인 오디오는 재생하지 않음
        .map((p) => (
          <ParticipantAudio key={p.id} participant={p} />
        ))}
    </div>
  );
};

export default AudioContainer;
