# Guia do Professor — Laboratório Python

Este guia acompanha o **AERO-SIM 1.5.0** e o modo **Python Code**. O objetivo é usar o simulador para ensinar programação com Python, drones e objetivos concretos, sem precisar de hardware real.

## 1. O que os alunos aprendem

O laboratório permite trabalhar, de forma progressiva:

- sequências de instruções;
- variáveis e valores;
- `print()` e leitura de sensores;
- ciclos `for` e `while`;
- funções;
- condições;
- depuração e leitura de erros;
- noções de orientação espacial, distância e ângulo.

A API Python é compatível com o subconjunto da **djitellopy**. O código pode ser reutilizado num Tello real, desde que o aluno passe a usar a biblioteca real e um drone físico.

## 2. Requisitos

- Node.js `^20.19.0` ou `>=22.12.0` para servir a aplicação.
- Browser moderno com **JSPI**:
  - Chrome/Edge 137+
  - Firefox 153+
  - Safari 27+

Em browsers sem JSPI, o modo Manual continua a funcionar, mas o Python não arranca.

## 3. Preparação

```bash
npm install
npm run dev
```

Para preparar uma versão para a escola:

```bash
npm run build
```

O conteúdo de `dist/` pode ser servido por um servidor estático. O Pyodide e o CodeMirror são servidos localmente; não são necessários CDNs. O primeiro carregamento é maior (Pyodide + CodeMirror); as utilizações seguintes reutilizam a cache do browser.

O código dos alunos fica no `localStorage` do browser, por nível. Não é enviado para nenhum servidor.

## 4. Primeira aula — primeiro voo

1. Abrir a aplicação.
2. Escolher **Python Code**.
3. Esperar por **Python ready**.
4. Selecionar o exemplo **First Flight**.
5. Executar com **Run Script** ou `Ctrl+Enter`.

Código base:

```python
from djitellopy import Tello

tello = Tello()
tello.connect()
print("Battery:", tello.get_battery(), "%")

tello.takeoff()
tello.move_up(50)
print("Height:", tello.get_height(), "cm")
tello.land()
tello.end()
```

Perguntas para a turma:

- O que acontece se retirarmos `tello.takeoff()`?
- O que muda se usarmos `move_up(100)`?
- Porque aparece `Height: 0` antes do takeoff?

## 5. Missão guiada — Playground Circuit

O nível **Python Playground** é o nível inicial e inclui a missão **Playground Circuit**.

Objetivo:

> Descolar, atravessar os três anéis e aterrar na plataforma verde.

Critérios de sucesso:

1. O drone descola.
2. Passa pelos três anéis.
3. Aterra na plataforma verde depois do terceiro anel.
4. Não colide com a moldura dos anéis.

O laboratório mostra o progresso (`Gates 0/3`), o estado de aterragem e as dicas. A missão fica marcada como concluída quando os três anéis forem passados e a aterragem for feita na plataforma verde.

### Solução de referência

```python
from djitellopy import Tello

tello = Tello()
tello.connect()
tello.set_speed(100)
tello.takeoff()

tello.move_up(300)
tello.move_forward(400)
tello.move_up(100)
tello.move_forward(400)
tello.move_up(100)
tello.move_forward(400)

tello.move_forward(300)

tello.land()
tello.end()
```

Notas:

- `move_up(300)` leva o drone da altura de takeoff até ao primeiro anel.
- Os dois `move_up(100)` seguintes acompanham a subida dos anéis.
- O último `move_forward(300)` leva o drone do terceiro anel até à plataforma verde.
- `set_speed(100)` acelera a demonstração; para uma primeira exploração pode ficar no valor por omissão.

### Dicas progressivas

O botão **Hints** mostra quatro dicas. Uma boa sequência de intervenção:

1. Deixar o aluno tentar sem dicas.
2. Abrir a primeira dica.
3. Pedir ao aluno para dividir o percurso em etapas: subir, avançar, subir, avançar…
4. Só depois mostrar a solução completa.

## 6. Segunda aula — ciclos e funções

Exemplo **Square**:

```python
from djitellopy import Tello

tello = Tello()
tello.connect()
tello.takeoff()

for _ in range(4):
    tello.move_forward(100)
    tello.rotate_clockwise(90)

tello.land()
tello.end()
```

