// 영어 게임 로직 - 메인 파일 (분리 후)
// 필요한 파일들: background.js, ending.js, particles.js를 먼저 로드해야 함

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;

// 픽셀 스케일과 물리 상수
let PIXEL_SCALE = 3;
const GRAVITY = 0.8;             // 상승 중 중력
const FALL_GRAVITY = 1.35;       // 하강 중 중력 (빨리 떨어져야 경쾌한 아크가 됨)
const APEX_GRAVITY = 0.42;       // 꼭짓점 부근 중력 (살짝 떠 있는 체공감)
const MAX_FALL_SPEED = 15;       // 최대 낙하 속도
const JUMP_BUFFER_FRAMES = 8;    // 착지 직전 점프 입력을 기억하는 프레임 수
const JUMP_POWER = -18;
const JUMP_FORWARD_SPEED = 6;
let GROUND_Y = 240;

const bossMessages = {
    intro: {
        jiyul: [
            { speaker: "boss", text: "흐하하하! 지구의 꼬마야! 나는 알파벳 대마왕이다!" },
            { speaker: "jiyul", text: "어? 설마 오프닝에서 봤던 그거 아냐?!" },
            { speaker: "boss", text: "이번엔 진짜 심각하다! A부터 Z까지 모든 영어를 내가 지배할 것이야!" },
            { speaker: "jiyul", text: "좋아! 내가 영어 실력으로 지구를 지켜줄게!" }
        ],
        kiwi: [
            { speaker: "boss", text: "흐하하하! 지구의 꼬마야! 나는 알파벳 대마왕이다!" },
            { speaker: "kiwi", text: "라룩라룩?! (번역: 저 UFO가 왜 여기에?!)" },
            { speaker: "boss", text: "너희들 영어 실력이 정말 대단하구나... 인정한다!" },
            { speaker: "kiwi", text: "라룩! (번역: 내 영어 실력을 보여주겠어!)" }
        ],
        whitehouse: [
            { speaker: "boss", text: "흐하하하! 지구의 꼬마야! 나는 알파벳 대마왕이다!" },
            { speaker: "whitehouse", text: "으음... 내 센서가 강력한 적을 감지했다!" },
            { speaker: "boss", text: "흥미롭군... 내 백과사전에 '우주 침입자 대처법' 항목이 있었던 것 같은데..." },
            { speaker: "whitehouse", text: "데이터베이스 로딩 완료! 영어 배틀 모드 활성화!" }
        ]
    },
    mid: {
        jiyul: [
            { speaker: "boss", text: "어... 어떻게! 내 완벽한 영어 실력이! 이럴 수가!" },
            { speaker: "jiyul", text: "어? 생각보다 약하네! 영어 공부 열심히 한 보람이 있어!" },
            { speaker: "boss", text: "아직 끝나지 않았다! 내가 숨겨둔 비밀 병기... 초고난도 영어 단어들!" },
            { speaker: "boss", text: "이제부터가 진짜야! 준비됐나, 지구 꼬맹아?" }
        ],
        kiwi: [
            { speaker: "boss", text: "어... 어떻게! 내 완벽한 영어 실력이! 이럴 수가!" },
            { speaker: "kiwi", text: "라룩라룩! (번역: 하하! 내가 이기고 있어!)" },
            { speaker: "boss", text: "아직 끝나지 않았다! 내가 숨겨둔 비밀 병기... 초고난도 영어 단어들!" },
            { speaker: "boss", text: "이제부터가 진짜야! 준비됐나, 지구 꼬맹아?" }
        ],
        whitehouse: [
            { speaker: "boss", text: "어... 어떻게! 내 완벽한 영어 실력이! 이럴 수가!" },
            { speaker: "whitehouse", text: "계산 결과... 승리 확률 87.3%! 거의 다 왔다!" },
            { speaker: "boss", text: "아직 끝나지 않았다! 내가 숨겨둔 비밀 병기... 초고난도 영어 단어들!" },
            { speaker: "boss", text: "이제부터가 진짜야! 준비됐나, 지구 꼬맹아?" }
        ]
    },
    defeat: {
        jiyul: [
            { speaker: "boss", text: "아... 아니다! 이럴 수가! 내가... 내가 졌다고?!" },
            { speaker: "jiyul", text: "야호! 해냈어! 영어 공부 열심히 한 보람이 있었네!" },
            { speaker: "boss", text: "흑흑... 너희들 영어 실력이 정말 대단하구나... 인정한다!" },
            { speaker: "boss", text: "사실... 나도 영어 공부하고 싶었어. 같이 친구가 될 수 있을까?" },
            { speaker: "jiyul", text: "앞으로도 영어 공부 열심히 해서 지구를 지킬게! 화이팅!" },
            { speaker: "boss", text: "고마워! 이제부터 나도 영어 공부 열심히 할게! 지구 만세!" }
        ],
        kiwi: [
            { speaker: "boss", text: "아... 아니다! 이럴 수가! 내가... 내가 졌다고?!" },
            { speaker: "kiwi", text: "라룩라룩라룩! (번역: 우리가 이겼다! 지구만세!)" },
            { speaker: "boss", text: "흑흑... 너희들 영어 실력이 정말 대단하구나... 인정한다!" },
            { speaker: "boss", text: "사실... 나도 영어 공부하고 싶었어. 같이 친구가 될 수 있을까?" },
            { speaker: "kiwi", text: "라룩! (번역: 이제 안전하게 간식을 먹을 수 있겠어!)" },
            { speaker: "boss", text: "고마워! 이제부터 나도 영어 공부 열심히 할게! 지구 만세!" }
        ],
        whitehouse: [
            { speaker: "boss", text: "아... 아니다! 이럴 수가! 내가... 내가 졌다고?!" },
            { speaker: "whitehouse", text: "미션 컴플리트! 지구 방어 성공! 데이터 저장 중..." },
            { speaker: "boss", text: "흑흑... 너희들 영어 실력이 정말 대단하구나... 인정한다!" },
            { speaker: "boss", text: "사실... 나도 영어 공부하고 싶었어. 같이 친구가 될 수 있을까?" },
            { speaker: "whitehouse", text: "평화가 돌아왔다. 이제 영어 학습 모드로 복귀하자!" },
            { speaker: "boss", text: "고마워! 이제부터 나도 영어 공부 열심히 할게! 지구 만세!" }
        ]
    }
};

// 캐릭터별 정보 (이름, 색상)
const characterInfo = {
    boss: {
        name: "알파벳 대마왕",
        color: "#8A2BE2",
        bgColor: "#4B0082"
    },
    jiyul: {
        name: "크림이",
        color: "#FF69B4",
        bgColor: "#FF1493"
    },
    kiwi: {
        name: "키위",
        color: "#32CD32",
        bgColor: "#228B22"
    },
    whitehouse: {
        name: "화이트하우스",
        color: "#4169E1",
        bgColor: "#1E90FF"
    }
};

// 대화 시스템 변수
let currentDialogue = null;
let currentDialogueIndex = 0;
let isDialogueActive = false;
let autoPlayInterval = null;
let characterFaceCanvas = null;

// 픽셀 캐릭터 얼굴 그리기 함수
function drawCharacterFace(character, canvasElement) {
    if (!canvasElement) return;
    
    const ctx = canvasElement.getContext('2d');
    canvasElement.width = 128;
    canvasElement.height = 128;
    
    // 캔버스 초기화
    ctx.clearRect(0, 0, 128, 128);
    
    let spriteData, colorMap;
    
    // alphabetMonsters 객체에서 보스 데이터 가져오기
    if (character === 'boss' && typeof alphabetMonsters !== 'undefined' && alphabetMonsters.boss) {
        spriteData = alphabetMonsters.boss.idle;
        colorMap = alphabetMonsters.boss.colorMap;
    } else if (typeof pixelData !== 'undefined' && pixelData[character]) {
        spriteData = pixelData[character].idle;
        colorMap = pixelData[character].colorMap;
    } else {
        // 기본 얼굴 그리기 (픽셀 데이터가 없을 경우)
        ctx.fillStyle = '#FFE0BD';
        ctx.fillRect(32, 32, 64, 64);
        return;
    }
    
    // 픽셀 스프라이트 그리기 (스프라이트 크기에 맞춰 자동 배율)
    const scale = Math.max(1, Math.floor(120 / Math.max(spriteData[0].length, spriteData.length)));
    const offsetX = (128 - spriteData[0].length * scale) / 2;
    const offsetY = (128 - spriteData.length * scale) / 2;
    
    for (let row = 0; row < spriteData.length; row++) {
        for (let col = 0; col < spriteData[row].length; col++) {
            const pixel = spriteData[row][col];
            if (pixel !== 0 && colorMap[pixel]) {
                ctx.fillStyle = colorMap[pixel];
                ctx.fillRect(
                    offsetX + col * scale, 
                    offsetY + row * scale, 
                    scale, 
                    scale
                );
            }
        }
    }
}

// 개선된 보스 메시지 표시 함수
function showBossMessage(messageType, onComplete) {
    const character = gameState.selectedCharacter || 'jiyul';
    const dialogues = bossMessages[messageType][character] || bossMessages[messageType]['jiyul'];
    
    // 게임 상태 정지
    gameState.isMoving = false;
    gameState.bossDialogueActive = true;
    isDialogueActive = true;
    
    // UI 숨기기
    document.getElementById('ui').style.display = 'none';
    document.getElementById('questionPanel').style.display = 'none';
    const pauseB = document.getElementById('pauseBtn');
    if (pauseB) pauseB.style.display = 'none';

    // 대화 시스템 초기화
    currentDialogue = dialogues;
    currentDialogueIndex = 0;

    // 자동재생에서도 완료 콜백이 실행되도록 전역에 보관
    // (기존에는 null로만 남아 자동재생으로 대화를 끝내면 전투/엔딩이 멈추는 버그가 있었음)
    window.currentDialogueComplete = onComplete || null;

    // 대화 박스 생성
    createDialogueBox(onComplete);
    
    // 첫 번째 대화 표시
    showNextDialogue();
}

