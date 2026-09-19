CREATE DATABASE IF NOT EXISTS mida_app
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE mida_app;

CREATE TABLE IF NOT EXISTS users (
  id CHAR(36) PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(190) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('SUPER_ADMIN', 'ADMIN', 'USER') NOT NULL DEFAULT 'USER',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS projects (
  id CHAR(36) PRIMARY KEY,
  slug VARCHAR(150) NOT NULL UNIQUE,
  name_th VARCHAR(255) NOT NULL,
  name_en VARCHAR(255) NULL,
  location VARCHAR(120) NOT NULL,
  property_type ENUM('DETACHED_HOUSE', 'SEMI_DETACHED', 'TOWNHOME', 'COMMERCIAL') NOT NULL,
  starting_price DECIMAL(12,2) NULL,
  status ENUM('READY', 'CONSTRUCTION', 'ARCHIVED') NOT NULL DEFAULT 'CONSTRUCTION',
  description TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS house_types (
  id CHAR(36) PRIMARY KEY,
  project_id CHAR(36) NOT NULL,
  name VARCHAR(255) NOT NULL,
  bedrooms TINYINT UNSIGNED NULL,
  bathrooms TINYINT UNSIGNED NULL,
  usable_area_sqm DECIMAL(8,2) NULL,
  starting_price DECIMAL(12,2) NULL,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS facilities (
  id CHAR(36) PRIMARY KEY,
  project_id CHAR(36) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS promotions (
  id CHAR(36) PRIMARY KEY,
  project_id CHAR(36) NULL,
  title VARCHAR(255) NOT NULL,
  body TEXT NULL,
  starts_at DATETIME NULL,
  ends_at DATETIME NULL,
  is_published BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS news_items (
  id CHAR(36) PRIMARY KEY,
  project_id CHAR(36) NULL,
  category ENUM('NEWS', 'EVENT') NOT NULL DEFAULT 'NEWS',
  title VARCHAR(255) NOT NULL,
  body TEXT NULL,
  published_at DATETIME NULL,
  is_published BOOLEAN NOT NULL DEFAULT FALSE,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS leads (
  id CHAR(36) PRIMARY KEY,
  project_id CHAR(36) NULL,
  name VARCHAR(120) NOT NULL,
  phone VARCHAR(30) NOT NULL,
  email VARCHAR(190) NULL,
  age_range VARCHAR(50) NULL,
  occupation VARCHAR(120) NULL,
  budget VARCHAR(80) NULL,
  status ENUM('NEW', 'CONTACTED', 'QUALIFIED', 'CLOSED') NOT NULL DEFAULT 'NEW',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL,
  INDEX idx_leads_created_at (created_at),
  INDEX idx_leads_project_id (project_id)
);

CREATE TABLE IF NOT EXISTS page_views (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  project_id CHAR(36) NULL,
  path VARCHAR(255) NOT NULL,
  session_key VARCHAR(100) NULL,
  duration_seconds INT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL,
  INDEX idx_page_views_created_at (created_at)
);

CREATE TABLE IF NOT EXISTS site_content (
  id CHAR(36) PRIMARY KEY,
  content_key VARCHAR(100) NOT NULL UNIQUE,
  title VARCHAR(255) NOT NULL,
  body TEXT NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Image files uploaded by administrators. Files are stored locally in public/uploads;
-- MySQL keeps only their metadata and ownership, never an external URL.
CREATE TABLE IF NOT EXISTS media_assets (
  id CHAR(36) PRIMARY KEY,
  entity_type VARCHAR(40) NOT NULL,
  entity_id CHAR(36) NOT NULL,
  media_kind VARCHAR(40) NOT NULL DEFAULT 'cover',
  original_name VARCHAR(255) NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  file_size INT UNSIGNED NOT NULL,
  storage_key VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_media_entity_kind (entity_type, entity_id, media_kind),
  INDEX idx_media_entity (entity_type, entity_id)
);

-- Public-project sample data based on midaproperty.com, captured 2026-09-19.
-- Prices, availability, and marketing terms must be confirmed before public use.
INSERT INTO projects (id, slug, name_th, location, property_type, starting_price, status, description) VALUES
  ('dba6db65-f538-49d0-aac8-47cd977ed001', 'grand-village-petchkasem', 'Grand Village เพชรเกษม', 'นครปฐม', 'DETACHED_HOUSE', 2500000.00, 'READY', 'บ้านเดี่ยวและทาวน์โฮมสไตล์โมเดิร์นบนทำเลใกล้เมืองนครปฐม'),
  ('dba6db65-f538-49d0-aac8-47cd977ed002', 'town-village-prapa', 'Town Village Prapa', 'นครปฐม', 'TOWNHOME', 2159000.00, 'READY', 'โครงการบ้านและทาวน์โฮมสไตล์โมเดิร์น บนทำเลฝั่งเมืองนครปฐม'),
  ('dba6db65-f538-49d0-aac8-47cd977ed003', 'roipruksa-lakeville', 'Roipruksa Lakeville', 'นครปฐม', 'DETACHED_HOUSE', 5290000.00, 'READY', 'บ้านเดี่ยวบรรยากาศริมทะเลสาบส่วนตัว พร้อมพื้นที่พักผ่อนสำหรับครอบครัว'),
  ('dba6db65-f538-49d0-aac8-47cd977ed004', 'the-code-lamphaya', 'THE CODE ลำพยา', 'นครปฐม', 'DETACHED_HOUSE', 3000000.00, 'CONSTRUCTION', 'บ้านสไตล์โมเดิร์นที่ออกแบบเพื่อทุกจังหวะการใช้ชีวิต บนทำเลลำพยา')
ON DUPLICATE KEY UPDATE name_th = VALUES(name_th), location = VALUES(location), property_type = VALUES(property_type), starting_price = VALUES(starting_price), status = VALUES(status), description = VALUES(description);

INSERT IGNORE INTO house_types (id, project_id, name, bedrooms, bathrooms, usable_area_sqm, starting_price) VALUES
  ('dba6db65-f538-49d0-aac8-47cd977ed101', 'dba6db65-f538-49d0-aac8-47cd977ed002', 'TOWNHOME', 3, 2, 120.00, 2159000.00),
  ('dba6db65-f538-49d0-aac8-47cd977ed102', 'dba6db65-f538-49d0-aac8-47cd977ed003', 'TYPE A', 3, 3, 171.00, 5290000.00),
  ('dba6db65-f538-49d0-aac8-47cd977ed103', 'dba6db65-f538-49d0-aac8-47cd977ed003', 'TYPE B', 4, 4, 230.00, 5290000.00);

INSERT IGNORE INTO facilities (id, project_id, name, description, sort_order) VALUES
  ('dba6db65-f538-49d0-aac8-47cd977ed201', 'dba6db65-f538-49d0-aac8-47cd977ed001', 'Clubhouse และสระว่ายน้ำระบบเกลือ', 'ข้อมูลตัวอย่างจากหน้าโครงการ', 1),
  ('dba6db65-f538-49d0-aac8-47cd977ed202', 'dba6db65-f538-49d0-aac8-47cd977ed001', 'Fitness Center', 'ข้อมูลตัวอย่างจากหน้าโครงการ', 2),
  ('dba6db65-f538-49d0-aac8-47cd977ed203', 'dba6db65-f538-49d0-aac8-47cd977ed003', 'Club House รับวิว Panorama', 'ข้อมูลตัวอย่างจากหน้าโครงการ', 1),
  ('dba6db65-f538-49d0-aac8-47cd977ed204', 'dba6db65-f538-49d0-aac8-47cd977ed004', 'Kids Club', 'ข้อมูลตัวอย่างจากหน้าโครงการ', 1);

INSERT IGNORE INTO promotions (id, project_id, title, body, is_published) VALUES
  ('dba6db65-f538-49d0-aac8-47cd977ed301', 'dba6db65-f538-49d0-aac8-47cd977ed002', 'บ้านใหม่ พร้อมตกแต่ง', 'ข้อมูลจำลองสำหรับแสดงผลในระบบหลังบ้าน', TRUE),
  ('dba6db65-f538-49d0-aac8-47cd977ed302', 'dba6db65-f538-49d0-aac8-47cd977ed004', 'ข้อเสนอสำหรับบ้านใหม่', 'ข้อมูลจำลองสำหรับแสดงผลในระบบหลังบ้าน', TRUE);

INSERT IGNORE INTO site_content (id, content_key, title, body) VALUES
  ('dba6db65-f538-49d0-aac8-47cd977ed401', 'home_hero', 'พื้นที่ที่ตอบทุกนิยามของคำว่าบ้าน', 'ค้นพบโครงการคุณภาพจาก MIDA ที่ออกแบบเพื่อการอยู่อาศัยอย่างมีความสุข'),
  ('dba6db65-f538-49d0-aac8-47cd977ed402', 'contact', 'ติดต่อ MIDA Property', 'โทร 02-000-0000 · Line @midaagency');
