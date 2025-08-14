// 엔딩 시스템 - ending.js

// 엔딩 표시 (완전히 새로운 버전)
function showEnding() {
    gameState.running = false;
    gameState.isMoving = false;
    
    // 엔딩 화면 생성
    const endingDiv = document.createElement('div');
    endingDiv.id = 'endingScreen';
    endingDiv.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: linear-gradient(135deg, #FFB6C1, #FFE4E1);
        z-index: 10000;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        font-family: 'Jua', sans-serif;
        text-align: center;
        padding: 20px;
    `;
    
    // 엔딩 캔버스
    const endingCanvas = document.createElement('canvas');
    endingCanvas.width = 480;
    endingCanvas.height = 320;
    endingCanvas.style.cssText = `
        background: #87CEEB;
        border: 5px solid #FF69B4;
        border-radius: 20px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        image-rendering: pixelated;
        image-rendering: -moz-crisp-edges;
        image-rendering: crisp-edges;
        max-width: 90vw;
        height: auto;
    `;
    
    // 엔딩 텍스트
    const endingText = document.createElement('div');
    endingText.style.cssText = `
        margin-top: 30px;
        font-size: 24px;
        color: #FF1493;
        text-shadow: 2px 2px 0 #FFF;
        background: rgba(255,255,255,0.9);
        padding: 20px 40px;
        border-radius: 20px;
        border: 3px solid #FF69B4;
    `;
    
    // 캐릭터별 엔딩 설정
    switch(gameState.selectedCharacter) {
        case 'jiyul':
            endingText.innerHTML = `
                <h2 style="margin-bottom: 15px;">✈️ 영어 마스터 완성! ✈️</h2>
                <p>지율이가 영어를 완벽히 마스터했어요!</p>
                <p style="color: #8B008B; margin-top: 10px;">이제 세계 여행을 떠날 준비가 되었어요! 🌍</p>
            `;
            break;
        case 'kiwi':
            endingText.innerHTML = `
                <h2 style="margin-bottom: 15px;">🦎 영어 천재 키위! 🦎</h2>
                <p>키위가 영어 단어를 모두 외웠어요!</p>
                <p style="color: #8B008B; margin-top: 10px;">이제 외국 친구들과도 대화할 수 있어요! 💬</p>
            `;
            break;
        case 'whitehouse':
            endingText.innerHTML = `
                <h2 style="margin-bottom: 15px;">🏰 영어 왕국 완성! 🏰</h2>
                <p>화이트하우스가 영어의 성을 완성했어요!</p>
                <p style="color: #8B008B; margin-top: 10px;">텐트 안은 이제 영어 놀이터가 되었어요! 📚</p>
            `;
            break;
    }
    
    // 게임 통계 추가
    const statsText = document.createElement('div');
    statsText.style.cssText = `
        margin-top: 20px;
        font-size: 16px;
        color: #6B3AA0;
        background: rgba(255,255,255,0.8);
        padding: 15px 25px;
        border-radius: 15px;
        border: 2px solid #DDA0DD;
    `;
    
    const accuracy = gameStats.totalQuestions > 0 ? 
        Math.round((gameStats.correctAnswers / gameStats.totalQuestions) * 100) : 100;
    const playTime = Math.round((Date.now() - gameStats.startTime) / 1000);
    
    statsText.innerHTML = `
        <p>🎯 최종 점수: ${gameState.score}점</p>
        <p>📝 정답률: ${accuracy}% (${gameStats.correctAnswers}/${gameStats.totalQuestions})</p>
        <p>⏱️ 플레이 시간: ${Math.floor(playTime / 60)}분 ${playTime % 60}초</p>
    `;
    
    // 다시 시작 버튼
    const restartBtn = document.createElement('button');
    restartBtn.textContent = '🏠 메인으로';
    restartBtn.style.cssText = `
        margin-top: 30px;
        background: linear-gradient(135deg, #32CD32, #90EE90);
        border: 3px solid #FFF;
        color: white;
        padding: 15px 30px;
        font-size: 20px;
        font-weight: bold;
        cursor: pointer;
        font-family: 'Jua', sans-serif;
        border-radius: 25px;
        box-shadow: 0 5px 15px rgba(0,0,0,0.3);
        text-shadow: 1px 1px 2px rgba(0,0,0,0.3);
    `;
    restartBtn.onclick = () => {
        document.body.removeChild(endingDiv);
        saveGameRecord();
        showMenu();
    };
    
    endingDiv.appendChild(endingCanvas);
    endingDiv.appendChild(endingText);
    endingDiv.appendChild(statsText);
    endingDiv.appendChild(restartBtn);
    document.body.appendChild(endingDiv);
    
    // 엔딩 애니메이션 시작
    const endingCtx = endingCanvas.getContext('2d');
    endingCtx.imageSmoothingEnabled = false;
    animateEnding(endingCtx, endingCanvas);
    
    // 축하 파티클
    createEndingParticles();
}

// 엔딩 애니메이션
function animateEnding(ctx, canvas) {
    let frame = 0;
    
    function drawEndingScene() {
        ctx.fillStyle = '#87CEEB';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // 배경 그리기
        drawEndingBackground(ctx, canvas, frame);
        
        // 캐릭터별 엔딩 씬
        switch(gameState.selectedCharacter) {
            case 'jiyul':
                drawJiyulEnding(ctx, canvas, frame);
                break;
            case 'kiwi':
                drawKiwiEnding(ctx, canvas, frame);
                break;
            case 'whitehouse':
                drawWhitehouseEnding(ctx, canvas, frame);
                break;
        }
        
        frame++;
        requestAnimationFrame(drawEndingScene);
    }
    
    drawEndingScene();
}

// 엔딩 배경 (영어 테마)
function drawEndingBackground(ctx, canvas, frame) {
    // 그라데이션 하늘
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#87CEEB');
    gradient.addColorStop(1, '#FFE4E1');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 구름들
    drawEndingClouds(ctx, canvas, frame);
    
    // 땅
    ctx.fillStyle = '#228B22';
    ctx.fillRect(0, canvas.height - 60, canvas.width, 60);
}

// 지율이 엔딩 - 비행기 타고 해외로
function drawJiyulEnding(ctx, canvas, frame) {
    const centerX = canvas.width / 2;
    const centerY = canvas.height - 120;
    
    // 공항 배경
    drawAirportBackground(ctx, canvas);
    
    // 비행기 (날아가는 애니메이션)
    drawAirplane(ctx, canvas, frame);
    
    // 지율이 (가방 들고 있음)
    const jiyulX = centerX - 100 + Math.min(frame * 0.5, 50);
    const jiyulY = centerY;
    
    if (typeof pixelData !== 'undefined' && pixelData.jiyul) {
        const jiyulData = pixelData.jiyul;
        drawPixelSprite(jiyulData.idle, jiyulData.colorMap, jiyulX, jiyulY - 48, 3);
    }
    
    // 여행 가방
    drawSuitcase(ctx, jiyulX + 50, jiyulY + 20);
    
    // 여권과 티켓
    drawPassportAndTicket(ctx, jiyulX - 20, jiyulY - 70, frame);
    
    // 영어 단어들이 날아다니는 효과
    drawFlyingWords(ctx, canvas, frame);
    
    // 세계 지도와 목적지들
    drawWorldDestinations(ctx, canvas, frame);
    
    // 작별 인사하는 가족들
    if (frame > 180) {
        drawFamilyWaving(ctx, centerX + 100, centerY);
    }
}

// 키위 엔딩 - 외국 친구들과 대화
function drawKiwiEnding(ctx, canvas, frame) {
    const centerX = canvas.width / 2;
    const centerY = canvas.height - 100;
    
    // 국제 학교 배경
    drawInternationalSchoolBackground(ctx, canvas);
    
    // 키위 (중앙)
    if (typeof pixelData !== 'undefined' && pixelData.kiwi) {
        const kiwiData = pixelData.kiwi;
        const kiwiJump = Math.abs(Math.sin(frame * 0.05)) * 10;
        drawPixelSprite(kiwiData.idle, kiwiData.colorMap, centerX - 24, centerY - kiwiJump, 3);
    }
    
    // 다양한 나라의 친구들
    drawInternationalFriends(ctx, centerX, centerY, frame);
    
    // 대화 말풍선들 (영어)
    drawEnglishChatBubbles(ctx, centerX, centerY, frame);
    
    // 국기들
    drawCountryFlags(ctx, canvas, frame);
    
    // 영어 책들
    drawEnglishBooks(ctx, centerX - 150, centerY + 40);
}

// 화이트하우스 엔딩 - 영어 왕국
function drawWhitehouseEnding(ctx, canvas, frame) {
    const centerX = canvas.width / 2;
    const centerY = canvas.height - 100;
    
    // 영어 왕국 배경
    drawEnglishKingdomBackground(ctx, canvas);
    
    // 화이트하우스 (왕관 쓴 버전)
    if (typeof pixelData !== 'undefined' && pixelData.whitehouse) {
        const whData = pixelData.whitehouse;
        drawPixelSprite(whData.idle, whData.colorMap, centerX - 60, centerY - 60, 4);
    }
    
    // 왕관
    drawCrown(ctx, centerX, centerY - 120, frame);
    
    // 영어 알파벳 성벽
    drawAlphabetWalls(ctx, canvas, frame);
    
    // 영어 단어 보물들
    drawWordTreasures(ctx, centerX, centerY, frame);
    
    // 축하하는 캐릭터들
    drawCelebrationCharacters(ctx, centerX, centerY, frame);
}

// === 엔딩 디테일 함수들 ===

// 공항 배경
function drawAirportBackground(ctx, canvas) {
    // 공항 터미널 창문
    ctx.fillStyle = '#D3D3D3';
    ctx.fillRect(0, 100, canvas.width, 120);
    
    // 창문들
    for (let i = 0; i < 6; i++) {
        ctx.fillStyle = '#87CEEB';
        ctx.fillRect(20 + i * 80, 120, 60, 80);
        ctx.strokeStyle = '#696969';
        ctx.lineWidth = 3;
        ctx.strokeRect(20 + i * 80, 120, 60, 80);
    }
}

// 비행기 그리기
function drawAirplane(ctx, canvas, frame) {
    const planeX = 50 + (frame * 1.5) % (canvas.width + 200);
    const planeY = 50 + Math.sin(frame * 0.02) * 20;
    
    // 비행기 몸체
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(planeX, planeY, 80, 20);
    
    // 비행기 앞부분
    ctx.beginPath();
    ctx.moveTo(planeX + 80, planeY);
    ctx.lineTo(planeX + 95, planeY + 10);
    ctx.lineTo(planeX + 80, planeY + 20);
    ctx.closePath();
    ctx.fill();
    
    // 날개
    ctx.fillStyle = '#4169E1';
    ctx.fillRect(planeX + 30, planeY - 15, 30, 50);
    
    // 창문들
    ctx.fillStyle = '#87CEEB';
    for (let i = 0; i < 6; i++) {
        ctx.beginPath();
        ctx.arc(planeX + 10 + i * 12, planeY + 10, 3, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // 비행기 구름
    if (planeX > 100) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.arc(planeX - 20 - i * 15, planeY + 10 + Math.random() * 10, 10 + i * 3, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}

// 여행 가방
function drawSuitcase(ctx, x, y) {
    // 가방 본체
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(x, y, 30, 40);
    
    // 가방 손잡이
    ctx.strokeStyle = '#654321';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(x + 15, y - 5, 8, Math.PI, 0);
    ctx.stroke();
    
    // 스티커들
    ctx.fillStyle = '#FF69B4';
    ctx.fillRect(x + 5, y + 10, 8, 8);
    ctx.fillStyle = '#32CD32';
    ctx.fillRect(x + 17, y + 15, 8, 8);
    
    // 바퀴
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(x + 8, y + 42, 3, 0, Math.PI * 2);
    ctx.arc(x + 22, y + 42, 3, 0, Math.PI * 2);
    ctx.fill();
}

// 여권과 티켓
function drawPassportAndTicket(ctx, x, y, frame) {
    const float = Math.sin(frame * 0.05) * 5;
    
    // 여권
    ctx.fillStyle = '#8B0000';
    ctx.fillRect(x, y + float, 25, 35);
    ctx.fillStyle = '#FFD700';
    ctx.fillRect(x + 8, y + float + 5, 9, 9);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '8px Arial';
    ctx.fillText('PASS', x + 6, y + float + 25);
    
    // 티켓
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(x + 30, y + float + 5, 40, 20);
    ctx.strokeStyle = '#4169E1';
    ctx.strokeRect(x + 30, y + float + 5, 40, 20);
    ctx.fillStyle = '#000000';
    ctx.font = '8px Arial';
    ctx.fillText('TICKET', x + 35, y + float + 17);
}

// 날아다니는 영어 단어들
function drawFlyingWords(ctx, canvas, frame) {
    const words = ['HELLO', 'WORLD', 'TRAVEL', 'FRIEND', 'LEARN', 'FUN'];
    const colors = ['#FF69B4', '#32CD32', '#FFD700', '#9370DB', '#FF6347', '#4169E1'];
    
    words.forEach((word, i) => {
        const x = (i * 80 + frame * 2) % (canvas.width + 100);
        const y = 30 + Math.sin(frame * 0.05 + i) * 20;
        const alpha = (Math.sin(frame * 0.03 + i) + 1) * 0.5;
        
        ctx.fillStyle = colors[i] + Math.floor(alpha * 255).toString(16).padStart(2, '0');
        ctx.font = 'bold 16px Jua';
        ctx.fillText(word, x, y);
    });
}

// 세계 지도와 목적지들
function drawWorldDestinations(ctx, canvas, frame) {
    const destinations = [
        {name: 'USA', x: 100, y: 80},
        {name: 'UK', x: 200, y: 70},
        {name: 'JAPAN', x: 300, y: 85},
        {name: 'FRANCE', x: 180, y: 90}
    ];
    
    destinations.forEach((dest, i) => {
        const pulse = Math.sin(frame * 0.1 + i) * 3;
        
        // 목적지 점
        ctx.fillStyle = '#FF0000';
        ctx.beginPath();
        ctx.arc(dest.x, dest.y + pulse, 5, 0, Math.PI * 2);
        ctx.fill();
        
        // 목적지 이름
        ctx.fillStyle = '#000000';
        ctx.font = '10px Arial';
        ctx.fillText(dest.name, dest.x - 15, dest.y - 10);
    });
}

// 작별 인사하는 가족
function drawFamilyWaving(ctx, x, y) {
    // 간단한 가족 실루엣
    ctx.fillStyle = '#8B4513';
    // 엄마
    ctx.fillRect(x, y - 40, 20, 40);
    ctx.beginPath();
    ctx.arc(x + 10, y - 50, 10, 0, Math.PI * 2);
    ctx.fill();
    
    // 아빠
    ctx.fillRect(x + 30, y - 45, 20, 45);
    ctx.beginPath();
    ctx.arc(x + 40, y - 55, 10, 0, Math.PI * 2);
    ctx.fill();
    
    // 손 흔들기
    ctx.fillStyle = '#FFE0BD';
    ctx.fillRect(x - 5, y - 35, 5, 10);
    ctx.fillRect(x + 55, y - 40, 5, 10);
}

// 국제 학교 배경
function drawInternationalSchoolBackground(ctx, canvas) {
    // 학교 건물
    ctx.fillStyle = '#DEB887';
    ctx.fillRect(50, 100, canvas.width - 100, 120);
    
    // 학교 지붕
    ctx.fillStyle = '#8B4513';
    ctx.beginPath();
    ctx.moveTo(30, 100);
    ctx.lineTo(canvas.width / 2, 60);
    ctx.lineTo(canvas.width - 30, 100);
    ctx.closePath();
    ctx.fill();
    
    // 학교 이름
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('INTERNATIONAL SCHOOL', canvas.width / 2, 90);
    ctx.textAlign = 'left';
}

// 다양한 나라의 친구들
function drawInternationalFriends(ctx, centerX, centerY, frame) {
    const friends = [
        {x: centerX - 120, flag: '🇺🇸', greeting: 'Hi!'},
        {x: centerX - 60, flag: '🇯🇵', greeting: 'Hello!'},
        {x: centerX + 60, flag: '🇫🇷', greeting: 'Bonjour!'},
        {x: centerX + 120, flag: '🇬🇧', greeting: 'Hello!'}
    ];
    
    friends.forEach((friend, i) => {
        // 친구 몸통 (간단한 픽셀)
        ctx.fillStyle = ['#FFE0BD', '#F5DEB3', '#FFDAB9', '#FFE4B5'][i];
        ctx.fillRect(friend.x - 8, centerY - 32, 16, 32);
        
        // 머리
        ctx.beginPath();
        ctx.arc(friend.x, centerY - 40, 8, 0, Math.PI * 2);
        ctx.fill();
        
        // 국기 표시 (텍스트로 대체)
        ctx.fillStyle = '#000000';
        ctx.font = '12px Arial';
        ctx.fillText(friend.flag, friend.x - 10, centerY - 55);
    });
}

// 영어 대화 말풍선
function drawEnglishChatBubbles(ctx, centerX, centerY, frame) {
    const chats = [
        {x: centerX - 100, y: centerY - 80, text: 'Nice to\nmeet you!'},
        {x: centerX + 80, y: centerY - 90, text: 'Let\'s be\nfriends!'},
        {x: centerX, y: centerY - 100, text: 'I love\nEnglish!'}
    ];
    
    const chatIndex = Math.floor(frame / 120) % chats.length;
    const chat = chats[chatIndex];
    
    // 말풍선
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(chat.x - 30, chat.y - 20, 60, 40);
    ctx.beginPath();
    ctx.moveTo(chat.x, chat.y + 20);
    ctx.lineTo(chat.x - 10, chat.y + 30);
    ctx.lineTo(chat.x + 10, chat.y + 20);
    ctx.closePath();
    ctx.fill();
    
    // 텍스트
    ctx.fillStyle = '#000000';
    ctx.font = '10px Arial';
    const lines = chat.text.split('\n');
    lines.forEach((line, i) => {
        ctx.fillText(line, chat.x - 25, chat.y + i * 12 - 5);
    });
}

// 나라 국기들
function drawCountryFlags(ctx, canvas, frame) {
    const flagY = 20;
    const flags = [
        {x: 50, colors: ['#FF0000', '#FFFFFF', '#0000FF']}, // 프랑스
        {x: 150, colors: ['#000000', '#FF0000', '#FFD700']}, // 독일
        {x: 250, colors: ['#00FF00', '#FFFFFF', '#FF0000']}, // 이탈리아
        {x: 350, colors: ['#FF0000', '#FFFFFF']}, // 일본
    ];
    
    flags.forEach(flag => {
        const wave = Math.sin(frame * 0.05 + flag.x * 0.01) * 3;
        flag.colors.forEach((color, i) => {
            ctx.fillStyle = color;
            ctx.fillRect(flag.x + i * 10, flagY + wave, 10, 20);
        });
        
        // 깃대
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(flag.x - 2, flagY - 5, 2, 30);
    });
}

// 영어 책들
function drawEnglishBooks(ctx, x, y) {
    const books = [
        {title: 'ABC', color: '#FF69B4'},
        {title: 'WORDS', color: '#32CD32'},
        {title: 'STORY', color: '#FFD700'}
    ];
    
    books.forEach((book, i) => {
        ctx.fillStyle = book.color;
        ctx.fillRect(x + i * 25, y - i * 5, 20, 30);
        
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '8px Arial';
        ctx.save();
        ctx.translate(x + i * 25 + 10, y - i * 5 + 20);
        ctx.rotate(-0.1);
        ctx.fillText(book.title, -10, 0);
        ctx.restore();
    });
}

// 영어 왕국 배경
function drawEnglishKingdomBackground(ctx, canvas) {
    // 성 배경
    ctx.fillStyle = '#D3D3D3';
    ctx.fillRect(0, 80, canvas.width, 140);
    
    // 성 탑들
    for (let i = 0; i < 5; i++) {
        const x = i * 100 + 40;
        ctx.fillStyle = '#A9A9A9';
        ctx.fillRect(x, 60, 40, 160);
        
        // 탑 지붕
        ctx.fillStyle = '#4169E1';
        ctx.beginPath();
        ctx.moveTo(x - 5, 60);
        ctx.lineTo(x + 20, 30);
        ctx.lineTo(x + 45, 60);
        ctx.closePath();
        ctx.fill();
    }
}

// 왕관
function drawCrown(ctx, x, y, frame) {
    const float = Math.sin(frame * 0.05) * 3;
    
    // 왕관 본체
    ctx.fillStyle = '#FFD700';
    ctx.fillRect(x - 30, y + float, 60, 20);
    
    // 왕관 뿔들
    for (let i = 0; i < 5; i++) {
        const peakX = x - 25 + i * 15;
        ctx.beginPath();
        ctx.moveTo(peakX - 5, y + float);
        ctx.lineTo(peakX, y + float - 15);
        ctx.lineTo(peakX + 5, y + float);
        ctx.closePath();
        ctx.fill();
    }
    
    // 보석들
    ctx.fillStyle = '#FF1493';
    for (let i = 0; i < 5; i++) {
        ctx.beginPath();
        ctx.arc(x - 20 + i * 10, y + float + 10, 3, 0, Math.PI * 2);
        ctx.fill();
    }
}

// 알파벳 성벽
function drawAlphabetWalls(ctx, canvas, frame) {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const wallY = 200;
    
    for (let i = 0; i < alphabet.length; i++) {
        const x = (i * 20 - frame * 0.5) % canvas.width;
        if (x < -20) continue;
        
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(x, wallY, 18, 25);
        
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 12px Arial';
        ctx.fillText(alphabet[i], x + 4, wallY + 17);
    }
}

// 영어 단어 보물들
function drawWordTreasures(ctx, centerX, centerY, frame) {
    const treasures = [
        {word: 'GOLD', x: -60, color: '#FFD700'},
        {word: 'DIAMOND', x: 0, color: '#87CEEB'},
        {word: 'RUBY', x: 60, color: '#DC143C'}
    ];
    
    treasures.forEach((treasure, i) => {
        const bounce = Math.abs(Math.sin(frame * 0.08 + i)) * 10;
        const x = centerX + treasure.x;
        const y = centerY + 30 - bounce;
        
        // 보물 상자
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(x - 20, y, 40, 30);
        
        // 보물 빛
        ctx.fillStyle = treasure.color + '80';
        ctx.beginPath();
        ctx.arc(x, y - 5, 25, 0, Math.PI * 2);
        ctx.fill();
        
        // 단어
        ctx.fillStyle = treasure.color;
        ctx.font = 'bold 10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(treasure.word, x, y - 10);
        ctx.textAlign = 'left';
    });
}

// 축하하는 캐릭터들
function drawCelebrationCharacters(ctx, centerX, centerY, frame) {
    // 지율이와 키위가 축하
    if (typeof pixelData !== 'undefined') {
        // 지율이 (왼쪽)
        if (pixelData.jiyul) {
            const jiyulJump = Math.abs(Math.sin(frame * 0.1)) * 15;
            drawPixelSprite(
                pixelData.jiyul.idle, 
                pixelData.jiyul.colorMap, 
                centerX - 150, 
                centerY - jiyulJump, 
                2
            );
        }
        
        // 키위 (오른쪽)
        if (pixelData.kiwi) {
            const kiwiJump = Math.abs(Math.sin(frame * 0.1 + 1)) * 12;
            drawPixelSprite(
                pixelData.kiwi.idle, 
                pixelData.kiwi.colorMap, 
                centerX + 120, 
                centerY - kiwiJump, 
                2
            );
        }
    }
    
    // 축하 효과
    drawConfetti(ctx, canvas, frame);
}

// 구름 그리기 (엔딩용)
function drawEndingClouds(ctx, canvas, frame) {
    const clouds = [
        {x: 50, y: 40, size: 1.2},
        {x: 200, y: 60, size: 0.8},
        {x: 350, y: 30, size: 1.0}
    ];
    
    clouds.forEach(cloud => {
        const cloudX = (cloud.x + frame * 0.3) % (canvas.width + 100);
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        // 구름 모양
        ctx.beginPath();
        ctx.arc(cloudX, cloud.y, 20 * cloud.size, 0, Math.PI * 2);
        ctx.arc(cloudX + 25 * cloud.size, cloud.y, 30 * cloud.size, 0, Math.PI * 2);
        ctx.arc(cloudX + 50 * cloud.size, cloud.y, 20 * cloud.size, 0, Math.PI * 2);
        ctx.fill();
    });
}

// 색종이 효과
function drawConfetti(ctx, canvas, frame) {
    const colors = ['#FF69B4', '#FFD700', '#32CD32', '#87CEEB', '#FF6347'];
    
    for (let i = 0; i < 30; i++) {
        const x = (Math.sin(i + frame * 0.05) + 1) * canvas.width / 2;
        const y = ((frame * 2 + i * 20) % canvas.height);
        const rotation = frame * 0.1 + i;
        
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(rotation);
        
        ctx.fillStyle = colors[i % colors.length];
        ctx.fillRect(-4, -2, 8, 4);
        
        ctx.restore();
    }
}

// 엔딩 파티클 생성
function createEndingParticles() {
    // 축하 파티클 효과 (별, 하트 등)
    const endingParticles = [];
    
    for (let i = 0; i < 50; i++) {
        endingParticles.push({
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
            vx: (Math.random() - 0.5) * 2,
            vy: Math.random() * 2 + 1,
            type: Math.random() > 0.5 ? 'star' : 'heart',
            color: ['#FFD700', '#FF69B4', '#87CEEB'][Math.floor(Math.random() * 3)],
            size: Math.random() * 10 + 5,
            life: 200
        });
    }
    
    // 파티클 애니메이션
    function animateParticles() {
        endingParticles.forEach(particle => {
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.life--;
            
            if (particle.y > window.innerHeight) {
                particle.y = -20;
                particle.x = Math.random() * window.innerWidth;
            }
        });
        
        if (endingParticles.some(p => p.life > 0)) {
            requestAnimationFrame(animateParticles);
        }
    }
    
    animateParticles();
}

// 픽셀 스프라이트 그리기 함수 (엔딩용)
function drawPixelSprite(sprite, colorMap, x, y, scale = 3) {
    if (!sprite || !colorMap) return;
    
    for (let row = 0; row < sprite.length; row++) {
        for (let col = 0; col < sprite[row].length; col++) {
            const pixel = sprite[row][col];
            if (pixel !== 0 && colorMap[pixel]) {
                ctx.fillStyle = colorMap[pixel];
                ctx.fillRect(x + col * scale, y + row * scale, scale, scale);
            }
        }
    }
}