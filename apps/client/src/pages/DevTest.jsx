import { Button, IconButton } from '@/components/common/Button';
import { Input, SearchInput } from '@/components/common/Input';
import { Modal, ConfirmModal } from '@/components/common/Modal';
import { Checkbox, CheckboxGroup } from '@/components/common/Checkbox';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/common/Card';
import { Plus, Settings, Trash2, LogOut, X, Folder } from 'lucide-react';
import { useState } from 'react';

export function DevTest() {
  // Input 테스트용 state
  const [inputValue, setInputValue] = useState('');
  const [searchValue, setSearchValue] = useState('');
  const [errorInput, setErrorInput] = useState('잘못된 입력');

  // Modal 테스트용 state
  const [isBasicModalOpen, setIsBasicModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [projectName, setProjectName] = useState('');

  // Checkbox 테스트용 state
  const [isChecked, setIsChecked] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState(['kim']);

  // Card 테스트용 state
  const [selectedCard, setSelectedCard] = useState(null);

  const memberOptions = [
    { value: 'kim', label: '김이' },
    { value: 'lee', label: '이다연' },
    { value: 'son', label: '손율준' },
    { value: 'ha', label: '하지연' },
    { value: 'hong', label: '홍수민' },
  ];

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
            <Button variant="danger-outline">Danger Outline</Button>
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
              Exit
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

        <div className="space-y-2">
          <h3 className="text-sm font-medium text-[var(--text-secondary)]">
            Variants & Sizes
          </h3>
          <div className="flex flex-wrap items-center gap-4">
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
            <IconButton
              icon={<Plus size={16} />}
              size="sm"
              aria-label="Add small"
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl">
          <Input
            label="이메일"
            type="email"
            placeholder="이메일을 입력하세요"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
          />
          <Input
            label="프로젝트 이름"
            placeholder="프로젝트 이름을 입력하세요"
            isRequired
          />
          <Input
            label="비밀번호"
            type="password"
            value={errorInput}
            onChange={(e) => setErrorInput(e.target.value)}
            isError
            errorMessage="비밀번호는 8자 이상이어야 합니다."
          />
          <Input label="비활성화" value="수정할 수 없습니다" disabled />
        </div>
      </section>

      {/* ========== SearchInput Section ========== */}
      <section className="space-y-6">
        <h2 className="text-xl font-semibold text-[var(--text-bright)]">
          SearchInput
        </h2>

        <div className="max-w-md">
          <SearchInput
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onClear={() => setSearchValue('')}
            placeholder="회의록 검색..."
          />
        </div>
      </section>

      {/* ========== Checkbox Section ========== */}
      <section className="space-y-6">
        <h2 className="text-xl font-semibold text-[var(--text-bright)]">
          Checkbox
        </h2>

        {/* Single Checkbox */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-[var(--text-secondary)]">
            Single Checkbox
          </h3>
          <div className="flex flex-wrap gap-6">
            <Checkbox
              label="동의합니다"
              isChecked={isChecked}
              onChange={setIsChecked}
            />
            <Checkbox label="비활성화" isDisabled />
            <Checkbox label="비활성화 (체크됨)" isChecked isDisabled />
          </div>
        </div>

        {/* Sizes */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-[var(--text-secondary)]">
            Sizes
          </h3>
          <div className="flex flex-wrap gap-6">
            <Checkbox label="Small" size="sm" isChecked />
            <Checkbox label="Medium (기본)" size="md" isChecked />
            <Checkbox label="Large" size="lg" isChecked />
          </div>
        </div>

        {/* Checkbox Group */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-[var(--text-secondary)]">
            Checkbox Group (팀장 선택)
          </h3>
          <CheckboxGroup
            label="다음 팀장을 선택해주세요."
            options={memberOptions}
            selectedValues={selectedMembers}
            onChange={setSelectedMembers}
          />
          <p className="text-[13px] text-[var(--text-tertiary)] mt-2">
            선택된 멤버: {selectedMembers.join(', ') || '없음'}
          </p>
        </div>
      </section>

      {/* ========== Card Section ========== */}
      <section className="space-y-6">
        <h2 className="text-xl font-semibold text-[var(--text-bright)]">
          Card
        </h2>

        {/* Basic Cards */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-[var(--text-secondary)]">
            Variants
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card variant="default">
              <CardTitle>Default Card</CardTitle>
              <CardDescription>기본 카드 스타일입니다.</CardDescription>
            </Card>
            <Card variant="elevated">
              <CardTitle>Elevated Card</CardTitle>
              <CardDescription>그림자가 있는 카드입니다.</CardDescription>
            </Card>
            <Card variant="outline">
              <CardTitle>Outline Card</CardTitle>
              <CardDescription>테두리만 있는 카드입니다.</CardDescription>
            </Card>
          </div>
        </div>

        {/* Clickable Cards */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-[var(--text-secondary)]">
            Clickable Cards (프로젝트 선택)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
            {['project-1', 'project-2'].map((id) => (
              <Card
                key={id}
                variant="elevated"
                isClickable
                isSelected={selectedCard === id}
                onClick={() => setSelectedCard(id)}
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-[var(--success-bg)] rounded-[var(--radius-md)]">
                    <Folder size={20} className="text-[var(--color-green-primary)]" />
                  </div>
                  <div className="flex-1">
                    <CardTitle>
                      {id === 'project-1' ? '프론트엔드 버그 수정' : '모바일 앱 리팩토링'}
                    </CardTitle>
                    <CardDescription>
                      Repository: my-project/{id === 'project-1' ? 'frontend' : 'mobile'}
                    </CardDescription>
                    <p className="mt-2 text-[13px] text-[var(--text-tertiary)]">
                      멤버 4명 • 마지막 활동: 2시간 전
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Full Card */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-[var(--text-secondary)]">
            Full Card with Header & Footer
          </h3>
          <Card variant="elevated" className="max-w-md">
            <CardHeader>
              <CardTitle>이슈 상세</CardTitle>
              <CardDescription>이슈 #143에 대한 정보입니다.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-[var(--text-primary)]">
                로그인 버튼 클릭 시 간헐적으로 오류가 발생합니다. 
                재현 조건과 로그를 첨부합니다.
              </p>
            </CardContent>
            <CardFooter>
              <Button variant="secondary" size="sm">
                취소
              </Button>
              <Button size="sm">저장</Button>
            </CardFooter>
          </Card>
        </div>
      </section>

      {/* ========== Modal Section ========== */}
      <section className="space-y-6">
        <h2 className="text-xl font-semibold text-[var(--text-bright)]">
          Modal
        </h2>

        <div className="flex flex-wrap gap-4">
          <Button onClick={() => setIsBasicModalOpen(true)}>
            Basic Modal
          </Button>
          <Button variant="danger" onClick={() => setIsConfirmModalOpen(true)}>
            Confirm Modal
          </Button>
          <Button variant="secondary" onClick={() => setIsFormModalOpen(true)}>
            Form Modal
          </Button>
        </div>
      </section>

      {/* ========== Modals ========== */}
      <Modal
        isOpen={isBasicModalOpen}
        onClose={() => setIsBasicModalOpen(false)}
        title="프로젝트 관리"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setIsBasicModalOpen(false)}
            >
              취소
            </Button>
            <Button onClick={() => setIsBasicModalOpen(false)}>저장</Button>
          </>
        }
      >
        <p className="text-[var(--text-primary)]">
          이것은 기본 모달입니다. 다양한 내용을 담을 수 있습니다.
        </p>
      </Modal>

      <ConfirmModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={() => {
          alert('확인되었습니다!');
          setIsConfirmModalOpen(false);
        }}
        title="정말 프로젝트를 떠나시겠습니까?"
        message="프로젝트를 나가게 되면 '공통 프로젝트'에 더 이상 접속할 수 없으며, 프로젝트 내에 자료들에 대한 접근 권한을 모두 잃습니다."
        confirmText="나가기"
        cancelText="취소하기"
        confirmVariant="danger"
      />

      <Modal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        title="새 프로젝트 만들기"
        size="md"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setIsFormModalOpen(false)}
            >
              취소
            </Button>
            <Button
              onClick={() => {
                alert(`프로젝트 "${projectName}" 생성!`);
                setIsFormModalOpen(false);
                setProjectName('');
              }}
              disabled={!projectName.trim()}
            >
              생성하기
            </Button>
          </>
        }
      >
        <Input
          label="프로젝트 이름"
          placeholder="멋진 프로젝트의 이름을 지어주세요!"
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
          isRequired
        />
      </Modal>
    </div>
  );
}