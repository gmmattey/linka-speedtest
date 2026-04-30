import { useState } from 'react';
import { Header } from '../components/Header';
import './RoomTestScreen.css';

const ROOM_PRESETS = ['Sala', 'Quarto', 'Escritório', 'Cozinha', 'Varanda', 'Garagem'];

interface Props {
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  onStart: (locationTag: string) => void;
  onBack: () => void;
}

export function RoomTestScreen({ theme, onToggleTheme, onStart, onBack }: Props) {
  const [custom, setCustom] = useState('');

  const handleCustomStart = () => {
    const tag = custom.trim();
    if (tag) onStart(tag);
  };

  return (
    <div className="lk-room">
      <Header theme={theme} onToggleTheme={onToggleTheme} />
      <main className="lk-room__main fade-in">
        <div className="lk-room__header">
          <button className="btn-text lk-room__back" onClick={onBack}>← Voltar</button>
          <h2 className="lk-room__title">Teste por local</h2>
          <p className="lk-room__subtitle">
            Selecione o cômodo onde você está. O resultado ficará salvo com essa etiqueta no histórico.
          </p>
        </div>

        <div className="lk-room__grid">
          {ROOM_PRESETS.map((room) => (
            <button
              key={room}
              className="lk-room__opt"
              onClick={() => onStart(room)}
            >
              {room}
            </button>
          ))}
        </div>

        <div className="lk-room__custom">
          <p className="lk-room__custom-label">Outro local</p>
          <div className="lk-room__custom-row">
            <input
              className="lk-room__input"
              type="text"
              placeholder="Ex.: Terraço, Garagem…"
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
      </main>
    </div>
  );
}
