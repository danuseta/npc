-- -----------------------------------------------------
-- Schema npc_ecommerce
-- -----------------------------------------------------
CREATE SCHEMA IF NOT EXISTS `npc_ecommerce` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `npc_ecommerce`;

-- -----------------------------------------------------
-- Table `Users`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `Users` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `password` VARCHAR(255) NOT NULL,
  `phone` VARCHAR(20) NULL,
  `address` TEXT NULL,
  `city` VARCHAR(100) NULL,
  `state` VARCHAR(100) NULL,
  `zipCode` VARCHAR(20) NULL,
  `country` VARCHAR(100) NULL DEFAULT 'Indonesia',
  `role` ENUM('buyer', 'admin', 'superadmin') NOT NULL DEFAULT 'buyer',
  `profileImage` VARCHAR(255) NULL,
  `dateOfBirth` DATE NULL,
  `gender` ENUM('male', 'female', 'other', 'prefer_not_to_say') NULL,
  `isActive` BOOLEAN NOT NULL DEFAULT TRUE,
  `isEmailVerified` BOOLEAN NOT NULL DEFAULT FALSE,
  `emailVerificationToken` VARCHAR(255) NULL,
  `emailVerificationCode` VARCHAR(10) NULL,
  `emailVerificationExpire` DATETIME NULL,
  `resetPasswordToken` VARCHAR(255) NULL,
  `resetPasswordExpire` DATETIME NULL,
  `lastLogin` DATETIME NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `email_UNIQUE` (`email` ASC)
);

-- -----------------------------------------------------
-- Table `Categories`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `Categories` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(255) NOT NULL,
  `description` TEXT NULL,
  `imageUrl` VARCHAR(255) NULL,
  `isActive` BOOLEAN NOT NULL DEFAULT TRUE,
  `slug` VARCHAR(255) NULL,
  `parentId` INT NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `name_UNIQUE` (`name` ASC),
  UNIQUE INDEX `slug_UNIQUE` (`slug` ASC),
  INDEX `fk_Categories_Categories_idx` (`parentId` ASC),
  CONSTRAINT `fk_Categories_Categories`
    FOREIGN KEY (`parentId`)
    REFERENCES `Categories` (`id`)
    ON DELETE SET NULL
    ON UPDATE CASCADE
);

-- -----------------------------------------------------
-- Table `Products`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `Products` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(255) NOT NULL,
  `description` TEXT NULL,
  `price` DECIMAL(10,2) NOT NULL,
  `stock` INT NOT NULL DEFAULT 0,
  `imageUrl` VARCHAR(255) NULL,
  `imagePublicId` VARCHAR(255) NULL,
  `gallery` TEXT NULL COMMENT 'JSON array of image URLs and public IDs',
  `sku` VARCHAR(100) NULL,
  `isActive` BOOLEAN NOT NULL DEFAULT TRUE,
  `weight` FLOAT NULL,
  `dimensions` VARCHAR(100) NULL,
  `categoryId` INT NULL,
  `discountPercentage` FLOAT NULL DEFAULT 0,
  `featured` BOOLEAN NOT NULL DEFAULT FALSE,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `sku_UNIQUE` (`sku` ASC),
  INDEX `fk_Products_Categories_idx` (`categoryId` ASC),
  CONSTRAINT `fk_Products_Categories`
    FOREIGN KEY (`categoryId`)
    REFERENCES `Categories` (`id`)
    ON DELETE SET NULL
    ON UPDATE CASCADE
);

-- -----------------------------------------------------
-- Table `Carts`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `Carts` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `userId` INT NOT NULL,
  `totalItems` INT NOT NULL DEFAULT 0,
  `totalPrice` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `lastUpdated` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `userId_UNIQUE` (`userId` ASC),
  CONSTRAINT `fk_Carts_Users`
    FOREIGN KEY (`userId`)
    REFERENCES `Users` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE
);

-- -----------------------------------------------------
-- Table `CartItems`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `CartItems` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `cartId` INT NOT NULL,
  `productId` INT NOT NULL,
  `quantity` INT NOT NULL DEFAULT 1,
  `price` DECIMAL(10,2) NOT NULL COMMENT 'Price at the time of adding to cart',
  `totalPrice` DECIMAL(10,2) NOT NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `cartId_productId_UNIQUE` (`cartId` ASC, `productId` ASC),
  INDEX `fk_CartItems_Products_idx` (`productId` ASC),
  CONSTRAINT `fk_CartItems_Carts`
    FOREIGN KEY (`cartId`)
    REFERENCES `Carts` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT `fk_CartItems_Products`
    FOREIGN KEY (`productId`)
    REFERENCES `Products` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE
);

