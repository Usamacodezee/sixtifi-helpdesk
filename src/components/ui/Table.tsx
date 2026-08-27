import React from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import './Table.css';

export interface Column<T> {
  key: string;
  header: string;
  render?: (item: T) => React.ReactNode;
  sortable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

export interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T) => string;
  selectedIds?: string[];
  onSelectAll?: (checked: boolean) => void;
  onSelectRow?: (id: string, checked: boolean) => void;
  sortColumn?: string;
  sortDirection?: 'asc' | 'desc';
  onSort?: (key: string) => void;
  onRowClick?: (item: T) => void;
  emptyState?: React.ReactNode;
  isLoading?: boolean;
}

export function Table<T>({
  columns,
  data,
  keyExtractor,
  selectedIds = [],
  onSelectAll,
  onSelectRow,
  sortColumn,
  sortDirection,
  onSort,
  onRowClick,
  emptyState,
  isLoading
}: TableProps<T>) {
  const allSelected = data.length > 0 && data.every(item => selectedIds.includes(keyExtractor(item)));
  const someSelected = selectedIds.length > 0 && !allSelected;

  return (
    <div className="table-container">
      <div className="table-scroll">
        <table className="enterprise-table">
          <thead>
            <tr>
              {onSelectRow && (
                <th style={{ width: '40px', textAlign: 'center' }}>
                  <input
                    type="checkbox"
                    className="checkbox-input"
                    checked={allSelected}
                    ref={input => {
                      if (input) input.indeterminate = someSelected;
                    }}
                    onChange={e => onSelectAll && onSelectAll(e.target.checked)}
                  />
                </th>
              )}

              {columns.map(col => {
                const isSorted = sortColumn === col.key;
                return (
                  <th
                    key={col.key}
                    style={{ width: col.width, textAlign: col.align || 'left' }}
                    className={col.sortable ? 'sortable' : ''}
                    onClick={() => col.sortable && onSort && onSort(col.key)}
                  >
                    <div className="th-content" style={{ justifyContent: col.align === 'center' ? 'center' : col.align === 'right' ? 'flex-end' : 'flex-start' }}>
                      <span>{col.header}</span>
                      {col.sortable && (
                        <span>
                          {isSorted ? (
                            sortDirection === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />
                          ) : (
                            <ArrowUpDown size={12} style={{ opacity: 0.4 }} />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody>
            {!isLoading && data.length === 0 && (
              <tr>
                <td colSpan={columns.length + (onSelectRow ? 1 : 0)}>
                  {emptyState || <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--text-muted)' }}>No records found</div>}
                </td>
              </tr>
            )}

            {data.map(item => {
              const id = keyExtractor(item);
              const isSelected = selectedIds.includes(id);

              return (
                <tr
                  key={id}
                  className={isSelected ? 'is-selected' : ''}
                  onClick={() => onRowClick && onRowClick(item)}
                  style={{ cursor: onRowClick ? 'pointer' : 'default' }}
                >
                  {onSelectRow && (
                    <td style={{ textAlign: 'center' }} onClick={e => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        className="checkbox-input"
                        checked={isSelected}
                        onChange={e => onSelectRow(id, e.target.checked)}
                      />
                    </td>
                  )}

                  {columns.map(col => (
                    <td key={col.key} style={{ textAlign: col.align || 'left' }}>
                      {col.render ? col.render(item) : (item as any)[col.key]}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
