const express = require('express');
const router = express.Router();
const db = require('../database');

// GET all contacts
router.get('/', async (req, res, next) => {
  try {
    const contacts = await db.all('SELECT * FROM contacts ORDER BY lastname, firstname');
    res.json(contacts);
  } catch (error) {
    next(error);
  }
});

// GET a single contact
router.get('/:id', async (req, res, next) => {
  try {
    const contact = await db.get('SELECT * FROM contacts WHERE id = ?', [req.params.id]);
    
    if (!contact) {
      return res.status(404).json({ 
        success: false, 
        message: 'Contact not found' 
      });
    }
    
    res.json(contact);
  } catch (error) {
    next(error);
  }
});

// POST a new contact
router.post('/', async (req, res, next) => {
  try {
    const { firstname, lastname, email, homephone, mobile, address, birthday } = req.body;
    
    // Validation
    if (!firstname || !lastname || !email) {
      return res.status(400).json({ 
        success: false, 
        message: 'First name, last name and email are required' 
      });
    }
    
    const result = await db.run(
      `INSERT INTO contacts 
       (firstname, lastname, email, homephone, mobile, address, birthday) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [firstname, lastname, email, homephone || null, mobile || null, address || null, birthday || null]
    );
    
    const newContact = await db.get('SELECT * FROM contacts WHERE id = ?', [result.id]);
    
    res.status(201).json(newContact);
  } catch (error) {
    next(error);
  }
});

// PUT (update) a contact
router.put('/:id', async (req, res, next) => {
  try {
    const { firstname, lastname, email, homephone, mobile, address, birthday } = req.body;
    const contactId = req.params.id;
    
    // Validation
    if (!firstname || !lastname || !email) {
      return res.status(400).json({ 
        success: false, 
        message: 'First name, last name and email are required' 
      });
    }
    
    // Check if contact exists
    const existingContact = await db.get('SELECT * FROM contacts WHERE id = ?', [contactId]);
    
    if (!existingContact) {
      return res.status(404).json({ 
        success: false, 
        message: 'Contact not found' 
      });
    }
    
    await db.run(
      `UPDATE contacts 
       SET firstname = ?, lastname = ?, email = ?, 
           homephone = ?, mobile = ?, address = ?, 
           birthday = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [firstname, lastname, email, homephone || null, mobile || null, 
       address || null, birthday || null, contactId]
    );
    
    const updatedContact = await db.get('SELECT * FROM contacts WHERE id = ?', [contactId]);
    
    res.json(updatedContact);
  } catch (error) {
    next(error);
  }
});

// DELETE a contact
router.delete('/:id', async (req, res, next) => {
  try {
    const contactId = req.params.id;
    
    // Check if contact exists
    const existingContact = await db.get('SELECT * FROM contacts WHERE id = ?', [contactId]);
    
    if (!existingContact) {
      return res.status(404).json({ 
        success: false, 
        message: 'Contact not found' 
      });
    }
    
    await db.run('DELETE FROM contacts WHERE id = ?', [contactId]);
    
    res.json({ 
      success: true, 
      message: 'Contact deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router; 