const express = require('express');
const mysql = require('mysql2');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads-berkahexpress'));

// Create uploads directory if it doesn't exist
if (!fs.existsSync('uploads-berkahexpress')) {
  fs.mkdirSync('uploads-berkahexpress');
}

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads-berkahexpress/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// Database connection
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

db.connect((err) => {
  if (err) {
    console.error('Database connection failed:', err);
    return;
  }
  console.log('Connected to MySQL database');
});

// Middleware untuk autentikasi
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ success: false, message: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// Middleware untuk admin only
const adminOnly = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Admin access required' });
  }
  next();
};

// Utility function untuk generate resi
const generateResi = () => {
  const prefix = 'BE';
  const timestamp = Date.now().toString();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `${prefix}${timestamp.slice(-8)}${random}`;
};

// ==================== AUTH ROUTES ====================

// Login
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password required' });
  }

  db.query('SELECT * FROM users WHERE email = ?', [email], async (err, results) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Database error' });
    }

    if (results.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const user = results[0];
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    const { password: userPassword, ...userWithoutPassword } = user;

    res.json({
      success: true,
      data: { token, user: userWithoutPassword }
    });
  });
});

// Register
app.post('/api/auth/register', async (req, res) => {
  const { name, email, phone, address, password } = req.body;

  if (!name || !email || !phone || !address || !password) {
    return res.status(400).json({ success: false, message: 'All fields are required' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    db.query(
      'INSERT INTO users (name, email, phone, address, password) VALUES (?, ?, ?, ?, ?)',
      [name, email, phone, address, hashedPassword],
      (err, results) => {
        if (err) {
          if (err.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ success: false, message: 'Email already exists' });
          }
          return res.status(500).json({ success: false, message: 'Database error' });
        }

        res.status(201).json({
          success: true,
          message: 'User registered successfully'
        });
      }
    );
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get profile
app.get('/api/auth/profile', authenticateToken, (req, res) => {
  db.query('SELECT id, name, email, phone, address, role, balance, ekspedisi_name FROM users WHERE id = ?', [req.user.id], (err, results) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Database error' });
    }

    if (results.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, data: results[0] });
  });
});

// Update profile
app.put('/api/auth/profile', authenticateToken, (req, res) => {
  const { name, phone, address, ekspedisi_name } = req.body;
  const userId = req.user.id;

  // Only allow mitra to update ekspedisi_name
  let query, params;
  if (req.user.role === 'mitra') {
    query = 'UPDATE users SET name = ?, phone = ?, address = ?, ekspedisi_name = ? WHERE id = ?';
    params = [name, phone, address, ekspedisi_name || null, userId];
  } else {
    query = 'UPDATE users SET name = ?, phone = ?, address = ? WHERE id = ?';
    params = [name, phone, address, userId];
  }

  db.query(query, params, (err, results) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Database error' });
    }

    if (results.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Return updated user
    db.query('SELECT id, name, email, phone, address, role, balance, ekspedisi_name FROM users WHERE id = ?', [userId], (err, userResults) => {
      if (err) {
        return res.status(500).json({ success: false, message: 'Database error' });
      }

      res.json({ success: true, message: 'Profile updated successfully', data: userResults[0] });
    });
  });
});

// ==================== USER MANAGEMENT ROUTES ====================

// Get all users (admin only)
app.get('/api/users', authenticateToken, adminOnly, (req, res) => {
  db.query('SELECT id, name, email, phone, address, role, balance, created_at FROM users ORDER BY created_at DESC', (err, results) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Database error' });
    }
    res.json({ success: true, data: results });
  });
});

// Get user by ID
app.get('/api/users/:id', authenticateToken, adminOnly, (req, res) => {
  const userId = req.params.id;

  db.query('SELECT id, name, email, phone, address, role, balance, created_at FROM users WHERE id = ?', [userId], (err, results) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Database error' });
    }

    if (results.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, data: results[0] });
  });
});

// Update user
app.put('/api/users/:id', authenticateToken, adminOnly, async (req, res) => {
  const userId = req.params.id;
  const { name, email, phone, address, role, password } = req.body;

  try {
    // If password is provided, hash it
    let query, params;
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      query = 'UPDATE users SET name = ?, email = ?, phone = ?, address = ?, role = ?, password = ? WHERE id = ?';
      params = [name, email, phone, address, role, hashedPassword, userId];
    } else {
      query = 'UPDATE users SET name = ?, email = ?, phone = ?, address = ?, role = ? WHERE id = ?';
      params = [name, email, phone, address, role, userId];
    }

    db.query(query, params, (err, results) => {
      if (err) {
        if (err.code === 'ER_DUP_ENTRY') {
          return res.status(400).json({ success: false, message: 'Email already exists' });
        }
        return res.status(500).json({ success: false, message: 'Database error' });
      }

      if (results.affectedRows === 0) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      res.json({ success: true, message: 'User updated successfully' });
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Update user balance
app.put('/api/users/:id/balance', authenticateToken, adminOnly, (req, res) => {
  const userId = req.params.id;
  const { amount, type } = req.body; // type: 'add' atau 'subtract'

  if (!amount || !type || (type !== 'add' && type !== 'subtract')) {
    return res.status(400).json({ success: false, message: 'Invalid amount or type' });
  }

  const operator = type === 'add' ? '+' : '-';
  
  db.query(
    `UPDATE users SET balance = balance ${operator} ? WHERE id = ?`,
    [amount, userId],
    (err, results) => {
      if (err) {
        return res.status(500).json({ success: false, message: 'Database error' });
      }

      if (results.affectedRows === 0) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      res.json({ success: true, message: 'Balance updated successfully' });
    }
  );
});

// Delete user
app.delete('/api/users/:id', authenticateToken, adminOnly, (req, res) => {
  const userId = req.params.id;

  db.query('DELETE FROM users WHERE id = ?', [userId], (err, results) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Database error' });
    }

    if (results.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, message: 'User deleted successfully' });
  });
});

// ==================== PRICE MANAGEMENT ROUTES ====================

// Get all prices with their tiers
app.get('/api/prices', (req, res) => {
  db.query('SELECT * FROM prices ORDER BY country, category', (err, results) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Database error' });
    }
    
    // Get tiers for each price
    const pricesWithTiers = [];
    let processed = 0;
    
    if (results.length === 0) {
      return res.json({ success: true, data: [] });
    }
    
    results.forEach((price) => {
      db.query(
        'SELECT * FROM price_tiers WHERE price_id = ? ORDER BY min_weight ASC',
        [price.id],
        (err, tiers) => {
          if (err) {
            console.error('Error fetching tiers:', err);
            tiers = [];
          }
          
          pricesWithTiers.push({
            ...price,
            tiers: tiers || []
          });
          
          processed++;
          if (processed === results.length) {
            res.json({ success: true, data: pricesWithTiers });
          }
        }
      );
    });
  });
});

