# Blink Beat

A little two-lane rhythm game for your eyes and ears. Blink your left or right eye as the matching orb reaches its ring. Use the left and right arrow keys if you prefer to play without a camera.

## Play

Open `index.html` directly, or run `npm start` and open <http://localhost:8000>. Press **Let's play** to start the original synthesized beat. Enable the camera separately, allow permission, and look toward it with both eyes open for a moment to calibrate. Wink one eye at a time; good lighting helps. Use headphones for the full effect.

Camera access requires a secure context; use localhost or HTTPS if it does not work when opening the file directly. Eye tracking runs locally in the browser; video is not recorded or uploaded. The MediaPipe library and its face-landmark model are downloaded when the camera is enabled, so that feature requires an internet connection. If camera access or loading fails, the arrow keys still work.

Run `npm test` for the game logic tests.

## Publish to itch.io

Install [Butler](https://itch.io/docs/butler/installing.html) and make sure `butler` is on your PATH. Set `ITCH_IO_KEY` to your itch.io API key and `ITCH_IO_TARGET_PATH` to `username/game` or `username/game:channel`, then run `npm run publish:itch`. The channel defaults to `html5`. Configure the itch.io project as an HTML game; the script uploads only the four files needed to play. Keep the API key private.

Alternatively, add `ITCH_IO_KEY` and `ITCH_IO_TARGET_PATH` as GitHub Actions repository secrets, then run **Publish to itch.io** from the repository's Actions tab. The workflow installs Butler and publishes the selected branch using the same script.
