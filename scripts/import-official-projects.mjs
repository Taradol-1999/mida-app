import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import mysql from "mysql2/promise";

const uploadsDirectory = path.resolve(process.env.UPLOADS_DIRECTORY || path.join(process.cwd(), "public", "uploads"));

const projects = [
  {
    slug: "grand-village-petchkasem",
    description:
      "บ้านเดี่ยว บ้านแฝด และทาวน์โฮมสไตล์โมเดิร์นติดถนนเพชรเกษม บนพื้นที่โครงการ 63 ไร่ 72 ตารางวา จำนวน 444 ยูนิต ออกแบบให้ใช้พื้นที่คุ้มค่าและเดินทางเข้าเมืองนครปฐมได้สะดวก",
    price: 2_500_000,
    nameEn: "Grand Village Phetkasem",
    heroTitle: "Grand Village เพชรเกษม",
    heroTitleEn: "Grand Village Phetkasem",
    heroSubtitle: "บ้านเดี่ยว บ้านแฝด และทาวน์โฮมติดถนนเพชรเกษม ใกล้เมืองนครปฐม",
    heroSubtitleEn:
      "Modern detached houses, semi-detached houses and townhomes on Phetkasem Road, close to Nakhon Pathom city.",
    phone: "065-725-4501",
    nearby: [
      "เมกาโฮม 100 ม.",
      "โรงเรียนนานาชาติวันเนส 3 กม.",
      "แม็คโคร 1.5 กม.",
      "โรงพยาบาลสินแพทย์ 5.6 กม.",
      "มหาวิทยาลัยศิลปากร 7 กม.",
      "โลตัส 7.7 กม.",
      "องค์พระปฐมเจดีย์ 10 กม.",
      "เซ็นทรัล นครปฐม 10 กม.",
    ],
    nearbyEn: [
      "Mega Home 100 m",
      "Vanas International School 3 km",
      "Makro 1.5 km",
      "Synphaet Hospital 5.6 km",
      "Silpakorn University 7 km",
      "Lotus's 7.7 km",
      "Phra Pathom Chedi 10 km",
      "Central Nakhon Pathom 10 km",
    ],
    facilities: ["Clubhouse และสระว่ายน้ำระบบเกลือ", "Fitness Center", "สวนสาธารณะ", "รปภ. และ CCTV ตลอด 24 ชั่วโมง"],
    removeDemoFacilities: [],
    removeDemoHouses: [],
    houses: [],
    images: [
      ["hero", "https://www.midaproperty.com/wp-content/uploads/2023/08/Ovar-All-Final-1-scaled.jpg"],
      ["hero", "https://www.midaproperty.com/wp-content/uploads/2023/08/AW_Brochure_GVLPKS-03-scaled.jpg"],
      ["hero", "https://www.midaproperty.com/wp-content/uploads/2023/08/AW_Brochure_GVLPKS-04-scaled.jpg"],
    ],
  },
  {
    slug: "town-village-prapa",
    description:
      "บ้านเดี่ยวและทาวน์โฮมสไตล์โมเดิร์นบนพื้นที่ 53 ไร่ 2 งาน 30 ตารางวา จำนวน 354 ยูนิต พร้อมส่วนกลางครบครัน บนทำเลฝั่งเมืองใกล้องค์พระปฐมเจดีย์",
    price: 2_159_000,
    nameEn: "Town Village Prapa",
    heroTitle: "Town Village Prapa",
    heroTitleEn: "Town Village Prapa",
    heroSubtitle: "บ้านเดี่ยวและทาวน์โฮมสไตล์โมเดิร์น พร้อมส่วนกลางสำหรับทุกคนในครอบครัว",
    heroSubtitleEn:
      "Modern detached houses and townhomes with family-friendly shared facilities near central Nakhon Pathom.",
    phone: "082-250-0599",
    nearby: [
      "ท่ารถกรุงเทพ–นครปฐม 3.6 กม.",
      "องค์พระปฐมเจดีย์ 3.7 กม.",
      "โรงพยาบาลนครปฐม 5.1 กม.",
      "มหาวิทยาลัยราชภัฏนครปฐม 5.7 กม.",
      "โลตัส 6.5 กม.",
      "บิ๊กซี 6.7 กม.",
      "มหาวิทยาลัยศิลปากร 6.7 กม.",
    ],
    nearbyEn: [
      "Bangkok–Nakhon Pathom Bus Terminal 3.6 km",
      "Phra Pathom Chedi 3.7 km",
      "Nakhon Pathom Hospital 5.1 km",
      "Nakhon Pathom Rajabhat University 5.7 km",
      "Lotus's 6.5 km",
      "Big C 6.7 km",
      "Silpakorn University 6.7 km",
    ],
    facilities: [
      "Clubhouse และสระว่ายน้ำระบบเกลือ",
      "Fitness Center",
      "สวนสาธารณะ",
      "Playground",
      "รปภ. และ CCTV ตลอด 24 ชั่วโมง",
    ],
    removeDemoFacilities: ["Clubhouse และสระว่ายน้ำ"],
    removeDemoHouses: ["TOWNHOME PLUS"],
    houses: [
      ["TOWNHOME", "ทาวน์โฮมสไตล์โมเดิร์น เชื่อมต่อพื้นที่พักผ่อนและส่วนกลางสำหรับครอบครัว", 3, 2, 120],
      ["VANDA", "บ้านเดี่ยวสำหรับครอบครัวขนาดใหญ่ ภายในโปร่งและเชื่อมต่อฟังก์ชันอย่างลงตัว", 3, 2, 130],
      ["LAVENDER", "บ้านเดี่ยวที่จัดพื้นที่เป็นสัดส่วน เชื่อมบรรยากาศภายในและภายนอกเพื่อการพักผ่อน", 3, 2, 113],
      ["ASTER", "บ้านเดี่ยวขนาดกะทัดรัดสำหรับการเริ่มต้นครอบครัว พร้อมฟังก์ชันการใช้งานครบ", 2, 1, 90],
    ],
    images: [
      ["cover", "https://www.midaproperty.com/wp-content/uploads/2021/08/2-4.jpg"],
      ["hero", "https://www.midaproperty.com/wp-content/uploads/2021/08/8-2.jpg"],
      ["hero", "https://www.midaproperty.com/wp-content/uploads/2021/08/Bed-room-Hd-3-scaled-1.jpg"],
      ["hero", "https://www.midaproperty.com/wp-content/uploads/2021/08/6-2.jpg"],
    ],
  },
  {
    slug: "the-code-lamphaya",
    description:
      "บ้านเดี่ยวและบ้านแฝด 2 ชั้นสไตล์โมเดิร์น บนพื้นที่ 71 ไร่ 3 งาน 99 ตารางวา จำนวน 352 ยูนิต พร้อมคลับเฮาส์และพื้นที่ส่วนกลางขนาดใหญ่ บนทำเลลำพยา จังหวัดนครปฐม",
    price: 3_000_000,
    nameEn: "THE CODE Lamphaya",
    heroTitle: "THE CODE ลำพยา",
    heroTitleEn: "THE CODE Lamphaya",
    heroSubtitle: "รหัสใหม่ของการใช้ชีวิต บ้านโมเดิร์นพร้อม Clubhouse และส่วนกลางขนาดใหญ่",
    heroSubtitleEn:
      "A new code for modern living with a clubhouse and expansive shared facilities in Lamphaya, Nakhon Pathom.",
    phone: "061-389-7557",
    nearby: [
      "โรงเรียนบอสโกพิทักษ์",
      "โรงเรียนราชินีบูรณะ",
      "มหาวิทยาลัยศิลปากร",
      "มหาวิทยาลัยราชภัฏนครปฐม",
      "โรงพยาบาลกรุงเทพ สนามจันทร์",
      "โรงพยาบาลเทพากร",
      "แม็คโคร นครปฐม",
      "โลตัส นครปฐม",
      "บิ๊กซี นครปฐม",
      "โฮมโปร",
    ],
    nearbyEn: [
      "Bosco Pitak School",
      "Rachineeburana School",
      "Silpakorn University",
      "Nakhon Pathom Rajabhat University",
      "Bangkok Hospital Sanamchan",
      "Thepakorn Hospital",
      "Makro Nakhon Pathom",
      "Lotus's Nakhon Pathom",
      "Big C Nakhon Pathom",
      "HomePro",
    ],
    facilities: [
      "Club House และสระว่ายน้ำระบบเกลือ",
      "Fitness Center",
      "สวนสาธารณะขนาดใหญ่",
      "Kids Club",
      "รปภ. และ CCTV ตลอด 24 ชั่วโมง",
    ],
    removeDemoFacilities: [],
    removeDemoHouses: [],
    houses: [
      ["TYPE A", "บ้านเดี่ยว 2 ชั้นสไตล์โมเดิร์น", 3, 3, 140],
      ["TYPE B", "บ้านเดี่ยว 2 ชั้นสไตล์โมเดิร์น", 3, 3, 190],
      ["TYPE C", "บ้านเดี่ยว 2 ชั้นสำหรับครอบครัวที่ต้องการพื้นที่ใช้สอยมากขึ้น", 3, 3, 200],
      ["TYPE D", "บ้านเดี่ยว 2 ชั้น ฟังก์ชันลงตัวสำหรับครอบครัวยุคใหม่", 3, 2, 120],
    ],
    images: [
      ["cover", "https://www.midaproperty.com/wp-content/uploads/2021/08/1.jpg"],
      ["hero", "https://www.midaproperty.com/wp-content/uploads/2021/08/Lp-House-Type-A-Preview.jpg"],
      ["hero", "https://www.midaproperty.com/wp-content/uploads/2021/08/LP-House-Type-B-Preview.jpg"],
      ["hero", "https://www.midaproperty.com/wp-content/uploads/2021/08/LP-House-Type-C-Preview.jpg"],
      ["hero", "https://www.midaproperty.com/wp-content/uploads/2021/08/LP-House-Type-D-Preview.jpg"],
    ],
  },
  {
    slug: "roipruksa-lakeville",
    description:
      "บ้านเดี่ยวพื้นที่กว้างขวางท่ามกลางบรรยากาศริมทะเลสาบส่วนตัว บนพื้นที่ 47 ไร่ 2 งาน 61 ตารางวา เพียง 100 ยูนิต พร้อม Club House รับวิว Panorama และระบบรักษาความปลอดภัยตลอด 24 ชั่วโมง",
    price: 5_290_000,
    nameEn: "Roipruksa Lakeville",
    heroTitle: "Roipruksa Lakeville",
    heroTitleEn: "Roipruksa Lakeville",
    heroSubtitle: "บ้านเดี่ยวริมทะเลสาบส่วนตัว สงบ ผ่อนคลาย และเป็นส่วนตัวเพียง 100 ยูนิต",
    heroSubtitleEn:
      "Spacious detached homes by a private lake, offering a peaceful atmosphere and exclusive living with only 100 residences.",
    phone: "098-096-4151",
    nearby: [
      "วัดพระงาม 3.1 กม.",
      "องค์พระปฐมเจดีย์ 4.4 กม.",
      "สถานีตำรวจนครปฐม 4.6 กม.",
      "มหาวิทยาลัยศิลปากร 5 กม.",
      "โรงพยาบาลนครปฐม 5.2 กม.",
    ],
    nearbyEn: [
      "Wat Phra Ngam 3.1 km",
      "Phra Pathom Chedi 4.4 km",
      "Nakhon Pathom Police Station 4.6 km",
      "Silpakorn University 5 km",
      "Nakhon Pathom Hospital 5.2 km",
    ],
    facilities: [
      "Club House รับวิว Panorama",
      "สระว่ายน้ำ",
      "Fitness Center",
      "สวนสาธารณะขนาดใหญ่",
      "รปภ. ตลอด 24 ชั่วโมง",
    ],
    removeDemoFacilities: ["สระว่ายน้ำวิวทะเลสาบ"],
    removeDemoHouses: [],
    houses: [
      ["TYPE A", "บ้านเดี่ยวริมทะเลสาบ ออกแบบพื้นที่ใช้สอยสำหรับครอบครัว", 3, 3, 171],
      ["TYPE B", "บ้านเดี่ยวขนาดใหญ่ พร้อมพื้นที่พักผ่อนสำหรับสมาชิกทุกคน", 4, 4, 230],
      ["Home Office", "โฮมออฟฟิศที่รองรับทั้งการอยู่อาศัยและการทำงาน", 4, 3, 190],
    ],
    images: [
      ["cover", "https://www.midaproperty.com/wp-content/uploads/2026/02/DSC08595-scaled.jpeg"],
      ["hero", "https://www.midaproperty.com/wp-content/uploads/2026/02/DSC08512-scaled.jpeg"],
      ["hero", "https://www.midaproperty.com/wp-content/uploads/2026/02/DSC08756-scaled.jpeg"],
      ["hero", "https://www.midaproperty.com/wp-content/uploads/2021/08/Home-Office.jpg"],
    ],
  },
  {
    slug: "thetown-khonkaen-baankhor",
    description:
      "บ้านและทาวน์โฮมบนถนนเลี่ยงเมืองขอนแก่น บรรยากาศสงบ ร่มรื่น เดินทางสะดวก ใกล้มหาวิทยาลัยขอนแก่น สนามบิน และแหล่งชุมชน",
    price: null,
    nameEn: "The Town Khon Kaen",
    heroTitle: "เดอะทาวน์ ขอนแก่น",
    heroTitleEn: "The Town Khon Kaen",
    heroSubtitle: "บ้านและทาวน์โฮมบนทำเลบ้านค้อ ใกล้เมืองขอนแก่น เดินทางสะดวกและเงียบสงบ",
    heroSubtitleEn:
      "Detached houses and townhomes in Ban Kho, offering convenient access to Khon Kaen city in a peaceful setting.",
    phone: "065-729-2636",
    nearby: ["สนามบินนานาชาติขอนแก่น", "มหาวิทยาลัยขอนแก่น", "เซ็นทรัล ขอนแก่น", "โรงพยาบาลศรีนครินทร์"],
    nearbyEn: ["Khon Kaen International Airport", "Khon Kaen University", "Central Khon Kaen", "Srinagarind Hospital"],
    facilities: ["สวนสาธารณะ", "รปภ. ตลอด 24 ชั่วโมง", "CCTV", "ไฟส่องสว่าง LED ทั่วโครงการ"],
    removeDemoFacilities: ["ระบบรักษาความปลอดภัย 24 ชม.", "CCTV และไฟส่องสว่าง LED"],
    removeDemoHouses: [],
    houses: [
      ["ASTER", "บ้านเดี่ยวสำหรับการเริ่มต้นหรือขยายครอบครัว พร้อมพื้นที่สีเขียวรอบตัวบ้าน", 2, 1, 90],
      ["LAVENDER", "บ้านเดี่ยวที่จัดพื้นที่เป็นสัดส่วน โปร่งสบาย และรองรับทุกฟังก์ชันของครอบครัว", 3, 2, 115],
      ["VANDA", "บ้านเดี่ยวพื้นที่กว้างสำหรับครอบครัว พร้อมฟังก์ชันใช้งานครบถ้วน", 3, 2, 130],
      ["TownHome 1ชั้น", "ทาวน์โฮมชั้นเดียวสไตล์โมเดิร์น โปร่ง โล่ง พร้อมช่องระบายอากาศ", 2, 1, 68],
    ],
    images: [
      ["hero", "https://www.midaproperty.com/wp-content/uploads/2021/08/06-Newaster-Bedroom.jpg"],
      ["hero", "https://www.midaproperty.com/wp-content/uploads/2021/08/04-Lavender-Bedroom.jpg"],
      [
        "hero",
        "https://www.midaproperty.com/wp-content/uploads/2022/06/LINE_ALBUM_%E0%B9%80%E0%B8%9C%E0%B8%B7%E0%B9%88%E0%B8%AD%E0%B9%83%E0%B8%8A%E0%B9%89%E0%B8%87%E0%B8%B2%E0%B8%99%E0%B8%84%E0%B8%A3%E0%B8%B1%E0%B8%9A_%E0%B9%92%E0%B9%92%E0%B9%90%E0%B9%96%E0%B9%90%E0%B9%99_23.jpg",
      ],
      [
        "hero",
        "https://www.midaproperty.com/wp-content/uploads/2022/06/LINE_ALBUM_%E0%B9%80%E0%B8%9C%E0%B8%B7%E0%B9%88%E0%B8%AD%E0%B9%83%E0%B8%8A%E0%B9%89%E0%B8%87%E0%B8%B2%E0%B8%99%E0%B8%84%E0%B8%A3%E0%B8%B1%E0%B8%9A_%E0%B9%92%E0%B9%92%E0%B9%90%E0%B9%96%E0%B9%90%E0%B9%99_22.jpg",
      ],
    ],
  },
];

