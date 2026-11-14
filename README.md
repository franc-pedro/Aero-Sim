# AERO-SIM

**Versão atual: 1.5.0**

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
src/js/ui/              tema, HUD, níveis, idioma, modos e Python Lab
src/js/python/          runtime Pyodide, worker, comandos, missão, erros, presets e autopiloto
src/js/python/api-reference.js  metadata da API Tello (autocomplete + referência)
src/js/python/mission.js        progresso e critérios de sucesso das missões
src/js/python/errors.js         tradução pedagógica de erros comuns
src/js/levels/python-playground.js  nível e missão de introdução
src/py/djitellopy.py    shim Python compatível com a API da djitellopy
scripts/copy-pyodide.mjs copia os assets do Pyodide para public/pyodide/
docs/python-lab.md      guia do professor e sequência de aulas
src/js/simulation/      física de voo, colisões, portais e câmara
public/favicon.svg      favicon local
```

## Dependências locais

Não há CDNs em runtime. As dependências são instaladas via npm e incluídas no build:

- **Tailwind CSS 3.4.19** — CSS compilado no build, sem o Play CDN.
- **Three.js 0.128.0** — bundle local.
- **FontAwesome Free 6.4.0** — CSS e webfonts locais.
- **CodeMirror 6** — editor Python local, com `@codemirror/lang-python`, lint, autocomplete e tema One Dark. É carregado dinamicamente na primeira abertura do Python Lab.
- **Pyodide 314.0.8** — CPython 3.14 em WebAssembly. Os assets são copiados de `node_modules/pyodide/` para `public/pyodide/` por `scripts/copy-pyodide.mjs`; `predev` e `prebuild` executam essa cópia automaticamente. `public/pyodide/` não é versionado.

O CSS é importado pelo entry `src/js/main.js` e o Vite gera os ficheiros finais em `dist/assets/`. O build de produção inclui `dist/pyodide/`.

## Laboratório Python

O modo **Python Code** abre um laboratório em split-screen: a simulação fica à esquerda e o editor/consola à direita. Em ecrãs pequenos o laboratório ocupa o ecrã inteiro.

O laboratório já inclui:

- **CodeMirror 6** com highlighting, números de linha, autocomplete, pesquisa, indentação com Tab e `Ctrl+Enter` para executar.
- **Missão guiada** no nível Python Playground: objetivo, progresso dos portais, dicas e critério de aterragem.
- **Consola** com `print`, avisos e erros; botão para limpar.
- **Referência da API Tello** bilingue: clicar num método insere o exemplo no editor.
- **Diagnóstico de erros**: a linha com erro fica marcada no editor, o traceback aparece na consola e surge uma dica pedagógica traduzida.
- **Guardar automaticamente por nível** em `localStorage`; o código é retomado ao reabrir.
- **Descarregar/abrir `.py`**.
- **Stop** com aterragem automática e recuperação de loops de CPU.
- **Layout split-screen** com redimensionamento do canvas e modo mobile.
- **Fecho do laboratório** com o botão X ou com o modo **Manual**.

O nível inicial é o **Python Playground**, com uma missão de três anéis e uma plataforma verde de aterragem. O guia pedagógico completo está em [`docs/python-lab.md`](docs/python-lab.md).

O runtime Python é o mesmo da fase anterior:

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

### API suportada

`connect`, `end`, `takeoff`, `land`, `emergency`, `move_forward/back/left/right/up/down`, `rotate_clockwise/counter_clockwise`, `set_speed`, `send_rc_control`, `get_battery`, `get_height`, `get_distance_tof`, `get_baro`, `get_temperature`, `get_attitude`, `get_yaw/pitch/roll`, `get_velocity_x/y/z`, `get_flight_time` e `time.sleep`.

Ainda não suportado: vídeo (`streamon`, `get_frame_read`), enxames, mission pads do Tello, `throw_takeoff`, curvas e a API antiga `control_step(state, dt)`. Os exemplos `playground`, `square`, `hello` e `sensors` usam a API djitellopy.

Nesta fase só está disponível a biblioteca padrão do Python; não são descarregados pacotes externos nem usados CDNs. `input()` também ainda não está implementado.

### Como executar

```bash
npm install
npm run dev
```

Abrir a aplicação, escolher **Python Code** e premir **Run Script**. Na primeira abertura, o CodeMirror e o Pyodide são carregados localmente; as execuções seguintes reutilizam o runtime e o editor. O botão **Reset Pos** repõe o drone no chão e limpa o estado do voo. O código é guardado por nível no `localStorage` e não é enviado para nenhum servidor.

O laboratório pode ser fechado com o botão **X** ou com o modo **Manual**. Em ecrãs pequenos, o laboratório ocupa o ecrã inteiro.

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

- **Python Playground** — tema Daylight, percurso compacto de 3 portais, plataforma verde de aterragem e missão guiada. É o nível inicial.
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
    landingPad: { x: 0, z: 0, radius: 2.5 },
    missionPad: { x: 0, z: 15, radius: 3, color: 0x10b981 },
    pythonMission: {
        title: { en: 'My Mission', 'pt-PT': 'A Minha Missão' },
        objective: { en: '...', 'pt-PT': '...' },
        hints: [{ en: '...', 'pt-PT': '...' }],
        landingPad: { x: 0, z: 15, radius: 3 },
    },
    decor: [{ type: 'box', x: 0, y: 25, z: 0, width: 18, height: 50, depth: 18 }],
};
```

