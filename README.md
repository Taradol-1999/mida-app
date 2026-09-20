# MIDA App

เว็บแอปสำหรับเว็บไซต์อสังหาริมทรัพย์ MIDA และระบบจัดการหลังบ้าน โดยใช้ Next.js, TypeScript, Tailwind CSS และ MySQL

## สิ่งที่มีในเวอร์ชันนี้

- หน้าเว็บไซต์ MIDA: Hero, ค้นหา/กรองโครงการ, รายการโครงการ, ข่าวสาร, ทำเล และปุ่มนัดชมแบบ popup
- หน้ารายละเอียดโครงการ พร้อมส่วนแบบบ้าน ส่วนกลาง โปรโมชั่น OpenStreetMap และปุ่มนำทาง Google Maps
- หลังบ้าน `/admin` พร้อม dashboard และ CRUD สำหรับโครงการ, แบบบ้าน, ส่วนกลาง, โปรโมชั่น, ข่าวสาร, Leads, เนื้อหาเว็บ และผู้ใช้
- สิทธิ์แบบ role-based: `SUPER_ADMIN` จัดการผู้ใช้ได้, `ADMIN` จัดการเนื้อหาได้, `USER` ไม่มีสิทธิ์เข้าหลังบ้าน
- MySQL schema สำหรับโครงการ บ้าน สิ่งอำนวยความสะดวก โปรโมชั่น ข่าว Leads และข้อมูลสถิติ
- API รับ Lead และ API เข้าสู่ระบบ/ออกจากระบบ

## เริ่มใช้งาน

1. ติดตั้งแพ็กเกจด้วย `pnpm install`
2. คัดลอก `.env.example` เป็น `.env.local` แล้วเติมค่า MySQL และ `AUTH_SECRET`
3. สร้างตาราง: `mysql -u root -p < database/schema.sql`
4. เติมข้อมูลจำลองทุกหมวดของโครงการ: `pnpm db:seed`
5. สร้างผู้ดูแลระบบ (ตัวอย่าง):

   ```bash
   DB_PASSWORD='your-password' node scripts/create-admin.mjs "MIDA Admin" admin@mida.local "choose-a-strong-password"
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

หลังรัน schema ใน environment เริ่มต้น จะมีบัญชี Super Admin สำหรับทดสอบ:

```text
username: admin@mida.local
password: MidaAdmin@2026!
```

เปลี่ยนรหัสผ่านนี้ทันทีเมื่อขึ้นระบบจริง แล้วใช้เมนู **ผู้ใช้งานและสิทธิ์** เพื่อเพิ่มบัญชีผู้ดูแลเพิ่มเติม

## ตัวแปรแวดล้อม

ดูรายการครบถ้วนใน `.env.example` ข้อมูลลับต้องอยู่ใน `.env.local` เท่านั้น และห้าม commit ไฟล์นี้

## Database

ไฟล์ `database/schema.sql` สามารถรันซ้ำได้โดยไม่ลบข้อมูลเดิม และ `pnpm db:seed` จะเติมข้อมูลจำลองให้โครงการทั้ง 5 แห่ง ครอบคลุมข้อมูลติดต่อ พิกัด สถานที่ใกล้เคียง แบบบ้าน สิ่งอำนวยความสะดวก โปรโมชั่น และข่าวสาร ราคาและสถานะเป็นข้อมูลตัวอย่างที่ต้องยืนยันกับฝ่ายขายก่อนเผยแพร่จริง

รูปภาพและวิดีโอที่อัปโหลดจากหลังบ้านเก็บเป็นไฟล์จริงในโฟลเดอร์ภายนอกโปรเจกต์ที่กำหนดด้วย `UPLOADS_DIRECTORY` (เครื่องนี้ใช้ `/Users/taradol/งาน/uploads/mida`) และ MySQL เก็บเฉพาะ metadata ใน `media_assets` เพื่อผูกไฟล์กับข้อมูลแต่ละรายการ

## โครงสร้าง

```text
src/app/              หน้าเว็บและ Route Handlers
src/components/       ส่วน UI ที่มี interaction
src/lib/              MySQL และ session authentication
database/schema.sql   โครงสร้าง MySQL
scripts/              utility สำหรับสร้างบัญชีผู้ดูแล
```

## ก่อนนำขึ้น production

- เปลี่ยน `AUTH_SECRET` เป็น random secret ที่ยาวอย่างน้อย 32 ตัวอักษร
- ใช้รหัสผ่านฐานข้อมูลที่ไม่ใช่ root และจำกัดสิทธิ์ตามหลัก least privilege
- ตรวจสอบพิกัด OpenStreetMap, เชื่อมระบบส่งอีเมล/Google Sheets และ media storage ด้วยค่า production
- เพิ่ม CSRF/rate limit สำหรับ endpoint สาธารณะ และตั้งค่า HTTPS
