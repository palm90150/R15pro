import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
// 🟢 หมายเหตุ: ตรวจสอบชื่อ export ใน auth.middleware.ts อีกครั้งหากชื่อไม่ตรง
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { z } from 'zod';

const router = Router();
const prisma = new PrismaClient();

// Validation Schema สำหรับสร้าง/แก้ไขอะไหล่
const partSchema = z.object({
  partNumber: z.string().min(1, 'กรุณากรอกรหัสอะไหล่'),
  name: z.string().min(1, 'กรุณากรอกชื่ออะไหล่'),
  category: z.string().min(1, 'กรุณาเลือกหมวดหมู่'),
  compatibleGen: z.union([z.array(z.string()), z.string()]),
  costPrice: z.number().min(0, 'ราคาทุนต้องไม่ติดลบ'),
  sellingPrice: z.number().min(0, 'ราคาขายต้องไม่ติดลบ'),
  stockQuantity: z.number().int().min(0, 'จำนวนสต็อกต้องไม่ติดลบ'),
  minStockAlert: z.number().int().min(0, 'จำนวนเตือนต้องไม่ติดลบ'),
});

// ==========================================
// 📊 1. API รายงานสรุปรายได้และกำไรคลังสินค้า
// ==========================================
router.get('/reports/monthly', authenticate, async (req: Request, res: Response) => {
  try {
    const parts = await prisma.part.findMany();

    let totalCost = 0;
    let totalRevenuePotential = 0;

    const categoryStats: Record<
      string,
      { count: number; totalCost: number; totalRevenue: number; profit: number }
    > = {};

    parts.forEach((part) => {
      const costPriceNum = Number(part.costPrice) || 0;
      const sellingPriceNum = Number(part.sellingPrice) || 0;
      const stockQty = Number(part.stockQuantity) || 0;

      const cost = costPriceNum * stockQty;
      const revenue = sellingPriceNum * stockQty;

      totalCost += cost;
      totalRevenuePotential += revenue;

      if (!categoryStats[part.category]) {
        categoryStats[part.category] = {
          count: 0,
          totalCost: 0,
          totalRevenue: 0,
          profit: 0,
        };
      }

      categoryStats[part.category].count += stockQty;
      categoryStats[part.category].totalCost += cost;
      categoryStats[part.category].totalRevenue += revenue;
      categoryStats[part.category].profit += revenue - cost;
    });

    const totalProfit = totalRevenuePotential - totalCost;
    const profitMargin =
      totalRevenuePotential > 0
        ? ((totalProfit / totalRevenuePotential) * 100).toFixed(2)
        : 0;

    res.json({
      success: true,
      data: {
        summary: {
          totalCost,
          totalRevenuePotential,
          totalProfit,
          profitMargin: Number(profitMargin),
        },
        categoryStats: Object.keys(categoryStats).map((cat) => ({
          category: cat,
          ...categoryStats[cat],
        })),
      },
    });
  } catch (error) {
    console.error('Report Error:', error);
    res.status(500).json({ success: false, message: 'ไม่สามารถดึงข้อมูลรายงานได้' });
  }
});

// ==========================================
// 🔍 2. ดึงรายการอะไหล่ทั้งหมด (Search & Filter)
// ==========================================
router.get('/', async (req: Request, res: Response) => {
  try {
    const { search, gen, category } = req.query;

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: String(search) } },
        { partNumber: { contains: String(search) } },
      ];
    }

    if (category) {
      where.category = String(category);
    }

    if (gen) {
      where.compatibleGen = { contains: String(gen) };
    }

    const parts = await prisma.part.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, data: parts });
  } catch (error) {
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการดึงข้อมูล' });
  }
});

// ==========================================
// ➕ 3. เพิ่มอะไหล่ใหม่ (สิทธิ์ ADMIN เท่านั้น)
// ==========================================
router.post('/', authenticate, authorize(['ADMIN']), async (req: Request, res: Response) => {
  try {
    const validatedData = partSchema.parse(req.body);

    const compatibleGenString: string = Array.isArray(validatedData.compatibleGen)
      ? validatedData.compatibleGen.join(',')
      : String(validatedData.compatibleGen);

    const part = await prisma.part.create({
      data: {
        partNumber: validatedData.partNumber,
        name: validatedData.name,
        category: validatedData.category,
        compatibleGen: compatibleGenString,
        costPrice: validatedData.costPrice,
        sellingPrice: validatedData.sellingPrice,
        stockQuantity: validatedData.stockQuantity,
        minStockAlert: validatedData.minStockAlert,
      },
    });

    res.status(201).json({ success: true, data: part });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, message: error.issues });
    } else {
      res.status(500).json({ success: false, message: error.message || 'บันทึกไม่สำเร็จ' });
    }
  }
});

// ==========================================
// ✏️ 4. แก้ไขข้อมูลอะไหล่ (สิทธิ์ ADMIN เท่านั้น)
// ==========================================
router.put('/:id', authenticate, authorize(['ADMIN']), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const validatedData = partSchema.parse(req.body);

    const compatibleGenString: string = Array.isArray(validatedData.compatibleGen)
      ? validatedData.compatibleGen.join(',')
      : String(validatedData.compatibleGen);

    const updatedPart = await prisma.part.update({
      where: { id: String(id) },
      data: {
        partNumber: validatedData.partNumber,
        name: validatedData.name,
        category: validatedData.category,
        compatibleGen: compatibleGenString,
        costPrice: validatedData.costPrice,
        sellingPrice: validatedData.sellingPrice,
        stockQuantity: validatedData.stockQuantity,
        minStockAlert: validatedData.minStockAlert,
      },
    });

    res.json({ success: true, data: updatedPart });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, message: error.issues });
    } else {
      res.status(500).json({ success: false, message: 'แก้ไขข้อมูลไม่สำเร็จ' });
    }
  }
});

// ==========================================
// 🗑️ 5. ลบอะไหล่ (สิทธิ์ ADMIN เท่านั้น)
// ==========================================
router.delete('/:id', authenticate, authorize(['ADMIN']), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.part.delete({ where: { id: String(id) } });
    res.json({ success: true, message: 'ลบข้อมูลสำเร็จ' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'ลบข้อมูลไม่สำเร็จ' });
  }
});

export default router;