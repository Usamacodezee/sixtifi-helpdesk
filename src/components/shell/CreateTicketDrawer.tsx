import React, { useState, useEffect } from 'react';
import { Drawer } from '../ui/Drawer';
import { Button } from '../ui/Button';
import { FormField, TextInput, SelectInput, TextareaInput } from '../ui/FormControls';
import { PriorityBadge } from '../ui/Badge';
import { Paperclip } from 'lucide-react';

export interface CreateTicketDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (title: string) => void;
  initialCategory?: string;
}

export const CreateTicketDrawer: React.FC<CreateTicketDrawerProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialCategory
}) => {
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('hr');
  const [priority, setPriority] = useState<'Low' | 'Medium' | 'High' | 'Urgent'>('Medium');
  const [description, setDescription] = useState('');
  const [requester, setRequester] = useState('Alex Rivera (Self)');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialCategory) {
      setCategory(initialCategory);
    }
  }, [initialCategory]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject) return;

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      onSuccess(subject);
      onClose();
      // Reset
      setSubject('');
      setDescription('');
    }, 400);
  };

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title="Raise a request"
      subtitle="Share a short summary and we’ll route it to the right team."
      width="540px"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            isLoading={isSubmitting}
            disabled={!subject}
          >
            Submit request
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
        <FormField label="Who is this for?" required hint="Yourself or another employee">
          <SelectInput value={requester} onChange={e => setRequester(e.target.value)}>
            <option value="Alex Rivera (Self)">Alex Rivera (me)</option>
            <option value="Sarah Jenkins">Sarah Jenkins</option>
            <option value="Michael Chen">Michael Chen</option>
          </SelectInput>
        </FormField>

        <FormField label="Category" required hint="What kind of help do you need?">
          <SelectInput value={category} onChange={e => setCategory(e.target.value)}>
            <option value="hr">HR</option>
            <option value="attendance">Attendance & leave</option>
            <option value="payroll">Payroll</option>
            <option value="it">IT support</option>
            <option value="admin">Administration</option>
          </SelectInput>
        </FormField>

        <FormField label="Subject" required hint="One short line">
          <TextInput
            value={subject}
            onChange={e => setSubject(e.target.value)}
            placeholder="e.g. Attendance fix for Aug 14"
          />
        </FormField>

        <FormField label="How urgent is this?" required>
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            {(['Low', 'Medium', 'High', 'Urgent'] as const).map(p => (
              <button
                key={p}
                type="button"
                onClick={() => setPriority(p)}
                style={{
                  flex: 1,
                  padding: '6px',
                  borderRadius: 'var(--radius-sm)',
                  border: priority === p ? '2px solid var(--color-primary-600)' : '1px solid var(--border-default)',
                  backgroundColor: priority === p ? 'var(--color-primary-50)' : 'var(--bg-surface)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <PriorityBadge priority={p} />
              </button>
            ))}
          </div>
        </FormField>

        <FormField label="Details" required hint="What happened, and what do you need?">
          <TextareaInput
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Add dates, names, or anything else that helps..."
            rows={4}
          />
        </FormField>

        <div style={{ padding: 'var(--space-4)', border: '1px dashed var(--border-strong)', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--bg-subtle)', textAlign: 'center', cursor: 'pointer' }}>
          <Paperclip size={18} style={{ color: 'var(--text-muted)', marginBottom: '4px' }} />
          <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-primary)' }}>Add a file (optional)</div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>PNG, JPG, PDF up to 10MB</div>
        </div>
      </form>
    </Drawer>
  );
};
