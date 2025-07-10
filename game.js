// 게임 로직 관련 함수들

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;

// 픽셀 스케일과 물리 상수
let PIXEL_SCALE = 3;
const GRAVITY = 0.8;
const JUMP_POWER = -18;
const JUMP_FORWARD_SPEED = 6;
let GROUND_Y = 240; // 동적으로 변경됨

// 모바일 감지 함수
function isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
           ('ontouchstart' in window) || 
           (navigator.maxTouchPoints > 0);
}

// 디바이스별 점프 파워 계산
function getJumpPower() {
    if (isMobileDevice()) {
        // 모바일에서는 점프 파워를 줄임
        return -14;
    } else {
        // PC에서는 기본 점프 파워
        return -18;
    }
}

// 게임 상태 먼저 초기화
let gameState = {
    running: false,
    score: 0,
    stage: 1,
    selectedDans: [],
    selectedOps: [],
    distance: 0,
    speed: 4,
    questionActive: false,
    currentEnemy: null,
    backgroundOffset: 0,
    currentQuestion: '',
    correctAnswer: 0,
    isMoving: true, // 화면이 움직이는지 여부
    cameraX: 0, // 카메라 위치
    screenShake: 0, // 화면 흔들림 효과
    shakeTimer: 0  // 흔들림 타이머
};

// 지율이 캐릭터 초기화
let jiyul = {
    x: 100,
    y: 240,
    worldX: 100, // 월드 좌표
    width: 16 * PIXEL_SCALE,
    height: 16 * PIXEL_SCALE,
    hp: 100,
    animFrame: 0,
    animTimer: 0,
    sprite: 'jiyul',
    velocityY: 0,
    velocityX: 0,
    isJumping: false,
    onGround: true,
    runSpeed: 4
};

// 게임 오브젝트들
let obstacles = [];
let enemies = [];
let particles = [];

// 캔버스 크기 조정 (모바일 가로 최적화)
function resizeCanvas() {
    const container = document.getElementById('gameContainer');
    const controls = document.getElementById('controls');
    const controlsHeight = controls ? controls.offsetHeight : 0;
    
    // 실제 화면 크기 가져오기
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight - controlsHeight;
    
    canvas.width = screenWidth;
    canvas.height = screenHeight;
    
    // 모바일 가로 모드 감지
    if (screenWidth > screenHeight) {
        // 가로 모드 - 픽셀 스케일 조정
        PIXEL_SCALE = Math.floor(screenHeight / 120); // 화면 높이에 맞춰 스케일 조정
        if (PIXEL_SCALE < 2) PIXEL_SCALE = 2;
        if (PIXEL_SCALE > 4) PIXEL_SCALE = 4;
    } else {
        // 세로 모드
        PIXEL_SCALE = 3;
    }
    
    // 캐릭터 크기 재조정
    if (jiyul) {
        jiyul.width = 16 * PIXEL_SCALE;
        jiyul.height = 16 * PIXEL_SCALE;
    }
    
    // 바닥 위치 재조정
    GROUND_Y = screenHeight - (screenHeight * 0.25);
    
    // 지율이 위치 조정 (gameState가 존재할 때만)
    if (jiyul && gameState && !gameState.questionActive) {
        jiyul.y = GROUND_Y;
    }
}

