import React, { useEffect, useRef } from 'react';
import useMeetingStore from '@/store/useMeetingStore';

const ScreenShare = () => {
  const { screenShareStream, screenShareUser } = useMeetingStore();
  const videoRef = useRef(null);

  // 스트림이 변경될 때 비디오 요소에 연결
  useEffect(() => {
    if (videoRef.current && screenShareStream) {
      // OpenVidu subscriber의 경우 addVideoElement 사용
      if (screenShareStream.addVideoElement) {
        screenShareStream.addVideoElement(videoRef.current);
      } else if (screenShareStream instanceof MediaStream) {
        videoRef.current.srcObject = screenShareStream;
      }
    }

    return () => {
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };
  }, [screenShareStream]);

  return (
    <div
      className="w-full h-full min-h-[500px] flex flex-col items-center justify-center rounded-xl"
      style={{ backgroundColor: '#1a1a1a' }}
    >
      {screenShareStream ? (
        <>
          {/* 공유자 이름 */}
          <div className="absolute top-4 left-4 text-sm text-gray-400">
            {screenShareUser || '참가자'}의 화면
          </div>

          {/* 화면 공유 비디오 */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="max-w-full max-h-full object-contain"
          />
        </>
      ) : (
        <>
          {/* 화면 공유 없음 */}
          <div className="text-gray-400 mb-2">화면 공유 없음</div>
          <div className="text-gray-500 text-sm">
            참가자가 화면을 공유하면 여기에 표시됩니다
          </div>
        </>
      )}
    </div>
  );
};

export default ScreenShare;
