-- Sprint 19 : colonne og_image_url pour les thumbnails dans le feed

ALTER TABLE articles ADD COLUMN IF NOT EXISTS og_image_url TEXT;
