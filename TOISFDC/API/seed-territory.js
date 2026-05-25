require('dotenv').config();
const mysql = require('mysql2/promise');

const ROWS = [
  { del:0, name:'RMD-AHMEDABAD',               cat:'RMD', email:'crm.ahmedabad@timesofindia.com',   call:'18001210005', active:1, prefix:'GJ', rec:'Branch', queue:null,                    type:'BRANCH', dump:'BRANCH-0600', dm:1, zone:'West 2',  qla:1000, ql:1000 },
  { del:0, name:'RMD-AHMEDNAGAR',              cat:'RMD', email:'readercontact@timesofindia.com',   call:'18001210005', active:1, prefix:'AN', rec:'Branch', queue:null,                    type:'BRANCH', dump:'BRANCH-0406', dm:1, zone:'West 2',  qla:0,    ql:0    },
  { del:0, name:'RMD-AURANGABAD',              cat:'RMD', email:'crm.dsp@timesofindia.com',         call:'18001210005', active:1, prefix:'AU', rec:'Branch', queue:null,                    type:'BRANCH', dump:'BRANCH-0402', dm:1, zone:'West 1',  qla:0,    ql:0    },
  { del:0, name:'RMD BAL COPY SALES',          cat:'RMD', email:null,                               call:'18001210005', active:1, prefix:null, rec:'Branch', queue:null,                    type:'BRANCH', dump:'BRANCH-1800', dm:1, zone:'Other',   qla:null, ql:null },
  { del:0, name:'RMD-BANGALORE',               cat:'RMD', email:'crm.bangalore@timesofindia.com',   call:'18001210005', active:1, prefix:'BL', rec:'Branch', queue:'RMD_Renewal_queue_0900', type:'BRANCH', dump:'BRANCH-0900', dm:1, zone:'South 1', qla:2000, ql:2000 },
  { del:0, name:'RMD-BHOPAL',                  cat:'RMD', email:'crm.bhopal@timesofindia.com',      call:'18001210005', active:1, prefix:'BP', rec:'Branch', queue:null,                    type:'BRANCH', dump:'BRANCH-2400', dm:1, zone:'North',   qla:0,    ql:0    },
  { del:0, name:'RMD-BHUBANESWAR',             cat:'RMD', email:'crm.kolkata@timesofindia.com',     call:'18001210005', active:1, prefix:'OD', rec:'Branch', queue:null,                    type:'BRANCH', dump:'BRANCH-0750', dm:1, zone:'Other',   qla:1000, ql:1000 },
  { del:0, name:'RMD-CHANDIGARH',              cat:'RMD', email:'crmchandigarh@timesofindia.com',   call:'18001210005', active:1, prefix:'CD', rec:'Branch', queue:null,                    type:'BRANCH', dump:'BRANCH-0300', dm:1, zone:'North',   qla:2000, ql:2000 },
  { del:0, name:'RMD-CHENNAI',                 cat:'RMD', email:'crm.chennai@timesofindia.com',     call:'18001210005', active:1, prefix:'CH', rec:'Branch', queue:'RMD_Renewal_queue_1100', type:'BRANCH', dump:'BRANCH-1100', dm:1, zone:'South 2', qla:5000, ql:5000 },
  { del:0, name:'RMD-COCHIN',                  cat:'RMD', email:'times.kerala@timesofindia.com',    call:'18001210005', active:1, prefix:'KL', rec:'Branch', queue:null,                    type:'BRANCH', dump:'BRANCH-1200', dm:1, zone:'South 1', qla:1000, ql:1000 },
  { del:0, name:'RMD-COIMBATORE',              cat:'RMD', email:'crm.chennai@timesofindia.com',     call:'18001210005', active:1, prefix:'CO', rec:'Branch', queue:null,                    type:'BRANCH', dump:'BRANCH-2200', dm:1, zone:'South 2', qla:1000, ql:1000 },
  { del:0, name:'RMD-DELHI',                   cat:'RMD', email:'crm.delhi@timesofindia.com',       call:'18001210005', active:1, prefix:'DL', rec:'Branch', queue:null,                    type:'BRANCH', dump:'BRANCH-0100', dm:1, zone:'North',   qla:5000, ql:5000 },
  { del:0, name:'RMD-GOA',                     cat:'RMD', email:'crm.dsp@timesofindia.com',         call:'18001210005', active:1, prefix:'GO', rec:'Branch', queue:null,                    type:'BRANCH', dump:'BRANCH-1300', dm:1, zone:'West 1',  qla:0,    ql:0    },
  { del:0, name:'RMD-HYDERABAD',               cat:'RMD', email:'crm.hyderabad@timesofindia.com',   call:'18001210005', active:1, prefix:'HY', rec:'Branch', queue:'RMD_Renewal_queue_1000', type:'BRANCH', dump:'BRANCH-1000', dm:1, zone:'South 2', qla:2000, ql:2000 },
  { del:0, name:'RMD-INDORE',                  cat:'RMD', email:'crm.bhopal@timesofindia.com',      call:'18001210005', active:1, prefix:'IN', rec:'Branch', queue:null,                    type:'BRANCH', dump:'BRANCH-2300', dm:1, zone:'West 1',  qla:0,    ql:0    },
  { del:0, name:'RMD-JAIPUR',                  cat:'RMD', email:'crm.delhi@timesofindia.com',       call:'18001210005', active:1, prefix:'RJ', rec:'Branch', queue:null,                    type:'BRANCH', dump:'BRANCH-1600', dm:1, zone:'North',   qla:1000, ql:1000 },
  { del:0, name:'RMD-KOLHAPUR',                cat:'RMD', email:'crm.dsp@timesofindia.com',         call:'18001210005', active:1, prefix:'KP', rec:'Branch', queue:null,                    type:'BRANCH', dump:'BRANCH-0403', dm:1, zone:'Other',   qla:0,    ql:0    },
  { del:0, name:'RMD-KOLKATA',                 cat:'RMD', email:'crm.kolkata@timesofindia.com',     call:'18001210005', active:1, prefix:'KO', rec:'Branch', queue:null,                    type:'BRANCH', dump:'BRANCH-0700', dm:1, zone:'East',    qla:2000, ql:2000 },
  { del:0, name:'RMD-KOLKATA DEPOT City Sales',cat:null,  email:null,                               call:null,          active:1, prefix:null, rec:'Depot',  queue:null,                    type:'DEPOT',  dump:null,          dm:0, zone:'Other',   qla:null, ql:null },
  { del:0, name:'RMD-LUCKNOW',                 cat:'RMD', email:'crm.lucknow@timesofindia.com',     call:'18001210005', active:1, prefix:'LK', rec:'Branch', queue:null,                    type:'BRANCH', dump:'BRANCH-0200', dm:1, zone:'North',   qla:1000, ql:1000 },
  { del:0, name:'RMD-MADURAI',                 cat:'RMD', email:'crm.chennai@timesofindia.com',     call:'18001210005', active:1, prefix:'MD', rec:'Branch', queue:null,                    type:'BRANCH', dump:'BRANCH-1101', dm:1, zone:'South 2', qla:1000, ql:1000 },
  { del:0, name:'RMD-MUMBAI',                  cat:'RMD', email:'crm.dsp@timesofindia.com',         call:'18001210005', active:1, prefix:'MU', rec:'Branch', queue:'RMD_Renewal_queue_0400', type:'BRANCH', dump:'BRANCH-0400', dm:1, zone:'West 1',  qla:4800, ql:5000 },
  { del:0, name:'RMD-NAGPUR',                  cat:'RMD', email:'crm.nagpur@timesofindia.com',      call:'18001210005', active:1, prefix:'NG', rec:'Branch', queue:null,                    type:'BRANCH', dump:'BRANCH-1700', dm:1, zone:'West 2',  qla:1000, ql:1000 },
  { del:0, name:'RMD-NASIK',                   cat:'RMD', email:'crm.dsp@timesofindia.com',         call:'18001210005', active:1, prefix:'NS', rec:'Branch', queue:null,                    type:'BRANCH', dump:'BRANCH-0401', dm:1, zone:'West 1',  qla:1000, ql:1000 },
  { del:0, name:'RMD-PATNA',                   cat:'RMD', email:'crm.kolkata@timesofindia.com',     call:'18001210005', active:1, prefix:'BI', rec:'Branch', queue:null,                    type:'BRANCH', dump:'BRANCH-0800', dm:1, zone:'East',    qla:0,    ql:0    },
  { del:0, name:'RMD-PUNE',                    cat:'RMD', email:'crm.pune@timesofindia.com',        call:'18001210005', active:1, prefix:'PU', rec:'Branch', queue:null,                    type:'BRANCH', dump:'BRANCH-0500', dm:1, zone:'West 2',  qla:1000, ql:1000 },
  { del:0, name:'RMD-RAIPUR',                  cat:'RMD', email:'crm.nagpur@timesofindia.com',      call:'18001210005', active:1, prefix:'RP', rec:'Branch', queue:null,                    type:'BRANCH', dump:'BRANCH-0404', dm:1, zone:'West 2',  qla:0,    ql:0    },
  { del:0, name:'RMD-VIJAYAWADA',              cat:'RMD', email:'crm.vijayawada@timesofindia.com',  call:'18001210005', active:1, prefix:'VJ', rec:'Branch', queue:'RMD_Renewal_queue_1002', type:'BRANCH', dump:'BRANCH-1002', dm:1, zone:'South 2', qla:1000, ql:1000 },
  { del:0, name:'RMD-VIZAG',                   cat:'RMD', email:'crm.vizag@timesofindia.com',       call:'18001210005', active:1, prefix:'VZ', rec:'Branch', queue:'RMD_Renewal_queue_1001', type:'BRANCH', dump:'BRANCH-1001', dm:1, zone:'South 2', qla:1000, ql:1000 },
];