-- -----------------------------------------------------
-- Table `Orders`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `Orders` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `userId` INT NOT NULL,
  `orderNumber` VARCHAR(50) NOT NULL,
  `status` ENUM('pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded') NOT NULL DEFAULT 'pending',
  `totalAmount` DECIMAL(10,2) NOT NULL,
  `tax` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `shippingFee` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `grandTotal` DECIMAL(10,2) NOT NULL,
  `shippingAddress` TEXT NOT NULL,
  `paymentMethod` ENUM('credit_card', 'debit_card', 'bank_transfer', 'e_wallet', 'cash_on_delivery') NOT NULL DEFAULT 'cash_on_delivery',
  `paymentStatus` ENUM('pending', 'paid', 'failed', 'refunded') NOT NULL DEFAULT 'pending',
  `notes` TEXT NULL,
  `trackingNumber` VARCHAR(100) NULL,
  `estimatedDelivery` DATETIME NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `orderNumber_UNIQUE` (`orderNumber` ASC),
  INDEX `fk_Orders_Users_idx` (`userId` ASC),
  CONSTRAINT `fk_Orders_Users`
    FOREIGN KEY (`userId`)
    REFERENCES `Users` (`id`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE
);

-- -----------------------------------------------------
-- Table `OrderItems`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `OrderItems` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `orderId` INT NOT NULL,
  `productId` INT NOT NULL,
  `quantity` INT NOT NULL,
  `price` DECIMAL(10,2) NOT NULL COMMENT 'Price at the time of order',
  `totalPrice` DECIMAL(10,2) NOT NULL,
  `productName` VARCHAR(255) NOT NULL COMMENT 'Product name at the time of order',
  `productSku` VARCHAR(100) NULL COMMENT 'Product SKU at the time of order',
  `discountAmount` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `fk_OrderItems_Orders_idx` (`orderId` ASC),
  INDEX `fk_OrderItems_Products_idx` (`productId` ASC),
  CONSTRAINT `fk_OrderItems_Orders`
    FOREIGN KEY (`orderId`)
    REFERENCES `Orders` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT `fk_OrderItems_Products`
    FOREIGN KEY (`productId`)
    REFERENCES `Products` (`id`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE
);

-- -----------------------------------------------------
-- Table `Payments`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `Payments` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `orderId` INT NOT NULL,
  `amount` DECIMAL(10,2) NOT NULL,
  `method` ENUM('credit_card', 'debit_card', 'bank_transfer', 'e_wallet', 'cash_on_delivery') NOT NULL,
  `status` ENUM('pending', 'completed', 'failed', 'refunded') NOT NULL DEFAULT 'pending',
  `transactionId` VARCHAR(255) NULL COMMENT 'External payment gateway transaction ID',
  `paymentDate` DATETIME NULL,
  `gatewayResponse` TEXT NULL COMMENT 'Response from payment gateway',
  `receiptUrl` VARCHAR(255) NULL,
  `refundAmount` DECIMAL(10,2) NULL,
  `refundDate` DATETIME NULL,
  `refundReason` TEXT NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `orderId_UNIQUE` (`orderId` ASC),
  CONSTRAINT `fk_Payments_Orders`
    FOREIGN KEY (`orderId`)
    REFERENCES `Orders` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE
);

