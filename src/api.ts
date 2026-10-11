import { Hono } from "hono";
import { cors } from "hono/cors";
import { sql } from "./db.js";
import type { AttendanceStatus, DietaryPreference } from "../types/rsvp.js";

const app = new Hono();

// เปิดใช้งาน CORS เพื่อให้หน้าเว็บเรียกใช้งาน API ได้จากทุกโดเมน
app.use(
  "*",
  cors({
    origin: "*",
    allowMethods: ["GET", "POST", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
  })
);

// Route ตรวจสอบสถานะ API
app.get("/health", (c) => {
  return c.json({
    status: "ok",
    timestamp: new Date().toISOString(),
  });
});

// ฟังก์ชันหลักในการบันทึกข้อมูล RSVP
async function handleCreateRSVP(c: any) {
  try {
    const body = await c.req.json();

    const fullName = (body.full_name || body.guestName || "").trim();
    const phoneOrLine = (body.phone_or_line || body.guestPhone || "").trim() || null;
    const rawAttendance = body.attendance || "attend";
    const attendance: AttendanceStatus = rawAttendance === "cannot" ? "cannot" : "attend";
    
    // หากไม่สะดวกมาร่วมงาน ให้จำนวนผู้ร่วมงานเป็น 0 หรือตามที่ระบุ
    let guestCount = Number(body.guest_count ?? body.guestCount ?? 1);
    if (isNaN(guestCount) || guestCount < 1) {
      guestCount = attendance === "cannot" ? 0 : 1;
    }

    const validDiets: DietaryPreference[] = ["normal", "vegetarian", "vegan", "halal", "other"];
    let dietaryPreference: DietaryPreference = (body.dietary_preference || body.guestDiet || "normal") as DietaryPreference;
    if (!validDiets.includes(dietaryPreference)) {
      dietaryPreference = "normal";
    }

    const wishes = (body.wishes || body.guestNote || "").trim() || null;

    // ตรวจสอบความถูกต้องของข้อมูล (Validation)
    if (!fullName) {
      return c.json(
        {
          success: false,
          error: "กรุณาระบุชื่อ - นามสกุล ของท่าน",
        },
        400
      );
    }

    // บันทึกลงฐานข้อมูล Neon PostgreSQL
    const rows = await sql`
      INSERT INTO rsvps (
        full_name,
        phone_or_line,
        attendance,
        guest_count,
        dietary_preference,
        wishes
      )
      VALUES (
        ${fullName},
        ${phoneOrLine},
        ${attendance},
        ${guestCount},
        ${dietaryPreference},
        ${wishes}
      )
      RETURNING *;
    `;

    const savedRSVP = rows[0];

    return c.json(
      {
        success: true,
        message: "บันทึกการตอบรับเข้าร่วมงานเรียบร้อยแล้ว",
        data: savedRSVP,
      },
      201
    );
  } catch (error: any) {
    console.error("Error creating RSVP:", error);
    return c.json(
      {
        success: false,
        error: "เกิดข้อผิดพลาดในการบันทึกข้อมูล กรุณาลองใหม่อีกครั้ง",
        detail: error.message,
      },
      500
    );
  }
}

// ฟังก์ชันดึงรายการ RSVP ทั้งหมดพร้อมสถิติสรุป
async function handleListRSVPs(c: any) {
  try {
    const rsvps = await sql`
      SELECT * FROM rsvps ORDER BY created_at DESC;
    `;

    const summaryRows = await sql`
      SELECT 
        COUNT(*)::int AS total_responses,
        COUNT(*) FILTER (WHERE attendance = 'attend')::int AS total_attending,
        COUNT(*) FILTER (WHERE attendance = 'cannot')::int AS total_declined,
        COALESCE(SUM(guest_count) FILTER (WHERE attendance = 'attend'), 0)::int AS total_guests
      FROM rsvps;
    `;

    return c.json({
      success: true,
      summary: summaryRows[0] || {},
      data: rsvps,
    });
  } catch (error: any) {
    console.error("Error fetching RSVPs:", error);
    return c.json(
      {
        success: false,
        error: "ไม่สามารถดึงข้อมูลได้",
        detail: error.message,
      },
      500
    );
  }
}

// รองรับทั้ง Endpoint ที่มี /api/rsvps และ Root /
app.post("/api/rsvps", handleCreateRSVP);
app.post("/rsvps", handleCreateRSVP);
app.post("/", handleCreateRSVP);

app.get("/api/rsvps", handleListRSVPs);
app.get("/rsvps", handleListRSVPs);
import { readFileSync, existsSync } from "node:fs";

app.get("/", (c) => {
  if (c.req.header("accept")?.includes("application/json")) {
    return c.json({
      message: "Wedding RSVP API is running",
      endpoints: {
        "POST /api/rsvps": "บันทึกข้อมูลตอบรับเข้าร่วมงาน",
        "GET /api/rsvps": "ดูรายการและสถิติผู้ตอบรับ",
        "GET /health": "ตรวจสอบสถานะระบบ",
      },
    });
  }

  const filePath = existsSync("index.html") ? "index.html" : "e_wedding_invitation.html";
  if (existsSync(filePath)) {
    const htmlContent = readFileSync(filePath, "utf-8");
    return c.html(htmlContent);
  }

  return c.text("index.html not found", 404);
});

app.get("/index.html", (c) => {
  const filePath = existsSync("index.html") ? "index.html" : "e_wedding_invitation.html";
  if (existsSync(filePath)) {
    const htmlContent = readFileSync(filePath, "utf-8");
    return c.html(htmlContent);
  }
  return c.text("index.html not found", 404);
});

export default app;
