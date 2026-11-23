import React, { useEffect, useId, useRef, useState } from 'react';
import { Building2 } from 'lucide-react';
import { cariUniversitas } from '../data/universitas';
import { ID_TEXT } from '../i18n/id';
import { FIELD_LIMITS } from '../types/user';

interface UniversitasAutocompleteProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

export function UniversitasAutocomplete({
  id,
  value,
  onChange,
  error,
}: UniversitasAutocompleteProps) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const listboxId = useId();

  const suggestions = cariUniversitas(value, 8);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
        setActiveIndex(-1);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function selectItem(nama: string) {
    onChange(nama);
    setOpen(false);
    setActiveIndex(-1);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (!open && (event.key === 'ArrowDown' || event.key === 'ArrowUp')) {
      setOpen(true);
      setActiveIndex(0);
      return;
    }

    if (!open) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (event.key === 'Enter' && activeIndex >= 0 && suggestions[activeIndex]) {
      event.preventDefault();
      selectItem(suggestions[activeIndex].nama);
    } else if (event.key === 'Escape') {
      setOpen(false);
      setActiveIndex(-1);
    }
  }

  return (
    <div className="relative" ref={containerRef}>
      <div className="relative">
        <input
          id={id}
          type="text"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls={listboxId}
          aria-activedescendant={
            activeIndex >= 0 ? `${listboxId}-option-${activeIndex}` : undefined
          }
          aria-invalid={Boolean(error)}
          maxLength={FIELD_LIMITS.universitas}
          value={value}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            onChange(e.target.value);
            setOpen(true);
            setActiveIndex(-1);
          }}
          onKeyDown={handleKeyDown}
          placeholder={ID_TEXT.onboarding.layar1.universitasPlaceholder}
          className={`w-full min-h-[44px] px-4 py-2.5 rounded-xl border bg-white text-base text-[#0F172A] placeholder:text-slate-400 transition-colors focus:outline-none focus:ring-2 ${
            error
              ? 'border-rose-400 focus:ring-rose-200'
              : 'border-slate-300 focus:border-[#4F46E5] focus:ring-indigo-100'
          }`}
        />
      </div>

      {open && (
        <div
          id={listboxId}
          role="listbox"
          className="absolute left-0 right-0 mt-1.5 bg-white rounded-2xl border border-slate-200 shadow-lg max-h-64 overflow-y-auto z-40 py-1.5"
        >
          {suggestions.length > 0 ? (
            suggestions.map((item, index) => {
              const isSelected = index === activeIndex;
              return (
                <button
                  key={item.nama}
                  id={`${listboxId}-option-${index}`}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    selectItem(item.nama);
                  }}
                  className={`w-full min-h-[44px] px-4 py-2.5 text-left flex items-start gap-3 transition-colors ${
                    isSelected ? 'bg-indigo-50 text-[#4F46E5]' : 'hover:bg-slate-50 text-[#0F172A]'
                  }`}
                >
                  <Building2
                    className="w-4 h-4 text-slate-400 mt-1 shrink-0"
                    aria-hidden="true"
                  />
                  <div className="min-w-0">
                    <p className="text-base font-medium leading-snug truncate">{item.nama}</p>
                    {(item.singkatan?.length || item.kota) && (
                      <p className="text-xs text-slate-500 mt-0.5 truncate">
                        {[item.singkatan?.[0], item.kota].filter(Boolean).join(' · ')}
                      </p>
                    )}
                  </div>
                </button>
              );
            })
          ) : (
            <div className="px-4 py-3 text-sm text-slate-600">
              {ID_TEXT.onboarding.layar1.universitasKosongSaran}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
