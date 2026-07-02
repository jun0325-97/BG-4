-- 공용/카페 소유자를 위해 members 테이블에 가상의 멤버를 추가합니다.
-- 이 멤버는 UI에서 실제 사람 목록에는 보이지 않도록 필터링됩니다.

INSERT INTO members (id, name, color) 
VALUES ('cafe', '공용/카페', 'gray')
ON CONFLICT (id) DO NOTHING;
