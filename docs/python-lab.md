# Guia do Professor — Laboratório Python

Este guia acompanha o **AERO-SIM 1.10.1** e o modo **Python Code**. O objetivo é usar o simulador para ensinar programação com Python, drones e objetivos concretos, sem precisar de hardware real.

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

## Percurso de missões

| Nível | Conceito | Portais | Plataforma |
|---|---|---|---|
| Python Playground | Sequência | 3 | Verde, no fim |
| Loop Lagoon | Ciclos `for` | 4 | Regresso à origem |
| Function Forge | Funções | 8 (duas voltas) | Regresso à origem |
| Obstacle Alley | Obstáculos e direção | 3 | Verde, no fim |
| Variable Valley | Variáveis e parâmetros | 3 | Verde, no fim |
| Conditional Canyon | Condições e sensores | 3 | Verde, no fim |
| Sensor Summit | Ciclos `while` e sensores | 3 | Verde, no fim |

O nível **Training Course** e o **Ring Gauntlet** continuam disponíveis como voo livre e desafios manuais.

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

O conteúdo de `dist/` pode ser servido por um servidor estático. A versão online de referência está em:

```text
https://franc-pedro.github.io/Aero-Sim/
```

O deploy é automático no GitHub Pages a cada push para o branch principal. O Pyodide e o CodeMirror são servidos localmente; não são necessários CDNs. O primeiro carregamento é maior (Pyodide + CodeMirror); as utilizações seguintes reutilizam a cache do browser.

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

> **Tablet/telemóvel:** ao executar o script, o simulador passa para ecrã inteiro para se acompanhar o voo. A barra superior permite **Parar** ou voltar ao laboratório; no fim da execução, o editor regressa automaticamente. No modo Manual, os joysticks usam o perfil **Suave** por omissão, com resposta progressiva e limites para evitar movimentos bruscos.

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

### Lição, quiz e progresso

- O botão **Lição** abre os objetivos, a explicação, a sintaxe, as palavras-chave e uma verificação rápida.
- O botão **Progresso** mostra as missões concluídas, as dicas usadas e o resultado dos quizzes.
- Os vistos ✓ aparecem no seletor de níveis.
- O progresso fica apenas no browser e pode ser reiniciado no painel **Progresso**.
- As dicas são reveladas uma a uma; o botão **Mostrar todas** só aparece depois da primeira.

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

O botão **Dicas** revela as quatro dicas uma a uma. Uma boa sequência de intervenção:

1. Deixar o aluno tentar sem dicas.
2. Abrir a primeira dica.
3. Pedir ao aluno para dividir o percurso em etapas: subir, avançar, subir, avançar…
4. Só depois mostrar a solução completa.

## 6. Loop Lagoon — ciclos

O nível **Loop Lagoon** introduz o ciclo `for` com um quadrado de quatro lados e quatro portais.

Objetivo:

> Descolar, percorrer o quadrado de 6 m e aterrar na plataforma verde.

Solução de referência:

```python
from djitellopy import Tello

tello = Tello()
tello.connect()
tello.takeoff()
tello.move_up(300)
tello.set_speed(100)

for _ in range(4):
    tello.move_forward(300)
    tello.move_forward(300)
    tello.rotate_clockwise(90)

tello.land()
tello.end()
```

Progressão:

1. Escrever um lado do quadrado sem ciclo.
2. Identificar a repetição e introduzir `for _ in range(4):`.
3. Pedir uma função `quadrado()` que faça o ciclo.
4. Alterar a ordem de `move_forward` e `rotate_clockwise` e discutir o resultado.

Perguntas:

- Quantas vezes o ciclo corre?
- O que acontece se usarmos `range(3)`?
- Porque precisamos de rodar 90 graus?
- Porque são precisos dois `move_forward(300)` em cada lado?

## 7. Function Forge — funções

O nível **Function Forge** repete o quadrado a duas altitudes. A mesma função é chamada duas vezes.

Objetivo:

> Usar uma função reutilizável para repetir o quadrado a 4 m e a 11 m e aterrar na plataforma.

Solução de referência:

```python
from djitellopy import Tello

tello = Tello()
tello.connect()
tello.takeoff()
tello.move_up(300)
tello.set_speed(100)

def fly_square():
    for _ in range(4):
        tello.move_forward(300)
        tello.move_forward(300)
        tello.rotate_clockwise(90)

fly_square()

tello.move_up(500)
tello.move_up(200)
fly_square()

tello.land()
tello.end()
```

