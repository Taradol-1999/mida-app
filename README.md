# MIDA App

เว็บแอปสำหรับเว็บไซต์อสังหาริมทรัพย์ MIDA และระบบจัดการหลังบ้าน โดยใช้ Next.js, TypeScript, Tailwind CSS, Prisma ORM และ MySQL

## สิ่งที่มีในเวอร์ชันนี้

- หน้าเว็บไซต์ MIDA: Hero, ค้นหา/กรองโครงการ, รายการโครงการ, ข่าวสาร, ทำเล และปุ่มนัดชมแบบ popup
- หน้ารายละเอียดโครงการ พร้อมส่วนแบบบ้าน ส่วนกลาง โปรโมชั่น OpenStreetMap และปุ่มนำทาง Google Maps
- หลังบ้าน `/admin` พร้อม dashboard และ CRUD สำหรับโครงการ, แบบบ้าน, ส่วนกลาง, โปรโมชั่น, ข่าวสาร, Leads, เนื้อหาเว็บ และผู้ใช้
- สิทธิ์มี 2 บทบาท: `SUPER_ADMIN` (Super Admin) เข้าถึงทุกโครงการและจัดการผู้ใช้ได้, `MARKETING` (Marketing) เห็นและจัดการเฉพาะโครงการที่ได้รับมอบหมาย โดย 1 บัญชีเลือกได้หลายโครงการ
- Prisma Schema/Model สำหรับโครงการ บ้าน สิ่งอำนวยความสะดวก โปรโมชั่น ข่าว Leads และข้อมูลสถิติ
- API รับ Lead และ API เข้าสู่ระบบ/ออกจากระบบ

## เริ่มใช้งาน

1. ติดตั้งแพ็กเกจด้วย `pnpm install`
2. คัดลอก `.env.example` เป็น `.env.local` แล้วเติมค่า MySQL และ `AUTH_SECRET`
3. สร้าง Client ด้วย `pnpm db:generate` แล้วสร้างตารางในฐานข้อมูลใหม่ด้วย `pnpm db:init` สำหรับฐานข้อมูลที่มีข้อมูลแล้ว ให้ตรวจการเปลี่ยนแปลง Schema ก่อน
4. เติมข้อมูลจำลองทุกหมวดของโครงการ: `pnpm db:seed`
5. สร้างผู้ดูแลระบบ (ตัวอย่าง):

   ```bash
   pnpm db:create-admin "MIDA Admin" admin@mida.local "choose-a-strong-password"
   ```

6. เปิดเว็บ: `npm run dev:webpack`
7. เข้าเว็บที่ `http://localhost:3000` และเข้าหลังบ้านที่ `http://localhost:3000/login`

## ใช้งานด้วย VS Code

1. เปิดโฟลเดอร์ `mida-app` ใน VS Code แล้วติดตั้ง extension ที่โปรเจกต์แนะนำ
2. กด `Cmd+Shift+P` แล้วเลือก `Tasks: Run Task` > `MIDA: Install dependencies` เมื่อเปิดโปรเจกต์ครั้งแรก
3. เปิดแถบ Run and Debug (`Cmd+Shift+D`) แล้วเลือก `MIDA: Run Next.js (Webpack)` จากนั้นกด Start
4. เปิด `http://localhost:3000` ในเบราว์เซอร์

สามารถใช้ Terminal ใน VS Code โดยตรงด้วย `npm run dev:webpack` ได้เช่นกัน

## เข้าใช้งานหลังบ้าน

ใช้บัญชีและรหัสผ่านที่กำหนดตอนรัน `pnpm db:create-admin` การสร้าง Schema ไม่ได้สร้างบัญชีผู้ดูแลให้อัตโนมัติ จากนั้นใช้เมนู **ผู้ใช้งานและสิทธิ์** เพื่อเพิ่มบัญชีผู้ดูแลเพิ่มเติม

## ตัวแปรแวดล้อม

ดูรายการครบถ้วนใน `.env.example` ข้อมูลลับต้องอยู่ใน `.env.local` เท่านั้น และห้าม commit ไฟล์นี้

สคริปต์ seed/import/create-admin โหลด `.env.local` ผ่านคำสั่งใน `package.json` ส่วน Prisma CLI ปัจจุบันโหลด `.env` จาก `prisma.config.ts` หากใช้ `db:init` หรือ `db:studio` ให้ส่งค่าเชื่อมต่อผ่าน environment ของคำสั่ง หรือจัดเตรียม `.env` ที่ไม่ commit ให้ตรงกับฐานข้อมูลเป้าหมาย

## แนวทางสำหรับผู้พัฒนาและ Coding Agent

อ่าน [AGENTS.md](AGENTS.md) สำหรับข้อกำหนดหลัก และเลือกอ่าน [รายละเอียดโปรเจกต์](docs/PROJECT.md) หรือ [คู่มือหลังบ้าน](docs/ADMIN.md) ตามงานที่แก้

แนวทางนี้ปรับตาม [Rethinking skills and prompts for GPT-6 Astra](https://developers.openai.com/blog/rethinking-skills-and-prompts-for-gpt-6-astra): ลดคำแนะนำซ้ำ อ่านเอกสารตามงาน และกำหนดผลลัพธ์ที่ต้องตรวจสอบให้ชัดเจน

## Database

ไฟล์ `prisma/schema.prisma` เป็นแหล่งอ้างอิงโครงสร้างฐานข้อมูลหลัก ใช้ `pnpm db:generate` เพื่อสร้าง Type-safe Client และ `pnpm db:seed` เพื่อเติมข้อมูลจำลองให้โครงการ ครอบคลุมข้อมูลติดต่อ พิกัด สถานที่ใกล้เคียง แบบบ้าน สิ่งอำนวยความสะดวก โปรโมชั่น และข่าวสาร ราคาและสถานะเป็นข้อมูลตัวอย่างที่ต้องยืนยันกับฝ่ายขายก่อนเผยแพร่จริง

รูปภาพและวิดีโอที่อัปโหลดจากหลังบ้านเก็บเป็นไฟล์จริงในโฟลเดอร์ภายนอกโปรเจกต์ที่กำหนดด้วย `UPLOADS_DIRECTORY` (เครื่องนี้ใช้ `/Users/taradol/งาน/uploads/mida`) และ MySQL เก็บเฉพาะ metadata ใน `media_assets` เพื่อผูกไฟล์กับข้อมูลแต่ละรายการ

## โครงสร้าง

```text
src/app/              หน้าเว็บและ Route Handlers
src/components/       ส่วน UI ที่มี interaction
src/lib/prisma.ts     Prisma Client สำหรับ MySQL
prisma/schema.prisma  Schema และ Model ของฐานข้อมูล
scripts/              utility สำหรับสร้างบัญชีผู้ดูแล
```

## ก่อนนำขึ้น production

- เปลี่ยน `AUTH_SECRET` เป็น random secret ที่ยาวอย่างน้อย 32 ตัวอักษร
- ใช้รหัสผ่านฐานข้อมูลที่ไม่ใช่ root และจำกัดสิทธิ์ตามหลัก least privilege
- ตรวจสอบพิกัด OpenStreetMap, เชื่อมระบบส่งอีเมล/Google Sheets และ media storage ด้วยค่า production
- เพิ่ม CSRF/rate limit สำหรับ endpoint สาธารณะ และตั้งค่า HTTPS
