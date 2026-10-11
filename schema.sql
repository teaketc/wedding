-- ==========================================
-- Wedding RSVP Database Schema (PostgreSQL)
-- ==========================================

-- ตาราง rsvps สำหรับเก็บข้อมูลการตอบรับเข้าร่วมงานแต่งงาน
CREATE TABLE IF NOT EXISTS rsvps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- 1. ชื่อ - นามสกุล ของท่าน * (Required)
    full_name VARCHAR(255) NOT NULL,
    
    -- 2. เบอร์โทรศัพท์ หรือ LINE ID (Optional)
    phone_or_line VARCHAR(100),
    
    -- 3. ความพร้อมในการร่วมงาน * ('attend' = ยินดีมาร่วมงาน, 'cannot' = ไม่สะดวกมาร่วมงาน)
    attendance VARCHAR(20) NOT NULL DEFAULT 'attend' 
        CHECK (attendance IN ('attend', 'cannot')),
    
    -- 4. จำนวนผู้ร่วมงาน (ท่าน) (1, 2, 3, 4, 5+)
    guest_count INTEGER NOT NULL DEFAULT 1 
        CHECK (guest_count >= 1),
    
    -- 5. อาหารที่รับประทาน ('normal', 'vegetarian', 'vegan', 'halal', 'other')
    dietary_preference VARCHAR(50) NOT NULL DEFAULT 'normal' 
        CHECK (dietary_preference IN ('normal', 'vegetarian', 'vegan', 'halal', 'other')),
    
    -- 6. ข้อความถึงคู่บ่าวสาว
    wishes TEXT,
    
    -- วันเวลาที่บันทึกข้อมูลและอัปเดต
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ดัชนี (Indexes) เพื่อเพิ่มความเร็วในการสืบค้นข้อมูล
CREATE INDEX IF NOT EXISTS idx_rsvps_created_at ON rsvps (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_rsvps_attendance ON rsvps (attendance);
CREATE INDEX IF NOT EXISTS idx_rsvps_full_name ON rsvps (full_name);

-- ฟังก์ชันและ Trigger สำหรับอัปเดต updated_at อัตโนมัติเมื่อมีการแก้ไขข้อมูล
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_rsvps_updated_at ON rsvps;
CREATE TRIGGER set_rsvps_updated_at
BEFORE UPDATE ON rsvps
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
