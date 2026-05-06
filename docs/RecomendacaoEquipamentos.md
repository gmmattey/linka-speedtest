## Feature Monetização — Recomendações automáticas de equipamentos com link comissionado

### Objetivo

Criar uma feature futura de monetização baseada em recomendações automáticas de equipamentos de rede, como roteadores, kits mesh, cabos Ethernet e acessórios compatíveis com o diagnóstico do **LINKA SpeedTest**.

Esta feature **não deve ser implementada no MVP inicial**. Ela deve ficar planejada para uma fase posterior, quando o app já estiver estabilizado nas features principais:

```txt
teste rápido;
teste completo;
diagnóstico principal;
histórico;
Prova Real;
teste por local/cômodo;
relatórios;
regras confiáveis de diagnóstico.
```

A recomendação de equipamentos só deve entrar depois que o produto tiver uma base confiável de diagnóstico. O LINKA não deve virar uma vitrine genérica de produtos.

### Posicionamento da feature

A feature deve seguir este princípio:

```txt
A Linka não vende equipamento. A Linka diagnostica o problema e, quando fizer sentido, sugere soluções compatíveis.
```

A recomendação deve nascer do diagnóstico técnico do SpeedTest, e não de uma busca genérica de ofertas.

Exemplos:

```txt
Se o problema for cobertura Wi‑Fi ruim:
recomendar kit mesh ou roteador melhor posicionado.

Se o problema for latência alta no Wi‑Fi para jogos:
recomendar cabo Ethernet, conexão cabeada ou roteador com QoS.

Se o problema ocorrer também perto do roteador ou no cabo:
não recomendar compra de equipamento; sugerir Prova Real ou relatório para suporte.

Se houver muitos dispositivos conectados:
recomendar roteador/mesh com maior capacidade.

Se o plano contratado for alto e o roteador tiver limitação técnica:
recomendar roteador com portas Gigabit e Wi‑Fi 6 ou superior.
```

### Feature flag obrigatória

A feature deve possuir botão liga/desliga por configuração.

Nome sugerido:

```txt
equipment_recommendations_enabled
```

Comportamento:

```txt
Se desligada:
- não exibir recomendações de equipamentos;
- não chamar API de afiliado;
- não registrar impressões;
- não registrar cliques;
- não alterar a experiência principal do SpeedTest.

Se ligada:
- permitir geração de recomendações após o diagnóstico;
- consultar provider de afiliados;
- exibir cards de solução quando fizer sentido;
- registrar impressões e cliques;
- mostrar aviso de comissão.
```

A flag deve ser desligada por padrão até a feature estar validada.

### Modelo de monetização

A monetização será feita por links comissionados de afiliados.

Possíveis providers futuros:

```txt
Amazon Creators API;
Mercado Livre API/parceiros;
Magazine Luiza afiliados;
Kabum/parceiros;
outros programas de afiliados compatíveis.
```

A primeira implementação deve prever integração com:

```txt
Amazon Creators API
```

A arquitetura deve permitir novos providers depois, sem prender a lógica da Linka diretamente à Amazon.

### Fluxo da feature

Fluxo esperado:

```txt
1. Usuário realiza SpeedTest.
2. LINKA gera diagnóstico.
3. Motor de recomendação identifica se compra de equipamento faz sentido.
4. Diagnóstico é convertido em intenção de busca.
5. Sistema consulta provider de afiliados.
6. Ofertas são normalizadas.
7. Guardrails técnicos filtram produtos ruins ou incompatíveis.
8. Motor de ranking escolhe até 3 opções.
9. Tela exibe recomendações com explicação simples.
10. Clique no produto abre link comissionado.
```

### Regra crítica

A API de afiliados não deve decidir sozinha o que recomendar.

A API busca ofertas.

A Linka decide se a oferta faz sentido.

### Arquitetura sugerida

Criar domínio futuro:

```txt
src/domain/equipmentRecommendations
```

Arquivos sugeridos:

