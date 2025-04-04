const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Database file path
const dbPath = path.resolve(__dirname, 'contacts.db');

// Check if database already exists and remove it to start fresh
if (fs.existsSync(dbPath)) {
  console.log('Removing existing database file...');
  fs.unlinkSync(dbPath);
}

// Create database connection
console.log('Creating new database file...');
const db = new sqlite3.Database(dbPath);

// Sample contact data
const sampleContacts = [
  {
    firstname: 'John',
    lastname: 'Doe',
    email: 'john.doe@example.com',
    homephone: '01-234-5678',
    mobile: '087-1234567',
    address: '123 Main St, Dublin, Ireland',
    birthday: '1985-03-15'
  },
  {
    firstname: 'Jane',
    lastname: 'Smith',
    email: 'jane.smith@example.com',
    homephone: '01-876-5432',
    mobile: '086-7654321',
    address: '456 High Street, Cork, Ireland',
    birthday: '1990-07-22'
  },
  {
    firstname: 'Michael',
    lastname: 'Johnson',
    email: 'michael.johnson@example.com',
    homephone: '01-555-1234',
    mobile: '085-5551234',
    address: '789 Park Lane, Galway, Ireland',
    birthday: '1982-11-05'
  },
  {
    firstname: 'Emma',
    lastname: 'Williams',
    email: 'emma.williams@example.com',
    homephone: '01-444-9876',
    mobile: '083-4449876',
    address: '101 River Road, Limerick, Ireland',
    birthday: '1988-04-30'
  },
  {
    firstname: 'David',
    lastname: 'Brown',
    email: 'david.brown@example.com',
    homephone: '01-333-6789',
    mobile: '089-3336789',
    address: '202 Mountain View, Waterford, Ireland',
    birthday: '1995-09-12'
  }
];

// Initialize database with tables and sample data
db.serialize(() => {
  // Create contacts table
  db.run(`
    CREATE TABLE IF NOT EXISTS contacts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      firstname TEXT NOT NULL,
      lastname TEXT NOT NULL,
      email TEXT NOT NULL,
      homephone TEXT,
      mobile TEXT,
      address TEXT,
      birthday TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) {
      console.error('Error creating contacts table:', err);
      process.exit(1);
    } else {
      console.log('Contacts table created successfully');
      
      // Prepare insert statement
      const stmt = db.prepare(`
        INSERT INTO contacts (firstname, lastname, email, homephone, mobile, address, birthday)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      
      // Insert sample data
      console.log('Inserting sample contacts...');
      sampleContacts.forEach(contact => {
        stmt.run(
          contact.firstname,
          contact.lastname,
          contact.email,
          contact.homephone,
          contact.mobile,
          contact.address,
          contact.birthday
        );
      });
      
      // Finalize statement
      stmt.finalize(() => {
        // Verify data was inserted by counting rows
        db.get('SELECT COUNT(*) as count FROM contacts', (err, row) => {
          if (err) {
            console.error('Error counting contacts:', err);
          } else {
            console.log(`Successfully inserted ${row.count} sample contacts`);
          }
          
          // Close database connection
          db.close((err) => {
            if (err) {
              console.error('Error closing database:', err);
            } else {
              console.log('Database created and populated successfully!');
              console.log(`Database file location: ${dbPath}`);
              console.log('You can now commit this file to your repository.');
            }
          });
        });
      });
    }
  });
}); 