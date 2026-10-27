import { Client } from 'pg';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

async function seed() {
  const client = new Client({
    ...(process.env.DATABASE_URL && {
      connectionString: process.env.DATABASE_URL,
      ssl: true,
    }),
    host: process.env.MASTER_DATABASE_HOST || 'localhost',
    port: Number(process.env.MASTER_DATABASE_PORT) || 5432,
    user: process.env.MASTER_DATABASE_USERNAME || 'postgres',
    password: process.env.MASTER_DATABASE_PASSWORD || 'postgres',
    database: process.env.MASTER_DATABASE_NAME || 'marketing_field_app_master_db',
  });

  await client.connect();
  console.log('Connected to database.');

  try {
    const defaultPassword = 'password123';
    const passwordHash = await bcrypt.hash(defaultPassword, 10);

    const users = [
      {
        email: 'admin@example.com',
        firstName: 'John',
        lastName: 'Admin',
        role: 'admin',
        roleTable: 'admins',
        extraCol: 'department',
        extraVal: 'Operations',
      },
      {
        email: 'superadmin@example.com',
        firstName: 'Super',
        lastName: 'Admin',
        role: 'superAdmin',
        roleTable: 'admins',
        extraCol: 'department',
        extraVal: 'Executive',
      },
      {
        email: 'agent@example.com',
        firstName: 'Kasun',
        lastName: 'Perera',
        role: 'agent',
        roleTable: 'agents',
        extraCol: 'territory',
        extraVal: 'Western Province',
      },
      {
        email: 'customer@example.com',
        firstName: 'Jane',
        lastName: 'Customer',
        role: 'customer',
        roleTable: 'customers',
        extraCol: 'customer_type',
        extraVal: 'Individual Investor',
      },
      {
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'admin',
        roleTable: 'admins',
        extraCol: 'department',
        extraVal: 'QA',
      },
    ];

    for (const u of users) {
      const existing = await client.query('SELECT id FROM users WHERE email = $1', [u.email]);
      if (existing.rows.length === 0) {
        const insertUserRes = await client.query(
          `INSERT INTO users (email, password_hash, first_name, last_name, role, is_active)
           VALUES ($1, $2, $3, $4, $5, $6)
           RETURNING id`,
          [u.email, passwordHash, u.firstName, u.lastName, u.role, true]
        );
        const userId = insertUserRes.rows[0].id;
        console.log(`Created user: ${u.email} (${u.role}) -> ${userId}`);

        // Insert role record if table exists
        if (u.roleTable) {
          await client.query(
            `INSERT INTO ${u.roleTable} (user_id, ${u.extraCol})
             VALUES ($1, $2)
             ON CONFLICT DO NOTHING`,
            [userId, u.extraVal]
          );
        }

        // Insert profile
        await client.query(
          `INSERT INTO profiles ("userId", birth_day, img_url, bio)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT DO NOTHING`,
          [userId, '1990-01-01', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb', 'Active Member']
        );
      } else {
        console.log(`User already exists: ${u.email}`);
      }
    }

    // Seed branches
    const branches = [
      { name: 'Colombo Fort Branch', code: 'CMB-01', address: 'York Street, Colombo 01' },
      { name: 'Kandy Central Branch', code: 'KDY-01', address: 'Dalada Veediya, Kandy' },
      { name: 'Galle Coastal Branch', code: 'GLE-01', address: 'Main Street, Galle' },
      { name: 'Kurunegala Branch', code: 'KRN-01', address: 'Negombo Road, Kurunegala' },
    ];

    for (const b of branches) {
      await client.query(
        `INSERT INTO branches (name, code, address, is_active)
         VALUES ($1, $2, $3, true)
         ON CONFLICT (name) DO NOTHING`,
        [b.name, b.code, b.address]
      );
    }
    console.log('Seeded branches.');

    console.log('\n--- SEED COMPLETE ---');
    console.log('Email / Password for login:');
    users.forEach((u) => {
      console.log(`- ${u.role.toUpperCase()}: ${u.email} / ${defaultPassword}`);
    });
  } catch (err) {
    console.error('Seed error:', err);
  } finally {
    await client.end();
  }
}

seed();
