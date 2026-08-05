# Polymarket Betting Recommender — Diseño (Fase 1 / MVP)

## Contexto y objetivo

Sistema que analiza los mercados activos de Polymarket y genera recomendaciones de apuesta rankeadas por un score combinado. El score pondera dos señales:

1. **Smart money signal**: coincidencia (ponderada por tamaño de posición) entre los traders top mundiales de Polymarket por profit histórico.
2. **Edge signal**: cálculo probabilístico/estadístico propio del algoritmo, basado en los datos del propio mercado.

Este es un **proyecto nuevo e independiente**, sin relación técnica con el repositorio `FINANCIAL-RATIO-ANALYZER` (este documento se guarda aquí temporalmente como artefacto de planificación; el código vivirá en su propio repo).

El peso relativo (w1/w2) entre ambas señales se define como parámetro configurable — el valor exacto se calibrará más adelante vía backtesting (ver sección Histórico y Fase 2), no se fija en este diseño.

## Alcance de "top mundiales" (investigación técnica)

Polymarket expone un endpoint oficial de leaderboard: `GET https://data-api.polymarket.com/v1/leaderboard`, con parámetros `category` (OVERALL, POLITICS, SPORTS, ESPORTS, CRYPTO, CULTURE, MENTIONS, WEATHER, ECONOMICS, TECH, FINANCE), `timePeriod` (DAY/WEEK/MONTH/ALL), `orderBy` (PNL/VOL), `limit` (1-50) y `offset` (0-1000).

**Techo técnico duro: ~1050 traders direccionables** (offset máximo 1000 + limit máximo 50 en la última página). Ir más allá exigiría reconstruir rankings vía indexación on-chain (subgraph de Polygon), lo cual es mucho más costoso y, dado que el profit deja de ser una señal diferenciadora fiable pasado el top ~1000, no aporta valor proporcional al esfuerzo.

**Decisión de diseño**: el tamaño de la cohorte de "top traders" (N) es un parámetro configurable del sistema, no hardcodeado. Valor por defecto recomendado para Fase 1: **N = 300** (buen balance entre convicción de señal y cobertura de mercados). El sistema debe soportar cualquier N hasta ~1000 sin cambios de arquitectura.

## Fuera de alcance (Fase 2, explícitamente diferido)

- Integración de datos externos al mercado (noticias, encuestas, estadísticas deportivas, on-chain más allá del propio Polymarket).
- Backtesting automatizado y calibración de w1/w2 (Fase 1 solo prepara los datos necesarios para que esto sea posible después).
- Expansión de la cohorte de traders más allá del techo del leaderboard oficial (~1000) vía indexación on-chain propia.

## Arquitectura

Tres capas:

1. **Pipeline de ingesta y scoring (Python)**: jobs programados que consultan las APIs de Polymarket, calculan las señales y persisten resultados.
2. **Base de datos (Postgres, con extensión tipo Timescale para series temporales)**: almacena snapshots de mercados, posiciones de traders y scores calculados. Se persiste histórico desde el día 1 (ver sección Histórico).
3. **API backend (FastAPI)**: expone los datos calculados al frontend (mercados rankeados, filtros, detalle por mercado).
4. **Frontend (Next.js)**: dashboard de recomendaciones. Se ejecuta en local durante el desarrollo inicial; deployable a un servidor web cuando el proyecto esté listo para lanzarse.

Justificación de Python para el pipeline: el cálculo del edge signal (estadística sobre precio/volumen/spread) se apoya en un ecosistema (pandas/numpy/scipy) mucho más maduro que el disponible en Node para este tipo de análisis. El resto del stack (API y frontend) puede mantenerse en TypeScript.

## Fuentes de datos (Polymarket APIs)

| Dato | Endpoint | Rate limit verificado | Cadencia de refresco |
|---|---|---|---|
| Metadata de mercados/eventos | Gamma API (`gamma-api.polymarket.com`) | 300-500 req/10s | Cada 15-30 min (descubrir nuevos mercados) |
| Precio, order book, liquidez, spread | CLOB API (`clob.polymarket.com`, `/price`, `/prices`, `/midpoint`) | 1500 req/10s por endpoint | **Cada 1-5 min** |
| Posiciones abiertas por wallet | Data API (`data-api.polymarket.com/positions?user=`) | 150 req/10s (~15 req/s) | **Cada 15-30 min** |
| Ranking de top traders por profit | Data API (`data-api.polymarket.com/v1/leaderboard`) | No documentado explícitamente; asumir conservador | Cada 24h |

