import { stopSocketServer } from "../../../lib/socket.js";

export async function GET() {
  try {
    await stopSocketServer();
    return new Response(
      JSON.stringify({ ok: true, message: "Socket server stopped" }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("[API /stop-editor Error]", err);
    return new Response(
      JSON.stringify({ ok: false, message: "Failed to stop socket server" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
