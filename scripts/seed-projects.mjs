import { prisma } from "./prisma.ts";

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
  await prisma.$transaction(async (database) => {
    for (const project of demoProjects) {
      const [latitude, longitude] = project.coordinates;
      const firstHouse = project.houses[0];
      const storedProject = await database.project.upsert({
        where: { slug: project.slug },
        create: {
          slug: project.slug,
          name_th: project.hero,
          location: project.slug.includes("khonkaen") ? "ขอนแก่น" : "นครปฐม",
          latitude,
          longitude,
          property_type: project.hero.toLowerCase().includes("town") ? "TOWNHOME" : "DETACHED_HOUSE",
          starting_price: firstHouse?.[4] ?? null,
          status: "READY",
          tags: ["โครงการล่าสุด"],
          description: project.subtitle,
        },
        update: {},
        include: { settings: true },
      });
      const projectId = storedProject.id;
      if (storedProject.latitude === null || storedProject.longitude === null) {
        await database.project.update({ where: { id: projectId }, data: { latitude, longitude } });
      }
      const defaults = {
        hero_title_th: project.hero,
        hero_subtitle_th: project.subtitle,
        phone: project.phone,
        email: "info@midaproperty.com",
        map_url: `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`,
        nearby_places_th: project.nearby.join("\n"),
        care_warranty:
          "ข้อมูลและระบบแจ้งซ่อมออนไลน์เกี่ยวกับการรับประกันโครงสร้างบ้าน และส่วนควบภายในตามระยะเวลาของโครงการ",
        care_maintenance: "คู่มือการใช้งานระบบสาธารณูปโภค ระบบไฟฟ้า ประปา และการจัดการขยะของโครงการอย่างถูกวิธี",
        care_common_area: "ช่องทางการติดต่อ กฎระเบียบหมู่บ้าน และการประสานงานกับนิติบุคคลเพื่อรักษาความสงบเรียบร้อย",
      };
      const current = storedProject.settings;
      await database.projectSetting.upsert({
        where: { project_id: projectId },
        create: { project_id: projectId, ...defaults },
        update: Object.fromEntries(Object.entries(defaults).map(([key, value]) => [key, current?.[key] || value])),
      });
      for (const [name, bedrooms, bathrooms, area, price] of project.houses) {
        const exists = await database.houseType.findFirst({ where: { project_id: projectId, name } });
        if (!exists)
          await database.houseType.create({
            data: {
              project_id: projectId,
              name,
              description: `แบบบ้านจำลอง ${name}`,
              bedrooms,
              bathrooms,
              usable_area_sqm: area,
              starting_price: price,
            },
          });
      }
      for (const [index, name] of project.facilities.entries()) {
        const exists = await database.facility.findFirst({ where: { project_id: projectId, name } });
        if (!exists)
          await database.facility.create({
            data: { project_id: projectId, name, description: "ข้อมูลสิ่งอำนวยความสะดวกจำลอง", sort_order: index + 1 },
          });
      }
      const promoTitle = `ข้อเสนอพิเศษ ${project.hero}`;
      if (!(await database.promotion.findFirst({ where: { project_id: projectId, title: promoTitle } })))
        await database.promotion.create({
          data: {
            project_id: projectId,
            title: promoTitle,
            body: "ข้อมูลโปรโมชันจำลอง โปรดตรวจสอบเงื่อนไขกับฝ่ายขาย",
            is_published: true,
          },
        });
      const newsTitle = `อัปเดตโครงการ ${project.hero}`;
      if (!(await database.newsItem.findFirst({ where: { project_id: projectId, title: newsTitle } })))
        await database.newsItem.create({
          data: {
            project_id: projectId,
            category: "NEWS",
            title: newsTitle,
            body: "ข่าวสารและความคืบหน้าของโครงการ",
            published_at: new Date(),
            is_published: true,
          },
        });
    }
  });
  console.log(`Seeded ${demoProjects.length} MIDA projects.`);
} catch (error) {
  throw error;
} finally {
  await prisma.$disconnect();
}
