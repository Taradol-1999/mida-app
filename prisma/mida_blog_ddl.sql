CREATE TABLE IF NOT EXISTS `mida_blog_items` (
  `id` CHAR(36) NOT NULL,
  `name_th` VARCHAR(255) NOT NULL,
  `name_en` VARCHAR(255) NULL,
  `description_th` TEXT NULL,
  `description_en` TEXT NULL,
  `website_url` TEXT NULL,
  `sort_order` INT NOT NULL DEFAULT 0,
  `is_active` BOOLEAN NOT NULL DEFAULT TRUE,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_mida_blog_active_sort` (`is_active`, `sort_order`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT='บทความส่วนกลางสำหรับ Blog หน้าแรก แยกจากข่าวโครงการ';
