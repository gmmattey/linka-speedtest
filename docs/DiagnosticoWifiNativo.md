# Diagnóstico Wi-Fi Nativo

## O que este recurso faz

O Diagnóstico Wi-Fi coleta dados locais do link Wi-Fi no app nativo para estimar a qualidade da conexão naquele ponto da casa.

Dados usados:
- SSID e BSSID (quando disponíveis)
- RSSI (dBm)
- Velocidade negociada do link (Mbps)
- Frequência (MHz), banda (2.4/5/6 GHz) e canal
- Gateway e IP local (quando disponíveis)

Saída principal:
- Classificação: `excellent`, `good`, `fair`, `weak`, `critical`, `unknown`
- Título, explicação e ação principal
- Limitações explícitas

## O que este recurso não faz

- Não mede throughput real entre aparelho e roteador.
- Não substitui o SpeedTest v2 de internet fim-a-fim.
- Não identifica sozinho causa de problemas da operadora.

## Por que não aparece no PWA

No PWA/web, o recurso retorna indisponível por design. O browser não expõe com consistência os dados de Wi-Fi necessários.

- `getCapabilities().localWifiDiagnostics` retorna `false` no PWA
- A tela isolada exibe mensagem de indisponibilidade quando aberta fora do app nativo

## Limitações por permissão e sistema

- Algumas informações dependem de permissões do sistema operacional.
- O bridge pode retornar campos parciais.
- Sem bridge nativo instalado, o módulo retorna indisponível sem quebrar a aplicação.

## Conexão futura com diagnóstico combinado

Este módulo já expõe um adaptador para o contrato esperado do combinado:

```ts
toCombinedWifiInput(result)
```

Shape retornado:

```ts
{
  available: boolean;
  rssiDbm?: number;
  linkSpeedMbps?: number;
  band?: '2.4GHz' | '5GHz' | '6GHz';
  quality?: 'excellent' | 'good' | 'fair' | 'weak' | 'critical';
}
```

Regras:
- `band: 'unknown'` vira `undefined`
- `quality: 'unknown'` vira `undefined`

## Contrato do bridge nativo

O app nativo deve prover:

```ts
window.LinkaWifiDiagnostics.getWifiInfo(): Promise<{
  available: boolean;
  ssid?: string;
  bssid?: string;
  rssiDbm?: number;
  linkSpeedMbps?: number;
  frequencyMhz?: number;
  channel?: number;
  gateway?: string;
  ipAddress?: string;
  permissionStatus?: 'granted' | 'denied' | 'unknown';
  platform?: 'android' | 'ios' | 'web' | 'unknown';
}>
```

Se o bridge não existir ou falhar, o módulo retorna indisponível com fallback seguro.

## Conexão na navegação

Conectado em:
- `App.tsx` com rota interna `screen: 'localwifi'`
- `ExploreScreen` em **Ferramentas de rede** com item **Diagnóstico Wi-Fi**

Comportamento mantido no PWA:
- abre a tela normalmente
- mostra indisponibilidade com fallback seguro quando `localWifiDiagnostics === false`
