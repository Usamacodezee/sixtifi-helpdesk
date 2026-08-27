import React from 'react';
import { Button, IconButton } from './Button';
import { X } from 'lucide-react';
import './BulkActionsBar.css';

export interface BulkActionsBarProps {
  selectedCount: number;
  onClear: () => void;
  children: React.ReactNode;
}

export const BulkActionsBar: React.FC<BulkActionsBarProps> = ({
  selectedCount,
  onClear,
  children
}) => {
  if (selectedCount <= 0) return null;

  return (
    <div className="bulk-actions-bar" role="region" aria-label="Bulk actions">
      <div className="bulk-actions-count">
        <strong>{selectedCount}</strong>{' '}
        {selectedCount === 1 ? 'ticket' : 'tickets'} selected
      </div>

      <div className="bulk-actions-group">
        {children}
        <IconButton
          icon={<X size={16} />}
          ariaLabel="Clear selection"
          variant="ghost"
          size="sm"
          onClick={onClear}
        />
      </div>
    </div>
  );
};

export { Button as BulkActionButton };
