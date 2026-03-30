-- PLM ECO Database Schema

CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL
);

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    email VARCHAR(150) UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role_id INT REFERENCES roles(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    created_by INT REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE product_versions (
    id SERIAL PRIMARY KEY,
    product_id INT REFERENCES products(id),
    version INT NOT NULL,
    sale_price NUMERIC,
    cost_price NUMERIC,
    attachments TEXT,
    status VARCHAR(20) CHECK (status IN ('ACTIVE', 'ARCHIVED')) DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(product_id, version)
);

CREATE TABLE boms (
    id SERIAL PRIMARY KEY,
    product_id INT REFERENCES products(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE bom_versions (
    id SERIAL PRIMARY KEY,
    bom_id INT REFERENCES boms(id),
    version INT NOT NULL,
    status VARCHAR(20) CHECK (status IN ('ACTIVE', 'ARCHIVED')) DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(bom_id, version)
);

CREATE TABLE bom_components (
    id SERIAL PRIMARY KEY,
    bom_version_id INT REFERENCES bom_versions(id) ON DELETE CASCADE,
    component_product_id INT REFERENCES products(id),
    quantity NUMERIC NOT NULL
);

CREATE TABLE bom_operations (
    id SERIAL PRIMARY KEY,
    bom_version_id INT REFERENCES bom_versions(id) ON DELETE CASCADE,
    operation_name VARCHAR(100),
    time_minutes INT,
    work_center VARCHAR(100)
);

CREATE TABLE eco_stages (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50),
    sequence INT,
    requires_approval BOOLEAN DEFAULT FALSE
);

CREATE TABLE ecos (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255),
    type VARCHAR(20) CHECK (type IN ('PRODUCT', 'BOM')),
    product_id INT REFERENCES products(id),
    bom_id INT REFERENCES boms(id),
    created_by INT REFERENCES users(id),
    effective_date DATE,
    version_update BOOLEAN DEFAULT TRUE,
    stage_id INT REFERENCES eco_stages(id),
    status VARCHAR(20) DEFAULT 'NEW',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE eco_product_changes (
    id SERIAL PRIMARY KEY,
    eco_id INT REFERENCES ecos(id) ON DELETE CASCADE,
    new_sale_price NUMERIC,
    new_cost_price NUMERIC,
    new_attachments TEXT
);

CREATE TABLE eco_bom_component_changes (
    id SERIAL PRIMARY KEY,
    eco_id INT REFERENCES ecos(id) ON DELETE CASCADE,
    component_product_id INT,
    old_quantity NUMERIC,
    new_quantity NUMERIC
);

CREATE TABLE eco_bom_operation_changes (
    id SERIAL PRIMARY KEY,
    eco_id INT REFERENCES ecos(id) ON DELETE CASCADE,
    operation_name VARCHAR(100),
    old_time INT,
    new_time INT
);

CREATE TABLE eco_approvals (
    id SERIAL PRIMARY KEY,
    eco_id INT REFERENCES ecos(id),
    approver_id INT REFERENCES users(id),
    status VARCHAR(20) CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
    action_time TIMESTAMP
);

CREATE TABLE audit_logs (
    id SERIAL PRIMARY KEY,
    action VARCHAR(100),
    entity_type VARCHAR(50),
    entity_id INT,
    old_value JSONB,
    new_value JSONB,
    performed_by INT REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_product_versions_product ON product_versions(product_id);
CREATE INDEX idx_bom_versions_bom ON bom_versions(bom_id);
CREATE INDEX idx_ecos_product ON ecos(product_id);
CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id);

-- Seed roles
INSERT INTO roles (id, name) VALUES
  (1, 'engineering'),
  (2, 'approver'),
  (3, 'operations'),
  (4, 'admin')
ON CONFLICT (id) DO NOTHING;
