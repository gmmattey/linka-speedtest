import type { ReactNode } from 'react';
import { Icon } from './icons';
import './IOSList.css';

export interface IOSListItem {
  icon?: ReactNode;
  iconBg?: string;
  title: string;
  /** Conteúdo opcional renderizado após o título no mesmo line-box. Útil
   *  para encaixar `<InfoTooltip>` ao lado do label sem refatorar o tipo
   *  `title` (string) que muitos consumidores usam. */
  titleAfter?: ReactNode;
  subtitle?: string;
  trailing?: ReactNode;
  showChevron?: boolean;
  onClick?: () => void;
}

interface Props {
  items: IOSListItem[];
}

export function IOSList({ items }: Props) {
  return (
    <div className="lk-ios-list">
      {items.map((item, i) => (
        <div
          key={i}
          className={`lk-ios-list__row${item.onClick ? ' lk-ios-list__row--clickable' : ''}`}
          onClick={item.onClick}
          role={item.onClick ? 'button' : undefined}
          tabIndex={item.onClick ? 0 : undefined}
          /* A11y (2026-05): role="button" + tabIndex sem onKeyDown deixa o
             screen reader anunciar como botão mas Enter/Space não ativa.
             Adicionamos handler manual idêntico ao default de <button>. */
          onKeyDown={item.onClick ? (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              item.onClick!();
            }
          } : undefined}
        >
          {item.icon != null && (
            <div
              className="lk-ios-list__icon"
              style={item.iconBg ? { background: item.iconBg } : undefined}
            >
              {item.icon}
            </div>
          )}
          <div className="lk-ios-list__text">
            <div className="lk-ios-list__title">
              {item.title}
              {item.titleAfter}
            </div>
            {item.subtitle && (
              <div className="lk-ios-list__sub">{item.subtitle}</div>
            )}
          </div>
          {item.trailing && (
            <div className="lk-ios-list__trailing">{item.trailing}</div>
          )}
          {item.showChevron && (
            <span className="lk-ios-list__chevron">
              <Icon name="chevron" size={14} color="var(--text-3)" />
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