// Get prices by country and category (for customer order form)
app.get('/api/prices/:country/:category', (req, res) => {
  const { country, category } = req.params;
  
  db.query(
    'SELECT * FROM prices WHERE country = ? AND category = ?',
    [country, category],
    (err, results) => {
      if (err) {
        return res.status(500).json({ success: false, message: 'Database error' });
      }
      
      if (results.length === 0) {
        return res.status(404).json({ success: false, message: 'Price not found' });
      }
      
      res.json({ success: true, data: results[0] });
    }
  );
});

// Create price with optional tiers
app.post('/api/prices', authenticateToken, adminOnly, (req, res) => {
  const { 
    country, 
    category, 
    price_per_kg, 
    price_per_volume, 
    price_per_kg_mitra, 
    price_per_volume_mitra, 
    is_identity,
    use_tiered_pricing,
    tiers
  } = req.body;

  if (!country || !category) {
    return res.status(400).json({ success: false, message: 'Country and category are required' });
  }

  // If not using tiered pricing, regular prices are required
  if (!use_tiered_pricing && (!price_per_kg || !price_per_volume || !price_per_kg_mitra || !price_per_volume_mitra)) {
    return res.status(400).json({ success: false, message: 'All price fields are required for non-tiered pricing' });
  }

  // If using tiered pricing, tiers are required
  if (use_tiered_pricing && (!tiers || tiers.length === 0)) {
    return res.status(400).json({ success: false, message: 'At least one tier is required for tiered pricing' });
  }

  db.beginTransaction((err) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Transaction error' });
    }

    db.query(
      `INSERT INTO prices (country, category, price_per_kg, price_per_volume, price_per_kg_mitra, price_per_volume_mitra, is_identity, use_tiered_pricing) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        country, 
        category, 
        price_per_kg || 0, 
        price_per_volume || 0, 
        price_per_kg_mitra || 0, 
        price_per_volume_mitra || 0, 
        is_identity || false,
        use_tiered_pricing || false
      ],
      (err, results) => {
        if (err) {
          return db.rollback(() => {
            if (err.code === 'ER_DUP_ENTRY') {
              return res.status(400).json({ success: false, message: 'Price for this country and category already exists' });
            }
            return res.status(500).json({ success: false, message: 'Database error' });
          });
        }

        const priceId = results.insertId;

        // If using tiered pricing, insert tiers
        if (use_tiered_pricing && tiers && tiers.length > 0) {
          const tierValues = tiers.map(tier => [
            priceId,
            tier.min_weight,
            tier.max_weight,
            tier.price_per_kg,
            tier.price_per_volume,
            tier.price_per_kg_mitra,
            tier.price_per_volume_mitra
          ]);

          db.query(
            `INSERT INTO price_tiers (price_id, min_weight, max_weight, price_per_kg, price_per_volume, price_per_kg_mitra, price_per_volume_mitra) 
             VALUES ?`,
            [tierValues],
            (err) => {
              if (err) {
                return db.rollback(() => {
                  console.error('Error inserting tiers:', err);
                  res.status(500).json({ success: false, message: 'Error creating price tiers' });
                });
              }

              db.commit((err) => {
                if (err) {
                  return db.rollback(() => {
                    res.status(500).json({ success: false, message: 'Commit error' });
                  });
                }

                res.status(201).json({
                  success: true,
                  message: 'Price created successfully with tiers',
                  data: { id: priceId }
                });
              });
            }
          );
        } else {
          db.commit((err) => {
            if (err) {
              return db.rollback(() => {
                res.status(500).json({ success: false, message: 'Commit error' });
              });
            }

            res.status(201).json({
              success: true,
              message: 'Price created successfully',
              data: { id: priceId }
            });
          });
        }
      }
    );
  });
});

// Update price with tiers
app.put('/api/prices/:id', authenticateToken, adminOnly, (req, res) => {
  const priceId = req.params.id;
  const { 
    country, 
    category, 
    price_per_kg, 
    price_per_volume, 
    price_per_kg_mitra, 
    price_per_volume_mitra, 
    is_identity,
    use_tiered_pricing,
    tiers
  } = req.body;

  if (!country || !category) {
    return res.status(400).json({ success: false, message: 'Country and category are required' });
  }

  db.beginTransaction((err) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Transaction error' });
    }

    db.query(
      `UPDATE prices 
       SET country = ?, category = ?, price_per_kg = ?, price_per_volume = ?, 
           price_per_kg_mitra = ?, price_per_volume_mitra = ?, is_identity = ?, use_tiered_pricing = ? 
       WHERE id = ?`,
      [
        country, 
        category, 
        price_per_kg || 0, 
        price_per_volume || 0, 
        price_per_kg_mitra || 0, 
        price_per_volume_mitra || 0, 
        is_identity || false, 
        use_tiered_pricing || false, 
        priceId
      ],
      (err, results) => {
        if (err) {
          return db.rollback(() => {
            if (err.code === 'ER_DUP_ENTRY') {
              return res.status(400).json({ success: false, message: 'Price for this country and category already exists' });
            }
            return res.status(500).json({ success: false, message: 'Database error' });
          });
        }

        if (results.affectedRows === 0) {
          return db.rollback(() => {
            res.status(404).json({ success: false, message: 'Price not found' });
          });
        }

        // Delete existing tiers
        db.query('DELETE FROM price_tiers WHERE price_id = ?', [priceId], (err) => {
          if (err) {
            return db.rollback(() => {
              res.status(500).json({ success: false, message: 'Error deleting old tiers' });
            });
          }

          // If using tiered pricing, insert new tiers
          if (use_tiered_pricing && tiers && tiers.length > 0) {
            const tierValues = tiers.map(tier => [
              priceId,
              tier.min_weight,
              tier.max_weight,
              tier.price_per_kg,
              tier.price_per_volume,
              tier.price_per_kg_mitra,
              tier.price_per_volume_mitra
            ]);

            db.query(
              `INSERT INTO price_tiers (price_id, min_weight, max_weight, price_per_kg, price_per_volume, price_per_kg_mitra, price_per_volume_mitra) 
               VALUES ?`,
              [tierValues],
              (err) => {
                if (err) {
                  return db.rollback(() => {
                    console.error('Error inserting tiers:', err);
                    res.status(500).json({ success: false, message: 'Error creating price tiers' });
                  });
                }

                db.commit((err) => {
                  if (err) {
                    return db.rollback(() => {
                      res.status(500).json({ success: false, message: 'Commit error' });
                    });
                  }

                  res.json({ success: true, message: 'Price updated successfully with tiers' });
                });
              }
            );
          } else {
            db.commit((err) => {
              if (err) {
                return db.rollback(() => {
                  res.status(500).json({ success: false, message: 'Commit error' });
                });
              }

              res.json({ success: true, message: 'Price updated successfully' });
            });
          }
        });
      }
    );
  });
});

// Delete price
app.delete('/api/prices/:id', authenticateToken, adminOnly, (req, res) => {
  const priceId = req.params.id;

  db.query('DELETE FROM prices WHERE id = ?', [priceId], (err, results) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Database error' });
    }

    if (results.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Price not found' });
    }

    res.json({ success: true, message: 'Price deleted successfully' });
  });
});

// ==================== BANK ACCOUNT ROUTES ====================

// Get all bank accounts
app.get('/api/accounts', (req, res) => {
  db.query('SELECT * FROM bank_accounts WHERE is_active = TRUE ORDER BY bank_name', (err, results) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Database error' });
    }
    res.json({ success: true, data: results });
  });
});

// Create bank account
app.post('/api/accounts', authenticateToken, adminOnly, (req, res) => {
  const { bank_name, account_number, account_holder } = req.body;

  if (!bank_name || !account_number || !account_holder) {
    return res.status(400).json({ success: false, message: 'All fields are required' });
  }

  db.query(
    'INSERT INTO bank_accounts (bank_name, account_number, account_holder) VALUES (?, ?, ?)',
    [bank_name, account_number, account_holder],
    (err, results) => {
      if (err) {
        return res.status(500).json({ success: false, message: 'Database error' });
      }

      res.status(201).json({
        success: true,
        message: 'Bank account created successfully',
        data: { id: results.insertId }
      });
    }
  );
});

// Update bank account
app.put('/api/accounts/:id', authenticateToken, adminOnly, (req, res) => {
  const accountId = req.params.id;
  const { bank_name, account_number, account_holder, is_active } = req.body;

  db.query(
    'UPDATE bank_accounts SET bank_name = ?, account_number = ?, account_holder = ?, is_active = ? WHERE id = ?',
    [bank_name, account_number, account_holder, is_active, accountId],
    (err, results) => {
      if (err) {
        return res.status(500).json({ success: false, message: 'Database error' });
      }

      if (results.affectedRows === 0) {
        return res.status(404).json({ success: false, message: 'Bank account not found' });
      }

      res.json({ success: true, message: 'Bank account updated successfully' });
    }
  );
});

// Delete bank account
app.delete('/api/accounts/:id', authenticateToken, adminOnly, (req, res) => {
  const accountId = req.params.id;

  db.query('DELETE FROM bank_accounts WHERE id = ?', [accountId], (err, results) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Database error' });
    }

    if (results.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Bank account not found' });
    }

    res.json({ success: true, message: 'Bank account deleted successfully' });
  });
});

// ==================== EXPEDITION ROUTES ====================

// Get all expeditions
app.get('/api/expeditions', (req, res) => {
  db.query('SELECT * FROM expeditions WHERE is_active = TRUE ORDER BY name', (err, results) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Database error' });
    }
    res.json({ success: true, data: results });
  });
});

// Get all expeditions (admin - including inactive)
app.get('/api/expeditions/all', authenticateToken, adminOnly, (req, res) => {
  db.query('SELECT * FROM expeditions ORDER BY name', (err, results) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Database error' });
    }
    res.json({ success: true, data: results });
  });
});

// Create expedition
app.post('/api/expeditions', authenticateToken, adminOnly, (req, res) => {
  const { name, code, api_url, api_key } = req.body;

  if (!name || !code) {
    return res.status(400).json({ success: false, message: 'Name and code are required' });
  }

  db.query(
    'INSERT INTO expeditions (name, code, api_url, api_key) VALUES (?, ?, ?, ?)',
    [name, code, api_url || null, api_key || null],
    (err, results) => {
      if (err) {
        if (err.code === 'ER_DUP_ENTRY') {
          return res.status(400).json({ success: false, message: 'Expedition code already exists' });
        }
        return res.status(500).json({ success: false, message: 'Database error' });
      }

      res.status(201).json({
        success: true,
        message: 'Expedition created successfully',
        data: { id: results.insertId }
      });
    }
  );
});

// Update expedition
app.put('/api/expeditions/:id', authenticateToken, adminOnly, (req, res) => {
  const expeditionId = req.params.id;
  const { name, code, api_url, api_key, is_active } = req.body;

  db.query(
    'UPDATE expeditions SET name = ?, code = ?, api_url = ?, api_key = ?, is_active = ? WHERE id = ?',
    [name, code, api_url || null, api_key || null, is_active, expeditionId],
    (err, results) => {
      if (err) {
        if (err.code === 'ER_DUP_ENTRY') {
          return res.status(400).json({ success: false, message: 'Expedition code already exists' });
        }
        return res.status(500).json({ success: false, message: 'Database error' });
      }

      if (results.affectedRows === 0) {
        return res.status(404).json({ success: false, message: 'Expedition not found' });
      }

      res.json({ success: true, message: 'Expedition updated successfully' });
    }
  );
});

// Delete expedition
app.delete('/api/expeditions/:id', authenticateToken, adminOnly, (req, res) => {
  const expeditionId = req.params.id;

  db.query('DELETE FROM expeditions WHERE id = ?', [expeditionId], (err, results) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Database error' });
    }

    if (results.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Expedition not found' });
    }

    res.json({ success: true, message: 'Expedition deleted successfully' });
  });
});

// ==================== TOPUP ROUTES ====================

// Get all topups (admin) or user topups
app.get('/api/topups', authenticateToken, (req, res) => {
  let query = `
    SELECT t.*, u.name as user_name, u.email as user_email, 
           b.bank_name, b.account_number, b.account_holder
    FROM topups t 
    JOIN users u ON t.user_id = u.id 
    JOIN bank_accounts b ON t.bank_account_id = b.id
  `;
  let params = [];

  if (req.user.role === 'customer') {
    query += ' WHERE t.user_id = ?';
    params.push(req.user.id);
  }

  query += ' ORDER BY t.created_at DESC';

  db.query(query, params, (err, results) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Database error' });
    }
    res.json({ success: true, data: results });
  });
});

// Create topup request
app.post('/api/topups', authenticateToken, upload.single('proof_image'), (req, res) => {
  const { bank_account_id, amount } = req.body;
  const proof_image = req.file ? req.file.filename : null;

  if (!bank_account_id || !amount || !proof_image) {
    return res.status(400).json({ success: false, message: 'All fields are required including proof image' });
  }

  db.query(
    'INSERT INTO topups (user_id, bank_account_id, amount, proof_image) VALUES (?, ?, ?, ?)',
    [req.user.id, bank_account_id, amount, proof_image],
    (err, results) => {
      if (err) {
        return res.status(500).json({ success: false, message: 'Database error' });
      }

      res.status(201).json({
        success: true,
        message: 'Topup request submitted successfully',
        data: { id: results.insertId }
      });
    }
  );
});

// Update topup status (admin only)
app.put('/api/topups/:id/status', authenticateToken, adminOnly, (req, res) => {
  const topupId = req.params.id;
  const { status, admin_notes } = req.body;

  if (!status || (status !== 'approved' && status !== 'rejected')) {
    return res.status(400).json({ success: false, message: 'Invalid status' });
  }

  // Start transaction
  db.beginTransaction((err) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Transaction error' });
    }

    // Update topup status
    db.query(
      'UPDATE topups SET status = ?, admin_notes = ? WHERE id = ?',
      [status, admin_notes || null, topupId],
      (err, results) => {
        if (err) {
          return db.rollback(() => {
            res.status(500).json({ success: false, message: 'Database error' });
          });
        }

        if (results.affectedRows === 0) {
          return db.rollback(() => {
            res.status(404).json({ success: false, message: 'Topup not found' });
          });
        }

        // If approved, update user balance
        if (status === 'approved') {
          db.query('SELECT user_id, amount FROM topups WHERE id = ?', [topupId], (err, topupResults) => {
            if (err) {
              return db.rollback(() => {
                res.status(500).json({ success: false, message: 'Database error' });
              });
            }

            const { user_id, amount } = topupResults[0];

            db.query(
              'UPDATE users SET balance = balance + ? WHERE id = ?',
              [amount, user_id],
              (err, userResults) => {
                if (err) {
                  return db.rollback(() => {
                    res.status(500).json({ success: false, message: 'Database error' });
                  });
                }

                db.commit((err) => {
                  if (err) {
                    return db.rollback(() => {
                      res.status(500).json({ success: false, message: 'Commit error' });
                    });
                  }

                  res.json({ success: true, message: 'Topup approved and balance updated' });
                });
              }
            );
          });
        } else {
          // Just commit if rejected
          db.commit((err) => {
            if (err) {
              return db.rollback(() => {
                res.status(500).json({ success: false, message: 'Commit error' });
              });
            }

            res.json({ success: true, message: 'Topup status updated' });
          });
        }
      }
    );
  });
});

// ==================== TRANSACTION ROUTES ====================

// Get all transactions (admin) or user transactions with pagination
app.get('/api/transactions', authenticateToken, (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  let countQuery = `
    SELECT COUNT(*) as total
    FROM transactions t 
    JOIN users u ON t.user_id = u.id
  `;
  let countParams = [];

  let dataQuery = `
    SELECT t.*, u.name as user_name, u.email as user_email, u.phone as user_phone, u.address as user_address, u.role as user_role, u.ekspedisi_name
    FROM transactions t 
    JOIN users u ON t.user_id = u.id
  `;
  let dataParams = [];

  if (req.user.role === 'customer' || req.user.role === 'mitra') {
    countQuery += ' WHERE t.user_id = ?';
    dataQuery += ' WHERE t.user_id = ?';
    countParams.push(req.user.id);
    dataParams.push(req.user.id);
  }

  dataQuery += ' ORDER BY t.created_at DESC LIMIT ? OFFSET ?';
  dataParams.push(limit, offset);

  // Get total count
  db.query(countQuery, countParams, (err, countResults) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Database error' });
    }

    const total = countResults[0].total;
    const totalPages = Math.ceil(total / limit);

    // Get paginated data
    db.query(dataQuery, dataParams, (err, results) => {
      if (err) {
        return res.status(500).json({ success: false, message: 'Database error' });
      }

      res.json({ 
        success: true, 
        data: results,
        pagination: {
          page,
          limit,
          total,
          totalPages
        }
      });
    });
  });
});

// Get user transactions with pagination
app.get('/api/transactions/user', authenticateToken, (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  // Get total count
  db.query(
    `SELECT COUNT(*) as total FROM transactions WHERE user_id = ?`,
    [req.user.id],
    (err, countResults) => {
      if (err) {
        return res.status(500).json({ success: false, message: 'Database error' });
      }

      const total = countResults[0].total;
      const totalPages = Math.ceil(total / limit);

      // Get paginated data
      db.query(
        `SELECT t.*, u.name as user_name, u.phone as user_phone, u.address as user_address, u.role as user_role, u.ekspedisi_name
         FROM transactions t 
         JOIN users u ON t.user_id = u.id 
         WHERE t.user_id = ? 
         ORDER BY t.created_at DESC 
         LIMIT ? OFFSET ?`,
        [req.user.id, limit, offset],
        (err, results) => {
          if (err) {
            return res.status(500).json({ success: false, message: 'Database error' });
          }
          res.json({ 
            success: true, 
            data: results,
            totalPages,
            pagination: {
              page,
              limit,
              total,
              totalPages
            }
          });
        }
      );
    }
  );
});

// Create transaction with file uploads
app.post('/api/transactions', authenticateToken, upload.fields([
  { name: 'foto_alamat', maxCount: 1 },
  { name: 'tanda_pengenal_depan', maxCount: 1 },
  { name: 'tanda_pengenal_belakang', maxCount: 1 }
]), (req, res) => {
  const { 
    sender_name,
    sender_phone,
    sender_address,
    destination,
    receiver_name,
    receiver_phone, 
    receiver_address, 
    item_category,
    weight, 
    length, 
    width, 
    height,
    isi_paket,
    kode_pos_penerima,
    nomor_identitas_penerima,
    email_penerima
  } = req.body;

  if (!sender_name || !sender_phone || !sender_address || !destination || !receiver_name || !receiver_phone || !receiver_address || !item_category || !weight || !length || !width || !height || !isi_paket) {
    return res.status(400).json({ success: false, message: 'All required fields must be filled' });
  }

  // Get user role to determine pricing
  db.query('SELECT role FROM users WHERE id = ?', [req.user.id], (err, userRoleResults) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Database error' });
    }

    const userRole = userRoleResults[0].role;
    
    // Get price for destination and category
    db.query('SELECT * FROM prices WHERE country = ? AND category = ?', [destination, item_category], (err, priceResults) => {
      if (err) {
        return res.status(500).json({ success: false, message: 'Database error' });
      }

      if (priceResults.length === 0) {
        return res.status(400).json({ success: false, message: 'Price not available for this destination and category' });
      }

      const price = priceResults[0];
      
      // Explicitly convert dimensions to numbers to avoid string concatenation issues
      const weightNum = Number(weight);
      const lengthNum = Number(length);
      const widthNum = Number(width);
      const heightNum = Number(height);
      const volume = (lengthNum * widthNum * heightNum) / 5000; // Volume weight in kg
      
      // Use the larger value between actual weight and volume weight for tier selection
      const effectiveWeight = Math.max(weightNum, volume);
      
      // Function to calculate price based on tiered or flat pricing
      const calculatePrice = (callback) => {
        if (price.use_tiered_pricing) {
          // Get applicable tier based on effective weight (max of weight and volume)
          db.query(
            `SELECT * FROM price_tiers 
             WHERE price_id = ? 
             AND min_weight <= ? 
             AND (max_weight >= ? OR max_weight IS NULL)
             ORDER BY min_weight DESC
             LIMIT 1`,
            [price.id, effectiveWeight, effectiveWeight],
            (err, tierResults) => {
              if (err) {
                return res.status(500).json({ success: false, message: 'Database error fetching tiers' });
              }

              if (tierResults.length === 0) {
                return res.status(400).json({ success: false, message: 'No pricing tier found for this weight' });
              }

              const tier = tierResults[0];
              const pricePerKg = userRole === 'mitra' ? tier.price_per_kg_mitra : tier.price_per_kg;
              const pricePerVolume = userRole === 'mitra' ? tier.price_per_volume_mitra : tier.price_per_volume;
              
              const weightPrice = weightNum * pricePerKg;
              const volumePrice = volume * pricePerVolume;
              const totalPrice = Math.max(weightPrice, volumePrice);

              callback({ pricePerKg, pricePerVolume, totalPrice });
            }
          );
        } else {
          // Use flat pricing
          const pricePerKg = userRole === 'mitra' ? price.price_per_kg_mitra : price.price_per_kg;
          const pricePerVolume = userRole === 'mitra' ? price.price_per_volume_mitra : price.price_per_volume;
          
          const weightPrice = weightNum * pricePerKg;
          const volumePrice = volume * pricePerVolume;
          const totalPrice = Math.max(weightPrice, volumePrice);

          callback({ pricePerKg, pricePerVolume, totalPrice });
        }
      };

      // Calculate price and continue with transaction
      calculatePrice(({ pricePerKg, pricePerVolume, totalPrice }) => {

        // Check user balance
        db.query('SELECT balance FROM users WHERE id = ?', [req.user.id], (err, userResults) => {
          if (err) {
            return res.status(500).json({ success: false, message: 'Database error' });
          }

          const userBalance = userResults[0].balance;

          if (userBalance < totalPrice) {
            return res.status(400).json({ 
              success: false, 
              message: 'Insufficient balance. Please top up your account.' 
            });
          }

          const resi = generateResi();

          // Get uploaded files
          const fotoAlamat = req.files?.foto_alamat ? req.files.foto_alamat[0].filename : null;
          const tandaPengenalDepan = req.files?.tanda_pengenal_depan ? req.files.tanda_pengenal_depan[0].filename : null;
          const tandaPengenalBelakang = req.files?.tanda_pengenal_belakang ? req.files.tanda_pengenal_belakang[0].filename : null;

          // Start transaction
          db.beginTransaction((err) => {
            if (err) {
              return res.status(500).json({ success: false, message: 'Transaction error' });
            }

            // Create transaction record
            db.query(
              `INSERT INTO transactions 
               (user_id, resi, sender_name, sender_phone, sender_address, destination, receiver_name, receiver_phone, receiver_address, item_category,
                weight, length, width, height, volume, isi_paket,
                price_per_kg, price_per_volume, total_price,
                foto_alamat, kode_pos_penerima, tanda_pengenal_depan, tanda_pengenal_belakang,
                nomor_identitas_penerima, email_penerima) 
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                req.user.id, resi, sender_name, sender_phone, sender_address, destination, receiver_name, receiver_phone, receiver_address, item_category,
                weightNum, lengthNum, widthNum, heightNum, volume, isi_paket,
                pricePerKg, pricePerVolume, totalPrice,
                fotoAlamat, kode_pos_penerima || null, tandaPengenalDepan, tandaPengenalBelakang,
                nomor_identitas_penerima || null, email_penerima || null
              ],
              (err, transactionResults) => {
                if (err) {
                  console.error('Transaction insert error:', err);
                  return db.rollback(() => {
                    res.status(500).json({ success: false, message: 'Database error' });
                  });
                }

                // Deduct user balance
                db.query(
                  'UPDATE users SET balance = balance - ? WHERE id = ?',
                  [totalPrice, req.user.id],
                  (err, updateResults) => {
                    if (err) {
                      return db.rollback(() => {
                        res.status(500).json({ success: false, message: 'Database error' });
                      });
                    }

                    // Add initial tracking update
                    db.query(
                      'INSERT INTO tracking_updates (transaction_id, status, description) VALUES (?, ?, ?)',
                      [transactionResults.insertId, 'pending', 'Paket telah terdaftar dan menunggu diproses'],
                      (err, trackingResults) => {
                        if (err) {
                          return db.rollback(() => {
                            res.status(500).json({ success: false, message: 'Database error' });
                          });
                        }

                        db.commit((err) => {
                          if (err) {
                            return db.rollback(() => {
                              res.status(500).json({ success: false, message: 'Commit error' });
                            });
                          }

                          res.status(201).json({
                            success: true,
                            message: 'Transaction created successfully',
                            data: { 
                              id: transactionResults.insertId, 
                              resi: resi,
                              total_price: totalPrice 
                            }
                          });
                        });
                      }
                    );
                  }
                );
              }
            );
          });
        });
      });
    });
  });
});

