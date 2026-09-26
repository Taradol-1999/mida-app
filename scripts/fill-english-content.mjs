import { prisma } from "./prisma.ts";

const projectTranslations = {
  "เดอะทาวน์ ขอนแก่น": {
    location: "Khon Kaen",
    description:
      "Modern homes and townhomes on Khon Kaen's bypass road, offering a peaceful green setting and convenient access to Khon Kaen University, the airport, and nearby amenities.",
  },
  "Grand Village เพชรเกษม": {
    location: "Nakhon Pathom",
    description:
      "Modern detached houses, semi-detached homes, and townhomes on Phetkasem Road. The 63-rai community offers efficient layouts and convenient access to Nakhon Pathom city.",
  },
  "Town Village Prapa": {
    location: "Nakhon Pathom",
    description:
      "A modern community of detached houses and townhomes with complete shared facilities near Phra Pathom Chedi in Nakhon Pathom.",
  },
  "Roipruksa Lakeville": {
    location: "Nakhon Pathom",
    description:
      "Spacious detached homes in a private lakeside setting, with a panoramic clubhouse and 24-hour security for peaceful everyday living.",
  },
  "THE CODE ลำพยา": {
    location: "Nakhon Pathom",
    description:
      "Modern two-storey detached and semi-detached homes with a clubhouse and generous shared spaces in Lamphaya, Nakhon Pathom.",
  },
};

const houseDescriptions = {
  Minor:
    "A modern Geometry-style detached home with balanced lines and versatile functions for every generation.",
  Mild:
    "A Nordic-inspired home with soft organic forms, calm lines, and practical spaces that welcome natural light.",
  TOWNHOME:
    "A premium modern townhome with flexible family spaces and convenient access to shared facilities.",
  "TOWNHOME PLUS": "A spacious modern townhome designed for comfortable everyday family living.",
  VANDA: "A spacious detached home with an airy layout and connected functions for larger families.",
  LAVENDER: "A detached home with well-defined spaces that connect indoor comfort with outdoor relaxation.",
  ASTER: "A compact detached home for starting families, complete with practical everyday functions.",
  "Home Office": "A home office designed to support both comfortable living and productive work.",
  "TYPE A": "A modern two-storey detached home designed for family living.",
  "TYPE B": "A spacious modern two-storey detached home with flexible family areas.",
  "TYPE C": "A two-storey detached home for families who need more living space.",
  "TYPE D": "A modern two-storey detached home with well-balanced functions for contemporary families.",
};

const facilityTranslations = [
  [/คลับ.*สระ.*เกลือ/, "Clubhouse and Saltwater Swimming Pool"],
  [/คลับ.*panorama/i, "Panoramic View Clubhouse"],
  [/คลับ/, "Clubhouse"],
  [/สระว่ายน้ำ/, "Swimming Pool"],
  [/สวนสาธารณะ/, "Public Park"],
  [/รปภ|รักษาความปลอดภัย/, "24-Hour Security and CCTV"],
  [/สนามเด็กเล่น/, "Children's Playground"],
  [/คิดส์|เด็ก/, "Kids Club"],
  [/ไฟ.*led/i, "LED Lighting Throughout the Development"],
  [/club\s*house.*salt/i, "Clubhouse and Saltwater Swimming Pool"],
  [/club\s*house.*panorama/i, "Panoramic View Clubhouse"],
  [/club\s*house/i, "Clubhouse"],
  [/fitness/i, "Fitness Center"],
  [/playground/i, "Children's Playground"],
  [/kids\s*club/i, "Kids Club"],
  [/cctv|24\s*hour|security/i, "24-Hour Security and CCTV"],
  [/lake.*pool|pool.*lake/i, "Lakeside Swimming Pool"],
  [/swimming|pool/i, "Swimming Pool"],
  [/park/i, "Public Park"],
  [/led/i, "LED Lighting Throughout the Development"],
];

function englishHouseDescription(name, thaiDescription) {
  return (
    houseDescriptions[name] ||
    (thaiDescription?.includes("ทาวน์โฮม")
      ? "A modern townhome designed for comfortable family living."
      : "A modern home designed for comfortable everyday family living.")
  );
}

