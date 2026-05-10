import type { WifiContext } from '../../types';
import { IOSList } from '../../components/IOSList';
import { Icon } from '../../components/icons';
import { formatWifiStandard, rssiLabel } from './wifiShortcut';
import './WifiContextCard.css';

interface Props {
  ctx: WifiContext;
}

export function WifiContextCard({ ctx }: Props) {
  if (!ctx.available) {
    return (
      <section className="lk-wifi-ctx" aria-label="Contexto Wi-Fi">
        <p className="lk-wifi-ctx__kicker">Contexto Wi-Fi</p>
        <p className="lk-wifi-ctx__unavailable">
          Nenhum dado Wi-Fi disponível para este teste.
        </p>
      </section>
    );
  }

  const signalText = rssiLabel(ctx.rssiDbm);
  const standardText = formatWifiStandard(ctx.wifiStandard);

  const items = [
    ctx.ssid && {
      icon: <Icon name="wifi" size={14} color="#fff" />,
      iconBg: 'var(--info)',
      title: ctx.ssid,
      subtitle: 'Rede Wi-Fi',
    },
    {
      icon: <Icon name="wifi" size={14} color="#fff" />,
      iconBg: 'var(--surface-3)',
      title: 'Sinal',
      trailing: signalText,
    },
    ctx.channel != null && {
      icon: <Icon name="router" size={14} color="#fff" />,
      iconBg: 'var(--surface-3)',
      title: 'Canal',
      trailing: String(ctx.channel),
    },
    standardText && {
      icon: <Icon name="router" size={14} color="#fff" />,
      iconBg: 'var(--surface-3)',
      title: 'Padrão',
      trailing: standardText,
    },
    (ctx.txRateMbps != null || ctx.rxRateMbps != null) && {
      icon: <Icon name="router" size={14} color="#fff" />,
      iconBg: 'var(--surface-3)',
      title: 'Taxa negociada',
      subtitle: 'Link entre aparelho e roteador',
      trailing: [
        ctx.txRateMbps != null ? `↑ ${ctx.txRateMbps} Mbps` : null,
        ctx.rxRateMbps != null ? `↓ ${ctx.rxRateMbps} Mbps` : null,
      ].filter(Boolean).join('  '),
    },
  ].filter(Boolean) as Parameters<typeof IOSList>[0]['items'];

  return (
    <section className="lk-wifi-ctx" aria-label="Contexto Wi-Fi">
      <p className="lk-wifi-ctx__kicker">Contexto Wi-Fi</p>
      <IOSList items={items} />
      <p className="lk-wifi-ctx__footnote">
        A taxa negociada indica a qualidade do link entre o aparelho e o roteador —
        não é a velocidade real da internet.
      </p>
    </section>
  );
}
