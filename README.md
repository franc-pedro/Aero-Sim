[🇬🇧 English](README.en.md) | [🇵🇹 Português](README.md)

# AERO-SIM

Simulador de voo de um quadcopter para treino manual e para aprender programação com Python.

**Versão atual: 1.11.0**

🔗 **Aplicação online:** https://franc-pedro.github.io/Aero-Sim/

## O que inclui

- Modo Manual com teclado, gamepad e controlos de toque.
- **Arena de testes métrica**: pavilhão com grelha de 1 m no chão e nas paredes, réguas de altura e helipad marcado com coordenadas.
- **Três modos de câmara**: perseguição, orbital e FPV (tecla C).
- Auxiliares de voo: indicador de frente e linha de trajetória, à escala real do Tello.
- HUD de telemetria estilo FPV com altitude, velocidade e horizonte artificial.
- **9 missões Python** com lições, quizzes, dicas progressivas e progresso local.
- Missões de sequência, ciclos, funções, variáveis, condições, sensores, mission pads e inspeção.
- Sensores simulados: atitude, altura, bateria e `get_mission_pad_id()`/distâncias aos pads.
- Interface em **English** e **Português (PT)**.
- Temas **Claro** e **Escuro**.
- Funciona sem backend e sem CDNs. O código e o progresso dos alunos ficam apenas no browser.

## Requisitos

Para usar o Python Lab é necessário um browser moderno com **JSPI**:

- Chrome/Edge 137+
- Firefox 153+
- Safari 27+

Sem JSPI, o modo Manual continua disponível.

## Desenvolvimento local

Requer Node.js `^20.19.0` ou `>=22.12.0`.

```bash
npm install
npm run dev
npm run build
npm run check:i18n
```

O build de produção é gerado em `dist/` e inclui o Pyodide localmente.

## Documentação

O guia pedagógico e as soluções das missões estão em [`docs/python-lab.md`](docs/python-lab.md).

## Notas de Desenvolvimento

Este projeto está **em fase de desenvolvimento** (ainda não é uma versão final) e está sujeito a mudanças contínuas. O vosso feedback é não apenas bem-vindo, mas essencial. Agradecemos o vosso contributo.

Durante sua construção, ferramentas de Inteligência Artificial foram utilizadas para auxiliar na geração de código, escrita de testes e elaboração de parte da documentação, com tudo sendo devidamente revisto e validado manualmente.


## Licença

O código do AERO-SIM é distribuído sob a **licença MIT** [`LICENSE`](LICENSE).

As bibliotecas de terceiros mantêm as respetivas licenças; [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md).
