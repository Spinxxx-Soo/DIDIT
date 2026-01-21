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
import { Avatar, AvatarGroup } from '@/components/common/Avatar';
import { Badge, DotBadge, CountBadge } from '@/components/common/Badge';
import { Divider } from '@/components/common/Divider';
import { Plus, Settings, Trash2, X, LogOut, Folder, Circle } from 'lucide-react';
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

  const sampleAvatars = [
    { name: '김도연' },
    { name: '김이' },
    { name: '이다연' },
    { name: '손율준' },
    { name: '하지연' },
    { name: '홍수민' },
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

        <div className="space-y-2">
          <h3 className="text-sm font-medium text-[var(--text-secondary)]">
            Sizes & States
          </h3>
          <div className="flex flex-wrap items-center gap-4">
            <Button size="sm">Small</Button>
            <Button size="md">Medium</Button>
            <Button size="lg">Large</Button>
            <Button isLoading>Loading</Button>
            <Button disabled>Disabled</Button>
          </div>
        </div>
      </section>

      <Divider />

      {/* ========== IconButton Section ========== */}
      <section className="space-y-6">
        <h2 className="text-xl font-semibold text-[var(--text-bright)]">
          IconButton
        </h2>

        <div className="flex flex-wrap items-center gap-4">
          <IconButton icon={<Settings size={20} />} aria-label="Settings" />
          <IconButton icon={<X size={20} />} variant="ghost" aria-label="Close" />
          <IconButton icon={<Plus size={16} />} size="sm" aria-label="Add" />
          <IconButton icon={<Plus size={24} />} size="lg" aria-label="Add" />
        </div>
      </section>

      <Divider />

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

      <Divider />

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

      <Divider />

      {/* ========== Checkbox Section ========== */}
      <section className="space-y-6">
        <h2 className="text-xl font-semibold text-[var(--text-bright)]">
          Checkbox
        </h2>

        <div className="space-y-2">
          <h3 className="text-sm font-medium text-[var(--text-secondary)]">
            Single & Sizes
          </h3>
          <div className="flex flex-wrap gap-6">
            <Checkbox
              label="동의합니다"
              isChecked={isChecked}
              onChange={setIsChecked}
            />
            <Checkbox label="Small" size="sm" isChecked />
            <Checkbox label="Large" size="lg" isChecked />
            <Checkbox label="비활성화" isDisabled />
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="text-sm font-medium text-[var(--text-secondary)]">
            Checkbox Group
          </h3>
          <CheckboxGroup
            label="다음 팀장을 선택해주세요."
            options={memberOptions}
            selectedValues={selectedMembers}
            onChange={setSelectedMembers}
          />
        </div>
      </section>

      <Divider />

      {/* ========== Avatar Section ========== */}
      <section className="space-y-6">
        <h2 className="text-xl font-semibold text-[var(--text-bright)]">
          Avatar
        </h2>

        {/* Sizes */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-[var(--text-secondary)]">
            Sizes
          </h3>
          <div className="flex flex-wrap items-end gap-4">
            <Avatar size="xs" name="김도연" />
            <Avatar size="sm" name="김도연" />
            <Avatar size="md" name="김도연" />
            <Avatar size="lg" name="김도연" />
            <Avatar size="xl" name="김도연" />
            <Avatar size="2xl" name="김도연" />
          </div>
        </div>

        {/* With Status */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-[var(--text-secondary)]">
            With Status
          </h3>
          <div className="flex flex-wrap items-center gap-4">
            <Avatar name="김이" status="online" />
            <Avatar name="이다연" status="away" />
            <Avatar name="손율준" status="busy" />
            <Avatar name="하지연" status="offline" />
            <Avatar /> {/* Default (no name, no image) */}
          </div>
        </div>

        {/* Avatar Group */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-[var(--text-secondary)]">
            Avatar Group
          </h3>
          <div className="flex flex-wrap items-center gap-8">
            <AvatarGroup avatars={sampleAvatars} max={3} size="sm" />
            <AvatarGroup avatars={sampleAvatars} max={4} size="md" />
            <AvatarGroup avatars={sampleAvatars} max={5} size="lg" />
          </div>
        </div>
      </section>

      <Divider />

      {/* ========== Badge Section ========== */}
      <section className="space-y-6">
        <h2 className="text-xl font-semibold text-[var(--text-bright)]">
          Badge
        </h2>

        <div className="space-y-2">
          <h3 className="text-sm font-medium text-[var(--text-secondary)]">
            Variants & Sizes
          </h3>
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant="default">Default</Badge>
            <Badge variant="success">Online</Badge>
            <Badge variant="warning">Away</Badge>
            <Badge variant="error">Busy</Badge>
            <Badge variant="info">Meeting</Badge>
          </div>
        </div>

        {/* Sizes */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-[var(--text-secondary)]">
            Sizes
          </h3>
          <div className="flex flex-wrap items-center gap-3">
            <Badge size="sm" variant="success">Small</Badge>
            <Badge size="md" variant="success">Medium</Badge>
            <Badge size="lg" variant="success">Large</Badge>
          </div>
        </div>

        {/* With Icon */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-[var(--text-secondary)]">
            With Icon
          </h3>
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant="success" leftIcon={<Circle size={8} fill="currentColor" />}>
              온라인
            </Badge>
            <Badge variant="error" leftIcon={<Circle size={8} fill="currentColor" />}>
              오프라인
            </Badge>
          </div>
        </div>

        {/* Dot Badge */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-[var(--text-secondary)]">
            Dot Badge
          </h3>
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-2">
              <DotBadge variant="success" />
              <span className="text-[14px] text-[var(--text-primary)]">Online</span>
            </div>
            <div className="flex items-center gap-2">
              <DotBadge variant="warning" />
              <span className="text-[14px] text-[var(--text-primary)]">Away</span>
            </div>
            <div className="flex items-center gap-2">
              <DotBadge variant="error" />
              <span className="text-[14px] text-[var(--text-primary)]">Busy</span>
            </div>
          </div>
        </div>

        {/* Count Badge */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-[var(--text-secondary)]">
            Count Badge
          </h3>
          <div className="flex flex-wrap items-center gap-6">
            <div className="relative">
              <IconButton icon={<Settings size={20} />} aria-label="Settings" />
              <span className="absolute -top-1 -right-1">
                <CountBadge count={3} size="sm" />
              </span>
            </div>
            <div className="relative">
              <IconButton icon={<Settings size={20} />} aria-label="Settings" />
              <span className="absolute -top-1 -right-1">
                <CountBadge count={99} size="md" />
              </span>
            </div>
            <div className="relative">
              <IconButton icon={<Settings size={24} />} size="lg" aria-label="Settings" />
              <span className="absolute -top-1 -right-1">
                <CountBadge count={150} max={99} size="lg" />
              </span>
            </div>
          </div>
        </div>
      </section>

      <Divider />

      {/* ========== Divider Section ========== */}
      <section className="space-y-6">
        <h2 className="text-xl font-semibold text-[var(--text-bright)]">
          Divider
        </h2>

        {/* Horizontal */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-[var(--text-secondary)]">
            Horizontal
          </h3>
          <div className="space-y-4 max-w-md">
            <Divider variant="subtle" />
            <Divider variant="default" />
            <Divider variant="strong" />
          </div>
        </div>

        {/* With Label */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-[var(--text-secondary)]">
            With Label
          </h3>
          <div className="max-w-md">
            <Divider label="또는" />
          </div>
        </div>

        {/* Vertical */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-[var(--text-secondary)]">
            Vertical
          </h3>
          <div className="flex items-center gap-4 h-10">
            <span className="text-[var(--text-primary)]">항목 1</span>
            <Divider orientation="vertical" />
            <span className="text-[var(--text-primary)]">항목 2</span>
            <Divider orientation="vertical" />
            <span className="text-[var(--text-primary)]">항목 3</span>
          </div>
        </div>
      </section>

      <Divider />

      {/* ========== Card Section ========== */}
      <section className="space-y-6">
        <h2 className="text-xl font-semibold text-[var(--text-bright)]">
          Card
        </h2>

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
      </section>

      <Divider />

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
            <Button variant="secondary" onClick={() => setIsBasicModalOpen(false)}>
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
            <Button variant="secondary" onClick={() => setIsFormModalOpen(false)}>
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