// 전체화면 기능
function toggleFullscreen() {
    // iOS 감지
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    
    if (isIOS) {
        // iOS에서는 풀스크린 대신 안내 메시지 표시
        showIOSFullscreenGuide();
        return;
    }
    
    // 안드로이드 및 기타 브라우저
    if (!document.fullscreenElement && 
        !document.webkitFullscreenElement && 
        !document.mozFullScreenElement && 
        !document.msFullscreenElement) {
        
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
        
        // 화면 방향 잠금 시도
        if (screen.orientation && screen.orientation.lock) {
            screen.orientation.lock('landscape').catch(() => {});
        }
        
        document.getElementById('fullscreenBtn').textContent = 'EXIT';
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        } else if (document.mozCancelFullScreen) {
            document.mozCancelFullScreen();
        } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
        }
        
        document.getElementById('fullscreenBtn').textContent = 'FULL';
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
        font-family: 'Jua', sans-serif;
        text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        box-shadow: 0 5px 20px rgba(0,0,0,0.5);
        text-align: center;
        line-height: 1.8;
        max-width: 90vw;
    `;
    
    guideDiv.innerHTML = `
        <div style="font-size: 24px; margin-bottom: 20px;">🍎 아이폰 사용자님께 🍎</div>
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
            font-family: 'Jua', sans-serif;
            border-radius: 25px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.3);
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        ">확인</button>
    `;
    
    document.body.appendChild(guideDiv);
    
    // 5초 후 자동으로 사라짐
    setTimeout(() => {
        if (guideDiv.parentElement) {
            guideDiv.remove();
        }
    }, 5000);
}

// iOS 체크 함수 추가
function checkIOSFullscreen() {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    const isStandalone = window.navigator.standalone === true;
    
    if (isIOS && !isStandalone) {
        // 풀스크린 버튼 텍스트 변경
        const fullscreenBtn = document.getElementById('fullscreenBtn');
        if (fullscreenBtn) {
            fullscreenBtn.textContent = '🏠추가';
        }
    }
}

// 게임 시작 시 iOS 체크 추가
window.addEventListener('load', checkIOSFullscreen);

// 게임 초기화
function initGame() {
    gameState.running = true;
    gameState.score = 0;
    gameState.stage = 1;
    gameState.distance = 0;
    gameState.speed = 4;
    gameState.questionActive = false;
    gameState.isMoving = true;
    gameState.cameraX = 0;
    
    jiyul.x = 100;
    jiyul.worldX = 100;
    jiyul.y = GROUND_Y;
    jiyul.hp = 100;
    jiyul.velocityY = 0;
    jiyul.velocityX = 0;
    jiyul.onGround = true;
    jiyul.isJumping = false;
    
    generateLevel();
    gameLoop();
    updateUI();
}

// 레벨 생성
function generateLevel() {
    obstacles = [];
    enemies = [];

    // 장애물 배치 (더 많이, 더 전략적으로)
    const obstacleSpacing = 200 + Math.random() * 150;
    for (let i = 0; i < 12; i++) {
        const types = ['rock', 'spike', 'pipe'];
        const type = types[Math.floor(Math.random() * types.length)];
        
        obstacles.push({
            x: 600 + i * obstacleSpacing,
            y: GROUND_Y,
            width: 16 * PIXEL_SCALE,
            height: 16 * PIXEL_SCALE,
            type: type,
            passed: false
        });
    }

    // 몬스터 배치 (무한 생성)
    generateMoreEnemies();
}

// 몬스터 무한 생성 함수 추가
function generateMoreEnemies() {
    const currentMaxX = Math.max(...enemies.map(e => e.x), jiyul.worldX);
    const startX = Math.max(currentMaxX + 300, jiyul.worldX + 800);
    
    // 새로운 몬스터들 추가
    for (let i = 0; i < 5; i++) {
        const baseSpeed = 1.5 + (gameState.stage - 1) * 0.5;
        const direction = Math.random() > 0.5 ? 1 : -1;
        
        enemies.push({
            x: startX + i * 400 + Math.random() * 200,
            y: GROUND_Y,
            width: 16 * PIXEL_SCALE,
            height: 16 * PIXEL_SCALE,
            hp: 1,
            maxHp: 1,
            type: Math.random() > 0.5 ? 'slime' : 'goblin',
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
            patrolStart: startX + i * 400,
            patrolRange: 150
        });
    }

    // 가끔 보스도 추가
    if (Math.random() < 0.3) {
        const bossX = startX + 1000;
        enemies.push({
            x: bossX,
            y: GROUND_Y,
            width: 16 * PIXEL_SCALE,
            height: 16 * PIXEL_SCALE,
            hp: 3 + Math.floor(gameState.stage / 2),
            maxHp: 3 + Math.floor(gameState.stage / 2),
            type: 'boss',
            alive: true,
            animFrame: 0,
            velocityY: 0,
            velocityX: 0,
            isJumping: false,
            onGround: true,
            jumpCooldown: 0,
            isMoving: true,
            walkSpeed: 1 + gameState.stage * 0.3,
            direction: -1,
            patrolStart: bossX,
            patrolRange: 200,
            aggroRange: 300,
            isAggro: false
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
    // 화면이 움직일 때만 거리와 배경 업데이트
	if (gameState.isMoving && !gameState.questionActive) {
		gameState.distance += gameState.speed;
		gameState.backgroundOffset += gameState.speed * 0.5; // 양수로 증가
		gameState.cameraX += gameState.speed;
		
		// 지율이도 자동으로 앞으로 이동
		jiyul.worldX += gameState.speed;
	}

    // 화면 흔들림 효과 업데이트
    if (gameState.shakeTimer > 0) {
        gameState.shakeTimer--;
        gameState.screenShake = Math.sin(gameState.shakeTimer * 0.5) * (gameState.shakeTimer / 10);
    } else {
        gameState.screenShake = 0;
    }

    // 지율이 물리 업데이트
    updateJiyulPhysics();
    
    // 몬스터 물리 업데이트
    updateEnemyPhysics();
    
    checkCollisions();
    updateAnimations();
    updateParticles();

    // 죽은 적들 정리 (화면 뒤로 많이 간 적들도 정리)
    enemies = enemies.filter(enemy => 
        enemy.alive && (enemy.x > gameState.cameraX - 500)
    );

    // 새로운 몬스터 생성 (앞쪽에 몬스터가 부족하면)
    const aheadEnemies = enemies.filter(enemy => 
        enemy.x > jiyul.worldX && enemy.x < jiyul.worldX + 2000
    );
    
    if (aheadEnemies.length < 3) {
        generateMoreEnemies();
    }

    // 스테이지 클리어 조건 제거 (무한 게임)
    // const allEnemiesDefeated = enemies.every(enemy => !enemy.alive);
    // if (allEnemiesDefeated && gameState.distance > 2000) {
    //     nextStage();
    // }
    
    // 거리 기반 스테이지 업그레이드
    if (gameState.distance > gameState.stage * 3000) {
        nextStage();
    }
}

// 지율이 물리 업데이트
function updateJiyulPhysics() {
    // 중력 적용
    if (!jiyul.onGround) {
        jiyul.velocityY += GRAVITY;
    }
    
    // Y축 이동
    jiyul.y += jiyul.velocityY;
    
    // X축 이동 (점프나 조작 시)
    if (jiyul.velocityX !== 0) {
        jiyul.worldX += jiyul.velocityX;
        // 마찰력 적용 (점프 중에는 덜 적용)
        const friction = jiyul.isJumping ? 0.98 : 0.92;
        jiyul.velocityX *= friction;
        if (Math.abs(jiyul.velocityX) < 0.1) {
            jiyul.velocityX = 0;
        }
    }
    
    // 바닥 충돌 체크
    if (jiyul.y >= GROUND_Y) {
        jiyul.y = GROUND_Y;
        jiyul.velocityY = 0;
        jiyul.onGround = true;
        jiyul.isJumping = false;
        
        // 착지 시 파티클 효과
        if (jiyul.velocityX > 2) {
            createParticles(jiyul.x, jiyul.y, 'hint');
        }
    }
    
    // 화면의 1/4 지점에 고정된 위치 설정 (더 뒤로 이동)
    const targetScreenX = canvas.width / 4;
    jiyul.x = targetScreenX;
    
    // 카메라를 지율이의 월드 위치에 맞춰 조정 (지율이는 계속 오른쪽으로 진행)
    gameState.cameraX = jiyul.worldX - targetScreenX;
}

// 몬스터 물리 처리 (대폭 개선)
function updateEnemyPhysics() {
    enemies.forEach(enemy => {
        if (!enemy.alive) return;
        
        const enemyScreenX = enemy.x - gameState.cameraX;
        
        // 화면 범위 내에서만 활동
        if (enemyScreenX > -200 && enemyScreenX < canvas.width + 200) {
            
            // 보스의 경우 플레이어 추적
            if (enemy.type === 'boss') {
                const distanceToPlayer = Math.abs(enemy.x - jiyul.worldX);
                
                if (distanceToPlayer < enemy.aggroRange) {
                    enemy.isAggro = true;
                    // 플레이어 방향으로 이동
                    if (enemy.x > jiyul.worldX) {
                        enemy.direction = -1;
                    } else {
                        enemy.direction = 1;
                    }
                    enemy.walkSpeed = 2 + gameState.stage * 0.3;
                } else {
                    enemy.isAggro = false;
                    enemy.walkSpeed = 1 + gameState.stage * 0.2;
                }
            }
            
            // 일반 몬스터 패트롤 움직임
            if (enemy.isMoving && !gameState.questionActive) {
                enemy.x += enemy.walkSpeed * enemy.direction;
                
                // 패트롤 범위 체크
                if (enemy.patrolStart && enemy.patrolRange) {
                    if (enemy.x <= enemy.patrolStart - enemy.patrolRange || 
                        enemy.x >= enemy.patrolStart + enemy.patrolRange) {
                        enemy.direction *= -1; // 방향 반전
                    }
                }
                
                // 랜덤 점프 (20% 확률)
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
        
        // 몬스터 중력 적용
        if (!enemy.onGround) {
            enemy.velocityY += GRAVITY;
            enemy.y += enemy.velocityY;
            
            // 바닥 충돌
            if (enemy.y >= GROUND_Y) {
                enemy.y = GROUND_Y;
                enemy.velocityY = 0;
                enemy.onGround = true;
                enemy.isJumping = false;
            }
        }
    });
}

// 충돌 체크 (개선된 버전)
function checkCollisions() {
    // 장애물과의 충돌
    obstacles.forEach(obstacle => {
        const obstacleScreenX = obstacle.x - gameState.cameraX;
        
        // 화면에 있는 장애물만 체크
        if (obstacleScreenX > -100 && obstacleScreenX < canvas.width + 100) {
            
            // 지율이 월드 좌표로 충돌 체크
            if (checkBoxCollision(
                {x: jiyul.worldX, y: jiyul.y, width: jiyul.width, height: jiyul.height},
                {x: obstacle.x, y: obstacle.y, width: obstacle.width, height: obstacle.height}
            )) {
                // spike는 데미지를 입힘
                if (obstacle.type === 'spike' && !obstacle.passed) {
                    jiyul.hp -= 20;
                    obstacle.passed = true;
                    createParticles(jiyul.x, jiyul.y, 'hurt');
                    
                    // 화면 흔들림 효과
                    gameState.shakeTimer = 20;
                    
                    updateUI();
                    
                    if (jiyul.hp <= 0) {
                        gameOver();
                        return;
                    }
                }
                // 다른 장애물은 점프 중이 아닐 때만 막힘
                else if (obstacle.type !== 'spike' && jiyul.onGround) {
                    // 장애물 앞에서 멈춤 (바닥에 있을 때만)
                    jiyul.worldX = obstacle.x - jiyul.width - 5;
                    jiyul.velocityX = 0;
                    
                    // 화면 이동 정지
                    gameState.isMoving = false;
                    
                    // 약간의 충돌 효과
                    gameState.shakeTimer = 10;
                    
                    // 점프로만 넘어갈 수 있도록 힌트
                    if (Math.random() < 0.01) { // 가끔 힌트 표시
                        createParticles(jiyul.x, jiyul.y - 30, 'hint');
                    }
                }
            } else {
                // 장애물을 넘어갔으면 다시 이동 시작
                if (jiyul.worldX > obstacle.x + obstacle.width && !obstacle.passed) {
                    obstacle.passed = true;
                    gameState.isMoving = true;
                    gameState.score += 10; // 장애물 통과 보너스
                    createParticles(jiyul.x, jiyul.y - 20, 'hint'); // 성공 파티클
                    updateUI();
                }
            }
        }
    });
    
    // 적과의 충돌
	enemies.forEach(enemy => {
		if (!enemy.alive) return;
		
		const enemyScreenX = enemy.x - gameState.cameraX;
		
		if (enemyScreenX > -100 && enemyScreenX < canvas.width + 100) {
			if (checkBoxCollision(
				{x: jiyul.worldX, y: jiyul.y, width: jiyul.width, height: jiyul.height},
				{x: enemy.x, y: enemy.y, width: enemy.width, height: enemy.height}
			)) {
				// 문제 출제
				if (!gameState.questionActive) {
					gameState.questionActive = true;
					gameState.currentEnemy = enemy;
					gameState.isMoving = false; // 전투 중에는 화면 정지
					generateQuestion();
					updateQuestionPanel();
					document.getElementById('questionPanel').style.display = 'block';
					
					// 입력창 초기화 및 모바일 키보드 완전 차단
					const answerInput = document.getElementById('answerInput');
					answerInput.value = '';
					answerInput.blur(); // 포커스 제거로 모바일 키보드 방지
					
					// 추가 보안 조치
					answerInput.setAttribute('readonly', 'readonly');
					answerInput.setAttribute('inputmode', 'none');
					
					// 모든 포커스 제거
					document.activeElement.blur();
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

// 애니메이션 업데이트
function updateAnimations() {
    // 지율이 애니메이션 (걷기 애니메이션 추가)
    jiyul.animTimer++;
    if (jiyul.animTimer >= 15) { // 걷기 애니메이션 속도 조절
        jiyul.animFrame = (jiyul.animFrame + 1) % 3; // 0, 1, 2로 순환
        jiyul.animTimer = 0;
    }
    
    // 적 애니메이션
    enemies.forEach(enemy => {
        if (enemy.alive) {
            enemy.animFrame = (enemy.animFrame + 1) % 2;
        }
    });
}

// UI 업데이트
function updateUI() {
    document.getElementById('score').textContent = gameState.score;
    document.getElementById('stageText').textContent = gameState.stage;
    document.getElementById('hp').textContent = Math.max(0, jiyul.hp);
}

// 렌더링 (카메라 시스템 적용)
function render() {
    // 화면 흔들림 효과 적용
    ctx.save();
    if (gameState.screenShake !== 0) {
        ctx.translate(
            Math.random() * gameState.screenShake - gameState.screenShake / 2,
            Math.random() * gameState.screenShake - gameState.screenShake / 2
        );
    }
    
    // 화면 지우기
    ctx.fillStyle = '#5C94FC';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 배경 그리기
    drawBackground();
    
    // 바닥 그리기
    ctx.fillStyle = '#228B22';
    ctx.fillRect(0, GROUND_Y + 16 * PIXEL_SCALE, canvas.width, canvas.height);
    
    // 장애물 그리기 (카메라 오프셋 적용)
    obstacles.forEach(obstacle => {
        const screenX = obstacle.x - gameState.cameraX;
        if (screenX > -100 && screenX < canvas.width + 100) {
            const data = pixelData[obstacle.type];
            drawPixelSprite(data.sprite, data.colorMap, screenX, obstacle.y - obstacle.height);
            
            // 장애물이 멈춘 이유라면 점프 힌트 표시
            if (!gameState.isMoving && Math.abs(jiyul.worldX - obstacle.x) < 100) {
                ctx.fillStyle = 'rgba(255, 255, 0, 0.5)';
                ctx.fillRect(screenX, obstacle.y - obstacle.height - 10, obstacle.width, 5);
            }
        }
    });
    
    // 적 그리기 (카메라 오프셋 적용)
    enemies.forEach(enemy => {
        if (!enemy.alive) return;
        const screenX = enemy.x - gameState.cameraX;
        if (screenX > -100 && screenX < canvas.width + 100) {
            const data = pixelData[enemy.type];
            drawPixelSprite(data.idle, data.colorMap, screenX, enemy.y - enemy.height);
            
            // 보스 어그로 상태 표시
            if (enemy.type === 'boss' && enemy.isAggro) {
                ctx.fillStyle = 'red';
                ctx.fillRect(screenX, enemy.y - enemy.height - 15, enemy.width, 3);
            }
        }
    });
    
    // 지율이 그리기 (화면 좌표 사용) - 오른쪽을 바라보도록 뒤집기
    const jiyulData = pixelData.jiyul;
    let sprite;
    
    // 애니메이션 상태에 따른 스프라이트 선택
    if (jiyul.isJumping) {
        sprite = jiyulData.jump;
    } else if (gameState.isMoving && !gameState.questionActive) {
        // 걷기 애니메이션 (0: idle, 1: walking1, 2: walking2)
        if (jiyulData.walking1 && jiyulData.walking2) {
            if (jiyul.animFrame === 1) {
                sprite = jiyulData.walking1;
            } else if (jiyul.animFrame === 2) {
                sprite = jiyulData.walking2;
            } else {
                sprite = jiyulData.idle;
            }
        } else {
            sprite = jiyulData.idle; // walking 스프라이트가 없으면 idle 사용
        }
    } else {
        sprite = jiyulData.idle;
    }
    
    // 일반적인 방법으로 그리기 (뒤집기 없이)
    drawPixelSprite(sprite, jiyulData.colorMap, jiyul.x, jiyul.y - jiyul.height);
    
    // 파티클 그리기
    particles.forEach(particle => {
        ctx.fillStyle = particle.color;
        ctx.fillRect(particle.x, particle.y, 4, 4);
    });
    
    // 텍스트 파티클 그리기 (새 기능)
    updateTextParticles(ctx);
    
    // 게임 상태 표시
    if (!gameState.isMoving && !gameState.questionActive) {
        ctx.fillStyle = 'rgba(255, 255, 0, 0.8)';
        ctx.font = 'bold 18px Jua';
        ctx.textAlign = 'center';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.strokeText('점프로 장애물을 뛰어넘으세요!', canvas.width / 2, 50);
        ctx.fillText('점프로 장애물을 뛰어넘으세요!', canvas.width / 2, 50);
    }
    
    // 화면 흔들림 효과 복원
    ctx.restore();
}

// 배경 그리기 (더욱 화려하고 아름다운 배경)
function drawBackground() {
    // 시간에 따른 하늘 색상 변화 (낮/노을/밤 느낌)
    const timePhase = (gameState.distance / 1000) % 3;
    let skyColors;
    
    if (timePhase < 1) {
        // 아침/낮 - 파란 하늘
        skyColors = ['#87CEEB', '#98D8E8', '#B0E0E6'];
    } else if (timePhase < 2) {
        // 노을 - 오렌지/핑크 하늘
        skyColors = ['#FF6B6B', '#FF8E8E', '#FFB6C1'];
    } else {
        // 밤 - 보라/남색 하늘
        skyColors = ['#2F1B69', '#4B0082', '#6A0DAD'];
    }
    
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, skyColors[0]);
    gradient.addColorStop(0.7, skyColors[1]);
    gradient.addColorStop(1, skyColors[2]);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 별과 달 (밤 시간대)
    if (timePhase >= 2) {
        drawStars();
        drawMoon();
    } else {
        // 태양과 구름 (낮/노을 시간대)
        drawSun(timePhase);
        drawClouds();
    }
    
    // 무지개 (가끔 등장)
    if (Math.sin(gameState.distance / 500) > 0.7) {
        drawRainbow();
    }
    
    // 원거리 산들 (다층 패럴랙스)
    drawMountainLayers();
    
    // 나무들과 식물들
    drawVegetation();
    
    // 꽃밭과 나비들
    drawFlowerField();
    
    // 새들과 구름 그림자
    drawFlyingElements();
    
    // 마법같은 파티클들
    drawMagicalParticles();
}

// 별들 그리기
function drawStars() {
    ctx.fillStyle = '#FFFF99';
    for (let i = 0; i < 50; i++) {
        const x = (i * 137 + gameState.distance * 0.1) % canvas.width;
        const y = (i * 71) % (canvas.height * 0.6);
        const size = 1 + (i % 3);
        
        // 반짝이는 효과
        const twinkle = Math.sin(gameState.distance * 0.05 + i) * 0.5 + 0.5;
        ctx.globalAlpha = twinkle;
        
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.globalAlpha = 1;
}

// 달 그리기
function drawMoon() {
    const moonX = canvas.width - 120;
    const moonY = 60;
    
    // 달 뒤 후광
    const moonGlow = ctx.createRadialGradient(moonX, moonY, 0, moonX, moonY, 80);
    moonGlow.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
    moonGlow.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = moonGlow;
    ctx.fillRect(moonX - 80, moonY - 80, 160, 160);
    
    // 달 본체
    ctx.fillStyle = '#F5F5DC';
    ctx.beginPath();
    ctx.arc(moonX, moonY, 35, 0, Math.PI * 2);
    ctx.fill();
    
    // 달 크레이터
    ctx.fillStyle = '#E6E6FA';
    ctx.beginPath();
    ctx.arc(moonX - 10, moonY - 5, 8, 0, Math.PI * 2);
    ctx.arc(moonX + 8, moonY + 10, 5, 0, Math.PI * 2);
    ctx.arc(moonX - 5, moonY + 15, 4, 0, Math.PI * 2);
    ctx.fill();
}

// 태양 그리기 (시간대별)
function drawSun(timePhase) {
    const sunX = canvas.width - 150;
    const sunY = 80 + Math.sin(timePhase) * 30;
    let sunColor = '#FFD700';
    
    if (timePhase >= 1) {
        // 노을 시간 - 붉은 태양
        sunColor = '#FF6347';
    }
    
    // 태양 후광
    const sunGlow = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, 100);
    sunGlow.addColorStop(0, sunColor + '80');
    sunGlow.addColorStop(1, sunColor + '00');
    ctx.fillStyle = sunGlow;
    ctx.fillRect(sunX - 100, sunY - 100, 200, 200);
    
    // 태양 본체
    ctx.fillStyle = sunColor;
    ctx.beginPath();
    ctx.arc(sunX, sunY, 40, 0, Math.PI * 2);
    ctx.fill();
    
    // 태양 광선
    ctx.strokeStyle = sunColor;
    ctx.lineWidth = 4;
    for (let i = 0; i < 12; i++) {
        const angle = (i * Math.PI * 2) / 12 + gameState.distance * 0.01;
        const length = 50 + Math.sin(gameState.distance * 0.1 + i) * 10;
        ctx.beginPath();
        ctx.moveTo(sunX + Math.cos(angle) * 50, sunY + Math.sin(angle) * 50);
        ctx.lineTo(sunX + Math.cos(angle) * length, sunY + Math.sin(angle) * length);
        ctx.stroke();
    }
}

// 구름들 그리기
function drawClouds() {
    const cloudOffset = (gameState.backgroundOffset * 0.3) % (canvas.width + 400);
    
    // 다양한 크기와 모양의 구름들
    const clouds = [
        {x: 100, y: 60, size: 1.2, opacity: 0.9},
        {x: 350, y: 40, size: 0.8, opacity: 0.7},
        {x: 600, y: 80, size: 1.5, opacity: 0.8},
        {x: 900, y: 50, size: 1.0, opacity: 0.9},
        {x: 1200, y: 70, size: 1.3, opacity: 0.6}
    ];
    
    clouds.forEach(cloud => {
        drawDetailedCloud(cloud.x - cloudOffset, cloud.y, cloud.size, cloud.opacity);
    });
}

// 상세한 구름 그리기
function drawDetailedCloud(x, y, size, opacity) {
    if (x < -200 || x > canvas.width + 200) return;
    
    ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
    
    // 구름의 여러 원들로 자연스러운 모양 만들기
    const circles = [
        {offsetX: 0, offsetY: 0, radius: 25 * size},
        {offsetX: 20 * size, offsetY: -5 * size, radius: 35 * size},
        {offsetX: 45 * size, offsetY: 0, radius: 25 * size},
        {offsetX: 25 * size, offsetY: -20 * size, radius: 20 * size},
        {offsetX: 60 * size, offsetY: -10 * size, radius: 18 * size}
    ];
    
    ctx.beginPath();
    circles.forEach(circle => {
        ctx.arc(x + circle.offsetX, y + circle.offsetY, circle.radius, 0, Math.PI * 2);
    });
    ctx.fill();
    
    // 구름 그림자
    ctx.fillStyle = `rgba(200, 200, 200, ${opacity * 0.3})`;
    ctx.beginPath();
    circles.forEach(circle => {
        ctx.arc(x + circle.offsetX + 5, y + circle.offsetY + 5, circle.radius * 0.9, 0, Math.PI * 2);
    });
    ctx.fill();
}

// 무지개 그리기
function drawRainbow() {
    const centerX = canvas.width * 0.7;
    const centerY = canvas.height;
    const rainbowColors = [
        '#FF0000', '#FF7F00', '#FFFF00', '#00FF00', 
        '#0000FF', '#4B0082', '#9400D3'
    ];
    
    ctx.globalAlpha = 0.6;
    rainbowColors.forEach((color, index) => {
        ctx.strokeStyle = color;
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.arc(centerX, centerY, 200 - index * 12, Math.PI, 0);
        ctx.stroke();
    });
    ctx.globalAlpha = 1;
}

// 산맥 레이어들 그리기
function drawMountainLayers() {
    // 가장 먼 산맥들 (보라색 계열) - 오른쪽에서 왼쪽으로 움직임
    const farOffset = (gameState.backgroundOffset * 0.1) % (canvas.width + 600);
    ctx.fillStyle = '#9370DB';
    // 여러 개의 산을 반복해서 그리기
    for (let i = 0; i < 3; i++) {
        const xPos = i * (canvas.width + 600) - farOffset;
        drawMountainRange(xPos, GROUND_Y - 180, 8, 150);
    }
    
    // 중간 산맥들 (파란색 계열)
    const midOffset = (gameState.backgroundOffset * 0.2) % (canvas.width + 500);
    ctx.fillStyle = '#4682B4';
    for (let i = 0; i < 3; i++) {
        const xPos = i * (canvas.width + 500) - midOffset;
        drawMountainRange(xPos, GROUND_Y - 130, 6, 120);
    }
    
    // 가까운 산맥들 (초록색 계열)
    const nearOffset = (gameState.backgroundOffset * 0.3) % (canvas.width + 400);
    ctx.fillStyle = '#228B22';
    for (let i = 0; i < 3; i++) {
        const xPos = i * (canvas.width + 400) - nearOffset;
        drawMountainRange(xPos, GROUND_Y - 80, 5, 100);
    }
}

// 산맥 그리기
function drawMountainRange(startX, baseY, count, maxHeight) {
    ctx.beginPath();
    ctx.moveTo(startX, baseY);
    
    for (let i = 0; i <= count; i++) {
        const x = startX + (i * (canvas.width + 200)) / count;
        const height = maxHeight * (0.5 + Math.sin(i * 0.7) * 0.5);
        ctx.lineTo(x, baseY - height);
    }
    
    ctx.lineTo(startX + canvas.width + 200, baseY);
    ctx.closePath();
    ctx.fill();
    
    // 산에 눈 덮인 봉우리
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    for (let i = 0; i <= count; i++) {
        const x = startX + (i * (canvas.width + 200)) / count;
        const height = maxHeight * (0.5 + Math.sin(i * 0.7) * 0.5);
        if (height > maxHeight * 0.7) {
            ctx.beginPath();
            ctx.arc(x, baseY - height, 15, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}

// 식물들 그리기
function drawVegetation() {
    const treeOffset = (gameState.backgroundOffset * 0.5) % (canvas.width + 400);
    
    // 다양한 나무들
    const trees = [
        {x: 120, type: 'pine', size: 1.0},
        {x: 280, type: 'oak', size: 1.2},
        {x: 450, type: 'pine', size: 0.8},
        {x: 620, type: 'birch', size: 1.1},
        {x: 800, type: 'oak', size: 1.3},
        {x: 950, type: 'pine', size: 0.9},
        {x: 1150, type: 'birch', size: 1.0}
    ];
    
    trees.forEach(tree => {
        drawDetailedTree(tree.x - treeOffset, GROUND_Y, tree.type, tree.size);
    });
}

// 상세한 나무 그리기
function drawDetailedTree(x, y, type, size) {
    if (x < -100 || x > canvas.width + 100) return;
    
    const trunkHeight = 60 * size;
    const trunkWidth = 12 * size;
    
    // 나무 기둥
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(x - trunkWidth/2, y - trunkHeight, trunkWidth, trunkHeight);
    
    // 나무 기둥 텍스처
    ctx.strokeStyle = '#654321';
    ctx.lineWidth = 1;
    for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(x - trunkWidth/2 + 2, y - trunkHeight + i * 20);
        ctx.lineTo(x + trunkWidth/2 - 2, y - trunkHeight + i * 20);
        ctx.stroke();
    }
    
    // 나무 종류별 잎사귀
    switch(type) {
        case 'pine':
            drawPineLeaves(x, y - trunkHeight, size);
            break;
        case 'oak':
            drawOakLeaves(x, y - trunkHeight + 10, size);
            break;
        case 'birch':
            drawBirchLeaves(x, y - trunkHeight + 5, size);
            break;
    }
}

// 소나무 잎 그리기
function drawPineLeaves(x, y, size) {
    ctx.fillStyle = '#228B22';
    // 삼각형 모양들
    for (let i = 0; i < 3; i++) {
        const leafY = y + i * 15 * size;
        const leafSize = (35 - i * 5) * size;
        ctx.beginPath();
        ctx.moveTo(x, leafY - leafSize);
        ctx.lineTo(x - leafSize/2, leafY);
        ctx.lineTo(x + leafSize/2, leafY);
        ctx.closePath();
        ctx.fill();
    }
}

// 참나무 잎 그리기
function drawOakLeaves(x, y, size) {
    ctx.fillStyle = '#32CD32';
    ctx.beginPath();
    ctx.arc(x, y, 35 * size, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#228B22';
    ctx.beginPath();
    ctx.arc(x - 20 * size, y - 10 * size, 20 * size, 0, Math.PI * 2);
    ctx.arc(x + 20 * size, y - 10 * size, 20 * size, 0, Math.PI * 2);
    ctx.fill();
}

// 자작나무 잎 그리기
function drawBirchLeaves(x, y, size) {
    ctx.fillStyle = '#90EE90';
    // 타원형 잎들
    for (let i = 0; i < 5; i++) {
        const angle = (i * Math.PI * 2) / 5;
        const leafX = x + Math.cos(angle) * 25 * size;
        const leafY = y + Math.sin(angle) * 15 * size;
        
        ctx.beginPath();
        ctx.ellipse(leafX, leafY, 12 * size, 8 * size, angle, 0, Math.PI * 2);
        ctx.fill();
    }
}

// 꽃밭 그리기
function drawFlowerField() {
    const flowerOffset = (gameState.backgroundOffset * 0.7) % (canvas.width + 300);
    
    // 잔디
    ctx.fillStyle = '#228B22';
    for (let i = 0; i < 50; i++) {
        const x = (i * 30 - flowerOffset) % (canvas.width + 100);
        if (x > -50 && x < canvas.width + 50) {
            drawGrass(x, GROUND_Y + 5);
        }
    }
    
    // 꽃들
    const flowers = [
        {x: 80, color: '#FF69B4', type: 'rose'},
        {x: 180, color: '#FFB6C1', type: 'daisy'},
        {x: 280, color: '#FF1493', type: 'tulip'},
        {x: 380, color: '#FFC0CB', type: 'rose'},
        {x: 480, color: '#FFD700', type: 'sunflower'},
        {x: 580, color: '#FF69B4', type: 'daisy'},
        {x: 680, color: '#9370DB', type: 'lavender'}
    ];
    
    flowers.forEach(flower => {
        drawDetailedFlower(flower.x - flowerOffset, GROUND_Y + 10, flower.color, flower.type);
    });
    
    // 나비들
    drawButterflies(flowerOffset);
}

// 잔디 그리기
function drawGrass(x, y) {
    ctx.strokeStyle = '#228B22';
    ctx.lineWidth = 2;
    for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(x + i * 3, y);
        ctx.lineTo(x + i * 3 + Math.random() * 4 - 2, y - 8 - Math.random() * 5);
        ctx.stroke();
    }
}

// 상세한 꽃 그리기
function drawDetailedFlower(x, y, color, type) {
    if (x < -50 || x > canvas.width + 50) return;
    
    // 꽃 줄기
    ctx.strokeStyle = '#228B22';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x, y - 25);
    ctx.stroke();
    
    // 잎사귀
    ctx.fillStyle = '#32CD32';
    ctx.beginPath();
    ctx.ellipse(x - 8, y - 15, 5, 10, -0.5, 0, Math.PI * 2);
    ctx.ellipse(x + 8, y - 12, 5, 10, 0.5, 0, Math.PI * 2);
    ctx.fill();
    
    // 꽃 종류별 그리기
    switch(type) {
        case 'rose':
            drawRose(x, y - 25, color);
            break;
        case 'daisy':
            drawDaisy(x, y - 25, color);
            break;
        case 'tulip':
            drawTulip(x, y - 25, color);
            break;
        case 'sunflower':
            drawSunflower(x, y - 25);
            break;
        case 'lavender':
            drawLavender(x, y - 25, color);
            break;
    }
}

// 장미 그리기
function drawRose(x, y, color) {
    ctx.fillStyle = color;
    for (let i = 0; i < 6; i++) {
        const angle = (i * Math.PI * 2) / 6;
        const petalX = x + Math.cos(angle) * 6;
        const petalY = y + Math.sin(angle) * 6;
        ctx.beginPath();
        ctx.ellipse(petalX, petalY, 8, 4, angle, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // 중심
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, Math.PI * 2);
    ctx.fill();
}

// 데이지 그리기
function drawDaisy(x, y, color) {
    ctx.fillStyle = color;
    for (let i = 0; i < 8; i++) {
        const angle = (i * Math.PI * 2) / 8;
        ctx.beginPath();
        ctx.ellipse(x + Math.cos(angle) * 8, y + Math.sin(angle) * 8, 4, 8, angle, 0, Math.PI * 2);
        ctx.fill();
    }
    
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fill();
}

// 튤립 그리기
function drawTulip(x, y, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(x, y, 8, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.beginPath();
    ctx.ellipse(x - 2, y - 3, 3, 6, 0, 0, Math.PI * 2);
    ctx.fill();
}

// 해바라기 그리기
function drawSunflower(x, y) {
    // 노란 꽃잎들
    ctx.fillStyle = '#FFD700';
    for (let i = 0; i < 12; i++) {
        const angle = (i * Math.PI * 2) / 12;
        ctx.beginPath();
        ctx.ellipse(x + Math.cos(angle) * 12, y + Math.sin(angle) * 12, 5, 10, angle, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // 갈색 중심
    ctx.fillStyle = '#8B4513';
    ctx.beginPath();
    ctx.arc(x, y, 8, 0, Math.PI * 2);
    ctx.fill();
    
    // 씨앗 패턴
    ctx.fillStyle = '#654321';
    for (let i = 0; i < 16; i++) {
        const angle = (i * Math.PI * 2) / 16;
        const dotX = x + Math.cos(angle) * 5;
        const dotY = y + Math.sin(angle) * 5;
        ctx.beginPath();
        ctx.arc(dotX, dotY, 1, 0, Math.PI * 2);
        ctx.fill();
    }
}

// 라벤더 그리기
function drawLavender(x, y, color) {
    ctx.fillStyle = color;
    for (let i = 0; i < 5; i++) {
        ctx.beginPath();
        ctx.arc(x + (i - 2) * 2, y - i * 3, 2, 0, Math.PI * 2);
        ctx.fill();
    }
}

// 나비들 그리기
function drawButterflies(offset) {
    const butterflies = [
        {x: 200, y: GROUND_Y - 40, color1: '#FF69B4', color2: '#FFB6C1'},
        {x: 450, y: GROUND_Y - 60, color1: '#9370DB', color2: '#DDA0DD'},
        {x: 700, y: GROUND_Y - 35, color1: '#FFD700', color2: '#FFFF99'}
    ];
    
    butterflies.forEach(butterfly => {
        const x = butterfly.x - offset * 0.8; // 방향 변경
        if (x > -50 && x < canvas.width + 50) {
            drawButterfly(x, butterfly.y, butterfly.color1, butterfly.color2);
        }
    });
}

// 나비 그리기
function drawButterfly(x, y, color1, color2) {
    const wingOffset = Math.sin(gameState.distance * 0.1) * 2;
    
    // 몸통
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(x - 1, y - 8, 2, 16);
    
    // 날개들
    ctx.fillStyle = color1;
    ctx.beginPath();
    ctx.ellipse(x - 5, y - 3 + wingOffset, 6, 8, 0, 0, Math.PI * 2);
    ctx.ellipse(x + 5, y - 3 + wingOffset, 6, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = color2;
    ctx.beginPath();
    ctx.ellipse(x - 5, y + 5 - wingOffset, 4, 6, 0, 0, Math.PI * 2);
    ctx.ellipse(x + 5, y + 5 - wingOffset, 4, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // 더듬이
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x - 2, y - 8);
    ctx.lineTo(x - 4, y - 12);
    ctx.moveTo(x + 2, y - 8);
    ctx.lineTo(x + 4, y - 12);
    ctx.stroke();
}

// 날아다니는 요소들
function drawFlyingElements() {
    // 새들 (개선된 버전)
    const birdOffset = (gameState.backgroundOffset * 0.6) % (canvas.width + 500);
    const birds = [
        {x: 150, y: 80, type: 'seagull'},
        {x: 400, y: 120, type: 'sparrow'},
        {x: 650, y: 60, type: 'eagle'},
        {x: 900, y: 100, type: 'sparrow'}
    ];
    
    birds.forEach(bird => {
        drawDetailedBird(bird.x - birdOffset, bird.y, bird.type); // 방향 변경
    });
    
    // 민들레 씨앗들
    drawDandelionSeeds();
}

// 상세한 새 그리기
function drawDetailedBird(x, y, type) {
    if (x < -50 || x > canvas.width + 50) return;
    
    const wingFlap = Math.sin(gameState.distance * 0.2) * 5;
    
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    
    switch(type) {
        case 'seagull':
            // 갈매기 - 큰 날개
            ctx.beginPath();
            ctx.moveTo(x - 15, y + wingFlap);
            ctx.lineTo(x, y - 8);
            ctx.lineTo(x + 15, y + wingFlap);
            ctx.stroke();
            break;
        case 'sparrow':
            // 참새 - 작은 날개
            ctx.beginPath();
            ctx.moveTo(x - 8, y + wingFlap);
            ctx.lineTo(x, y - 4);
            ctx.lineTo(x + 8, y + wingFlap);
            ctx.stroke();
            break;
        case 'eagle':
            // 독수리 - 큰 날개, 더 긴 날개폭
            ctx.beginPath();
            ctx.moveTo(x - 20, y + wingFlap);
            ctx.lineTo(x, y - 10);
            ctx.lineTo(x + 20, y + wingFlap);
            ctx.stroke();
            break;
    }
}

// 민들레 씨앗들
function drawDandelionSeeds() {
    for (let i = 0; i < 15; i++) {
        const x = (i * 150 + gameState.distance * 0.3) % (canvas.width + 100);
        const y = 50 + Math.sin(gameState.distance * 0.05 + i) * 30;
        
        if (x > -20 && x < canvas.width + 20) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.beginPath();
            ctx.arc(x, y, 2, 0, Math.PI * 2);
            ctx.fill();
            
            // 씨앗 털
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
            ctx.lineWidth = 1;
            for (let j = 0; j < 6; j++) {
                const angle = (j * Math.PI * 2) / 6;
                ctx.beginPath();
                ctx.moveTo(x, y);
                ctx.lineTo(x + Math.cos(angle) * 6, y + Math.sin(angle) * 6);
                ctx.stroke();
            }
        }
    }
}

// 마법같은 파티클들
function drawMagicalParticles() {
    for (let i = 0; i < 25; i++) {
        const x = (i * 200 + gameState.distance * 0.4) % (canvas.width + 150);
        const y = GROUND_Y - 100 + Math.sin(gameState.distance * 0.03 + i) * 50;
        
        if (x > -30 && x < canvas.width + 30) {
            const alpha = (Math.sin(gameState.distance * 0.05 + i) + 1) * 0.3;
            const colors = ['#FFD700', '#FF69B4', '#87CEEB', '#98FB98', '#DDA0DD'];
            const color = colors[i % colors.length];
            
            ctx.fillStyle = color + Math.floor(alpha * 255).toString(16).padStart(2, '0');
            ctx.beginPath();
            ctx.arc(x, y, 3 + Math.sin(gameState.distance * 0.08 + i) * 2, 0, Math.PI * 2);
            ctx.fill();
            
            // 반짝이는 효과
            if (Math.random() < 0.1) {
                ctx.fillStyle = '#FFFFFF';
                ctx.beginPath();
                ctx.arc(x, y, 1, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }
}

// 메뉴 표시
function showMenu() {
    gameState.running = false;
    document.getElementById('selectMenu').style.display = 'flex';
    document.getElementById('ui').style.display = 'none';
    document.getElementById('questionPanel').style.display = 'none';
}

// 도움말 표시
function showHelp() {
    alert('🌸 지율이의 픽셀 수학 게임 도움말 🌸\n\n' +
          '1. 구구단이나 연산을 선택하고 시작하세요!\n' +
          '2. 점프 버튼으로 장애물을 뛰어넘으세요!\n' +
          '3. 장애물에 막히면 화면이 멈춰요!\n' +
          '4. 움직이는 몬스터를 만나면 수학 문제를 풀어요!\n' +
          '5. 정답을 맞추면 몬스터를 물리칠 수 있어요!\n\n' +
          '💕 지율이 화이팅! 💕');
}

// 구구단 선택 함수
function toggleDan(dan) {
    console.log('toggleDan 호출됨, dan:', dan);
    
    const index = gameState.selectedDans.indexOf(dan);
    const button = document.querySelector(`[data-dan="${dan}"]`);
    
    if (!button) {
        console.error('버튼을 찾을 수 없음, dan:', dan);
        return;
    }
    
    if (index === -1) {
        gameState.selectedDans.push(dan);
        button.classList.add('selected');
        console.log('구구단 추가됨:', dan);
    } else {
        gameState.selectedDans.splice(index, 1);
        button.classList.remove('selected');
        console.log('구구단 제거됨:', dan);
    }
    
    console.log('현재 선택된 구구단:', gameState.selectedDans);
    updateSelectedDisplay();
}

// 게임 오버
function gameOver() {
    gameState.running = false;
    alert(`게임 오버! 😢\n최종 점수: ${gameState.score}점\n다시 도전해보세요!`);
    showMenu();
}

// 다음 스테이지
function nextStage() {
    gameState.stage++;
    gameState.speed += 0.5;
    alert(`🎉 스테이지 ${gameState.stage - 1} 클리어! 🎉\n스테이지 ${gameState.stage}로 이동합니다!`);
    
    // 새로운 몬스터들 추가 (기존 몬스터는 유지)
    generateMoreEnemies();
}

// 파티클 생성 (개선된 버전)
function createParticles(x, y, type) {
    const colors = {
        'hit': ['#FFD700', '#FFA500', '#FF6347'],
        'defeat': ['#32CD32', '#00FF00', '#7FFF00'],
        'hurt': ['#FF0000', '#DC143C', '#8B0000'],
        'hint': ['#FFFF00', '#FFD700', '#FFA500']
    };
    
    const particleColors = colors[type] || colors['hit'];
    const particleCount = type === 'hint' ? 5 : 10;
    
    for (let i = 0; i < particleCount; i++) {
        particles.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 8,
            vy: Math.random() * -10 - 5,
            color: particleColors[Math.floor(Math.random() * particleColors.length)],
            life: type === 'hint' ? 20 : 30
        });
    }
}

// 파티클 업데이트
function updateParticles() {
    particles = particles.filter(particle => {
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.vy += 0.5;
        particle.life--;
        return particle.life > 0;
    });
}

// 점프 함수 (개선된 버전)
function jump() {
    if (jiyul.onGround && !gameState.questionActive) {
        const jumpPower = getJumpPower(); // 디바이스별 점프 파워 사용
        jiyul.velocityY = jumpPower;
        
        // 모바일에서는 전진 속도도 조정
        const forwardSpeed = isMobileDevice() ? JUMP_FORWARD_SPEED * 1.2 : JUMP_FORWARD_SPEED * 1.5;
        jiyul.velocityX = forwardSpeed;
        
        jiyul.isJumping = true;
        jiyul.onGround = false;
        
        // 점프 시 화면 이동 강제 재개
        gameState.isMoving = true;
        
        // 점프 효과음 대신 파티클
        createParticles(jiyul.x, jiyul.y, 'hint');
        
        // 점수 보너스 (점프 성공)
        gameState.score += 1;
        updateUI();
    }
}

// 초기 캔버스 설정
resizeCanvas();

// 이벤트 리스너 설정
window.addEventListener('resize', resizeCanvas);
window.addEventListener('orientationchange', () => {
    setTimeout(resizeCanvas, 100);
});
document.addEventListener('fullscreenchange', () => {
    setTimeout(resizeCanvas, 100);
});

// ========== 이벤트 리스너 설정 ==========
// DOM이 완전히 로드된 후 실행
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM 완전 로드됨');
    setupEventListeners();
});

// 만약 이미 로드된 상태라면 즉시 실행
if (document.readyState === 'loading') {
    // 위의 DOMContentLoaded 이벤트가 처리함
} else {
    // DOM이 이미 로드된 상태
    setupEventListeners();
}

function setupEventListeners() {
    console.log('이벤트 리스너 설정 시작');
    
    // 모바일 키보드 전역 방지
    document.addEventListener('touchstart', function(e) {
        if (e.target.id === 'answerInput') {
            e.preventDefault();
            e.stopPropagation();
            document.activeElement.blur();
        }
    }, { passive: false });
    
    // 구구단 버튼들
    const danButtons = document.querySelectorAll('.dan-btn');
    console.log('구구단 버튼 개수:', danButtons.length);
    
    danButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            const dan = parseInt(this.getAttribute('data-dan'));
            toggleDan(dan);
        });
    });

    // 연산 버튼들
    const operatorButtons = document.querySelectorAll('.operator-btn');
    console.log('연산 버튼 개수:', operatorButtons.length);
    
    operatorButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            const op = this.getAttribute('data-op');
            toggleOperator(op);
        });
    });

    // 기타 버튼들
    const startBtn = document.getElementById('startGameBtn');
    if (startBtn) {
        startBtn.addEventListener('click', function(e) {
            e.preventDefault();
            if (!this.disabled) {
                startSelectedGame();
            }
        });
    }
    
    const fullscreenBtn = document.getElementById('fullscreenBtn');
    if (fullscreenBtn) {
        fullscreenBtn.addEventListener('click', toggleFullscreen);
    }
    
    const jumpBtn = document.getElementById('jumpBtn');
    if (jumpBtn) {
        jumpBtn.addEventListener('click', jump);
    }
    
    const menuBtn = document.getElementById('menuBtn');
    if (menuBtn) {
        menuBtn.addEventListener('click', showMenu);
    }
    
    const helpBtn = document.getElementById('helpBtn');
    if (helpBtn) {
        helpBtn.addEventListener('click', showHelp);
    }
    
    const submitBtn = document.getElementById('submitBtn');
    if (submitBtn) {
        submitBtn.addEventListener('click', submitAnswer);
    }

    // 엔터키 이벤트
    const answerInput = document.getElementById('answerInput');
    if (answerInput) {
        answerInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                submitAnswer();
            }
        });
    }

    // 커스텀 키보드 이벤트
    const keyButtons = document.querySelectorAll('.key-btn');
    console.log('키보드 버튼 개수:', keyButtons.length);

    keyButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            const key = this.getAttribute('data-key');
            handleKeyPress(key);
        });
    });
    
    console.log('모든 이벤트 설정 완료');
}

// 커스텀 키보드 처리 함수
function handleKeyPress(key) {
    const answerInput = document.getElementById('answerInput');
    if (!answerInput) return;
    
    if (key === 'clear') {
        // 전체 지우기 (하트 버튼)
        answerInput.value = '';
        // 귀여운 효과
        answerInput.style.transform = 'scale(1.1)';
        setTimeout(() => {
            answerInput.style.transform = 'scale(1)';
        }, 200);
    } else if (key === 'back') {
        // 한 글자 지우기
        answerInput.value = answerInput.value.slice(0, -1);
    } else {
        // 숫자 입력 (최대 3자리로 제한)
        if (answerInput.value.length < 3) {
            answerInput.value += key;
            // 입력 효과
            answerInput.style.backgroundColor = '#FFE4E1';
            setTimeout(() => {
                answerInput.style.backgroundColor = '#FFF';
            }, 100);
        }
    }
}
