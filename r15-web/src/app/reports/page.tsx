'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

interface CategoryReport {
  category: string;
  count: number;
  totalCost: number;
  totalRevenue: number;
  profit: number;
}

interface ReportSummary {
  totalCost: number;
  totalRevenuePotential: number;
  totalProfit: number;
  profitMargin: number;
}

export default function ReportsPage() {
  const { user, token, isLoading } = useAuth();
  const router = useRouter();

  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [categories, setCategories] = useState<CategoryReport[]>([]);
  const [loading, setLoading] = useState(true);

  // ตรวจสอบสิทธิ์ ล็อกอิน
  useEffect(() => {
    if (!isLoading && !token) {
      router.push('/login');
    }
  }, [token, isLoading, router]);

  // ดึงข้อมูลรายงานสรุปจาก Backend API
  const fetchReport = async () => {
    try {
      setLoading(true);
      const res = await fetch('http://localhost:5000/api/v1/parts/reports/monthly', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (data.success) {
        setSummary(data.data.summary);
        setCategories(data.data.categoryStats);
      }
    } catch (err) {
      console.error('Failed to fetch report:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchReport();
    }
  }, [token]);

  if (isLoading || !token || loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 font-sans">
        กำลังโหลดรายงานสรุปรายได้...
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Bar */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-slate-900/80 p-5 rounded-2xl border border-slate-800 gap-4">
          <div>
            <div className="flex items-center gap-3">
              <Link
                href="/"
                className="text-slate-400 hover:text-white bg-slate-800 p-2 rounded-xl border border-slate-700 text-sm transition"
              >
                ← กลับหน้าหลัก
              </Link>
              <h1 className="text-2xl font-bold text-blue-400">
                📊 รายงานสรุปรายได้และกำไรคลังอะไหล่
              </h1>
            </div>
            <p className="text-slate-400 text-sm mt-1">
              วิเคราะห์มูลค่าคลังสินค้า รายได้คาดการณ์ และผลกำไรแยกตามหมวดหมู่ชิ้นส่วน
            </p>
          </div>
        </div>

        {/* Top Summary Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800">
            <p className="text-xs text-slate-400 font-medium">มูลค่าต้นทุนสินค้าทั้งหมด</p>
            <p className="text-2xl font-bold text-amber-400 mt-1">
              ฿{summary?.totalCost.toLocaleString()}
            </p>
          </div>

          <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800">
            <p className="text-xs text-slate-400 font-medium">ยอดขายคาดการณ์รวม</p>
            <p className="text-2xl font-bold text-blue-400 mt-1">
              ฿{summary?.totalRevenuePotential.toLocaleString()}
            </p>
          </div>

          <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800">
            <p className="text-xs text-slate-400 font-medium">กำไรสุทธิคาดการณ์</p>
            <p className="text-2xl font-bold text-emerald-400 mt-1">
              ฿{summary?.totalProfit.toLocaleString()}
            </p>
          </div>

          <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800">
            <p className="text-xs text-slate-400 font-medium">อัตรากำไร (Profit Margin)</p>
            <p className="text-2xl font-bold text-purple-400 mt-1">
              {summary?.profitMargin}%
            </p>
          </div>
        </div>

        {/* Category Profit Breakdown Table */}
        <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden p-6 space-y-4">
          <h2 className="text-lg font-semibold text-white">
            🏷️ สรุปรายได้และกำไรแยกตามหมวดหมู่สินค้า
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 font-medium">
                <tr>
                  <th className="p-4">หมวดหมู่สินค้า</th>
                  <th className="p-4 text-center">จำนวนในคลัง (ชิ้น)</th>
                  <th className="p-4 text-right">ต้นทุนรวม</th>
                  <th className="p-4 text-right">ราคาขายรวม</th>
                  <th className="p-4 text-right">กำไรคาดการณ์</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {categories.map((cat) => (
                  <tr key={cat.category} className="hover:bg-slate-800/40 transition">
                    <td className="p-4 font-semibold text-slate-200">{cat.category}</td>
                    <td className="p-4 text-center font-mono font-bold text-slate-300">
                      {cat.count}
                    </td>
                    <td className="p-4 text-right font-mono text-slate-400">
                      ฿{cat.totalCost.toLocaleString()}
                    </td>
                    <td className="p-4 text-right font-mono text-blue-400 font-medium">
                      ฿{cat.totalRevenue.toLocaleString()}
                    </td>
                    <td className="p-4 text-right font-mono text-emerald-400 font-bold">
                      +฿{cat.profit.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}