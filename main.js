// 영어 게임 로직 - 메인 파일 (모바일 최적화 수정된 버전)

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;

// 픽셀 스케일과 물리 상수
let PIXEL_SCALE = 3;
const GRAVITY = 0.8;
let JUMP_POWER = -18;
const JUMP_FORWARD_SPEED = 6;
let GROUND_Y = 240;

// 오프닝 실행 여부 체크
let hasSeenOpening = false;

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
        basePower = -22; // 모바일에서 더 강한 점프력
    } else {
        basePower = -18;
    }
    
    // 탈것을 탄 경우 점프력 증가
    if (gameState.selectedVehicle === 'kiwi') {
        basePower *= 1.3;
    } else if (gameState.selectedVehicle === 'whitehouse') {
        basePower *= 1.2;
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
    isBlocked: false
};

// 단어 관리자 초기화
let wordManager;

// 게임 통계
let gameStats = {
    startTime: null,
    correctAnswers: 0,
    totalQuestions: 0
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

// 전체화면 상태 추적 변수
let isFullscreenDesired = false;
let isUserExiting = false;

// 캔버스 크기 조정 (모바일 최적화)
function resizeCanvas() {
    const container = document.getElementById('gameContainer');
    const controls = document.getElementById('controls');
    const controlsHeight = controls ? controls.offsetHeight : 0;
    
    let screenWidth = window.innerWidth;
    let screenHeight = window.innerHeight - controlsHeight;
    
    // 모바일에서 실제 화면 크기 사용
    if (isMobileDevice()) {
        screenWidth = Math.max(window.innerWidth, window.screen.width);
        screenHeight = Math.max(window.innerHeight - controlsHeight, window.screen.height - controlsHeight);
        
        // 모바일에서 최소 크기 보장
        if (screenWidth < 320) screenWidth = 320;
        if (screenHeight < 240) screenHeight = 240;
    }
    
    canvas.width = screenWidth;
    canvas.height = screenHeight;
    
    // 화면 비율과 크기에 따른 PIXEL_SCALE 조정
    const aspectRatio = screenWidth / screenHeight;
    
    if (isMobileDevice()) {
        // 모바일에서는 더 큰 픽셀 스케일 사용
        if (screenWidth < 480) {
            PIXEL_SCALE = 2;
        } else if (screenWidth < 768) {
            PIXEL_SCALE = 3;
        } else {
            PIXEL_SCALE = 4;
        }
    } else {
        // 데스크톱 로직
        if (aspectRatio > 1.5) {
            PIXEL_SCALE = Math.floor(screenHeight / 150);
        } else if (aspectRatio > 1) {
            PIXEL_SCALE = Math.floor(screenHeight / 120);
        } else {
            PIXEL_SCALE = Math.floor(screenWidth / 150);
        }
    }
    
    // 픽셀 스케일 범위 제한
    PIXEL_SCALE = Math.max(2, Math.min(6, PIXEL_SCALE));
    
    // 플레이어 크기 업데이트
    if (player) {
        player.width = 16 * PIXEL_SCALE;
        player.height = 16 * PIXEL_SCALE;
    }
    
    // 지면 위치 조정
    const groundRatio = isMobileDevice() ? 0.75 : (aspectRatio > 1 ? 0.7 : 0.75);
    GROUND_Y = screenHeight * groundRatio;
    
    // 장애물 위치 업데이트
    if (obstacles && obstacles.length > 0) {
        obstacles.forEach(obstacle => {
            obstacle.y = GROUND_Y - (16 * PIXEL_SCALE);
            obstacle.width = 16 * PIXEL_SCALE;
            obstacle.height = 16 * PIXEL_SCALE;
        });
    }
    
    // 적 위치 업데이트
    if (enemies && enemies.length > 0) {
        enemies.forEach(enemy => {
            enemy.y = GROUND_Y;
            enemy.width = 16 * PIXEL_SCALE;
            enemy.height = 16 * PIXEL_SCALE;
        });
    }
    
    // 플레이어 위치 재설정
    if (player && gameState && !gameState.questionActive) {
        player.y = GROUND_Y;
        player.velocityY = 0;
        player.onGround = true;
        player.isJumping = false;
    }
    
    console.log(`화면 크기 조정: ${screenWidth}x${screenHeight}, PIXEL_SCALE: ${PIXEL_SCALE}, GROUND_Y: ${GROUND_Y}`);
}

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
        document.getElementById('fullscreenBtn').textContent = 'EXIT';
    } else {
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
            font-family: 'Jua', sans-serif;
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

// 전체화면 자동 복구 함수
function restoreFullscreen() {
    if (!isFullscreenDesired || isUserExiting) return;
    
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    if (isIOS) return;
    
    if (!document.fullscreenElement && 
        !document.webkitFullscreenElement && 
        !document.mozFullScreenElement && 
        !document.msFullscreenElement) {
        
        const elem = document.documentElement;
        
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

// 전체화면 변경 처리 함수
function handleFullscreenChange() {
    setTimeout(resizeCanvas, 100);
    
    const isCurrentlyFullscreen = !!(document.fullscreenElement || 
                                    document.webkitFullscreenElement || 
                                    document.mozFullScreenElement || 
                                    document.msFullscreenElement);
    
    if (isCurrentlyFullscreen) {
        document.getElementById('fullscreenBtn').textContent = 'EXIT';
        isUserExiting = false;
    } else {
        document.getElementById('fullscreenBtn').textContent = 'FULL';
        
        if (isFullscreenDesired && !isUserExiting) {
            restoreFullscreen();
        }
    }
}

// iOS 체크 함수
function checkIOSFullscreen() {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    const isStandalone = window.navigator.standalone === true;
    
    if (isIOS && !isStandalone) {
        const fullscreenBtn = document.getElementById('fullscreenBtn');
        if (fullscreenBtn) {
            fullscreenBtn.textContent = '🏠 추가';
        }
    }
}

// 게임 초기화
function initGame() {
    console.log('🎮 게임 초기화 시작...');
    
    gameState.running = true;
    gameState.score = 0;
    gameState.stage = 1;
    gameState.distance = 0;
    gameState.speed = 4;
    gameState.questionActive = false;
    gameState.isMoving = true;
    gameState.cameraX = 0;
    gameState.bossSpawned = false;
    gameState.isBlocked = false;
	
    document.getElementById('questionPanel').style.display = 'none';
    document.getElementById('ui').style.display = 'block';
    document.getElementById('fullscreenBtn').style.display = 'block';
    document.getElementById('controls').style.display = 'flex';
    
    player.sprite = gameState.selectedCharacter;
    player.x = 100;
    player.worldX = 100;
    player.y = GROUND_Y;
    player.hp = 100;
    player.velocityY = 0;
    player.velocityX = 0;
    player.onGround = true;
    player.isJumping = false;
    
    gameStats.startTime = Date.now();
    gameStats.correctAnswers = 0;
    gameStats.totalQuestions = 0;
    
    if (typeof initParticleSystem === 'function') {
        initParticleSystem();
    }
    
    if (typeof WordManager !== 'undefined') {
        wordManager = new WordManager();
        console.log('✅ WordManager 초기화 완료!');
    } else {
        console.error('❌ WordManager 클래스를 찾을 수 없습니다!');
    }
    
    generateLevel();
    gameLoop();
    updateUI();
    
    console.log('✅ 게임 초기화 완료!');
}

// 레벨 생성
function generateLevel() {
    obstacles = [];
    enemies = [];
    generateInitialObstacles();
    generateMoreEnemies();
}

// 초기 장애물 생성 (모바일 최적화)
function generateInitialObstacles() {
    const baseSpacing = isMobileDevice() ? 250 : 200; // 모바일에서 장애물 간격 증가
    const obstacleSpacing = baseSpacing + Math.random() * 150;
    
    for (let i = 0; i < 12; i++) {
        const types = ['rock', 'spike', 'pipe'];
        const type = types[Math.floor(Math.random() * types.length)];
        
        obstacles.push({
            x: 600 + i * obstacleSpacing,
            y: GROUND_Y - (16 * PIXEL_SCALE),
            width: 16 * PIXEL_SCALE,
            height: 16 * PIXEL_SCALE,
            type: type,
            passed: false,
            colliding: false
        });
    }
}

// 스테이지별 알파벳 가져오기
function getStageAlphabets(stage) {
    if (stage === 20) {
        const allAlphabets = [];
        for (let i = 0; i < 26; i++) {
            allAlphabets.push(String.fromCharCode(65 + i));
        }
        return allAlphabets;
    }
    
    const startIndex = ((stage - 1) * 2) % 26;
    const alphabet1 = String.fromCharCode(65 + startIndex);
    const alphabet2 = String.fromCharCode(65 + ((startIndex + 1) % 26));
    
    return [alphabet1, alphabet2];
}

// 몬스터 무한 생성
function generateMoreEnemies() {
    const currentMaxX = Math.max(...enemies.map(e => e.x), player.worldX);
    const startX = Math.max(currentMaxX + 300, player.worldX + 800);
    
    const stageAlphabets = getStageAlphabets(gameState.stage);
    
    for (let i = 0; i < 5; i++) {
        const baseSpeed = 1.5 + (gameState.stage - 1) * 0.5;
        const direction = Math.random() > 0.5 ? 1 : -1;
        
        let monsterType;
        if (gameState.stage === 20) {
            const randomAlphabet = stageAlphabets[Math.floor(Math.random() * stageAlphabets.length)];
            monsterType = `alphabet${randomAlphabet}`;
        } else {
            const randomAlphabet = stageAlphabets[Math.floor(Math.random() * stageAlphabets.length)];
            monsterType = `alphabet${randomAlphabet}`;
        }
        
        const enemyX = startX + i * 400 + Math.random() * 200;
        
        enemies.push({
            x: enemyX,
            y: GROUND_Y,
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
    const canMove = gameState.isMoving && !gameState.questionActive && 
                   (!gameState.isBlocked || player.isJumping);
    
    if (canMove) {
        gameState.distance += gameState.speed;
        gameState.backgroundOffset += gameState.speed * 0.5;
        gameState.cameraX += gameState.speed;
        player.worldX += gameState.speed;
    }

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
    
    if (typeof updateParticleSystem === 'function') {
        updateParticleSystem();
    }

    generateObstaclesIfNeeded();

    enemies = enemies.filter(enemy => 
        enemy.alive && (enemy.x > gameState.cameraX - 500)
    );

    obstacles = obstacles.filter(obstacle => 
        obstacle.x > gameState.cameraX - 500
    );

    const aheadEnemies = enemies.filter(enemy => 
        enemy.x > player.worldX && enemy.x < player.worldX + 2000
    );
    
    if (aheadEnemies.length < 3) {
        generateMoreEnemies();
    }
    
    if (gameState.stage === 20 && !gameState.bossSpawned && 
        gameState.distance > (gameState.stage * 3000) - 1000) {
        
        const bossX = player.worldX + 600;
        enemies.push({
            x: bossX,
            y: GROUND_Y,
            width: 16 * PIXEL_SCALE,
            height: 16 * PIXEL_SCALE,
            hp: 3,
            maxHp: 3,
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
            aggroRange: 500,
            isAggro: false,
            isBoss: true
        });
        
        gameState.bossSpawned = true;
        console.log('🐉 보스 등장!');
    }

    const stageDistance = gameState.stage * 2000;
    if (gameState.distance > stageDistance) {
        if (gameState.stage >= 20) {
            if (typeof showEnding === 'function') {
                showEnding();
            } else {
                showEndingWithRecord();
            }
            return;
        }
        nextStage();
    }
}

// 동적 장애물 생성 함수 (모바일 최적화)
function generateObstaclesIfNeeded() {
    const aheadObstacles = obstacles.filter(obstacle => 
        obstacle.x > player.worldX && obstacle.x < player.worldX + 1500
    );
    
    if (aheadObstacles.length < 5) {
        const maxObstacleX = obstacles.length > 0 ? 
            Math.max(...obstacles.map(o => o.x)) : player.worldX;
        
        const startX = Math.max(maxObstacleX + 200, player.worldX + 800);
        const newObstacleCount = 3 + Math.floor(Math.random() * 3);
        
        for (let i = 0; i < newObstacleCount; i++) {
            const types = ['rock', 'spike', 'pipe'];
            let type;
            
            if (gameState.stage >= 15) {
                const hardTypes = ['spike', 'pipe', 'rock'];
                const weights = [4, 3, 1];
                type = weightedRandomChoice(hardTypes, weights);
            } else if (gameState.stage >= 8) {
                type = types[Math.floor(Math.random() * types.length)];
            } else {
                const easyTypes = ['rock', 'spike', 'pipe'];
                const weights = [3, 2, 1];
                type = weightedRandomChoice(easyTypes, weights);
            }
            
            // 모바일에서 장애물 간격 증가
            const baseSpacing = isMobileDevice() ? 200 : 150;
            const spacing = baseSpacing + Math.random() * 200 + (gameState.stage * 10);
            const obstacleX = startX + i * spacing;
            
            obstacles.push({
                x: obstacleX,
                y: GROUND_Y - (16 * PIXEL_SCALE),
                width: 16 * PIXEL_SCALE,
                height: 16 * PIXEL_SCALE,
                type: type,
                passed: false,
                colliding: false
            });
        }
    }
}

// 가중치 기반 랜덤 선택 함수
function weightedRandomChoice(choices, weights) {
    const totalWeight = weights.reduce((a, b) => a + b, 0);
    const random = Math.random() * totalWeight;
    let sum = 0;
    
    for (let i = 0; i < choices.length; i++) {
        sum += weights[i];
        if (random < sum) {
            return choices[i];
        }
    }
    
    return choices[0];
}

// 플레이어 물리 업데이트 (모바일 최적화)
function updatePlayerPhysics() {
    if (!player.onGround) {
        player.velocityY += GRAVITY;
    }
    
    player.y += player.velocityY;
    
    if (player.velocityX !== 0) {
        if (player.isJumping || !gameState.isBlocked) {
            player.worldX += player.velocityX;
        }
        
        const friction = player.isJumping ? 0.98 : 0.92;
        player.velocityX *= friction;
        if (Math.abs(player.velocityX) < 0.1) {
            player.velocityX = 0;
        }
    }
    
    if (player.y >= GROUND_Y) {
        player.y = GROUND_Y;
        player.velocityY = 0;
        player.onGround = true;
        player.isJumping = false;
        
        if (player.velocityX > 2 && typeof createParticles === 'function') {
            createParticles(player.x, player.y, 'hint');
        }
    }
    
    const targetScreenX = canvas.width / 4;
    player.x = targetScreenX;
    gameState.cameraX = player.worldX - targetScreenX;
}

// 몬스터 물리 처리
function updateEnemyPhysics() {
    enemies.forEach(enemy => {
        if (!enemy.alive) return;
        
        const enemyScreenX = enemy.x - gameState.cameraX;
        
        if (enemyScreenX > -200 && enemyScreenX < canvas.width + 200) {
            if (enemy.type === 'boss') {
                const distanceToPlayer = Math.abs(enemy.x - player.worldX);
                
                if (distanceToPlayer < enemy.aggroRange) {
                    enemy.isAggro = true;
                    if (enemy.x > player.worldX) {
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
            
            if (enemy.isMoving && !gameState.questionActive) {
                enemy.x += enemy.walkSpeed * enemy.direction;
                
                if (enemy.patrolStart && enemy.patrolRange) {
                    if (enemy.x <= enemy.patrolStart - enemy.patrolRange || 
                        enemy.x >= enemy.patrolStart + enemy.patrolRange) {
                        enemy.direction *= -1;
                    }
                }
                
                if (Math.random() < 0.005 && enemy.onGround && enemy.jumpCooldown <= 0) {
                    enemy.velocityY = getJumpPower() * 0.7;
                    enemy.isJumping = true;
                    enemy.onGround = false;
                    enemy.jumpCooldown = 90 + Math.random() * 60;
                }
            }
        }
        
        if (enemy.jumpCooldown > 0) {
            enemy.jumpCooldown--;
        }
        
        if (!enemy.onGround) {
            enemy.velocityY += GRAVITY;
            enemy.y += enemy.velocityY;
            
            if (enemy.y >= GROUND_Y) {
                enemy.y = GROUND_Y;
                enemy.velocityY = 0;
                enemy.onGround = true;
                enemy.isJumping = false;
            }
        } else {
            enemy.y = GROUND_Y;
        }
    });
}

// 충돌 체크 (모바일 최적화)
function checkCollisions() {
    // 장애물 충돌 검사
    obstacles.forEach(obstacle => {
        const obstacleScreenX = obstacle.x - gameState.cameraX;
        
        if (obstacleScreenX > -100 && obstacleScreenX < canvas.width + 100) {
            const playerBox = {
                x: player.worldX, 
                y: player.y, 
                width: player.width, 
                height: player.height
            };
            
            const obstacleBox = {
                x: obstacle.x, 
                y: obstacle.y,
                width: obstacle.width, 
                height: obstacle.height
            };
            
            if (checkBoxCollision(playerBox, obstacleBox)) {
                if (obstacle.type === 'spike') {
                    if (!obstacle.passed) {
                        obstacle.passed = true;
                        player.hp -= 10;
                        if (typeof createParticles === 'function') {
                            createParticles(player.x, player.y, 'hurt');
                        }
                        gameState.score += 5;
                        updateUI();
                        
                        if (player.hp <= 0) {
                            gameOverWithRecord();
                            return;
                        }
                    }
                } else {
                    if (!obstacle.colliding) {
                        obstacle.colliding = true;
                        player.worldX = obstacle.x - player.width - 5;
                        player.velocityX = 0;
                        gameState.isMoving = false;
                        gameState.isBlocked = true;
                        gameState.shakeTimer = 10;
                    }
                    
                    if (player.worldX + player.width > obstacle.x - 5) {
                        player.worldX = obstacle.x - player.width - 5;
                        player.velocityX = 0;
                        gameState.isMoving = false;
                        gameState.isBlocked = true;
                    }
                    
                    if (Math.random() < 0.05 && typeof createParticles === 'function') {
                        createParticles(player.x, player.y - 30, 'hint');
                    }
                }
            } else {
                if (obstacle.colliding) {
                    obstacle.colliding = false;
                }
                
                if (player.worldX > obstacle.x + obstacle.width + 10 && !obstacle.passed) {
                    obstacle.passed = true;
                    gameState.isMoving = true;
                    gameState.isBlocked = false;
                    gameState.score += 10;
                    
                    if (typeof createParticles === 'function') {
                        createParticles(player.x, player.y - 20, 'hint');
                    }
                    
                    updateUI();
                }
            }
        }
    });
    
    // 적 충돌 검사
    enemies.forEach(enemy => {
        if (!enemy.alive) return;
        
        const enemyScreenX = enemy.x - gameState.cameraX;
        
        if (enemyScreenX > -100 && enemyScreenX < canvas.width + 100) {
            const collisionRange = enemy.isBoss ? 100 : 0;
            const expandedCollision = {
                x: enemy.x - collisionRange,
                y: enemy.y - collisionRange,
                width: enemy.width + collisionRange * 2,
                height: enemy.height + collisionRange * 2
            };
            
            if (checkBoxCollision(
                {x: player.worldX, y: player.y, width: player.width, height: player.height},
                expandedCollision
            )) {
                if (!gameState.questionActive && !gameState.bossDialogueActive) {
                    if (enemy.isBoss && gameState.stage === 20 && !enemy.dialogueShown) {
                        enemy.dialogueShown = true;
                        gameState.bossDialogueActive = true;
                        gameState.isMoving = false;
                        gameState.isBlocked = true;
                        player.velocityX = 0;
                        player.velocityY = 0;
                        
                        document.getElementById('ui').style.display = 'none';
                        document.getElementById('controls').style.display = 'none';
                        
                        if (typeof startBossDialogue === 'function') {
                            startBossDialogue(canvas, ctx, gameState.selectedCharacter, enemy.hp, enemy.maxHp, function() {
                                gameState.bossDialogueActive = false;
                                gameState.questionActive = true;
                                gameState.currentEnemy = enemy;
                                gameState.isBlocked = false;
                                
                                document.getElementById('ui').style.display = 'block';
                                document.getElementById('controls').style.display = 'flex';
                                
                                generateEnglishQuestion();
                                updateQuestionPanel();
                                document.getElementById('questionPanel').style.display = 'block';
                            });
                        }
                        return;
                    }
                    
                    gameState.questionActive = true;
                    gameState.currentEnemy = enemy;
                    gameState.isMoving = false;
                    gameState.isBlocked = true;
                    
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

// 애니메이션 업데이트
function updateAnimations() {
    player.animTimer++;
    if (player.animTimer >= 15) {
        player.animFrame = (player.animFrame + 1) % 3;
        player.animTimer = 0;
    }
    
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
    document.getElementById('hp').textContent = Math.max(0, player.hp);
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
    
    if (typeof drawBackground === 'function') {
        drawBackground();
    }
    
    ctx.fillStyle = '#228B22';
    ctx.fillRect(0, GROUND_Y + 16 * PIXEL_SCALE, canvas.width, canvas.height);
    
    // 장애물 렌더링
    obstacles.forEach(obstacle => {
        const screenX = obstacle.x - gameState.cameraX;
        if (screenX > -100 && screenX < canvas.width + 100) {
            if (typeof pixelData !== 'undefined' && pixelData[obstacle.type]) {
                const data = pixelData[obstacle.type];
                drawPixelSprite(data.sprite, data.colorMap, screenX, obstacle.y);
            }
            
            if (gameState.isBlocked && Math.abs(player.worldX - obstacle.x) < 100) {
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
            if (enemy.type === 'boss') {
                if (typeof pixelData !== 'undefined' && pixelData.boss) {
                    const data = pixelData.boss;
                    drawPixelSprite(data.idle, data.colorMap, screenX, enemy.y - 16 * PIXEL_SCALE);
                }
            } else {
                if (typeof alphabetMonsters !== 'undefined' && alphabetMonsters[enemy.type]) {
                    const data = alphabetMonsters[enemy.type];
                    drawPixelSprite(data.idle, data.colorMap, screenX, enemy.y - 16 * PIXEL_SCALE);
                }
            }
            
            if (enemy.isBoss && enemy.isAggro) {
                ctx.fillStyle = 'red';
                ctx.fillRect(screenX, enemy.y - 16 * PIXEL_SCALE - 15, enemy.width, 3);
                
                ctx.fillStyle = 'rgba(0,0,0,0.5)';
                ctx.fillRect(screenX - 10, enemy.y - 16 * PIXEL_SCALE - 25, enemy.width + 20, 8);
                ctx.fillStyle = '#FF0000';
                const healthPercent = enemy.hp / enemy.maxHp;
                ctx.fillRect(screenX - 8, enemy.y - 16 * PIXEL_SCALE - 23, (enemy.width + 16) * healthPercent, 4);
            }
        }
    });
    
    // 플레이어 렌더링
    if (typeof characterPixelData !== 'undefined' && characterPixelData[player.sprite]) {
        if (player.sprite === 'jiyul' && gameState.selectedVehicle !== 'none') {
            if (gameState.selectedVehicle === 'kiwi' && characterPixelData.kiwi) {
                const kiwiData = characterPixelData.kiwi;
                let kiwiSprite;
                
                if (player.isJumping) {
                    kiwiSprite = kiwiData.jump || kiwiData.idle;
                } else if (gameState.isMoving && !gameState.questionActive) {
                    if (kiwiData.walking1 && kiwiData.walking2) {
                        kiwiSprite = player.animFrame === 1 ? kiwiData.walking1 : 
                                    player.animFrame === 2 ? kiwiData.walking2 : kiwiData.idle;
                    } else {
                        kiwiSprite = kiwiData.idle;
                    }
                } else {
                    kiwiSprite = kiwiData.idle;
                }
                
                drawPixelSprite(kiwiSprite, kiwiData.colorMap, player.x, player.y - 16 * PIXEL_SCALE);
                
                const jiyulData = characterPixelData.jiyul;
                const jiyulOffsetY = -PIXEL_SCALE * 20;
                drawPixelSprite(jiyulData.idle, jiyulData.colorMap, player.x, player.y - 16 * PIXEL_SCALE + jiyulOffsetY);
                
            } else if (gameState.selectedVehicle === 'whitehouse' && characterPixelData.whitehouse) {
                const whData = characterPixelData.whitehouse;
                let whSprite;
                
                if (player.isJumping) {
                    whSprite = whData.jump || whData.idle;
                } else if (gameState.isMoving && !gameState.questionActive) {
                    if (whData.walking1 && whData.walking2) {
                        whSprite = player.animFrame === 1 ? whData.walking1 : 
                                   player.animFrame === 2 ? whData.walking2 : whData.idle;
                    } else {
                        whSprite = whData.idle;
                    }
                } else {
                    whSprite = whData.idle;
                }
                
                drawPixelSprite(whSprite, whData.colorMap, player.x, player.y - 16 * PIXEL_SCALE);
                
                const jiyulData = characterPixelData.jiyul;
                const jiyulOffsetY = -PIXEL_SCALE * 24;
                drawPixelSprite(jiyulData.idle, jiyulData.colorMap, player.x, player.y - 16 * PIXEL_SCALE + jiyulOffsetY);
            }
        } else {
            const playerData = characterPixelData[player.sprite];
            let sprite;
            
            if (player.isJumping) {
                sprite = playerData.jump || playerData.idle;
            } else if (gameState.isMoving && !gameState.questionActive) {
                if (playerData.walking1 && playerData.walking2) {
                    if (player.animFrame === 1) {
                        sprite = playerData.walking1;
                    } else if (player.animFrame === 2) {
                        sprite = playerData.walking2;
                    } else {
                        sprite = playerData.idle;
                    }
                } else {
                    sprite = playerData.idle;
                }
            } else {
                sprite = playerData.idle;
            }
            
            drawPixelSprite(sprite, playerData.colorMap, player.x, player.y - 16 * PIXEL_SCALE);
        }
    }
    
    if (typeof renderAllParticles === 'function') {
        renderAllParticles(ctx);
    }
    
    if (gameState.isBlocked && !gameState.questionActive) {
        // 모바일에서 더 큰 폰트 사용
        const fontSize = isMobileDevice() ? '24px' : '18px';
        ctx.fillStyle = 'rgba(255, 255, 0, 0.8)';
        ctx.font = `bold ${fontSize} Jua`;
        ctx.textAlign = 'center';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.strokeText('점프로 장애물을 뛰어넘으세요!', canvas.width / 2, 50);
        ctx.fillText('점프로 장애물을 뛰어넘으세요!', canvas.width / 2, 50);
    }
    
    renderFloatingTexts(ctx);
    
    ctx.restore();
}

// 영어 문제 생성
function generateEnglishQuestion() {
    if (!wordManager || gameState.selectedUnits.length === 0) {
        console.error('WordManager가 초기화되지 않았거나 선택된 Unit이 없습니다.');
        return;
    }
    
    gameState.currentQuestion = wordManager.generateMultipleChoice(gameState.selectedUnits);
    
    if (gameState.currentEnemy && gameState.currentEnemy.type === 'boss') {
        const hardUnits = gameState.selectedUnits.filter(unit => 
            unit === 'Unit7' || unit === 'Unit8'
        );
        if (hardUnits.length > 0) {
            gameState.currentQuestion = wordManager.generateMultipleChoice(hardUnits);
        }
    }
}

// 문제 패널 업데이트
function updateQuestionPanel() {
    if (!gameState.questionActive || !gameState.currentQuestion) return;
    
    document.getElementById('questionText').innerHTML = `✨ ${gameState.currentQuestion.question}`;
    
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
        
        document.getElementById('enemyInfo').textContent = 
            `${enemyName} 체력: ${gameState.currentEnemy.hp}/${gameState.currentEnemy.maxHp}`;
    }
    
    updateChoiceButtons();
}

// 4지선다 버튼 업데이트
function updateChoiceButtons() {
    const choicesContainer = document.getElementById('choicesContainer');
    if (!choicesContainer || !gameState.currentQuestion) return;
    
    choicesContainer.innerHTML = '';
    
    gameState.currentQuestion.choices.forEach((choice, index) => {
        const button = document.createElement('button');
        button.className = 'choice-btn';
        button.textContent = `(${index + 1}) ${choice}`;
        button.setAttribute('data-choice', index);
        button.onclick = () => selectChoice(index);
        choicesContainer.appendChild(button);
    });
}

// 선택지 선택
function selectChoice(choiceIndex) {
    if (!gameState.currentQuestion) return;
    
    gameStats.totalQuestions++;
    
    if (choiceIndex === gameState.currentQuestion.correctIndex) {
        gameState.score += 20;
        gameStats.correctAnswers++;
        
        if (gameState.currentEnemy) {
            gameState.currentEnemy.hp -= 1;
            const enemyScreenX = gameState.currentEnemy.x - gameState.cameraX;
            if (typeof createParticles === 'function') {
                createParticles(enemyScreenX, gameState.currentEnemy.y, 'hit');
            }
            
            if (gameState.currentEnemy.hp <= 0) {
                gameState.currentEnemy.alive = false;
                gameState.score += gameState.currentEnemy.type === 'boss' ? 100 : 50;
                if (typeof createParticles === 'function') {
                    createParticles(enemyScreenX, gameState.currentEnemy.y, 'defeat');
                }
                
                gameState.isMoving = true;
                gameState.isBlocked = false;
                
                document.getElementById('questionPanel').style.display = 'none';
                gameState.questionActive = false;
                gameState.currentEnemy = null;
                
                if (typeof showFloatingText === 'function') {
                    showFloatingText(player.x, player.y - 50, '완료!', '#00FF00');
                }
            } else {
                if (gameState.currentEnemy.type === 'boss' && gameState.currentEnemy.hp === 2) {
                    document.getElementById('ui').style.display = 'none';
                    document.getElementById('controls').style.display = 'none';
                    document.getElementById('questionPanel').style.display = 'none';
                    gameState.isMoving = false;
                    
                    if (typeof startBossDialogue === 'function') {
                        startBossDialogue(canvas, ctx, gameState.selectedCharacter, gameState.currentEnemy.hp, gameState.currentEnemy.maxHp, function() {
                            gameState.questionActive = true;
                            
                            document.getElementById('ui').style.display = 'block';
                            document.getElementById('controls').style.display = 'flex';
                            
                            generateEnglishQuestion();
                            updateQuestionPanel();
                            document.getElementById('questionPanel').style.display = 'block';
                        }, true);
                    } else {
                        setTimeout(() => {
                            generateEnglishQuestion();
                            updateQuestionPanel();
                        }, 1000);
                    }
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
        player.hp -= 15;
        if (typeof createParticles === 'function') {
            createParticles(player.x, player.y, 'hurt');
        }
        const correctAnswer = gameState.currentQuestion.choices[gameState.currentQuestion.correctIndex];
        if (typeof showFloatingText === 'function') {
            showFloatingText(player.x, player.y - 30, `틀렸어요! 정답: ${correctAnswer}`, '#FF0000');
        }
        
        if (player.hp <= 0) {
            gameOverWithRecord();
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
    console.log('Unit 선택 상태:', gameState.selectedUnits);
}

// 선택한 내용 표시 업데이트
function updateSelectedDisplay() {
    const selectedUnitsElement = document.getElementById('selectedUnits');
    const startButton = document.getElementById('startGameBtn');
    
    if (gameState.selectedUnits.length > 0) {
        const sortedUnits = gameState.selectedUnits.sort();
        selectedUnitsElement.textContent = `💕 선택한 Unit: ${sortedUnits.join(', ')}`;
    } else {
        selectedUnitsElement.textContent = '💕 선택한 Unit: 없음';
    }
    
    if (wordManager && gameState.selectedUnits.length > 0) {
        const wordCount = wordManager.getWordCountFromSelection(gameState.selectedUnits);
        if (wordCount > 0) {
            selectedUnitsElement.textContent += ` (총 ${wordCount}개 단어)`;
        }
    }
    
    startButton.disabled = gameState.selectedUnits.length === 0;
}

// 게임 시작
function startSelectedGame() {
    if (gameState.selectedUnits.length === 0) {
        alert('Unit을 하나 이상 선택해주세요!');
        return;
    }
    
    console.log('🎮 게임 시작!', {
        character: gameState.selectedCharacter,
        vehicle: gameState.selectedVehicle,
        units: gameState.selectedUnits
    });
    
    document.getElementById('gameContainer').classList.remove('menu-mode');
    document.getElementById('characterSelectMenu').style.display = 'none';
    document.getElementById('unitSelectMenu').style.display = 'none';
    document.getElementById('ui').style.display = 'block';
    
    const displayText = gameState.selectedUnits.join(', ');
    document.getElementById('unitText').textContent = displayText;
    
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
    document.getElementById('gameContainer').classList.add('menu-mode');
    document.getElementById('characterSelectMenu').style.display = 'flex';
    document.getElementById('unitSelectMenu').style.display = 'none';
    document.getElementById('ui').style.display = 'none';
    document.getElementById('questionPanel').style.display = 'none';
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
            'jiyul': '지율이',
            'kiwi': '키위',
            'whitehouse': '화이트하우스'
        };
        selectedCharacterName.textContent = characterNames[gameState.selectedCharacter] || '지율이';
    }
}

function drawCharacterPixelSprite(ctx, sprite, colorMap, scale = 3) {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.imageSmoothingEnabled = false;
    
    for (let row = 0; row < sprite.length; row++) {
        for (let col = 0; col < sprite[row].length; col++) {
            const pixel = sprite[row][col];
            if (pixel !== 0 && colorMap[pixel]) {
                ctx.fillStyle = colorMap[pixel];
                ctx.fillRect(col * scale, row * scale, scale, scale);
            }
        }
    }
}

// 도움말 표시
function showHelp() {
    alert('🌸 지율이의 픽셀 영어 게임 도움말 🌸\n\n' +
          '1. Unit을 선택하고 시작하세요!\n' +
          '2. 점프 버튼으로 장애물을 뛰어넘으세요!\n' +
          '3. 움직이는 몬스터를 만나면 영어 문제를 풀어요!\n' +
          '4. 영어 단어의 뜻을 4지선다에서 고르세요!\n' +
          '5. 정답을 맞추면 몬스터를 물리칠 수 있어요!\n\n' +
          '💕 지율이 화이팅! 💕');
}

// 다음 스테이지
function nextStage() {
    if (gameState.stage >= 20) {
        if (typeof showEnding === 'function') {
            showEnding();
        } else {
            showEndingWithRecord();
        }
        return;
    }
    
    gameState.stage++;
    gameState.speed += 0.5;
    gameState.bossSpawned = false;
    
    alert(`🎉 스테이지 ${gameState.stage - 1} 클리어! 🎉\n스테이지 ${gameState.stage}로 이동합니다!`);
    
    generateNewStageObstacles();
    generateMoreEnemies();
}

// 새 스테이지용 장애물 생성 함수
function generateNewStageObstacles() {
    const startX = player.worldX + 400;
    const baseSpacing = isMobileDevice() ? 220 : 180; // 모바일에서 간격 증가
    const obstacleSpacing = baseSpacing + Math.random() * 120;
    const obstacleCount = Math.min(15, 8 + gameState.stage); 
    
    for (let i = 0; i < obstacleCount; i++) {
        const types = ['rock', 'spike', 'pipe'];
        
        let type;
        if (gameState.stage >= 10) {
            const weights = [1, 3, 2];
            const totalWeight = weights.reduce((a, b) => a + b, 0);
            const random = Math.random() * totalWeight;
            let sum = 0;
            for (let j = 0; j < types.length; j++) {
                sum += weights[j];
                if (random < sum) {
                    type = types[j];
                    break;
                }
            }
        } else {
            type = types[Math.floor(Math.random() * types.length)];
        }
        
        const spacing = baseSpacing + Math.random() * 200 + (gameState.stage * 10);
        const obstacleX = startX + i * spacing;
        
        obstacles.push({
            x: obstacleX,
            y: GROUND_Y - (16 * PIXEL_SCALE),
            width: 16 * PIXEL_SCALE,
            height: 16 * PIXEL_SCALE,
            type: type,
            passed: false,
            colliding: false
        });
    }
    
    obstacles = obstacles.filter(obstacle => 
        obstacle.x > player.worldX - 1000
    );
}

// 점프 함수 (모바일 최적화)
function jump() {
    if (player.onGround && !gameState.questionActive) {
        const jumpPower = getJumpPower();
        player.velocityY = jumpPower;
        
        // 장애물에 막혔을 때 더 강한 전진력 제공
        let forwardSpeed;
        if (gameState.isBlocked) {
            // 막혔을 때는 훨씬 더 강한 전진력
            forwardSpeed = isMobileDevice() ? JUMP_FORWARD_SPEED * 4.5 : JUMP_FORWARD_SPEED * 4.0;
            gameState.isMoving = true;
            gameState.isBlocked = false; // 점프 시 즉시 블록 해제
        } else {
            // 일반 점프
            forwardSpeed = isMobileDevice() ? JUMP_FORWARD_SPEED * 3.0 : JUMP_FORWARD_SPEED * 2.5;
        }
        
        player.velocityX = forwardSpeed;
        player.isJumping = true;
        player.onGround = false;
        
        if (typeof createParticles === 'function') {
            createParticles(player.x, player.y, 'hint');
        }
        gameState.score += 1;
        updateUI();
        
        console.log(`점프! velocityY: ${player.velocityY}, velocityX: ${player.velocityX}, 블록상태: ${gameState.isBlocked}, 디바이스: ${isMobileDevice() ? '모바일' : '데스크톱'}`);
    }
}

// 픽셀 스프라이트 그리기 함수
function drawPixelSprite(sprite, colorMap, x, y, scale = PIXEL_SCALE) {
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

// 떠다니는 텍스트 함수
function showFloatingText(x, y, text, color) {
    if (!window.textParticles) {
        window.textParticles = [];
    }
    
    const textParticle = {
        x: x,
        y: y,
        text: text,
        color: color,
        life: 60,
        vy: -2,
        alpha: 1.0
    };
    
    window.textParticles.push(textParticle);
}

// 텍스트 파티클 렌더링
function renderFloatingTexts(ctx) {
    if (!window.textParticles) return;
    
    window.textParticles = window.textParticles.filter(particle => {
        particle.y += particle.vy;
        particle.life--;
        particle.alpha = particle.life / 60;
        
        if (particle.life > 0) {
            ctx.save();
            ctx.globalAlpha = particle.alpha;
            ctx.fillStyle = particle.color;
            const fontSize = isMobileDevice() ? '20px' : '16px';
            ctx.font = `bold ${fontSize} Jua`;
            ctx.textAlign = 'center';
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 2;
            ctx.strokeText(particle.text, particle.x, particle.y);
            ctx.fillText(particle.text, particle.x, particle.y);
            ctx.restore();
        }
        
        return particle.life > 0;
    });
}

// 게임 재시작
function restartGame() {
    if (gameState.selectedUnits.length === 0) {
        alert('Unit을 하나 이상 선택해주세요!');
        return;
    }
    
    gameState.running = false;
    setTimeout(() => {
        initGame();
    }, 100);
}

// 점수 저장
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
        date: new Date().toLocaleString('ko-KR')
    };
    
    gameRecords.push(record);
    
    if (gameRecords.length > 10) {
        gameRecords = gameRecords.slice(-10);
    }
    
    return record;
}

// 게임 오버 시 기록 저장
function gameOverWithRecord() {
    const record = saveGameRecord();
    
    let message = `게임 오버! 😢\n\n`;
    message += `🏆 게임 결과 🏆\n`;
    message += `최종 점수: ${record.score}점\n`;
    message += `스테이지: ${record.stage}\n`;
    message += `정답률: ${record.accuracy}% (${record.correctAnswers}/${record.totalQuestions})\n`;
    message += `플레이 시간: ${Math.floor(record.playTime / 60)}분 ${record.playTime % 60}초\n\n`;
    message += `다시 도전해보세요! 💕`;
    
    gameState.running = false;
    alert(message);
    showMenu();
}

// 엔딩 시 기록 저장
function showEndingWithRecord() {
    const record = saveGameRecord();
    
    let message = `🎊 축하해요! 🎊\n`;
    message += `모든 스테이지를 클리어했어요!\n\n`;
    message += `🏆 최종 결과 🏆\n`;
    message += `최종 점수: ${record.score}점\n`;
    message += `정답률: ${record.accuracy}% (${record.correctAnswers}/${record.totalQuestions})\n`;
    message += `플레이 시간: ${Math.floor(record.playTime / 60)}분 ${record.playTime % 60}초\n\n`;
    message += `정말 대단해요! 💖`;
    
    gameState.running = false;
    alert(message);
    showMenu();
}

// 탈것 선택 함수
function selectVehicle(vehicleName) {
    gameState.selectedVehicle = vehicleName;
    
    document.querySelectorAll('.vehicle-btn').forEach(btn => {
        btn.classList.remove('selected');
    });
    
    const selectedBtn = document.querySelector(`[data-vehicle="${vehicleName}"]`);
    if (selectedBtn) {
        selectedBtn.classList.add('selected');
    }
    
    console.log('탈것 선택됨:', vehicleName);
}

// 캐릭터 선택 함수
function selectCharacterByName(characterName) {
    gameState.selectedCharacter = characterName;
    
    document.querySelectorAll('.character-btn').forEach(btn => {
        btn.classList.remove('selected');
    });
    
    const selectedBtn = document.querySelector(`[data-character="${characterName}"]`);
    if (selectedBtn) {
        selectedBtn.classList.add('selected');
    }
    
    if (typeof selectCharacter === 'function') {
        selectCharacter(characterName);
    }
}

// 오프닝 시퀀스 시작
function startOpeningSequence() {
    document.getElementById('gameContainer').classList.remove('menu-mode');
    document.getElementById('characterSelectMenu').style.display = 'none';
    document.getElementById('unitSelectMenu').style.display = 'none';
    document.getElementById('ui').style.display = 'none';
    document.getElementById('questionPanel').style.display = 'none';
    document.getElementById('fullscreenBtn').style.display = 'none';
    document.getElementById('controls').style.display = 'none';
    
    if (typeof startOpening === 'function') {
        startOpening(canvas, ctx, function() {
            hasSeenOpening = true;
            showMenu();
        });
    } else {
        console.error('opening.js가 로드되지 않았습니다!');
        showMenu();
    }
}

// 게임 초기화 및 메뉴 표시
function initializeGame() {
    console.log('🎮 게임 초기화 시작...');
    
    gameState.selectedCharacter = 'jiyul';
    gameState.selectedVehicle = 'none';
    gameState.selectedUnits = [];
    
    resizeCanvas();
    
    // 픽셀 데이터 확인
    if (typeof characterPixelData === 'undefined') {
        console.warn('⚠️ characterPixelData가 정의되지 않았습니다.');
        window.characterPixelData = window.characterPixelData || {};
    }
    
    if (!hasSeenOpening) {
        console.log('📽️ 오프닝 시퀀스 시작...');
        startOpeningSequence();
    } else {
        console.log('📱 메뉴 표시...');
        showMenu();
    }
    
    console.log('✅ 지율이의 픽셀 영어 게임이 초기화되었습니다!');
}

// 이벤트 리스너 설정 (모바일 최적화)
function setupEventListeners() {
    console.log('🔧 이벤트 리스너 설정 중...');
    
    // 전체화면 변경 이벤트 처리
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);
    
    // 창 크기 변경
    window.addEventListener('resize', () => {
        setTimeout(resizeCanvas, 100);
    });
    
    window.addEventListener('orientationchange', () => {
        setTimeout(resizeCanvas, 500); // 모바일에서 충분한 대기 시간
    });
    
    // 페이지 가시성 변경 시 전체화면 복구
    document.addEventListener('visibilitychange', function() {
        if (!document.hidden && isFullscreenDesired && !isUserExiting) {
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
    
    // 터치 이벤트 처리 (모바일 최적화)
    let touchStartY = 0;
    let touchStartTime = 0;
    let touchStartX = 0;
    
    document.addEventListener('touchstart', function(e) {
        touchStartY = e.touches[0].clientY;
        touchStartX = e.touches[0].clientX;
        touchStartTime = Date.now();
        
        // 터치 시작 시 기본 동작 방지
        if (gameState.running && !gameState.questionActive) {
            e.preventDefault();
        }
    }, { passive: false });
    
    document.addEventListener('touchmove', function(e) {
        // 게임 중 스크롤 방지
        if (gameState.running && !gameState.questionActive) {
            e.preventDefault();
        }
    }, { passive: false });
    
    document.addEventListener('touchend', function(e) {
        if (!gameState.running || gameState.questionActive) return;
        
        const touchEndY = e.changedTouches[0].clientY;
        const touchEndX = e.changedTouches[0].clientX;
        const touchEndTime = Date.now();
        
        const deltaY = touchStartY - touchEndY;
        const deltaX = Math.abs(touchStartX - touchEndX);
        const deltaTime = touchEndTime - touchStartTime;
        
        // 점프 조건 완화 (모바일 최적화)
        const isUpwardSwipe = deltaY > 30 && deltaTime < 800;
        const isQuickTap = deltaTime < 300 && Math.abs(deltaY) < 50 && deltaX < 50;
        const isAnyTouch = deltaTime < 500; // 매우 관대한 조건
        
        if (isUpwardSwipe || isQuickTap || isAnyTouch) {
            e.preventDefault();
            jump();
        }
    }, { passive: false });
    
    // 키보드 이벤트 처리
    document.addEventListener('keydown', function(e) {
        if (!gameState.running) return;
        
        switch(e.code) {
            case 'Space':
            case 'ArrowUp':
            case 'KeyW':
                e.preventDefault();
                jump();
                break;
            case 'Escape':
                e.preventDefault();
                if (document.fullscreenElement || document.webkitFullscreenElement || 
                    document.mozFullScreenElement || document.msFullscreenElement) {
                    isUserExiting = true;
                    isFullscreenDesired = false;
                }
                showMenu();
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
    
    // iOS에서 오디오 활성화
    function enableAudio() {
        const audioContext = window.AudioContext || window.webkitAudioContext;
        if (audioContext) {
            const ctx = new audioContext();
            if (ctx.state === 'suspended') {
                ctx.resume();
            }
        }
    }
    
    document.addEventListener('touchstart', enableAudio, { once: true });
    document.addEventListener('click', enableAudio, { once: true });
    
    // 모바일에서 기본 동작 방지
    if (isMobileDevice()) {
        // 더블 탭 줌 방지
        let lastTouchEnd = 0;
        document.addEventListener('touchend', function(event) {
            const now = (new Date()).getTime();
            if (now - lastTouchEnd <= 300) {
                event.preventDefault();
            }
            lastTouchEnd = now;
        }, false);
        
        // 핀치 줌 방지
        document.addEventListener('gesturestart', function(e) {
            e.preventDefault();
        }, false);
        
        document.addEventListener('gesturechange', function(e) {
            e.preventDefault();
        }, false);
        
        document.addEventListener('gestureend', function(e) {
            e.preventDefault();
        }, false);
    }
    
    console.log('✅ 이벤트 리스너 설정 완료!');
}

// 전역 함수로 등록 (HTML에서 사용)
window.showHelp = showHelp;
window.restartGame = restartGame;
window.selectCharacterByName = selectCharacterByName;
window.toggleFullscreen = toggleFullscreen;
window.jump = jump;
window.showMenu = showMenu;
window.startSelectedGame = startSelectedGame;
window.toggleUnit = toggleUnit;
window.selectVehicle = selectVehicle;
window.showUnitSelectMenu = showUnitSelectMenu;
window.showCharacterSelectMenu = showCharacterSelectMenu;

// 에러 처리
window.addEventListener('error', function(e) {
    console.error('게임 오류:', e.error);
    
    if (e.error && e.error.message && 
        !e.error.message.includes('Script error') &&
        !e.error.message.includes('Non-Error promise rejection')) {
        
        if (typeof debugMode !== 'undefined' && debugMode) {
            alert(`오류가 발생했습니다: ${e.error.message}`);
        }
    }
});

// requestAnimationFrame 폴백
if (!window.requestAnimationFrame) {
    window.requestAnimationFrame = function(callback) {
        return setTimeout(callback, 16);
    };
}

// 초기 캔버스 설정
resizeCanvas();

// 게임 시작 시 초기화
console.log('🎮 메인 게임 스크립트 로딩 완료!');

// DOM이 완전히 로드된 후 게임 초기화
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        setupEventListeners();
        checkIOSFullscreen();
        initializeGame();
    });
} else {
    setupEventListeners();
    checkIOSFullscreen();
    initializeGame();
}

console.log('✨ 지율이의 픽셀 영어 게임 준비 완료! ✨');
