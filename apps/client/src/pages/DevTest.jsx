import { Button, IconButton } from '@/components/common/Button';
import { Input, SearchInput } from '@/components/common/Input';
import { Plus, Settings, Trash2, LogOut, X } from 'lucide-react';
import { useState } from 'react';

export function DevTest() {
  // Input 테스트용 state
  const [inputValue, setInputValue] = useState('');
  const [searchValue, setSearchValue] = useState('');
  const [errorInput, setErrorInput] = useState('잘못된 입력');

  return (
    <div className="p-8 space-y-12 bg-[var(--bg-app)] min-h-screen">
      <h1 className="text-3xl font-bold text-[var(--text-bright)]">
        Component Test Page
      </h1>

      {/* ========== Button Section ========== */}
      <section className="space-y-6">
        <h2 className="text-xl font-semibold text-[var(--text-bright)]">
          Button
        </h2>

        {/* Variants */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-[var(--text-secondary)]">
            Variants
          </h3>
          <div className="flex flex-wrap gap-4">
            <Button variant="primary">Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="danger">Danger</Button>
            <Button variant="ghost">Ghost</Button>
          </div>
        </div>

        {/* Sizes */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-[var(--text-secondary)]">
            Sizes
          </h3>
          <div className="flex flex-wrap items-center gap-4">
            <Button size="sm">Small</Button>
            <Button size="md">Medium</Button>
            <Button size="lg">Large</Button>
          </div>
        </div>

        {/* With Icons */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-[var(--text-secondary)]">
            With Icons
          </h3>
          <div className="flex flex-wrap gap-4">
            <Button leftIcon={<Plus size={18} />}>Create New</Button>
            <Button variant="secondary" leftIcon={<Settings size={18} />}>
              Settings
            </Button>
            <Button variant="danger" leftIcon={<Trash2 size={18} />}>
              Delete
            </Button>
            <Button variant="danger-outline" leftIcon={<LogOut size={18} />}>
              exit
            </Button>
            <Button variant="ghost" rightIcon={<X size={18} />}>
              Cancel
            </Button>
          </div>
        </div>

        {/* States */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-[var(--text-secondary)]">
            States
          </h3>
          <div className="flex flex-wrap gap-4">
            <Button isLoading>Loading</Button>
            <Button disabled>Disabled</Button>
            <Button variant="secondary" isLoading>
              Loading
            </Button>
            <Button variant="secondary" disabled>
              Disabled
            </Button>
          </div>
        </div>
      </section>

      {/* ========== IconButton Section ========== */}
      <section className="space-y-6">
        <h2 className="text-xl font-semibold text-[var(--text-bright)]">
          IconButton
        </h2>

        {/* Variants */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-[var(--text-secondary)]">
            Variants
          </h3>
          <div className="flex flex-wrap gap-4">
            <IconButton
              icon={<Settings size={20} />}
              variant="default"
              aria-label="Settings"
            />
            <IconButton
              icon={<X size={20} />}
              variant="ghost"
              aria-label="Close"
            />
          </div>
        </div>

        {/* Sizes */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-[var(--text-secondary)]">
            Sizes
          </h3>
          <div className="flex flex-wrap items-center gap-4">
            <IconButton
              icon={<Plus size={16} />}
              size="sm"
              aria-label="Add small"
            />
            <IconButton
              icon={<Plus size={20} />}
              size="md"
              aria-label="Add medium"
            />
            <IconButton
              icon={<Plus size={24} />}
              size="lg"
              aria-label="Add large"
            />
          </div>
        </div>
      </section>

      {/* ========== Input Section ========== */}
      <section className="space-y-6">
        <h2 className="text-xl font-semibold text-[var(--text-bright)]">
          Input
        </h2>

        {/* Basic Input */}
        <div className="space-y-2 max-w-md">
          <h3 className="text-sm font-medium text-[var(--text-secondary)]">
            Basic Input
          </h3>
          <Input
            label="이메일"
            type="email"
            placeholder="이메일을 입력하세요"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
          />
        </div>

        {/* Required Input */}
        <div className="space-y-2 max-w-md">
          <h3 className="text-sm font-medium text-[var(--text-secondary)]">
            Required Input
          </h3>
          <Input
            label="프로젝트 이름"
            placeholder="프로젝트 이름을 입력하세요"
            isRequired
          />
        </div>

        {/* Error State */}
        <div className="space-y-2 max-w-md">
          <h3 className="text-sm font-medium text-[var(--text-secondary)]">
            Error State
          </h3>
          <Input
            label="비밀번호"
            type="password"
            value={errorInput}
            onChange={(e) => setErrorInput(e.target.value)}
            isError
            errorMessage="비밀번호는 8자 이상이어야 합니다."
          />
        </div>

        {/* Sizes */}
        <div className="space-y-4 max-w-md">
          <h3 className="text-sm font-medium text-[var(--text-secondary)]">
            Sizes
          </h3>
          <Input size="sm" placeholder="Small" />
          <Input size="md" placeholder="Medium (기본)" />
          <Input size="lg" placeholder="Large" />
        </div>

        {/* Disabled */}
        <div className="space-y-2 max-w-md">
          <h3 className="text-sm font-medium text-[var(--text-secondary)]">
            Disabled
          </h3>
          <Input
            label="비활성화"
            value="수정할 수 없습니다"
            disabled
          />
        </div>
      </section>

      {/* ========== SearchInput Section ========== */}
      <section className="space-y-6">
        <h2 className="text-xl font-semibold text-[var(--text-bright)]">
          SearchInput
        </h2>

        {/* Basic Search */}
        <div className="space-y-2 max-w-md">
          <h3 className="text-sm font-medium text-[var(--text-secondary)]">
            Basic Search
          </h3>
          <SearchInput
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onClear={() => setSearchValue('')}
            placeholder="회의록 검색..."
          />
        </div>

        {/* Sizes */}
        <div className="space-y-4 max-w-md">
          <h3 className="text-sm font-medium text-[var(--text-secondary)]">
            Sizes
          </h3>
          <SearchInput size="sm" placeholder="Small 검색..." />
          <SearchInput size="md" placeholder="Medium 검색... (기본)" />
          <SearchInput size="lg" placeholder="Large 검색..." />
        </div>
      </section>
    </div>
  );
}