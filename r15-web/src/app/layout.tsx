import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
// 1. import AuthProvider เข้ามาใช้งาน
import { AuthProvider } from '@/context/AuthContext';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'R15 Part Management System',
  description: 'ระบบคลังอะไหล่และชิ้นส่วน Yamaha YZF-R15',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th">
      <body className={`${inter.className} bg-slate-950 text-slate-100 min-h-screen`}>
        {/* 2. นำ <AuthProvider> มาครอบ {children} ไว้ตรงนี้ */}
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}