// Update transaction expedition (admin input resi ekspedisi)
app.put('/api/transactions/:id/expedition', authenticateToken, adminOnly, (req, res) => {
  const transactionId = req.params.id;
  const { expedition_id, expedition_resi } = req.body;

  if (!expedition_id || !expedition_resi) {
    return res.status(400).json({ success: false, message: 'Expedition ID and Resi are required' });
  }

  // When admin inputs expedition resi, automatically update status to 'dikirim'
  db.beginTransaction((err) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Transaction error' });
    }

    db.query(
      'UPDATE transactions SET expedition_id = ?, expedition_resi = ?, status = ? WHERE id = ?',
      [expedition_id, expedition_resi, 'dikirim', transactionId],
      (err, results) => {
        if (err) {
          return db.rollback(() => {
            res.status(500).json({ success: false, message: 'Database error' });
          });
        }

        if (results.affectedRows === 0) {
          return db.rollback(() => {
            res.status(404).json({ success: false, message: 'Transaction not found' });
          });
        }

        // Add tracking update
        db.query(
          'INSERT INTO tracking_updates (transaction_id, status, description) VALUES (?, ?, ?)',
          [transactionId, 'dikirim', 'Paket telah diserahkan ke ekspedisi untuk pengiriman'],
          (err, trackingResults) => {
            if (err) {
              return db.rollback(() => {
                res.status(500).json({ success: false, message: 'Database error' });
              });
            }

            db.commit((err) => {
              if (err) {
                return db.rollback(() => {
                  res.status(500).json({ success: false, message: 'Commit error' });
                });
              }

              res.json({ success: true, message: 'Expedition info updated and status changed to dikirim' });
            });
          }
        );
      }
    );
  });
});

