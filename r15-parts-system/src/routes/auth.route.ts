import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { registerSchema, loginSchema } from '../validations/auth.validation';

const router = Router();
const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

// 1. POST: Register (สมัครสมาชิก)
router.post('/register', async (req: Request, res: Response) => {
  try {
    const validated = registerSchema.parse(req.body);

    const existingUser = await prisma.user.findUnique({ where: { email: validated.email } });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email นี้ถูกใช้งานแล้ว' });
    }

    const hashedPassword = await bcrypt.hash(validated.password, 10);

    const newUser = await prisma.user.create({
      data: {
        email: validated.email,
        password: hashedPassword,
        fullName: validated.fullName,
        role: validated.role || 'MECHANIC',
      },
    });

    return res.status(201).json({
      success: true,
      message: 'ลงทะเบียนสำเร็จ',
      data: { id: newUser.id, email: newUser.email, fullName: newUser.fullName, role: newUser.role },
    });
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.errors || error.message });
  }
});

// 2. POST: Login (เข้าสู่ระบบ)
router.post('/login', async (req: Request, res: Response) => {
  try {
    const validated = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { email: validated.email } });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Email หรือรหัสผ่านไม่ถูกต้อง' });
    }

    const isMatch = await bcrypt.compare(validated.password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Email หรือรหัสผ่านไม่ถูกต้อง' });
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role, email: user.email },
      JWT_SECRET,
      { expiresIn: '1d' }
    );

    return res.json({
      success: true,
      token,
      user: { id: user.id, fullName: user.fullName, role: user.role },
    });
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.errors || error.message });
  }
});

export default router;