function englishFacilityName(name) {
  const normalized = name.toLowerCase();
  return facilityTranslations.find(([pattern]) => pattern.test(normalized))?.[1] || "Project Facility";
}

function englishPromotionTitle(title) {
  if (title.includes("บ้านใหม่")) return "New Home, Ready to Decorate";
  if (title.includes("ข้อเสนอ")) return "Special Offer";
  return "Promotion and Special Offer";
}

function englishNewsTitle(title) {
  if (title.includes("อัปเดตโครงการ")) return "Project Update";
  if (title.includes("โปรโมชั่น") || title.includes("Flash")) return "Special Promotion";
  return "News and Project Update";
}

function onlyMissing(record, fields) {
  return Object.fromEntries(Object.entries(fields).filter(([key, value]) => value && !record[key]?.trim()));
}

async function main() {
  const [projects, houseTypes, facilities, promotions, newsItems, contentRows] = await Promise.all([
    prisma.project.findMany(),
    prisma.houseType.findMany(),
    prisma.facility.findMany(),
    prisma.promotion.findMany(),
    prisma.newsItem.findMany(),
    prisma.siteContent.findMany(),
  ]);

  let updated = 0;
  const operations = [];

  for (const project of projects) {
    const translation = projectTranslations[project.name] || {
      location: "Thailand",
      description: "A MIDA Property residential project designed for comfortable everyday living.",
    };
    const data = onlyMissing(project, {
      location_en: translation.location,
      description_en: translation.description,
    });
    if (Object.keys(data).length) {
      updated += Object.keys(data).length;
      operations.push(prisma.project.update({ where: { id: project.id }, data }));
    }
  }

  for (const houseType of houseTypes) {
    const data = onlyMissing(houseType, {
      name_en: houseType.name,
      description_en: englishHouseDescription(houseType.name, houseType.description),
    });
    if (Object.keys(data).length) {
      updated += Object.keys(data).length;
      operations.push(prisma.houseType.update({ where: { id: houseType.id }, data }));
    }
  }

  for (const facility of facilities) {
    const data = onlyMissing(facility, {
      name_en: englishFacilityName(facility.name),
      description_en: facility.description ? "Information from the official MIDA Property website." : null,
    });
    if (Object.keys(data).length) {
      updated += Object.keys(data).length;
      operations.push(prisma.facility.update({ where: { id: facility.id }, data }));
    }
  }

  for (const promotion of promotions) {
    const data = onlyMissing(promotion, {
      title_en: englishPromotionTitle(promotion.title),
      body_en: promotion.body ? "Special promotion details. Please contact the sales team to confirm the latest terms and conditions." : null,
    });
    if (Object.keys(data).length) {
      updated += Object.keys(data).length;
      operations.push(prisma.promotion.update({ where: { id: promotion.id }, data }));
    }
  }

  for (const newsItem of newsItems) {
    const data = onlyMissing(newsItem, {
      title_en: englishNewsTitle(newsItem.title),
      body_en: newsItem.body ? "Project news and updates from MIDA Property. Contact the sales team for further details." : null,
    });
    if (Object.keys(data).length) {
      updated += Object.keys(data).length;
      operations.push(prisma.newsItem.update({ where: { id: newsItem.id }, data }));
    }
  }

  for (const content of contentRows) {
    const isHero = content.key === "home_hero";
    const isContact = content.key === "contact";
    const data = onlyMissing(content, {
      title_en: isHero ? "A Place That Answers Every Definition of Home" : isContact ? "Contact MIDA Property" : "MIDA Property",
      body_en: isHero
        ? "Discover quality MIDA projects designed for happy living."
        : isContact
          ? "Contact MIDA Property for project information and assistance."
          : "MIDA Property information.",
    });
    if (Object.keys(data).length) {
      updated += Object.keys(data).length;
      operations.push(prisma.siteContent.update({ where: { id: content.id }, data }));
    }
  }

  await prisma.$transaction(operations);
  console.log(`Filled ${updated} missing English fields.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