// Update transaction status (manual)
app.put('/api/transactions/:id/status', authenticateToken, adminOnly, (req, res) => {
  const transactionId = req.params.id;
  const { status } = req.body;

  if (!status || !['pending', 'dikirim', 'sukses'].includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid status' });
  }

  db.query(
    'UPDATE transactions SET status = ? WHERE id = ?',
    [status, transactionId],
    (err, results) => {
      if (err) {
        return res.status(500).json({ success: false, message: 'Database error' });
      }

      if (results.affectedRows === 0) {
        return res.status(404).json({ success: false, message: 'Transaction not found' });
      }

      res.json({ success: true, message: 'Transaction status updated' });
    }
  );
});

// Update transaction (admin only)
app.put('/api/transactions/:id', authenticateToken, adminOnly, upload.fields([
  { name: 'foto_alamat', maxCount: 1 },
  { name: 'tanda_pengenal_depan', maxCount: 1 },
  { name: 'tanda_pengenal_belakang', maxCount: 1 }
]), (req, res) => {
  const transactionId = req.params.id;
  const {
    sender_name,
    sender_phone,
    sender_address,
    destination,
    receiver_name,
    receiver_phone,
    receiver_address,
    item_category,
    weight,
    length,
    width,
    height,
    isi_paket,
    kode_pos_penerima,
    nomor_identitas_penerima,
    email_penerima
  } = req.body;

  // Validate required fields
  if (!sender_name || !sender_phone || !sender_address || !destination || !receiver_name || !receiver_phone || !receiver_address || !item_category || !weight || !length || !width || !height || !isi_paket) {
    return res.status(400).json({ success: false, message: 'All required fields must be filled' });
  }

  // Get existing transaction to preserve pricing and status
  db.query('SELECT * FROM transactions WHERE id = ?', [transactionId], (err, existingResults) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Database error' });
    }

    if (existingResults.length === 0) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }

    const existingTransaction = existingResults[0];

    // Handle file uploads - only update if new files are provided
    const fotoAlamat = req.files?.foto_alamat ? req.files.foto_alamat[0].filename : existingTransaction.foto_alamat;
    const tandaPengenalDepan = req.files?.tanda_pengenal_depan ? req.files.tanda_pengenal_depan[0].filename : existingTransaction.tanda_pengenal_depan;
    const tandaPengenalBelakang = req.files?.tanda_pengenal_belakang ? req.files.tanda_pengenal_belakang[0].filename : existingTransaction.tanda_pengenal_belakang;

    // Recalculate volume
    const weightNum = Number(weight);
    const lengthNum = Number(length);
    const widthNum = Number(width);
    const heightNum = Number(height);
    const volume = (lengthNum * widthNum * heightNum) / 5000;

    // Use existing pricing or recalculate if dimensions changed significantly
    const pricePerKg = existingTransaction.price_per_kg;
    const pricePerVolume = existingTransaction.price_per_volume;
    const weightPrice = weightNum * pricePerKg;
    const volumePrice = volume * pricePerVolume;
    const totalPrice = Math.max(weightPrice, volumePrice);

    // Update transaction
    db.query(
      `UPDATE transactions 
       SET sender_name = ?, sender_phone = ?, sender_address = ?,
           destination = ?, receiver_name = ?, receiver_phone = ?, receiver_address = ?,
           item_category = ?, weight = ?, length = ?, width = ?, height = ?, volume = ?, isi_paket = ?,
           price_per_kg = ?, price_per_volume = ?, total_price = ?,
           foto_alamat = ?, kode_pos_penerima = ?, tanda_pengenal_depan = ?, tanda_pengenal_belakang = ?,
           nomor_identitas_penerima = ?, email_penerima = ?
       WHERE id = ?`,
      [
        sender_name, sender_phone, sender_address,
        destination, receiver_name, receiver_phone, receiver_address,
        item_category, weightNum, lengthNum, widthNum, heightNum, volume, isi_paket,
        pricePerKg, pricePerVolume, totalPrice,
        fotoAlamat, kode_pos_penerima || null, tandaPengenalDepan, tandaPengenalBelakang,
        nomor_identitas_penerima || null, email_penerima || null,
        transactionId
      ],
      (err, results) => {
        if (err) {
          console.error('Transaction update error:', err);
          return res.status(500).json({ success: false, message: 'Database error' });
        }

        if (results.affectedRows === 0) {
          return res.status(404).json({ success: false, message: 'Transaction not found' });
        }

        res.json({ success: true, message: 'Transaction updated successfully' });
      }
    );
  });
});

