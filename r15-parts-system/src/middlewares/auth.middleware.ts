import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

export interface AuthRequest extends Request {
  user?: { userId: string; role: string; email: string };
}

// 🟢 โค้ดเดิมของคุณ
export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer <TOKEN>

  if (!token) {
    return res.status(401).json({ success: false, message: 'ไม่พบ Token การเข้าถึง กรุณาเข้าสู่ระบบ' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ success: false, message: 'Token ไม่ถูกต้องหรือหมดอายุ' });
  }
};

// 🟢 เพิ่มชื่อ alias 'authenticate' เพื่อให้เรียกใช้อง่ายขึ้น
export const authenticate = authenticateToken;

// 🟢 เพิ่มฟังก์ชัน 'authorize' สำหรับเช็กสิทธิ์ ADMIN / MECHANIC
export const authorize = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'คุณไม่มีสิทธิ์ในการทำรายการนี้' });
    }
    next();
  };
};