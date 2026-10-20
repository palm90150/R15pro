import { z } from 'zod';

export const createExpenseSchema = z.object({
  title: z.string().min(2, 'กรุณาระบุรายละเอียดรายจ่าย'),
  amount: z.number().positive('จำนวนเงินต้องมากกว่า 0'),
  category: z.enum(['PART_RESTOCK', 'TOOL_EQUIPMENT', 'SHOP_OPERATIONAL', 'SPECIAL_ORDER']),
  supplier: z.string().optional(),
  customerId: z.string().optional(),
});