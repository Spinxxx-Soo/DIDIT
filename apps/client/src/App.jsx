import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import useAuthStore from './store/useAuthStore';

import MainLayout from './layouts/MainLayout';
import WorkspaceLayout from './layouts/WorkspaceLayout';
import { DevTest } from '@/pages/DevTest';

import LoginPage from './pages/LoginPage';

// 임시 페이지 컴포넌트 -> 나중에 pages 추가되면 없애기
const LandingPage = () => <div className="text-2xl font-bold">🏠 랜딩 페이지입니다.</div>;
const ProjectList = () => <div className="text-2xl font-bold">📂 프로젝트 리스트 페이지입니다.</div>;
const MeetingRoom = () => <div className="text-white text-2xl font-bold p-10">🎙 회의실 화면입니다.</div>;

function App() {

  // 로그인 확인(jsx)
  const checkLoginStatus = useAuthStore((state) => state.checkLoginStatus);

  useEffect(() => {
    checkLoginStatus();
  }, [checkLoginStatus]);

  return (
    <BrowserRouter>
      <Routes>
       
        <Route path="/login" element={<LoginPage />} />
        {/* 1. GNB가 있는 메인 레이아웃 (로그인 전후 기본 화면) */}
        <Route element={<MainLayout />}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/projects" element={<ProjectList />} />
        </Route>

        {/* 2. 사이드바가 있는 워크스페이스 레이아웃 (회의, 채팅 등) */}
        {/* 예: /workspace/123/meeting */}
        <Route path="/workspace" element={<WorkspaceLayout />}>
           <Route path="meeting" element={<MeetingRoom />} />
           {/* 기본 경로일 때 보여줄 내용 */}
           <Route index element={<div className="p-10">워크스페이스 홈</div>} />
        </Route>
        <Route path="/dev" element={<DevTest />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;