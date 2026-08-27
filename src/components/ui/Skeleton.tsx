import React from 'react';

export interface SkeletonProps {
  width?: string;
  height?: string;
  borderRadius?: string;
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = '16px',
  borderRadius = 'var(--radius-xs)',
  className = ''
}) => {
  return (
    <div
      className={`skeleton-shimmer ${className}`}
      style={{
        width,
        height,
        borderRadius
      }}
    />
  );
};

export const SkeletonTable: React.FC<{ rows?: number }> = ({ rows = 5 }) => {
  return (
    <div
      style={{
        width: '100%',
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-md)',
        padding: 'var(--space-4)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-4)'
      }}
    >
      <div style={{ display: 'flex', gap: 'var(--space-4)', marginBottom: 'var(--space-2)' }}>
        <Skeleton width="120px" height="18px" />
        <Skeleton width="200px" height="18px" />
        <Skeleton width="100px" height="18px" />
        <Skeleton width="80px" height="18px" />
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} style={{ display: 'flex', gap: 'var(--space-4)', alignItems: 'center' }}>
          <Skeleton width="24px" height="24px" borderRadius="4px" />
          <Skeleton width="80px" height="16px" />
          <Skeleton width="45%" height="16px" />
          <Skeleton width="100px" height="20px" borderRadius="12px" />
          <Skeleton width="80px" height="20px" borderRadius="4px" />
        </div>
      ))}
    </div>
  );
};
