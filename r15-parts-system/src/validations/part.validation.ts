import { z } from 'zod';

export const createPartSchema = z.object({
  partNumber: z.string().min(3, "รหัสอะไหล่ต้องมีอย่างน้อย 3 ตัวอักษร"),
  name: z.string().min(2, "ชื่ออะไหล่ต้องมีอย่างน้อย 2 ตัวอักษร"),
  category: z.enum(['ENGINE', 'BODY_FAIRING', 'ELECTRICAL', 'BRAKE_DRIVE', 'ACCESSORIES']),
  compatibleGen: z.array(z.enum(['V1', 'V2', 'V3', 'V4', 'R15M'])).min(1, "ต้องเลือกรุ่นที่รองรับอย่างน้อย 1 รุ่น"),
  costPrice: z.number().positive("ราคาทุนต้องมากกว่า 0"),
  sellingPrice: z.number().positive("ราคาขายต้องมากกว่า 0"),
  stockQuantity: z.number().int().nonnegative("จำนวนสต็อกต้องไม่ติดลบ"),
});

export const queryPartSchema = z.object({
  search: z.string().optional(),
  gen: z.enum(['V1', 'V2', 'V3', 'V4', 'R15M']).optional(),
  category: z.enum(['ENGINE', 'BODY_FAIRING', 'ELECTRICAL', 'BRAKE_DRIVE', 'ACCESSORIES']).optional(),
  lowStock: z.string().optional(),
});