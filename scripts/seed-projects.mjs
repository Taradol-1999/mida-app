import { randomUUID } from "node:crypto";
import mysql from "mysql2/promise";

const connection = await mysql.createConnection({
  host: process.env.DB_HOST ?? "127.0.0.1",
  port: Number(process.env.DB_PORT ?? 3306),
  user: process.env.DB_USER ?? "root",
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME ?? "mida_app",
});

const demoProjects = [
  {
    slug: "grand-village-petchkasem",
    hero: "Grand Village เพชรเกษม",
    subtitle: "บ้านเดี่ยว บ้านแฝด และทาวน์โฮมติดถนนเพชรเกษม",
    phone: "065-725-4501",
    coordinates: [13.8199, 100.0373],
    nearby: ["เมกาโฮม 100 ม.", "Makro 1.5 กม.", "มหาวิทยาลัยศิลปากร 7 กม.", "เซ็นทรัลนครปฐม 10 กม."],
    houses: [
      ["Minor", 3, 2, 120, 2500000],
      ["Mild", 4, 3, 190, 4100000],
    ],
    facilities: ["Clubhouse และสระว่ายน้ำระบบเกลือ", "Fitness Center", "สวนสาธารณะ"],
  },
  {
    slug: "town-village-prapa",
    hero: "Town Village Prapa",
    subtitle: "ทาวน์โฮมสไตล์โมเดิร์น พร้อมส่วนกลางสำหรับครอบครัว",
    phone: "082-250-0599",
    coordinates: [13.8335, 100.0575],
    nearby: ["องค์พระปฐมเจดีย์ 3.7 กม.", "โรงพยาบาลนครปฐม 5.1 กม.", "มหาวิทยาลัยราชภัฏนครปฐม 5.7 กม."],
    houses: [
      ["TOWNHOME", 3, 2, 120, 2159000],
      ["TOWNHOME PLUS", 3, 3, 136, 2800000],
    ],
    facilities: ["Clubhouse และสระว่ายน้ำ", "Fitness Center", "Playground"],
  },
  {
    slug: "roipruksa-lakeville",
    hero: "Roipruksa Lakeville",
    subtitle: "บ้านเดี่ยวท่ามกลางบรรยากาศริมทะเลสาบส่วนตัว",
    phone: "098-096-4151",
    coordinates: [13.7985, 100.034],
    nearby: ["องค์พระปฐมเจดีย์ 4.4 กม.", "มหาวิทยาลัยศิลปากร 5 กม.", "โรงพยาบาลนครปฐม 5.2 กม."],
    houses: [
      ["TYPE A", 3, 3, 171, 5290000],
      ["TYPE B", 4, 4, 230, 6500000],
    ],
    facilities: ["Club House รับวิว Panorama", "สระว่ายน้ำวิวทะเลสาบ", "Fitness Center"],
  },
  {
    slug: "the-code-lamphaya",
    hero: "THE CODE ลำพยา",
    subtitle: "บ้านดีไซน์โมเดิร์น พร้อม Club House และส่วนกลางขนาดใหญ่",
    phone: "061-389-7557",
    coordinates: [13.8234, 100.0449],
    nearby: ["โรงเรียนบอสโกพิทักษ์", "มหาวิทยาลัยศิลปากร", "โรงพยาบาลกรุงเทพสนามจันทร์"],
    houses: [
      ["TYPE A", 3, 3, 140, 3600000],
      ["TYPE B", 3, 3, 190, 4500000],
    ],
    facilities: ["Club House และสระว่ายน้ำระบบเกลือ", "Fitness Center", "Kids Club"],
  },
  {
    slug: "thetown-khonkaen-baankhor",
    hero: "เดอะทาวน์ ขอนแก่น",
    subtitle: "บ้านสไตล์มินิมอลบนทำเลบ้านค้อ ใกล้เมืองขอนแก่น",
    phone: "065-729-2636",
    coordinates: [16.5557441, 102.7674146],
    nearby: ["สนามบินนานาชาติขอนแก่น", "มหาวิทยาลัยขอนแก่น", "เซ็นทรัลขอนแก่น", "โรงพยาบาลศรีนครินทร์"],
    houses: [
      ["ASTER", 2, 1, 90, 2200000],
      ["LAVENDER", 2, 1, 72, 1900000],
    ],
    facilities: ["สวนสาธารณะ", "ระบบรักษาความปลอดภัย 24 ชม.", "CCTV และไฟส่องสว่าง LED"],
  },
];

