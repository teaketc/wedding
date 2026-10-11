export type AttendanceStatus = 'attend' | 'cannot';

export type DietaryPreference = 
  | 'normal'        // รับประทานได้ทั่วไป
  | 'vegetarian'    // มังสวิรัติ (Vegetarian)
  | 'vegan'         // วีแกน / เจ (Vegan)
  | 'halal'         // อิสลาม / ฮาลาล (Halal)
  | 'other';

export interface WeddingRSVP {
  id: string;                         // UUID
  full_name: string;                  // ชื่อ - นามสกุล ของท่าน
  phone_or_line?: string | null;      // เบอร์โทรศัพท์ หรือ LINE ID
  attendance: AttendanceStatus;       // ความพร้อมในการร่วมงาน
  guest_count: number;                // จำนวนผู้ร่วมงาน (ท่าน)
  dietary_preference: DietaryPreference; // อาหารที่รับประทาน
  wishes?: string | null;             // ข้อความถึงคู่บ่าวสาว
  created_at: string;                 // ISO Date string
  updated_at: string;                 // ISO Date string
}

export type CreateRSVPInput = Omit<WeddingRSVP, 'id' | 'created_at' | 'updated_at'>;