// Cancel transaction (admin only - for pending orders)
app.put('/api/transactions/:id/cancel', authenticateToken, adminOnly, (req, res) => {
  const transactionId = req.params.id;

  // Get transaction details
  db.query(
    'SELECT * FROM transactions WHERE id = ?',
    [transactionId],
    (err, results) => {
      if (err) {
        return res.status(500).json({ success: false, message: 'Database error' });
      }

      if (results.length === 0) {
        return res.status(404).json({ success: false, message: 'Transaction not found' });
      }

      const transaction = results[0];

      // Only allow cancellation for pending transactions
      if (transaction.status !== 'pending') {
        return res.status(400).json({ 
          success: false, 
          message: 'Only pending transactions can be cancelled' 
        });
      }

      // Start transaction
      db.beginTransaction((err) => {
        if (err) {
          return res.status(500).json({ success: false, message: 'Transaction error' });
        }

        // Update transaction status to canceled
        db.query(
          'UPDATE transactions SET status = ? WHERE id = ?',
          ['canceled', transactionId],
          (err, updateResults) => {
            if (err) {
              return db.rollback(() => {
                res.status(500).json({ success: false, message: 'Database error' });
              });
            }

            // Refund the customer's balance
            db.query(
              'UPDATE users SET balance = balance + ? WHERE id = ?',
              [transaction.total_price, transaction.user_id],
              (err, balanceResults) => {
                if (err) {
                  return db.rollback(() => {
                    res.status(500).json({ success: false, message: 'Database error refunding balance' });
                  });
                }

                // Add tracking update
                db.query(
                  'INSERT INTO tracking_updates (transaction_id, status, description) VALUES (?, ?, ?)',
                  [transactionId, 'canceled', 'Pesanan dibatalkan oleh admin. Saldo telah dikembalikan ke akun pelanggan.'],
                  (err, trackingResults) => {
                    if (err) {
                      return db.rollback(() => {
                        res.status(500).json({ success: false, message: 'Database error adding tracking' });
                      });
                    }

                    db.commit((err) => {
                      if (err) {
                        return db.rollback(() => {
                          res.status(500).json({ success: false, message: 'Commit error' });
                        });
                      }

                      res.json({ 
                        success: true, 
                        message: 'Transaction cancelled successfully and balance refunded',
                        data: {
                          refunded_amount: transaction.total_price
                        }
                      });
                    });
                  }
                );
              }
            );
          }
        );
      });
    }
  );
});