try {
  await connection.beginTransaction();
  for (const project of demoProjects) {
    const [projects] = await connection.execute("SELECT id FROM projects WHERE slug=? LIMIT 1", [project.slug]);
    if (!projects.length) continue;
    const projectId = projects[0].id;
    const [latitude, longitude] = project.coordinates;
    await connection.execute(
      "UPDATE projects SET latitude=COALESCE(latitude, ?), longitude=COALESCE(longitude, ?) WHERE id=?",
      [latitude, longitude, projectId],
    );
    await connection.execute(
      `INSERT INTO project_settings (project_id, hero_title_th, hero_subtitle_th, phone, email, map_url, nearby_places_th, care_warranty, care_maintenance, care_common_area)
       VALUES (?, ?, ?, ?, 'info@midaproperty.com', ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE hero_title_th=COALESCE(hero_title_th, VALUES(hero_title_th)), hero_subtitle_th=COALESCE(hero_subtitle_th, VALUES(hero_subtitle_th)), phone=COALESCE(phone, VALUES(phone)), email=COALESCE(email, VALUES(email)), map_url=COALESCE(map_url, VALUES(map_url)), nearby_places_th=COALESCE(nearby_places_th, VALUES(nearby_places_th)), care_warranty=COALESCE(care_warranty, VALUES(care_warranty)), care_maintenance=COALESCE(care_maintenance, VALUES(care_maintenance)), care_common_area=COALESCE(care_common_area, VALUES(care_common_area))`,
      [
        projectId,
        project.hero,
        project.subtitle,
        project.phone,
        `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`,
        project.nearby.join("\n"),
        "ข้อมูลและระบบแจ้งซ่อมออนไลน์เกี่ยวกับการรับประกันโครงสร้างบ้าน และส่วนควบภายในตามระยะเวลาของโครงการ",
        "คู่มือการใช้งานระบบสาธารณูปโภค ระบบไฟฟ้า ประปา และการจัดการขยะของโครงการอย่างถูกวิธี",
        "ช่องทางการติดต่อ กฎระเบียบหมู่บ้าน และการประสานงานกับนิติบุคคลเพื่อรักษาความสงบเรียบร้อย",
      ],
    );
    await connection.execute(
      "UPDATE project_settings SET phone=? WHERE project_id=? AND (phone IS NULL OR phone='' OR phone='จัดการข้อมูลติดต่อ & แผนที่')",
      [project.phone, projectId],
    );
    for (const [name, bedrooms, bathrooms, area, price] of project.houses) {
      await connection.execute(
        `INSERT INTO house_types (id, project_id, name, description, bedrooms, bathrooms, usable_area_sqm, starting_price)
         SELECT ?, ?, ?, ?, ?, ?, ?, ? WHERE NOT EXISTS (SELECT 1 FROM house_types WHERE project_id=? AND name=?)`,
        [randomUUID(), projectId, name, `แบบบ้านจำลอง ${name}`, bedrooms, bathrooms, area, price, projectId, name],
      );
    }
    for (const [index, name] of project.facilities.entries()) {
      await connection.execute(
        `INSERT INTO facilities (id, project_id, name, description, sort_order)
         SELECT ?, ?, ?, 'ข้อมูลสิ่งอำนวยความสะดวกจำลอง', ? WHERE NOT EXISTS (SELECT 1 FROM facilities WHERE project_id=? AND name=?)`,
        [randomUUID(), projectId, name, index + 1, projectId, name],
      );
    }
    const promoTitle = `ข้อเสนอพิเศษ ${project.hero}`;
    await connection.execute(
      `INSERT INTO promotions (id, project_id, title, body, is_published)
       SELECT ?, ?, ?, 'ข้อมูลโปรโมชันจำลอง โปรดตรวจสอบเงื่อนไขกับฝ่ายขาย', TRUE WHERE NOT EXISTS (SELECT 1 FROM promotions WHERE project_id=? AND title=?)`,
      [randomUUID(), projectId, promoTitle, projectId, promoTitle],
    );
    const newsTitle = `อัปเดตโครงการ ${project.hero}`;
    await connection.execute(
      `INSERT INTO news_items (id, project_id, category, title, body, published_at, is_published)
       SELECT ?, ?, 'NEWS', ?, 'ข่าวสารและความคืบหน้าของโครงการ', NOW(), TRUE WHERE NOT EXISTS (SELECT 1 FROM news_items WHERE project_id=? AND title=?)`,
      [randomUUID(), projectId, newsTitle, projectId, newsTitle],
    );
  }
  await connection.commit();
  console.log(`Seeded ${demoProjects.length} MIDA projects.`);
} catch (error) {
  await connection.rollback();
  throw error;
} finally {
  await connection.end();
}
