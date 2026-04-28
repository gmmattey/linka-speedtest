import type { ConnectionType, DeviceType } from '../types';
import { ConnectionIcon, DeviceIcon, IconServer } from './icons';
import './PathRow.css';

interface Props {
  device: DeviceType;
  connection: ConnectionType;
  serverName: string;
  serverAvailable: boolean;
}

export function PathRow({ device, connection, serverName, serverAvailable }: Props) {
  const connectionLabel = connection === 'wifi' ? 'Wi-Fi' : connection === 'mobile' ? 'Celular' : 'Cabo';
  const deviceLabel = device === 'mobile' ? 'Celular' : device === 'tablet' ? 'Tablet' : 'PC';
  return (
    <div className="lk-path">
      <div className="lk-path__node lk-path__node--lit">
        <div className="lk-path__icon"><DeviceIcon kind={device} size={22} /></div>
        <div className="lk-path__label">{deviceLabel}</div>
      </div>
      <div className="lk-path__line lk-path__line--1" aria-hidden="true">
        <span className="lk-path__line-fill" />
      </div>
      <div className="lk-path__node lk-path__node--anim2">
        <div className="lk-path__icon"><ConnectionIcon kind={connection} size={22} /></div>
        <div className="lk-path__label">{connectionLabel}</div>
      </div>
      <div className="lk-path__line lk-path__line--2" aria-hidden="true">
        <span className="lk-path__line-fill" />
      </div>
      <div className={`lk-path__node lk-path__node--anim3 ${serverAvailable ? '' : 'lk-path__node--error'}`}>
        <div className="lk-path__icon"><IconServer size={22} /></div>
        <div className="lk-path__label">{serverName}</div>
      </div>
    </div>
  );
}