**Cadencia diferenciada** (decisión de diseño clave): los precios de mercado cambian rápido y son baratos de refrescar → near-real-time. Las posiciones de smart money no cambian con la misma velocidad y son más caras de refrescar (una request por wallet) → cadencia más relajada. Esto resuelve el aparente conflicto entre "near-real-time" y "presupuesto ajustado": con N=300, refrescar todas las posiciones tarda ~20s dentro del rate limit gratuito; con N=1000, ~65s — ambos casos son viables sin coste de infraestructura de pago.

## Cálculo de señales

### Smart Money Signal

Para cada mercado y cada lado (Sí/No, o cada outcome en mercados multi-resultado):

```
SmartMoneySignal(mercado, lado) = Σ (capital_apostado_por_trader_i) para todo trader i en Top-N con posición en ese lado
```

Normalizado a escala 0-100 relativa al resto de mercados activos en la misma ventana de tiempo. Se pondera por capital, no solo por número de traders (un trader con $500k pesa más que 10 con $50).

### Edge Signal

Reformulación importante respecto a la idea inicial: dado que en Fase 1 no hay datos externos, **el precio de Polymarket ya es la probabilidad implícita del mercado** — el algoritmo no puede calcular una "probabilidad rival" independiente sin datos externos. Por tanto el Edge Signal se define como un **detector de mispricing/momentum**, combinando:

- Velocidad de cambio del precio (movimientos bruscos recientes).
- Anomalías de volumen (picos o caídas atípicas respecto al histórico del propio mercado).
- Amplitud del spread bid-ask (spreads anómalamente amplios = posible ineficiencia o baja confianza del mercado).
- Liquidez relativa (mercados con liquidez desproporcionadamente baja para su volumen son más propensos a mispricing).

Normalizado a escala 0-100.

### Score combinado y cobertura cero

```
Score(mercado, lado) = w1 × SmartMoneySignal + w2 × EdgeSignal
```

- `w1`, `w2` son parámetros configurables (persistidos en config, no hardcodeados). El valor inicial exacto se define en una iteración posterior tras tener histórico suficiente para backtesting.
- **Mercados sin ningún top trader posicionado (cobertura cero) quedan excluidos del listado de "recomendados"** — el pilar principal solicitado es la coincidencia de smart money, así que sin esa señal no se recomienda, independientemente del Edge Signal. El mercado sigue siendo visible en el listado general (no recomendado), no se oculta.

## Histórico y preparación para calibración futura

Aunque el módulo de backtesting/calibración automática de pesos es Fase 2, **Fase 1 debe persistir snapshots periódicos desde el día 1**: precios/probabilidad implícita, posiciones agregadas de top traders, y (cuando el mercado resuelve) el resultado final. Sin esto, nunca será posible calibrar w1/w2 con datos reales más adelante — es un requisito de retención de datos, no de cálculo.

## Frontend

- **Listado principal**: mercados ordenados por score, con filtros por categoría, rango de score y liquidez mínima.
- **Vista de detalle por mercado**: qué top traders están posicionados y con cuánto capital, gráfico de evolución de precio/probabilidad implícita en el tiempo, y desglose visual de Smart Money Signal vs. Edge Signal que compone el score final.
- Despliegue: local durante desarrollo, con ruta a producción en servidor web cuando el proyecto esté listo para lanzarse (sin proveedor de hosting decidido aún — a definir con presupuesto ajustado como restricción, ej. Railway/Render/VPS económico).

## Testing (a definir en el plan de implementación)

- Tests unitarios de las funciones de normalización y combinación de señales (SmartMoneySignal, EdgeSignal, Score) con casos sintéticos donde el resultado esperado es conocido.
- Tests de integración del pipeline de ingesta contra fixtures grabadas de las APIs de Polymarket (no contra la API real, para no depender de rate limits ni de datos que cambian).
- Test de la regla de exclusión por cobertura cero.

## Riesgos conocidos

- El endpoint `/leaderboard` no tiene rate limit documentado oficialmente — el pipeline debe manejar 429/backoff de forma defensiva.
- El Edge Signal (mispricing/momentum) es, por diseño de Fase 1, una señal más débil que un modelo con datos externos — se debe comunicar claramente en el frontend que no es una "probabilidad verdadera" sino una señal de anomalía relativa al propio mercado.