Progressão:

1. Fazer a primeira volta sem função.
2. Extrair o bloco repetido para `fly_square()`.
3. Chamar a função uma vez e confirmar os quatro portais.
4. Subir 700 cm e chamar a função outra vez.
5. Discutir o que aconteceria se a função estivesse escrita duas vezes.

Perguntas:

- Que vantagem há em definir a função?
- O que acontece se mudarmos o tamanho do lado dentro da função?
- A função altera a posição do drone ou apenas descreve os passos?

## 8. Obstacle Alley — obstáculos

O nível **Obstacle Alley** adiciona torres e um zig-zag de três portais. O aluno tem de ajustar a direção e aterrar na plataforma verde no final.

Objetivo:

> Seguir o zig-zag entre as torres e aterrar na plataforma verde depois do terceiro anel.

Solução de referência:

```python
from djitellopy import Tello

tello = Tello()
tello.connect()
tello.takeoff()
tello.move_up(300)
tello.set_speed(100)

tello.move_forward(500)
tello.rotate_clockwise(45)

tello.move_forward(500)
tello.move_forward(200)
tello.rotate_counter_clockwise(45)

tello.move_forward(500)
tello.move_forward(300)

tello.land()
tello.end()
```

Progressão:

1. Fazer o primeiro portal em linha reta.
2. Introduzir a rotação de 45 graus e o segundo portal.
3. Corrigir a rotação seguinte e explicar porque não se roda 90 graus.
4. Ajustar a distância até à plataforma verde.
5. Comparar uma trajetória que passa perto das torres com a trajetória central.

Perguntas:

- Porque não podemos rodar 90 graus no segundo portal?
- O que acontece se avançarmos demasiado?
- Como podemos confirmar a direção antes de avançar?

## 9. Variable Valley — variáveis

O nível **Variable Valley** introduz variáveis com um percurso reto de três portais a altitudes diferentes. Em vez de repetir números, o aluno dá-lhes nomes e reutiliza-os nos comandos.

Objetivo:

> Usar variáveis para a altitude e a distância, atravessar os três portais e aterrar na plataforma verde.

Solução de referência:

```python
from djitellopy import Tello

tello = Tello()
tello.connect()
tello.set_speed(100)
tello.takeoff()

altitude = 300
step = 100
distance = 400

tello.move_up(altitude)
tello.move_forward(distance)
tello.move_up(step)
tello.move_forward(distance)
tello.move_up(step)
tello.move_forward(distance)
tello.move_forward(distance)

tello.land()
tello.end()
```

Progressão:

1. Fazer o percurso com números escritos diretamente nos comandos.
2. Substituir os números por `altitude`, `step` e `distance`.
3. Alterar `altitude` para 350 e comparar o resultado.
4. Pedir uma variável nova, por exemplo `pad_distance = 400`, e usá-la no último avanço.
5. Como extensão, transformar a sequência numa função `fly_gate(height, distance)`.

Perguntas:

- Porque é melhor usar `distance` do que repetir `400` várias vezes?
- O que acontece se alterarmos `step` para 50?
- O nome da variável deve explicar o quê? Dá um exemplo.
- Qual é a diferença entre uma variável e uma instrução?

Resposta do quiz: a primeira opção — o drone sobe 200 cm em vez de 300 cm, porque `move_up(altitude)` lê o valor atual da variável.

## 10. Conditional Canyon — condições

O nível **Conditional Canyon** introduz o `if`. O aluno lê a altitude com `get_height()` e só sobe quando está abaixo do alvo.

Objetivo:

> Verificar a altitude antes de cada portal, subir apenas quando for necessário e aterrar na plataforma verde.

Solução de referência:

```python
from djitellopy import Tello

tello = Tello()
tello.connect()
tello.set_speed(100)
tello.takeoff()

target = 400
if tello.get_height() < target:
    tello.move_up(target - tello.get_height())
tello.move_forward(400)

target = 500
if tello.get_height() < target:
    tello.move_up(target - tello.get_height())
tello.move_forward(400)

target = 600
if tello.get_height() < target:
    tello.move_up(target - tello.get_height())
tello.move_forward(400)

tello.move_forward(400)

tello.land()
tello.end()
```

Progressão:

1. Fazer a primeira subida com um valor fixo e comparar com a leitura de `get_height()`.
2. Introduzir `if tello.get_height() < target:`.
3. Reutilizar o mesmo bloco antes dos três portais, mudando `target`.
4. Discutir o que acontece se `target` for menor do que a altitude atual.
5. Como extensão, adicionar `else: print("Altura suficiente")`.

Perguntas:

- Porque é que o bloco tem de estar indentado?
- O que acontece se usarmos `>` em vez de `<`?
- Porque é melhor calcular `target - tello.get_height()` do que usar sempre `move_up(100)`?
- Que outros sensores poderiam controlar uma decisão?

Resposta do quiz: a primeira opção — 400 é menor do que 500, por isso o drone sobe 100 cm.

## 11. Sensor Summit — while e sensores

O nível **Sensor Summit** fecha o percurso com ciclos `while` e leitura de sensores. O aluno sobe em passos pequenos até cada portal, verificando `get_height()` a cada iteração.

Objetivo:

> Sobe até cada portal usando `get_height()` num ciclo `while` e aterra na plataforma verde.

Solução de referência:

```python
from djitellopy import Tello
import time

tello = Tello()
tello.connect()
tello.set_speed(100)
tello.takeoff()

target = 400
while tello.get_height() < target:
    tello.move_up(50)
    time.sleep(0.1)
tello.move_forward(300)
tello.move_forward(300)

target = 700
while tello.get_height() < target:
    tello.move_up(50)
    time.sleep(0.1)
tello.move_forward(400)

target = 1000
while tello.get_height() < target:
    tello.move_up(50)
    time.sleep(0.1)
tello.move_forward(400)

tello.move_forward(200)

tello.land()
tello.end()
```

Progressão:

1. Subir com um número fixo de passos e comparar com a leitura de `get_height()`.
2. Introduzir `while tello.get_height() < target:`.
3. Colocar `move_up(50)` e `time.sleep(0.1)` dentro do ciclo.
4. Repetir para 400, 700 e 1000, avançando para fora do plano de cada portal antes de subir.
5. Discutir o que acontece se a condição nunca ficar falsa.
6. Como extensão, imprimir a altura em cada iteração com `print(tello.get_height())`.

Perguntas:

- Porque é que a condição é verificada antes de cada subida?
- O que acontece se `move_up(50)` ficar fora do ciclo?
- Porque precisamos de `time.sleep()`?
- Como podemos evitar um ciclo infinito?
- Que outros sensores podem controlar a missão?

Resposta do quiz: a primeira opção — se a altura já for 400 e o alvo for 400, a condição `400 < 400` é falsa e o bloco não corre.

## 12. Sensores e condições

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

## 13. Controlo contínuo

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

## 14. Erros comuns e ajuda

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

## 15. Gestão da aula

- Cada aluno pode usar o seu próprio browser; o código fica guardado nesse browser.
- Não há contas nem envio de dados.
- Para partilhar um projeto, usar **Download .py** e depois **Open .py**.
- Para limpar o código de um posto, alterar o exemplo ou limpar o `localStorage` do browser.
- O progresso e os quizzes ficam no `localStorage` do browser; o botão **Reiniciar progresso** limpa apenas o progresso, não o código.
- O botão **API** abre a referência dos métodos disponíveis.
- O autocomplete aparece ao escrever `tello.`.

Se o Python não carregar:

1. confirmar que `public/pyodide/` foi gerado com `npm run setup:pyodide`;
2. confirmar que o browser tem JSPI;
3. recarregar a página;
4. verificar a consola de desenvolvimento.

## 16. Avaliação sugerida

| Critério | Indicador |
|---|---|
| Sequência | O script executa as instruções pela ordem correta |
| Precisão | O drone passa nos anéis sem colidir |
| Variáveis | O aluno usa nomes significativos e altera um valor sem duplicar comandos |
| Condições e sensores | O aluno usa if/while e get_height() para adaptar o voo |
| Depuração | O aluno identifica e corrige um erro com ajuda do editor |
| Abstração | O aluno usa um ciclo ou função para evitar repetição |
| Verificação | O aluno explica a resposta do quiz e o efeito de alterar uma variável |
| Autonomia | O aluno consulta a API e as dicas antes de pedir solução |

## 17. Limitações atuais

- Apenas a biblioteca padrão do Python está disponível.
- Vídeo, enxames, mission pads e `control_step(state, dt)` não estão implementados.
- `input()` ainda não está disponível.
- O Python exige um browser moderno com JSPI.
- O simulador é local; não substitui a formação de segurança para voar um Tello real.