Progressão:

1. Escrever o quadrado sem ciclo.
2. Substituir a repetição por `for`.
3. Pedir uma função `quadrado(tamanho)`.
4. Experimentar `tamanho=150` ou `set_speed(75)`.

Perguntas:

- Quantas vezes o ciclo corre?
- O que acontece se usarmos `range(3)`?
- Porque precisamos de rodar 90 graus?

## 7. Terceira aula — sensores e condições

Exemplo **Sensors**:

```python
from djitellopy import Tello

tello = Tello()
tello.connect()
print("Battery:", tello.get_battery(), "%")

tello.takeoff()
tello.move_forward(100)

pitch, roll, yaw = tello.get_attitude()
print("Attitude:", round(pitch, 1), round(roll, 1), round(yaw, 1))
print("Height:", tello.get_height(), "cm")
print("Time:", tello.get_flight_time(), "s")

tello.land()
tello.end()
```

Desafios:

- Subir até uma altura alvo usando um ciclo e `get_height()`.
- Aterrar se a bateria estiver abaixo de um valor.
- Imprimir a altura a cada segundo.

Exemplo de ciclo com condição:

```python
import time

while tello.get_height() < 150:
    tello.move_up(20)
    time.sleep(0.2)
```

O `time.sleep()` não bloqueia o simulador e pode ser interrompido com **Stop**.

## 8. Quarta aula — controlo contínuo

`send_rc_control(left_right, forward_backward, up_down, yaw)` envia valores entre -100 e 100. Deve ser chamado repetidamente num ciclo:

```python
import time

for _ in range(20):
    tello.send_rc_control(0, 40, 0, 0)
    time.sleep(0.1)

tello.send_rc_control(0, 0, 0, 0)
```

Atividades:

- desenhar um círculo;
- fazer um slalom;
- comparar `move_forward()` com `send_rc_control()`.

## 9. Erros comuns e ajuda

O editor marca a linha e mostra uma dica. A consola mantém o traceback completo para consulta.

| Erro | Causa provável | Ajuda |
|---|---|---|
| `SyntaxError` | parênteses, aspas, vírgulas ou `:` em falta | verificar a linha marcada |
| `IndentationError` | blocos com espaços diferentes | usar 4 espaços por nível |
| `NameError` | variável mal escrita ou não definida | confirmar o nome e a criação |
| `ModuleNotFoundError` | pacote externo não disponível | usar apenas a stdlib |
| `TelloError` | comando inválido, drone parado ou fora de alcance | verificar `takeoff()` e os limites |
| Timeout | distância grande ou comando repetido | dividir em passos menores |
| Crash | colisão com pilar ou moldura | **Reset Pos** e corrigir a rota |

O botão **Stop** interrompe o script. Se o drone estiver a voar, aterra automaticamente. O **Reset Pos** repõe a missão e o drone no início.

## 10. Gestão da aula

- Cada aluno pode usar o seu próprio browser; o código fica guardado nesse browser.
- Não há contas nem envio de dados.
- Para partilhar um projeto, usar **Download .py** e depois **Open .py**.
- Para limpar o código de um posto, alterar o exemplo ou limpar o `localStorage` do browser.
- O botão **API** abre a referência dos métodos disponíveis.
- O autocomplete aparece ao escrever `tello.`.

Se o Python não carregar:

1. confirmar que `public/pyodide/` foi gerado com `npm run setup:pyodide`;
2. confirmar que o browser tem JSPI;
3. recarregar a página;
4. verificar a consola de desenvolvimento.

## 11. Avaliação sugerida

| Critério | Indicador |
|---|---|
| Sequência | O script executa as instruções pela ordem correta |
| Precisão | O drone passa nos anéis sem colidir |
| Depuração | O aluno identifica e corrige um erro com ajuda do editor |
| Abstração | O aluno usa um ciclo ou função para evitar repetição |
| Autonomia | O aluno consulta a API e as dicas antes de pedir solução |

## 12. Limitações atuais

- Apenas a biblioteca padrão do Python está disponível.
- Vídeo, enxames, mission pads e `control_step(state, dt)` não estão implementados.
- `input()` ainda não está disponível.
- O Python exige um browser moderno com JSPI.
- O simulador é local; não substitui a formação de segurança para voar um Tello real.
