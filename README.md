# AERO-SIM

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
src/js/main.js          bootstrap, cena Three.js, renderer, loop e eventos
src/js/config/          configuração dos temas
src/js/core/            estado da simulação e toast
src/js/scene/           ambiente e modelo do quadcopter
src/js/controls/        teclado e gamepad
src/js/ui/              tema, HUD e modos de controlo
src/js/python/          presets Python e estado do autopiloto
src/js/simulation/      física de voo e câmara
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

## Verificação manual rápida

1. Abrir a aplicação e confirmar que o drone aparece sobre a grelha.
2. Testar `W`/`S`, `A`/`D`, setas e `I/J/K/L`.
3. Testar `R` e o botão **Reset Pos**.
4. Alternar Daylight, Sunset e Night Ops.
5. Ligar um gamepad e confirmar o estado, os eixos e o invert de pitch.
6. Abrir **Python Code** e confirmar que o editor/presets estão disponíveis mas a execução está bloqueada nesta fase.

## Licenças

Ver `THIRD_PARTY_NOTICES.md`.
