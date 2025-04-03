import pg from 'pg';
const { Client } = pg;

// Update these with your actual credentials
const dbConfig = {
  host: 'localhost',
  port: 5432,
  user: 'intersys_user',
  password: 'DLSU1234!', // Replace with your actual password
  database: 'dlsu_internsys'
};

async function testConnection() {
  const client = new Client(dbConfig);
  try {
    await client.connect();
    console.log('✅ Database connection successful!');
    const res = await client.query('SELECT NOW()');
    console.log('🕒 Database time:', res.rows[0].now);
  } catch (err) {
    console.error('❌ Connection failed:', err.message);
  } finally {
    await client.end();
  }
}

testConnection();
