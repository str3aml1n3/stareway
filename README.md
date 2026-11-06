# Blink Beat

A little two-lane rhythm game for your eyes and ears. Blink your left or right eye as the matching orb reaches its ring. Use the left and right arrow keys if you prefer to play without a camera.

## Play

Run `npm start` and open <http://localhost:8000>. Press **Let's play** to start the original synthesized beat. Enable the camera separately, allow permission, and look toward it with both eyes open for a moment to calibrate. Wink one eye at a time; good lighting helps. Use headphones for the full effect.

Camera access requires localhost or HTTPS. Eye tracking runs locally in the browser; video is not recorded or uploaded. The MediaPipe library and its face-landmark model are downloaded when the camera is enabled, so that feature requires an internet connection. If camera access or loading fails, the arrow keys still work.

Run `npm test` for the game logic tests.