// Get transaction by ID
app.get('/api/transactions/:id', authenticateToken, (req, res) => {
  const transactionId = req.params.id;
  let query = `
    SELECT t.*, u.name as user_name, u.email as user_email, u.phone as user_phone, u.role as user_role, u.ekspedisi_name
    FROM transactions t 
    JOIN users u ON t.user_id = u.id
    WHERE t.id = ?
  `;

  // If customer, only allow their own transactions
  if (req.user.role === 'customer' || req.user.role === 'mitra') {
    query += ' AND t.user_id = ?';
    db.query(query, [transactionId, req.user.id], (err, results) => {
      if (err) {
        return res.status(500).json({ success: false, message: 'Database error' });
      }

      if (results.length === 0) {
        return res.status(404).json({ success: false, message: 'Transaction not found' });
      }

      res.json({ success: true, data: results[0] });
    });
  } else {
    db.query(query, [transactionId], (err, results) => {
      if (err) {
        return res.status(500).json({ success: false, message: 'Database error' });
      }

      if (results.length === 0) {
        return res.status(404).json({ success: false, message: 'Transaction not found' });
      }

      res.json({ success: true, data: results[0] });
    });
  }
});

// ==================== TRACKING ROUTES ====================

// Get tracking by resi (public)
app.get('/api/tracking/:resi', (req, res) => {
  const resi = req.params.resi;

  db.query(
    `SELECT t.*, u.name as user_name, u.phone as user_phone, u.role as user_role, u.ekspedisi_name,
            e.name as expedition_name, e.api_url as expedition_api_url
     FROM transactions t 
     JOIN users u ON t.user_id = u.id 
     LEFT JOIN expeditions e ON t.expedition_id = e.id
     WHERE t.resi = ?`,
    [resi],
    (err, transactionResults) => {
      if (err) {
        return res.status(500).json({ success: false, message: 'Database error' });
      }

      if (transactionResults.length === 0) {
        return res.status(404).json({ success: false, message: 'Tracking not found' });
      }

      const transaction = transactionResults[0];

      // Get tracking updates
      db.query(
        'SELECT * FROM tracking_updates WHERE transaction_id = ? ORDER BY created_at DESC',
        [transaction.id],
        (err, updateResults) => {
          if (err) {
            return res.status(500).json({ success: false, message: 'Database error' });
          }

          res.json({
            success: true,
            data: {
              transaction: {
                ...transaction,
                user: {
                  name: transaction.user_name,
                  phone: transaction.user_phone
                },
                expedition: {
                  name: transaction.expedition_name,
                  api_url: transaction.expedition_api_url
                }
              },
              updates: updateResults
            }
          });
        }
      );
    }
  );
});

