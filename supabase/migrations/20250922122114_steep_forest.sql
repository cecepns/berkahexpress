-- Database untuk BerkahExpress
CREATE DATABASE IF NOT EXISTS berkahexpress;
USE berkahexpress;

-- Table Users
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20) NOT NULL,
  address TEXT NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin', 'customer') DEFAULT 'customer',
  balance DECIMAL(15,2) DEFAULT 0.00,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Table Prices (Harga berdasarkan negara)
CREATE TABLE prices (
  id INT PRIMARY KEY AUTO_INCREMENT,
  country VARCHAR(255) NOT NULL,
  price_per_kg DECIMAL(10,2) NOT NULL,
  price_per_volume DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Table Bank Accounts (Rekening untuk topup)
CREATE TABLE bank_accounts (
  id INT PRIMARY KEY AUTO_INCREMENT,
  bank_name VARCHAR(255) NOT NULL,
  account_number VARCHAR(50) NOT NULL,
  account_holder VARCHAR(255) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Table Topups
CREATE TABLE topups (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  bank_account_id INT NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  proof_image VARCHAR(255),
  status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  admin_notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (bank_account_id) REFERENCES bank_accounts(id)
);

-- Table Transactions
CREATE TABLE transactions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  resi VARCHAR(50) UNIQUE NOT NULL,
  destination VARCHAR(255) NOT NULL,
  weight DECIMAL(8,2) NOT NULL,
  length DECIMAL(8,2) NOT NULL,
  width DECIMAL(8,2) NOT NULL,
  height DECIMAL(8,2) NOT NULL,
  volume DECIMAL(10,4) NOT NULL,
  price_per_kg DECIMAL(10,2) NOT NULL,
  price_per_volume DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(15,2) NOT NULL,
  status ENUM('pending', 'dikirim', 'sukses') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Table Tracking Updates
CREATE TABLE tracking_updates (
  id INT PRIMARY KEY AUTO_INCREMENT,
  transaction_id INT NOT NULL,
  status VARCHAR(50) NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE
);

-- Insert default admin user
INSERT INTO users (name, email, phone, address, password, role, balance) 
VALUES (
  'Admin BerkahExpress', 
  'admin@berkahexpress.com', 
  '081234567890', 
  'Jakarta, Indonesia', 
  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- password: password
  'admin',
  0.00
);

-- Insert sample prices
INSERT INTO prices (country, price_per_kg, price_per_volume) VALUES
('Malaysia', 25000.00, 5000.00),
('Singapura', 30000.00, 6000.00),
('Thailand', 35000.00, 7000.00),
('Vietnam', 40000.00, 8000.00),
('Filipina', 45000.00, 9000.00),
('Brunei', 50000.00, 10000.00),
('Amerika Serikat', 100000.00, 20000.00),
('Jepang', 85000.00, 17000.00),
('Korea Selatan', 80000.00, 16000.00),
('China', 70000.00, 14000.00);

-- Insert sample bank accounts
INSERT INTO bank_accounts (bank_name, account_number, account_holder, is_active) VALUES
('Bank BCA', '1234567890', 'PT. BerkahExpress Indonesia', TRUE),
('Bank Mandiri', '0987654321', 'PT. BerkahExpress Indonesia', TRUE),
('Bank BNI', '1122334455', 'PT. BerkahExpress Indonesia', TRUE);

-- Create indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_resi ON transactions(resi);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_tracking_updates_transaction_id ON tracking_updates(transaction_id);
CREATE INDEX idx_topups_user_id ON topups(user_id);
CREATE INDEX idx_topups_status ON topups(status);