'use client';

import React, { ReactNode } from 'react';
import { Search, Filter, X } from 'lucide-react';

export interface TabOption {
  key: string;
  label: string;
  count?: number;
}

interface FilterBarProps {
  searchPlaceholder?: string;
  searchValue: string;
  onSearchChange: (val: string) => void;
  tabs?: TabOption[];
  activeTab?: string;
  onTabChange?: (key: string) => void;
  filters?: ReactNode;
  actions?: ReactNode;
}

export function FilterBar({
  searchPlaceholder = 'Search records...',
  searchValue,
  onSearchChange,
  tabs,
  activeTab,
  onTabChange,
  filters,
  actions,
}: FilterBarProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        marginBottom: '18px',
      }}
    >
      {/* Tabs row if provided */}
      {tabs && tabs.length > 0 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            overflowX: 'auto',
            paddingBottom: '2px',
          }}
        >
          {tabs.map((t) => {
            const isActive = activeTab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => onTabChange && onTabChange(t.key)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '99px',
                  fontSize: '12.5px',
                  fontWeight: isActive ? 700 : 500,
                  background: isActive ? '#191c1e' : '#ffffff',
                  color: isActive ? '#ffffff' : 'var(--text-secondary)',
                  border: isActive ? '1px solid #191c1e' : '1px solid var(--border)',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s ease',
                }}
              >
                <span>{t.label}</span>
                {t.count !== undefined && (
                  <span
                    style={{
                      padding: '1px 6px',
                      borderRadius: '99px',
                      fontSize: '11px',
                      fontWeight: 700,
                      background: isActive ? 'rgba(255, 255, 255, 0.2)' : '#f1f5f9',
                      color: isActive ? '#ffffff' : '#64748b',
                    }}
                  >
                    {t.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Main Search & Action row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '280px' }}>
          {/* Search box */}
          <div
            style={{
              position: 'relative',
              flex: 1,
              maxWidth: '420px',
            }}
          >
            <Search
              size={15}
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#94a3b8',
              }}
            />
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 32px 8px 36px',
                borderRadius: '8px',
                border: '1px solid var(--border)',
                background: '#ffffff',
                fontSize: '13px',
                color: 'var(--text-primary)',
                outline: 'none',
                boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
              }}
              className="focus:border-amber-600 focus:ring-1 focus:ring-amber-500"
            />
            {searchValue && (
              <button
                onClick={() => onSearchChange('')}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#94a3b8',
                  padding: '2px',
                }}
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* Filters slot */}
          {filters}
        </div>

        {/* Actions slot */}
        {actions && <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>{actions}</div>}
      </div>
    </div>
  );
}
