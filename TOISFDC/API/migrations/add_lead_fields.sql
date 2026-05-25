-- ============================================================
-- Migration: Add Salesforce Lead fields to CRMRMD.leads
-- Run ONCE on existing tables.
-- New installs: the CREATE TABLE in lead.controller.js handles this automatically.
-- ============================================================

ALTER TABLE CRMRMD.leads
  -- Standard SF fields
  ADD COLUMN salutation            VARCHAR(20),
  ADD COLUMN rating                VARCHAR(20),
  ADD COLUMN website               VARCHAR(255),
  ADD COLUMN industry              VARCHAR(100),
  ADD COLUMN is_converted          TINYINT(1)   DEFAULT 0,
  ADD COLUMN sf_lead_id            VARCHAR(36),
  ADD COLUMN lead_id               VARCHAR(50),
  ADD COLUMN lead_auto_number      VARCHAR(50),

  -- Contact
  ADD COLUMN alternate_mobile      VARCHAR(20),
  ADD COLUMN alternate_mobile2     VARCHAR(20),
  ADD COLUMN alternate_email       VARCHAR(200),
  ADD COLUMN sms_mobile            VARCHAR(20),

  -- Address components
  ADD COLUMN house_no              VARCHAR(50),
  ADD COLUMN floor_no              VARCHAR(50),
  ADD COLUMN building_wing_tower   VARCHAR(100),
  ADD COLUMN society_apartment_name VARCHAR(200),
  ADD COLUMN society_name          VARCHAR(200),
  ADD COLUMN street_colony_road    VARCHAR(200),
  ADD COLUMN landmark              VARCHAR(200),
  ADD COLUMN pocket_block          VARCHAR(100),
  ADD COLUMN locality_name         VARCHAR(200),
  ADD COLUMN locality_code         VARCHAR(50),
  ADD COLUMN pincode               VARCHAR(10),
  ADD COLUMN district              VARCHAR(100),
  ADD COLUMN state                 VARCHAR(100),
  ADD COLUMN rmd_address           TEXT,

  -- Demographics
  ADD COLUMN gender                VARCHAR(20),
  ADD COLUMN birth_date            DATE,
  ADD COLUMN age                   INT,
  ADD COLUMN age_group             VARCHAR(50),
  ADD COLUMN education             VARCHAR(100),
  ADD COLUMN occupation            VARCHAR(100),
  ADD COLUMN income_range          VARCHAR(50),
  ADD COLUMN no_of_children        TINYINT      DEFAULT 0,

  -- Business / Lead context
  ADD COLUMN vertical              VARCHAR(50),
  ADD COLUMN order_type            VARCHAR(50),
  ADD COLUMN pre_prospect_record_type VARCHAR(100),
  ADD COLUMN primary_contact       VARCHAR(50),
  ADD COLUMN call_status           VARCHAR(50),
  ADD COLUMN visit_status          VARCHAR(50),
  ADD COLUMN interested            VARCHAR(10),
  ADD COLUMN publications          VARCHAR(200),
  ADD COLUMN crm_email             VARCHAR(200),
  ADD COLUMN owner_name            VARCHAR(200),
  ADD COLUMN payee_name            VARCHAR(200),
  ADD COLUMN branch_code           VARCHAR(20),
  ADD COLUMN depot_code            VARCHAR(20),

  -- Flags
  ADD COLUMN agree_terms           TINYINT(1)   DEFAULT 0,
  ADD COLUMN opt_in                TINYINT(1)   DEFAULT 0,
  ADD COLUMN is_duplicate          TINYINT(1)   DEFAULT 0,
  ADD COLUMN is_institutional      TINYINT(1)   DEFAULT 0,
  ADD COLUMN is_serviceable        TINYINT(1)   DEFAULT 0,
  ADD COLUMN fresh_payment_flag    TINYINT(1)   DEFAULT 0,

  -- Actions / Dates
  ADD COLUMN next_action_datetime  DATETIME,
  ADD COLUMN next_action_remarks   TEXT,
  ADD COLUMN appointment_datetime  DATETIME,
  ADD COLUMN interested_on_date    DATE,
  ADD COLUMN offer_valid_date      DATE,
  ADD COLUMN order_expiry_date     DATE,

  -- Reason / Outcome
  ADD COLUMN reason                VARCHAR(200),
  ADD COLUMN interest              VARCHAR(100),
  ADD COLUMN competition           VARCHAR(100),
  ADD COLUMN reason_for_lost       VARCHAR(200),

  -- Payment links
  ADD COLUMN renewal_payment_link       VARCHAR(500),
  ADD COLUMN short_renewal_payment_link VARCHAR(200),

  -- Institutional fields
  ADD COLUMN measure_of_potential  VARCHAR(100),
  ADD COLUMN number_of_copies      INT          DEFAULT 0,
  ADD COLUMN period_of_contract    VARCHAR(50),
  ADD COLUMN potential_count       INT          DEFAULT 0,
  ADD COLUMN type_of_model         VARCHAR(50),
  ADD COLUMN industry_type         VARCHAR(100),
  ADD COLUMN industry_sub_category VARCHAR(100),
  ADD COLUMN day_of_delivery       VARCHAR(50),
  ADD COLUMN final_scheme_count    INT          DEFAULT 0,

  -- Publication copy counts (0 = not subscribed)
  ADD COLUMN toi  INT DEFAULT 0,
  ADD COLUMN et   INT DEFAULT 0,
  ADD COLUMN etw  INT DEFAULT 0,
  ADD COLUMN mm   INT DEFAULT 0,
  ADD COLUMN mt   INT DEFAULT 0,
  ADD COLUMN nbt  INT DEFAULT 0,
  ADD COLUMN am   INT DEFAULT 0,
  ADD COLUMN bm   INT DEFAULT 0,
  ADD COLUMN bbm  INT DEFAULT 0,
  ADD COLUMN pm   INT DEFAULT 0,
  ADD COLUMN st   INT DEFAULT 0,
  ADD COLUMN vke  INT DEFAULT 0;
