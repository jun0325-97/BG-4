import fs from 'fs';
import path from 'path';
import axios from 'axios';
import xml2js from 'xml2js';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// popularGames.ts 파일 경로
const FILE_PATH = path.join(__dirname, 'src', 'utils', 'popularGames.ts');

// 딜레이 함수
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// BGG API가 봇(bot)을 차단할 수 있으므로 브라우저와 유사한 User-Agent 헤더 추가
const axiosConfig = {
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/xml, text/xml, */*; q=0.01'
    }
};

async function main() {
    try {
        let content = fs.readFileSync(FILE_PATH, 'utf-8');
        const nameRegex = /name:\s*["']([^"']+)["']/g;
        let matches = [...content.matchAll(nameRegex)];
        
        console.log(`총 ${matches.length}개의 게임을 찾았습니다. BGG API 연동을 시작합니다...`);

        for (const match of matches) {
            const gameName = match[1];
            console.log(`\n[처리중] ${gameName}`);
            
            try {
                // 검색 API 호출
                const searchUrl = `https://boardgamegeek.com/xmlapi2/search?type=boardgame&query=${encodeURIComponent(gameName)}`;
                const searchRes = await axios.get(searchUrl, axiosConfig);
                const searchParsed = await xml2js.parseStringPromise(searchRes.data);
                
                let gameId = null;
                const items = searchParsed.items?.item;
                if (items && items.length > 0) {
                    gameId = items[0].$.id;
                }
                
                if (gameId) {
                    console.log(` -> BGG ID 확인됨: ${gameId}`);
                    
                    // 상세 API 호출
                    const thingUrl = `https://boardgamegeek.com/xmlapi2/thing?id=${gameId}`;
                    const thingRes = await axios.get(thingUrl, axiosConfig);
                    const thingParsed = await xml2js.parseStringPromise(thingRes.data);
                    
                    const thingItem = thingParsed.items?.item?.[0];
                    const thumbnail = thingItem?.thumbnail?.[0];
                    
                    if (thumbnail) {
                        console.log(` -> 썸네일 URL: ${thumbnail}`);
                        
                        const replaceRegex = new RegExp(`(name:\\s*["']${gameName}["'][\\s\\S]*?imageUrl:\\s*["'])([^"']*)(["'])`);
                        content = content.replace(replaceRegex, `$1${thumbnail}$3`);
                    } else {
                        console.log(` -> 썸네일 정보가 없습니다.`);
                    }
                } else {
                    console.log(` -> BGG 검색 결과가 없습니다.`);
                }
            } catch (err) {
                console.error(` -> API 호출 또는 파싱 오류 (${gameName}):`, err.response ? `${err.response.status} ${err.response.statusText}` : err.message);
            }
            
            // 딜레이 1.5초
            await sleep(1500);
        }
        
        fs.writeFileSync(FILE_PATH, content, 'utf-8');
        console.log("\n모든 작업이 완료되었습니다. popularGames.ts 파일이 업데이트되었습니다.");
        
    } catch (error) {
        console.error("스크립트 실행 중 에러가 발생했습니다:", error);
    }
}

main();
