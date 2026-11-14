# AERO-SIM

**Versão atual: 1.3.0**

Simulador de voo de um quadcopter, agora servido como aplicação Vite com HTML, CSS e JavaScript separados.

## Requisitos

- Node.js `^20.19.0` ou `>=22.12.0`
- npm

## Comandos

```bash
npm install
npm run dev      # servidor de desenvolvimento
npm run build    # build de produção em dist/
npm run preview  # pré-visualização do build
```

## Estrutura

```text
index.html              markup da aplicação
src/css/main.css        Tailwind + estilos base/componentes
src/css/theme.css       variáveis dos temas Daylight, Sunset e Night Ops
src/js/main.js          bootstrap, cena Three.js, renderer e eventos
src/js/config/          configuração dos temas
src/js/core/            estado, sessão, loop de passo fixo e toast
src/js/i18n/            catálogos e motor de tradução EN / PT-PT
src/js/levels/          registo, RNG e definições dos níveis
src/js/scene/           level builder e modelo do quadcopter
src/js/controls/        teclado e gamepad
src/js/ui/              tema, HUD, níveis, idioma e modos
src/js/python/          runtime Pyodide, worker, comandos, presets e autopiloto
src/py/djitellopy.py    shim Python compatível com a API da djitellopy
scripts/copy-pyodide.mjs copia os assets do Pyodide para public/pyodide/
src/js/simulation/      física de voo, colisões, portais e câmara
public/favicon.svg      favicon local
```

## Dependências locais

Não há CDNs em runtime. As dependências são instaladas via npm e incluídas no build:

- **Tailwind CSS 3.4.19** — CSS compilado no build, sem o Play CDN.
- **Three.js 0.128.0** — bundle local.
- **FontAwesome Free 6.4.0** — CSS e webfonts locais.
- **Pyodide 314.0.8** — CPython 3.14 em WebAssembly. Os assets são copiados de `node_modules/pyodide/` para `public/pyodide/` por `scripts/copy-pyodide.mjs`; `predev` e `prebuild` executam essa cópia automaticamente. `public/pyodide/` não é versionado.

O CSS é importado pelo entry `src/js/main.js` e o Vite gera os ficheiros finais em `dist/assets/`. O build de produção inclui `dist/pyodide/`.

## Python Lab (Fase 0)

O painel **Python Code** já executa Python real no browser, sem backend:

- **Pyodide 314.0.8** (CPython 3.14) corre num **Web Worker**.
- O código do aluno usa a API pública da **djitellopy** (`from djitellopy import Tello`), implementada por um shim em `src/py/djitellopy.py` que envia comandos ao simulador. A djitellopy real usa sockets UDP, que o browser não permite; o shim mantém o mesmo contrato para o código ser reutilizável num Tello real.
- O main thread continua responsável pelo Three.js e pela física a 120 Hz. O worker espera pela conclusão de cada comando através de JSPI (`run_sync`), pelo que a UI não bloqueia.
- As chamadas `time.sleep()` são suportadas e não bloqueiam o worker; o botão **Stop** interrompe scripts suspensos.
- Cada comando tem timeout e o drone aterra automaticamente se o script terminar a voar.

### Requisitos de browser

JSPI é necessário para manter a API síncrona simples:

- Chrome/Edge 137+
- Firefox 153+
- Safari 27+

Em browsers sem suporte, o painel mostra um aviso e o modo Manual continua a funcionar.

### API suportada nesta fase

`connect`, `end`, `takeoff`, `land`, `emergency`, `move_forward/back/left/right/up/down`, `rotate_clockwise/counter_clockwise`, `set_speed`, `send_rc_control`, `get_battery`, `get_height`, `get_distance_tof`, `get_baro`, `get_temperature`, `get_attitude`, `get_yaw/pitch/roll`, `get_velocity_x/y/z`, `get_flight_time` e `time.sleep`.

Ainda não suportado: vídeo (`streamon`, `get_frame_read`), enxames, mission pads, `throw_takeoff`, curvas e a API antiga `control_step(state, dt)`. Os presets `square`, `hello` e `sensors` usam a API djitellopy.

Nesta fase só está disponível a biblioteca padrão do Python; não são descarregados pacotes externos nem usados CDNs. `input()` também ainda não está implementado.

### Como executar

```bash
npm install
npm run dev
```

Abrir a aplicação, escolher **Python Code** e premir **Run Script**. Na primeira execução o Pyodide é carregado localmente; as execuções seguintes reutilizam o runtime. O botão **Reset Pos** repõe o drone no chão e limpa o estado do voo.

## Deploy

O projeto usa `base: './'` no Vite, pelo que o conteúdo de `dist/` pode ser servido a partir da raiz ou de uma subpasta. Configura o host estático para servir `dist/index.html` como entrada.

O deploy tem de incluir `dist/pyodide/` e servir `.wasm` com o MIME `application/wasm`. JSPI requer um contexto seguro (HTTPS ou `localhost`). Não são necessários headers `COOP`/`COEP` para a arquitetura atual.

## Simulação e fluidez

A física corre a 120 Hz num loop de passo fixo (`src/js/core/loop.js`) e o render interpola entre passos. A câmara usa amortecimento independente do framerate, pelo que o comportamento é consistente a 60, 120 ou 144 Hz.

Premir `F3` mostra um overlay de diagnóstico com FPS, frame time, passos de física, draw calls e memória de geometrias.

## Colisões e crash

