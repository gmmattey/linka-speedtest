import { useState } from 'react';
import { TopBar } from '../components/TopBar';
import { PageHeader } from '../components/PageHeader';
import { useScrollHeader } from '../hooks/useScrollHeader';
import './FibraScreen.css';

const MODEM_IP_KEY = 'linka.fibra.modemIp';

function loadModemIp(): string {
  return localStorage.getItem(MODEM_IP_KEY) || '192.168.1.1';
}

function saveModemIp(ip: string) {
  localStorage.setItem(MODEM_IP_KEY, ip);
}

interface NetworkConnection {
  type?: string;
  effectiveType?: string;
  downlink?: number;
}

function getConn(): NetworkConnection | null {
  const nav = navigator as Navigator & { connection?: NetworkConnection };
  return nav.connection ?? null;
}

function connTypeLabel(type: string | undefined): string {
  switch (type) {
    case 'wifi':     return 'Wi-Fi';
    case 'cellular': return 'Dados móveis';
    case 'ethernet': return 'Cabo (Ethernet)';
    case 'none':     return 'Sem conexão';
    default:         return 'Desconhecido';
  }
}

interface Props {
  onBack: () => void;
}

export function FibraScreen({ onBack }: Props) {
  const { scrolled, topBarOpacity, scrollContainerRef, sentinelRef } = useScrollHeader();
  const [modemIp, setModemIp] = useState(loadModemIp);
  const conn = getConn();

  const handleIpChange = (val: string) => {
    setModemIp(val);
    saveModemIp(val);
  };

  const panelUrl = modemIp.startsWith('http') ? modemIp : `http://${modemIp}`;

  return (
    <div className="lk-fibra">
      <TopBar onBack={onBack} scrolled={scrolled} opacity={topBarOpacity} title="Fibra / Modem" showTitle={true} />

      <div className="lk-fibra__scroll" ref={scrollContainerRef}>
        <PageHeader ref={sentinelRef} size="md" title="Fibra / Modem" />

        {/* ── Browser limitation hero ──────────────────────────────── */}
        <div className="lk-fibra__browser-notice">
          <span className="material-symbols-rounded lk-fibra__notice-icon">router</span>
          <div className="lk-fibra__notice-text">
            <p className="lk-fibra__notice-title">Acesso ao modem limitado no navegador</p>
            <p className="lk-fibra__notice-desc">
              O navegador bloqueia conexões diretas ao modem por segurança (CORS / mixed content).
              Você pode acessar o painel web do modem manualmente.
            </p>
          </div>
        </div>

        {/* ── Acesso ao modem ──────────────────────────────────────── */}
        <div className="lk-fibra__section">
          <p className="lk-fibra__section-label">Acesso ao modem</p>
          <div className="lk-fibra__card">
            <label className="lk-fibra__ip-label">
              <span>Endereço do modem</span>
              <input
                className="lk-fibra__ip-input"
                type="text"
                value={modemIp}
                onChange={(e) => handleIpChange(e.target.value)}
                placeholder="192.168.1.1"
                inputMode="url"
                autoCapitalize="none"
                spellCheck={false}
              />
            </label>
            <a
              className="lk-fibra__panel-btn"
              href={panelUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              <span className="material-symbols-rounded">open_in_new</span>
              Abrir painel do modem
            </a>
            <p className="lk-fibra__hint">
              O endereço padrão é 192.168.1.1 ou 192.168.0.1. Verifique a etiqueta no modem se diferente.
            </p>
          </div>
        </div>

        {/* ── Sinal da Fibra ───────────────────────────────────────── */}
        <div className="lk-fibra__section">
          <p className="lk-fibra__section-label">Sinal da Fibra</p>
          <div className="lk-fibra__card lk-fibra__card--fallback">
            <div className="lk-fibra__metric-grid">
              <FibraMetric label="Sinal RX" value="—" unit="dBm" locked />
              <FibraMetric label="Sinal TX" value="—" unit="dBm" locked />
              <FibraMetric label="Temperatura" value="—" unit="°C" locked />
              <FibraMetric label="Serial ONU" value="—" locked />
            </div>
            <AndroidCta>
              Potência óptica, temperatura do laser e serial ONU disponíveis no <strong>app linka para Android</strong>.
            </AndroidCta>
          </div>
        </div>

        {/* ── Sua Conexão ──────────────────────────────────────────── */}
        <div className="lk-fibra__section">
          <p className="lk-fibra__section-label">Sua Conexão</p>
          <div className="lk-fibra__card">
            <dl className="lk-fibra__info-list">
              {conn?.type && (
                <FibraRow label="Tipo de conexão" value={connTypeLabel(conn.type)} />
              )}
              {conn?.effectiveType && (
                <FibraRow label="Qualidade estimada" value={conn.effectiveType.toUpperCase()} />
              )}
              {conn?.downlink != null && (
                <FibraRow label="Velocidade estimada" value={`${conn.downlink} Mbps`} />
              )}
              <FibraRow label="IP de internet" value="—" locked />
              <FibraRow label="Uptime da conexão" value="—" locked />
              <FibraRow label="VLAN / PPPoE" value="—" locked />
            </dl>
            <AndroidCta>
              IP público, uptime, VLAN, concentrador PPPoE e DNS disponíveis no <strong>app linka para Android</strong>.
            </AndroidCta>
          </div>
        </div>

        {/* ── Saúde do Modem ───────────────────────────────────────── */}
        <div className="lk-fibra__section">
          <p className="lk-fibra__section-label">Saúde do Modem</p>
          <div className="lk-fibra__card lk-fibra__card--fallback">
            <div className="lk-fibra__metric-grid">
              <FibraMetric label="Temperatura" value="—" unit="°C" locked />
              <FibraMetric label="Alimentação" value="—" unit="V" locked />
              <FibraMetric label="Ligado há" value="—" locked />
              <FibraMetric label="Firmware" value="—" locked />
            </div>
            <dl className="lk-fibra__info-list" style={{ marginTop: 12 }}>
              <FibraRow label="Modelo" value="—" locked />
              <FibraRow label="Fabricante" value="—" locked />
              <FibraRow label="Número de série" value="—" locked />
            </dl>
            <AndroidCta>
              Temperatura, alimentação, firmware e dados de hardware do modem disponíveis no <strong>app linka para Android</strong>.
            </AndroidCta>
          </div>
        </div>

        {/* ── GPON info ────────────────────────────────────────────── */}
        <div className="lk-fibra__gpon-info">
          <p className="lk-fibra__gpon-title">O que o linka analisa na fibra</p>
          <p className="lk-fibra__gpon-desc">
            Em conexões de fibra óptica (GPON/XGS-PON), o app Android acessa o modem diretamente via rede local para ler a potência óptica recebida (RX). Um RX abaixo de −27 dBm indica degradação do sinal e pode causar instabilidade mesmo com velocidade contratada normal.
          </p>
        </div>

        <div className="lk-fibra__bottom-pad" />
      </div>
    </div>
  );
}

/* ── Sub-components ──────────────────────────────────────────────────────── */

function FibraMetric({ label, value, unit, locked }: {
  label: string;
  value: string;
  unit?: string;
  locked?: boolean;
}) {
  return (
    <div className={`lk-fibra__metric${locked ? ' lk-fibra__metric--locked' : ''}`}>
      <span className="lk-fibra__metric-value">
        {value}
        {unit && <span className="lk-fibra__metric-unit">{unit}</span>}
      </span>
      <span className="lk-fibra__metric-label">{label}</span>
    </div>
  );
}

function FibraRow({ label, value, locked }: { label: string; value: string; locked?: boolean }) {
  return (
    <div className={`lk-fibra__info-row${locked ? ' lk-fibra__info-row--locked' : ''}`}>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function AndroidCta({ children }: { children: React.ReactNode }) {
  return (
    <div className="lk-fibra__android-cta">
      <span className="material-symbols-rounded">android</span>
      <p>{children}</p>
    </div>
  );
}
