-- ============================================================
-- OneApp  –  AWS RDS MySQL Schema
-- Derived from Salesforce Apex class SOQL queries:
--   SegmentController.cls  |  GeolocationController.cls
--   SegmentControllerCSP.cls  |  SegmentControllerOOH.cls
-- ============================================================

CREATE DATABASE IF NOT EXISTS OneApp CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE OneApp;

-- ── 1. users ──────────────────────────────────────────────────────
-- Salesforce object: User
CREATE TABLE IF NOT EXISTS users (
    id            VARCHAR(36)   NOT NULL DEFAULT (UUID()) PRIMARY KEY,
    name          VARCHAR(255)  NOT NULL,
    email         VARCHAR(255)  NOT NULL UNIQUE,
    password_hash VARCHAR(255)  NOT NULL,
    mobile_id     VARCHAR(255)  NULL,          -- device fingerprint stored on first check-in
    is_active     TINYINT(1)    NOT NULL DEFAULT 1,
    created_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ── 2. rmd_branch ─────────────────────────────────────────────────
-- Salesforce object: RMD_Branch__c  (referenced via RMD_Branch__r.Name)
CREATE TABLE IF NOT EXISTS rmd_branch (
    id         VARCHAR(36)  NOT NULL DEFAULT (UUID()) PRIMARY KEY,
    name       VARCHAR(255) NOT NULL,
    created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ── 3. localities ─────────────────────────────────────────────────
-- Salesforce object: Locality__c  (referenced via Locality__r.Name)
CREATE TABLE IF NOT EXISTS localities (
    id         VARCHAR(36)  NOT NULL DEFAULT (UUID()) PRIMARY KEY,
    name       VARCHAR(255) NOT NULL,
    created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ── 4. rmd_territory_master ───────────────────────────────────────
-- Salesforce object: RMD_Territory_Master__c
CREATE TABLE IF NOT EXISTS rmd_territory_master (
    id                    VARCHAR(36)    NOT NULL DEFAULT (UUID()) PRIMARY KEY,
    name                  VARCHAR(255)   NOT NULL,
    rmd_sap_code          VARCHAR(100)   NULL,
    rmd_sap_unique_code   VARCHAR(100)   NULL,
    rmd_territory_type    VARCHAR(100)   NULL,       -- 'DEPOT', etc.
    rmd_branch_id         VARCHAR(36)    NULL,
    -- Depot geolocation (Salesforce compound field Depo_Geolocation__c)
    depo_geolocation_lat  DECIMAL(10,7)  NULL,
    depo_geolocation_lng  DECIMAL(10,7)  NULL,
    created_at            DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at            DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_tm_branch FOREIGN KEY (rmd_branch_id) REFERENCES rmd_branch(id)
);

-- ── 5. rmd_user_roles ─────────────────────────────────────────────
-- Salesforce object: RMD_User_Role__c
CREATE TABLE IF NOT EXISTS rmd_user_roles (
    id                      VARCHAR(36)  NOT NULL DEFAULT (UUID()) PRIMARY KEY,
    rmd_territory_master_id VARCHAR(36)  NOT NULL,
    rmd_user_id             VARCHAR(36)  NOT NULL,
    rmd_territory_type      VARCHAR(100) NULL,   -- 'DEPOT'
    rmd_type                VARCHAR(100) NULL,   -- SM / ASM / TSE / DSM  (OneApp_User_Type_Access)
    rmd_active              TINYINT(1)   NOT NULL DEFAULT 1,
    created_at              DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_ur_territory FOREIGN KEY (rmd_territory_master_id) REFERENCES rmd_territory_master(id),
    CONSTRAINT fk_ur_user      FOREIGN KEY (rmd_user_id) REFERENCES users(id)
);

-- ── 6. segments ───────────────────────────────────────────────────
-- Salesforce object: Segment__c  (record types: RWA | OOH | CSP)
CREATE TABLE IF NOT EXISTS segments (
    id                           VARCHAR(36)    NOT NULL DEFAULT (UUID()) PRIMARY KEY,
    name                         VARCHAR(255)   NOT NULL,
    record_type                  ENUM('RWA','OOH','CSP') NOT NULL,
    name_of_society              VARCHAR(255)   NULL,
    slab                         VARCHAR(100)   NULL,
    category                     VARCHAR(100)   NULL,
    sub_category                 VARCHAR(100)   NULL,      -- OOH only
    ooh_type                     VARCHAR(100)   NULL,      -- OOH only
    measure_of_potential         DECIMAL(15,2)  NULL,      -- OOH only
    potential_count              INT            NULL,      -- OOH only
    premiumness                  VARCHAR(100)   NULL,      -- CSP only
    premium_status               VARCHAR(100)   NULL,
    address                      TEXT           NULL,
    city                         VARCHAR(100)   NULL,
    locality_id                  VARCHAR(36)    NULL,
    pin_code                     VARCHAR(20)    NULL,
    depot_id                     VARCHAR(36)    NULL,      -- FK → rmd_territory_master
    segment_branch_id            VARCHAR(36)    NULL,      -- FK → rmd_branch
    total_flats                  INT            NULL,      -- RWA only
    occupied_flats               INT            NULL,      -- RWA only
    delivery_mode                VARCHAR(100)   NULL,
    -- Geolocation (Salesforce compound fields)
    pending_approval_lat         DECIMAL(10,7)  NULL,
    pending_approval_lng         DECIMAL(10,7)  NULL,
    pending_approval1_lat        DECIMAL(10,7)  NULL,      -- CSP/OOH second approval point
    pending_approval1_lng        DECIMAL(10,7)  NULL,
    approved_geolocation_lat     DECIMAL(10,7)  NULL,
    approved_geolocation_lng     DECIMAL(10,7)  NULL,
    location_approval_status     VARCHAR(50)    NULL DEFAULT 'Pending',  -- Pending / Approved
    check_in_location_name       VARCHAR(500)   NULL,
    last_check_in_date           DATE           NULL,
    created_at                   DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at                   DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_seg_locality   FOREIGN KEY (locality_id)       REFERENCES localities(id),
    CONSTRAINT fk_seg_depot      FOREIGN KEY (depot_id)          REFERENCES rmd_territory_master(id),
    CONSTRAINT fk_seg_branch     FOREIGN KEY (segment_branch_id) REFERENCES rmd_branch(id)
);

CREATE INDEX idx_seg_record_type ON segments(record_type);
CREATE INDEX idx_seg_name        ON segments(name);
CREATE INDEX idx_seg_pin_code    ON segments(pin_code);

-- ── 7. rmd_business_partners ──────────────────────────────────────
-- Salesforce object: RMD_Business_Partner__c
CREATE TABLE IF NOT EXISTS rmd_business_partners (
    id             VARCHAR(36)  NOT NULL DEFAULT (UUID()) PRIMARY KEY,
    rmd_first_name VARCHAR(150) NULL,
    rmd_last_name  VARCHAR(150) NULL,
    rmd_email      VARCHAR(255) NULL,
    rmd_phone      VARCHAR(30)  NULL,
    created_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ── 8. segment_contacts ───────────────────────────────────────────
-- Salesforce object: Segment_Contact__c  (record types: Contact | Vendor)
CREATE TABLE IF NOT EXISTS segment_contacts (
    id                  VARCHAR(36)           NOT NULL DEFAULT (UUID()) PRIMARY KEY,
    name                VARCHAR(255)          NOT NULL,
    email               VARCHAR(255)          NULL,
    phone               VARCHAR(30)           NULL,
    designation         VARCHAR(150)          NULL,
    segment_id          VARCHAR(36)           NOT NULL,
    record_type         ENUM('Contact','Vendor') NOT NULL DEFAULT 'Contact',
    business_partner_id VARCHAR(36)           NULL,
    created_at          DATETIME              NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_sc_segment  FOREIGN KEY (segment_id)          REFERENCES segments(id),
    CONSTRAINT fk_sc_bp       FOREIGN KEY (business_partner_id) REFERENCES rmd_business_partners(id)
);

-- ── 9. products ───────────────────────────────────────────────────
-- Salesforce object: Product2  (record type: Reading Habit)
CREATE TABLE IF NOT EXISTS products (
    id               VARCHAR(36)  NOT NULL DEFAULT (UUID()) PRIMARY KEY,
    name             VARCHAR(255) NOT NULL,
    rmd_branch_id    VARCHAR(36)  NULL,
    mandatory_for_rwa TINYINT(1)  NOT NULL DEFAULT 0,
    mandatory_for_csp TINYINT(1)  NOT NULL DEFAULT 0,
    mandatory_for_ooh TINYINT(1)  NOT NULL DEFAULT 0,
    is_active        TINYINT(1)   NOT NULL DEFAULT 1,
    created_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_prod_branch FOREIGN KEY (rmd_branch_id) REFERENCES rmd_branch(id)
);

-- ── 10. transactional_details ─────────────────────────────────────
-- Salesforce object: Transactional_Details__c
CREATE TABLE IF NOT EXISTS transactional_details (
    id                   VARCHAR(36)   NOT NULL DEFAULT (UUID()) PRIMARY KEY,
    name                 VARCHAR(255)  NOT NULL,             -- newspaper name
    segment_id           VARCHAR(36)   NOT NULL,
    ftd_count            DECIMAL(10,2) NOT NULL DEFAULT 0,
    last_visit           DECIMAL(10,2) NULL,                 -- Last_Visit__c
    second_last_visit    DECIMAL(10,2) NULL,                 -- Second_Last_Visit__c
    second_last_visit_date DATE        NULL,
    visit_date           DATE          NULL,
    check_in_date        DATE          NULL,                 -- CheckInDate__c
    is_pre_covid_count   TINYINT(1)   NOT NULL DEFAULT 0,   -- Is_Pre_Covid_Count__c
    ftd_covid_count      DECIMAL(10,2) NULL,                 -- FTD_Covid_Count__c
    choose_company       VARCHAR(150)  NULL,                 -- Choose_Company__c
    choose_newspaper     VARCHAR(255)  NULL,                 -- Choose_Newspaper__c
    created_at           DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_td_segment FOREIGN KEY (segment_id) REFERENCES segments(id)
);

CREATE INDEX idx_td_segment ON transactional_details(segment_id);
CREATE INDEX idx_td_name    ON transactional_details(name);

-- ── 11. check_ins ─────────────────────────────────────────────────
-- Salesforce object: Check_In__c
CREATE TABLE IF NOT EXISTS check_ins (
    id                        VARCHAR(36)   NOT NULL DEFAULT (UUID()) PRIMARY KEY,
    segment_id                VARCHAR(36)   NULL,              -- Segment__c
    territory_master_id       VARCHAR(36)   NULL,              -- Territory_Master__c (for DEPOT)
    check_in_location_lat     DECIMAL(10,7) NULL,
    check_in_location_lng     DECIMAL(10,7) NULL,
    check_in_location_name    VARCHAR(500)  NULL,
    check_out_lat             DECIMAL(10,7) NULL,              -- Check_Out__Latitude__s
    check_out_lng             DECIMAL(10,7) NULL,              -- Check_Out__Longitude__s
    check_out_time            DATETIME      NULL,
    check_out_location_name   VARCHAR(500)  NULL,
    check_in_count            INT           NOT NULL DEFAULT 1,
    distance_depot_checkin    DECIMAL(12,4) NULL,              -- Distance_Between_Depot_And_Check_In__c (metres)
    mobile_id                 VARCHAR(255)  NULL,
    device_check_in           VARCHAR(100)  NULL,
    browser                   VARCHAR(255)  NULL,
    application               VARCHAR(255)  NULL,
    platform                  VARCHAR(255)  NULL,
    check_in_user_id          VARCHAR(36)   NULL,              -- Check_In_User__c
    created_by_id             VARCHAR(36)   NOT NULL,
    created_at                DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_ci_segment   FOREIGN KEY (segment_id)          REFERENCES segments(id),
    CONSTRAINT fk_ci_territory FOREIGN KEY (territory_master_id) REFERENCES rmd_territory_master(id),
    CONSTRAINT fk_ci_user      FOREIGN KEY (created_by_id)       REFERENCES users(id)
);

CREATE INDEX idx_ci_segment      ON check_ins(segment_id);
CREATE INDEX idx_ci_territory    ON check_ins(territory_master_id);
CREATE INDEX idx_ci_created_date ON check_ins(created_by_id, created_at);

-- ── 12. error_logs ────────────────────────────────────────────────
-- Equivalent to RMDErrorLogUtilityHelper.logError
CREATE TABLE IF NOT EXISTS error_logs (
    id                  BIGINT        NOT NULL AUTO_INCREMENT PRIMARY KEY,
    function_name       VARCHAR(150)  NULL,
    reference_id        VARCHAR(255)  NULL,
    message             TEXT          NULL,
    object_name         VARCHAR(150)  NULL,
    error_operation     VARCHAR(150)  NULL,
    message_description TEXT          NULL,
    user_id             VARCHAR(36)   NULL,
    created_at          DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ── 13. picklist_values ───────────────────────────────────────────
-- Replaces Salesforce picklist metadata (Choose_Company__c field values).
CREATE TABLE IF NOT EXISTS picklist_values (
    id          INT          NOT NULL AUTO_INCREMENT PRIMARY KEY,
    field_name  VARCHAR(100) NOT NULL,   -- e.g. 'choose_company'
    value       VARCHAR(255) NOT NULL,
    label       VARCHAR(255) NOT NULL,
    sort_order  INT          NOT NULL DEFAULT 0,
    UNIQUE KEY uq_picklist (field_name, value)
);

-- ── Seed: default picklist values for Choose_Company__c ───────────
INSERT IGNORE INTO picklist_values (field_name, value, label, sort_order) VALUES
('choose_company', 'TOI',   'Times of India', 1),
('choose_company', 'ET',    'Economic Times',  2),
('choose_company', 'NBT',   'Navbharat Times', 3),
('choose_company', 'OTHERS','Others',          4);

-- ============================================================
-- End of schema
-- ============================================================
