export const TELLO_API_GROUPS = [
    {
        id: 'connection',
        label: { en: 'Connection', pt: 'Ligação' },
        methods: [
            {
                name: 'connect',
                signature: 'connect()',
                description: {
                    en: 'Connect to the simulated drone and return its battery level.',
                    pt: 'Liga ao drone simulado e devolve o nível da bateria.',
                },
                example: 'tello.connect()',
            },
            {
                name: 'end',
                signature: 'end()',
                description: {
                    en: 'Finish the session. Land first if the drone is still flying.',
                    pt: 'Termina a sessão. Aterra primeiro se o drone ainda estiver a voar.',
                },
                example: 'tello.end()',
            },
        ],
    },
    {
        id: 'flight',
        label: { en: 'Flight', pt: 'Voo' },
        methods: [
            {
                name: 'takeoff',
                signature: 'takeoff()',
                description: {
                    en: 'Take off to a safe hover altitude.',
                    pt: 'Descola para uma altitude segura de voo pairado.',
                },
                example: 'tello.takeoff()',
            },
            {
                name: 'land',
                signature: 'land()',
                description: {
                    en: 'Land smoothly on the ground.',
                    pt: 'Aterra suavemente no chão.',
                },
                example: 'tello.land()',
            },
            {
                name: 'emergency',
                signature: 'emergency()',
                description: {
                    en: 'Stop the motors immediately. The drone will fall.',
                    pt: 'Para os motores imediatamente. O drone vai cair.',
                },
                example: 'tello.emergency()',
            },
        ],
    },
    {
        id: 'movement',
        label: { en: 'Movement', pt: 'Movimento' },
        methods: [
            {
                name: 'move_forward',
                signature: 'move_forward(distance_cm)',
                description: {
                    en: 'Move forward by 20–500 cm relative to the current heading.',
                    pt: 'Avança 20–500 cm em relação à direção atual.',
                },
                example: 'tello.move_forward(100)',
            },
            {
                name: 'move_back',
                signature: 'move_back(distance_cm)',
                description: {
                    en: 'Move backward by 20–500 cm.',
                    pt: 'Recua 20–500 cm.',
                },
                example: 'tello.move_back(50)',
            },
            {
                name: 'move_left',
                signature: 'move_left(distance_cm)',
                description: {
                    en: 'Move left by 20–500 cm.',
                    pt: 'Move para a esquerda 20–500 cm.',
                },
                example: 'tello.move_left(50)',
            },
            {
                name: 'move_right',
                signature: 'move_right(distance_cm)',
                description: {
                    en: 'Move right by 20–500 cm.',
                    pt: 'Move para a direita 20–500 cm.',
                },
                example: 'tello.move_right(50)',
            },
            {
                name: 'move_up',
                signature: 'move_up(distance_cm)',
                description: {
                    en: 'Climb by 20–500 cm.',
                    pt: 'Sobe 20–500 cm.',
                },
                example: 'tello.move_up(50)',
            },
            {
                name: 'move_down',
                signature: 'move_down(distance_cm)',
                description: {
                    en: 'Descend by 20–500 cm.',
                    pt: 'Desce 20–500 cm.',
                },
                example: 'tello.move_down(50)',
            },
            {
                name: 'rotate_clockwise',
                signature: 'rotate_clockwise(degrees)',
                description: {
                    en: 'Rotate clockwise by 1–360 degrees.',
                    pt: 'Roda no sentido horário 1–360 graus.',
                },
                example: 'tello.rotate_clockwise(90)',
            },
            {
                name: 'rotate_counter_clockwise',
                signature: 'rotate_counter_clockwise(degrees)',
                description: {
                    en: 'Rotate counter-clockwise by 1–360 degrees.',
                    pt: 'Roda no sentido anti-horário 1–360 graus.',
                },
                example: 'tello.rotate_counter_clockwise(90)',
            },
        ],
    },
    {
        id: 'control',
        label: { en: 'Speed and remote control', pt: 'Velocidade e controlo remoto' },
        methods: [
            {
                name: 'set_speed',
                signature: 'set_speed(speed_cm_s)',
                description: {
                    en: 'Set the cruise speed between 10 and 100 cm/s.',
                    pt: 'Define a velocidade de cruzeiro entre 10 e 100 cm/s.',
                },
                example: 'tello.set_speed(50)',
            },
            {
                name: 'get_speed',
                signature: 'get_speed()',
                description: {
                    en: 'Return the current cruise speed in cm/s.',
                    pt: 'Devolve a velocidade de cruzeiro atual em cm/s.',
                },
                example: 'print(tello.get_speed())',
            },
            {
                name: 'send_rc_control',
                signature: 'send_rc_control(left_right, forward_backward, up_down, yaw)',
                description: {
                    en: 'Send continuous stick input (-100 to 100). Call it repeatedly in a loop.',
                    pt: 'Envia controlo contínuo (-100 a 100). Chama-o repetidamente num ciclo com time.sleep.',
                },
                example: 'tello.send_rc_control(0, 50, 0, 0)\\ntime.sleep(0.1)',
            },
        ],
    },
    {
        id: 'sensors',
        label: { en: 'Sensors', pt: 'Sensores' },
        methods: [
            {
                name: 'get_battery',
                signature: 'get_battery()',
                description: {
                    en: 'Return the battery level as a percentage.',
                    pt: 'Devolve o nível da bateria em percentagem.',
                },
                example: 'print(tello.get_battery())',
            },
            {
                name: 'get_height',
                signature: 'get_height()',
                description: {
                    en: 'Return the height above the ground in centimetres.',
                    pt: 'Devolve a altura acima do chão em centímetros.',
                },
                example: 'print(tello.get_height())',
            },
            {
                name: 'get_distance_tof',
                signature: 'get_distance_tof()',
                description: {
                    en: 'Return the simulated time-of-flight distance in centimetres.',
                    pt: 'Devolve a distância simulada do sensor ToF em centímetros.',
                },
                example: 'print(tello.get_distance_tof())',
            },
            {
                name: 'get_baro',
                signature: 'get_baro()',
                description: {
                    en: 'Return the simulated barometer altitude in centimetres.',
                    pt: 'Devolve a altitude simulada do barómetro em centímetros.',
                },
                example: 'print(tello.get_baro())',
            },
            {
                name: 'get_temperature',
                signature: 'get_temperature()',
                description: {
                    en: 'Return the simulated temperature in degrees Celsius.',
                    pt: 'Devolve a temperatura simulada em graus Celsius.',
                },
                example: 'print(tello.get_temperature())',
            },
            {
                name: 'get_attitude',
                signature: 'get_attitude()',
                description: {
                    en: 'Return (pitch, roll, yaw) in degrees.',
                    pt: 'Devolve (pitch, roll, yaw) em graus.',
                },
                example: 'pitch, roll, yaw = tello.get_attitude()',
            },
            {
                name: 'get_yaw',
                signature: 'get_yaw()',
                description: {
                    en: 'Return the current yaw angle in degrees.',
                    pt: 'Devolve o ângulo de guinada atual em graus.',
                },
                example: 'print(tello.get_yaw())',
            },
            {
                name: 'get_pitch',
                signature: 'get_pitch()',
                description: {
                    en: 'Return the current pitch angle in degrees.',
                    pt: 'Devolve o ângulo de inclinação atual em graus.',
                },
                example: 'print(tello.get_pitch())',
            },
            {
                name: 'get_roll',
                signature: 'get_roll()',
                description: {
                    en: 'Return the current roll angle in degrees.',
                    pt: 'Devolve o ângulo de rolagem atual em graus.',
                },
                example: 'print(tello.get_roll())',
            },
            {
                name: 'get_velocity_x',
                signature: 'get_velocity_x()',
                description: {
                    en: 'Return forward velocity in cm/s.',
                    pt: 'Devolve a velocidade para a frente em cm/s.',
                },
                example: 'print(tello.get_velocity_x())',
            },
            {
                name: 'get_velocity_y',
                signature: 'get_velocity_y()',
                description: {
                    en: 'Return lateral velocity in cm/s.',
                    pt: 'Devolve a velocidade lateral em cm/s.',
                },
                example: 'print(tello.get_velocity_y())',
            },
            {
                name: 'get_velocity_z',
                signature: 'get_velocity_z()',
                description: {
                    en: 'Return vertical velocity in cm/s.',
                    pt: 'Devolve a velocidade vertical em cm/s.',
                },
                example: 'print(tello.get_velocity_z())',
            },
            {
                name: 'get_flight_time',
                signature: 'get_flight_time()',
                description: {
                    en: 'Return the current flight time in seconds.',
                    pt: 'Devolve o tempo de voo atual em segundos.',
                },
                example: 'print(tello.get_flight_time())',
            },
        ],
    },
    {
        id: 'python',
        label: { en: 'Python helpers', pt: 'Ajudantes Python' },
        methods: [
            {
                name: 'time.sleep',
                signature: 'time.sleep(seconds)',
                description: {
                    en: 'Pause the script without blocking the simulator. Import time first.',
                    pt: 'Pausa o script sem bloquear o simulador. Importa primeiro o time.',
                },
                example: 'import time\\ntime.sleep(1)',
            },
            {
                name: 'print',
                signature: 'print(value)',
                description: {
                    en: 'Write a value to the Python console.',
                    pt: 'Escreve um valor na consola Python.',
                },
                example: 'print("Hello")',
            },
        ],
    },
];

export const TELLO_METHODS = TELLO_API_GROUPS
    .flatMap((group) => group.methods)
    .filter((method) => !method.name.includes('.'));

export function getApiDescription(method, locale) {
    const key = locale === 'pt-PT' ? 'pt' : locale;
    return method.description?.[key] || method.description?.en || '';
}

export function getApiGroupLabel(group, locale) {
    const key = locale === 'pt-PT' ? 'pt' : locale;
    return group.label?.[key] || group.label?.en || group.id;
}
