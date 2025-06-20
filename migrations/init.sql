-- Xóa tất cả các bảng nếu tồn tại
DROP TABLE IF EXISTS `users`;

DROP TABLE IF EXISTS `categories`;

DROP TABLE IF EXISTS `brands`;

DROP TABLE IF EXISTS `products`;

DROP TABLE IF EXISTS `product_inventories`;

DROP TABLE IF EXISTS `product_pricings`;

DROP TABLE IF EXISTS `product_identifiers`;

DROP TABLE IF EXISTS `product_metadata`;

DROP TABLE IF EXISTS `product_variants`;

DROP TABLE IF EXISTS `carts`;

-- Tạo bảng users
CREATE TABLE `users` (
    `id` int NOT NULL AUTO_INCREMENT,
    `email` varchar(255) NOT NULL,
    `password` varchar(255) NOT NULL,
    `full_name` varchar(255) NOT NULL,
    `phone` varchar(255) DEFAULT NULL,
    `avatar` varchar(255) DEFAULT NULL,
    `role` enum('admin', 'user') DEFAULT 'user',
    `status` enum(
        'active',
        'inactive',
        'banned'
    ) DEFAULT 'active',
    `is_verified` tinyint(1) DEFAULT '0',
    `provider` enum('local', 'google', 'facebook') DEFAULT 'local',
    `last_login` datetime DEFAULT NULL,
    `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `email` (`email`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

-- Tạo bảng categories
CREATE TABLE `categories` (
    `id` int NOT NULL AUTO_INCREMENT,
    `name` varchar(255) NOT NULL,
    `slug` varchar(255) NOT NULL,
    `description` text,
    `parent_id` int DEFAULT NULL,
    `status` enum('active', 'inactive') DEFAULT 'active',
    `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `slug` (`slug`),
    KEY `parent_id` (`parent_id`),
    CONSTRAINT `categories_ibfk_1` FOREIGN KEY (`parent_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

-- Tạo bảng brands
CREATE TABLE `brands` (
    `id` int NOT NULL AUTO_INCREMENT,
    `name` varchar(255) NOT NULL,
    `slug` varchar(255) NOT NULL,
    `description` text,
    `logo` varchar(255) DEFAULT NULL,
    `status` enum('active', 'inactive') DEFAULT 'active',
    `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `slug` (`slug`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

-- Tạo bảng products
CREATE TABLE `products` (
    `id` int NOT NULL AUTO_INCREMENT,
    `name` varchar(255) NOT NULL,
    `slug` varchar(255) NOT NULL,
    `description` text,
    `price` decimal(10, 2) NOT NULL,
    `sale_price` decimal(10, 2) DEFAULT NULL,
    `stock` int NOT NULL DEFAULT '0',
    `image_url` varchar(255) DEFAULT NULL,
    `category_id` int DEFAULT NULL,
    `brand_id` int DEFAULT NULL,
    `status` enum('active', 'inactive', 'draft') DEFAULT 'active',
    `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `slug` (`slug`),
    KEY `category_id` (`category_id`),
    KEY `brand_id` (`brand_id`),
    CONSTRAINT `products_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL,
    CONSTRAINT `products_ibfk_2` FOREIGN KEY (`brand_id`) REFERENCES `brands` (`id`) ON DELETE SET NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

-- Tạo bảng product_inventories
CREATE TABLE `product_inventories` (
    `id` int NOT NULL AUTO_INCREMENT,
    `product_id` int NOT NULL,
    `quantity` int NOT NULL DEFAULT '0',
    `low_stock_threshold` int DEFAULT '5',
    `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `product_id` (`product_id`),
    CONSTRAINT `product_inventories_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

-- Tạo bảng product_pricings
CREATE TABLE `product_pricings` (
    `id` int NOT NULL AUTO_INCREMENT,
    `product_id` int NOT NULL,
    `base_price` decimal(10, 2) NOT NULL,
    `sale_price` decimal(10, 2) DEFAULT NULL,
    `cost_price` decimal(10, 2) DEFAULT NULL,
    `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `product_id` (`product_id`),
    CONSTRAINT `product_pricings_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

-- Tạo bảng product_identifiers
CREATE TABLE `product_identifiers` (
    `id` int NOT NULL AUTO_INCREMENT,
    `product_id` int NOT NULL,
    `sku` varchar(255) NOT NULL,
    `barcode` varchar(255) DEFAULT NULL,
    `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `product_id` (`product_id`),
    UNIQUE KEY `sku` (`sku`),
    UNIQUE KEY `barcode` (`barcode`),
    CONSTRAINT `product_identifiers_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

-- Tạo bảng product_metadata
CREATE TABLE `product_metadata` (
    `id` int NOT NULL AUTO_INCREMENT,
    `product_id` int NOT NULL,
    `meta_title` varchar(255) DEFAULT NULL,
    `meta_description` text,
    `meta_keywords` varchar(255) DEFAULT NULL,
    `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `product_id` (`product_id`),
    CONSTRAINT `product_metadata_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

-- Tạo bảng product_variants
CREATE TABLE `product_variants` (
    `id` int NOT NULL AUTO_INCREMENT,
    `product_id` int NOT NULL,
    `sku` varchar(255) NOT NULL,
    `name` varchar(255) NOT NULL,
    `price` decimal(10, 2) NOT NULL,
    `sale_price` decimal(10, 2) DEFAULT NULL,
    `stock` int NOT NULL DEFAULT '0',
    `status` enum('active', 'inactive') DEFAULT 'active',
    `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `sku` (`sku`),
    KEY `product_id` (`product_id`),
    CONSTRAINT `product_variants_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

-- Tạo bảng carts
CREATE TABLE IF NOT EXISTS carts (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    selected BOOLEAN NOT NULL DEFAULT TRUE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_product (user_id, product_id)
);

-- Tạo bảng refresh_tokens
CREATE TABLE IF NOT EXISTS `refresh_tokens` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `token` VARCHAR(512) NOT NULL UNIQUE,
    `user_id` INT NOT NULL,
    `user_type` ENUM('user', 'employee') NOT NULL,
    `expires_at` DATETIME NOT NULL,
    `is_revoked` TINYINT(1) DEFAULT 0,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;