const mimeExtensions = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
]);

function officialName(slug, index, extension) {
  return `official-${slug}-${String(index + 1).padStart(2, "0")}.${extension}`;
}

async function downloadImage(url) {
  const response = await fetch(url, { headers: { "User-Agent": "MIDA local content importer/1.0" } });
  if (!response.ok) throw new Error(`ดาวน์โหลดไม่สำเร็จ (${response.status}): ${url}`);
  const mimeType = (response.headers.get("content-type") || "").split(";")[0].toLowerCase();
  const extension = mimeExtensions.get(mimeType);
  if (!extension) throw new Error(`ไฟล์ไม่ใช่รูปภาพที่รองรับ (${mimeType || "unknown"}): ${url}`);
  const buffer = Buffer.from(await response.arrayBuffer());
  if (!buffer.length || buffer.length > 20 * 1024 * 1024)
    throw new Error(`ขนาดรูปไม่ถูกต้อง (${buffer.length} bytes): ${url}`);
  return { buffer, mimeType, extension };
}

const connection = await mysql.createConnection({
  host: process.env.DB_HOST ?? "127.0.0.1",
  port: Number(process.env.DB_PORT ?? 3306),
  user: process.env.DB_USER ?? "root",
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME ?? "mida_app",
});

const createdFiles = [];
const report = [];

