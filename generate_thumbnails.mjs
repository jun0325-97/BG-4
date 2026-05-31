import fs from 'fs';
import path from 'path';

function buildHtml() {
  const tsContent = fs.readFileSync('src/utils/popularGames.ts', 'utf-8');
  
  let items = [];
  const regex = /\{\s*name:\s*"([^"]+)"[\s\S]*?imageUrl:\s*"([^"]*)"\s*\}/g;
  let match;
  while((match = regex.exec(tsContent)) !== null) {
    items.push({ name: match[1], url: match[2] });
  }

  let gridHtml = '';
  items.forEach((item, idx) => {
    gridHtml += `
      <div class="card">
        <h3 style="margin:5px 0; font-size:16px;">${item.name}</h3>
        <img id="img-${idx}" src="${item.url}" alt="${item.name}" onerror="this.src='https://placehold.co/150x150/000000/FFFFFF?text=ERROR'" />
      </div>
    `;
  });

  const html = `<!DOCTYPE html>
<html lang="ko">

<head>
  <meta charset="UTF-8">
  <title>썸네일 확인 페이지</title>
  <style>
    body {
      font-family: 'Malgun Gothic', sans-serif;
      background: #1a1a1a;
      color: white;
      padding: 20px;
    }

    .section-title {
      font-size: 24px;
      font-weight: bold;
      margin: 30px 0 15px 0;
      border-bottom: 2px solid #444;
      padding-bottom: 10px;
    }

    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
      gap: 15px;
    }

    .card {
      background: #333;
      padding: 10px;
      border-radius: 8px;
      text-align: center;
      transition: 0.2s;
      border: 3px solid transparent;
      display: flex;
      flex-direction: column;
    }

    .card img {
      max-width: 100%;
      height: 160px;
      object-fit: contain;
      border-radius: 4px;
      background: #222;
      margin-bottom: 10px;
    }
    
    .stats {
      font-size: 18px;
      color: #2ed573;
      margin-bottom: 20px;
    }
  </style>
</head>

<body>
  <div class="section-title">완성된 보드게임 썸네일 리스트</div>
  <div class="stats">총 ${items.length}개의 게임이 등록되었습니다.</div>
  
  <div class="grid">
    ${gridHtml}
  </div>

</body>
</html>`;

  fs.writeFileSync('test_thumbnails.html', html, 'utf-8');
  console.log('test_thumbnails.html updated successfully with ' + items.length + ' games.');
}

buildHtml();
