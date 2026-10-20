import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email('รูปแบบ Email ไม่ถูกต้อง'),
  password: z.string().min(6, 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร'),
  fullName: z.string().min(2, 'กรุณากรอกชื่อ-นามสกุล'),
  role: z.enum(['ADMIN', 'MECHANIC']).optional(),
});

export const loginSchema = z.object({
  email: z.string().email('รูปแบบ Email ไม่ถูกต้อง'),
  password: z.string().min(1, 'กรุณากรอกรหัสผ่าน'),
});