import React, { useEffect, useState } from 'react';
import { FormField, SelectInput, TextareaInput } from '../ui/FormControls';
import {
  CLOSING_REASONS_UPDATED_EVENT,
  ClosingReason,
  ClosingReasonContext,
  getClosingReasonsByContext,
  isClosingCommentRequired
} from '../../data/closingReasons';

export interface ClosingReasonFieldsProps {
  context: ClosingReasonContext;
  selectedReasonId: string;
  onReasonChange: (reasonId: string) => void;
  comment: string;
  onCommentChange: (comment: string) => void;
  commentLabel?: string;
  commentPlaceholder?: string;
}

export const ClosingReasonFields: React.FC<ClosingReasonFieldsProps> = ({
  context,
  selectedReasonId,
  onReasonChange,
  comment,
  onCommentChange,
  commentLabel = 'Closing note',
  commentPlaceholder = 'Add details about why this ticket is being closed...'
}) => {
  const [reasons, setReasons] = useState<ClosingReason[]>(() => getClosingReasonsByContext(context));

  useEffect(() => {
    const refresh = () => setReasons(getClosingReasonsByContext(context));
    refresh();
    window.addEventListener(CLOSING_REASONS_UPDATED_EVENT, refresh);
    return () => window.removeEventListener(CLOSING_REASONS_UPDATED_EVENT, refresh);
  }, [context]);

  useEffect(() => {
    if (reasons.length > 0 && !reasons.some(item => item.id === selectedReasonId)) {
      onReasonChange(reasons[0].id);
    }
  }, [reasons, selectedReasonId, onReasonChange]);

  const selectedReason = reasons.find(item => item.id === selectedReasonId);
  const commentRequired = selectedReason?.requiresComment ?? true;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      <FormField label="Closing Reason" required hint={selectedReason?.description}>
        <SelectInput
          value={selectedReasonId}
          onChange={e => onReasonChange(e.target.value)}
        >
          {reasons.length === 0 ? (
            <option value="">No active reasons configured</option>
          ) : (
            reasons.map(item => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))
          )}
        </SelectInput>
      </FormField>

      <FormField
        label={commentLabel}
        required={commentRequired}
        hint={commentRequired ? 'Required for the selected closing reason' : 'Optional for this closing reason'}
      >
        <TextareaInput
          value={comment}
          onChange={e => onCommentChange(e.target.value)}
          placeholder={commentPlaceholder}
          rows={4}
        />
      </FormField>
    </div>
  );
};

export function canSubmitClosingReason(reasonId: string, comment: string): boolean {
  if (!reasonId) return false;
  if (isClosingCommentRequired(reasonId) && !comment.trim()) return false;
  return true;
}