```txt
src/domain/equipmentRecommendations/equipmentTypes.ts
src/domain/equipmentRecommendations/recommendationIntent.ts
src/domain/equipmentRecommendations/equipmentRecommendationEngine.ts
src/domain/equipmentRecommendations/equipmentGuardrails.ts
src/domain/equipmentRecommendations/equipmentRanking.ts
src/domain/equipmentRecommendations/providers/affiliateProvider.ts
src/domain/equipmentRecommendations/providers/amazonCreatorsProvider.ts
src/domain/equipmentRecommendations/offerCache.ts
```

### Tipos sugeridos

```ts
export type EquipmentCategory =
  | 'mesh_wifi'
  | 'wifi_router'
  | 'ethernet_cable'
  | 'wifi_extender'
  | 'powerline_adapter'
  | 'none';

export type EquipmentRecommendationReason =
  | 'wifi_coverage_bad'
  | 'router_likely_bottleneck'
  | 'gaming_latency_wifi'
  | 'many_devices'
  | 'plan_above_router_capacity'
  | 'operator_likely_issue'
  | 'no_purchase_recommended';

export interface EquipmentRecommendationIntent {
  diagnosisType: string;
  category: EquipmentCategory;
  reason: EquipmentRecommendationReason;
  keywords: string[];
  mustHave?: string[];
  avoid?: string[];
  minPrice?: number;
  maxPrice?: number;
  maxResults: number;
}

export interface AffiliateOffer {
  provider: 'amazon_creators' | 'manual' | 'other';
  externalId: string;
  title: string;
  brand?: string;
  price?: number;
  currency?: string;
  availability?: string;
  imageUrl?: string;
  productUrl: string;
  affiliateUrl: string;
  rating?: number;
  reviewCount?: number;
  category: EquipmentCategory;
  fetchedAt: string;
}

export interface RankedEquipmentOffer extends AffiliateOffer {
  score: number;
  recommendationLabel: string;
  recommendationReason: string;
  avoidIf?: string;
}
```

### Provider de afiliados

Criar interface genérica:

```ts
export interface AffiliateProvider {
  searchOffers(input: EquipmentRecommendationIntent): Promise<AffiliateOffer[]>;
}
```

Implementação futura:

```ts
export class AmazonCreatorsProvider implements AffiliateProvider {
  async searchOffers(input: EquipmentRecommendationIntent): Promise<AffiliateOffer[]> {
    // Consultar Amazon Creators API
    // Normalizar resposta para AffiliateOffer[]
    // Não aplicar regra de negócio aqui
    return [];
  }
}
```

O provider deve apenas buscar e normalizar ofertas.

A decisão de recomendação deve ficar no motor da Linka.

### Guardrails técnicos obrigatórios

Antes de exibir qualquer oferta, aplicar regras mínimas.

Exemplos:

```txt
Para planos acima de 500 Mbps:
- rejeitar equipamentos sem porta Gigabit;
- preferir Wi‑Fi 6 ou superior.

Para gamer:
- evitar repetidor simples como recomendação principal;
- priorizar cabo Ethernet ou roteador com QoS;
- explicar que cabo tende a ser melhor que Wi‑Fi para latência.

Para cobertura ruim:
- preferir mesh em casas médias/grandes;
- evitar recomendar apenas troca de plano.

Para problema provável da operadora:
- não recomendar compra;
- sugerir Prova Real ou relatório de suporte.

Para instabilidade também no cabo:
- não recomendar roteador como solução principal;
- indicar investigação com operadora.
```

### Ranking de ofertas

O ranking deve considerar:

```txt
aderência ao diagnóstico;
compatibilidade técnica;
preço dentro da faixa esperada;
avaliação mínima;
quantidade de reviews;
disponibilidade;
categoria correta;
penalização por produto incompatível;
penalização por solução que não resolve o problema.
```

Exemplo de score conceitual:

```txt
score =
  aderencia_ao_diagnostico * 40
+ compatibilidade_tecnica * 25
+ custo_beneficio * 15
+ avaliacao * 10
+ disponibilidade * 10
- penalidades
```

### Cache obrigatório

Não chamar API de afiliado a cada abertura de tela.

Criar cache por intenção de busca:

```txt
equipment_offers_cache
```

Campos sugeridos:

```txt
id;
provider;
cache_key;
query_json;
response_json;
expires_at;
created_at;
updated_at.
```

TTL sugerido:

