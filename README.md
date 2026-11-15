# AERO-SIM

Simulador de voo de um quadcopter para treino manual e para aprender programação com Python.

**Versão atual: 1.8.0**

🔗 **Aplicação online:** https://franc-pedro.gitlab.io/drone-sim/

## O que inclui

- Modo Manual com teclado, gamepad e controlos de toque.
- **7 missões Python** com lições, quizzes, dicas progressivas e progresso local.
- Missões de sequência, ciclos, funções, variáveis, condições e sensores.
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

## Deploy

O deploy para o GitLab Pages é automático através de `.gitlab-ci.yml` a cada push para o branch principal.

## Documentação

O guia pedagógico e as soluções das missões estão em [`docs/python-lab.md`](docs/python-lab.md).

## Licença

O código do AERO-SIM é distribuído sob a **licença MIT**. Consulta [`LICENSE`](LICENSE).

As bibliotecas de terceiros mantêm as respetivas licenças; consulta [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md).
