import { startSocketServer } from "../../../lib/socket.js";

export async function GET() {
  try {
    const port = process.env.SOCKET_PORT || 4000;
    await startSocketServer(port);
    return new Response(
      JSON.stringify({ ok: true, message: `Socket started on port ${port}` }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("[API /start-editor Error]", err);
    return new Response(
      JSON.stringify({ ok: false, message: "Failed to start socket server" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
