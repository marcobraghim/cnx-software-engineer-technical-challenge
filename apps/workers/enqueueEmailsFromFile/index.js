const functions = require('@google-cloud/functions-framework');
const { Storage } = require('@google-cloud/storage');
const { Pool } = require('pg');

const storage = new Storage();

// Create a connection pool for Cloud SQL Postgres
const pool = new Pool({
  host: `/cloudsql/${process.env.CLOUD_SQL_CONNECTION_NAME}`, // project:region:instance
  database: process.env.DB_NAME || 'postgres',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
});

// Register a CloudEvent callback with the Functions Framework that will
// be triggered by Cloud Storage.
functions.cloudEvent('enqueueEmailsFromFile', async cloudEvent => {
  const file = cloudEvent.data;

  if (file.contentType !== 'application/json') {
    console.log(`File content type is not application/json, skipping...`);
    return;
  }
  
  // Read the file content from Cloud Storage
  const bucket = storage.bucket(file.bucket);
  const fileObject = bucket.file(file.name);
  const [fileContent] = await fileObject.download();

  // Validate the file content
  const jsonContent = JSON.parse(fileContent.toString() ?? '{}');
  if (!jsonContent.emailsysId || !jsonContent.emails || !Array.isArray(jsonContent.emails) || jsonContent.emails.length === 0) {
    throw new Error('File content is not valid');
  }

  // Enqueue the emails to the database Cloud SQL Postgres
  const emailsysId = jsonContent.emailsysId;
  const emails = jsonContent.emails;

  console.log(`Inserting ${emails.length} emails for emailsysId: ${emailsysId}`);

  // Get a client from the pool and use a transaction for atomicity
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Insert each email as a record in emailsys_item table
    for (const email of emails) {
      await client.query(
        'INSERT INTO emailsys_item (fk_emailsys, emailto, subject, body, status) VALUES ($1, $2, $3, $4, $5)',
        [emailsysId, email, '', '', 'pending']
      );
    }
    
    await client.query('COMMIT');
    console.log(`Successfully inserted ${emails.length} emails into emailsys_item table`);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error inserting emails, transaction rolled back:', error);
    throw error;
  } finally {
    client.release();
  }
});

