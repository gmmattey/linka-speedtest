import type { ConnectionProfile, ConnectionType } from '../types';

/**
 * Mapeia o `ConnectionType` capturado pelo app (wifi/cable/mobile) para o
 * perfil regulatório `ConnectionProfile` (fixed_broadband / mobile_broadband).
 *
 * Convenção atual:
 * - 'mobile'        -> 'mobile_broadband'
 * - 'wifi' | 'cable' -> 'fixed_broadband'
 *
 * Para chamadas onde `type` for indefinido (ex.: caso "Não identificada" do
 * iOS Safari, sem `navigator.connection`), o default é `fixed_broadband`.
 * Essa é a decisão atual; pode ser revisada quando o motor unificado existir.
 */
export function toConnectionProfile(type: ConnectionType | undefined): ConnectionProfile {
  return type === 'mobile' ? 'mobile_broadband' : 'fixed_broadband';
}