(async () => {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: { rejectUnauthorized: false },
    timezone: '+05:30',
  });

  // ── Add missing columns ──────────────────────────────────────────
  // Check existing columns then add only the missing ones
  const [existingCols] = await conn.execute(
    "SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='CRMRMD' AND TABLE_NAME='territory'"
  );
  const existing = new Set(existingCols.map(c => c.COLUMN_NAME));

  const colDefs = [
    ['is_deleted',               'TINYINT(1)    NOT NULL DEFAULT 0'],
    ['rmd_branch_category',      'VARCHAR(50)   NULL'],
    ['rmd_crm_email',            'VARCHAR(200)  NULL'],
    ['rmd_call_centre_number',   'VARCHAR(50)   NULL'],
    ['rmd_lead_prefix',          'VARCHAR(20)   NULL'],
    ['rmd_record_type_name',     'VARCHAR(50)   NULL'],
    ['rmd_renewal_queue_name',   'VARCHAR(100)  NULL'],
    ['dump_id',                  'VARCHAR(50)   NULL'],
    ['dm',                       'TINYINT(1)    NOT NULL DEFAULT 0'],
    ['quarterly_limit_available','INT           NULL'],
    ['quarterly_limit',          'INT           NULL'],
  ];

  for (const [col, def] of colDefs) {
    if (!existing.has(col)) {
      await conn.execute(`ALTER TABLE CRMRMD.territory ADD COLUMN ${col} ${def}`);
      console.log(`  Added column: ${col}`);
    }
  }
  console.log('Columns ready.\n');

  // ── Insert / upsert rows ─────────────────────────────────────────
  let inserted = 0, updated = 0, errors = 0;

  for (const r of ROWS) {
    const code = r.dump || r.name.replace(/[^A-Z0-9]/gi, '-').toUpperCase().substring(0, 20);
    try {
      const [res] = await conn.execute(
        `INSERT INTO CRMRMD.territory
           (territory_code, territory_name, territory_type, is_active, zone,
            is_deleted, rmd_branch_category, rmd_crm_email, rmd_call_centre_number,
            rmd_lead_prefix, rmd_record_type_name, rmd_renewal_queue_name,
            dump_id, dm, quarterly_limit_available, quarterly_limit)
         VALUES (?,?,?,?,?, ?,?,?,?,?,?,?, ?,?,?,?)
         ON DUPLICATE KEY UPDATE
           territory_name            = VALUES(territory_name),
           territory_type            = VALUES(territory_type),
           is_active                 = VALUES(is_active),
           zone                      = VALUES(zone),
           is_deleted                = VALUES(is_deleted),
           rmd_branch_category       = VALUES(rmd_branch_category),
           rmd_crm_email             = VALUES(rmd_crm_email),
           rmd_call_centre_number    = VALUES(rmd_call_centre_number),
           rmd_lead_prefix           = VALUES(rmd_lead_prefix),
           rmd_record_type_name      = VALUES(rmd_record_type_name),
           rmd_renewal_queue_name    = VALUES(rmd_renewal_queue_name),
           dump_id                   = VALUES(dump_id),
           dm                        = VALUES(dm),
           quarterly_limit_available = VALUES(quarterly_limit_available),
           quarterly_limit           = VALUES(quarterly_limit)`,
        [
          code, r.name, r.type, r.active, r.zone,
          r.del, r.cat, r.email, r.call,
          r.prefix, r.rec, r.queue,
          r.dump, r.dm, r.qla ?? null, r.ql ?? null,
        ]
      );
      if (res.affectedRows === 1) {
        inserted++;
        console.log(`  INSERT [${r.type.padEnd(6)}]  ${r.name}`);
      } else {
        updated++;
        console.log(`  UPDATE [${r.type.padEnd(6)}]  ${r.name}`);
      }
    } catch (e) {
      errors++;
      console.error(`  ERROR  ${r.name}: ${e.message}`);
    }
  }

  console.log(`\n── Summary ──────────────────────────────────`);
  console.log(`  Inserted : ${inserted}`);
  console.log(`  Updated  : ${updated}`);
  console.log(`  Errors   : ${errors}`);
  console.log(`  Total    : ${ROWS.length}`);

  await conn.end();
})().catch(e => { console.error(e.message); process.exit(1); });
