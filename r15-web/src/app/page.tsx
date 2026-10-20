'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

interface Part {
  id: string;
  partNumber: string;
  name: string;
  category: string;
  compatibleGen: string | string[];
  costPrice: number;
  sellingPrice: number;
  stockQuantity: number;
  minStockAlert: number;
}

const GENERATIONS = ['V1', 'V2', 'V3', 'V4', 'R15M'];
const CATEGORIES = [
  'ENGINE',
  'ELECTRICAL',
  'BODY_CHASSIS',
  'BRAKE_SUSPENSION',
  'DRIVE_SYSTEM',
  'MAINTENANCE',
];

export default function Dashboard() {
  const { user, token, logout, isLoading } = useAuth();
  const router = useRouter();

  const [parts, setParts] = useState<Part[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedGen, setSelectedGen] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  // Form State (สำหรับ Add/Edit)
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    partNumber: '',
    name: '',
    category: 'ENGINE',
    compatibleGen: [] as string[],
    costPrice: '',
    sellingPrice: '',
    stockQuantity: '',
    minStockAlert: '2',
  });

  // Redirect ไปหน้า Login ถ้ายังไม่ได้ล็อกอิน
  useEffect(() => {
    if (!isLoading && !token) {
      router.push('/login');
    }
  }, [token, isLoading, router]);

  // ดึงข้อมูลอะไหล่จาก Backend API
  const fetchParts = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      if (search) queryParams.append('search', search);
      if (selectedGen) queryParams.append('gen', selectedGen);
      if (selectedCategory) queryParams.append('category', selectedCategory);

      const res = await fetch(
        `http://localhost:5000/api/v1/parts?${queryParams.toString()}`
      );
      const data = await res.json();
      if (data.success) {
        setParts(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch parts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchParts();
    }
  }, [search, selectedGen, selectedCategory, token]);

  const handleGenCheckbox = (gen: string) => {
    if (formData.compatibleGen.includes(gen)) {
      setFormData({
        ...formData,
        compatibleGen: formData.compatibleGen.filter((g) => g !== gen),
      });
    } else {
      setFormData({
        ...formData,
        compatibleGen: [...formData.compatibleGen, gen],
      });
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      partNumber: '',
      name: '',
      category: 'ENGINE',
      compatibleGen: [],
      costPrice: '',
      sellingPrice: '',
      stockQuantity: '',
      minStockAlert: '2',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.compatibleGen.length === 0) {
      alert('กรุณาเลือกรุ่น R15 ที่รองรับอย่างน้อย 1 รุ่น');
      return;
    }

    const payload = {
      partNumber: formData.partNumber,
      name: formData.name,
      category: formData.category,
      compatibleGen: formData.compatibleGen,
      costPrice: Number(formData.costPrice),
      sellingPrice: Number(formData.sellingPrice),
      stockQuantity: Number(formData.stockQuantity),
      minStockAlert: Number(formData.minStockAlert),
    };

    try {
      const url = editingId
        ? `http://localhost:5000/api/v1/parts/${editingId}`
        : 'http://localhost:5000/api/v1/parts';
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok) {
        alert(editingId ? 'แก้ไขข้อมูลอะไหล่สำเร็จ' : 'เพิ่มอะไหล่เรียบร้อย');
        resetForm();
        fetchParts();
      } else {
        if (Array.isArray(data.message)) {
          alert(data.message[0]?.message || 'ข้อมูลไม่ถูกต้อง');
        } else {
          alert(data.message || 'เกิดข้อผิดพลาดในการบันทึก');
        }
      }
    } catch (err) {
      alert('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้');
    }
  };

  const handleEdit = (part: Part) => {
    setEditingId(part.id);

    let genArray: string[] = [];
    if (Array.isArray(part.compatibleGen)) {
      genArray = part.compatibleGen;
    } else if (typeof part.compatibleGen === 'string') {
      genArray = part.compatibleGen ? part.compatibleGen.split(',') : [];
    }

    setFormData({
      partNumber: part.partNumber,
      name: part.name,
      category: part.category,
      compatibleGen: genArray,
      costPrice: part.costPrice.toString(),
      sellingPrice: part.sellingPrice.toString(),
      stockQuantity: part.stockQuantity.toString(),
      minStockAlert: part.minStockAlert.toString(),
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('คุณต้องการลบรายการอะไหล่นี้ใช่หรือไม่?')) return;

    try {
      const res = await fetch(`http://localhost:5000/api/v1/parts/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        alert('ลบอะไหล่เรียบร้อยแล้ว');
        fetchParts();
      } else {
        const data = await res.json();
        alert(data.message || 'ลบไม่สำเร็จ');
      }
    } catch (err) {
      alert('เกิดข้อผิดพลาดในการลบข้อมูล');
    }
  };

  // คำนวณสรุปข้อมูล Metrics
  const totalParts = parts.length;
  const totalStock = parts.reduce((sum, p) => sum + p.stockQuantity, 0);
  const totalCostValue = parts.reduce(
    (sum, p) => sum + p.costPrice * p.stockQuantity,
    0
  );
  const lowStockCount = parts.filter(
    (p) => p.stockQuantity <= p.minStockAlert
  ).length;

  if (isLoading || !token) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 font-sans">
        กำลังโหลดข้อมูล...
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Bar */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-slate-900/80 p-5 rounded-2xl border border-slate-800 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-blue-400 flex items-center gap-2">
              🏍️ R15 Part Management System
            </h1>
            <p className="text-slate-400 text-sm mt-0.5">
              ระบบคลังอะไหล่และชิ้นส่วน Yamaha YZF-R15 (V1 - R15M)
            </p>
          </div>

          <div className="flex items-center gap-4 self-end md:self-auto">
            <div className="text-right">
              <p className="text-sm font-semibold text-slate-200">
                {user?.fullName || user?.name || user?.username}
              </p>
              <span
                className={`text-xs px-2 py-0.5 rounded font-mono font-bold ${
                  user?.role === 'ADMIN'
                    ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                    : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                }`}
              >
                {user?.role}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* ปุ่มดูรายงานสรุปรายได้ */}
              <Link
                href="/reports"
                className="bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 px-3.5 py-2 rounded-xl text-sm font-medium transition flex items-center gap-1.5"
              >
                📊 สรุปรายได้
              </Link>

              <button
                onClick={logout}
                className="bg-slate-800 hover:bg-red-950 hover:text-red-400 border border-slate-700 text-slate-300 px-3.5 py-2 rounded-xl text-sm transition font-medium"
              >
                ออกจากระบบ
              </button>
            </div>
          </div>
        </div>

        {/* Metric Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
            <p className="text-xs text-slate-400 font-medium">
              รายการอะไหล่ทั้งหมด
            </p>
            <p className="text-2xl font-bold text-white mt-1">
              {totalParts}{' '}
              <span className="text-xs font-normal text-slate-400">รายการ</span>
            </p>
          </div>
          <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
            <p className="text-xs text-slate-400 font-medium">
              จำนวนชิ้นรวมในสต็อก
            </p>
            <p className="text-2xl font-bold text-emerald-400 mt-1">
              {totalStock}{' '}
              <span className="text-xs font-normal text-slate-400">ชิ้น</span>
            </p>
          </div>
          <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
            <p className="text-xs text-slate-400 font-medium">
              มูลค่าต้นทุนสินค้าในคลัง
            </p>
            <p className="text-2xl font-bold text-amber-400 mt-1">
              ฿{totalCostValue.toLocaleString()}
            </p>
          </div>
          <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
            <p className="text-xs text-slate-400 font-medium">
              เตือนสินค้าใกล้หมด
            </p>
            <p className="text-2xl font-bold text-red-400 mt-1">
              {lowStockCount}{' '}
              <span className="text-xs font-normal text-slate-400">รายการ</span>
            </p>
          </div>
        </div>

        {/* Main Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form (เฉพาะสิทธิ์ ADMIN เท่านั้นถึงจะเห็น) */}
          {user?.role === 'ADMIN' && (
            <div className="lg:col-span-1 bg-slate-900 p-6 rounded-2xl border border-slate-800 h-fit space-y-4">
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <h2 className="text-lg font-semibold text-white">
                  {editingId ? '✏️ แก้ไขข้อมูลอะไหล่' : '➕ เพิ่มอะไหล่ใหม่'}
                </h2>
                {editingId && (
                  <button
                    onClick={resetForm}
                    className="text-xs text-slate-400 hover:text-white underline"
                  >
                    ยกเลิก
                  </button>
                )}
              </div>

              <form onSubmit={handleSubmit} className="space-y-4 text-sm">
                <div>
                  <label className="block text-slate-400 mb-1">
                    รหัสอะไหล่ (Part Number)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="เช่น 2FB-E1111-00"
                    value={formData.partNumber}
                    onChange={(e) =>
                      setFormData({ ...formData, partNumber: e.target.value })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">ชื่ออะไหล่</label>
                  <input
                    type="text"
                    required
                    placeholder="เช่น ผ้าเบรกหน้าแท้ R15"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">หมวดหมู่</label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">
                    รุ่น R15 ที่รองรับ (เลือกได้มากกว่า 1)
                  </label>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {GENERATIONS.map((gen) => {
                      const isChecked = formData.compatibleGen.includes(gen);
                      return (
                        <button
                          key={gen}
                          type="button"
                          onClick={() => handleGenCheckbox(gen)}
                          className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                            isChecked
                              ? 'bg-blue-600 text-white'
                              : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                          }`}
                        >
                          {gen}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1">
                      ราคาทุน (บาท)
                    </label>
                    <input
                      type="number"
                      required
                      value={formData.costPrice}
                      onChange={(e) =>
                        setFormData({ ...formData, costPrice: e.target.value })
                      }
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">
                      ราคาขาย (บาท)
                    </label>
                    <input
                      type="number"
                      required
                      value={formData.sellingPrice}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          sellingPrice: e.target.value,
                        })
                      }
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1">
                      จำนวนสต็อก
                    </label>
                    <input
                      type="number"
                      required
                      value={formData.stockQuantity}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          stockQuantity: e.target.value,
                        })
                      }
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">
                      เตือนสต็อกต่ำกว่า
                    </label>
                    <input
                      type="number"
                      required
                      value={formData.minStockAlert}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          minStockAlert: e.target.value,
                        })
                      }
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-2.5 rounded-xl transition mt-2"
                >
                  {editingId ? 'บันทึกการแก้ไข' : 'บันทึกลงคลัง'}
                </button>
              </form>
            </div>
          )}

          {/* Data Table Column */}
          <div
            className={`space-y-4 ${
              user?.role === 'ADMIN' ? 'lg:col-span-2' : 'lg:col-span-3'
            }`}
          >
            {/* Search & Filters */}
            <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                placeholder="🔍 ค้นหาตามชื่อ หรือ รหัสอะไหล่..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
              />

              <select
                value={selectedGen}
                onChange={(e) => setSelectedGen(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
              >
                <option value="">ทุกรุ่น R15</option>
                {GENERATIONS.map((gen) => (
                  <option key={gen} value={gen}>
                    {gen}
                  </option>
                ))}
              </select>

              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
              >
                <option value="">ทุกหมวดหมู่</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Data Table */}
            <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 font-medium">
                    <tr>
                      <th className="p-4">รหัสอะไหล่</th>
                      <th className="p-4">ชื่ออะไหล่</th>
                      <th className="p-4">รุ่นที่ใส่ได้</th>
                      <th className="p-4 text-right">ทุน</th>
                      <th className="p-4 text-right">ราคาขาย</th>
                      <th className="p-4 text-center">คงเหลือ</th>
                      {user?.role === 'ADMIN' && (
                        <th className="p-4 text-center">จัดการ</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {loading ? (
                      <tr>
                        <td
                          colSpan={user?.role === 'ADMIN' ? 7 : 6}
                          className="p-8 text-center text-slate-500"
                        >
                          กำลังโหลดข้อมูลอะไหล่...
                        </td>
                      </tr>
                    ) : parts.length === 0 ? (
                      <tr>
                        <td
                          colSpan={user?.role === 'ADMIN' ? 7 : 6}
                          className="p-8 text-center text-slate-500"
                        >
                          ไม่พบรายการอะไหล่
                        </td>
                      </tr>
                    ) : (
                      parts.map((part) => (
                        <tr
                          key={part.id}
                          className="hover:bg-slate-800/40 transition"
                        >
                          <td className="p-4 font-mono text-blue-400 font-medium">
                            {part.partNumber}
                          </td>
                          <td className="p-4 font-medium text-slate-200">
                            {part.name}
                          </td>
                          <td className="p-4">
                            <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded text-xs font-mono font-semibold">
                              {Array.isArray(part.compatibleGen)
                                ? part.compatibleGen.join(',')
                                : part.compatibleGen}
                            </span>
                          </td>
                          <td className="p-4 text-right text-slate-400 font-mono">
                            ฿{part.costPrice.toLocaleString()}
                          </td>
                          <td className="p-4 text-right text-emerald-400 font-bold font-mono">
                            ฿{part.sellingPrice.toLocaleString()}
                          </td>
                          <td className="p-4 text-center">
                            <span
                              className={`px-2.5 py-1 rounded-full text-xs font-bold font-mono inline-block ${
                                part.stockQuantity <= part.minStockAlert
                                  ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                  : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              }`}
                            >
                              {part.stockQuantity} ชิ้น
                            </span>
                          </td>
                          {user?.role === 'ADMIN' && (
                            <td className="p-4 text-center space-x-2">
                              <button
                                onClick={() => handleEdit(part)}
                                className="text-amber-400 hover:text-amber-300 text-xs font-medium bg-amber-400/10 px-2.5 py-1 rounded-lg border border-amber-400/20 transition"
                              >
                                แก้ไข
                              </button>
                              <button
                                onClick={() => handleDelete(part.id)}
                                className="text-red-400 hover:text-red-300 text-xs font-medium bg-red-400/10 px-2.5 py-1 rounded-lg border border-red-400/20 transition"
                              >
                                ลบ
                              </button>
                            </td>
                          )}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}