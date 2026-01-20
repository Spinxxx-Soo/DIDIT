import { Button, IconButton } from '@/components/common/Button';
import { Plus, Settings, Trash2, X } from 'lucide-react';

export function DevTest() {
  return (
    <div className="p-8 space-y-12 bg-[var(--bg-app)] min-h-screen">
      <h1 className="text-3xl font-bold text-[var(--text-bright)]">
        Component Test Page
      </h1>

      {/* Button Section */}
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

      {/* IconButton Section */}
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
    </div>
  );
}