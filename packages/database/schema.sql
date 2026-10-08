-- NewTaltour schema (PostgreSQL 15+)

CREATE TABLE IF NOT EXISTS sites (
    code VARCHAR(5) PRIMARY KEY,
    nom VARCHAR(100) NOT NULL,
    titre VARCHAR(200) NOT NULL,
    slogan VARCHAR(200),
    telephones TEXT[] NOT NULL DEFAULT '{}',
    hotline VARCHAR(50)
);

CREATE TABLE IF NOT EXISTS villes (
    id SERIAL PRIMARY KEY,
    nom VARCHAR(100) NOT NULL UNIQUE,
    site VARCHAR(5) REFERENCES sites(code),
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    aeroport BOOLEAN NOT NULL DEFAULT false,
    point_rdv TEXT,
    agent_nom VARCHAR(100),
    agent_tel VARCHAR(30),
    actif BOOLEAN NOT NULL DEFAULT true,
    ordre INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS modeles (
    id SERIAL PRIMARY KEY,
    site VARCHAR(5) NOT NULL REFERENCES sites(code),
    slug VARCHAR(150) NOT NULL UNIQUE,
    nom VARCHAR(200) NOT NULL,
    nom_affiche VARCHAR(200) NOT NULL,
    marque VARCHAR(100) NOT NULL,
    categorie CHAR(1),
    categorie_libelle VARCHAR(100),
    places INTEGER,
    portes INTEGER,
    coffre_l INTEGER,
    reservoir_l INTEGER,
    carburant VARCHAR(20) NOT NULL,
    boite VARCHAR(20) NOT NULL,
    type_boite VARCHAR(30),
    puissance_ch INTEGER,
    airbags INTEGER,
    vitesse_max INTEGER,
    consommation VARCHAR(50),
    caution NUMERIC(10,2) NOT NULL,
    equipements TEXT[] NOT NULL DEFAULT '{}',
    fiche JSON NOT NULL DEFAULT '{}',
    image VARCHAR(255),
    a_vendre BOOLEAN NOT NULL DEFAULT false,
    actif BOOLEAN NOT NULL DEFAULT true,
    ordre INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS modele_tarifs (
    modele_id INTEGER NOT NULL REFERENCES modeles(id) ON DELETE CASCADE,
    jours INTEGER NOT NULL,
    prix NUMERIC(10,2) NOT NULL,
    PRIMARY KEY (modele_id, jours)
);

CREATE TABLE IF NOT EXISTS vehicules (
    id SERIAL PRIMARY KEY,
    modele_id INTEGER NOT NULL REFERENCES modeles(id) ON DELETE RESTRICT,
    immatriculation VARCHAR(20) NOT NULL UNIQUE,
    annee INTEGER NOT NULL,
    couleur VARCHAR(40),
    ville_id INTEGER NOT NULL REFERENCES villes(id),
    kilometrage INTEGER NOT NULL DEFAULT 0,
    statut VARCHAR(20) NOT NULL DEFAULT 'disponible' CHECK (statut IN ('disponible','maintenance','hors_service')),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS saisons (
    id SERIAL PRIMARY KEY,
    nom VARCHAR(100) NOT NULL,
    date_debut DATE NOT NULL,
    date_fin DATE NOT NULL,
    coefficient NUMERIC(4,2) NOT NULL,
    CHECK (date_fin >= date_debut)
);

CREATE TABLE IF NOT EXISTS options (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    libelle TEXT NOT NULL,
    libelle_court VARCHAR(100),
    description TEXT,
    type_prix VARCHAR(20) NOT NULL CHECK (type_prix IN ('fixe','par_jour','pourcentage')),
    prix NUMERIC(10,2) NOT NULL,
    actif BOOLEAN NOT NULL DEFAULT true,
    ordre INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS contacts (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    nom VARCHAR(100) NOT NULL,
    prenom VARCHAR(100) NOT NULL,
    tel VARCHAR(30),
    societe VARCHAR(150),
    adresse VARCHAR(255),
    code_postal VARCHAR(10),
    commune VARCHAR(100),
    pays VARCHAR(100),
    num_permis VARCHAR(50),
    date_permis DATE,
    date_naissance DATE,
    password_hash VARCHAR(255),
    password_changed_at TIMESTAMPTZ,
    role INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS coupons (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('pourcentage','montant')),
    valeur NUMERIC(10,2) NOT NULL,
    date_debut DATE,
    date_fin DATE,
    montant_min NUMERIC(10,2),
    utilisations_max INTEGER,
    utilisations INTEGER NOT NULL DEFAULT 0,
    actif BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS commandes (
    id SERIAL PRIMARY KEY,
    reference VARCHAR(20) NOT NULL UNIQUE,
    site VARCHAR(5) NOT NULL REFERENCES sites(code) DEFAULT 'dz',
    contact_id INTEGER NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    modele_id INTEGER NOT NULL REFERENCES modeles(id),
    vehicule_id INTEGER REFERENCES vehicules(id) ON DELETE SET NULL,
    ville_depart_id INTEGER NOT NULL REFERENCES villes(id),
    ville_retour_id INTEGER NOT NULL REFERENCES villes(id),
    date_depart TIMESTAMPTZ NOT NULL,
    date_retour TIMESTAMPTZ NOT NULL,
    jours INTEGER NOT NULL,
    forfait_jours INTEGER NOT NULL,
    prix_jour NUMERIC(10,2) NOT NULL,
    coefficient_saison NUMERIC(4,2) NOT NULL DEFAULT 1,
    remise_age_pct INTEGER NOT NULL DEFAULT 0,
    montant_location NUMERIC(10,2) NOT NULL,
    frais_aller_simple NUMERIC(10,2) NOT NULL DEFAULT 0,
    frais_rapatriement NUMERIC(10,2) NOT NULL DEFAULT 0,
    montant_options NUMERIC(10,2) NOT NULL DEFAULT 0,
    remise_fidelite NUMERIC(10,2) NOT NULL DEFAULT 0,
    code_promo VARCHAR(50),
    remise_promo NUMERIC(10,2) NOT NULL DEFAULT 0,
    avoir_utilise NUMERIC(10,2) NOT NULL DEFAULT 0,
    montant_total NUMERIC(10,2) NOT NULL,
    caution NUMERIC(10,2) NOT NULL DEFAULT 0,
    caution_doublee BOOLEAN NOT NULL DEFAULT false,
    num_vol VARCHAR(30),
    remarques TEXT,
    statut VARCHAR(20) NOT NULL DEFAULT 'en_attente' CHECK (statut IN ('en_attente','confirmee','en_cours','terminee','annulee')),
    mode_paiement VARCHAR(20) NOT NULL CHECK (mode_paiement IN ('cb','paypal','cheque','virement','deux_fois')),
    statut_paiement VARCHAR(20) NOT NULL DEFAULT 'non_paye' CHECK (statut_paiement IN ('non_paye','acompte','paye','rembourse','avoir')),
    montant_paye NUMERIC(10,2) NOT NULL DEFAULT 0,
    frais_annulation NUMERIC(10,2),
    annulee_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CHECK (date_retour > date_depart)
);

CREATE TABLE IF NOT EXISTS commande_options (
    commande_id INTEGER NOT NULL REFERENCES commandes(id) ON DELETE CASCADE,
    option_id INTEGER NOT NULL REFERENCES options(id),
    libelle TEXT NOT NULL,
    montant NUMERIC(10,2) NOT NULL,
    PRIMARY KEY (commande_id, option_id)
);

CREATE TABLE IF NOT EXISTS paiements (
    id SERIAL PRIMARY KEY,
    commande_id INTEGER NOT NULL REFERENCES commandes(id) ON DELETE CASCADE,
    montant NUMERIC(10,2) NOT NULL,
    methode VARCHAR(20) NOT NULL,
    statut VARCHAR(20) NOT NULL DEFAULT 'valide' CHECK (statut IN ('en_attente','valide','echoue','rembourse')),
    reference VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS avoirs (
    id SERIAL PRIMARY KEY,
    contact_id INTEGER NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    commande_id INTEGER REFERENCES commandes(id) ON DELETE SET NULL,
    montant NUMERIC(10,2) NOT NULL,
    solde NUMERIC(10,2) NOT NULL,
    motif TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS avis (
    id SERIAL PRIMARY KEY,
    contact_id INTEGER REFERENCES contacts(id) ON DELETE SET NULL,
    commande_id INTEGER UNIQUE REFERENCES commandes(id) ON DELETE SET NULL,
    auteur VARCHAR(150) NOT NULL,
    note INTEGER NOT NULL CHECK (note BETWEEN 1 AND 5),
    observation_reservation TEXT,
    observation_place TEXT,
    publie BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS articles (
    id SERIAL PRIMARY KEY,
    slug VARCHAR(200) NOT NULL UNIQUE,
    titre VARCHAR(255) NOT NULL,
    contenu TEXT NOT NULL,
    auteur VARCHAR(100),
    publie BOOLEAN NOT NULL DEFAULT true,
    date_publication DATE NOT NULL DEFAULT CURRENT_DATE
);

CREATE TABLE IF NOT EXISTS occasions (
    id SERIAL PRIMARY KEY,
    titre VARCHAR(255) NOT NULL,
    description TEXT,
    modele_id INTEGER REFERENCES modeles(id) ON DELETE SET NULL,
    annee INTEGER,
    kilometrage INTEGER,
    prix NUMERIC(10,2) NOT NULL,
    image VARCHAR(255),
    publie BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS faq (
    id SERIAL PRIMARY KEY,
    question TEXT NOT NULL,
    reponse TEXT NOT NULL,
    ordre INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS pages (
    slug VARCHAR(100) PRIMARY KEY,
    titre VARCHAR(255) NOT NULL,
    contenu TEXT NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS messages_contact (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    nom VARCHAR(100) NOT NULL,
    prenom VARCHAR(100),
    tel VARCHAR(30),
    message TEXT NOT NULL,
    lu BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS demandes_transfert (
    id SERIAL PRIMARY KEY,
    nom VARCHAR(150) NOT NULL,
    email VARCHAR(255) NOT NULL,
    tel VARCHAR(30),
    aeroport_id INTEGER REFERENCES villes(id),
    destination VARCHAR(255) NOT NULL,
    date_arrivee TIMESTAMPTZ NOT NULL,
    passagers INTEGER NOT NULL DEFAULT 1,
    num_vol VARCHAR(30),
    message TEXT,
    statut VARCHAR(20) NOT NULL DEFAULT 'nouvelle' CHECK (statut IN ('nouvelle','devis_envoye','confirmee','annulee')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS parametres (
    cle VARCHAR(50) PRIMARY KEY,
    valeur JSONB NOT NULL
);

CREATE TABLE IF NOT EXISTS password_resets (
    token_hash CHAR(64) PRIMARY KEY,
    contact_id INTEGER NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    expires_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS audit_log (
    id SERIAL PRIMARY KEY,
    admin_id INTEGER REFERENCES contacts(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    table_name VARCHAR(100),
    record_id INTEGER,
    details JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vehicules_modele ON vehicules(modele_id);
CREATE INDEX IF NOT EXISTS idx_commandes_contact ON commandes(contact_id);
CREATE INDEX IF NOT EXISTS idx_commandes_vehicule_dates ON commandes(vehicule_id, date_depart, date_retour);
CREATE INDEX IF NOT EXISTS idx_commandes_statut ON commandes(statut);
CREATE INDEX IF NOT EXISTS idx_commandes_created ON commandes(created_at);
CREATE INDEX IF NOT EXISTS idx_avis_created ON avis(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_log(created_at);
