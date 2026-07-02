-- 게임 다이어리 다중 사진 지원을 위한 DB 마이그레이션
-- Supabase > SQL Editor에서 실행하세요

ALTER TABLE gathering_records
  ADD COLUMN IF NOT EXISTS photo_urls JSONB DEFAULT '[]'::jsonb;

-- 기존 photo_url 데이터를 photo_urls 배열로 마이그레이션 (선택)
UPDATE gathering_records
  SET photo_urls = jsonb_build_array(photo_url)
  WHERE photo_url IS NOT NULL AND photo_url != ''
    AND (photo_urls IS NULL OR photo_urls = '[]'::jsonb);
