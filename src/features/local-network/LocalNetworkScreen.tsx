import { useState } from 'react';
import { IOSList } from '../../components/IOSList';
import { PageHeader } from '../../components/PageHeader';
import { TopBar } from '../../components/TopBar';
import { Icon } from '../../components/icons';
import { useScrollHeader } from '../../hooks/useScrollHeader';
import { getCapabilities } from '../../platform/capabilities';
import { confidenceLabel, kindLabel, nameSourceLabel } from './LocalNetworkService';
import { useLocalNetworkDiscovery } from './useLocalNetworkDiscovery';
import type { IdentifiedDevice as LocalDevice } from './types';
import './LocalNetworkScreen.css';

const NICKNAMES_KEY = 'linka.network.nicknames';

function loadNicknames(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(NICKNAMES_KEY) || '{}');
  } catch {
    return {};
  }
}

function saveNickname(deviceId: string, nickname: string | null) {
  const existing = loadNicknames();
  if (nickname === null || nickname.trim() === '') {
    delete existing[deviceId];
  } else {
    existing[deviceId] = nickname.trim();
  }
  localStorage.setItem(NICKNAMES_KEY, JSON.stringify(existing));
}

function deviceId(device: LocalDevice): string {
  return device.mac || device.ip;
}

interface Props {
  onBack: () => void;
}

export function LocalNetworkScreen({ onBack }: Props) {
  const { localNetworkDiscovery } = getCapabilities();
  const { loading, result, error, run } = useLocalNetworkDiscovery();
  const { scrolled, scrollContainerRef, sentinelRef } = useScrollHeader();

  const [nicknames, setNicknames] = useState<Record<string, string>>(loadNicknames);
  const [editingDevice, setEditingDevice] = useState<LocalDevice | null>(null);
  const [nicknameInput, setNicknameInput] = useState('');

  const openNicknameSheet = (device: LocalDevice) => {
    setEditingDevice(device);
    setNicknameInput(nicknames[deviceId(device)] ?? '');
  };

  const saveAndClose = () => {
    if (!editingDevice) return;
    saveNickname(deviceId(editingDevice), nicknameInput);
    setNicknames(loadNicknames());
    setEditingDevice(null);
  };

  const clearAndClose = () => {
    if (!editingDevice) return;
    saveNickname(deviceId(editingDevice), null);
    setNicknames(loadNicknames());
    setEditingDevice(null);
  };

  const displayName = (device: LocalDevice): string => {
    return nicknames[deviceId(device)] || device.displayName;
  };

  return (
    <div className="lk-local-network">
      <TopBar
        onBack={onBack}
        scrolled={scrolled}
        title="Dispositivos"
        showTitle={scrolled}
      />

      <div className="lk-local-network__scroll" ref={scrollContainerRef}>
        <PageHeader ref={sentinelRef} size="md" title="Dispositivos" />

        <div className="lk-local-network__card">
          {!localNetworkDiscovery ? (
            <div className="lk-local-network__unavailable">
              <p className="lk-local-network__text lk-local-network__text--primary">
                Ver dispositivos conectados requer acesso à rede local.
              </p>
              <p className="lk-local-network__text">
                Navegadores não permitem esse nível de acesso por segurança. Use o app Android para ver quem está na sua rede.
              </p>
            </div>
          ) : (
            <>
              <p className="lk-local-network__text">
                A linka cruza sinais da rede local para identificar dispositivos. Toque em um dispositivo para adicionar um apelido.
              </p>

              <button className="btn-primary" onClick={() => void run()} disabled={loading}>
                {loading ? 'Verificando...' : 'Verificar dispositivos'}
              </button>

              {error && <p className="lk-local-network__error">{error}</p>}

              {result && (
                <div className="lk-local-network__result">
                  <div className="lk-local-network__summary">
                    <span>{result.devices.length} dispositivos</span>
                    <span>{result.observationCount} evidências</span>
                  </div>

                  {result.devices.length === 0 ? (
                    <p className="lk-local-network__text">
                      Nenhum dispositivo foi identificado agora. Alguns aparelhos bloqueiam resposta local ou dormem fora de uso.
                    </p>
                  ) : (
                    <IOSList
                      items={result.devices.map((device) => {
                        const nick = nicknames[deviceId(device)];
                        return {
                          icon: <Icon name="network" size={14} color="var(--accent)" />,
                          iconBg: 'var(--accent-tint)',
                          title: displayName(device),
                          subtitle: [
                            device.ip,
                            device.mac ? device.mac : undefined,
                            kindLabel(device.kind),
                          ].filter(Boolean).join(' · '),
                          trailing: (
                            <span className={`lk-local-network__confidence lk-local-network__confidence--${device.confidence}`}>
                              {confidenceLabel(device.confidence)}
                            </span>
                          ),
                          titleAfter: nick ? (
                            <span className="lk-local-network__nickname-tag">apelido</span>
                          ) : (
                            <span className="lk-local-network__source">
                              {nameSourceLabel(device.nameSource)}
                            </span>
                          ),
                          showChevron: true,
                          onClick: () => openNicknameSheet(device),
                        };
                      })}
                    />
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ── NicknameSheet ────────────────────────────────────────────── */}
      {editingDevice && (
        <div className="lk-nickname-overlay" onClick={() => setEditingDevice(null)}>
          <div className="lk-nickname-sheet fade-up" onClick={(e) => e.stopPropagation()}>
            <div className="lk-nickname-sheet__handle-row">
              <div className="lk-nickname-sheet__handle" />
            </div>
            <div className="lk-nickname-sheet__header">
              <h3>Apelido do dispositivo</h3>
              <button className="lk-nickname-sheet__close" onClick={() => setEditingDevice(null)}>
                <Icon name="close" size={18} />
              </button>
            </div>
            <div className="lk-nickname-sheet__body">
              <p className="lk-nickname-sheet__desc">
                Identifique este dispositivo com um nome mais fácil de reconhecer.
              </p>
              <div className="lk-nickname-sheet__device-info">
                <span className="lk-nickname-sheet__device-ip">{editingDevice.ip}</span>
                {editingDevice.mac && (
                  <span className="lk-nickname-sheet__device-mac">{editingDevice.mac}</span>
                )}
              </div>
              <label className="lk-nickname-sheet__field">
                <span>Apelido</span>
                <input
                  type="text"
                  value={nicknameInput}
                  onChange={(e) => setNicknameInput(e.target.value)}
                  placeholder={`Ex: TV da Sala, Notebook do João`}
                  autoFocus
                  maxLength={40}
                  onKeyDown={(e) => { if (e.key === 'Enter') saveAndClose(); }}
                />
              </label>
              <div className="lk-nickname-sheet__actions">
                {nicknames[deviceId(editingDevice)] && (
                  <button className="lk-nickname-sheet__btn-clear" onClick={clearAndClose}>
                    Remover apelido
                  </button>
                )}
                <button className="lk-nickname-sheet__btn-save" onClick={saveAndClose}>
                  Salvar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
