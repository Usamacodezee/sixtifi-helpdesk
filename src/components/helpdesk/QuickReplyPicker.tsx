import React, { useEffect, useRef, useState } from 'react';
import { Button } from '../ui/Button';
import { SearchInput } from '../ui/FormControls';
import { MessageSquareQuote } from 'lucide-react';
import {
  applyQuickReplyVariables,
  QUICK_REPLIES_UPDATED_EVENT,
  QuickReply,
  filterQuickReplies,
  getQuickReplies
} from '../../data/quickReplies';
import './QuickReplyPicker.css';

export interface QuickReplyPickerProps {
  replyScope: 'public' | 'internal';
  onInsert: (text: string) => void;
  variables?: Record<string, string>;
  disabled?: boolean;
}

export const QuickReplyPicker: React.FC<QuickReplyPickerProps> = ({
  replyScope,
  onInsert,
  variables = {},
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [replies, setReplies] = useState<QuickReply[]>(() => getQuickReplies());
  const containerRef = useRef<HTMLDivElement>(null);

  const refresh = () => setReplies(getQuickReplies());

  useEffect(() => {
    const handleUpdate = () => refresh();
    window.addEventListener(QUICK_REPLIES_UPDATED_EVENT, handleUpdate);
    return () => window.removeEventListener(QUICK_REPLIES_UPDATED_EVENT, handleUpdate);
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

  const filtered = filterQuickReplies(replies, replyScope, searchQuery);

  const handleSelect = (item: QuickReply) => {
    const text = applyQuickReplyVariables(item.body, variables);
    onInsert(text);
    setIsOpen(false);
    setSearchQuery('');
  };

  return (
    <div className="quick-reply-picker" ref={containerRef}>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        leftIcon={<MessageSquareQuote size={14} />}
        disabled={disabled}
        onClick={() => setIsOpen(prev => !prev)}
      >
        Quick Reply
      </Button>

      {isOpen && (
        <div className="quick-reply-picker-popover" role="listbox" aria-label="Quick replies">
          <div className="quick-reply-picker-header">
            <span className="quick-reply-picker-title">
              {replyScope === 'internal' ? 'Internal note templates' : 'Public reply templates'}
            </span>
            <span className="quick-reply-picker-count">{filtered.length} available</span>
          </div>

          <SearchInput
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onClear={() => setSearchQuery('')}
            placeholder="Search quick replies..."
          />

          <div className="quick-reply-picker-list">
            {filtered.length === 0 ? (
              <div className="quick-reply-picker-empty">No quick replies match this reply type.</div>
            ) : (
              filtered.map(item => (
                <button
                  key={item.id}
                  type="button"
                  className="quick-reply-picker-item"
                  onClick={() => handleSelect(item)}
                >
                  <div className="quick-reply-picker-item-top">
                    <span className="quick-reply-picker-item-title">{item.title}</span>
                    <span className="quick-reply-picker-item-category">{item.category}</span>
                  </div>
                  <span className="quick-reply-picker-item-preview">{item.body}</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
