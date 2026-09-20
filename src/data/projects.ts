export type Project = {
  id?: string;
  slug: string;
  name: string;
  location: string;
  latitude?: number | null;
  longitude?: number | null;
  type: "บ้านเดี่ยว" | "บ้านแฝด" | "ทาวน์โฮม" | "อาคารพาณิชย์";
  price: string;
  startingPrice: number;
  status: "พร้อมอยู่" | "กำลังก่อสร้าง";
  label: string;
  description: string;
  facilities: string[];
  landmarks: string[];
  has_cover?: boolean | number;
  has_brochure?: boolean | number;
  is_featured?: boolean | number;
  is_new?: boolean | number;
  tags?: string[] | string;
};

// Sample catalogue based on public information from midaproperty.com.
// Verify prices, availability, and terms with the sales team before publishing.
export const projects: Project[] = [
  {
    slug: "grand-village-petchkasem",
    name: "Grand Village เพชรเกษม",
    location: "นครปฐม",
    latitude: 13.8199,
    longitude: 100.0373,
    type: "บ้านเดี่ยว",
    price: "2.5 ล้านบาท*",
    startingPrice: 2500000,
    status: "พร้อมอยู่",
    label: "RECOMMENDED",
    description: "บ้านเดี่ยวและทาวน์โฮมสไตล์โมเดิร์นบนทำเลใกล้เมืองนครปฐม",
    facilities: ["คลับเฮาส์และสระว่ายน้ำระบบเกลือ", "Fitness Center", "สวนสาธารณะ", "รปภ. และ CCTV 24 ชั่วโมง"],
    landmarks: ["เมกาโฮม 100 ม.", "Makro 1.5 กม.", "มหาวิทยาลัยศิลปากร 7 กม.", "เซ็นทรัลนครปฐม 10 กม."],
  },
  {
    slug: "town-village-prapa",
    name: "Town Village Prapa",
    location: "นครปฐม",
    latitude: 13.8335,
    longitude: 100.0575,
    type: "ทาวน์โฮม",
    price: "2.159 ล้านบาท*",
    startingPrice: 2159000,
    status: "พร้อมอยู่",
    label: "NEW",
    description: "โครงการบ้านและทาวน์โฮมสไตล์โมเดิร์น บนทำเลฝั่งเมืองนครปฐม",
    facilities: ["คลับเฮาส์และสระว่ายน้ำระบบเกลือ", "Fitness Center", "สวนสาธารณะ", "รปภ. และ CCTV 24 ชั่วโมง"],
    landmarks: [
      "องค์พระปฐมเจดีย์ 3.7 กม.",
      "โรงพยาบาลนครปฐม 5.1 กม.",
      "มหาวิทยาลัยราชภัฏนครปฐม 5.7 กม.",
      "Lotus 6.5 กม.",
    ],
  },
  {
    slug: "roipruksa-lakeville",
    name: "Roipruksa Lakeville",
    location: "นครปฐม",
    latitude: 13.7985,
    longitude: 100.034,
    type: "บ้านเดี่ยว",
    price: "5.29 ล้านบาท*",
    startingPrice: 5290000,
    status: "พร้อมอยู่",
    label: "LAKE VIEW",
    description: "บ้านเดี่ยวบรรยากาศริมทะเลสาบส่วนตัว พร้อมพื้นที่พักผ่อนสำหรับครอบครัว",
    facilities: ["Club House รับวิว Panorama", "สระว่ายน้ำ", "Fitness Center", "สวนสาธารณะขนาดใหญ่"],
    landmarks: [
      "องค์พระปฐมเจดีย์ 4.4 กม.",
      "มหาวิทยาลัยศิลปากร 5 กม.",
      "โรงพยาบาลนครปฐม 5.2 กม.",
      "ถนนเพชรเกษม 7.5 กม.",
    ],
  },
  {
    slug: "the-code-lamphaya",
    name: "THE CODE ลำพยา",
    location: "นครปฐม",
    latitude: 13.8234,
    longitude: 100.0449,
    type: "บ้านเดี่ยว",
    price: "3 - 6 ล้านบาท*",
    startingPrice: 3000000,
    status: "กำลังก่อสร้าง",
    label: "FEATURED",
    description: "บ้านสไตล์โมเดิร์นที่ออกแบบเพื่อทุกจังหวะการใช้ชีวิต บนทำเลลำพยา",
    facilities: ["Club House", "สระว่ายน้ำระบบเกลือ", "Fitness Center", "Kids Club และ CCTV 24 ชั่วโมง"],
    landmarks: ["มหาวิทยาลัยศิลปากร", "มหาวิทยาลัยราชภัฏนครปฐม", "โรงพยาบาลกรุงเทพสนามจันทร์", "โรงเรียนราชินี"],
  },
];

export function findProject(slug: string) {
  return projects.find((project) => project.slug === slug);
}
