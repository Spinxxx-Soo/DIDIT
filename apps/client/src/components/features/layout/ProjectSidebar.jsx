import React from 'react';

const ProjectSidebar = () => {
  return (
    <div className="flex flex-col items-center gap-4 w-full">
       {/* 로고 (홈으로 가기) */}
      <div className="w-10 h-10 bg-white rounded-xl mb-2 flex items-center justify-center cursor-pointer">
        <span className="font-bold text-black text-xs">PJT</span>
      </div>
      
      {/* 프로젝트 리스트 (예시 데이터) */}
      <div className="w-10 h-10 rounded-full bg-blue-500 cursor-pointer hover:rounded-xl transition-all duration-200"></div>
      <div className="w-10 h-10 rounded-full bg-green-500 cursor-pointer hover:rounded-xl transition-all duration-200"></div>
      <div className="w-10 h-10 rounded-full bg-yellow-500 cursor-pointer hover:rounded-xl transition-all duration-200"></div>
      
      {/* 추가 버튼 */}
      <div className="w-10 h-10 rounded-full bg-gray-700 text-white flex items-center justify-center cursor-pointer hover:bg-green-500 transition-colors">
        +
      </div>
    </div>
  );
};

export default ProjectSidebar;