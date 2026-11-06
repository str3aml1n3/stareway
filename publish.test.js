import { test } from "node:test";
import { strict as assert } from "node:assert";
import { existsSync, readdirSync } from "node:fs";
import { publish } from "./publish.js";

test("publishes only game files with Butler credentials and the default channel", () => {
  let staging;
  publish({ ITCH_IO_KEY: "test-key", ITCH_IO_TARGET_PATH: "player/game" }, (command, args, options) => {
    assert.equal(command, "butler");
    assert.equal(args[0], "push");
    staging = args[1];
    assert.deepEqual(readdirSync(staging).sort(), ["app.js", "game.js", "index.html", "style.css"]);
    assert.equal(args[2], "player/game:html5");
    assert.equal(options.env.BUTLER_API_KEY, "test-key");
    return { status: 0 };
  });
  assert.equal(existsSync(staging), false);
});

test("preserves an explicit channel and cleans up when Butler fails", () => {
  let staging;
  assert.throws(() => publish({ ITCH_IO_KEY: "test-key", ITCH_IO_TARGET_PATH: "player/game:web" }, (command, args) => {
    staging = args[1];
    assert.equal(args[2], "player/game:web");
    return { status: 1 };
  }), /Butler failed/);
  assert.equal(existsSync(staging), false);
});

test("rejects missing credentials and invalid targets without running Butler", () => {
  const run = () => assert.fail("Butler should not run");
  assert.throws(() => publish({ ITCH_IO_TARGET_PATH: "player/game" }, run), /ITCH_IO_KEY/);
  assert.throws(() => publish({ ITCH_IO_KEY: "test-key", ITCH_IO_TARGET_PATH: "--bad" }, run), /ITCH_IO_TARGET_PATH/);
});