// 대화 박스 생성
function createDialogueBox(onComplete) {
    // 기존 대화 박스 제거
    const existingBox = document.getElementById('dialogueBox');
    if (existingBox) {
        existingBox.remove();
    }
    
    const dialogueBox = document.createElement('div');
    dialogueBox.id = 'dialogueBox';
    dialogueBox.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        width: 90%;
        max-width: 800px;
        height: 200px;
        background: linear-gradient(135deg, #F8F4FF, #E6E6FA);
        border: 4px solid #9370DB;
        border-radius: 20px;
        font-family: 'DungGeunMo', 'Jua', sans-serif;
        z-index: 1000;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
        display: flex;
        overflow: hidden;
    `;
    
    // 캐릭터 얼굴 영역
    const characterFaceArea = document.createElement('div');
    characterFaceArea.id = 'characterFaceArea';
    characterFaceArea.style.cssText = `
        width: 160px;
        height: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        border-right: 3px solid #9370DB;
        position: relative;
        overflow: hidden;
    `;
    
    // 캐릭터 얼굴 캔버스
    characterFaceCanvas = document.createElement('canvas');
    characterFaceCanvas.id = 'characterFaceCanvas';
    characterFaceCanvas.style.cssText = `
        width: 120px;
        height: 120px;
        image-rendering: pixelated;
        image-rendering: -moz-crisp-edges;
        image-rendering: crisp-edges;
        margin-bottom: 10px;
    `;
    
    // 캐릭터 이름 표시
    const characterNameLabel = document.createElement('div');
    characterNameLabel.id = 'characterNameLabel';
    characterNameLabel.style.cssText = `
        color: white;
        font-weight: bold;
        font-size: 14px;
        text-align: center;
        text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
        padding: 5px;
        border-radius: 10px;
        background: rgba(0,0,0,0.3);
    `;
    
    characterFaceArea.appendChild(characterFaceCanvas);
    characterFaceArea.appendChild(characterNameLabel);
    
    // 대화 내용 영역
    const dialogueContent = document.createElement('div');
    dialogueContent.style.cssText = `
        flex: 1;
        padding: 20px;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        position: relative;
    `;
    
    // 화자 이름 표시
    const speakerName = document.createElement('div');
    speakerName.id = 'speakerName';
    speakerName.style.cssText = `
        font-size: 16px;
        font-weight: bold;
        color: #6B3AA0;
        margin-bottom: 10px;
    `;
    
    // 대화 텍스트
    const dialogueText = document.createElement('div');
    dialogueText.id = 'dialogueText';
    dialogueText.style.cssText = `
        font-size: 18px;
        color: #4B0082;
        line-height: 1.6;
        flex: 1;
        overflow-y: auto;
        word-wrap: break-word;
    `;
    
    // 버튼 영역
    const buttonArea = document.createElement('div');
    buttonArea.style.cssText = `
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-top: 15px;
    `;
    
    // 스킵 버튼
    const skipButton = document.createElement('button');
    setPixelText(skipButton, '스킵', { fontPx: 11, scale: 2, color: '#FFFFFF', outline: 'rgba(0,0,0,0.35)', shadow: 'rgba(0,0,0,0)', inline: true });
    skipButton.style.cssText = `
        background: linear-gradient(135deg, #FF6B6B, #FF8E8E);
        border: 2px solid #FFF;
        color: white;
        padding: 8px 16px;
        font-size: 14px;
        font-weight: bold;
        cursor: pointer;
        font-family: 'DungGeunMo', 'Jua', sans-serif;
        border-radius: 10px;
        box-shadow: 0 3px 10px rgba(0,0,0,0.2);
        transition: all 0.2s;
    `;
    
    skipButton.onmouseover = () => {
        skipButton.style.transform = 'scale(1.05)';
    };
    skipButton.onmouseout = () => {
        skipButton.style.transform = 'scale(1)';
    };
    
    // 자동재생 토글 버튼
    const autoButton = document.createElement('button');
    autoButton.id = 'autoButton';
    setPixelText(autoButton, '자동', { fontPx: 11, scale: 2, color: '#FFFFFF', outline: 'rgba(0,0,0,0.35)', shadow: 'rgba(0,0,0,0)', inline: true });
    autoButton.style.cssText = `
        background: linear-gradient(135deg, #4ECDC4, #7FDDDD);
        border: 2px solid #FFF;
        color: white;
        padding: 8px 16px;
        font-size: 14px;
        font-weight: bold;
        cursor: pointer;
        font-family: 'DungGeunMo', 'Jua', sans-serif;
        border-radius: 10px;
        box-shadow: 0 3px 10px rgba(0,0,0,0.2);
        transition: all 0.2s;
    `;
    
    // 다음/완료 버튼
    const nextButton = document.createElement('button');
    nextButton.id = 'nextButton';
    setPixelText(nextButton, '다음', { fontPx: 11, scale: 2, color: '#FFFFFF', outline: 'rgba(0,0,0,0.35)', shadow: 'rgba(0,0,0,0)', inline: true });
    nextButton.style.cssText = `
        background: linear-gradient(135deg, #32CD32, #90EE90);
        border: 3px solid #FFF;
        color: white;
        padding: 12px 24px;
        font-size: 16px;
        font-weight: bold;
        cursor: pointer;
        font-family: 'DungGeunMo', 'Jua', sans-serif;
        border-radius: 15px;
        box-shadow: 0 5px 15px rgba(0,0,0,0.3);
        transition: all 0.2s;
    `;
    
    nextButton.onmouseover = () => {
        nextButton.style.transform = 'scale(1.05)';
    };
    nextButton.onmouseout = () => {
        nextButton.style.transform = 'scale(1)';
    };
    
    // 이벤트 리스너
    skipButton.onclick = () => {
        skipDialogue(onComplete);
    };
    
    autoButton.onclick = () => {
        toggleAutoPlay();
    };
    
    nextButton.onclick = () => {
        nextDialogue(onComplete);
    };
    
    // 키보드 이벤트 (스페이스바로 다음 대화)
    const keyHandler = (e) => {
        if (e.code === 'Space' && isDialogueActive) {
            e.preventDefault();
            nextDialogue(onComplete);
        }
    };
    document.addEventListener('keydown', keyHandler);
    
    // 정리 함수를 나중에 호출할 수 있도록 저장
    dialogueBox.cleanup = () => {
        document.removeEventListener('keydown', keyHandler);
        if (autoPlayInterval) {
            clearInterval(autoPlayInterval);
            autoPlayInterval = null;
        }
    };
    
    // 요소들 조립
    dialogueContent.appendChild(speakerName);
    dialogueContent.appendChild(dialogueText);
    buttonArea.appendChild(skipButton);
    buttonArea.appendChild(autoButton);
    buttonArea.appendChild(nextButton);
    dialogueContent.appendChild(buttonArea);
    
    dialogueBox.appendChild(characterFaceArea);
    dialogueBox.appendChild(dialogueContent);
    
    document.body.appendChild(dialogueBox);
}

// 다음 대화 표시
function showNextDialogue() {
    if (!currentDialogue || currentDialogueIndex >= currentDialogue.length) {
        return;
    }
    
    const dialogue = currentDialogue[currentDialogueIndex];
    const charInfo = characterInfo[dialogue.speaker];
    
    // 캐릭터 얼굴 영역 배경색 업데이트
    const characterFaceArea = document.getElementById('characterFaceArea');
    characterFaceArea.style.background = `linear-gradient(135deg, ${charInfo.bgColor}, ${charInfo.color})`;
    
    // 캐릭터 얼굴 그리기
    if (characterFaceCanvas) {
        drawCharacterFace(dialogue.speaker, characterFaceCanvas);
    }
    
    // 캐릭터 이름 업데이트
    const characterNameLabel = document.getElementById('characterNameLabel');
    setPixelText(characterNameLabel, charInfo.name, { fontPx: 11, scale: 2, color: '#9932CC', outline: 'rgba(255,255,255,0.9)', shadow: 'rgba(0,0,0,0)', inline: true });
    
    // 화자 이름과 대화 텍스트 업데이트
    setPixelText(document.getElementById('speakerName'), charInfo.name, { fontPx: 12, scale: 2, color: '#9932CC', outline: 'rgba(255,255,255,0.9)', shadow: 'rgba(0,0,0,0)', inline: true });
    setPixelText(document.getElementById('dialogueText'), dialogue.text, { fontPx: 12, scale: 2, color: '#4A2C6E', outline: 'rgba(255,255,255,0.9)', shadow: 'rgba(0,0,0,0)', wrapPx: 220 });
    
    // 버튼 텍스트 업데이트
    const nextButton = document.getElementById('nextButton');
    if (currentDialogueIndex >= currentDialogue.length - 1) {
        setPixelText(nextButton, '완료', { fontPx: 11, scale: 2, color: '#FFFFFF', outline: 'rgba(0,0,0,0.35)', shadow: 'rgba(0,0,0,0)', inline: true });
    } else {
        setPixelText(nextButton, '다음', { fontPx: 11, scale: 2, color: '#FFFFFF', outline: 'rgba(0,0,0,0.35)', shadow: 'rgba(0,0,0,0)', inline: true });
    }
}

// 다음 대화로 이동
function nextDialogue(onComplete) {
    currentDialogueIndex++;
    
    if (currentDialogueIndex >= currentDialogue.length) {
        // 대화 종료
        endDialogue(onComplete);
    } else {
        // 다음 대화 표시
        showNextDialogue();
    }
}

// 대화 스킵
function skipDialogue(onComplete) {
    endDialogue(onComplete);
}

// 자동재생 토글
function toggleAutoPlay() {
    const autoButton = document.getElementById('autoButton');
    
    if (autoPlayInterval) {
        // 자동재생 중지
        clearInterval(autoPlayInterval);
        autoPlayInterval = null;
        setPixelText(autoButton, '자동', { fontPx: 11, scale: 2, color: '#FFFFFF', outline: 'rgba(0,0,0,0.35)', shadow: 'rgba(0,0,0,0)', inline: true });
        autoButton.style.background = 'linear-gradient(135deg, #4ECDC4, #7FDDDD)';
    } else {
        // 자동재생 시작
        autoPlayInterval = setInterval(() => {
            if (isDialogueActive) {
                const onComplete = window.currentDialogueComplete;
                nextDialogue(onComplete);
            }
        }, 2500); // 2.5초마다 자동 진행
        
        setPixelText(autoButton, '정지', { fontPx: 11, scale: 2, color: '#FFFFFF', outline: 'rgba(0,0,0,0.35)', shadow: 'rgba(0,0,0,0)', inline: true });
        autoButton.style.background = 'linear-gradient(135deg, #FF6B6B, #FF8E8E)';
    }
}

// 대화 종료
function endDialogue(onComplete) {
    isDialogueActive = false;
    gameState.bossDialogueActive = false;
    
    // 대화 박스 제거
    const dialogueBox = document.getElementById('dialogueBox');
    if (dialogueBox) {
        if (dialogueBox.cleanup) {
            dialogueBox.cleanup();
        }
        dialogueBox.remove();
    }
    
    // 자동재생 정지
    if (autoPlayInterval) {
        clearInterval(autoPlayInterval);
        autoPlayInterval = null;
    }
    
    // 캔버스 참조 정리
    characterFaceCanvas = null;

    // UI 복원
    document.getElementById('ui').style.display = 'block';
    const pauseBtnEl = document.getElementById('pauseBtn');
    if (pauseBtnEl) pauseBtnEl.style.display = 'block';

    // 완료 콜백 실행 (자동재생 경로에서는 전역에 보관된 콜백 사용)
    const callback = onComplete || window.currentDialogueComplete;
    window.currentDialogueComplete = null;
    if (callback) {
        callback();
    }
}

// 전역 함수로 등록 (기존 코드와의 호환성을 위해)
window.showBossMessage = showBossMessage;
window.currentDialogueComplete = null;

// 기존 resumeBossGame 함수 대체
window.resumeBossGame = function() {
    // 이 함수는 새로운 시스템에서는 사용되지 않지만 호환성을 위해 유지
    endDialogue(window.currentDialogueComplete);
};


// 모바일 감지 함수
function isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
           ('ontouchstart' in window) || 
           (navigator.maxTouchPoints > 0);
}

// 디바이스별 점프 파워 계산
function getJumpPower() {
    let basePower;
    if (isMobileDevice()) {
        basePower = -14;
    } else {
        basePower = -18;
    }
    
    // 탈것을 탄 경우 점프력 증가
    if (gameState.selectedVehicle === 'kiwi') {
        basePower *= 1.2;  // 키위를 타면 20% 더 높이 점프
    } else if (gameState.selectedVehicle === 'whitehouse') {
        basePower *= 1.1;  // 화이트하우스를 타면 10% 더 높이 점프
    }
    
    return basePower;
}

// 게임 상태 초기화
let gameState = {
    running: false,
    score: 0,
    stage: 1,
    selectedUnits: [], 
    selectedCharacter: 'jiyul',
    selectedVehicle: 'none',
    distance: 0,
    speed: 4,
    questionActive: false,
    currentEnemy: null,
    backgroundOffset: 0,
    currentQuestion: null,
    isMoving: true,
    cameraX: 0,
    screenShake: 0,
    shakeTimer: 0,
    bossSpawned: false,
    bossDialogueActive: false,
    paused: false
};

// 단어 관리자 초기화
let wordManager;

// 게임 통계
let gameStats = {
    startTime: null,
    correctAnswers: 0,
    totalQuestions: 0,
    combo: 0,          // 연속 정답 콤보
    maxCombo: 0,       // 이번 판 최고 콤보
    wrongWords: []     // 오답 노트: 틀린 단어 목록 (복습 출제에 사용)
};

// 플레이어 캐릭터 초기화
let player = {
    x: 100,
    y: 240,
    worldX: 100,
    width: 16 * PIXEL_SCALE,
    height: 16 * PIXEL_SCALE,
    hp: 100,
    animFrame: 0,
    animTimer: 0,
    smashTimer: 0,
    facing: 1,
    sprite: 'jiyul',
    velocityY: 0,
    velocityX: 0,
    isJumping: false,
    onGround: true,
    runSpeed: 4,
    airJumpsUsed: 0,   // 더블 점프 사용 횟수 (키위 능력)
    hurtTimer: 0       // 피격 깜빡임 타이머
};

// 게임 오브젝트들
let obstacles = [];
let enemies = [];

// 캔버스 크기 조정
function resizeCanvas() {
    const container = document.getElementById('gameContainer');
    const controls = document.getElementById('controls');

    // 오프닝 중에는 controls 높이를 무시 (풀스크린)
    const controlsHeight = (window.isOpeningPlaying || !controls) ? 0 : controls.offsetHeight;

    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight - controlsHeight;

    canvas.width = screenWidth;
    canvas.height = screenHeight;
    
    // 화면 비율에 따른 PIXEL_SCALE 조정
    const aspectRatio = screenWidth / screenHeight;
    
    if (aspectRatio > 1.5) {
        PIXEL_SCALE = Math.floor(screenHeight / 150);
    } else if (aspectRatio > 1) {
        PIXEL_SCALE = Math.floor(screenHeight / 120);
    } else {
        PIXEL_SCALE = Math.floor(screenWidth / 150);
    }
    
    PIXEL_SCALE = Math.max(2, Math.min(4, PIXEL_SCALE));
    
    // 플레이어 크기 업데이트
    if (player) {
        player.width = 16 * PIXEL_SCALE;
        player.height = 16 * PIXEL_SCALE;
    }
    
    // GROUND_Y 위치를 화면 비율에 맞게 조정
    const groundRatio = aspectRatio > 1 ? 0.7 : 0.75;
    GROUND_Y = screenHeight * groundRatio;
    
    // 기존 장애물들의 위치도 새로운 GROUND_Y에 맞게 조정
    if (obstacles && obstacles.length > 0) {
        obstacles.forEach(obstacle => {
            obstacle.y = GROUND_Y - (16 * PIXEL_SCALE);  // 수정된 부분
            obstacle.width = 16 * PIXEL_SCALE;
            obstacle.height = 16 * PIXEL_SCALE;
        });
    }

    // 적들의 크기/위치도 새로운 PIXEL_SCALE·GROUND_Y에 맞게 조정
    // (기존엔 장애물만 갱신되어 화면 회전 후 적 히트박스가 어긋나는 버그가 있었음)
    if (typeof enemies !== 'undefined' && enemies.length > 0) {
        enemies.forEach(enemy => {
            enemy.width = 16 * PIXEL_SCALE;
            enemy.height = 16 * PIXEL_SCALE;
            if (enemy.onGround) {
                enemy.y = GROUND_Y - (16 * PIXEL_SCALE);  // 적의 y는 상단 기준
            }
        });
    }
    
    // 플레이어 위치 재조정
    if (player && gameState && !gameState.questionActive) {
        player.y = GROUND_Y;
        player.velocityY = 0;
        player.onGround = true;
        player.isJumping = false;
        
        console.log(`🔧 화면 크기 조정: GROUND_Y = ${GROUND_Y}, Player Y = ${player.y}`);
    }
}

// 전체화면 상태 추적 변수
let isFullscreenDesired = false;
let isUserExiting = false;

// 전체화면 기능
function toggleFullscreen() {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    
    if (isIOS) {
        showIOSFullscreenGuide();
        return;
    }
    
    if (!document.fullscreenElement && 
        !document.webkitFullscreenElement && 
        !document.mozFullScreenElement && 
        !document.msFullscreenElement) {
        
        // 전체화면 진입
        const elem = document.documentElement;
        
        if (elem.requestFullscreen) {
            elem.requestFullscreen();
        } else if (elem.webkitRequestFullscreen) {
            elem.webkitRequestFullscreen();
        } else if (elem.mozRequestFullScreen) {
            elem.mozRequestFullScreen();
        } else if (elem.msRequestFullscreen) {
            elem.msRequestFullscreen();
        }
        
        if (screen.orientation && screen.orientation.lock) {
            screen.orientation.lock('landscape').catch(() => {});
        }
        
        isFullscreenDesired = true;
        isUserExiting = false;
        setPixelText(document.getElementById('fullscreenBtn'), 'EXIT', { fontPx: 11, scale: 2, color: '#FFFFFF', outline: 'rgba(0,0,0,0.35)', shadow: 'rgba(0,0,0,0)', inline: true });
    } else {
        // 사용자가 명시적으로 전체화면 해제
        isUserExiting = true;
        isFullscreenDesired = false;
        
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        } else if (document.mozCancelFullScreen) {
            document.mozCancelFullScreen();
        } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
        }
        
        setPixelText(document.getElementById('fullscreenBtn'), 'FULL', { fontPx: 11, scale: 2, color: '#FFFFFF', outline: 'rgba(0,0,0,0.35)', shadow: 'rgba(0,0,0,0)', inline: true });
    }
}

// 전체화면 자동 복구 함수
function restoreFullscreen() {
    if (!isFullscreenDesired || isUserExiting) return;
    
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    if (isIOS) return;
    
    // 현재 전체화면이 아니고, 사용자가 원하는 상태라면 다시 전체화면 요청
    if (!document.fullscreenElement && 
        !document.webkitFullscreenElement && 
        !document.mozFullScreenElement && 
        !document.msFullscreenElement) {
        
        const elem = document.documentElement;
        
        // 약간의 지연 후 전체화면 복구 시도
        setTimeout(() => {
            if (elem.requestFullscreen) {
                elem.requestFullscreen().catch(() => {});
            } else if (elem.webkitRequestFullscreen) {
                elem.webkitRequestFullscreen();
            } else if (elem.mozRequestFullScreen) {
                elem.mozRequestFullScreen();
            } else if (elem.msRequestFullscreen) {
                elem.msRequestFullscreen();
            }
        }, 100);
    }
}

// iOS 풀스크린 가이드 표시
function showIOSFullscreenGuide() {
    const guideDiv = document.createElement('div');
    guideDiv.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: linear-gradient(135deg, #FF69B4, #FFB6C1);
        color: white;
        padding: 30px;
        border: 3px solid #FFF;
        border-radius: 20px;
        font-size: 16px;
        z-index: 10000;
        font-family: 'DungGeunMo', 'Jua', sans-serif;
        text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        box-shadow: 0 5px 20px rgba(0,0,0,0.5);
        text-align: center;
        line-height: 1.8;
        max-width: 90vw;
    `;
    
    guideDiv.innerHTML = `
        <div style="font-size: 24px; margin-bottom: 20px;">🎀 아이폰 사용자님께 🎀</div>
        <div style="margin-bottom: 20px;">
            전체화면으로 플레이하시려면:<br><br>
            1. Safari 하단의 <span style="background: rgba(0,0,0,0.3); padding: 2px 8px; border-radius: 10px;">공유 버튼</span>을 누르세요<br>
            2. <span style="background: rgba(0,0,0,0.3); padding: 2px 8px; border-radius: 10px;">"홈 화면에 추가"</span>를 선택하세요<br>
            3. 홈 화면에서 앱처럼 실행하세요!
        </div>
        <button onclick="this.parentElement.remove()" style="
            background: linear-gradient(135deg, #32CD32, #90EE90);
            border: 3px solid #FFF;
            color: white;
            padding: 15px 30px;
            font-size: 18px;
            font-weight: bold;
            cursor: pointer;
            font-family: 'DungGeunMo', 'Jua', sans-serif;
            border-radius: 25px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.3);
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        ">확인</button>
    `;
    
    document.body.appendChild(guideDiv);
    
    setTimeout(() => {
        if (guideDiv.parentElement) {
            guideDiv.remove();
        }
    }, 5000);
}

// iOS 체크 함수
function checkIOSFullscreen() {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    const isStandalone = window.navigator.standalone === true;
    
    if (isIOS && !isStandalone) {
        const fullscreenBtn = document.getElementById('fullscreenBtn');
        if (fullscreenBtn) {
            setPixelText(fullscreenBtn, '🏠 추가', { fontPx: 11, scale: 2, color: '#FFFFFF', outline: 'rgba(0,0,0,0.35)', shadow: 'rgba(0,0,0,0)', inline: true });
        }
    }
}

// 게임 초기화
function initGame() {
    gameState.running = true;
    gameState.paused = false;
    // 점프 버튼이 없어졌으므로 조작법을 잠깐 안내
    setTimeout(() => {
        if (gameState.running && typeof showFloatingText === 'function') {
            showFloatingText(player.x + 60, player.y - 90, '화면을 누르면 점프!', '#FFD700', 18);
        }
    }, 800);
    const pauseOv = document.getElementById('pauseOverlay');
    if (pauseOv) pauseOv.style.display = 'none';
    const pauseB = document.getElementById('pauseBtn');
    if (pauseB) pauseB.style.display = 'block';
    gameState.score = 0;
    gameState.stage = 1;
    gameState.distance = 0;
    gameState.speed = 4;
    gameState.questionActive = false;
    gameState.isMoving = true;
    gameState.cameraX = 0;
	gameState.bossSpawned = false;
	gameState.bossDialogueActive = false;
	gameState.endingTriggered = false;
	
    document.getElementById('questionPanel').style.display = 'none';
    document.getElementById('ui').style.display = 'block';
    document.getElementById('fullscreenBtn').style.display = 'block';

    document.getElementById('questionPanel').style.display = 'none';
    
    player.sprite = gameState.selectedCharacter;
    player.x = 100;
    player.worldX = 100;
    player.y = GROUND_Y;
    player.hp = 100;
    player.velocityY = 0;
    player.velocityX = 0;
    player.onGround = true;
    player.isJumping = false;
    player.airJumpsUsed = 0;
    player.hurtTimer = 0;

    // 게임 통계 초기화
    gameStats.startTime = Date.now();
    gameStats.correctAnswers = 0;
    gameStats.totalQuestions = 0;
    gameStats.combo = 0;
    gameStats.maxCombo = 0;
    gameStats.wrongWords = [];
    
    // 파티클 시스템 초기화
    if (typeof initParticleSystem === 'function') {
        initParticleSystem();
    }
    
    // WordManager 초기화 체크
	if (typeof WordManager !== 'undefined') {
		wordManager = new WordManager();
		console.log('WordManager 초기화 완료!');
	} else {
		console.error('WordManager 클래스를 찾을 수 없습니다!');
	}
    
    generateLevel();
    gameLoop();
    updateUI();
}

// 레벨 생성
function generateLevel() {
    obstacles = [];
    enemies = [];

    // 장애물 생성 - 바닥에 정확히 배치
    const obstacleSpacing = 200 + Math.random() * 150;
    for (let i = 0; i < 12; i++) {
        const types = ['rock', 'spike', 'pipe'];
        const type = types[Math.floor(Math.random() * types.length)];
        
        obstacles.push({
            x: 600 + i * obstacleSpacing,
            y: GROUND_Y - (16 * PIXEL_SCALE),  // 장애물을 바닥 위에 정확히 배치
            width: 16 * PIXEL_SCALE,
            height: 16 * PIXEL_SCALE,
            type: type,
            passed: false
        });
    }

    // 초기 몬스터들 생성
    generateMoreEnemies();
}

// 스테이지별 알파벳 가져오기
function getStageAlphabets(stage) {
    if (stage === 20) {
        // 20스테이지는 모든 알파벳 랜덤
        const allAlphabets = [];
        for (let i = 0; i < 26; i++) {
            allAlphabets.push(String.fromCharCode(65 + i)); // A-Z
        }
        return allAlphabets;
    }
    
    // 1-19스테이지는 순서대로 2개씩
    const startIndex = ((stage - 1) * 2) % 26;
    const alphabet1 = String.fromCharCode(65 + startIndex);
    const alphabet2 = String.fromCharCode(65 + ((startIndex + 1) % 26));
    
    return [alphabet1, alphabet2];
}

// 몬스터 무한 생성
function generateMoreEnemies() {
    const currentMaxX = Math.max(...enemies.map(e => e.x), player.worldX);
    const startX = Math.max(currentMaxX + 300, player.worldX + 800);
    
    // 현재 스테이지의 알파벳 가져오기
    const stageAlphabets = getStageAlphabets(gameState.stage);
    
    for (let i = 0; i < 5; i++) {
        // 복습 스테이지(9+)는 스테이지가 오를수록 몬스터가 빨라진다 (최대 +60%)
        const reviewBoost = gameState.stage > ALL_UNITS.length
            ? Math.min(1.6, 1 + (gameState.stage - ALL_UNITS.length) * 0.06) : 1;
        const baseSpeed = 1.5 * reviewBoost;
        const direction = Math.random() > 0.5 ? 1 : -1;
        
        // 스테이지별 알파벳 몬스터 선택 (스테이지 20은 getStageAlphabets가 전체 알파벳 반환)
        const randomAlphabet = stageAlphabets[Math.floor(Math.random() * stageAlphabets.length)];
        const monsterType = `alphabet${randomAlphabet}`;
        
        const enemyX = startX + i * 400 + Math.random() * 200;
        
        enemies.push({
            x: enemyX,
            y: GROUND_Y - (16 * PIXEL_SCALE),  // 몬스터 발 위치
            width: 16 * PIXEL_SCALE,
            height: 16 * PIXEL_SCALE,
            hp: 1,
            maxHp: 1,
            type: monsterType,
            alive: true,
            animFrame: 0,
            velocityY: 0,
            velocityX: 0,
            isMoving: true,
            walkSpeed: baseSpeed,
            direction: direction,
            isJumping: false,
            onGround: true,
            jumpCooldown: 0,
            patrolStart: enemyX,
            patrolRange: 150
        });
    }
}

// 메인 게임 루프
function gameLoop() {
    if (!gameState.running) return;

    update();
    render();
    requestAnimationFrame(gameLoop);
}

// 게임 업데이트
function update() {
    // 게임이 진행 중일 때만 이동
    if (gameState.isMoving && !gameState.questionActive && !gameState.bossDialogueActive) {
        gameState.distance += gameState.speed;
        gameState.backgroundOffset += gameState.speed * 0.5;
        gameState.cameraX += gameState.speed;
        player.worldX += gameState.speed;
    }

    // 화면 흔들기 효과
    if (gameState.shakeTimer > 0) {
        gameState.shakeTimer--;
        gameState.screenShake = Math.sin(gameState.shakeTimer * 0.5) * (gameState.shakeTimer / 10);
    } else {
        gameState.screenShake = 0;
    }

    updatePlayerPhysics();
    updateEnemyPhysics();
    checkCollisions();
    updateAnimations();
    
    // 파티클 시스템 업데이트
    if (typeof updateParticleSystem === 'function') {
        updateParticleSystem();
    }

    // 화면 밖 적들 제거 (보스는 지나쳐도 제거하지 않음 - 보스전 우회 방지)
    enemies = enemies.filter(enemy =>
        enemy.alive && (enemy.isBoss || enemy.x > gameState.cameraX - 500)
    );
    
    // 화면 밖 장애물들 제거
    obstacles = obstacles.filter(obstacle =>
        obstacle.x > gameState.cameraX - 200
    );

    // 앞쪽 적들이 부족하면 더 생성
    const aheadEnemies = enemies.filter(enemy => 
        enemy.x > player.worldX && enemy.x < player.worldX + 2000
    );
    
    if (aheadEnemies.length < 3) {
        generateMoreEnemies();
    }
    
    // 앞쪽 장애물들이 부족하면 추가 생성
    const aheadObstacles = obstacles.filter(obstacle =>
        obstacle.x > player.worldX && obstacle.x < player.worldX + 1500
    );
    
    if (aheadObstacles.length < 3) {
        generateMoreObstacles();
    }
    
    // 20스테이지 엔딩 직전에 보스 등장 (한 번만)
    if (gameState.stage === 20 && !gameState.bossSpawned && 
		gameState.distance > (gameState.stage * 3000) - 1000) {
		
		const bossX = player.worldX + 600;
		enemies.push({
			x: bossX,
			y: GROUND_Y - (16 * PIXEL_SCALE),
			width: 16 * PIXEL_SCALE,
			height: 16 * PIXEL_SCALE,
			hp: 5,
			maxHp: 5,
			type: 'boss',
			alive: true,
			animFrame: 0,
			velocityY: 0,
			velocityX: 0,
			isJumping: false,
			onGround: true,
			jumpCooldown: 0,
			isMoving: true,
			walkSpeed: 2.5, // 보스 기본 속도 고정
			direction: -1,
			patrolStart: bossX,
			patrolRange: 200,
			aggroRange: 500,
			isAggro: false,
			isBoss: true
		});
		
		gameState.bossSpawned = true;
		console.log('🐉 보스 등장! 엔딩 직전 최종 보스전!');
	}

    // 스테이지 진행 체크 - 거리 기준 개선
    const stageDistance = gameState.stage * 3000; // 2000 대신 3000으로 변경
	if (gameState.distance > stageDistance) {
		if (gameState.stage >= 20) {
			// 대화/전투 중에는 엔딩 판정을 하지 않음
			if (gameState.questionActive || gameState.bossDialogueActive) {
				return;
			}
			// 보스가 살아있으면 엔딩 대신 보스전을 강제 (점프로 지나쳐도 우회 불가)
			const liveBoss = enemies.find(e => e.isBoss && e.alive);
			if (liveBoss) {
				if (liveBoss.x < player.worldX - 100) {
					// 보스를 지나쳤다면 플레이어 앞으로 재배치
					liveBoss.x = player.worldX + 600;
					liveBoss.patrolStart = liveBoss.x;
					liveBoss.isAggro = true;
				}
				return;
			}
			// 보스가 스폰됐고 처치된 경우에만 엔딩 (defeat 대화 콜백이 우선이지만 안전망)
			if (gameState.bossSpawned) {
				triggerEnding();
			}
			return;
		}
		nextStage();
	}
}

// 엔딩 진입 단일 창구: 클리어 기록을 저장한 뒤 엔딩 표시 (중복 실행 방지)
function triggerEnding() {
    if (gameState.endingTriggered) return;
    gameState.endingTriggered = true;

    // 클리어 기록 저장 (기존에는 엔딩 경로에서 기록이 저장되지 않는 버그가 있었음)
    saveGameRecord();

    if (typeof showEnding === 'function') {
        showEnding();
    } else {
        alert('🎉 축하합니다! 모든 스테이지를 클리어했어요! 🎉');
        showMenu();
    }
}

// 플레이어 물리 업데이트
function updatePlayerPhysics() {
    // 중력 적용 (공중에 있을 때만)
    // 자연스러운 점프 아크: 꼭짓점 부근에선 살짝 머물고, 내려올 땐 빠르게
    if (!player.onGround) {
        let g;
        if (Math.abs(player.velocityY) < 2.5) {
            g = APEX_GRAVITY;            // 꼭짓점 체공감
        } else if (player.velocityY > 0) {
            g = FALL_GRAVITY;            // 하강 가속
        } else {
            g = GRAVITY;                 // 상승
        }
        player.velocityY += g;
        if (player.velocityY > MAX_FALL_SPEED) {
            player.velocityY = MAX_FALL_SPEED;
        }
    }

    // 점프 입력 버퍼 감소
    if (player.jumpBufferTimer > 0) {
        player.jumpBufferTimer--;
    }

    // Y축 위치 업데이트
    player.y += player.velocityY;
    
    // X축 이동 처리
    if (player.velocityX !== 0) {
        player.worldX += player.velocityX;
        const friction = player.isJumping ? 0.98 : 0.92;
        player.velocityX *= friction;
        if (Math.abs(player.velocityX) < 0.1) {
            player.velocityX = 0;
        }
    }
    
    // 바닥 충돌 검사 및 위치 고정
    if (player.y >= GROUND_Y) {
        player.y = GROUND_Y;  // 바닥에 정확히 고정
        player.velocityY = 0;
        player.onGround = true;
        player.isJumping = false;
        player.airJumpsUsed = 0;  // 착지 시 더블 점프 횟수 초기화 (키위 능력)

        // 착지 직전에 눌러둔 점프 입력이 있으면 바로 이어서 점프 (버퍼링)
        if (player.jumpBufferTimer > 0) {
            player.jumpBufferTimer = 0;
            jump();
        }

        if (player.velocityX > 2 && typeof createParticles === 'function') {
            createParticles(player.x, player.y, 'hint');
        }
    }
    
    // 화면상 플레이어 위치는 고정, 월드 좌표만 변경
    const targetScreenX = canvas.width / 4;
    player.x = targetScreenX;
    gameState.cameraX = player.worldX - targetScreenX;
}

// 몬스터 물리 처리
function updateEnemyPhysics() {
    enemies.forEach(enemy => {
        if (!enemy.alive) return;
        
        const enemyScreenX = enemy.x - gameState.cameraX;
        
        // 화면 범위에 있는 적들만 물리 처리
        if (enemyScreenX > -200 && enemyScreenX < canvas.width + 200) {
            // 보스 AI 처리
            if (enemy.type === 'boss') {
                const distanceToPlayer = Math.abs(enemy.x - player.worldX);
                
                if (distanceToPlayer < enemy.aggroRange) {
                    enemy.isAggro = true;
                    if (enemy.x > player.worldX) {
                        enemy.direction = -1;
                    } else {
                        enemy.direction = 1;
                    }
                    enemy.walkSpeed = 3; // 보스 추격 속도 고정
                } else {
                    enemy.isAggro = false;
                    enemy.walkSpeed = 2; // 보스 일반 속도 고정
                }
            }
            
            // 이동 처리
            if (enemy.isMoving && !gameState.questionActive && !gameState.bossDialogueActive) {
                enemy.x += enemy.walkSpeed * enemy.direction;
                
                // 순찰 범위 체크
                if (enemy.patrolStart && enemy.patrolRange) {
                    if (enemy.x <= enemy.patrolStart - enemy.patrolRange || 
                        enemy.x >= enemy.patrolStart + enemy.patrolRange) {
                        enemy.direction *= -1;
                    }
                }
                
                // 랜덤 점프
                if (Math.random() < 0.005 && enemy.onGround && enemy.jumpCooldown <= 0) {
                    enemy.velocityY = JUMP_POWER * 0.7;
                    enemy.isJumping = true;
                    enemy.onGround = false;
                    enemy.jumpCooldown = 90 + Math.random() * 60;
                }
            }
        }
        
        // 점프 쿨다운 감소
        if (enemy.jumpCooldown > 0) {
            enemy.jumpCooldown--;
        }
        
        // 중력 및 점프 물리 처리
        if (!enemy.onGround) {
            enemy.velocityY += GRAVITY;
            enemy.y += enemy.velocityY;
            
            // 바닥 충돌 검사 및 위치 고정
            const groundLevel = GROUND_Y - (16 * PIXEL_SCALE);  // 수정: 올바른 바닥 레벨
            if (enemy.y >= groundLevel) {
                enemy.y = groundLevel;  // 수정된 바닥 위치로 고정
                enemy.velocityY = 0;
                enemy.onGround = true;
                enemy.isJumping = false;
            }
        } else {
            // 이미 바닥에 있는 경우에도 위치 재확인
            enemy.y = GROUND_Y - (16 * PIXEL_SCALE);  // 수정: 올바른 바닥 위치로 강제 고정
        }
    });
}

// 장애물 지속적 생성 함수 추가
function generateMoreObstacles() {
    // 가장 마지막 장애물의 위치 찾기
    const currentMaxObstacleX = obstacles.length > 0 ? 
        Math.max(...obstacles.map(o => o.x)) : 
        player.worldX;
    
    const startX = Math.max(currentMaxObstacleX + 300, player.worldX + 600);
    
    // 새로운 장애물들 생성
    const obstacleSpacing = 200 + Math.random() * 150;
    for (let i = 0; i < 5; i++) {
        const types = ['rock', 'spike', 'pipe'];
        const type = types[Math.floor(Math.random() * types.length)];
        
        obstacles.push({
            x: startX + i * obstacleSpacing,
            y: GROUND_Y - (16 * PIXEL_SCALE),  // 수정된 부분
            width: 16 * PIXEL_SCALE,
            height: 16 * PIXEL_SCALE,
            type: type,
            passed: false
        });
    }
}

// 충돌 체크
function checkCollisions() {
    // 장애물 충돌 체크
    obstacles.forEach(obstacle => {
        const obstacleScreenX = obstacle.x - gameState.cameraX;
        
        if (obstacleScreenX > -100 && obstacleScreenX < canvas.width + 100) {
            // 플레이어의 실제 충돌 영역 계산
            const playerCollisionBox = {
                x: player.worldX,
                y: player.y - player.height,  // 플레이어 발 위치에서 머리까지
                width: player.width,
                height: player.height
            };
            
            if (checkBoxCollision(playerCollisionBox, obstacle)) {
                if (obstacle.type === 'spike' && !obstacle.passed) {
                    obstacle.passed = true;
                    if (typeof createParticles === 'function') {
                        createParticles(player.x, player.y, 'hint');
                    }
                    gameState.score += 5;
                    updateUI();
                }
                else if (obstacle.type !== 'spike' && player.onGround) {
                    // 충돌 시 플레이어를 장애물 앞에 정지
                    player.worldX = obstacle.x - player.width - 5;
                    player.velocityX = 0;
                    gameState.isMoving = false;
                    gameState.shakeTimer = 10;
                    
                    if (Math.random() < 0.01 && typeof createParticles === 'function') {
                        createParticles(player.x, player.y - 30, 'hint');
                    }
                }
            } else {
                // 장애물을 통과했을 때
                if (player.worldX > obstacle.x + obstacle.width && !obstacle.passed) {
                    obstacle.passed = true;
                    gameState.isMoving = true;
                    gameState.score += 10;
                    if (typeof createParticles === 'function') {
                        createParticles(player.x, player.y - 20, 'hint');
                    }
                    updateUI();
                }
            }
        }
    });
    
    // 적 충돌 체크
    enemies.forEach(enemy => {
        if (!enemy.alive) return;
        
        const enemyScreenX = enemy.x - gameState.cameraX;
        
        if (enemyScreenX > -100 && enemyScreenX < canvas.width + 100) {
            const collisionRange = enemy.isBoss ? 100 : 0;
            
            // 몬스터 충돌 박스 - Y 좌표 기준 통일
            const enemyCollisionBox = {
                x: enemy.x - collisionRange,
                y: enemy.y - collisionRange,  // enemy.y는 이미 올바른 위치
                width: enemy.width + collisionRange * 2,
                height: enemy.height + collisionRange * 2
            };
            
            // 플레이어 충돌 박스 - 발 기준에서 머리까지
            const playerCollisionBox = {
                x: player.worldX,
                y: player.y - player.height,  // 발 위치에서 머리까지
                width: player.width,
                height: player.height
            };
            
            if (checkBoxCollision(playerCollisionBox, enemyCollisionBox)) {
                if (!gameState.questionActive && !gameState.bossDialogueActive) {
                    // 스테이지 20 보스와의 첫 만남 - 간단한 대화
                    if (enemy.isBoss && gameState.stage === 20 && !enemy.dialogueShown) {
                        enemy.dialogueShown = true;
                        gameState.isMoving = false;
                        player.velocityX = 0;
                        player.velocityY = 0;
                        
                        showBossMessage('intro', function() {
                            // 대화 완료 후 전투 시작
                            gameState.questionActive = true;
                            gameState.currentEnemy = enemy;
                            
                            generateEnglishQuestion();
                            updateQuestionPanel();
                            document.getElementById('questionPanel').style.display = 'block';
                        });
                        return;
                    }
                    
                    // 일반 전투 시작
                    gameState.questionActive = true;
                    gameState.currentEnemy = enemy;
                    gameState.isMoving = false;
                    
                    // 보스전에서는 플레이어 움직임 완전 정지
                    if (enemy.isBoss) {
                        player.velocityX = 0;
                        player.velocityY = 0;
                    }
                    
                    generateEnglishQuestion();
                    updateQuestionPanel();
                    document.getElementById('questionPanel').style.display = 'block';
                }
            }
        }
    });
}

// 박스 충돌 체크
function checkBoxCollision(box1, box2) {
    return box1.x < box2.x + box2.width &&
           box1.x + box1.width > box2.x &&
           box1.y < box2.y + box2.height &&
           box1.y + box1.height > box2.y;
}

// 3색 도트 섬광 (흰 코어 → 노랑 → 주황) — 라켓 타격 이펙트
function drawMuzzleFlash(x, y, s, flip) {
    const d = flip ? -1 : 1;
    const dots = [
        [0, 0, '#FFFFFF'], [1, 0, '#FFFFFF'], [0, 1, '#FFFFFF'], [1, 1, '#FFFFFF'],
        [-1, 0, '#FFD84A'], [2, 0, '#FFD84A'], [0, -1, '#FFD84A'], [1, -1, '#FFD84A'],
        [0, 2, '#FFD84A'], [1, 2, '#FFD84A'],
        [-2, 0, '#FF7A1A'], [3, 0, '#FF7A1A'], [0, -2, '#FF7A1A'],
        [1, 3, '#FF7A1A'], [3, 1, '#FF7A1A'], [-1, -1, '#FF7A1A'], [2, 2, '#FF7A1A'],
    ];
    dots.forEach(([dx, dy, col]) => {
        ctx.fillStyle = col;
        ctx.fillRect(Math.round(x + dx * s * d), Math.round(y + dy * s), Math.ceil(s), Math.ceil(s));
    });
}

// 애니메이션 업데이트
function updateAnimations() {
    player.animTimer++;
    if (player.animTimer >= 10) {
        player.animFrame = (player.animFrame + 1) % 4;
        player.animTimer = 0;
    }
    if (player.smashTimer > 0) player.smashTimer--;
    // 이동 방향에 따라 좌우 반전
    if (player.velocityX > 0.5) player.facing = 1;
    else if (player.velocityX < -0.5) player.facing = -1;
    
    enemies.forEach(enemy => {
        if (enemy.alive) {
            // 플레이어와 동일하게 타이머 게이팅 (기존엔 매 프레임 토글되어 60fps로 깜빡임)
            enemy.animTimer = (enemy.animTimer || 0) + 1;
            if (enemy.animTimer >= 20) {
                enemy.animFrame = (enemy.animFrame + 1) % 2;
                enemy.animTimer = 0;
            }
        }
    });
}

// UI 업데이트
// 오락실 HUD용 도트 하트 (7x6)
const HUD_HEART = [
    '.HH.HH.',
    'HHHHHHH',
    'HHHHHHH',
    '.HHHHH.',
    '..HHH..',
    '...H...'
];

// 체력을 하트 5개(하트당 20)로 표현, 반쪽 하트 지원
function renderHudHearts(el) {
    if (!el) return;
    const hearts = 5, S = 3, gap = 5;
    const w = 7 * S, h = 6 * S;
    const hp = Math.max(0, player.hp);
    const cv = document.createElement('canvas');
    cv.width = hearts * w + (hearts - 1) * gap;
    cv.height = h;
    const c = cv.getContext('2d');
    for (let i = 0; i < hearts; i++) {
        const frac = Math.max(0, Math.min(1, (hp - i * 20) / 20));
        const mode = frac >= 0.75 ? 'full' : (frac >= 0.25 ? 'half' : 'empty');
        const ox = i * (w + gap);
        HUD_HEART.forEach((row, y) => {
            for (let x = 0; x < row.length; x++) {
                if (row[x] !== 'H') continue;
                let col = 'rgba(255,255,255,0.22)';           // 빈 하트
                if (mode === 'full') col = '#FF3355';
                else if (mode === 'half' && x <= 3) col = '#FF3355';
                c.fillStyle = col;
                c.fillRect(ox + x * S, y * S, S, S);
            }
        });
        if (mode !== 'empty') {                                // 하이라이트 점
            c.fillStyle = '#FFB3C1';
            c.fillRect(ox + S, S, S, S);
        }
    }
    cv.style.imageRendering = 'pixelated';
    cv.style.height = '18px';
    cv.style.width = 'auto';
    el.innerHTML = '';
    el.appendChild(cv);
}

function updateUI() {
    // 오락실 상태바: UNIT(하늘색) / STAGE(골드) / SCORE(흰색, 6자리) / 하트 체력
    const stage = gameState.stage;
    const unitLabel = (typeof BOSS_STAGE !== 'undefined' && stage >= BOSS_STAGE) ? 'BOSS'
        : (stage > ALL_UNITS.length ? '복습' : `UNIT ${stage}`);
    const base = { fontPx: 12, scale: 2, outline: '#100C08', shadow: 'rgba(0,0,0,0)', inline: true };
    setPixelText(document.getElementById('uiUnit'), unitLabel, { ...base, color: '#3DDCFF' });
    setPixelText(document.getElementById('uiStage'), `STAGE ${stage}`, { ...base, color: '#FFD700' });
    setPixelText(document.getElementById('uiScore'), `SCORE ${String(Math.max(0, gameState.score)).padStart(6, '0')}`, { ...base, color: '#FFFFFF' });
    renderHudHearts(document.getElementById('uiHp'));
}

// 렌더링
function render() {
    ctx.save();
    if (gameState.screenShake !== 0) {
        ctx.translate(
            Math.random() * gameState.screenShake - gameState.screenShake / 2,
            Math.random() * gameState.screenShake - gameState.screenShake / 2
        );
    }

    ctx.fillStyle = '#5C94FC';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 배경 그리기 (background.js에서)
    if (typeof drawBackground === 'function') {
        drawBackground();
    }
    
    
    // 장애물 렌더링
    obstacles.forEach(obstacle => {
        const screenX = obstacle.x - gameState.cameraX;
        if (screenX > -100 && screenX < canvas.width + 100) {
            if (typeof pixelData !== 'undefined' && pixelData[obstacle.type]) {
                const data = pixelData[obstacle.type];
                drawPixelSprite(data.sprite, data.colorMap, screenX, obstacle.y);
            }
            
            // 충돌 힌트 표시
            if (!gameState.isMoving && Math.abs(player.worldX - obstacle.x) < 100) {
                ctx.fillStyle = 'rgba(255, 255, 0, 0.5)';
                ctx.fillRect(screenX, obstacle.y - 10, obstacle.width, 5);
            }
        }
    });
    
    // 적 렌더링
	enemies.forEach(enemy => {
		if (!enemy.alive) return;
		const screenX = enemy.x - gameState.cameraX;
		if (screenX > -100 && screenX < canvas.width + 100) {
			let drawY = enemy.y;
			if (enemy.type === 'boss') {
				// 보스는 천천히 숨쉬는 듯한 부유 연출
				drawY += Math.sin(Date.now() * 0.004) * PIXEL_SCALE;
			}

			// 보스 렌더링 (48x48, 몬스터보다 1.5배 크게)
			if (enemy.type === 'boss') {
				if (typeof alphabetMonsters !== 'undefined' && alphabetMonsters.boss) {
					const data = alphabetMonsters.boss;
					// 숨쉬기 2프레임 전환
					const frame = (Math.floor(Date.now() / 400) % 2 === 0 || !data.idle2) ? data.idle : data.idle2;
					const bossW = 24 * PIXEL_SCALE;
					drawSpriteAnchored(frame, data.colorMap, screenX - 4 * PIXEL_SCALE, drawY + enemy.height, bossW);
				}
			} else {
				// 알파벳 몬스터 렌더링 (32x32, 걷기 스쿼시 2프레임)
				if (typeof alphabetMonsters !== 'undefined' && alphabetMonsters[enemy.type]) {
					const data = alphabetMonsters[enemy.type];
					const frame = (enemy.animFrame === 1 && data.walk) ? data.walk : data.idle;
					drawSpriteAnchored(frame, data.colorMap, screenX, drawY + enemy.height, enemy.width);
				}
			}

			// 피격 플래시: 정답으로 타격 시 하얗게 번쩍
			if (enemy.hitTimer > 0) {
				enemy.hitTimer--;
				ctx.fillStyle = `rgba(255, 255, 255, ${0.06 * enemy.hitTimer})`;
				ctx.fillRect(screenX, drawY, enemy.width, enemy.height);
			}
			
			// 보스 어그로 표시
			if (enemy.isBoss && enemy.isAggro) {
				ctx.fillStyle = 'red';
				ctx.fillRect(screenX, enemy.y - 15, enemy.width, 3);
				
				// 보스 체력바
				ctx.fillStyle = 'rgba(0,0,0,0.5)';
				ctx.fillRect(screenX - 10, enemy.y - 25, enemy.width + 20, 8);
				ctx.fillStyle = '#FF0000';
				const healthPercent = enemy.hp / enemy.maxHp;
				ctx.fillRect(screenX - 8, enemy.y - 23, (enemy.width + 16) * healthPercent, 4);
			}
		}
	});
    
    // 피격 깜빡임: 오답으로 데미지를 입으면 잠시 깜빡여 시각적 피드백 제공
    let skipPlayerDraw = false;
    if (player.hurtTimer > 0) {
        player.hurtTimer--;
        skipPlayerDraw = (player.hurtTimer % 6) < 3;
    }

    // 플레이어 렌더링
    if (!skipPlayerDraw && typeof pixelData !== 'undefined' && pixelData[player.sprite]) {
        const moving = gameState.isMoving && !gameState.questionActive;

        // 크림이가 탈것을 타고 있는 경우
        if (player.sprite === 'jiyul' && gameState.selectedVehicle !== 'none') {
            if (gameState.selectedVehicle === 'kiwi' && pixelData.kiwi) {
                // 키위 (발밑 = player.y)
                const kiwiData = pixelData.kiwi;
                const kiwiSprite = pickSpriteFrame(kiwiData, player.isJumping, moving, player.animFrame);
                drawSpriteAnchored(kiwiSprite, kiwiData.colorMap, player.x, player.y, player.width);

                // 크림이를 키위(게코) 등 위에 태우기
                const jiyulData = pixelData.jiyul;
                drawSpriteAnchored((player.smashTimer > 0 && jiyulData.smashing) ? jiyulData.smashing : jiyulData.idle, jiyulData.colorMap, player.x, player.y - 5 * PIXEL_SCALE, player.width);

            } else if (gameState.selectedVehicle === 'whitehouse' && pixelData.whitehouse) {
                // 화이트하우스 (발밑 = player.y)
                const whData = pixelData.whitehouse;
                const whSprite = pickSpriteFrame(whData, player.isJumping, moving, player.animFrame);
                drawSpriteAnchored(whSprite, whData.colorMap, player.x, player.y, player.width);

                // 크림이를 지붕 위에 세우기
                const jiyulData = pixelData.jiyul;
                drawSpriteAnchored((player.smashTimer > 0 && jiyulData.smashing) ? jiyulData.smashing : jiyulData.idle, jiyulData.colorMap, player.x, player.y - 13 * PIXEL_SCALE, player.width);
            }
        } else {
            // 일반적인 캐릭터 그리기
            const playerData = pixelData[player.sprite];
            let sprite = pickSpriteFrame(playerData, player.isJumping, moving, player.animFrame);
            // 라켓 스매싱 (정답 시)
            if (player.smashTimer > 0 && playerData.smashing) {
                sprite = playerData.smashing;
            }
            const flip = player.facing === -1;
            drawSpriteAnchored(sprite, playerData.colorMap, player.x, player.y, player.width, flip);

            // 머즐 플래시: 스매싱 첫 8프레임 동안 라켓 앞에 3색 도트 섬광
            if (player.smashTimer > 12 && playerData.flashAnchor) {
                const s = player.width / sprite[0].length;
                const ax = flip ? -playerData.flashAnchor.x * s + player.width : playerData.flashAnchor.x * s;
                drawMuzzleFlash(
                    player.x + ax,
                    player.y - sprite.length * s + playerData.flashAnchor.y * s,
                    s, flip);
            }
        }
    }
    
    // 파티클 렌더링 (particles.js에서)
    if (typeof renderAllParticles === 'function') {
        renderAllParticles(ctx);
    }
    
    // 게임 상태 메시지 (도트 텍스트를 한 번만 구워 재사용)
    if (!gameState.isMoving && !gameState.questionActive) {
        if (!window._guideBaked && typeof createPixelTextCanvas === 'function') {
            window._guideBaked = createPixelTextCanvas('점프로 장애물을 뛰어넘으세요!', {
                fontPx: 12, scale: 2, color: '#FFE94A', outline: '#000000', shadow: 'rgba(0,0,0,0)'
            });
        }
        if (window._guideBaked) {
            ctx.imageSmoothingEnabled = false;
            ctx.drawImage(window._guideBaked,
                (canvas.width - window._guideBaked.width * 2) / 2, 72,
                window._guideBaked.width * 2, window._guideBaked.height * 2);
        }
    }
    
    ctx.restore();
}

// 영어 문제 생성
function generateEnglishQuestion() {
    if (!wordManager || gameState.selectedUnits.length === 0) {
        console.error('WordManager가 초기화되지 않았거나 선택된 Unit이 없습니다.');
        gameState.currentQuestion = null;
        endBattleGracefully();
        return;
    }

    // 오답 노트 복습 출제: 평소 30%, 복습 스테이지(9+) 50%, 보스전은 70%로 총정리
    const isBossBattle = !!(gameState.currentEnemy && gameState.currentEnemy.isBoss);
    const reviewChance = isBossBattle ? 0.7
        : (gameState.stage > ALL_UNITS.length ? 0.5 : 0.3);
    if (gameStats.wrongWords.length > 0 && Math.random() < reviewChance &&
        typeof wordManager.generateMultipleChoiceFor === 'function') {
        const reviewWord = gameStats.wrongWords[Math.floor(Math.random() * gameStats.wrongWords.length)];
        gameState.currentQuestion = wordManager.generateMultipleChoiceFor(reviewWord, gameState.selectedUnits);
        if (gameState.currentQuestion) {
            gameState.currentQuestion.isReview = true;
        }
    } else {
        // 일반전/보스전 모두 사용자가 선택한 모든 Unit에서 출제
        gameState.currentQuestion = wordManager.generateMultipleChoice(gameState.selectedUnits);
    }

    // 문제 생성 실패 시(단어 부족 등) 전투를 안전하게 종료해 소프트락 방지
    if (!gameState.currentQuestion) {
        console.error('문제를 생성하지 못했습니다. 전투를 종료합니다.');
        endBattleGracefully();
    }
}

// 문제를 만들 수 없을 때 전투 상태를 안전하게 해제
function endBattleGracefully() {
    // 같은 적과 즉시 재충돌해 무한 반복되지 않도록 해당 적 제거
    if (gameState.currentEnemy) {
        const index = enemies.indexOf(gameState.currentEnemy);
        if (index !== -1) enemies.splice(index, 1);
    }
    gameState.questionActive = false;
    gameState.currentEnemy = null;
    gameState.isMoving = true;
    const panel = document.getElementById('questionPanel');
    if (panel) panel.style.display = 'none';
}

// 문제 패널 업데이트
function updateQuestionPanel() {
    if (!gameState.questionActive || !gameState.currentQuestion) return;

    // 영어 단어 표시 (+ 복습 문제 표시, 품사 힌트)
    const q = gameState.currentQuestion;
    const posNames = { '동': '동사', '명': '명사', '형': '형용사', '부': '부사',
                       '전': '전치사', '대': '대명사', '감': '감탄사', '접': '접속사', '수': '수사' };
    let posHint = '';
    if (q.wordInfo && q.wordInfo.pos) {
        posHint = q.wordInfo.pos.split('').map(c => posNames[c] || c).join('·');
    }
    const badge = q.isReview ? '📝 복습! ' : '✨ ';
    const qEl = document.getElementById('questionText');
    qEl.innerHTML = '';
    qEl.appendChild(createPixelTextCanvas(`${badge}${q.question}`, {
        fontPx: 20, scale: 2, color: '#9932CC', outline: '#FFFFFF', shadow: 'rgba(0,0,0,0.15)'
    }));
    if (posHint) {
        qEl.appendChild(createPixelTextCanvas(`💡 품사 힌트: ${posHint}`, {
            fontPx: 10, scale: 2, color: '#9370DB', outline: 'rgba(255,255,255,0.9)', shadow: 'rgba(0,0,0,0)'
        }));
    }
    qEl.querySelectorAll('canvas').forEach(c => { c.style.maxWidth = '100%'; });
    
    // 적 정보 표시
	if (gameState.currentEnemy) {
		let enemyName;
		if (gameState.currentEnemy.type === 'boss') {
			enemyName = '👑 보스';
		} else if (gameState.currentEnemy.type.startsWith('alphabet')) {
			const letter = gameState.currentEnemy.type.replace('alphabet', '');
			enemyName = `🔤 ${letter} 몬스터`;
		} else {
			enemyName = '👹 몬스터';
		}
		
		setPixelText(document.getElementById('enemyInfo'),
			`${enemyName} 체력: ${gameState.currentEnemy.hp}/${gameState.currentEnemy.maxHp}`,
			{ fontPx: 10, scale: 2, color: '#9370DB', outline: 'rgba(255,255,255,0.9)', shadow: 'rgba(0,0,0,0)', inline: true });
	}
    
    // 4지선다 버튼 생성
    updateChoiceButtons();
}

// 4지선다 버튼 업데이트
function updateChoiceButtons() {
    const choicesContainer = document.getElementById('choicesContainer');
    if (!choicesContainer || !gameState.currentQuestion) return;
    
    choicesContainer.innerHTML = '';

    // 실수 방지: 답을 고른 뒤 '정답 제출!'을 눌러야 확정된다
    gameState.pendingChoice = null;
    const submitBtn = document.getElementById('submitAnswerBtn');
    if (submitBtn) submitBtn.disabled = true;

    gameState.currentQuestion.choices.forEach((choice, index) => {
        const button = document.createElement('button');
        button.className = 'choice-btn';
        setPixelText(button, `(${index + 1}) ${choice}`, {
            fontPx: 11, scale: 2, color: '#9932CC',
            outline: 'rgba(255,255,255,0.85)', shadow: 'rgba(0,0,0,0)', wrapPx: 150
        });
        button.setAttribute('data-choice', index);
        button.onclick = () => chooseAnswer(index);
        choicesContainer.appendChild(button);
    });
}

// 선택지 선택
// 답 고르기 (강조만, 아직 제출 아님)
function chooseAnswer(index) {
    if (!gameState.currentQuestion) return;
    gameState.pendingChoice = index;
    document.querySelectorAll('.choice-btn').forEach(b => {
        b.classList.toggle('chosen', parseInt(b.getAttribute('data-choice'), 10) === index);
    });
    const submitBtn = document.getElementById('submitAnswerBtn');
    if (submitBtn) submitBtn.disabled = false;
    playSound('jump');
}

// 고른 답 제출 (여기서 정답 판정)
function submitAnswer() {
    if (gameState.pendingChoice === null || gameState.pendingChoice === undefined) return;
    if (!gameState.currentQuestion) return;
    const idx = gameState.pendingChoice;
    gameState.pendingChoice = null;
    const submitBtn = document.getElementById('submitAnswerBtn');
    if (submitBtn) submitBtn.disabled = true;
    selectChoice(idx);
}

function selectChoice(choiceIndex) {
    if (!gameState.currentQuestion) return;
    
    gameStats.totalQuestions++;
    
    if (choiceIndex === gameState.currentQuestion.correctIndex) {
        // 정답! 크림이의 라켓 스매싱 발동
        player.smashTimer = 20;
        gameStats.combo++;
        gameStats.maxCombo = Math.max(gameStats.maxCombo, gameStats.combo);
        const comboBonus = Math.min(gameStats.combo - 1, 5) * 5;
        gameState.score += 20 + comboBonus;
        gameStats.correctAnswers++;
        playSound('correct');

        // 콤보 연출
        if (gameStats.combo >= 2 && typeof showFloatingText === 'function') {
            showFloatingText(player.x + 40, player.y - 60, `🔥 콤보 x${gameStats.combo}! +${20 + comboBonus}점`, '#FF8C00', 18);
        }

        // 복습 문제를 맞히면 오답 노트에서 제거 (완전히 익힌 것으로 간주)
        if (gameState.currentQuestion.isReview) {
            const eng = gameState.currentQuestion.wordInfo.english;
            gameStats.wrongWords = gameStats.wrongWords.filter(w => w.english !== eng);
            if (typeof showFloatingText === 'function') {
                showFloatingText(player.x, player.y - 80, '📝 복습 성공! 오답 노트에서 지웠어요', '#32CD32', 14);
            }
        }

        if (gameState.currentEnemy) {
            gameState.currentEnemy.hp -= 1;
            gameState.currentEnemy.hitTimer = 12;  // 피격 플래시 연출
            const enemyScreenX = gameState.currentEnemy.x - gameState.cameraX;
            if (typeof createParticles === 'function') {
                createParticles(enemyScreenX, gameState.currentEnemy.y, 'hit');
            }
            
            if (gameState.currentEnemy.hp <= 0) {
                gameState.currentEnemy.alive = false;
                gameState.score += gameState.currentEnemy.type === 'boss' ? 100 : 50;
                playSound('defeat');
                if (typeof createParticles === 'function') {
                    createParticles(enemyScreenX, gameState.currentEnemy.y, 'defeat');
                }
                
                // 보스 처치 시 엔딩 대화
                if (gameState.currentEnemy.type === 'boss') {
                    document.getElementById('questionPanel').style.display = 'none';
                    gameState.questionActive = false;
                    
                    showBossMessage('defeat', function() {
                        // 엔딩으로 이동 (기록 저장 포함)
                        triggerEnding();
                    });
                    return;
                }
                
                gameState.isMoving = true;
                document.getElementById('questionPanel').style.display = 'none';
                gameState.questionActive = false;
                gameState.currentEnemy = null;
                
                if (typeof showFloatingText === 'function') {
                    showFloatingText(player.x, player.y - 50, '완료!', '#00FF00');
                }
            } else {
				// 보스전 중간대사 (체력이 절반이 될 때)
				if (gameState.currentEnemy.type === 'boss' && gameState.currentEnemy.hp === 3) {
					document.getElementById('questionPanel').style.display = 'none';
					gameState.isMoving = false;
					
					showBossMessage('mid', function() {
						// 중간대사 완료 후 전투 재개
						gameState.questionActive = true;
						
						generateEnglishQuestion();
						updateQuestionPanel();
						document.getElementById('questionPanel').style.display = 'block';
					});
				} else {
					generateEnglishQuestion();
					updateQuestionPanel();
					if (typeof showFloatingText === 'function') {
						showFloatingText(player.x, player.y - 30, '맞았어요!', '#FFD700');
					}
				}
			}
        }
    } else {
        // 오답 - 콤보 초기화, 오답 노트에 기록
        gameStats.combo = 0;
        playSound('wrong');

        const wrongInfo = gameState.currentQuestion.wordInfo;
        if (wrongInfo && !gameStats.wrongWords.some(w => w.english === wrongInfo.english)) {
            gameStats.wrongWords.push(wrongInfo);
        }

        // 화이트하우스와 함께라면 튼튼한 텐트가 데미지를 줄여줌 (15 → 10)
        const damage = hasWhitehousePower() ? 10 : 15;
        player.hp -= damage;
        player.hurtTimer = 30;  // 피격 깜빡임 연출
        gameState.shakeTimer = 12;  // 화면 흔들림

        if (typeof createParticles === 'function') {
            createParticles(player.x, player.y, 'hurt');
        }
        const correctAnswer = gameState.currentQuestion.choices[gameState.currentQuestion.correctIndex];
        if (typeof showFloatingText === 'function') {
            showFloatingText(player.x, player.y - 30, `틀렸어요! 정답: ${correctAnswer}`, '#FF0000');
            if (hasWhitehousePower()) {
                showFloatingText(player.x, player.y - 55, '🏕️ 화이트하우스가 지켜줬어요!', '#87CEEB', 13);
            }
        }
        
        if (player.hp <= 0) {
            gameOver();
            return;
        }
        
        setTimeout(() => {
            generateEnglishQuestion();
            updateQuestionPanel();
        }, 1500);
    }
    
    updateUI();
}

// Unit 선택 함수
function toggleUnit(unit) {
    const index = gameState.selectedUnits.indexOf(unit);
    const button = document.querySelector(`[data-unit="${unit}"]`);
    
    if (!button) return;
    
    if (index === -1) {
        gameState.selectedUnits.push(unit);
        button.classList.add('selected');
    } else {
        gameState.selectedUnits.splice(index, 1);
        button.classList.remove('selected');
    }
    
    updateSelectedDisplay();
}

// 선택한 내용 표시 업데이트
function updateSelectedDisplay() {
    const selectedUnitsElement = document.getElementById('selectedUnits');
    const startButton = document.getElementById('startGameBtn');
    if (startButton) startButton.disabled = false;
    if (!selectedUnitsElement) return;
    
    let unitMsg;
    if (gameState.selectedUnits.length > 0) {
        const sortedUnits = gameState.selectedUnits.sort();
        unitMsg = `💕 선택한 Unit: ${sortedUnits.join(', ')}`;
        if (wordManager) {
            const wordCount = wordManager.getWordCountFromSelection(gameState.selectedUnits);
            if (wordCount > 0) {
                unitMsg += ` (총 ${wordCount}개 단어)`;
            }
        }
    } else {
        unitMsg = '💕 선택한 Unit: 없음';
    }
    setPixelText(selectedUnitsElement, unitMsg,
        { fontPx: 10, scale: 2, color: '#9932CC', outline: 'rgba(255,255,255,0.9)', shadow: 'rgba(0,0,0,0)', wrapPx: 260 });
    
    startButton.disabled = gameState.selectedUnits.length === 0;
}

// 게임 시작
function startSelectedGame() {
    // 유닛은 스테이지에 따라 자동 배정된다
    applyStageUnits();
    document.getElementById('gameContainer').classList.remove('menu-mode');
    document.getElementById('characterSelectMenu').style.display = 'none';
    document.getElementById('unitSelectMenu').style.display = 'none';
    document.getElementById('ui').style.display = 'block';
    
    // 게임 시작 시 전체화면 모드 자동 활성화 (사용자가 이미 해제하지 않은 경우)
    if (!isUserExiting && !document.fullscreenElement && 
        !document.webkitFullscreenElement && !document.mozFullScreenElement && 
        !document.msFullscreenElement) {
        
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
        if (!isIOS) {
            isFullscreenDesired = true;
            toggleFullscreen();
        }
    }
    
    initGame();
}

// 메뉴 표시
function showMenu() {
    gameState.running = false;
    gameState.paused = false;
	 document.getElementById('gameContainer').classList.add('menu-mode');
    document.getElementById('characterSelectMenu').style.display = 'flex';
    document.getElementById('unitSelectMenu').style.display = 'none';
    document.getElementById('ui').style.display = 'none';
    document.getElementById('questionPanel').style.display = 'none';
    const pauseOv = document.getElementById('pauseOverlay');
    if (pauseOv) pauseOv.style.display = 'none';
    const pauseB = document.getElementById('pauseBtn');
    if (pauseB) pauseB.style.display = 'none';
}

// ── 일시정지: 버튼을 잘못 눌러도 게임이 끊기지 않게 오버레이로 확인 ──
function pauseGame() {
    if (!gameState.running || gameState.paused) return;
    gameState.paused = true;
    gameState.running = false;
    const ov = document.getElementById('pauseOverlay');
    if (ov) ov.style.display = 'flex';
}

function resumeGame() {
    if (!gameState.paused) return;
    gameState.paused = false;
    const ov = document.getElementById('pauseOverlay');
    if (ov) ov.style.display = 'none';
    gameState.running = true;
    requestAnimationFrame(gameLoop);
}

function exitToMenuFromPause() {
    gameState.paused = false;
    showMenu();
}

// 화면 전환 함수들
function showUnitSelectMenu() {
	document.getElementById('gameContainer').classList.add('menu-mode');
    document.getElementById('characterSelectMenu').style.display = 'none';
    document.getElementById('unitSelectMenu').style.display = 'flex';
    updateSelectedCharacterDisplay();
}

function showCharacterSelectMenu() {
	document.getElementById('gameContainer').classList.add('menu-mode');
    document.getElementById('unitSelectMenu').style.display = 'none';
    document.getElementById('characterSelectMenu').style.display = 'flex';
}

function updateSelectedCharacterDisplay() {
    const selectedCharacterPixel = document.getElementById('selectedCharacterPixel');
    const selectedCharacterName = document.getElementById('selectedCharacterName');
    
    if (selectedCharacterPixel && typeof characterPixelData !== 'undefined' && characterPixelData[gameState.selectedCharacter]) {
        const ctx = selectedCharacterPixel.getContext('2d');
        drawCharacterPixelSprite(
            ctx, 
            characterPixelData[gameState.selectedCharacter].idle, 
            characterPixelData[gameState.selectedCharacter].colorMap, 
            4
        );
    }
    
    if (selectedCharacterName) {
        const characterNames = {
            'jiyul': '크림이',
            'kiwi': '키위',
            'whitehouse': '화이트하우스'
        };
        setPixelText(selectedCharacterName, characterNames[gameState.selectedCharacter] || '크림이', { fontPx: 11, scale: 2, color: '#9932CC', outline: 'rgba(255,255,255,0.9)', shadow: 'rgba(0,0,0,0)', inline: true });
    }
}

// 도움말 표시
function showHelp() {
    alert('🌸 크림이의 픽셀 영어 게임 도움말 🌸\n\n' +
          '1. Unit을 선택하고 시작하세요!\n' +
          '2. 화면을 누르면 점프! 장애물을 뛰어넘으세요!\n' +
          '3. 움직이는 몬스터를 만나면 영어 문제를 풀어요!\n' +
          '4. 영어 단어의 뜻을 4지선다에서 고르세요!\n' +
          '5. 정답을 맞추면 몬스터를 물리칠 수 있어요!\n\n' +
          '✨ 특별한 능력 ✨\n' +
          '🥝 키위와 함께라면: 공중에서 더블 점프!\n' +
          '🏕️ 화이트하우스와 함께라면: 오답 데미지 감소!\n' +
          '🔥 연속 정답 콤보로 보너스 점수를 노려보세요!\n' +
          '📝 틀린 단어는 오답 노트에 저장되어 다시 나와요!\n\n' +
          '💕 크림이 화이팅! 💕');
}

// 게임 오버
function gameOver() {
    gameState.running = false;
    alert(`게임 오버! 😢\n최종 점수: ${gameState.score}점\n다시 도전해보세요!`);
    showMenu();
}

// 다음 스테이지
// ── 스테이지별 자동 유닛 배정 ──
// 1~8 스테이지: Unit1~8을 순서대로 하나씩 (한 스테이지 = 한 유닛 집중 학습)
// 9스테이지부터: 전 유닛 혼합 '복습 작전' (오답 노트 출제 확률 상향 + 몬스터 가속)
const ALL_UNITS = ['Unit1', 'Unit2', 'Unit3', 'Unit4', 'Unit5', 'Unit6', 'Unit7', 'Unit8'];
const BOSS_STAGE = 20; // 최종 보스 총정리전 스테이지

function unitsForStage(stage) {
    if (stage <= ALL_UNITS.length) return [ALL_UNITS[stage - 1]];
    return ALL_UNITS.slice();
}

function stageUnitLabel(stage) {
    if (stage >= BOSS_STAGE) return `보스 총정리전`;
    return stage <= ALL_UNITS.length ? `Unit ${stage}` : `복습 (전 유닛)`;
}

function applyStageUnits() {
    gameState.selectedUnits = unitsForStage(gameState.stage);
    gameState.unitDisplay = stageUnitLabel(gameState.stage);
    updateUI();
}

function nextStage() {
    if (gameState.stage >= 20) {
        triggerEnding();
        return;
    }
    
    gameState.stage++;
    gameState.speed += 0.5;
    applyStageUnits();
    const label = stageUnitLabel(gameState.stage);
    let extra = '';
    if (gameState.stage === ALL_UNITS.length + 1) {
        extra = '\n지금까지 배운 단어가 모두 나와요. 더 빨라진 몬스터를 조심!';
    } else if (gameState.stage === BOSS_STAGE) {
        extra = '\n알파벳 대마왕이 기다리고 있어요!\n지금까지 배운 모든 단어로 마지막 결전을 준비하세요!';
    }
    alert(`스테이지 ${gameState.stage - 1} 클리어!\n스테이지 ${gameState.stage} 시작 - ${label}` + extra);
    
    generateMoreEnemies();
}

// 점프 함수
// 키위와 함께라면(키위 캐릭터 또는 키위 탑승) 더블 점프 가능
function hasKiwiPower() {
    return gameState.selectedCharacter === 'kiwi' || gameState.selectedVehicle === 'kiwi';
}

// 화이트하우스와 함께라면(화이트하우스 캐릭터 또는 탑승) 오답 데미지 감소
function hasWhitehousePower() {
    return gameState.selectedCharacter === 'whitehouse' || gameState.selectedVehicle === 'whitehouse';
}

function jump() {
    if (gameState.questionActive || gameState.bossDialogueActive) return;

    if (player.onGround) {
        const jumpPower = getJumpPower();
        player.velocityY = jumpPower;

        const forwardSpeed = isMobileDevice() ? JUMP_FORWARD_SPEED * 1.2 : JUMP_FORWARD_SPEED * 1.5;
        player.velocityX = forwardSpeed;

        player.isJumping = true;
        player.onGround = false;
        gameState.isMoving = true;
        playSound('jump');

        if (typeof createParticles === 'function') {
            createParticles(player.x, player.y, 'hint');
        }
        // (점프당 +1점은 제자리 점프 연타로 점수를 무한 획득하는 파밍 수단이라 제거)
        updateUI();
    } else if (hasKiwiPower() && (player.airJumpsUsed || 0) < 1) {
        // 키위의 능력: 공중에서 한 번 더 점프!
        player.airJumpsUsed = (player.airJumpsUsed || 0) + 1;
        player.velocityY = getJumpPower() * 0.85;
        playSound('jump');

        if (typeof createParticles === 'function') {
            createParticles(player.x, player.y, 'hint');
        }
        if (typeof showFloatingText === 'function') {
            showFloatingText(player.x, player.y - 40, '🥝 더블 점프!', '#FF8C00');
        }
    } else {
        // 공중에서 누른 점프는 잠시 기억해 뒀다가 착지 직후 실행 (입력 버퍼링)
        player.jumpBufferTimer = JUMP_BUFFER_FRAMES;
    }
}

// 픽셀 스프라이트 그리기 함수 (characters.js가 없을 경우를 대비)
// drawPixelSprite는 characters.js의 캐싱 버전을 사용한다.

// 걷기 4프레임(walking1~4)까지 지원하는 프레임 선택 헬퍼
function pickSpriteFrame(data, isJumping, moving, animFrame) {
    if (isJumping) return data.jump || data.idle;
    if (moving) {
        // 지정된 걷기 사이클(예: 걷기1→대기→걷기2→대기)이 있으면 우선 사용
        if (data.walkCycle) {
            const name = data.walkCycle[animFrame % data.walkCycle.length];
            if (data[name]) return data[name];
        }
        const frames = [data.walking1, data.walking2, data.walking3, data.walking4].filter(Boolean);
        if (frames.length) return frames[animFrame % frames.length];
    }
    return data.idle;
}

// 스프라이트 크기(16/32/48 그리드)에 관계없이 발밑(bottomY) 기준으로 그린다.
// targetW: 화면에 표시할 가로 폭(px). 세로는 비율 유지.
function drawSpriteAnchored(sprite, colorMap, x, bottomY, targetW, flipH = false) {
    if (!sprite) return;
    const s = targetW / sprite[0].length;
    drawPixelSprite(sprite, colorMap, x, bottomY - sprite.length * s, s, flipH);
}

// 초기 캔버스 설정
resizeCanvas();

// 이벤트 리스너 설정
window.addEventListener('resize', resizeCanvas);
window.addEventListener('orientationchange', () => {
    setTimeout(resizeCanvas, 100);
});

// 전체화면 변경 이벤트 처리 (모든 브라우저 지원)
document.addEventListener('fullscreenchange', handleFullscreenChange);
document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
document.addEventListener('mozfullscreenchange', handleFullscreenChange);
document.addEventListener('MSFullscreenChange', handleFullscreenChange);

// 전체화면 변경 처리 함수
function handleFullscreenChange() {
    setTimeout(resizeCanvas, 100);
    
    const isCurrentlyFullscreen = !!(document.fullscreenElement || 
                                    document.webkitFullscreenElement || 
                                    document.mozFullScreenElement || 
                                    document.msFullscreenElement);
    
    if (isCurrentlyFullscreen) {
        // 전체화면 진입 성공
        setPixelText(document.getElementById('fullscreenBtn'), 'EXIT', { fontPx: 11, scale: 2, color: '#FFFFFF', outline: 'rgba(0,0,0,0.35)', shadow: 'rgba(0,0,0,0)', inline: true });
        isUserExiting = false;
    } else {
        // 전체화면 해제됨
        setPixelText(document.getElementById('fullscreenBtn'), 'FULL', { fontPx: 11, scale: 2, color: '#FFFFFF', outline: 'rgba(0,0,0,0.35)', shadow: 'rgba(0,0,0,0)', inline: true });
        
        // 사용자가 원하는 상태이고, 명시적으로 해제한 것이 아니라면 복구 시도
        if (isFullscreenDesired && !isUserExiting) {
            restoreFullscreen();
        }
    }
}

window.addEventListener('load', checkIOSFullscreen);

// 페이지 가시성 변경 시 전체화면 복구
document.addEventListener('visibilitychange', function() {
    if (!document.hidden && isFullscreenDesired && !isUserExiting) {
        // 페이지가 다시 보이게 되었을 때 전체화면 복구 시도
        setTimeout(() => {
            restoreFullscreen();
        }, 500);
    }
});

// 창 포커스 시 전체화면 복구
window.addEventListener('focus', function() {
    if (isFullscreenDesired && !isUserExiting) {
        setTimeout(() => {
            restoreFullscreen();
        }, 200);
    }
});

// 터치 이벤트 처리 (모바일 지원)
let touchStartY = 0;
let touchStartX = 0;
let touchStartTime = 0;
let isTouchOnButton = false;

document.addEventListener('touchstart', function(e) {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
    touchStartTime = Date.now();
    
    // 터치 시작 지점이 버튼이나 UI 요소인지 확인
    const target = document.elementFromPoint(touchStartX, touchStartY);
    
    if (target) {
        // 버튼 클래스, ID, 또는 부모 요소 확인
        if (target.classList.contains('control-btn') ||
            target.id === 'pauseBtn' ||
            target.id === 'fullscreenBtn' ||
            target.closest('#pauseOverlay') ||
            target.closest('#controls') ||
            target.closest('#ui') ||
            target.closest('#questionPanel') ||
            target.closest('#characterSelectMenu') ||
            target.closest('#unitSelectMenu') ||
            target.closest('.choice-btn') ||
            target.classList.contains('unit-btn') ||
            target.classList.contains('character-btn') ||
            target.classList.contains('vehicle-btn') ||
            target.classList.contains('start-btn') ||
            target.classList.contains('back-btn') ||
            target.tagName === 'BUTTON') {
            isTouchOnButton = true;
        } else {
            isTouchOnButton = false;
        }
    }
}, { passive: true });

document.addEventListener('touchend', function(e) {
    // 버튼을 터치한 경우 점프하지 않음
    if (isTouchOnButton) {
        isTouchOnButton = false;
        return;
    }
    
    if (!gameState.running || gameState.questionActive || gameState.bossDialogueActive) return;
    
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    const touchEndTime = Date.now();
    const deltaY = touchStartY - touchEndY;
    const deltaTime = touchEndTime - touchStartTime;
    
    // 터치 종료 지점도 확인 (iOS Safari 대응)
    const endTarget = document.elementFromPoint(touchEndX, touchEndY);
    
    if (endTarget) {
        // 종료 지점이 버튼이나 UI 요소면 점프하지 않음
        if (endTarget.classList.contains('control-btn') ||
            endTarget.id === 'pauseBtn' ||
            endTarget.id === 'fullscreenBtn' ||
            endTarget.closest('#pauseOverlay') ||
            endTarget.closest('#controls') ||
            endTarget.closest('#ui') ||
            endTarget.closest('#questionPanel') ||
            endTarget.closest('#characterSelectMenu') ||
            endTarget.closest('#unitSelectMenu') ||
            endTarget.closest('.choice-btn') ||
            endTarget.classList.contains('unit-btn') ||
            endTarget.classList.contains('character-btn') ||
            endTarget.classList.contains('vehicle-btn') ||
            endTarget.classList.contains('start-btn') ||
            endTarget.classList.contains('back-btn') ||
            endTarget.tagName === 'BUTTON') {
            return;
        }
    }
    
    // 하단 컨트롤 영역에서 터치한 경우 점프하지 않음
    const controlsElement = document.getElementById('controls');
    if (controlsElement) {
        const controlsRect = controlsElement.getBoundingClientRect();
        // 터치가 controls 영역 내부이면 점프하지 않음
        if (touchEndY >= controlsRect.top) {
            return;
        }
    }
    
    // 위로 스와이프 또는 탭 감지 (화면 아무 곳이나 눌러서 점프)
    lastTouchEndAt = Date.now();
    if ((deltaY > 50 && deltaTime < 500) || (deltaTime < 350 && Math.abs(deltaY) < 40)) {
        e.preventDefault();
        jump();
    }
}, { passive: false });

// 데스크톱: 마우스 클릭으로도 점프 (터치 후 발생하는 합성 클릭은 무시)
let lastTouchEndAt = 0;
document.addEventListener('click', function(e) {
    if (Date.now() - lastTouchEndAt < 800) return;
    if (!gameState.running || gameState.paused || gameState.questionActive || gameState.bossDialogueActive) return;
    const t = e.target;
    if (!t || t.tagName === 'BUTTON' || t.closest('button') ||
        t.closest('#ui') || t.closest('#questionPanel') || t.closest('#pauseOverlay') ||
        t.closest('#characterSelectMenu') || t.closest('#unitSelectMenu')) {
        return;
    }
    jump();
});

// 오프닝 실행 여부 체크
let hasSeenOpening = false;

// 게임 초기화 및 메뉴 표시
function initializeGame() {
    // 초기 상태 설정
    gameState.selectedCharacter = 'jiyul';
    gameState.selectedUnits = [];
    
    // 캔버스 초기화
    resizeCanvas();
    
    // 첫 실행시 오프닝 재생, 이후엔 메뉴 바로 표시
    // 초기에 모든 UI 숨기기 (타이틀 화면 표시 전)
    if (document.getElementById('characterSelectMenu')) document.getElementById('characterSelectMenu').style.display = 'none';
    if (document.getElementById('unitSelectMenu')) document.getElementById('unitSelectMenu').style.display = 'none';
    if (document.getElementById('ui')) document.getElementById('ui').style.display = 'none';
    if (document.getElementById('questionPanel')) document.getElementById('questionPanel').style.display = 'none';
    if (document.getElementById('controls')) document.getElementById('controls').style.display = 'none';
    if (document.getElementById('fullscreenBtn')) document.getElementById('fullscreenBtn').style.display = 'none';
    if (!hasSeenOpening) {
        // 방향 체크 후 회전 메시지 또는 타이틀 화면 표시
        if (typeof checkOrientationAndShowTitle === "function") {
            checkOrientationAndShowTitle();
        } else if (typeof showTitleScreen === "function") {
            showTitleScreen();
        } else {
            console.error("타이틀 화면을 찾을 수 없습니다.");
            showMenu();
        }
    } else {
        showMenu();
    }
    
    console.log('🌸 크림이의 픽셀 영어 게임이 초기화되었습니다! 🌸');
}

// 오프닝 시퀀스 시작
function startOpeningSequence() {
	document.getElementById('gameContainer').classList.remove('menu-mode');
    // 모든 UI 요소 숨기기
    document.getElementById('characterSelectMenu').style.display = 'none';
    document.getElementById('unitSelectMenu').style.display = 'none';
    document.getElementById('ui').style.display = 'none';
    document.getElementById('questionPanel').style.display = 'none';
    document.getElementById('fullscreenBtn').style.display = 'none';

    // 오프닝 실행 (opening.js에서)
    if (typeof startOpening === 'function') {
        startOpening(canvas, ctx, function() {
            // 오프닝 완료 후 메뉴 표시
            hasSeenOpening = true;
            showMenu();
        });
    } else {
        console.error('opening.js가 로드되지 않았습니다!');
        showMenu();
    }
}

// 캐릭터 선택 함수
function selectCharacterByName(characterName) {
    gameState.selectedCharacter = characterName;
    
    // 모든 캐릭터 버튼에서 선택 해제
    document.querySelectorAll('.character-btn').forEach(btn => {
        btn.classList.remove('selected');
    });
    
    // 선택된 캐릭터 버튼에 선택 표시
    const selectedBtn = document.querySelector(`[data-character="${characterName}"]`);
    if (selectedBtn) {
        selectedBtn.classList.add('selected');
    }
    
    // HTML에 정의된 selectCharacter 함수 호출
    if (typeof selectCharacter === 'function') {
        selectCharacter(characterName);
    }
}

// Unit 선택 상태 업데이트
function updateUnitSelection() {
    const unitButtons = document.querySelectorAll('.unit-btn');
    unitButtons.forEach(btn => {
        const unit = btn.getAttribute('data-unit');
        if (gameState.selectedUnits.includes(unit)) {
            btn.classList.add('selected');
        } else {
            btn.classList.remove('selected');
        }
    });
    
    updateSelectedDisplay();
}

// 게임 재시작
function restartGame() {
    applyStageUnits();
    gameState.running = false;
    setTimeout(() => {
        initGame();
    }, 100);
}

// 점수 저장 (로컬 스토리지는 artifacts에서 사용할 수 없으므로 메모리에만 저장)
let gameRecords = [];

function saveGameRecord() {
    const record = {
        score: gameState.score,
        stage: gameState.stage,
        character: gameState.selectedCharacter,
        units: [...gameState.selectedUnits],
        correctAnswers: gameStats.correctAnswers,
        totalQuestions: gameStats.totalQuestions,
        accuracy: gameStats.totalQuestions > 0 ?
                  Math.round((gameStats.correctAnswers / gameStats.totalQuestions) * 100) : 0,
        playTime: gameStats.startTime ?
                  Math.round((Date.now() - gameStats.startTime) / 1000) : 0,
        maxCombo: gameStats.maxCombo,
        wrongWords: gameStats.wrongWords.map(w => ({ english: w.english, korean: w.korean })),
        date: new Date().toLocaleString('ko-KR')
    };
    
    gameRecords.push(record);
    
    // 최근 10개 기록만 유지
    if (gameRecords.length > 10) {
        gameRecords = gameRecords.slice(-10);
    }
    
    return record;
}

// 게임 기록 표시
function showGameRecords() {
    if (gameRecords.length === 0) {
        alert('아직 게임 기록이 없어요! 게임을 플레이해보세요! 💕');
        return;
    }
    
    let recordText = '🏆 게임 기록 🏆\n\n';
    gameRecords.slice(-5).reverse().forEach((record, index) => {
        recordText += `${index + 1}. ${record.date}\n`;
        recordText += `   캐릭터: ${record.character === 'jiyul' ? '크림이' : 
                                   record.character === 'kiwi' ? '키위' : '화이트하우스'}\n`;
        recordText += `   점수: ${record.score}점 (스테이지 ${record.stage})\n`;
        recordText += `   정답률: ${record.accuracy}% (${record.correctAnswers}/${record.totalQuestions})\n`;
        recordText += `   플레이 시간: ${Math.floor(record.playTime / 60)}분 ${record.playTime % 60}초\n\n`;
    });
    
    alert(recordText);
}

// 게임 오버 시 기록 저장
function gameOverWithRecord() {
    const record = saveGameRecord();
    
    let message = `게임 오버! 😢\n\n`;
    message += `🏆 게임 결과 🏆\n`;
    message += `최종 점수: ${record.score}점\n`;
    message += `스테이지: ${record.stage}\n`;
    message += `정답률: ${record.accuracy}% (${record.correctAnswers}/${record.totalQuestions})\n`;
    message += `최고 콤보: ${record.maxCombo}연속 🔥\n`;
    message += `플레이 시간: ${Math.floor(record.playTime / 60)}분 ${record.playTime % 60}초\n`;

    // 오답 노트: 틀린 단어를 보여줘서 복습 유도
    if (record.wrongWords && record.wrongWords.length > 0) {
        message += `\n📝 오늘 틀린 단어 (복습해요!)\n`;
        record.wrongWords.slice(0, 8).forEach(w => {
            message += `  • ${w.english} = ${w.korean}\n`;
        });
        if (record.wrongWords.length > 8) {
            message += `  ... 외 ${record.wrongWords.length - 8}개\n`;
        }
    }

    message += `\n다시 도전해보세요! 💕`;
    
    gameState.running = false;
    alert(message);
    showMenu();
}

// (구) showEndingWithRecord는 어디서도 호출되지 않던 죽은 함수였음
// → 엔딩 기록 저장은 triggerEnding()에서 일원화 처리

// 기존 gameOver 함수 교체
window.gameOver = gameOverWithRecord;

// 고급 도움말 함수
function showAdvancedHelp() {
    const helpText = `
🌸 크림이의 픽셀 영어 게임 - 상세 도움말 🌸

🎮 조작법:
• 화면 아무 곳이나 탭/클릭: 점프
• 스페이스바: 점프 (키보드)
• 1,2,3,4 키: 문제 선택지 선택
• ESC 키: 일시정지/계속하기
• H 키: 도움말

🎯 게임 목표:
• 장애물을 뛰어넘으며 전진하세요!
• 몬스터를 만나면 영어 문제를 풀어요!
• 20스테이지까지 클리어하는 것이 목표!

💡 팁:
• 점프하면 앞으로 더 멀리 갈 수 있어요!
• 보스전에서는 더 어려운 문제가 나와요!
• Unit을 많이 선택할수록 다양한 문제가 나와요!

🏆 점수 시스템:
• 장애물 통과: 5-10점
• 문제 정답: 20점
• 몬스터 처치: 50점 (보스 100점)
• 점프: 1점

❤️ 체력 시스템:
• 틀린 답: -15 체력
• 체력이 0이 되면 게임 오버!
    `;
    
    alert(helpText);
}

// 오프닝 다시보기 함수
function replayOpening() {
    // 방향 체크 후 회전 메시지 또는 타이틀 화면 표시
    if (typeof checkOrientationAndShowTitle === "function") {
        checkOrientationAndShowTitle();
    } else if (typeof showTitleScreen === "function") {
        showTitleScreen();
    } else {
        console.error("타이틀 화면을 찾을 수 없습니다.");
        showMenu();
    }
}

// 전역 함수로 등록하여 HTML에서 접근 가능하게 함
window.showAdvancedHelp = showAdvancedHelp;
window.showGameRecords = showGameRecords;
window.restartGame = restartGame;
window.selectCharacterByName = selectCharacterByName;
window.replayOpening = replayOpening;

// 게임 시작 시 초기화
console.log('🎮 게임 스크립트 로딩 완료!');

// DOM이 완전히 로드된 후 게임 초기화
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeGame);
} else {
    initializeGame();
}

// 에러 처리
window.addEventListener('error', function(e) {
    console.error('게임 오류:', e.error);
    
    // 치명적이지 않은 오류는 무시하고 계속 진행
    if (e.error && e.error.message && 
        !e.error.message.includes('Script error') &&
        !e.error.message.includes('Non-Error promise rejection')) {
        
        // 사용자에게 오류 알림 (선택적)
        if (typeof debugMode !== 'undefined' && debugMode) {
            alert(`오류가 발생했습니다: ${e.error.message}`);
        }
    }
});

// 성능 최적화를 위한 requestAnimationFrame 폴백
if (!window.requestAnimationFrame) {
    window.requestAnimationFrame = function(callback) {
        return setTimeout(callback, 16); // 약 60fps
    };
}

// iOS에서 오디오 활성화 (사운드 추가 시 필요)
// ============ 사운드 시스템 (WebAudio 기반 8비트풍 효과음) ============
let gameAudioCtx = null;

function getAudioContext() {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return null;
    if (!gameAudioCtx) {
        gameAudioCtx = new AudioCtx();
    }
    if (gameAudioCtx.state === 'suspended') {
        gameAudioCtx.resume();
    }
    return gameAudioCtx;
}

function enableAudio() {
    getAudioContext();
}

// 짧은 8비트풍 효과음 재생 (사운드 파일 없이 오실레이터로 합성)
function playSound(type) {
    try {
        const ctx = getAudioContext();
        if (!ctx || ctx.state !== 'running') return;

        // [주파수(Hz), 시작시간(초), 길이(초)] 목록
        const sounds = {
            jump:    { wave: 'square',   notes: [[330, 0, 0.06], [440, 0.06, 0.08]], volume: 0.06 },
            correct: { wave: 'square',   notes: [[523, 0, 0.09], [659, 0.09, 0.09], [784, 0.18, 0.14]], volume: 0.07 },
            wrong:   { wave: 'sawtooth', notes: [[220, 0, 0.12], [165, 0.12, 0.2]], volume: 0.06 },
            defeat:  { wave: 'square',   notes: [[523, 0, 0.08], [659, 0.08, 0.08], [784, 0.16, 0.08], [1047, 0.24, 0.2]], volume: 0.07 }
        };
        const sound = sounds[type];
        if (!sound) return;

        const now = ctx.currentTime;
        sound.notes.forEach(([freq, start, duration]) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = sound.wave;
            osc.frequency.setValueAtTime(freq, now + start);
            gain.gain.setValueAtTime(sound.volume, now + start);
            gain.gain.exponentialRampToValueAtTime(0.001, now + start + duration);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now + start);
            osc.stop(now + start + duration + 0.02);
        });
    } catch (e) {
        // 사운드 실패는 게임 진행에 영향 없음
    }
}

