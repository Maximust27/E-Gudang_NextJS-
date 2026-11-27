-- Initial E-Gudang V1 schema. Verify this candidate against Prisma and MariaDB before use.

CREATE TABLE `users` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `email` VARCHAR(254) NOT NULL,
    `password_hash` VARCHAR(255) NOT NULL,
    `name` VARCHAR(120) NOT NULL,
    `role` ENUM('ADMIN', 'OPERATOR') NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    UNIQUE INDEX `users_email_key` (`email`),
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `categories` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(120) NOT NULL,
    `default_method` ENUM('FIFO', 'FEFO') NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    UNIQUE INDEX `categories_name_key` (`name`),
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `products` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `sku` VARCHAR(64) NOT NULL,
    `carton_barcode` VARCHAR(128) NOT NULL,
    `name` VARCHAR(180) NOT NULL,
    `category_id` INTEGER NOT NULL,
    `method_override` ENUM('FIFO', 'FEFO') NULL,
    `pieces_per_carton` INTEGER NULL,
    `min_stock` INTEGER NOT NULL DEFAULT 0,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    UNIQUE INDEX `products_sku_key` (`sku`),
    UNIQUE INDEX `products_carton_barcode_key` (`carton_barcode`),
    INDEX `products_category_id_is_active_idx` (`category_id`, `is_active`),
    INDEX `products_is_active_name_idx` (`is_active`, `name`),
    CONSTRAINT `products_barcode_namespace_chk` CHECK (CHAR_LENGTH(TRIM(`carton_barcode`)) > 0 AND UPPER(TRIM(`carton_barcode`)) NOT LIKE 'LOT-%'),
    CONSTRAINT `products_quantity_chk` CHECK (`min_stock` >= 0 AND (`pieces_per_carton` IS NULL OR `pieces_per_carton` > 0)),
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `suppliers` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(180) NOT NULL,
    `code` VARCHAR(64) NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    UNIQUE INDEX `suppliers_code_key` (`code`),
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `locations` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `code` VARCHAR(64) NOT NULL,
    `name` VARCHAR(120) NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    UNIQUE INDEX `locations_code_key` (`code`),
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `inventory_batches` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `product_id` INTEGER NOT NULL,
    `location_id` INTEGER NOT NULL,
    `internal_lot_code` VARCHAR(128) NOT NULL,
    `supplier_batch_no` VARCHAR(100) NULL,
    `received_at` DATETIME(3) NOT NULL,
    `expiry_date` DATE NULL,
    `qty_on_hand` INTEGER NOT NULL DEFAULT 0,
    `version` INTEGER NOT NULL DEFAULT 0,
    `is_blocked` BOOLEAN NOT NULL DEFAULT false,
    `blocked_reason` VARCHAR(500) NULL,
    `receipt_item_id` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    UNIQUE INDEX `inventory_batches_internal_lot_code_key` (`internal_lot_code`),
    INDEX `batches_fifo_idx` (`product_id`, `is_blocked`, `received_at`, `id`),
    INDEX `batches_fefo_idx` (`product_id`, `is_blocked`, `expiry_date`, `received_at`, `id`),
    INDEX `inventory_batches_expiry_date_idx` (`expiry_date`),
    INDEX `inventory_batches_location_id_idx` (`location_id`),
    INDEX `inventory_batches_receipt_item_id_idx` (`receipt_item_id`),
    CONSTRAINT `batches_quantity_chk` CHECK (`qty_on_hand` >= 0 AND `version` >= 0),
    CONSTRAINT `batches_lot_namespace_chk` CHECK (UPPER(`internal_lot_code`) LIKE 'LOT-%' AND CHAR_LENGTH(TRIM(`internal_lot_code`)) > 4),
    CONSTRAINT `batches_block_reason_chk` CHECK (NOT `is_blocked` OR (`blocked_reason` IS NOT NULL AND CHAR_LENGTH(TRIM(`blocked_reason`)) > 0)),
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `transactions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `number` VARCHAR(64) NOT NULL,
    `type` ENUM('IN', 'OUT', 'ADJUSTMENT', 'REVERSAL') NOT NULL,
    `status` ENUM('DRAFT', 'POSTED') NOT NULL DEFAULT 'DRAFT',
    `supplier_id` INTEGER NULL,
    `destination` VARCHAR(180) NULL,
    `reference` VARCHAR(120) NULL,
    `notes` TEXT NULL,
    `reason` VARCHAR(500) NULL,
    `received_at` DATETIME(3) NULL,
    `posted_at` DATETIME(3) NULL,
    `user_id` INTEGER NOT NULL,
    `idempotency_key` VARCHAR(64) NULL,
    `payload_hash` CHAR(64) NULL,
    `reversal_of_id` INTEGER NULL,
    `opname_id` INTEGER NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    UNIQUE INDEX `transactions_number_key` (`number`),
    UNIQUE INDEX `transactions_idempotency_key_key` (`idempotency_key`),
    UNIQUE INDEX `transactions_reversal_of_id_key` (`reversal_of_id`),
    UNIQUE INDEX `transactions_opname_id_key` (`opname_id`),
    INDEX `transactions_type_status_posted_at_idx` (`type`, `status`, `posted_at`),
    INDEX `transactions_posted_at_idx` (`posted_at`),
    INDEX `transactions_supplier_id_idx` (`supplier_id`),
    INDEX `transactions_user_id_idx` (`user_id`),
    CONSTRAINT `transactions_posting_chk` CHECK ((`status` = 'DRAFT' AND `posted_at` IS NULL) OR (`status` = 'POSTED' AND `posted_at` IS NOT NULL AND `idempotency_key` IS NOT NULL AND CHAR_LENGTH(TRIM(`idempotency_key`)) > 0 AND `payload_hash` IS NOT NULL AND CHAR_LENGTH(`payload_hash`) = 64)),
    CONSTRAINT `transactions_receipt_chk` CHECK (`type` <> 'IN' OR `status` <> 'POSTED' OR (`supplier_id` IS NOT NULL AND `received_at` IS NOT NULL)),
    CONSTRAINT `transactions_destination_chk` CHECK (`type` <> 'OUT' OR `status` <> 'POSTED' OR (`destination` IS NOT NULL AND CHAR_LENGTH(TRIM(`destination`)) > 0)),
    CONSTRAINT `transactions_reversal_chk` CHECK ((`type` = 'REVERSAL' AND `reversal_of_id` IS NOT NULL AND `reason` IS NOT NULL AND CHAR_LENGTH(TRIM(`reason`)) > 0) OR (`type` <> 'REVERSAL' AND `reversal_of_id` IS NULL)),
    CONSTRAINT `transactions_adjustment_chk` CHECK (`opname_id` IS NULL OR `type` = 'ADJUSTMENT'),
    CONSTRAINT `transactions_adjustment_reason_chk` CHECK (`type` <> 'ADJUSTMENT' OR `status` <> 'POSTED' OR (`reason` IS NOT NULL AND CHAR_LENGTH(TRIM(`reason`)) > 0)),
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `transaction_items` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `transaction_id` INTEGER NOT NULL,
    `product_id` INTEGER NOT NULL,
    `quantity` INTEGER NOT NULL,
    `pieces_per_carton` INTEGER NULL,
    INDEX `transaction_items_transaction_id_idx` (`transaction_id`),
    INDEX `transaction_items_product_id_transaction_id_idx` (`product_id`, `transaction_id`),
    CONSTRAINT `transaction_items_quantity_chk` CHECK (`quantity` > 0 AND (`pieces_per_carton` IS NULL OR `pieces_per_carton` > 0)),
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `stock_movements` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `transaction_item_id` INTEGER NOT NULL,
    `batch_id` INTEGER NOT NULL,
    `signed_delta` INTEGER NOT NULL,
    `qty_before` INTEGER NOT NULL,
    `qty_after` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    UNIQUE INDEX `stock_movements_transaction_item_id_batch_id_key` (`transaction_item_id`, `batch_id`),
    INDEX `stock_movements_batch_id_created_at_id_idx` (`batch_id`, `created_at`, `id`),
    CONSTRAINT `movements_balance_chk` CHECK (`qty_before` >= 0 AND `qty_after` >= 0 AND `signed_delta` <> 0 AND `qty_after` = `qty_before` + `signed_delta`),
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `stock_opnames` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `number` VARCHAR(64) NOT NULL,
    `status` ENUM('DRAFT', 'SUBMITTED', 'CONFIRMED') NOT NULL DEFAULT 'DRAFT',
    `created_by` INTEGER NOT NULL,
    `approved_by` INTEGER NULL,
    `notes` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `submitted_at` DATETIME(3) NULL,
    `approved_at` DATETIME(3) NULL,
    UNIQUE INDEX `stock_opnames_number_key` (`number`),
    INDEX `stock_opnames_status_created_at_idx` (`status`, `created_at`),
    INDEX `stock_opnames_created_by_idx` (`created_by`),
    INDEX `stock_opnames_approved_by_idx` (`approved_by`),
    CONSTRAINT `opnames_approval_chk` CHECK ((`status` = 'DRAFT' AND `submitted_at` IS NULL AND `approved_at` IS NULL AND `approved_by` IS NULL) OR (`status` = 'SUBMITTED' AND `submitted_at` IS NOT NULL AND `approved_at` IS NULL AND `approved_by` IS NULL) OR (`status` = 'CONFIRMED' AND `submitted_at` IS NOT NULL AND `approved_at` IS NOT NULL AND `approved_by` IS NOT NULL)),
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `stock_opname_items` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `opname_id` INTEGER NOT NULL,
    `batch_id` INTEGER NOT NULL,
    `snapshot_qty` INTEGER NOT NULL,
    `snapshot_version` INTEGER NOT NULL,
    `counted_qty` INTEGER NULL,
    `reason` VARCHAR(500) NULL,
    `notes` TEXT NULL,
    UNIQUE INDEX `stock_opname_items_opname_id_batch_id_key` (`opname_id`, `batch_id`),
    INDEX `stock_opname_items_batch_id_idx` (`batch_id`),
    CONSTRAINT `opname_items_quantity_chk` CHECK (`snapshot_qty` >= 0 AND `snapshot_version` >= 0 AND (`counted_qty` IS NULL OR `counted_qty` >= 0)),
    CONSTRAINT `opname_items_reason_chk` CHECK (`counted_qty` IS NULL OR `counted_qty` = `snapshot_qty` OR (`reason` IS NOT NULL AND CHAR_LENGTH(TRIM(`reason`)) > 0)),
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `activity_logs` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `action` VARCHAR(64) NOT NULL,
    `entity_type` VARCHAR(64) NOT NULL,
    `entity_id` VARCHAR(64) NOT NULL,
    `metadata` JSON NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    INDEX `activity_logs_entity_type_entity_id_created_at_idx` (`entity_type`, `entity_id`, `created_at`),
    INDEX `activity_logs_user_id_created_at_idx` (`user_id`, `created_at`),
    INDEX `activity_logs_created_at_idx` (`created_at`),
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `settings` (
    `key` VARCHAR(64) NOT NULL,
    `value` INTEGER NOT NULL,
    `updated_at` DATETIME(3) NOT NULL,
    CONSTRAINT `settings_value_chk` CHECK (`value` > 0),
    PRIMARY KEY (`key`)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Protect referenced historical records.
ALTER TABLE `products` ADD CONSTRAINT `products_category_id_fkey` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE `inventory_batches` ADD CONSTRAINT `inventory_batches_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE `inventory_batches` ADD CONSTRAINT `inventory_batches_location_id_fkey` FOREIGN KEY (`location_id`) REFERENCES `locations` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE `inventory_batches` ADD CONSTRAINT `inventory_batches_receipt_item_id_fkey` FOREIGN KEY (`receipt_item_id`) REFERENCES `transaction_items` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE `transactions` ADD CONSTRAINT `transactions_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE `transactions` ADD CONSTRAINT `transactions_supplier_id_fkey` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE `transactions` ADD CONSTRAINT `transactions_reversal_of_id_fkey` FOREIGN KEY (`reversal_of_id`) REFERENCES `transactions` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE `transactions` ADD CONSTRAINT `transactions_opname_id_fkey` FOREIGN KEY (`opname_id`) REFERENCES `stock_opnames` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE `transaction_items` ADD CONSTRAINT `transaction_items_transaction_id_fkey` FOREIGN KEY (`transaction_id`) REFERENCES `transactions` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE `transaction_items` ADD CONSTRAINT `transaction_items_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE `stock_movements` ADD CONSTRAINT `stock_movements_transaction_item_id_fkey` FOREIGN KEY (`transaction_item_id`) REFERENCES `transaction_items` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE `stock_movements` ADD CONSTRAINT `stock_movements_batch_id_fkey` FOREIGN KEY (`batch_id`) REFERENCES `inventory_batches` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE `stock_opnames` ADD CONSTRAINT `stock_opnames_created_by_fkey` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE `stock_opnames` ADD CONSTRAINT `stock_opnames_approved_by_fkey` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE `stock_opname_items` ADD CONSTRAINT `stock_opname_items_opname_id_fkey` FOREIGN KEY (`opname_id`) REFERENCES `stock_opnames` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE `stock_opname_items` ADD CONSTRAINT `stock_opname_items_batch_id_fkey` FOREIGN KEY (`batch_id`) REFERENCES `inventory_batches` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE `activity_logs` ADD CONSTRAINT `activity_logs_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;
