[🇬🇧 English](README.en.md) | [🇵🇹 Português](README.md)

# AERO-SIM

A quadcopter flight simulator for manual training and for learning Python programming.

**Current version: 1.10.1**

🔗 **Online app:** https://franc-pedro.github.io/Aero-Sim/

## What it includes

- Manual mode with keyboard, gamepad and touch controls.
- FPV-style telemetry HUD with altitude, speed and artificial horizon.
- Atmosphere with soft lighting, subtle shadows and a fluid camera.
- **7 Python missions** with lessons, quizzes, progressive hints and local progress tracking.
- Missions covering sequences, loops, functions, variables, conditionals and sensors.
- Interface in **English** and **Português (PT)**.
- **Light** and **Dark** themes.
- Works without a backend and without CDNs. Student code and progress stay only in the browser.

## Requirements

To use the Python Lab you need a modern browser with **JSPI**:

- Chrome/Edge 137+
- Firefox 153+
- Safari 27+

Without JSPI, Manual mode remains available.

## Local development

Requires Node.js `^20.19.0` or `>=22.12.0`.

```bash
npm install
npm run dev
npm run build
npm run check:i18n
```

The production build is generated in `dist/` and includes Pyodide locally.

## Documentation

The teacher's guide and the mission solutions are in [`docs/python-lab.en.md`](docs/python-lab.en.md).

## Development Notes

This project is **still in development** (not a final release yet) and is subject to continuous change. Your feedback is not only welcome but essential; thank you for contributing.

During its construction, AI tools were used to assist with code generation, test writing and part of the documentation, with everything reviewed and validated manually.


## License

AERO-SIM code is released under the **MIT license** [`LICENSE`](LICENSE).

Third-party libraries keep their respective licenses; see [`THIRD_PARTY_NOTICES.en.md`](THIRD_PARTY_NOTICES.en.md).
