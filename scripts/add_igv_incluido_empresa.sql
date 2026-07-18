-- Agrega el campo igv_incluido a la tabla empresa
-- TRUE  = el precio del producto YA incluye IGV (el sistema debe extraerlo)
-- FALSE = el precio es base imponible (el sistema calcula IGV = subtotal * 0.18 encima)

ALTER TABLE empresa
  ADD COLUMN igv_incluido TINYINT(1) NOT NULL DEFAULT 1
  COMMENT '1=precio incluye IGV, 0=precio sin IGV';

-- Verificar
DESCRIBE empresa igv_incluido;
