-- NewTaltour Database Schema
-- PostgreSQL 15+

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Contacts table (users)
CREATE TABLE IF NOT EXISTS contacts (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    nom VARCHAR(100) NOT NULL,
    prenom VARCHAR(100) NOT NULL,
    tel VARCHAR(20),
    adresse VARCHAR(255),
    ville VARCHAR(100),
    code_postal VARCHAR(10),
    pays VARCHAR(100),
    date_naissance DATE,
    num_permis VARCHAR(50),
    date_permis DATE,
    password_hash VARCHAR(255) NOT NULL,
    role INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$')
);

-- Vehicles table
CREATE TABLE IF NOT EXISTS vehicules (
    id SERIAL PRIMARY KEY,
    marque VARCHAR(100) NOT NULL,
    modele VARCHAR(100) NOT NULL,
    annee INTEGER,
    immatriculation VARCHAR(20) UNIQUE,
    carburant VARCHAR(50),
    transmission VARCHAR(50),
    places INTEGER,
    prix_jour DECIMAL(10,2),
    prix_caution DECIMAL(10,2),
    prix_assurance DECIMAL(10,2),
    disponible BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Reservations table (commandes)
CREATE TABLE IF NOT EXISTS commandes (
    id SERIAL PRIMARY KEY,
    contact_id INTEGER NOT NULL,
    vehicule_id INTEGER NOT NULL,
    date_debut DATE NOT NULL,
    date_fin DATE NOT NULL,
    date_pickup TIMESTAMP,
    date_return TIMESTAMP,
    lieu_pickup VARCHAR(255),
    lieu_return VARCHAR(255),
    montant_total DECIMAL(10,2),
    caution DECIMAL(10,2),
    assurance VARCHAR(50),
    prix_assurance DECIMAL(10,2),
    statut VARCHAR(50) DEFAULT 'pending',
    payment_status VARCHAR(50) DEFAULT 'unpaid',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE,
    FOREIGN KEY (vehicule_id) REFERENCES vehicules(id) ON DELETE RESTRICT,
    CONSTRAINT date_check CHECK (date_fin > date_debut)
);

-- Payment logs table
CREATE TABLE IF NOT EXISTS payment_logs (
    id SERIAL PRIMARY KEY,
    commande_id INTEGER NOT NULL,
    contact_id INTEGER NOT NULL,
    montant DECIMAL(10,2) NOT NULL,
    methode_paiement VARCHAR(50),
    statut VARCHAR(50) DEFAULT 'pending',
    reference_externe VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (commande_id) REFERENCES commandes(id) ON DELETE CASCADE,
    FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE
);

-- Admins table
CREATE TABLE IF NOT EXISTS admins (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'admin',
    active BOOLEAN DEFAULT true,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Audit log table (NEW)
CREATE TABLE IF NOT EXISTS audit_log (
    id SERIAL PRIMARY KEY,
    admin_id INTEGER,
    action VARCHAR(100) NOT NULL,
    table_name VARCHAR(100),
    record_id INTEGER,
    old_values JSONB,
    new_values JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (admin_id) REFERENCES admins(id) ON DELETE SET NULL
);

-- Coupons table (NEW)
CREATE TABLE IF NOT EXISTS coupons (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    montant DECIMAL(10,2),
    pourcentage INTEGER,
    date_debut DATE,
    date_fin DATE,
    montant_min DECIMAL(10,2),
    utilisations_max INTEGER,
    utilisations_actuelles INTEGER DEFAULT 0,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX idx_contacts_email ON contacts(email);
CREATE INDEX idx_contacts_created_at ON contacts(created_at);
CREATE INDEX idx_commandes_contact_id ON commandes(contact_id);
CREATE INDEX idx_commandes_vehicule_id ON commandes(vehicule_id);
CREATE INDEX idx_commandes_statut ON commandes(statut);
CREATE INDEX idx_commandes_date_debut ON commandes(date_debut);
CREATE INDEX idx_payment_logs_commande_id ON payment_logs(commande_id);
CREATE INDEX idx_payment_logs_contact_id ON payment_logs(contact_id);
CREATE INDEX idx_audit_log_admin_id ON audit_log(admin_id);
CREATE INDEX idx_audit_log_created_at ON audit_log(created_at);

-- Create views for reports (optional)
CREATE OR REPLACE VIEW v_active_reservations AS
SELECT
    c.id,
    c.email,
    c.nom,
    c.prenom,
    com.id as commande_id,
    com.date_debut,
    com.date_fin,
    v.marque,
    v.modele,
    com.montant_total
FROM commandes com
JOIN contacts c ON com.contact_id = c.id
JOIN vehicules v ON com.vehicule_id = v.id
WHERE com.statut = 'active' AND com.date_fin >= CURRENT_DATE;

-- Grant permissions
GRANT USAGE ON SCHEMA public TO taltour_user;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO taltour_user;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO taltour_user;