try {
  await mkdir(uploadsDirectory, { recursive: true });
  await connection.beginTransaction();

  for (const project of projects) {
    const [projectRows] = await connection.execute("SELECT id FROM projects WHERE slug=? LIMIT 1", [project.slug]);
    if (!projectRows.length) {
      report.push(`${project.slug}: ไม่พบโครงการในฐานข้อมูล`);
      continue;
    }

    const projectId = projectRows[0].id;
    await connection.execute(
      `UPDATE projects
       SET name_en=?, description=?, starting_price=CASE WHEN ? IS NULL THEN starting_price ELSE ? END
       WHERE id=?`,
      [project.nameEn, project.description, project.price, project.price, projectId],
    );
    await connection.execute(
      `INSERT INTO project_settings
         (project_id, hero_title_th, hero_title_en, hero_subtitle_th, hero_subtitle_en, phone, nearby_places_th, nearby_places_en)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         hero_title_th=VALUES(hero_title_th), hero_title_en=VALUES(hero_title_en),
         hero_subtitle_th=VALUES(hero_subtitle_th), hero_subtitle_en=VALUES(hero_subtitle_en),
         phone=VALUES(phone), nearby_places_th=VALUES(nearby_places_th), nearby_places_en=VALUES(nearby_places_en)`,
      [
        projectId,
        project.heroTitle,
        project.heroTitleEn,
        project.heroSubtitle,
        project.heroSubtitleEn,
        project.phone,
        project.nearby.join("\n"),
        project.nearbyEn.join("\n"),
      ],
    );

    if (project.removeDemoFacilities.length) {
      await connection.query("DELETE FROM facilities WHERE project_id=? AND name IN (?)", [
        projectId,
        project.removeDemoFacilities,
      ]);
    }
    if (project.removeDemoHouses.length) {
      await connection.query("DELETE FROM house_types WHERE project_id=? AND name IN (?)", [
        projectId,
        project.removeDemoHouses,
      ]);
    }

    for (const [index, name] of project.facilities.entries()) {
      await connection.execute(
        `INSERT INTO facilities (id, project_id, name, description, sort_order)
         SELECT ?, ?, ?, 'ข้อมูลจากเว็บไซต์ทางการ MIDA Property', ?
         WHERE NOT EXISTS (SELECT 1 FROM facilities WHERE project_id=? AND LOWER(name)=LOWER(?))`,
        [randomUUID(), projectId, name, index + 1, projectId, name],
      );
    }

    for (const [name, description, bedrooms, bathrooms, area] of project.houses) {
      const [houseRows] = await connection.execute(
        "SELECT id FROM house_types WHERE project_id=? AND LOWER(name)=LOWER(?) LIMIT 1",
        [projectId, name],
      );
      if (houseRows.length) {
        await connection.execute(
          "UPDATE house_types SET description=?, bedrooms=?, bathrooms=?, usable_area_sqm=? WHERE id=?",
          [description, bedrooms, bathrooms, area, houseRows[0].id],
        );
      } else {
        await connection.execute(
          "INSERT INTO house_types (id, project_id, name, description, bedrooms, bathrooms, usable_area_sqm) VALUES (?, ?, ?, ?, ?, ?, ?)",
          [randomUUID(), projectId, name, description, bedrooms, bathrooms, area],
        );
      }
    }

    let addedImages = 0;
    for (const [index, [requestedKind, url]] of project.images.entries()) {
      let mediaKind = requestedKind;
      if (mediaKind === "cover") {
        const [coverRows] = await connection.execute(
          "SELECT id FROM media_assets WHERE entity_type='projects' AND entity_id=? AND media_kind='cover' LIMIT 1",
          [projectId],
        );
        if (coverRows.length) mediaKind = "hero";
      }

      const namePrefix = `official-${project.slug}-${String(index + 1).padStart(2, "0")}.`;
      const [existingRows] = await connection.execute(
        "SELECT id FROM media_assets WHERE entity_type='projects' AND entity_id=? AND original_name LIKE ? LIMIT 1",
        [projectId, `${namePrefix}%`],
      );
      if (existingRows.length) continue;

      const { buffer, mimeType, extension } = await downloadImage(url);
      const storageKey = `uploads/${randomUUID()}.${extension}`;
      const filePath = path.join(uploadsDirectory, path.basename(storageKey));
      await writeFile(filePath, buffer);
      createdFiles.push(filePath);
      await connection.execute(
        `INSERT INTO media_assets
           (id, entity_type, entity_id, media_kind, original_name, mime_type, file_size, storage_key, sort_order)
         VALUES (?, 'projects', ?, ?, ?, ?, ?, ?,
           (SELECT COALESCE(MAX(sort_order), -1) + 1 FROM
             (SELECT sort_order FROM media_assets WHERE entity_type='projects' AND entity_id=? AND media_kind=?) ordered_media))`,
        [
          randomUUID(),
          projectId,
          mediaKind,
          officialName(project.slug, index, extension),
          mimeType,
          buffer.length,
          storageKey,
          projectId,
          mediaKind,
        ],
      );
      addedImages += 1;
    }

    report.push(`${project.heroTitle}: เพิ่มรูป ${addedImages} รูป`);
  }

  await connection.commit();
  console.log(report.join("\n"));
  console.log(`จัดเก็บรูปใน ${uploadsDirectory}`);
} catch (error) {
  await connection.rollback();
  await Promise.all(createdFiles.map((file) => unlink(file).catch(() => undefined)));
  throw error;
} finally {
  await connection.end();
}
