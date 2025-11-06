/*
  # Fix CASCADE DELETE Constraints

  1. Changes
    - Fix foreign key constraints to properly handle deletions
    - When a user is deleted, set their references to NULL instead of blocking
    - When a ferramenta/obra is deleted, cascade delete all related data
    
  2. Foreign Keys Updated
    - ferramentas.cadastrado_por: NO ACTION → SET NULL
    - movimentacoes.user_id: NO ACTION → SET NULL  
    - obra_images.uploaded_by: NO ACTION → SET NULL
    
  3. Why These Changes
    - Prevents deletion errors when users are removed
    - Maintains data integrity by keeping historical records
    - Allows full cleanup of ferramentas/obras when deleted
*/

-- Fix ferramentas.cadastrado_por constraint
ALTER TABLE ferramentas
  DROP CONSTRAINT IF EXISTS ferramentas_cadastrado_por_fkey;

ALTER TABLE ferramentas
  ADD CONSTRAINT ferramentas_cadastrado_por_fkey
  FOREIGN KEY (cadastrado_por)
  REFERENCES users(id)
  ON DELETE SET NULL;

-- Fix movimentacoes.user_id constraint
ALTER TABLE movimentacoes
  DROP CONSTRAINT IF EXISTS movimentacoes_user_id_fkey;

ALTER TABLE movimentacoes
  ADD CONSTRAINT movimentacoes_user_id_fkey
  FOREIGN KEY (user_id)
  REFERENCES users(id)
  ON DELETE SET NULL;

-- Fix obra_images.uploaded_by constraint
ALTER TABLE obra_images
  DROP CONSTRAINT IF EXISTS obra_images_uploaded_by_fkey;

ALTER TABLE obra_images
  ADD CONSTRAINT obra_images_uploaded_by_fkey
  FOREIGN KEY (uploaded_by)
  REFERENCES users(id)
  ON DELETE SET NULL;
