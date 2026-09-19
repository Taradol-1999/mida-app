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

INSERT IGNORE INTO projects (id, slug, name_th, location, property_type, starting_price, status, description) VALUES
  ('4afb9476-3ab8-4e93-9010-6c2673cce301', 'mida-grand-nakhon-pathom', 'มิดาเรนท์ แกรนด์ นครปฐม', 'นครปฐม', 'DETACHED_HOUSE', 4590000.00, 'READY', 'บ้านเดี่ยวสำหรับครอบครัว'),
  ('197f0b10-90bf-4d9c-bdf9-6dc9c8444e06', 'mida-town-kamphaeng-saen', 'ไมด้า ทาวน์ กำแพงแสน', 'กำแพงแสน', 'TOWNHOME', 2390000.00, 'READY', 'ทาวน์โฮมทำเลกำแพงแสน');