`landingPad` e `missionPad` são apenas visuais; `pythonMission.landingPad` define o alvo de sucesso. Os `decor` são apenas visuais (sem collider); coloca-os fora dos limites jogáveis para servirem de referência. Para adicionar um nível basta criar o ficheiro em `src/js/levels/` e registá-lo em `src/js/levels/index.js`.

O contador `GATES` no header acompanha os portais atravessados. Quando todos são passados surge uma notificação de percurso completo; passar pela moldura provoca crash e o reset limpa o progresso.

## Idiomas

A interface suporta **English** e **Português (Portugal)**. O seletor no header aplica a tradução imediatamente, sem reload, e guarda a escolha em `localStorage` (`aero-sim.locale`). Na primeira visita é usado o idioma do browser quando suportado; caso contrário, English.

A implementação é local e não usa dependências externas:

- `src/js/i18n/en.js` e `src/js/i18n/pt-PT.js` — catálogos de chaves planas;
- `src/js/i18n/index.js` — `t()`, deteção, persistência, `formatNumber()` e aplicação de `data-i18n`;
- `src/js/ui/language.js` — seletor de idioma.

O HTML estático usa `data-i18n`, `data-i18n-title` e `data-i18n-aria-label`; os componentes dinâmicos são atualizados por `refreshLocalizedUI()` no `main.js`. Os números de telemetria e de impacto usam o formato da locale (`1,5` em PT-PT).

O código Python, comentários dos presets, teclas, unidades e o overlay técnico `F3` mantêm-se em inglês. A referência da API e as mensagens de interface são bilingues. Para acrescentar um novo idioma: criar o catálogo, registá-lo em `src/js/i18n/index.js` e adicionar a locale ao seletor.

## Verificação manual rápida

1. Abrir a aplicação e confirmar que o drone aparece sobre a grelha.
2. Testar `W`/`S`, `A`/`D`, setas e `I/J/K/L`.
3. Testar pitch e roll prolongados e confirmar que o mundo se move de forma contínua, sem saltos.
4. Premir `F3` e confirmar que o frame time se mantém estável em voo.
5. Embater num pilar e num anel: confirmar o shake, a vinheta, a queda/tombamento e o estado `CRASHED`.
6. Atravessar o centro de um anel sem tocar na moldura, confirmar o incremento do contador `GATES` e a notificação de percurso completo.
7. Testar `R` e o botão **Reset Pos** depois de um crash; confirmar que o drone reaparece no spawn do nível atual e que os portais foram limpos.
8. Trocar entre Python Playground, Training Course e Ring Gauntlet: confirmar spawn, limites, geometria, missão e tema inicial próprios, sem erros.
9. Alternar Daylight, Sunset e Night Ops em cada nível.
10. Trocar English ↔ Português (PT): confirmar que header, HUD, níveis, controlos, painel Python, gamepad, toasts e badges mudam sem reload.
11. Recarregar a página com PT selecionado e confirmar a persistência, `html lang="pt-PT"` e o título do documento traduzido.
12. Ligar um gamepad e confirmar o estado, os eixos e o invert de pitch.
13. Abrir **Python Code** e confirmar o layout split-screen, o CodeMirror e o estado “Python ready”.
14. Confirmar que o nível inicial é **Python Playground** e que a missão mostra `Gates 0/3`, objetivo e botão **Hints**.
15. Executar o preset **First Flight**: confirmar takeoff, subida, aterragem, consola com `Battery`/`Height` e regresso a “Python ready”.
16. Testar `Ctrl+Enter` no editor e confirmar que o script arranca.
17. Testar **Stop** com um script que usa `time.sleep`, confirmar que o drone aterra e que o runtime continua disponível.
18. Testar um erro de sintaxe: confirmar a marca no gutter/linha, o traceback na consola, a dica pedagógica e que o botão Run volta a funcionar.
19. Abrir a referência **API**, alternar EN/PT e clicar num método: confirmar que o exemplo é inserido no editor.
20. Escrever `tello.` no editor e confirmar as sugestões de autocomplete.
21. Editar o código, recarregar a página e confirmar que o draft do nível é retomado; trocar de nível e confirmar que cada nível tem o seu código.
22. Descarregar o `.py` e voltar a abri-lo com o botão de upload.
23. Executar a solução da missão no Playground: confirmar a progressão `1/3`, `2/3`, `3/3`, a aterragem na plataforma verde e o toast **Mission complete**.
24. Provocar um crash com `tello.emergency()`: confirmar o estado vermelho da missão, o badge `CRASHED` e que **Reset Pos** repõe `0/3`.
25. Premir **Reset Pos** e confirmar que o drone volta ao chão; fechar o laboratório com **X** e confirmar o spawn normal e o controlo manual.
26. Confirmar que os assets do Pyodide e do CodeMirror são servidos localmente e que não há pedidos a CDNs.

## Licenças

Ver `THIRD_PARTY_NOTICES.md`.
