const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const db     = require('../config/database');

const CREATE_USERS_SQL = `
  CREATE TABLE IF NOT EXISTS CRMRMD.users (
    id                                  VARCHAR(36)   NOT NULL PRIMARY KEY,
    username                            VARCHAR(200),
    last_name                           VARCHAR(100),
    first_name                          VARCHAR(100),
    name                                VARCHAR(200),
    company_name                        VARCHAR(200),
    division                            VARCHAR(100),
    department                          VARCHAR(100),
    title                               VARCHAR(100),
    street                              VARCHAR(255),
    city                                VARCHAR(100),
    state                               VARCHAR(100),
    postal_code                         VARCHAR(20),
    country                             VARCHAR(100),
    latitude                            DECIMAL(10,8),
    longitude                           DECIMAL(11,8),
    geocode_accuracy                    VARCHAR(50),
    address                             TEXT,
    email                               VARCHAR(200),
    is_active                           TINYINT(1)    DEFAULT 1,
    timezone_sid_key                    VARCHAR(50),
    user_role_id                        VARCHAR(36),
    locale_sid_key                      VARCHAR(20),
    receives_info_emails                TINYINT(1)    DEFAULT 0,
    receives_admin_info_emails          TINYINT(1)    DEFAULT 0,
    email_encoding_key                  VARCHAR(20),
    profile_id                          VARCHAR(36),
    user_type                           VARCHAR(50),
    start_day                           INT,
    end_day                             INT,
    language_locale_key                 VARCHAR(20),
    employee_number                     VARCHAR(50),
    delegated_approver_id               VARCHAR(36),
    manager_id                          VARCHAR(36),
    last_login_date                     DATETIME,
    last_password_change_date           DATETIME,
    sf_created_date                     DATETIME,
    sf_created_by_id                    VARCHAR(36),
    sf_last_modified_date               DATETIME,
    sf_last_modified_by_id              VARCHAR(36),
    system_modstamp                     DATETIME,
    password_expiration_date            DATETIME,
    number_of_failed_logins             INT           DEFAULT 0,
    has_user_verified_phone             TINYINT(1)    DEFAULT 0,
    has_user_verified_email             TINYINT(1)    DEFAULT 0,
    is_partner                          TINYINT(1)    DEFAULT 0,
    contact_id                          VARCHAR(36),
    account_id                          VARCHAR(36),
    call_center_id                      VARCHAR(36),
    extension                           VARCHAR(50),
    portal_role                         VARCHAR(50),
    is_portal_enabled                   TINYINT(1)    DEFAULT 0,
    federation_identifier               VARCHAR(100),
    about_me                            TEXT,
    full_photo_url                      VARCHAR(500),
    small_photo_url                     VARCHAR(500),
    is_ext_indicator_visible            TINYINT(1)    DEFAULT 0,
    out_of_office_message               VARCHAR(500),
    medium_photo_url                    VARCHAR(500),
    digest_frequency                    VARCHAR(10),
    default_group_notification_freq     VARCHAR(10),
    last_viewed_date                    DATETIME,
    last_referenced_date                DATETIME,
    banner_photo_url                    VARCHAR(500),
    small_banner_photo_url              VARCHAR(500),
    medium_banner_photo_url             VARCHAR(500),
    is_profile_photo_active             TINYINT(1)    DEFAULT 0,
    individual_id                       VARCHAR(36),
    account_name                        VARCHAR(200),
    rmd_bp_id                           VARCHAR(50),
    rmd_freeze_date                     DATE,
    rmd_is_adsa                         TINYINT(1)    DEFAULT 0,
    rmd_is_deos                         TINYINT(1)    DEFAULT 0,
    rmd_is_deo                          TINYINT(1)    DEFAULT 0,
    rmd_is_dsa                          TINYINT(1)    DEFAULT 0,
    rmd_is_tcs                          TINYINT(1)    DEFAULT 0,
    rmd_is_tc                           TINYINT(1)    DEFAULT 0,
    archival_completed                  TINYINT(1)    DEFAULT 0,
    target_branch                       VARCHAR(36),
    show_refund                         TINYINT(1)    DEFAULT 0,
    mobile_id                           VARCHAR(50),
    password_hash                       VARCHAR(255),
    created_at                          TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
    updated_at                          TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_email    (email),
    UNIQUE KEY uq_username (username)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
`;

(async () => {
  try {
    await db.query(CREATE_USERS_SQL);
    console.log('✓ CRMRMD.users table ready');
  } catch (e) {
    console.error('users table init error:', e.message);
  }
})();

async function login(req, res) {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }
  try {
    const [rows] = await db.query(
      `SELECT id, name, email, username, password_hash,
              rmd_is_adsa, rmd_is_dsa, rmd_is_tc, rmd_is_tcs,
              rmd_is_deo, rmd_is_deos, rmd_bp_id, mobile_id
       FROM CRMRMD.users
       WHERE email = ? AND is_active = 1
       LIMIT 1`,
      [username]
    );
    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const user = rows[0];
    if (!user.password_hash) {
      return res.status(401).json({ error: 'Password not set for this account' });
    }
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    });
    res.json({
      access_token: token,
      user_id:      user.id,
      name:         user.name,
      email:        user.email,
      username:     user.username,
      rmd_is_adsa:  user.rmd_is_adsa,
      rmd_is_dsa:   user.rmd_is_dsa,
      rmd_is_tc:    user.rmd_is_tc,
      rmd_is_tcs:   user.rmd_is_tcs,
      rmd_is_deo:   user.rmd_is_deo,
      rmd_is_deos:  user.rmd_is_deos,
      rmd_bp_id:    user.rmd_bp_id,
      mobile_id:    user.mobile_id,
    });
  } catch (e) {
    console.error('login error:', e);
    res.status(500).json({ error: e.message });
  }
}

async function changePassword(req, res) {
  const { currentPassword, newPassword } = req.body;
  const userId = req.userId;
  try {
    const [rows] = await db.query(
      'SELECT password_hash FROM CRMRMD.users WHERE id = ?', [userId]
    );
    if (!rows.length) return res.status(404).json({ error: 'User not found' });
    const valid = await bcrypt.compare(currentPassword, rows[0].password_hash);
    if (!valid) return res.status(400).json({ error: 'Current password incorrect' });
    const hash = await bcrypt.hash(newPassword, 10);
    await db.query('UPDATE CRMRMD.users SET password_hash = ? WHERE id = ?', [hash, userId]);
    res.json({ message: 'Password updated' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

module.exports = { login, changePassword };