// Add tracking update
app.post('/api/tracking/:resi', authenticateToken, adminOnly, (req, res) => {
  const resi = req.params.resi;
  const { status, description } = req.body;

  if (!status || !description) {
    return res.status(400).json({ success: false, message: 'Status and description are required' });
  }

  // Get transaction ID by resi
  db.query('SELECT id FROM transactions WHERE resi = ?', [resi], (err, results) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Database error' });
    }

    if (results.length === 0) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }

    const transactionId = results[0].id;

    // Start transaction to update both tracking and transaction status
    db.beginTransaction((err) => {
      if (err) {
        return res.status(500).json({ success: false, message: 'Transaction error' });
      }

      // Add tracking update
      db.query(
        'INSERT INTO tracking_updates (transaction_id, status, description) VALUES (?, ?, ?)',
        [transactionId, status, description],
        (err, trackingResults) => {
          if (err) {
            return db.rollback(() => {
              res.status(500).json({ success: false, message: 'Database error' });
            });
          }

          // Update transaction status
          db.query(
            'UPDATE transactions SET status = ? WHERE id = ?',
            [status, transactionId],
            (err, updateResults) => {
              if (err) {
                return db.rollback(() => {
                  res.status(500).json({ success: false, message: 'Database error' });
                });
              }

              db.commit((err) => {
                if (err) {
                  return db.rollback(() => {
                    res.status(500).json({ success: false, message: 'Commit error' });
                  });
                }

                res.status(201).json({
                  success: true,
                  message: 'Tracking update added successfully'
                });
              });
            }
          );
        }
      );
    });
  });
});

