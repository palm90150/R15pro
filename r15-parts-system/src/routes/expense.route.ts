import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { createExpenseSchema } from '../validations/expense.validation';
import { authenticateToken, AuthRequest } from '../middlewares/auth.middleware';

const router = Router();
const prisma = new PrismaClient();

// ทุก Route ในนี้ต้องผ่านการตรวจสอบ JWT Token
router.use(authenticateToken);

// 1. GET: ดึงรายการรายจ่าย + คำนวณยอดรวมสุทธิ
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const expenses = await prisma.partExpense.findMany({
      orderBy: { expenseDate: 'desc' },
      include: { customer: true },
    });

    const totalAmount = expenses.reduce((sum, item) => sum + Number(item.amount), 0);

    return res.json({ success: true, count: expenses.length, totalAmount, data: expenses });
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message });
  }
});

// 2. POST: บันทึกรายจ่ายใหม่
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const validated = createExpenseSchema.parse(req.body);

    const newExpense = await prisma.partExpense.create({
      data: validated,
    });

    return res.status(201).json({ success: true, data: newExpense });
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.errors || error.message });
  }
});

// 3. DELETE: ลบรายการรายจ่าย
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    await prisma.partExpense.delete({ where: { id } });

    return res.json({ success: true, message: 'ลบรายการรายจ่ายเรียบร้อยแล้ว' });
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message });
  }
});

export default router;