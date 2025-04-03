const express = require('express');
const router = express.Router();
const db = require('../database');
const xss = require('xss');  //for input sanitization to prevent xss attacks
const csrf = require('csurf');  //csrf protection
const csrfProtection = csrf({ cookie: true });


//security headers middleware to defend against different types of attack
const setSecurityHeaders = (req, res, next) => {
  res.set('X-Frame-Options', 'DENY');   // prevent clickjacking by not allowing page to be embedded in iframe
  res.set('X-Content-Type-Options', 'nosniff'); //prevent MIME-sniffing by browsers
  res.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');   //tell browser to only communicate over HTTPS, all subdomains, 1 year
  res.set('Cache-Control', 'no-cache, no-store, must-revalidate'); //disable caching of sensitive data to prevent caching attacks
  //control sources from which resources can be loaded, only allows scripts, images, styles to be loaded from same origin (self)
  res.set('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self'; connect-src 'self'; form-action 'self'; frame-ancestors 'none'");
  //res.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=(), clipboard-read=(), clipboard-write=(), fullscreen=(), payment=()'); //adding permissions policy to stop access to sensitive apis
  res.set('Cross-Origin-Opener-Policy', 'same-origin'); //stop other sites accessing window
  res.set('Cross-Origin-Embedder-Policy', 'require-corp'); //prevent loading without specified permissions
  next();
};

//apply security headers middleware to all routes
router.use(setSecurityHeaders);
router.use(csrfProtection);

// variable sanitizing input - to strip out anything that might be suspect, like changing & to &amp or removing <script>
const sanitizeInput = (req, res, next) => {
  if (req.body) {
    //parameters
    req.body.firstname = xss(req.body.firstname);
    req.body.lastname = xss(req.body.lastname);
    req.body.email = xss(req.body.email);
    req.body.homephone = xss(req.body.homephone);
    req.body.mobile = xss(req.body.mobile);
    req.body.address = xss(req.body.address);
    req.body.birthday = xss(req.body.birthday);
  }
  next();
};


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

//post new contact - sanitizing input
router.post('/', sanitizeInput, async (req, res, next) => {
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

//put/update a contact - with sanitized input
router.put('/:id', sanitizeInput, async (req, res, next) => {
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
