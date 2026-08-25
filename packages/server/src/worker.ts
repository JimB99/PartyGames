import { routePartykitRequest } from "partyserver";
import { RoomServer } from "./room.js";

export { RoomServer };

type Env = {
  RoomServer: unknown;
  ASSETS: { fetch: typeof fetch };
};

const handler = {
  async fetch(request: Request, env: Env): Promise<Response> {
    const partyResponse = await routePartykitRequest(request, env, { cors: true });
    if (partyResponse) return partyResponse;

    if (env.ASSETS) {
      return env.ASSETS.fetch(request);
    }

    return new Response("Not Found", { status: 404 });
  },
};

export default handler;