Os pilares e a moldura dos anéis são colisores. Um embate corta os motores, aplica um pequeno ricochete e faz o drone cair e tombar sob gravidade, com bounce e atrito no chão até assentar. A câmara faz um shake curto, surge um vinheta vermelha e o HUD passa a mostrar `CRASHED / R RESET`.

O drone fica no local do acidente até ser reiniciado com `R` ou com o botão **Reset Pos**. Atravessar o centro de um anel é uma passagem válida; tocar na moldura provoca crash.

## Níveis e mundos

Os níveis vivem em `src/js/levels/` e são registados em `src/js/levels/index.js`. Cada nível define metadados, spawn, limites, chão, obstáculos, anéis e tema inicial. O seletor no header troca de mundo sem reload e o reset (`R` / **Reset Pos**) reinicia no spawn do nível atual. Os layouts usam um RNG com seed, por isso são reproduzíveis.

Níveis incluídos:

- **Training Course** — tema Daylight, 30 pilares e 5 portais sobre a grelha.
- **Ring Gauntlet** — tema Sunset, 8 portais em subida, torres e monólitos decorativos.

Schema resumido de um nível:

```js
export const myLevel = {
    id: 'my-level',
    name: 'My Level',
    difficulty: 'Beginner',
    order: 1,
    defaultTheme: 'daylight',
    spawn: { x: 0, y: 1.5, z: 0, yaw: 0 },
    bounds: { halfSize: 180, ceiling: 150 },
    ground: { size: 400, divisions: 80 },
    obstacles: [{ x, z, radius, height, kind: 'pillar' }],
    rings: [{ x, y, z, yaw: 0, radius: 4, tube: 0.4, gate: true }],
    decor: [{ type: 'box', x: 0, y: 25, z: 0, width: 18, height: 50, depth: 18 }],
};
```

Os `decor` são apenas visuais (sem collider); coloca-os fora dos limites jogáveis para servirem de referência. Para adicionar um nível basta criar o ficheiro em `src/js/levels/` e registá-lo em `src/js/levels/index.js`.

O contador `GATES` no header acompanha os portais atravessados. Quando todos são passados surge uma notificação de percurso completo; passar pela moldura provoca crash e o reset limpa o progresso.

## Idiomas

A interface suporta **English** e **Português (Portugal)**. O seletor no header aplica a tradução imediatamente, sem reload, e guarda a escolha em `localStorage` (`aero-sim.locale`). Na primeira visita é usado o idioma do browser quando suportado; caso contrário, English.

A implementação é local e não usa dependências externas:

- `src/js/i18n/en.js` e `src/js/i18n/pt-PT.js` — catálogos de chaves planas;
- `src/js/i18n/index.js` — `t()`, deteção, persistência, `formatNumber()` e aplicação de `data-i18n`;
- `src/js/ui/language.js` — seletor de idioma.

O HTML estático usa `data-i18n`, `data-i18n-title` e `data-i18n-aria-label`; os componentes dinâmicos são atualizados por `refreshLocalizedUI()` no `main.js`. Os números de telemetria e de impacto usam o formato da locale (`1,5` em PT-PT).

O código Python, comentários dos presets, teclas, unidades e o overlay técnico `F3` mantêm-se em inglês. Para acrescentar um novo idioma: criar o catálogo, registá-lo em `src/js/i18n/index.js` e adicionar a locale ao seletor.

## Verificação manual rápida

1. Abrir a aplicação e confirmar que o drone aparece sobre a grelha.
2. Testar `W`/`S`, `A`/`D`, setas e `I/J/K/L`.
3. Testar pitch e roll prolongados e confirmar que o mundo se move de forma contínua, sem saltos.
4. Premir `F3` e confirmar que o frame time se mantém estável em voo.
5. Embater num pilar e num anel: confirmar o shake, a vinheta, a queda/tombamento e o estado `CRASHED`.
6. Atravessar o centro de um anel sem tocar na moldura, confirmar o incremento do contador `GATES` e a notificação de percurso completo.
7. Testar `R` e o botão **Reset Pos** depois de um crash; confirmar que o drone reaparece no spawn do nível atual e que os portais foram limpos.
8. Trocar entre Training Course e Ring Gauntlet: confirmar spawn, limites, geometria e tema inicial próprios, sem erros.
9. Alternar Daylight, Sunset e Night Ops em cada nível.
10. Trocar English ↔ Português (PT): confirmar que header, HUD, níveis, controlos, painel Python, gamepad, toasts e badges mudam sem reload.
11. Recarregar a página com PT selecionado e confirmar a persistência, `html lang="pt-PT"` e o título do documento traduzido.
12. Ligar um gamepad e confirmar o estado, os eixos e o invert de pitch.
13. Abrir **Python Code** e confirmar o estado “Loading Python runtime…” e depois “Python ready”.
14. Executar o preset **First Flight**: confirmar takeoff, subida, aterragem, consola com `Battery`/`Height` e regresso a “Python ready”.
15. Testar **Stop** com um script que usa `time.sleep`, confirmar que o drone aterra e que o runtime continua disponível.
16. Testar um erro de sintaxe e um comando sem `takeoff`: confirmar a mensagem na consola e que o botão Run volta a funcionar.
17. Premir **Reset Pos** e confirmar que o drone volta ao chão; mudar para **Manual** e confirmar o spawn normal.
18. Confirmar que os assets do Pyodide são servidos localmente (`dist/pyodide/`) e que não há pedidos a CDNs.

## Licenças

Ver `THIRD_PARTY_NOTICES.md`.
