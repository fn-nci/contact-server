const express = require('express');
const router = express.Router();
const db = require('../database');

// security headers middleware to defend against various attacks
const setSecurityHeaders = (req, res, next) => {
  res.set('X-Frame-Options', 'DENY');   // prevent clickjacking by not allowing page to be embedded in iframe
  res.set('X-Content-Type-Options', 'nosniff'); //prevent MIME-sniffing by browsers
  res.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');   //tell browser to only communicate over HTTPS, all subdomains, 1 year
  res.set('Cache-Control', 'no-cache, no-store, must-revalidate'); //disable caching of sensitive data to prevent caching attacks
  //control sources from which resources can be loaded, only allows scripts, images, styles to be loaded from same origin (self)
  res.set('Content-Security-Policy', "default-src 'none'; script-src 'self'; connect-src 'self'; img-src 'self'; style-src 'self'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'");
  next();
};

//apply security headers middleware to all routes
router.use(setSecurityHeaders);

//get all contacts 
router.get('/', async (req, res, next) => {
  try {
    const contacts = await db.all('SELECT * FROM contacts ORDER BY lastname, firstname');
    res.json(contacts);
  } catch (error) {
    next(error);
  }
});

//get a single contact
router.get('/:id', async (req, res, next) => {
  try {
    const contact = await db.get('SELECT * FROM contacts WHERE id = ?', [req.params.id]);
    //return error if contact doesn't exist
    if (!contact) {
      return res.status(404).json({ success: false, message: 'Contact not found' });
    }
    res.json(contact);
  } catch (error) {
    next(error);
  }
});

//post new contact
router.post('/', async (req, res, next) => {
  try {
    const { firstname, lastname, email, homephone, mobile, address, birthday } = req.body;
    //checking for required fields, returning error if they are blank
    if (!firstname || !lastname || !email) {
      return res.status(400).json({ success: false, message: 'First name, last name and email are required' });
    }
    const result = await db.run(
      `INSERT INTO contacts (firstname, lastname, email, homephone, mobile, address, birthday) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [firstname, lastname, email, homephone || null, mobile || null, address || null, birthday || null]
    );

    const newContact = await db.get('SELECT * FROM contacts WHERE id = ?', [result.id]);
    res.status(201).json(newContact);
  } catch (error) {
    next(error);
  }
});

//put/update a contact
router.put('/:id', async (req, res, next) => {
  try {
    const { firstname, lastname, email, homephone, mobile, address, birthday } = req.body;
    const contactId = req.params.id;
    //validatoin
    if (!firstname || !lastname || !email) {
      return res.status(400).json({ success: false, message: 'First name, last name and email are required' });
    }
    //check if contact exists
    const existingContact = await db.get('SELECT * FROM contacts WHERE id = ?', [contactId]);
    if (!existingContact) {
      return res.status(404).json({ success: false, message: 'Contact not found' });
    }

    await db.run(
      `UPDATE contacts 
       SET firstname = ?, lastname = ?, email = ?, homephone = ?, mobile = ?, address = ?, birthday = ? 
       WHERE id = ?`,
      [firstname, lastname, email, homephone || null, mobile || null, address || null, birthday || null, contactId]
    );

    const updatedContact = await db.get('SELECT * FROM contacts WHERE id = ?', [contactId]);
    res.json(updatedContact);
  } catch (error) {
    next(error);
  }
});

//delete a contact
router.delete('/:id', async (req, res, next) => {
  try {
    const contactId = req.params.id;
    const existingContact = await db.get('SELECT * FROM contacts WHERE id = ?', [contactId]);
    //check if contact exists
    if (!existingContact) {    //return error if contact doesn't exist
      return res.status(404).json({ success: false, message: 'Contact not found' });
    }

    await db.run('DELETE FROM contacts WHERE id = ?', [contactId]);
    res.json({ success: true, message: 'Contact deleted successfully' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