-- -----------------------------------------------------
-- Table `Reviews`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `Reviews` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `userId` INT NOT NULL,
  `productId` INT NOT NULL,
  `orderId` INT NULL COMMENT 'Optional reference to the order where this product was purchased',
  `rating` INT NOT NULL,
  `title` VARCHAR(255) NULL,
  `comment` TEXT NULL,
  `images` TEXT NULL COMMENT 'JSON array of image URLs and public IDs',
  `isVerifiedPurchase` BOOLEAN NOT NULL DEFAULT FALSE,
  `isRecommended` BOOLEAN NOT NULL DEFAULT TRUE,
  `helpfulCount` INT NOT NULL DEFAULT 0,
  `reportCount` INT NOT NULL DEFAULT 0,
  `isActive` BOOLEAN NOT NULL DEFAULT TRUE,
  `adminResponse` TEXT NULL,
  `adminResponseDate` DATETIME NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `userId_productId_UNIQUE` (`userId` ASC, `productId` ASC),
  INDEX `fk_Reviews_Products_idx` (`productId` ASC),
  INDEX `fk_Reviews_Orders_idx` (`orderId` ASC),
  CONSTRAINT `fk_Reviews_Users`
    FOREIGN KEY (`userId`)
    REFERENCES `Users` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT `fk_Reviews_Products`
    FOREIGN KEY (`productId`)
    REFERENCES `Products` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT `fk_Reviews_Orders`
    FOREIGN KEY (`orderId`)
    REFERENCES `Orders` (`id`)
    ON DELETE SET NULL
    ON UPDATE CASCADE
);

-- -----------------------------------------------------
-- Table `EmailVerifications`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `EmailVerifications` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `userId` INT NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `code` VARCHAR(10) NOT NULL,
  `expiresAt` DATETIME NOT NULL,
  `isUsed` BOOLEAN NOT NULL DEFAULT FALSE,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `fk_EmailVerifications_Users_idx` (`userId` ASC),
  CONSTRAINT `fk_EmailVerifications_Users`
    FOREIGN KEY (`userId`)
    REFERENCES `Users` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE
);


CREATE TABLE IF NOT EXISTS `SystemLogs` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `level` ENUM('INFO', 'WARNING', 'ERROR') NOT NULL DEFAULT 'INFO',
  `message` TEXT NOT NULL,
  `source` VARCHAR(100) NULL,
  `userId` INT NULL,
  `metadata` TEXT NULL COMMENT 'JSON string with additional details',
  `ipAddress` VARCHAR(45) NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `fk_SystemLogs_Users_idx` (`userId` ASC),
  CONSTRAINT `fk_SystemLogs_Users`
    FOREIGN KEY (`userId`)
    REFERENCES `Users` (`id`)
    ON DELETE SET NULL
    ON UPDATE CASCADE
);


CREATE TABLE IF NOT EXISTS `AdminActivities` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `userId` INT NOT NULL,
  `action` VARCHAR(100) NOT NULL,
  `details` TEXT NULL,
  `entityType` VARCHAR(50) NULL COMMENT 'Type of entity affected (product, order, user, etc.)',
  `entityId` INT NULL COMMENT 'ID of the entity affected',
  `ipAddress` VARCHAR(45) NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `fk_AdminActivities_Users_idx` (`userId` ASC),
  CONSTRAINT `fk_AdminActivities_Users`
    FOREIGN KEY (`userId`)
    REFERENCES `Users` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE
);



CREATE TABLE IF NOT EXISTS `SystemSettings` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `settingGroup` VARCHAR(50) NOT NULL,
  `settingKey` VARCHAR(100) NOT NULL,
  `settingValue` TEXT NULL,
  `valueType` ENUM('string', 'number', 'boolean', 'json', 'array') NOT NULL DEFAULT 'string',
  `description` VARCHAR(255) NULL,
  `createdBy` INT NULL,
  `updatedBy` INT NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `settingKey_UNIQUE` (`settingKey` ASC),
  INDEX `fk_SystemSettings_Users1_idx` (`createdBy` ASC),
  INDEX `fk_SystemSettings_Users2_idx` (`updatedBy` ASC),
  CONSTRAINT `fk_SystemSettings_Users1`
    FOREIGN KEY (`createdBy`)
    REFERENCES `Users` (`id`)
    ON DELETE SET NULL
    ON UPDATE CASCADE,
  CONSTRAINT `fk_SystemSettings_Users2`
    FOREIGN KEY (`updatedBy`)
    REFERENCES `Users` (`id`)
    ON DELETE SET NULL
    ON UPDATE CASCADE
);


ALTER TABLE `Users`
  ADD COLUMN `department` VARCHAR(100) NULL AFTER `role`,
  ADD COLUMN `permissions` TEXT NULL COMMENT 'JSON string of user permissions',
  ADD COLUMN `ordersProcessed` INT NULL DEFAULT 0,
  ADD COLUMN `responseTime` FLOAT NULL DEFAULT 0;