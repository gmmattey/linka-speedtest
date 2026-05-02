import { useState } from 'react';
import { IOSList } from '../components/IOSList';
import { Icon } from '../components/icons';
import './RoomTestScreen.css';

const ROOM_PRESETS = ['Sala', 'Quarto', 'Escritório', 'Cozinha', 'Varanda', 'Garagem'];

interface Props {
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  onStart: (locationTag: string) => void;
  onBack: () => void;
}

export function RoomTestScreen({ onStart, onBack }: Props) {
  const [custom, setCustom] = useState('');

  const handleCustomStart = () => {
    const tag = custom.trim();
    if (tag) onStart(tag);
  };

  return (
    <div className="lk-room">
      <div className="lk-room__head">
        <button className="lk-room__back" onClick={onBack}>‹ Voltar</button>
        <span className="lk-room__head-label">Teste por local</span>
      </div>

      <div className="lk-room__scroll">
        <div className="lk-room__hero">
          <div className="lk-room__title">Selecione o cômodo</div>
          <p className="lk-room__sub">O resultado ficará salvo com essa etiqueta no histórico.</p>
        </div>

        <IOSList
          items={ROOM_PRESETS.map((room) => ({
            icon: <Icon name="pin" size={14} color="var(--accent)" />,
            iconBg: 'var(--accent-tint)',
            title: room,
            showChevron: true,
            onClick: () => onStart(room),
          }))}
        />

        <div className="lk-room__custom">
          <p className="lk-room__custom-label">Outro local</p>
          <div className="lk-room__custom-row">
            <input
              className="lk-room__input"
              type="text"
              placeholder="Ex.: Terraço, Escritório 2…"
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCustomStart()}
              maxLength={32}
            />
            <button
              className="btn-primary lk-room__custom-btn"
              onClick={handleCustomStart}
              disabled={!custom.trim()}
            >
              Iniciar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
