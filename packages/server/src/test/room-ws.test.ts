import assert from "node:assert/strict";
import { describe, it, before } from "node:test";
import { DEFAULT_GAME_OPTIONS, MAX_PLAYERS, type ServerMessage } from "@party-games/shared";
import {
  closeSocket,
  connectAndJoin,
  isWorkerUp,
  openSocket,
  send,
  waitForMessage,
} from "./room-ws-helpers.js";

describe("room WebSocket integration", () => {
  let workerUp = false;

  before(async () => {
    workerUp = await isWorkerUp();
    if (!workerUp) {
      console.log("Skipping room WebSocket tests — start wrangler with: npx wrangler dev --port 8787");
    }
  });

  it("check_room returns room_available when host is present", { skip: () => !workerUp }, async () => {
    const roomId = "WS01";
    const host = await connectAndJoin(roomId, "host");
    const probe = openSocket(roomId);
    await new Promise<void>((resolve, reject) => {
      const t = setTimeout(() => reject(new Error("probe timeout")), 5000);
      probe.onopen = () => {
        probe.send(JSON.stringify({ type: "check_room" }));
      };
      probe.onmessage = (e) => {
        const msg = JSON.parse(String(e.data)) as ServerMessage;
        if (msg.type === "room_available") {
          clearTimeout(t);
          resolve();
        }
      };
    });
    probe.close();
    await closeSocket(host);
  });

  it("host can start quick-quiz with 2 players", { skip: () => !workerUp }, async () => {
    const roomId = "WS02";
    const host = await connectAndJoin(roomId, "host");
    const p1 = await connectAndJoin(roomId, "player", "Alice");
    const p2 = await connectAndJoin(roomId, "player", "Bob");

    send(host, { type: "select_game", gameId: "quick-quiz" });
    send(host, {
      type: "set_game_options",
      gameId: "quick-quiz",
      options: DEFAULT_GAME_OPTIONS,
    });
    send(host, { type: "start_game" });

    const stateMsg = await waitForMessage(
      host,
      (m) => m.type === "room_state" && m.state.phase === "playing",
    );
    assert.equal(stateMsg.state.activeGameId, "quick-quiz");

    send(host, { type: "host_action", action: { kind: "advance" } });

    await closeSocket(host);
    await closeSocket(p1);
    await closeSocket(p2);
  });

  it("start_game blocked below minPlayers", { skip: () => !workerUp }, async () => {
    const roomId = "WS03";
    const host = await connectAndJoin(roomId, "host");
    const p1 = await connectAndJoin(roomId, "player", "Only");

    send(host, { type: "select_game", gameId: "impostor" });
    send(host, { type: "start_game" });

    const err = await waitForMessage(host, (m) => m.type === "error");
    assert.match(err.message, /Need at least 4 players/);

    await closeSocket(host);
    await closeSocket(p1);
  });

  it("rejects join when room is at MAX_PLAYERS", { skip: () => !workerUp }, async () => {
    const roomId = "WS04";
    const host = await connectAndJoin(roomId, "host");
    const players = [];
    for (let i = 0; i < MAX_PLAYERS; i++) {
      players.push(await connectAndJoin(roomId, "player", `P${i}`));
    }

    const extra = openSocket(roomId);
    await new Promise<void>((resolve, reject) => {
      const t = setTimeout(() => reject(new Error("extra join timeout")), 5000);
      extra.onopen = () => {
        extra.send(JSON.stringify({ type: "join", role: "player", nickname: "Overflow" }));
      };
      extra.onmessage = (e) => {
        const msg = JSON.parse(String(e.data)) as ServerMessage;
        if (msg.type === "error" && msg.message.includes("full")) {
          clearTimeout(t);
          resolve();
        }
      };
    });
    extra.close();

    await closeSocket(host);
    for (const p of players) await closeSocket(p);
  });
});