// Get tracking updates for a resi
app.get('/api/tracking/:resi/updates', (req, res) => {
  const resi = req.params.resi;

  db.query(
    `SELECT tu.* FROM tracking_updates tu 
     JOIN transactions t ON tu.transaction_id = t.id 
     WHERE t.resi = ? 
     ORDER BY tu.created_at DESC`,
    [resi],
    (err, results) => {
      if (err) {
        return res.status(500).json({ success: false, message: 'Database error' });
      }

      res.json({ success: true, data: results });
    }
  );
});

// Update tracking update
app.put('/api/tracking/updates/:id', authenticateToken, adminOnly, (req, res) => {
  const updateId = req.params.id;
  const { status, description } = req.body;

  if (!status || !description) {
    return res.status(400).json({ success: false, message: 'Status and description are required' });
  }

  db.query(
    'UPDATE tracking_updates SET status = ?, description = ? WHERE id = ?',
    [status, description, updateId],
    (err, results) => {
      if (err) {
        return res.status(500).json({ success: false, message: 'Database error' });
      }

      if (results.affectedRows === 0) {
        return res.status(404).json({ success: false, message: 'Tracking update not found' });
      }

      res.json({ success: true, message: 'Tracking update updated successfully' });
    }
  );
});

// Delete tracking update
app.delete('/api/tracking/updates/:id', authenticateToken, adminOnly, (req, res) => {
  const updateId = req.params.id;

  db.query('DELETE FROM tracking_updates WHERE id = ?', [updateId], (err, results) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Database error' });
    }

    if (results.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Tracking update not found' });
    }

    res.json({ success: true, message: 'Tracking update deleted successfully' });
  });
});

// ==================== ERROR HANDLING ====================

// Global error handler
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ success: false, message: 'File too large' });
    }
  }
  
  console.error('Error:', error);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});