// 첫 번째 사용자 상호작용에서 오디오 활성화
document.addEventListener('touchstart', enableAudio, { once: true });
document.addEventListener('click', enableAudio, { once: true });

// 키보드 이벤트 처리
document.addEventListener('keydown', function(e) {
    // 일시정지 중: ESC/스페이스/엔터로 즉시 복귀
    if (gameState.paused) {
        if (e.code === 'Escape' || e.code === 'Space' || e.code === 'Enter') {
            e.preventDefault();
            resumeGame();
        }
        return;
    }
    if (!gameState.running) return;

    switch(e.code) {
        case 'Space':
            e.preventDefault();
            jump();
            break;
        case 'Digit1': case 'Digit2': case 'Digit3': case 'Digit4':
            if (gameState.questionActive) {
                e.preventDefault();
                chooseAnswer(parseInt(e.code.slice(-1), 10) - 1);
            }
            break;
        case 'Enter':
            if (gameState.questionActive) {
                e.preventDefault();
                submitAnswer();
            }
            break;
        case 'Escape':
            e.preventDefault();
            // ESC 키로 전체화면 해제 시 사용자 의도로 간주
            if (document.fullscreenElement || document.webkitFullscreenElement ||
                document.mozFullScreenElement || document.msFullscreenElement) {
                isUserExiting = true;
                isFullscreenDesired = false;
            }
            pauseGame();
            break;
        case 'KeyH':
            e.preventDefault();
            showHelp();
            break;
        case 'Digit1':
        case 'Digit2':
        case 'Digit3':
        case 'Digit4':
            if (gameState.questionActive) {
                e.preventDefault();
                const choiceIndex = parseInt(e.code.slice(-1)) - 1;
                selectChoice(choiceIndex);
            }
            break;
    }
});

// 모바일 가로 모드 고정 시도
function lockOrientation() {
    try {
        // Screen Orientation API 사용 (최신 방법)
        if (screen.orientation && screen.orientation.lock) {
            screen.orientation.lock('landscape').catch(err => {
                console.log('가로 모드 고정 실패 (권한 필요):', err);
            });
        }
        // 레거시 방법들
        else if (screen.lockOrientation) {
            screen.lockOrientation('landscape');
        } else if (screen.mozLockOrientation) {
            screen.mozLockOrientation('landscape');
        } else if (screen.msLockOrientation) {
            screen.msLockOrientation('landscape');
        }
    } catch (err) {
        console.log('가로 모드 고정을 지원하지 않는 브라우저입니다:', err);
    }
}

// 전체화면 모드에서만 orientation lock이 작동하므로 전체화면 진입 시 시도
document.addEventListener('fullscreenchange', function() {
    if (document.fullscreenElement) {
        lockOrientation();
    }
});

// 페이지 로드 시 가로 모드 고정 시도
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', lockOrientation);
} else {
    lockOrientation();
}

console.log('✨ 크림이의 픽셀 영어 게임 준비 완료! ✨');