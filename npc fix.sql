-- phpMyAdmin SQL Dump
-- version 5.2.2
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Generation Time: May 25, 2025 at 11:00 PM
-- Server version: 8.0.41-cll-lve
-- PHP Version: 8.3.20

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `npc_ecommerce`
--

-- --------------------------------------------------------

--
-- Table structure for table `AdminActivities`
--

CREATE TABLE `AdminActivities` (
  `id` int NOT NULL,
  `userId` int NOT NULL,
  `action` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `details` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `entityType` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Type of entity affected (product, order, user, etc.)',
  `entityId` int DEFAULT NULL COMMENT 'ID of the entity affected',
  `ipAddress` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `AdminActivities`
--

INSERT INTO `AdminActivities` (`id`, `userId`, `action`, `details`, `entityType`, `entityId`, `ipAddress`, `createdAt`, `updatedAt`) VALUES
(1, 4, 'DEACTIVATE_ADMIN', 'Deactivated admin: Administrator (admin@npc.com)', 'User', 5, '::1', '2025-05-02 14:29:54', '2025-05-02 14:29:54'),
(2, 4, 'ACTIVATE_ADMIN', 'Activated admin: Administrator (admin@npc.com)', 'User', 5, '::1', '2025-05-02 14:30:09', '2025-05-02 14:30:09');

-- --------------------------------------------------------

--
-- Table structure for table `Carousels`
--

CREATE TABLE `Carousels` (
  `id` int NOT NULL,
  `title` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `tag` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Small tag/label shown above the title (e.g., "New Arrival", "Limited Offer")',
  `buttonText` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'Shop Now',
  `buttonLink` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT '/products',
  `imageUrl` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `imagePublicId` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Cloudinary public ID for image',
  `displayOrder` int NOT NULL DEFAULT '0' COMMENT 'Order in which slides are displayed (0 being first)',
  `isActive` tinyint(1) NOT NULL DEFAULT '1',
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `Carousels`
--

INSERT INTO `Carousels` (`id`, `title`, `description`, `tag`, `buttonText`, `buttonLink`, `imageUrl`, `imagePublicId`, `displayOrder`, `isActive`, `createdAt`, `updatedAt`) VALUES
(1, 'NPC Nusantara Store', '', 'Opening', 'Shop Now', '/products', 'https://res.cloudinary.com/dror0oa3z/image/upload/v1745082595/carousel/image-1745082590719-566077433_h3ksnj.png', 'carousel/image-1745082590719-566077433_h3ksnj', 0, 1, '2025-04-19 17:09:56', '2025-05-22 20:04:10'),
(2, 'Diskon', '', 'Sale', 'Shop Now', '/products', 'https://res.cloudinary.com/dror0oa3z/image/upload/v1745086881/carousel/image-1745086877519-366038271_zy1pk0.png', 'carousel/image-1745086877519-366038271_zy1pk0', 0, 1, '2025-04-19 18:21:23', '2025-05-04 19:06:59'),
(3, 'tester', '', 'New', 'Shop Now', '/products', 'https://res.cloudinary.com/dror0oa3z/image/upload/v1745092122/carousel/image-1745092117470-274702347_qdbhvh.png', 'carousel/image-1745092117470-274702347_qdbhvh', 0, 1, '2025-04-19 18:33:06', '2025-04-19 19:48:45'),
(4, 'AMD RX 9070', '', '', 'Shop Now', '/products', 'https://res.cloudinary.com/dror0oa3z/image/upload/v1746388055/carousel/image-1746388048688-788372691_qqeepd.png', 'carousel/image-1746388048688-788372691_qqeepd', 0, 1, '2025-05-04 19:47:34', '2025-05-04 19:47:34'),
(5, 'AMD Series', '', '', 'Shop Now', '/products', 'https://res.cloudinary.com/dror0oa3z/image/upload/v1746388192/carousel/image-1746388188069-364199356_oqtapv.jpg', 'carousel/image-1746388188069-364199356_oqtapv', 0, 1, '2025-05-04 19:49:50', '2025-05-04 19:49:50');

-- --------------------------------------------------------

--
-- Table structure for table `CartItems`
--

CREATE TABLE `CartItems` (
  `id` int NOT NULL,
  `cartId` int NOT NULL,
  `productId` int NOT NULL,
  `quantity` int NOT NULL DEFAULT '1',
  `price` decimal(10,2) NOT NULL COMMENT 'Price at the time of adding to cart',
  `totalPrice` decimal(10,2) NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `CartItems`
--

INSERT INTO `CartItems` (`id`, `cartId`, `productId`, `quantity`, `price`, `totalPrice`, `createdAt`, `updatedAt`) VALUES
(97, 5, 17, 1, 1200000.00, 1200000.00, '2025-05-25 13:52:43', '2025-05-25 13:52:43');

-- --------------------------------------------------------

--
-- Table structure for table `Carts`
--

CREATE TABLE `Carts` (
  `id` int NOT NULL,
  `userId` int NOT NULL,
  `totalItems` int DEFAULT '0',
  `totalPrice` decimal(10,2) DEFAULT '0.00',
  `lastUpdated` datetime DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `Carts`
--

INSERT INTO `Carts` (`id`, `userId`, `totalItems`, `totalPrice`, `lastUpdated`, `createdAt`, `updatedAt`) VALUES
(5, 2, 1, 1200000.00, '2025-05-25 14:12:04', '2025-05-22 20:50:32', '2025-05-25 14:12:04');

-- --------------------------------------------------------

--
-- Table structure for table `Categories`
--

CREATE TABLE `Categories` (
  `id` int NOT NULL,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `imageUrl` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `isActive` tinyint(1) DEFAULT '1',
  `slug` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `parentId` int DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `Categories`
--

INSERT INTO `Categories` (`id`, `name`, `description`, `imageUrl`, `isActive`, `slug`, `parentId`, `createdAt`, `updatedAt`) VALUES
(1, 'PC', NULL, NULL, 1, 'pc', NULL, '2025-04-05 16:29:04', '2025-04-05 16:29:04'),
(2, 'Graphics', NULL, NULL, 1, 'graphics', NULL, '2025-04-09 16:36:01', '2025-04-19 18:36:24'),
(3, 'Mouse', NULL, NULL, 1, 'mouse', NULL, '2025-04-19 18:59:15', '2025-04-19 18:59:15'),
(4, 'RAM', NULL, NULL, 1, 'ram', NULL, '2025-04-19 20:49:59', '2025-04-19 20:54:57'),
(5, 'Monitor', NULL, NULL, 1, 'monitor', NULL, '2025-04-19 20:56:46', '2025-04-19 20:56:46'),
(6, 'Laptop', NULL, NULL, 1, 'laptop', NULL, '2025-04-19 21:02:07', '2025-04-19 21:02:07'),
(7, 'CPU', NULL, NULL, 1, 'cpu', NULL, '2025-04-19 21:02:22', '2025-04-19 21:02:22'),
(8, 'Motherboard', NULL, NULL, 1, 'motherboard', NULL, '2025-04-19 21:02:40', '2025-04-19 21:02:40'),
(9, 'Storage', NULL, NULL, 1, 'storage', NULL, '2025-04-19 21:02:58', '2025-04-19 21:02:58'),
(10, 'PSU', NULL, NULL, 1, 'psu', NULL, '2025-04-19 21:03:02', '2025-04-19 21:03:02'),
(11, 'Fan', NULL, NULL, 1, 'fan', NULL, '2025-04-19 21:03:06', '2025-04-19 21:03:18'),
(12, 'Case', NULL, NULL, 1, 'case', NULL, '2025-04-19 21:03:13', '2025-04-19 21:03:13'),
(13, 'Headset', NULL, NULL, 1, 'headset', NULL, '2025-04-19 21:03:33', '2025-04-19 21:03:33'),
(14, 'Mic', NULL, NULL, 1, 'mic', NULL, '2025-04-19 21:03:37', '2025-04-19 21:03:37'),
(15, 'Webcam', NULL, NULL, 1, 'webcam', NULL, '2025-04-19 21:03:41', '2025-04-19 21:03:41'),
(16, 'Speaker', NULL, NULL, 1, 'speaker', NULL, '2025-04-19 21:03:46', '2025-04-19 21:03:46'),
(17, 'Joystick', NULL, NULL, 1, 'joystick', NULL, '2025-04-19 21:03:53', '2025-04-19 21:03:53'),
(18, 'Chair', NULL, NULL, 1, 'chair', NULL, '2025-04-19 21:03:57', '2025-04-19 21:03:57'),
(19, 'Server', NULL, NULL, 1, 'server', NULL, '2025-04-19 21:08:51', '2025-04-19 21:08:51'),
(20, 'LAN', NULL, NULL, 1, 'lan', NULL, '2025-04-19 21:09:11', '2025-04-19 21:09:11'),
(21, 'Wifi', NULL, NULL, 1, 'wifi', NULL, '2025-04-19 21:09:21', '2025-04-19 21:09:21'),
(22, 'Cable', NULL, NULL, 1, 'cable', NULL, '2025-04-19 21:09:27', '2025-04-19 21:09:27'),
(23, 'Card Reader', NULL, NULL, 1, 'card-reader', NULL, '2025-04-19 21:09:31', '2025-04-19 21:09:31'),
(24, 'Tool', NULL, NULL, 1, 'tool', NULL, '2025-04-19 21:09:35', '2025-04-19 21:09:35'),
(25, 'Lighting', NULL, NULL, 1, 'lighting', NULL, '2025-04-19 21:09:48', '2025-04-19 21:09:55');

-- --------------------------------------------------------

--
-- Table structure for table `Emailverifications`
--

CREATE TABLE `Emailverifications` (
  `id` int NOT NULL,
  `userId` int NOT NULL,
  `email` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `code` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `expiresAt` datetime NOT NULL,
  `isUsed` tinyint(1) DEFAULT '0',
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `Emailverifications`
--

INSERT INTO `Emailverifications` (`id`, `userId`, `email`, `code`, `expiresAt`, `isUsed`, `createdAt`, `updatedAt`) VALUES
(1, 2, 'geveve9340@buides.com', '939181', '2025-04-03 16:41:22', 1, '2025-04-03 16:31:22', '2025-04-03 16:31:46');

-- --------------------------------------------------------

--
-- Table structure for table `orderitems`
--

CREATE TABLE `orderitems` (
  `id` int NOT NULL,
  `orderId` int NOT NULL,
  `productId` int NOT NULL,
  `quantity` int NOT NULL,
  `price` decimal(10,2) NOT NULL COMMENT 'Price at the time of order',
  `totalPrice` decimal(10,2) NOT NULL,
  `productName` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Product name at the time of order',
  `productSku` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Product SKU at the time of order',
  `discountAmount` decimal(10,2) DEFAULT '0.00',
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `orderitems`
--

INSERT INTO `orderitems` (`id`, `orderId`, `productId`, `quantity`, `price`, `totalPrice`, `productName`, `productSku`, `discountAmount`, `createdAt`, `updatedAt`) VALUES
(73, 67, 18, 1, 1400000.00, 1400000.00, 'Xiaomi Gaming Monitor G24i 24 inch 180Hz', NULL, 0.00, '2025-05-22 21:51:22', '2025-05-22 21:51:22'),
(75, 69, 16, 1, 1250000.00, 1250000.00, 'ASUS LED Monitor VY249HF Eye Care', NULL, 0.00, '2025-05-24 19:06:02', '2025-05-24 19:06:02'),
(76, 70, 17, 1, 1200000.00, 1200000.00, 'Xiaomi Monitor A24i 24 inch 100Hz', NULL, 0.00, '2025-05-24 19:07:42', '2025-05-24 19:07:42'),
(77, 83, 16, 1, 1250000.00, 1250000.00, 'ASUS LED Monitor VY249HF Eye Care', NULL, 0.00, '2025-05-25 13:40:25', '2025-05-25 13:40:25'),
(78, 83, 18, 1, 1400000.00, 1400000.00, 'Xiaomi Gaming Monitor G24i 24 inch 180Hz', NULL, 0.00, '2025-05-25 13:40:25', '2025-05-25 13:40:25'),
(79, 84, 13, 1, 390000.00, 390000.00, 'Rexus ShagaRX-130 Wireless With Charging Dock', NULL, 0.00, '2025-05-25 13:53:06', '2025-05-25 13:53:06'),
(80, 85, 15, 1, 700000.00, 700000.00, 'Crucial SODIMM Memory 16GB  DDR5 5600mhz', NULL, 0.00, '2025-05-25 14:11:50', '2025-05-25 14:11:50');

-- --------------------------------------------------------

--
-- Table structure for table `orders`
--

CREATE TABLE `orders` (
  `id` int NOT NULL,
  `userId` int NOT NULL,
  `orderNumber` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('pending','processing','shipped','delivered','cancelled','refunded') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  `totalAmount` decimal(10,2) NOT NULL,
  `tax` decimal(10,2) DEFAULT '0.00',
  `shippingFee` decimal(10,2) DEFAULT '0.00',
  `grandTotal` decimal(10,2) NOT NULL,
  `shippingAddress` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `paymentMethod` enum('credit_card','debit_card','bank_transfer','e_wallet','cash_on_delivery','midtrans','qris') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'midtrans',
  `paymentStatus` enum('pending','paid','failed','refunded') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  `notes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `trackingNumber` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `estimatedDelivery` datetime DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `shippingMethod` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'ID of the selected shipping method',
  `shippingDetails` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT 'JSON string with shipping details'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `orders`
--

INSERT INTO `orders` (`id`, `userId`, `orderNumber`, `status`, `totalAmount`, `tax`, `shippingFee`, `grandTotal`, `shippingAddress`, `paymentMethod`, `paymentStatus`, `notes`, `trackingNumber`, `estimatedDelivery`, `createdAt`, `updatedAt`, `shippingMethod`, `shippingDetails`) VALUES
(67, 2, 'ORD-20250522215122-232831-2', 'delivered', 1400000.00, 0.00, 22000.00, 1422000.00, '{\"fullName\":\"jon\",\"phoneNumber\":\"082145678949\",\"address\":\"Jl. Nusa Indah\",\"city\":\"KOTA BANDAR LAMPUNG\",\"province\":\"LAMPUNG\",\"postalCode\":\"35118\"}', 'qris', 'paid', '', '004445460710', '2025-05-23 21:51:22', '2025-05-22 21:51:22', '2025-05-24 19:02:05', 'sicepat_reg', '{\"courier\":\"sicepat\",\"service\":\"reg\",\"estimatedDelivery\":\"1 - 2 days\"}'),
(69, 2, 'ORD-20250524190601-231345-2', 'cancelled', 1250000.00, 0.00, 16000.00, 1266000.00, '{\"fullName\":\"jon\",\"phoneNumber\":\"082145678949\",\"address\":\"Jl. Nusa Indah\",\"city\":\"KOTA BANDAR LAMPUNG\",\"province\":\"LAMPUNG\",\"postalCode\":\"35118\"}', 'midtrans', 'failed', 'Automatically cancelled due to payment timeout (1 hour)', NULL, '2025-05-25 19:06:01', '2025-05-24 19:06:01', '2025-05-24 20:15:05', 'jne_reg', '{\"courier\":\"jne\",\"service\":\"reg\",\"estimatedDelivery\":\"1 - 2 days\"}'),
(70, 2, 'ORD-20250524190742-944517-2', 'delivered', 1200000.00, 0.00, 16000.00, 1216000.00, '{\"fullName\":\"jon\",\"phoneNumber\":\"082145678949\",\"address\":\"Jl. Nusa Indah\",\"city\":\"KOTA BANDAR LAMPUNG\",\"province\":\"LAMPUNG\",\"postalCode\":\"35118\"}', 'qris', 'paid', '', NULL, '2025-05-25 19:07:42', '2025-05-24 19:07:42', '2025-05-25 14:12:53', 'jne_reg', '{\"courier\":\"jne\",\"service\":\"reg\",\"estimatedDelivery\":\"1 - 2 days\"}'),
(83, 2, 'ORD-20250525134025-303139-2', 'processing', 2650000.00, 0.00, 24000.00, 2674000.00, '{\"fullName\":\"Test User\",\"phoneNumber\":\"082145678949\",\"address\":\"Jl. Nusa Indah\",\"city\":\"KOTA BANDAR LAMPUNG\",\"province\":\"LAMPUNG\",\"postalCode\":\"35118\"}', 'qris', 'paid', '', NULL, '2025-05-26 13:40:25', '2025-05-25 13:40:25', '2025-05-25 13:40:52', 'jne_reg', '{\"courier\":\"jne\",\"service\":\"reg\",\"estimatedDelivery\":\"1 - 2 days\"}'),
(84, 2, 'ORD-20250525135306-082215-2', 'processing', 390000.00, 0.00, 16000.00, 406000.00, '{\"fullName\":\"Test User\",\"phoneNumber\":\"082145678949\",\"address\":\"Jl. Nusa Indah\",\"city\":\"KOTA BANDAR LAMPUNG\",\"province\":\"LAMPUNG\",\"postalCode\":\"35118\"}', 'qris', 'paid', '', NULL, '2025-05-26 13:53:06', '2025-05-25 13:53:06', '2025-05-25 13:53:19', 'jne_reg', '{\"courier\":\"jne\",\"service\":\"reg\",\"estimatedDelivery\":\"1 - 2 days\"}'),
(85, 2, 'ORD-20250525141150-425171-2', 'processing', 700000.00, 0.00, 16000.00, 716000.00, '{\"fullName\":\"Test User\",\"phoneNumber\":\"082145678949\",\"address\":\"Jl. Nusa Indah\",\"city\":\"KOTA BANDAR LAMPUNG\",\"province\":\"LAMPUNG\",\"postalCode\":\"35118\"}', 'qris', 'paid', '', NULL, '2025-05-26 14:11:50', '2025-05-25 14:11:50', '2025-05-25 14:12:04', 'jne_reg', '{\"courier\":\"jne\",\"service\":\"reg\",\"estimatedDelivery\":\"1 - 2 days\"}');

-- --------------------------------------------------------

--
-- Table structure for table `Payments`
--

CREATE TABLE `Payments` (
  `id` int NOT NULL,
  `orderId` int NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `method` enum('credit_card','debit_card','bank_transfer','e_wallet','cash_on_delivery','qris') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('pending','completed','failed','refunded') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  `transactionId` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'External payment gateway transaction ID',
  `paymentDate` datetime DEFAULT NULL,
  `gatewayResponse` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT 'Response from payment gateway',
  `receiptUrl` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `refundAmount` decimal(10,2) DEFAULT NULL,
  `refundDate` datetime DEFAULT NULL,
  `refundReason` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `Payments`
--

INSERT INTO `Payments` (`id`, `orderId`, `amount`, `method`, `status`, `transactionId`, `paymentDate`, `gatewayResponse`, `receiptUrl`, `refundAmount`, `refundDate`, `refundReason`, `createdAt`, `updatedAt`) VALUES
(30, 67, 1422000.00, 'qris', 'completed', '37184745-6444-4182-be35-e231d286bb9d', '2025-05-22 22:32:31', NULL, NULL, NULL, NULL, NULL, '2025-05-22 21:52:00', '2025-05-22 22:32:31'),
(32, 70, 1216000.00, 'qris', 'completed', '96554d82-4aca-4ee3-9908-b4dde9c3cd59', '2025-05-25 14:12:53', NULL, NULL, NULL, NULL, NULL, '2025-05-24 19:08:04', '2025-05-25 14:12:53'),
(33, 83, 2674000.00, 'qris', 'completed', 'cec36de2-ad73-4c30-8574-66ff07887003', '2025-05-25 13:40:52', NULL, NULL, NULL, NULL, NULL, '2025-05-25 13:40:52', '2025-05-25 13:40:52'),
(34, 84, 406000.00, 'qris', 'completed', '68df4265-0a49-4a4b-a500-baa57892f8d1', '2025-05-25 13:53:19', NULL, NULL, NULL, NULL, NULL, '2025-05-25 13:53:19', '2025-05-25 13:53:19'),
(35, 85, 716000.00, 'qris', 'completed', 'ff6d3dc5-650c-4094-854a-59ec27b68eca', '2025-05-25 14:12:04', NULL, NULL, NULL, NULL, NULL, '2025-05-25 14:12:04', '2025-05-25 14:12:04');

-- --------------------------------------------------------

--
-- Table structure for table `Products`
--

CREATE TABLE `Products` (
  `id` int NOT NULL,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `price` decimal(10,2) NOT NULL,
  `stock` int NOT NULL DEFAULT '0',
  `imageUrl` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `imagePublicId` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Cloudinary public ID for the main image',
  `gallery` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT 'JSON array of image URLs and public IDs',
  `sku` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `isActive` tinyint(1) DEFAULT '1',
  `weight` float DEFAULT NULL,
  `dimensions` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `categoryId` int DEFAULT NULL,
  `discountPercentage` float DEFAULT '0',
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `featured` tinyint(1) DEFAULT '0',
  `features` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT 'JSON array of product features',
  `specifications` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT 'JSON object of product specifications',
  `avgRating` float NOT NULL DEFAULT '0',
  `reviewCount` int NOT NULL DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `Products`
--

INSERT INTO `Products` (`id`, `name`, `description`, `price`, `stock`, `imageUrl`, `imagePublicId`, `gallery`, `sku`, `isActive`, `weight`, `dimensions`, `categoryId`, `discountPercentage`, `createdAt`, `updatedAt`, `featured`, `features`, `specifications`, `avgRating`, `reviewCount`) VALUES
(5, 'awdwa', 'awdwadwa', 100000.00, 39, NULL, NULL, '[]', NULL, 0, 4, '7x9x8', 1, 10, '2025-04-05 18:20:51', '2025-05-22 21:06:35', 0, '[]', '{}', 0, 0),
(9, 'windy', 'awdwa', 150000.00, 1, 'https://res.cloudinary.com/dror0oa3z/image/upload/v1743971421/products/mainImage-1743971414624-501379753_vi2lj3.png', 'products/mainImage-1743971414624-501379753_vi2lj3', '[{\"url\":\"https://res.cloudinary.com/dror0oa3z/image/upload/v1743971427/products/gallery/galleryImages-1743971414672-946939826_kxkzzh.png\",\"publicId\":\"products/gallery/galleryImages-1743971414672-946939826_kxkzzh\"},{\"url\":\"https://res.cloudinary.com/dror0oa3z/image/upload/v1743971435/products/gallery/galleryImages-1743971414720-959565703_yiffba.png\",\"publicId\":\"products/gallery/galleryImages-1743971414720-959565703_yiffba\"}]', NULL, 1, 4, '5x5x5', 1, 10, '2025-04-06 08:55:02', '2025-05-22 21:06:35', 0, '[\"awdwadwa\"]', '{\"awdwa\":\"awdwa\"}', 0, 0),
(10, 'RTX 4060', 'buat gaming', 6000000.00, 10, 'https://res.cloudinary.com/dror0oa3z/image/upload/v1744216659/products/mainImage-1744216654438-606738255_fb6c33.jpg', 'products/mainImage-1744216654438-606738255_fb6c33', '[]', NULL, 1, 4, '10x15x20', 2, 5, '2025-04-09 16:37:37', '2025-05-22 21:06:35', 0, '[\"BUAT GAMING\"]', '{\"Memory Speed\":\"17 Gbps\"}', 0, 0),
(11, 'Logitech G203 MLightsync with Macro', 'Mouse Macro', 280000.00, 95, 'https://res.cloudinary.com/dror0oa3z/image/upload/v1745093775/products/mainImage-1745093773392-653109421_h1tqbk.jpg', 'products/mainImage-1745093773392-653109421_h1tqbk', '[{\"url\":\"https://res.cloudinary.com/dror0oa3z/image/upload/v1745093777/products/gallery/galleryImages-1745093773399-747838422_fnifw5.jpg\",\"publicId\":\"products/gallery/galleryImages-1745093773399-747838422_fnifw5\"},{\"url\":\"https://res.cloudinary.com/dror0oa3z/image/upload/v1745093778/products/gallery/galleryImages-1745093773400-850853056_zegmm1.jpg\",\"publicId\":\"products/gallery/galleryImages-1745093773400-850853056_zegmm1\"},{\"url\":\"https://res.cloudinary.com/dror0oa3z/image/upload/v1745093780/products/gallery/galleryImages-1745093773403-522779213_uii0vc.jpg\",\"publicId\":\"products/gallery/galleryImages-1745093773403-522779213_uii0vc\"}]', NULL, 1, NULL, NULL, 3, 0, '2025-04-19 20:16:21', '2025-05-22 21:06:35', 0, '[]', '{}', 0, 0),
(12, 'Fantech THOR X9 Macro Script', 'Mouse Fantech', 110000.00, 100, 'https://res.cloudinary.com/dror0oa3z/image/upload/v1745095595/products/mainImage-1745095592751-680549615_gu52vz.jpg', 'products/mainImage-1745095592751-680549615_gu52vz', '[]', NULL, 1, NULL, NULL, 3, 0, '2025-04-19 20:46:35', '2025-05-22 21:06:35', 0, '[]', '{}', 0, 0),
(13, 'Rexus ShagaRX-130 Wireless With Charging Dock', 'Mouse Gaming Wireless SHAGA RX-130 V.2 dihadirkan untuk Anda yang ingin bekerja dan bermain lebih produktif. Dilengkapi dengan koneksi triple connection (2.4GHz Wireless, Bluetooth, Wired Mode), mouse ini memudahkan mobilitas Anda dalam berbagai situasi. Kini, sensor mouse ini telah diupgrade dengan PAW3311, memberikan akurasi, kecepatan yang lebih tinggi, dan penggunaan daya yang lebih hemat.', 390000.00, 97, 'https://res.cloudinary.com/dror0oa3z/image/upload/v1745095767/products/mainImage-1745095766255-798098910_uq76pd.webp', 'products/mainImage-1745095766255-798098910_uq76pd', '[{\"url\":\"https://res.cloudinary.com/dror0oa3z/image/upload/v1745095769/products/gallery/galleryImages-1745095766255-956965993_igqvym.webp\",\"publicId\":\"products/gallery/galleryImages-1745095766255-956965993_igqvym\"}]', NULL, 1, 0.73, NULL, 3, 0, '2025-04-19 20:49:29', '2025-05-25 13:53:19', 0, '[]', '{\"DPI\":\"800-1200-1600-3200-5000-12000\",\"Transmission mode\":\"USB+2.4G+Bluetooth\",\"Port\":\"USB\",\"Battery\":\"Lithium lon 600 mAh\",\"Size\":\"120.26*60.96*39.51\"}', 0, 0),
(14, 'Crucial SODIMM Memory 8GB  DDR4 3200mhz', 'SODIMM MEMORY CRUCIAL 8GB DDR4 3200 DDR4 RAM SODIMM LAPTOP PC25600 RAM NOTEBOOK CRUCIAL ', 255000.00, 99, 'https://res.cloudinary.com/dror0oa3z/image/upload/v1745095967/products/mainImage-1745095964209-635532570_uditvg.jpg', 'products/mainImage-1745095964209-635532570_uditvg', '[]', NULL, 1, NULL, NULL, 4, 0, '2025-04-19 20:52:47', '2025-05-22 21:06:35', 0, '[]', '{}', 0, 0),
(15, 'Crucial SODIMM Memory 16GB  DDR5 5600mhz', 'MEMORY LAPTOP DDR5 CRUCIAL SODIMM RAM NOTEBOOK DDR5 PC 5600 SODIMM\r\n', 700000.00, 92, 'https://res.cloudinary.com/dror0oa3z/image/upload/v1745096046/products/mainImage-1745096044812-603249407_opmrmy.jpg', 'products/mainImage-1745096044812-603249407_opmrmy', '[]', NULL, 1, NULL, NULL, 4, 0, '2025-04-19 20:54:07', '2025-05-25 14:12:04', 0, '[]', '{}', 0, 0),
(16, 'ASUS LED Monitor VY249HF Eye Care', 'Monitor ', 1250000.00, 98, 'https://res.cloudinary.com/dror0oa3z/image/upload/v1745096197/products/mainImage-1745096195786-606028872_mchygs.jpg', 'products/mainImage-1745096195786-606028872_mchygs', '[]', NULL, 1, NULL, NULL, 5, 0, '2025-04-19 20:56:37', '2025-05-25 13:40:52', 0, '[]', '{}', 0, 0),
(17, 'Xiaomi Monitor A24i 24 inch 100Hz', 'Monitor ', 1200000.00, 97, 'https://res.cloudinary.com/dror0oa3z/image/upload/v1745096376/products/mainImage-1745096371254-380352184_p3g3us.png', 'products/mainImage-1745096371254-380352184_p3g3us', '[]', NULL, 1, NULL, NULL, 5, 0, '2025-04-19 20:59:38', '2025-05-25 14:13:12', 0, '[]', '{}', 5, 1),
(18, 'Xiaomi Gaming Monitor G24i 24 inch 180Hz', 'Monitor', 1400000.00, 94, 'https://res.cloudinary.com/dror0oa3z/image/upload/v1745096464/products/mainImage-1745096462722-288465941_bhiypn.jpg', 'products/mainImage-1745096462722-288465941_bhiypn', '[]', NULL, 1, NULL, NULL, 5, 0, '2025-04-19 21:01:05', '2025-05-25 13:40:52', 0, '[]', '{}', 4, 1),
(19, 'Asus Rog Zephyrus M16 GU603HE-I7R5G6T-O', 'Harga dapat berubah sewaktu-waktu\r\nMohon konfirmasi stok dan cek deskripsi produk sebelum pesan', 25999000.00, 5, 'https://res.cloudinary.com/dror0oa3z/image/upload/v1745096518/products/mainImage-1745096516627-786755071_hcwe8l.jpg', 'products/mainImage-1745096516627-786755071_hcwe8l', '[]', NULL, 1, NULL, NULL, 2, 0, '2025-04-19 21:01:59', '2025-05-22 21:06:35', 0, '[]', '{}', 0, 0);

-- --------------------------------------------------------

--
-- Table structure for table `Reviews`
--

CREATE TABLE `Reviews` (
  `id` int NOT NULL,
  `userId` int NOT NULL,
  `productId` int NOT NULL,
  `orderId` int DEFAULT NULL COMMENT 'Optional reference to the order where this product was purchased',
  `rating` int NOT NULL,
  `title` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `comment` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `images` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT 'JSON array of image URLs and public IDs',
  `isVerifiedPurchase` tinyint(1) DEFAULT '0',
  `isRecommended` tinyint(1) DEFAULT '1',
  `helpfulCount` int DEFAULT '0',
  `reportCount` int DEFAULT '0',
  `isActive` tinyint(1) DEFAULT '1',
  `adminResponse` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `adminResponseDate` datetime DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `Reviews`
--

INSERT INTO `Reviews` (`id`, `userId`, `productId`, `orderId`, `rating`, `title`, `comment`, `images`, `isVerifiedPurchase`, `isRecommended`, `helpfulCount`, `reportCount`, `isActive`, `adminResponse`, `adminResponseDate`, `createdAt`, `updatedAt`) VALUES
(11, 2, 18, 67, 4, 'monitornya bagus', 'kekurangannnya hanya satu, yaitu kurang bubble wrap', '[]', 1, 1, 0, 0, 1, NULL, NULL, '2025-05-24 19:50:14', '2025-05-24 19:50:14'),
(12, 2, 17, 70, 5, 'BAGUS', 'PENJUALNYA RAMAH', '[]', 1, 1, 0, 0, 1, NULL, NULL, '2025-05-25 14:13:12', '2025-05-25 14:13:12');

-- --------------------------------------------------------

--
-- Table structure for table `SystemLogs`
--

CREATE TABLE `SystemLogs` (
  `id` int NOT NULL,
  `level` enum('INFO','WARNING','ERROR') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'INFO',
  `message` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `source` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `userId` int DEFAULT NULL,
  `metadata` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT 'JSON string with additional details',
  `ipAddress` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `SystemLogs`
--

INSERT INTO `SystemLogs` (`id`, `level`, `message`, `source`, `userId`, `metadata`, `ipAddress`, `createdAt`, `updatedAt`) VALUES
(1, 'INFO', 'Store information updated', 'SystemSettings', 4, NULL, '::1', '2025-05-03 17:46:23', '2025-05-03 17:46:23'),
(2, 'INFO', 'Store information updated', 'SystemSettings', 4, NULL, '::1', '2025-05-03 17:46:29', '2025-05-03 17:46:29');

-- --------------------------------------------------------

--
-- Table structure for table `systemsettings`
--

CREATE TABLE `systemsettings` (
  `id` int NOT NULL,
  `storeName` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `city` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `province` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `postalCode` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `country` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `systemsettings`
--

INSERT INTO `systemsettings` (`id`, `storeName`, `address`, `city`, `province`, `postalCode`, `country`) VALUES
(1, 'NPC Store', 'Rajabasa', 'Bandar Lampung', 'Lampung', '35144', 'Indonesia');

-- --------------------------------------------------------

--
-- Table structure for table `Users`
--

CREATE TABLE `Users` (
  `id` int NOT NULL,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `city` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `state` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `zipCode` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `country` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'Indonesia',
  `role` enum('buyer','admin','superadmin') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'buyer',
  `profileImage` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `dateOfBirth` date DEFAULT NULL,
  `gender` enum('male','female','other','prefer_not_to_say') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `isActive` tinyint(1) DEFAULT '1',
  `isEmailVerified` tinyint(1) DEFAULT '0',
  `emailVerificationToken` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `emailVerificationCode` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `emailVerificationExpire` datetime DEFAULT NULL,
  `resetPasswordToken` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `resetPasswordExpire` datetime DEFAULT NULL,
  `lastLogin` datetime DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `profileImagePublicId` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Cloudinary public ID for profile image'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `Users`
--

INSERT INTO `Users` (`id`, `name`, `email`, `password`, `phone`, `address`, `city`, `state`, `zipCode`, `country`, `role`, `profileImage`, `dateOfBirth`, `gender`, `isActive`, `isEmailVerified`, `emailVerificationToken`, `emailVerificationCode`, `emailVerificationExpire`, `resetPasswordToken`, `resetPasswordExpire`, `lastLogin`, `createdAt`, `updatedAt`, `profileImagePublicId`) VALUES
(2, 'Test User', 'geveve9340@buides.com', '$2b$10$4uX6HnbVDndk66GG4r.IquZWtbDbOH/BvGuzAEnncsCpNiL5pDyrm', '082145678949', 'Jl. Nusa Indah', 'KOTA BANDAR LAMPUNG', 'LAMPUNG', '35118', 'Indonesia', 'buyer', 'https://res.cloudinary.com/dror0oa3z/image/upload/v1747578342/users/profile/profileImage-1747578337566-746146778_cbssz5.jpg', '2025-04-11', 'male', 1, 1, NULL, NULL, NULL, NULL, NULL, '2025-05-25 14:36:28', '2025-04-03 16:31:22', '2025-05-25 14:36:28', 'users/profile/profileImage-1747578337566-746146778_cbssz5'),
(4, 'Super Administrator', 'admin@npcnusantara.com', '$2b$10$yqVEHRUW0MDdsLTBYmQUa.5OLAjXgFP3QAySmCtZzMG5VbRv3H5M.', '+6281234567890', NULL, NULL, NULL, NULL, 'Indonesia', 'superadmin', NULL, NULL, NULL, 1, 1, NULL, NULL, NULL, NULL, NULL, '2025-05-25 15:09:35', '2025-04-04 00:35:22', '2025-05-25 15:09:35', NULL),
(5, 'Administrator', 'admin@npc.com', '$2b$10$n.srue8Ee5nW9GMrz5c0HuVa3PUH9Ti6KPnXenX89oia0IScIU7P.', '+6289876543210', NULL, NULL, NULL, NULL, 'Indonesia', 'admin', NULL, NULL, NULL, 1, 1, NULL, NULL, NULL, NULL, NULL, '2025-05-25 03:24:06', '2025-04-04 00:42:43', '2025-05-25 03:24:06', NULL);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `AdminActivities`
--
ALTER TABLE `AdminActivities`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_AdminActivities_Users_idx` (`userId`);

--
-- Indexes for table `Carousels`
--
ALTER TABLE `Carousels`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `CartItems`
--
ALTER TABLE `CartItems`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `cartId` (`cartId`,`productId`),
  ADD KEY `fk_CartItems_Products_idx` (`productId`);

--
-- Indexes for table `Carts`
--
ALTER TABLE `Carts`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `userId_UNIQUE` (`userId`);

--
-- Indexes for table `Categories`
--
ALTER TABLE `Categories`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name_UNIQUE` (`name`),
  ADD UNIQUE KEY `slug_UNIQUE` (`slug`),
  ADD KEY `fk_Categories_Categories_idx` (`parentId`);

--
-- Indexes for table `Emailverifications`
--
ALTER TABLE `Emailverifications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_EmailVerifications_Users_idx` (`userId`);

--
-- Indexes for table `orderitems`
--
ALTER TABLE `orderitems`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_OrderItems_Orders_idx` (`orderId`),
  ADD KEY `fk_OrderItems_Products_idx` (`productId`);

--
-- Indexes for table `orders`
--
ALTER TABLE `orders`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `orderNumber` (`orderNumber`),
  ADD KEY `fk_Orders_Users_idx` (`userId`);

--
-- Indexes for table `Payments`
--
ALTER TABLE `Payments`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `orderId_UNIQUE` (`orderId`);

--
-- Indexes for table `Products`
--
ALTER TABLE `Products`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `sku` (`sku`),
  ADD KEY `fk_Products_Categories_idx` (`categoryId`);

--
-- Indexes for table `Reviews`
--
ALTER TABLE `Reviews`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `reviews_user_id_product_id_order_id` (`userId`,`productId`,`orderId`),
  ADD KEY `fk_Reviews_Products_idx` (`productId`),
  ADD KEY `fk_Reviews_Orders_idx` (`orderId`);

--
-- Indexes for table `SystemLogs`
--
ALTER TABLE `SystemLogs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_SystemLogs_Users_idx` (`userId`);

--
-- Indexes for table `systemsettings`
--
ALTER TABLE `systemsettings`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `Users`
--
ALTER TABLE `Users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `idx_users_email_unique` (`email`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `AdminActivities`
--
ALTER TABLE `AdminActivities`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `Carousels`
--
ALTER TABLE `Carousels`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `CartItems`
--
ALTER TABLE `CartItems`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=100;

--
-- AUTO_INCREMENT for table `Carts`
--
ALTER TABLE `Carts`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `Categories`
--
ALTER TABLE `Categories`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=26;

--
-- AUTO_INCREMENT for table `Emailverifications`
--
ALTER TABLE `Emailverifications`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `orderitems`
--
ALTER TABLE `orderitems`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=81;

--
-- AUTO_INCREMENT for table `orders`
--
ALTER TABLE `orders`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=86;

--
-- AUTO_INCREMENT for table `Payments`
--
ALTER TABLE `Payments`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=36;

--
-- AUTO_INCREMENT for table `Products`
--
ALTER TABLE `Products`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=20;

--
-- AUTO_INCREMENT for table `Reviews`
--
ALTER TABLE `Reviews`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT for table `SystemLogs`
--
ALTER TABLE `SystemLogs`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `systemsettings`
--
ALTER TABLE `systemsettings`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `Users`
--
ALTER TABLE `Users`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `AdminActivities`
--
ALTER TABLE `AdminActivities`
  ADD CONSTRAINT `fk_AdminActivities_Users` FOREIGN KEY (`userId`) REFERENCES `Users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `CartItems`
--
ALTER TABLE `CartItems`
  ADD CONSTRAINT `fk_CartItems_Carts` FOREIGN KEY (`cartId`) REFERENCES `Carts` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_CartItems_Products` FOREIGN KEY (`productId`) REFERENCES `Products` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `Carts`
--
ALTER TABLE `Carts`
  ADD CONSTRAINT `fk_Carts_Users` FOREIGN KEY (`userId`) REFERENCES `Users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `Categories`
--
ALTER TABLE `Categories`
  ADD CONSTRAINT `fk_Categories_Categories` FOREIGN KEY (`parentId`) REFERENCES `Categories` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `Emailverifications`
--
ALTER TABLE `Emailverifications`
  ADD CONSTRAINT `fk_EmailVerifications_Users` FOREIGN KEY (`userId`) REFERENCES `Users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `orderitems`
--
ALTER TABLE `orderitems`
  ADD CONSTRAINT `fk_OrderItems_Orders` FOREIGN KEY (`orderId`) REFERENCES `orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_OrderItems_Products` FOREIGN KEY (`productId`) REFERENCES `Products` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

--
-- Constraints for table `orders`
--
ALTER TABLE `orders`
  ADD CONSTRAINT `fk_Orders_Users` FOREIGN KEY (`userId`) REFERENCES `Users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

--
-- Constraints for table `Payments`
--
ALTER TABLE `Payments`
  ADD CONSTRAINT `fk_Payments_Orders` FOREIGN KEY (`orderId`) REFERENCES `orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `Products`
--
ALTER TABLE `Products`
  ADD CONSTRAINT `fk_Products_Categories` FOREIGN KEY (`categoryId`) REFERENCES `Categories` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `Reviews`
--
ALTER TABLE `Reviews`
  ADD CONSTRAINT `fk_Reviews_Orders` FOREIGN KEY (`orderId`) REFERENCES `orders` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_Reviews_Products` FOREIGN KEY (`productId`) REFERENCES `Products` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_Reviews_Users` FOREIGN KEY (`userId`) REFERENCES `Users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `SystemLogs`
--
ALTER TABLE `SystemLogs`
  ADD CONSTRAINT `fk_SystemLogs_Users` FOREIGN KEY (`userId`) REFERENCES `Users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
