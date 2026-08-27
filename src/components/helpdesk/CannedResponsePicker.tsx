import React, { useEffect, useRef, useState } from 'react';
import { Button } from '../ui/Button';
import { SearchInput } from '../ui/FormControls';
import { MessageSquareQuote } from 'lucide-react';
import {
  applyCannedResponseVariables,
  CANNED_RESPONSES_UPDATED_EVENT,
  CannedResponse,
  filterCannedResponses,
  getCannedResponses
} from '../../data/cannedResponses';
import './CannedResponsePicker.css';

export interface CannedResponsePickerProps {
  replyScope: 'public' | 'internal';
  onInsert: (text: string) => void;
  variables?: Record<string, string>;
  disabled?: boolean;
}

export const CannedResponsePicker: React.FC<CannedResponsePickerProps> = ({
  replyScope,
  onInsert,
  variables = {},
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [responses, setResponses] = useState<CannedResponse[]>(() => getCannedResponses());
  const containerRef = useRef<HTMLDivElement>(null);

  const refresh = () => setResponses(getCannedResponses());

  useEffect(() => {
    const handleUpdate = () => refresh();
    window.addEventListener(CANNED_RESPONSES_UPDATED_EVENT, handleUpdate);
    return () => window.removeEventListener(CANNED_RESPONSES_UPDATED_EVENT, handleUpdate);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    refresh();
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const filtered = filterCannedResponses(responses, replyScope, searchQuery);

  const handleSelect = (item: CannedResponse) => {
    const text = applyCannedResponseVariables(item.body, variables);
    onInsert(text);
    setIsOpen(false);
    setSearchQuery('');
  };

  return (
    <div className="canned-picker" ref={containerRef}>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        leftIcon={<MessageSquareQuote size={14} />}
        disabled={disabled}
        onClick={() => setIsOpen(prev => !prev)}
      >
        Canned Response
      </Button>

      {isOpen && (
        <div className="canned-picker-popover" role="listbox" aria-label="Canned responses">
          <div className="canned-picker-header">
            <span className="canned-picker-title">
              {replyScope === 'internal' ? 'Internal note templates' : 'Public reply templates'}
            </span>
            <span className="canned-picker-count">{filtered.length} available</span>
          </div>

          <SearchInput
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onClear={() => setSearchQuery('')}
            placeholder="Search templates..."
          />

          <div className="canned-picker-list">
            {filtered.length === 0 ? (
              <div className="canned-picker-empty">No templates match this reply type.</div>
            ) : (
              filtered.map(item => (
                <button
                  key={item.id}
                  type="button"
                  className="canned-picker-item"
                  onClick={() => handleSelect(item)}
                >
                  <div className="canned-picker-item-top">
                    <span className="canned-picker-item-title">{item.title}</span>
                    <span className="canned-picker-item-category">{item.category}</span>
                  </div>
                  <span className="canned-picker-item-preview">{item.body}</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
