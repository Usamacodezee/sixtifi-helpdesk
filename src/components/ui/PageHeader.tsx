import React from 'react';
import { ChevronRight } from 'lucide-react';
import './PageHeader.css';

export interface Breadcrumb {
  label: string;
  href?: string;
  onClick?: () => void;
}

export interface PageHeaderProps {
  breadcrumbs?: Breadcrumb[];
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  badge?: React.ReactNode;
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  breadcrumbs,
  title,
  subtitle,
  actions,
  badge,
  className = ''
}) => {
  return (
    <div className={`page-header-container ${className}`}>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="breadcrumb-nav" aria-label="Breadcrumb">
          {breadcrumbs.map((item, index) => {
            const isLast = index === breadcrumbs.length - 1;
            return (
              <React.Fragment key={index}>
                {index > 0 && <ChevronRight size={12} className="breadcrumb-separator" />}
                {isLast ? (
                  <span className="breadcrumb-item is-active" aria-current="page">
                    {item.label}
                  </span>
                ) : (
                  <a
                    href={item.href || '#'}
                    className="breadcrumb-item"
                    onClick={(e) => {
                      if (item.onClick) {
                        e.preventDefault();
                        item.onClick();
                      }
                    }}
                  >
                    {item.label}
                  </a>
                )}
              </React.Fragment>
            );
          })}
        </nav>
      )}

      <div className="page-header-main">
        <div className="page-header-titles">
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <h1 className="text-h1">{title}</h1>
            {badge}
          </div>
          {subtitle && <p className="text-subtitle">{subtitle}</p>}
        </div>

        {actions && <div className="page-header-actions">{actions}</div>}
      </div>
    </div>
  );
};
