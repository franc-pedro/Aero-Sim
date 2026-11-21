// Active drone visual model. Switch here to change the appearance without
// touching physics: 'classic' (original) or 'realistic'.
export const ACTIVE_DRONE_MODEL = 'realistic';

// The model meshes are authored 10x the size of a real DJI Tello (9.8 cm long).
// The world is metric (1 unit = 1 m: commands, sensors and the pavilion grid
// all agree), so the model is scaled down to true Tello proportions here.
export const DRONE_MODEL_SCALE = 0.1;
