# AERO-SIM

**Versão atual: 1.2.0**

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
src/js/levels/          registo, RNG e definições dos níveis
src/js/scene/           level builder e modelo do quadcopter
src/js/controls/        teclado e gamepad
src/js/ui/              tema, HUD, níveis e modos de controlo
src/js/python/          presets Python e estado do autopiloto
src/js/simulation/      física de voo, colisões, portais e câmara
public/favicon.svg      favicon local
```

## Dependências locais

Não há CDNs em runtime. As dependências são instaladas via npm e incluídas no build:

- **Tailwind CSS 3.4.19** — CSS compilado no build, sem o Play CDN.
- **Three.js 0.128.0** — bundle local.
- **FontAwesome Free 6.4.0** — CSS e webfonts locais.

O CSS é importado pelo entry `src/js/main.js` e o Vite gera os ficheiros finais em `dist/assets/`.

## Estado atual do autopiloto Python

O Pyodide **não** faz parte desta fase. A interface Python mantém-se visível para preservar o layout e os presets, mas o botão **Run Script** está desativado e o runtime não é descarregado. O modo Manual funciona normalmente.

Numa fase seguinte, o Pyodide pode ser instalado como dependência local, copiado para `public/pyodide/` e carregado com `loadPyodide({ indexURL })`; nessa altura o botão de execução pode ser reativado.

## Deploy

O projeto usa `base: './'` no Vite, pelo que o conteúdo de `dist/` pode ser servido a partir da raiz ou de uma subpasta. Configura o host estático para servir `dist/index.html` como entrada.

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
10. Ligar um gamepad e confirmar o estado, os eixos e o invert de pitch.
11. Abrir **Python Code** e confirmar que o editor/presets estão disponíveis mas a execução está bloqueada nesta fase.

## Licenças

Ver `THIRD_PARTY_NOTICES.md`.
