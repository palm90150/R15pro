import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const initialParts = [
  {
    partNumber: '2FB-E1111-00',
    name: 'ฝาสูบเครื่องยนต์ (Cylinder Head)',
    category: 'ENGINE',
    compatibleGen: 'V1,V2',
    costPrice: 2800,
    sellingPrice: 3500,
    stockQuantity: 2,
    minStockAlert: 1,
  },
  {
    partNumber: 'BK6-E3440-00',
    name: 'กรองน้ำมันเครื่องแท้ YAMAHA',
    category: 'ENGINE',
    compatibleGen: 'V1,V2,V3,V4,R15M',
    costPrice: 85,
    sellingPrice: 140,
    stockQuantity: 25,
    minStockAlert: 5,
  },
  {
    partNumber: 'BK6-E4451-00',
    name: 'ไส้กรองอากาศ (Air Filter)',
    category: 'ENGINE',
    compatibleGen: 'V3,V4,R15M',
    costPrice: 120,
    sellingPrice: 190,
    stockQuantity: 12,
    minStockAlert: 3,
  },
  {
    partNumber: '2FB-F5805-00',
    name: 'ผ้าเบรกหน้าแท้ (Front Brake Pads)',
    category: 'BRAKE_DRIVE',
    compatibleGen: 'V2,V3,V4',
    costPrice: 180,
    sellingPrice: 290,
    stockQuantity: 8,
    minStockAlert: 3,
  },
  {
    partNumber: '2FB-F5905-00',
    name: 'ผ้าเบรกหลังแท้ (Rear Brake Pads)',
    category: 'BRAKE_DRIVE',
    compatibleGen: 'V2,V3,V4,R15M',
    costPrice: 160,
    sellingPrice: 260,
    stockQuantity: 2, // สต็อกเหลือน้อย เพื่อทดสอบเตือน Warning
    minStockAlert: 3,
  },
  {
    partNumber: '94568-A8104',
    name: 'โซ่ราวลิ้นเครื่องยนต์ VVA',
    category: 'ENGINE',
    compatibleGen: 'V3,V4,R15M',
    costPrice: 320,
    sellingPrice: 480,
    stockQuantity: 5,
    minStockAlert: 2,
  },
  {
    partNumber: 'B97-H2100-00',
    name: 'แบตเตอรี่ 12V 5Ah แท้ศูนย์',
    category: 'ELECTRICAL',
    compatibleGen: 'V1,V2,V3,V4,R15M',
    costPrice: 550,
    sellingPrice: 850,
    stockQuantity: 4,
    minStockAlert: 2,
  },
  {
    partNumber: 'BK6-E81A0-00',
    name: 'ชุด Quickshifter แท้ YAMAHA',
    category: 'ACCESSORIES',
    compatibleGen: 'V4,R15M',
    costPrice: 1900,
    sellingPrice: 2700,
    stockQuantity: 1, // สต็อกเหลือน้อย
    minStockAlert: 2,
  },
  {
    partNumber: 'BK6-F1711-00',
    name: 'แฟริ่งข้างซ้ายสีน้ำมัน Race Blue',
    category: 'BODY_FAIRING',
    compatibleGen: 'V3',
    costPrice: 750,
    sellingPrice: 1150,
    stockQuantity: 3,
    minStockAlert: 1,
  },
  {
    partNumber: '2FB-E2461-00',
    name: 'หม้อน้ำระบายความร้อน (Radiator)',
    category: 'ENGINE',
    compatibleGen: 'V2,V3',
    costPrice: 1100,
    sellingPrice: 1650,
    stockQuantity: 3,
    minStockAlert: 1,
  },
];

async function main() {
  console.log('🌱 กำลังเพิ่มข้อมูลตัวอย่างอะไหล่ R15 เข้าสู่ Database...');
  for (const part of initialParts) {
    await prisma.part.upsert({
      where: { partNumber: part.partNumber },
      update: {},
      create: part,
    });
  }
  console.log('✅ เพิ่มข้อมูลตัวอย่างอะไหล่สำเร็จเรียบร้อย!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });