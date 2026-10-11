import { serve } from "@hono/node-server";
import app from "./api.js";

const port = Number(process.env.PORT) || 8787;

console.log(`🌿 Wedding RSVP API server is starting...`);
console.log(`📍 Listening on: http://localhost:${port}`);
console.log(`📮 POST http://localhost:${port}/api/rsvps - บันทึกข้อมูล RSVP`);
console.log(`📊 GET  http://localhost:${port}/api/rsvps - ดูรายการผู้ตอบรับ`);

serve({
  fetch: app.fetch,
  port,
});