```txt
6h para resultado de recomendação;
1h para preço/disponibilidade, se suportado pelo provider.
```

### Telemetria comercial

Registrar impressões e cliques para medir viabilidade.

Tabelas ou eventos sugeridos:

```txt
recommendation_impressions
recommendation_clicks
```

Campos mínimos:

```txt
user_id opcional;
diagnosis_id;
provider;
external_product_id;
category;
shown_at;
clicked_at.
```

Se houver preocupação de privacidade, permitir registro anônimo/agregado.

### UX recomendada

As recomendações devem aparecer como complemento do diagnóstico, não como loja.

Exemplo de card:

```txt
Seu gargalo provável é cobertura Wi‑Fi.

Solução indicada:
Kit mesh Wi‑Fi 6 pode ajudar mais que trocar o plano.

Opções encontradas:
1. Melhor custo-benefício
2. Mais econômico
3. Melhor para casa maior
```

Cada card deve conter:

```txt
nome do produto;
imagem;
faixa/preço quando disponível;
por que foi recomendado;
quando não comprar;
botão “Ver oferta”;
aviso de comissão.
```

### Aviso obrigatório de comissão

Sempre exibir aviso claro:

```txt
A Linka pode receber comissão se você comprar por este link. Isso não altera o preço para você.
```

Esse aviso deve aparecer antes ou próximo dos cards de oferta.

### Quando não recomendar compra

A feature deve ter coragem de não recomendar produto.

Cenários:

```txt
problema provável da operadora;
perda de pacote também perto do roteador;
latência ruim também no cabo;
resultado instável em múltiplos locais;
teste insuficiente para diagnóstico confiável;
dados inconclusivos.
```

Mensagem sugerida:

```txt
Neste caso, comprar equipamento talvez não resolva. O ideal é repetir o teste ou gerar uma Prova Real para entender se o problema vem da operadora.
```

### Critérios de aceite

```txt
Feature pode ser ligada/desligada por flag.
Quando desligada, nenhuma chamada de afiliado ocorre.
Quando ligada, recomendações só aparecem se houver diagnóstico compatível.
Sistema não recomenda compra quando diagnóstico indicar provável problema da operadora.
Ofertas são buscadas automaticamente via provider.
Ofertas passam por guardrails antes de aparecer.
No máximo 3 recomendações são exibidas.
Cards explicam por que o produto foi recomendado.
Aviso de comissão é exibido.
Cliques são registrados.
Falha na API de afiliados não quebra o resultado do SpeedTest.
```

### Testes obrigatórios

```txt
Feature desligada não chama provider.
Feature ligada chama provider apenas quando diagnóstico permite.
Problema de operadora não gera oferta.
Cobertura ruim gera intenção de busca para mesh.
Gamer com latência alta no Wi‑Fi prioriza cabo/roteador adequado.
Produto incompatível é filtrado por guardrail.
Ranking retorna no máximo 3 ofertas.
Falha do provider retorna lista vazia sem quebrar UI.
Clique registra evento.
```

### Fase recomendada

Esta feature deve ser considerada futura.

Não implementar antes de estabilizar:

```txt
diagnóstico principal;
histórico;
Prova Real;
teste por local;
relatórios;
regras de recomendação não comerciais.
```

Fase sugerida:

```txt
Fase 10 — Monetização por recomendações automáticas de equipamentos
```

Estimativa:

```txt
Tamanho: G/GG
Estimativa: 1 a 2 semanas
IA recomendada: Claude Sonnet 4.6 para implementação
Auditoria: Claude Opus 4.7 para regras, UX e riscos comerciais
```

### Riscos

```txt
Recomendar equipamento quando o problema é da operadora.
API retornar produto ruim ou incompatível.
Usuário perder confiança se parecer propaganda.
Produto ficar indisponível.
Preço mudar rápido.
Provider limitar chamadas.
Feature quebrar experiência principal do SpeedTest.
```

### Decisão de produto

A feature só deve ser ativada quando o LINKA já tiver diagnóstico confiável.

A monetização não deve prejudicar a credibilidade do produto.

O SpeedTest básico deve continuar funcionando sem depender dessa feature.

A recomendação comercial deve ser tratada como camada adicional, opcional e desligável.

