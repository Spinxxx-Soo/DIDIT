import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import useAuthStore from './store/useAuthStore';

// 레이아웃
import BaseLayout from './layouts/BaseLayout';
import MainLayout from './layouts/MainLayout';
import WorkspaceLayout from './layouts/WorkspaceLayout';

// 페이지
import { DevTest } from '@/pages/DevTest';
import MyPage from './pages/MyPage';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';

// 임시 컴포넌트
const LandingPage = () => <div className="text-2xl font-bold p-10">🏠 랜딩 페이지</div>;
const ProjectList = () => <div className="text-2xl font-bold p-10">📂 내 프로젝트 목록</div>;
const MeetingRoom = () => <div className="text-white text-2xl font-bold p-10">🎙 회의실 화면</div>;

const LoadingFallback = () => (
  <div className="flex items-center justify-center h-screen">
    <div className="text-xl">로딩중...</div>
  </div>
);

// 로그인이 필요한 페이지를 감싸는 컴포넌트
const PrivateRoute = () => {
  const { isAuthenticated, isLoading, error } = useAuthStore();

  if (isLoading) return <LoadingFallback />;
  if (error) return <div className="text-red-500 p-10">오류: {error}</div>;
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};

function App() {
  const checkLoginStatus = useAuthStore(state => state.checkLoginStatus);
  
  useEffect(() => {
    checkLoginStatus();
  }, [checkLoginStatus]);

  return (
    <BrowserRouter>
      <Routes>
        {/* === 1. 공개 라우트 === */}
        <Route path="/login" element={<LoginPage />} />
        
        <Route element={<BaseLayout />}>
          <Route path="/" element={<LandingPage />} />
        </Route>

        <Route path="/dev" element={<DevTest />} />

        {/* === 2. 비공개 라우트 (로그인 필수) === */}
        <Route element={<PrivateRoute />}>
          
          <Route element={<MainLayout />}>          {/* 2단계: MainLayout 씌우기 */}
            <Route path="/mypage" element={<MyPage />} />
            <Route path="/projects" element={<ProjectList />} />
          </Route>

          <Route path="/workspace/:roomId" element={<WorkspaceLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="meeting" element={<MeetingRoom />} />
            <Route path="minutes" element={<div>회의록 목록</div>} />
          </Route>

        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;