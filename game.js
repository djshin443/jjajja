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
    selectedCharacter: 'jiyul', // 수정됨
    distance: 0,
    speed: 4,
    questionActive: false,
    currentEnemy: null,
    backgroundOffset: 0,
    currentQuestion: '',
    correctAnswer: 0,
    isMoving: true,
    cameraX: 0,
    screenShake: 0,
    shakeTimer: 0
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
    sprite: 'jiyul', // 수정됨
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
	if (player) {
	    player.width = 16 * PIXEL_SCALE;
	    player.height = 16 * PIXEL_SCALE;
	}
    
    // 바닥 위치 재조정
    GROUND_Y = screenHeight - (screenHeight * 0.25);
    
    // 플레이어 위치 조정 (gameState가 존재할 때만)
	if (player && gameState && !gameState.questionActive) {
	    player.y = GROUND_Y;
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

    document.getElementById('questionPanel').style.display = 'none';
    
    // 선택된 캐릭터로 플레이어 초기화
    player.sprite = gameState.selectedCharacter;
    player.x = 100;
    player.worldX = 100;
    player.y = GROUND_Y;
    player.hp = 100;
    player.velocityY = 0;
    player.velocityX = 0;
    player.onGround = true;
    player.isJumping = false;
    
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
    const currentMaxX = Math.max(...enemies.map(e => e.x), player.worldX);
    const startX = Math.max(currentMaxX + 300, player.worldX + 800);
    
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
            hp: 1, // 보스는 한 번의 문제로 처치
            maxHp: 1,
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
		
		// 플레이어도 자동으로 앞으로 이동
		player.worldX += gameState.speed;
	}

    // 화면 흔들림 효과 업데이트
    if (gameState.shakeTimer > 0) {
        gameState.shakeTimer--;
        gameState.screenShake = Math.sin(gameState.shakeTimer * 0.5) * (gameState.shakeTimer / 10);
    } else {
        gameState.screenShake = 0;
    }

    // 플레이어 물리 업데이트
    updatePlayerPhysics();
    
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
        enemy.x > player.worldX && enemy.x < player.worldX + 2000
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
        // 20스테이지에서 엔딩
        if (gameState.stage >= 20) {
            showEnding();
            return;
        }
        nextStage();
    }
}

// 플레이어 물리 업데이트
function updatePlayerPhysics() {
    // 중력 적용
    if (!player.onGround) {
        player.velocityY += GRAVITY;
    }
    
    // Y축 이동
    player.y += player.velocityY;
    
    // X축 이동 (점프나 조작 시)
    if (player.velocityX !== 0) {
        player.worldX += player.velocityX;
        // 마찰력 적용 (점프 중에는 덜 적용)
        const friction = player.isJumping ? 0.98 : 0.92;
        player.velocityX *= friction;
        if (Math.abs(player.velocityX) < 0.1) {
            player.velocityX = 0;
        }
    }
    
    // 바닥 충돌 체크
    if (player.y >= GROUND_Y) {
        player.y = GROUND_Y;
        player.velocityY = 0;
        player.onGround = true;
        player.isJumping = false;
        
        // 착지 시 파티클 효과
        if (player.velocityX > 2) {
            createParticles(player.x, player.y, 'hint');
        }
    }
    
    // 화면의 1/4 지점에 고정된 위치 설정 (더 뒤로 이동)
    const targetScreenX = canvas.width / 4;
    player.x = targetScreenX;
    
    // 카메라를 플레이어의 월드 위치에 맞춰 조정 (플레이어는 계속 오른쪽으로 진행)
    gameState.cameraX = player.worldX - targetScreenX;
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
                const distanceToPlayer = Math.abs(enemy.x - player.worldX);
                
                if (distanceToPlayer < enemy.aggroRange) {
                    enemy.isAggro = true;
                    // 플레이어 방향으로 이동
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
            
            // 플레이어 월드 좌표로 충돌 체크
            if (checkBoxCollision(
                {x: player.worldX, y: player.y, width: player.width, height: player.height},
                {x: obstacle.x, y: obstacle.y, width: obstacle.width, height: obstacle.height}
            )) {
                // spike는 데미지를 입힘
                if (obstacle.type === 'spike' && !obstacle.passed) {
		    obstacle.passed = true;
		    createParticles(player.x, player.y, 'hint'); // hurt → hint로 변경
		    
		    // 통과 보너스 점수 (데미지 제거)
		    gameState.score += 5;
		    updateUI();
		}
                // 다른 장애물은 점프 중이 아닐 때만 막힘
                else if (obstacle.type !== 'spike' && player.onGround) {
                    // 장애물 앞에서 멈춤 (바닥에 있을 때만)
                    player.worldX = obstacle.x - player.width - 5;
                    player.velocityX = 0;
                    
                    // 화면 이동 정지
                    gameState.isMoving = false;
                    
                    // 약간의 충돌 효과
                    gameState.shakeTimer = 10;
                    
                    // 점프로만 넘어갈 수 있도록 힌트
                    if (Math.random() < 0.01) { // 가끔 힌트 표시
                        createParticles(player.x, player.y - 30, 'hint');
                    }
                }
            } else {
                // 장애물을 넘어갔으면 다시 이동 시작
                if (player.worldX > obstacle.x + obstacle.width && !obstacle.passed) {
                    obstacle.passed = true;
                    gameState.isMoving = true;
                    gameState.score += 10; // 장애물 통과 보너스
                    createParticles(player.x, player.y - 20, 'hint'); // 성공 파티클
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
				{x: player.worldX, y: player.y, width: player.width, height: player.height},
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
    // 플레이어 애니메이션 (걷기 애니메이션 추가)
    player.animTimer++;
    if (player.animTimer >= 15) { // 걷기 애니메이션 속도 조절
        player.animFrame = (player.animFrame + 1) % 3; // 0, 1, 2로 순환
        player.animTimer = 0;
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
    document.getElementById('hp').textContent = Math.max(0, player.hp);
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
            if (!gameState.isMoving && Math.abs(player.worldX - obstacle.x) < 100) {
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
    
    // 플레이어 그리기 (선택된 캐릭터 사용)
	const playerData = pixelData[player.sprite];  // ✅ 선택된 캐릭터 사용
	let sprite;
	
	// 애니메이션 상태에 따른 스프라이트 선택
	if (player.isJumping) {
	    sprite = playerData.jump;  // ✅ playerData 사용
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
	        sprite = playerData.idle; // walking 스프라이트가 없으면 idle 사용
	    }
	} else {
	    sprite = playerData.idle;
	}
	
	// 일반적인 방법으로 그리기 (뒤집기 없이)
	drawPixelSprite(sprite, playerData.colorMap, player.x, player.y - player.height);
		    
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
    document.getElementById('characterSelectMenu').style.display = 'flex';
    document.getElementById('mathSelectMenu').style.display = 'none';
    document.getElementById('ui').style.display = 'none';
    document.getElementById('questionPanel').style.display = 'none';
}

// 새로운 화면 전환 함수들 추가
function showMathSelectMenu() {
    document.getElementById('characterSelectMenu').style.display = 'none';
    document.getElementById('mathSelectMenu').style.display = 'flex';
    updateSelectedCharacterDisplay();
}

function showCharacterSelectMenu() {
    document.getElementById('mathSelectMenu').style.display = 'none';
    document.getElementById('characterSelectMenu').style.display = 'flex';
}

function updateSelectedCharacterDisplay() {
    const selectedCharacterPixel = document.getElementById('selectedCharacterPixel');
    const selectedCharacterName = document.getElementById('selectedCharacterName');
    
    if (selectedCharacterPixel && characterPixelData[gameState.selectedCharacter]) {
        const ctx = selectedCharacterPixel.getContext('2d');
        drawCharacterPixelSprite(
            ctx, 
            characterPixelData[gameState.selectedCharacter].idle, 
            characterPixelData[gameState.selectedCharacter].colorMap, 
            4  // 더 큰 스케일로 표시
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


// 게임 오버
function gameOver() {
    gameState.running = false;
    alert(`게임 오버! 😢\n최종 점수: ${gameState.score}점\n다시 도전해보세요!`);
    showMenu();
}

// 다음 스테이지
function nextStage() {
    // 20스테이지 클리어 시 엔딩
    if (gameState.stage >= 20) {
        showEnding();
        return;
    }
    
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
    if (player.onGround && !gameState.questionActive) {
        const jumpPower = getJumpPower(); // 디바이스별 점프 파워 사용
        player.velocityY = jumpPower;
        
        // 모바일에서는 전진 속도도 조정
        const forwardSpeed = isMobileDevice() ? JUMP_FORWARD_SPEED * 1.2 : JUMP_FORWARD_SPEED * 1.5;
        player.velocityX = forwardSpeed;
        
        player.isJumping = true;
        player.onGround = false;
        
        // 점프 시 화면 이동 강제 재개
        gameState.isMoving = true;
        
        // 점프 효과음 대신 파티클
        createParticles(player.x, player.y, 'hint');
        
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
// DOM이 완전히 로드된 후 한 번만 실행
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupEventListeners);
} else {
    setupEventListeners();
}

function setupEventListeners() {
    console.log('이벤트 리스너 설정 시작');
    
    // 이미 설정되었는지 확인
    if (window.eventListenersSetup) {
        console.log('이벤트 리스너가 이미 설정되어 있음');
        return;
    }
    window.eventListenersSetup = true;
    
    // 모바일 키보드 전역 방지
    document.addEventListener('touchstart', function(e) {
        if (e.target.id === 'answerInput') {
            e.preventDefault();
            e.stopPropagation();
            document.activeElement.blur();
        }
    }, { passive: false });
    
    // 구구단 버튼들 - 이벤트 위임 방식 사용
    const danGrid = document.getElementById('danGrid');
    if (danGrid) {
        danGrid.addEventListener('click', function(e) {
            const button = e.target.closest('.dan-btn');
            if (button) {
                e.preventDefault();
                e.stopPropagation();
                const dan = parseInt(button.getAttribute('data-dan'));
                toggleDan(dan);
            }
        });
    }

    // 연산 버튼들 - 이벤트 위임 방식 사용
    const operatorGrid = document.getElementById('operatorGrid');
    if (operatorGrid) {
        operatorGrid.addEventListener('click', function(e) {
            const button = e.target.closest('.operator-btn');
            if (button) {
                e.preventDefault();
                e.stopPropagation();
                const op = button.getAttribute('data-op');
                toggleOperator(op);
            }
        });
    }

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
	
	// 다음 버튼 (캐릭터 선택 -> 수학 선택)
    const nextToMathBtn = document.getElementById('nextToMathBtn');
    if (nextToMathBtn) {
        nextToMathBtn.addEventListener('click', function(e) {
            e.preventDefault();
            showMathSelectMenu();
        });
    }
    
    // 이전 버튼 (수학 선택 -> 캐릭터 선택)
    const backToCharacterBtn = document.getElementById('backToCharacterBtn');
    if (backToCharacterBtn) {
        backToCharacterBtn.addEventListener('click', function(e) {
            e.preventDefault();
            showCharacterSelectMenu();
        });
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

    // 커스텀 키보드 이벤트 - 이벤트 위임 방식 사용
    const customKeyboard = document.getElementById('customKeyboard');
    if (customKeyboard) {
        customKeyboard.addEventListener('click', function(e) {
            const keyBtn = e.target.closest('.key-btn');
            if (keyBtn) {
                e.preventDefault();
                e.stopPropagation();
                const key = keyBtn.getAttribute('data-key');
                console.log('키 버튼 클릭:', key);
                handleKeyPress(key);
            }
        });
    }
    
    // 캐릭터 선택 버튼들 - 이벤트 위임 방식 사용
	const characterGrid = document.getElementById('characterGrid');
	if (characterGrid) {
	    characterGrid.addEventListener('click', function(e) {
	        const button = e.target.closest('.character-btn');
	        if (button) {
	            e.preventDefault();
	            e.stopPropagation();
	            const character = button.getAttribute('data-character');
	            selectCharacter(character);
	        }
	    });
	}
	
    console.log('모든 이벤트 설정 완료');
	
	// 기본 캐릭터 선택 (지율이)
	selectCharacter('jiyul');
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

// ========== 엔딩 시스템 ==========

// 엔딩 표시
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
                <h2 style="margin-bottom: 15px;">🎊 축하해요! 🎊</h2>
                <p>지율이가 모든 스테이지를 클리어했어요!</p>
                <p style="color: #8B008B; margin-top: 10px;">엄마 아빠가 자랑스러워하고 있어요! 💕</p>
            `;
            break;
        case 'kiwi':
            endingText.innerHTML = `
                <h2 style="margin-bottom: 15px;">🥝 대단해요! 🥝</h2>
                <p>키위가 모든 모험을 완료했어요!</p>
                <p style="color: #8B008B; margin-top: 10px;">맛있는 간식을 받을 시간이에요!</p>
            `;
            break;
        case 'whitehouse':
            endingText.innerHTML = `
                <h2 style="margin-bottom: 15px;">🏰 모험 완료! 🏰</h2>
                <p>화이트하우스와 함께한 여정이 끝났어요!</p>
                <p style="color: #8B008B; margin-top: 10px;">이제 텐트 안에서 놀이 시간! 🎪</p>
            `;
            break;
    }
    
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
        showMenu();
    };
    
    endingDiv.appendChild(endingCanvas);
    endingDiv.appendChild(endingText);
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
        drawEndingBackground(ctx, canvas);
        
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

// 엔딩 배경
function drawEndingBackground(ctx, canvas) {
    // 땅
    ctx.fillStyle = '#228B22';
    ctx.fillRect(0, canvas.height - 60, canvas.width, 60);
    
    // 꽃들
    for (let i = 0; i < 8; i++) {
        const x = i * 60 + 30;
        const y = canvas.height - 60;
        
        // 줄기
        ctx.strokeStyle = '#32CD32';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x, y - 20);
        ctx.stroke();
        
        // 꽃
        ctx.fillStyle = ['#FF69B4', '#FFB6C1', '#FF1493', '#FFD700'][i % 4];
        ctx.beginPath();
        ctx.arc(x, y - 25, 8, 0, Math.PI * 2);
        ctx.fill();
    }
}

// 지율이 엔딩 - 엄마 아빠와 함께
function drawJiyulEnding(ctx, canvas, frame) {
    const centerX = canvas.width / 2;
    const centerY = canvas.height - 120;
    
    // 배경 장식 - 축하 리본
    drawCelebrationRibbons(ctx, canvas, frame);
    
    // 지율이 (중앙) - 기쁨 표현
    const jiyulData = pixelData.jiyul;
    const jiyulX = centerX - 24;
    const jiyulY = centerY;
    
    // 점프 애니메이션
    const jumpOffset = Math.abs(Math.sin(frame * 0.05)) * 20;
    drawPixelSprite(jiyulData.idle, jiyulData.colorMap, jiyulX, jiyulY - jumpOffset, 3);
    
    // 기쁨 표현 - 지율이 위에 반짝이
    if (frame % 20 < 10) {
        ctx.fillStyle = '#FFD700';
        ctx.fillRect(jiyulX - 10, jiyulY - jumpOffset - 40, 6, 6);
        ctx.fillRect(jiyulX + 20, jiyulY - jumpOffset - 50, 4, 4);
        ctx.fillRect(jiyulX + 30, jiyulY - jumpOffset - 35, 5, 5);
    }
    
    // 엄마 (왼쪽) - 16비트 스타일
    drawDetailedMom(ctx, centerX - 100, centerY, frame);
    
    // 아빠 (오른쪽) - 16비트 스타일
    drawDetailedDad(ctx, centerX + 80, centerY, frame);
    
    // 가족 사랑 하트들
    drawFamilyHearts(ctx, centerX, centerY, frame);
    
    // 축하 폭죽 효과
    drawFireworks(ctx, canvas, frame);
    
    // 축하 메시지
    ctx.fillStyle = '#FF1493';
    ctx.font = 'bold 20px Jua';
    ctx.textAlign = 'center';
    ctx.strokeStyle = '#FFF';
    ctx.lineWidth = 3;
    ctx.strokeText('구구단 마스터 완성! 🎊', centerX, 50);
    ctx.fillText('구구단 마스터 완성! 🎊', centerX, 50);
}

// 키위 엔딩 - 밥 먹기
function drawKiwiEnding(ctx, canvas, frame) {
    const centerX = canvas.width / 2;
    const centerY = canvas.height - 100;
    
    // 배경 - 집 안 분위기
    drawHomeBackground(ctx, canvas);
    
    // 키위 (중앙) - 먹는 애니메이션
    const kiwiData = pixelData.kiwi;
    const kiwiX = centerX - 24;
    const kiwiY = centerY;
    
    // 먹는 동작 애니메이션 (머리 위아래)
    const eatOffset = Math.sin(frame * 0.15) * 5;
    drawPixelSprite(kiwiData.idle, kiwiData.colorMap, kiwiX, kiwiY + eatOffset, 3);
    
    // 지율이 (왼쪽에서 지켜보기)
    const jiyulData = pixelData.jiyul;
    drawPixelSprite(jiyulData.idle, jiyulData.colorMap, centerX - 120, centerY - 10, 2.5);
    
    // 엄마 (오른쪽에서 미소)
    drawDetailedMom(ctx, centerX + 80, centerY - 10, frame, 0.8);
    
    // 먹이 그릇 (더 상세하게)
    drawFoodBowl(ctx, centerX, centerY + 50, frame);
    
    // 도마뱀 친구 (껄충껑충 뛰는 모습)
    drawLizardFriend(ctx, centerX, centerY + 30, frame);
    
    // 키위 만족도 표시
    drawKiwiHappiness(ctx, kiwiX + 60, kiwiY - 30, frame);
    
    // 따뜻한 분위기 효과
    drawWarmAtmosphere(ctx, canvas, frame);
    
    // 메시지
    ctx.fillStyle = '#32CD32';
    ctx.font = 'bold 18px Jua';
    ctx.textAlign = 'center';
    ctx.strokeStyle = '#FFF';
    ctx.lineWidth = 2;
    ctx.strokeText('키위가 맛있게 간식을 먹고 있어요!', centerX, 40);
    ctx.fillText('키위가 맛있게 간식을 먹고 있어요!', centerX, 40);
}

// 화이트하우스 엔딩 - 텐트 안에서 놀기
function drawWhitehouseEnding(ctx, canvas, frame) {
    const centerX = canvas.width / 2;
    const centerY = canvas.height - 100;
    
    // 방 배경
    drawPlayroomBackground(ctx, canvas);
    
    // 하얀색 네모 텐트 (명확하게)
    drawWhiteSquareTent(ctx, centerX, centerY, frame);
    
    // 텐트 주변 장난감들
    drawAdvancedToyCollection(ctx, centerX, centerY, frame);
    
    // 텐트 안 따뜻한 조명
    drawTentInteriorLighting(ctx, centerX, centerY, frame);
    
    // 마법같은 놀이 효과
    drawEnhancedPlayEffects(ctx, centerX, centerY, frame);
    
    // 메시지
    ctx.fillStyle = '#9370DB';
    ctx.font = 'bold 18px Jua';
    ctx.textAlign = 'center';
    ctx.strokeStyle = '#FFF';
    ctx.lineWidth = 2;
    ctx.strokeText('하얀 텐트에서 즐거운 놀이시간! 🎪', centerX, 40);
    ctx.fillText('하얀 텐트에서 즐거운 놀이시간! 🎪', centerX, 40);
}

// ========== 엔딩 디테일 함수들 ==========

// 16비트 스타일 엄마 그리기 (더 여성스럽게)
function drawDetailedMom(ctx, x, y, frame, scale = 1) {
    const s = scale;
    const waveOffset = Math.sin(frame * 0.1) * 3;
    
    // 그림자
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.fillRect(x - 8*s, y + 85*s, 55*s, 8*s);
    
    // 긴 머리카락 (우아한 웨이브)
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(x - 5*s, y - 30*s, 40*s, 25*s);
    ctx.fillRect(x + 2*s, y - 35*s, 26*s, 15*s);
    // 양쪽 웨이브
    ctx.fillRect(x - 8*s, y - 25*s + waveOffset, 10*s, 25*s);
    ctx.fillRect(x + 30*s, y - 25*s - waveOffset, 10*s, 25*s);
    // 앞머리
    ctx.fillRect(x + 5*s, y - 32*s, 20*s, 8*s);
    
    // 얼굴 (더 부드럽게)
    ctx.fillStyle = '#FFE0BD';
    ctx.fillRect(x + 5*s, y - 12*s, 20*s, 28*s);
    
    // 눈 (더 크고 반짝이게)
    ctx.fillStyle = '#000000';
    ctx.fillRect(x + 8*s, y - 5*s, 3*s, 5*s);
    ctx.fillRect(x + 17*s, y - 5*s, 3*s, 5*s);
    // 속눈썹
    ctx.fillRect(x + 7*s, y - 7*s, 1*s, 2*s);
    ctx.fillRect(x + 12*s, y - 7*s, 1*s, 2*s);
    ctx.fillRect(x + 16*s, y - 7*s, 1*s, 2*s);
    ctx.fillRect(x + 21*s, y - 7*s, 1*s, 2*s);
    
    if (frame % 60 < 5) {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(x + 9*s, y - 3*s, 1*s, 2*s);
        ctx.fillRect(x + 18*s, y - 3*s, 1*s, 2*s);
    }
    
    // 입술 (더 여성스럽게)
    ctx.fillStyle = '#FF69B4';
    ctx.fillRect(x + 12*s, y + 8*s, 6*s, 3*s);
    ctx.fillRect(x + 11*s, y + 7*s, 2*s, 2*s);
    ctx.fillRect(x + 17*s, y + 7*s, 2*s, 2*s);
    
    // 목걸이
    ctx.fillStyle = '#FFD700';
    ctx.fillRect(x + 10*s, y + 16*s, 10*s, 2*s);
    ctx.fillRect(x + 14*s, y + 18*s, 2*s, 3*s);
    
    // 우아한 드레스 상의
    ctx.fillStyle = '#FF1493';
    ctx.fillRect(x - 2*s, y + 16*s, 34*s, 40*s);
    // 드레스 장식 (레이스 패턴)
    ctx.fillStyle = '#FFFFFF';
    for (let i = 0; i < 5; i++) {
        ctx.fillRect(x + 3*s + i * 5*s, y + 20*s, 3*s, 1*s);
        ctx.fillRect(x + 3*s + i * 5*s, y + 30*s, 3*s, 1*s);
        ctx.fillRect(x + 3*s + i * 5*s, y + 40*s, 3*s, 1*s);
    }
    
    // 팔 (우아한 박수 동작)
    const clapOffset = Math.sin(frame * 0.3) * 10*s;
    ctx.fillStyle = '#FFE0BD';
    // 왼팔
    ctx.fillRect(x - 10*s - clapOffset, y + 22*s, 8*s, 22*s);
    ctx.fillRect(x - 14*s - clapOffset, y + 20*s, 6*s, 10*s);
    // 오른팔
    ctx.fillRect(x + 32*s + clapOffset, y + 22*s, 8*s, 22*s);
    ctx.fillRect(x + 38*s + clapOffset, y + 20*s, 6*s, 10*s);
    
    // 긴 스커트 (A라인)
    ctx.fillStyle = '#8A2BE2';
    ctx.fillRect(x - 8*s, y + 56*s, 46*s, 30*s);
    // 스커트 플리츠
    ctx.fillStyle = '#6A1B9A';
    for (let i = 0; i < 8; i++) {
        ctx.fillRect(x - 6*s + i * 6*s, y + 56*s, 2*s, 30*s);
    }
    
    // 다리 (스타킹)
    ctx.fillStyle = '#F5DEB3';
    ctx.fillRect(x + 10*s, y + 86*s, 5*s, 12*s);
    ctx.fillRect(x + 17*s, y + 86*s, 5*s, 12*s);
    
    // 하이힐
    ctx.fillStyle = '#8B0000';
    ctx.fillRect(x + 8*s, y + 98*s, 9*s, 6*s);
    ctx.fillRect(x + 15*s, y + 98*s, 9*s, 6*s);
    // 힐
    ctx.fillRect(x + 14*s, y + 104*s, 2*s, 4*s);
    ctx.fillRect(x + 21*s, y + 104*s, 2*s, 4*s);
}

// 16비트 스타일 아빠 그리기 (티셔츠 버전)
function drawDetailedDad(ctx, x, y, frame, scale = 1) {
    const s = scale;
    const nodOffset = Math.sin(frame * 0.08) * 3;
    
    // 그림자
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.fillRect(x - 5*s, y + 85*s, 50*s, 8*s);
    
    // 머리카락 (단정한 헤어)
    ctx.fillStyle = '#2C1810';
    ctx.fillRect(x + 2*s, y - 28*s, 26*s, 23*s);
    ctx.fillRect(x + 5*s, y - 32*s, 20*s, 8*s);
    // 옆머리
    ctx.fillRect(x, y - 20*s, 6*s, 15*s);
    ctx.fillRect(x + 24*s, y - 20*s, 6*s, 15*s);
    
    // 얼굴
    ctx.fillStyle = '#FFE0BD';
    ctx.fillRect(x + 4*s, y - 10*s + nodOffset, 22*s, 28*s);
    
    // 안경 (더 디테일하게)
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2*s;
    // 렌즈
    ctx.strokeRect(x + 6*s, y - 6*s + nodOffset, 7*s, 7*s);
    ctx.strokeRect(x + 17*s, y - 6*s + nodOffset, 7*s, 7*s);
    // 다리
    ctx.fillStyle = '#000000';
    ctx.fillRect(x + 13*s, y - 2*s + nodOffset, 4*s, 1*s);
    ctx.fillRect(x + 4*s, y - 4*s + nodOffset, 3*s, 1*s);
    ctx.fillRect(x + 23*s, y - 4*s + nodOffset, 3*s, 1*s);
    
    // 눈 (안경 너머)
    ctx.fillStyle = '#000000';
    ctx.fillRect(x + 8*s, y - 4*s + nodOffset, 3*s, 3*s);
    ctx.fillRect(x + 19*s, y - 4*s + nodOffset, 3*s, 3*s);
    
    // 입 (따뜻한 미소)
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(x + 12*s, y + 10*s + nodOffset, 6*s, 2*s);
    ctx.fillRect(x + 10*s, y + 9*s + nodOffset, 2*s, 2*s);
    ctx.fillRect(x + 18*s, y + 9*s + nodOffset, 2*s, 2*s);
    
    // 캐주얼 티셔츠 (밝은 색상)
    ctx.fillStyle = '#FF6347'; // 토마토 레드
    ctx.fillRect(x - 3*s, y + 18*s, 36*s, 45*s);
    
    // 티셔츠 로고/패턴
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(x + 10*s, y + 25*s, 10*s, 8*s);
    ctx.fillStyle = '#000000';
    ctx.fillRect(x + 12*s, y + 27*s, 6*s, 4*s);
    
    // 티셔츠 소매
    ctx.fillStyle = '#FF6347';
    ctx.fillRect(x - 8*s, y + 20*s, 8*s, 15*s);
    ctx.fillRect(x + 30*s, y + 20*s, 8*s, 15*s);
    
    // 팔 (박수)
    const clapOffset = Math.sin(frame * 0.3) * 10*s;
    ctx.fillStyle = '#FFE0BD';
    // 왼팔
    ctx.fillRect(x - 12*s - clapOffset, y + 25*s, 8*s, 20*s);
    ctx.fillRect(x - 16*s - clapOffset, y + 23*s, 6*s, 10*s);
    // 오른팔
    ctx.fillRect(x + 34*s + clapOffset, y + 25*s, 8*s, 20*s);
    ctx.fillRect(x + 40*s + clapOffset, y + 23*s, 6*s, 10*s);
    
    // 청바지
    ctx.fillStyle = '#4169E1';
    ctx.fillRect(x - 3*s, y + 63*s, 36*s, 25*s);
    
    // 청바지 스티치
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 1*s;
    ctx.beginPath();
    ctx.moveTo(x + 2*s, y + 65*s);
    ctx.lineTo(x + 2*s, y + 85*s);
    ctx.moveTo(x + 28*s, y + 65*s);
    ctx.lineTo(x + 28*s, y + 85*s);
    ctx.stroke();
    
    // 다리
    ctx.fillStyle = '#4169E1';
    ctx.fillRect(x + 8*s, y + 88*s, 6*s, 15*s);
    ctx.fillRect(x + 16*s, y + 88*s, 6*s, 15*s);
    
    // 운동화
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(x + 6*s, y + 103*s, 10*s, 6*s);
    ctx.fillRect(x + 14*s, y + 103*s, 10*s, 6*s);
    // 운동화 줄무늬
    ctx.fillStyle = '#000000';
    ctx.fillRect(x + 8*s, y + 105*s, 6*s, 1*s);
    ctx.fillRect(x + 16*s, y + 105*s, 6*s, 1*s);
}

// 주황색 도마뱀 (키위 친구) 그리기 - 꼬리 없는 버전
function drawLizardFriend(ctx, centerX, centerY, frame) {
    // 도마뱀 기본 위치와 움직임
    const lizardX = centerX - 40;
    const baseY = centerY;
    
    // 껄충껑충 뛰는 애니메이션 (더 역동적으로)
    const jumpPhase = (frame % 120) / 120;
    let jumpY = 0;
    let isJumping = false;
    
    if (jumpPhase < 0.3) {
        // 점프 상승
        jumpY = Math.sin(jumpPhase * Math.PI / 0.3) * 25;
        isJumping = true;
    } else if (jumpPhase < 0.6) {
        // 착지 후 잠시 정지
        jumpY = 0;
        isJumping = false;
    } else if (jumpPhase < 0.9) {
        // 두 번째 점프
        jumpY = Math.sin((jumpPhase - 0.6) * Math.PI / 0.3) * 20;
        isJumping = true;
    }
    
    const lizardY = baseY - jumpY;
    
    // 도마뱀 그림자
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    const shadowWidth = isJumping ? 20 : 25;
    ctx.fillRect(lizardX - 2, baseY + 8, shadowWidth, 6);
    
    // 도마뱀 몸통 (주황색)
    ctx.fillStyle = '#FF8C00';
    ctx.fillRect(lizardX, lizardY, 20, 8);
    
    // 도마뱀 머리 (진한 주황색)
    ctx.fillStyle = '#FF6600';
    ctx.fillRect(lizardX + 18, lizardY - 2, 8, 12);
    
    // 도마뱀 눈
    ctx.fillStyle = '#000000';
    ctx.fillRect(lizardX + 22, lizardY + 1, 2, 2);
    ctx.fillRect(lizardX + 22, lizardY + 5, 2, 2);
    
    // 눈 반짝임
    if (frame % 80 < 5) {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(lizardX + 22, lizardY + 1, 1, 1);
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(lizardX + 22, lizardY + 5, 1, 1);
    }
    
    // 도마뱀 다리 (뛸 때 접힘) - 어두운 주황색
    ctx.fillStyle = '#FF6600';
    if (isJumping) {
        // 뛸 때 - 다리 접힘
        ctx.fillRect(lizardX + 2, lizardY + 6, 4, 3);
        ctx.fillRect(lizardX + 14, lizardY + 6, 4, 3);
        // 뒷다리
        ctx.fillRect(lizardX - 2, lizardY + 4, 4, 5);
        ctx.fillRect(lizardX + 18, lizardY + 4, 4, 5);
    } else {
        // 서있을 때 - 다리 펴짐
        ctx.fillRect(lizardX + 2, lizardY + 8, 3, 6);
        ctx.fillRect(lizardX + 15, lizardY + 8, 3, 6);
        // 뒷다리
        ctx.fillRect(lizardX - 1, lizardY + 8, 3, 6);
        ctx.fillRect(lizardX + 18, lizardY + 8, 3, 6);
    }
    
    // 도마뱀 등 무늬 (어두운 주황색 점들)
    ctx.fillStyle = '#CC4400';
    ctx.fillRect(lizardX + 3, lizardY + 1, 2, 2);
    ctx.fillRect(lizardX + 8, lizardY + 2, 2, 1);
    ctx.fillRect(lizardX + 13, lizardY + 1, 2, 2);
    
    // 도마뱀 배 (연한 주황색)
    ctx.fillStyle = '#FFCC99';
    ctx.fillRect(lizardX + 2, lizardY + 6, 16, 2);
    
    // 혀 (가끔 날름)
    if (frame % 60 < 8) {
        ctx.fillStyle = '#FF69B4';
        ctx.fillRect(lizardX + 26, lizardY + 3, 4, 1);
    }
    
    // 기쁨 표현 (하트나 별)
    if (jumpY > 15) {
        ctx.fillStyle = '#FF69B4';
        ctx.fillRect(lizardX + 10, lizardY - 10, 6, 4);
        ctx.fillRect(lizardX + 8, lizardY - 8, 2, 2);
        ctx.fillRect(lizardX + 14, lizardY - 8, 2, 2);
    }
}

// 축하 리본 그리기
function drawCelebrationRibbons(ctx, canvas, frame) {
    const colors = ['#FF69B4', '#FFD700', '#87CEEB', '#98FB98'];
    
    for (let i = 0; i < 4; i++) {
        const x = (i * canvas.width / 3) + (Math.sin(frame * 0.02 + i) * 20);
        const y = 20 + Math.sin(frame * 0.03 + i) * 10;
        
        ctx.fillStyle = colors[i];
        // 리본 모양
        ctx.fillRect(x, y, 40, 8);
        ctx.fillRect(x + 5, y - 5, 30, 18);
        // 리본 끝
        ctx.fillRect(x - 10, y + 18, 15, 25);
        ctx.fillRect(x + 35, y + 18, 15, 25);
    }
}

// 가족 사랑 하트
function drawFamilyHearts(ctx, centerX, centerY, frame) {
    const hearts = [
        {x: centerX - 60, y: centerY - 50, size: 1},
        {x: centerX + 40, y: centerY - 60, size: 0.8},
        {x: centerX, y: centerY - 80, size: 1.2}
    ];
    
    hearts.forEach((heart, i) => {
        const phase = (frame + i * 20) % 60;
        const alpha = (Math.sin(phase * 0.1) + 1) * 0.5;
        const scale = heart.size * (1 + Math.sin(phase * 0.1) * 0.2);
        
        ctx.fillStyle = `rgba(255, 105, 180, ${alpha})`;
        // 하트 모양
        const x = heart.x;
        const y = heart.y;
        const s = scale * 8;
        
        ctx.fillRect(x - s, y, s * 2, s);
        ctx.fillRect(x - s * 1.5, y - s * 0.5, s, s);
        ctx.fillRect(x + s * 0.5, y - s * 0.5, s, s);
        ctx.fillRect(x - s * 0.5, y + s, s, s * 0.5);
    });
}

// 폭죽 효과
function drawFireworks(ctx, canvas, frame) {
    const fireworks = [
        {x: 80, y: 80, phase: frame % 120, color: '#FFD700'},
        {x: canvas.width - 80, y: 60, phase: (frame + 40) % 120, color: '#FF69B4'},
        {x: canvas.width / 2, y: 100, phase: (frame + 80) % 120, color: '#87CEEB'}
    ];
    
    fireworks.forEach(fw => {
        if (fw.phase < 60) {
            const size = (fw.phase / 60) * 40;
            const alpha = 1 - (fw.phase / 60);
            
            ctx.fillStyle = fw.color + Math.floor(alpha * 255).toString(16).padStart(2, '0');
            
            // 폭죽 파편들
            for (let i = 0; i < 12; i++) {
                const angle = (i * Math.PI * 2) / 12;
                const x = fw.x + Math.cos(angle) * size;
                const y = fw.y + Math.sin(angle) * size;
                
                ctx.fillRect(x, y, 4, 4);
                
                // 꼬리 효과
                const tailX = fw.x + Math.cos(angle) * size * 0.7;
                const tailY = fw.y + Math.sin(angle) * size * 0.7;
                ctx.fillRect(tailX, tailY, 2, 2);
            }
        }
    });
}

// 집 안 배경
function drawHomeBackground(ctx, canvas) {
    // 벽 (하얀색)
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height - 60);
    
    // 바닥 타일
    ctx.fillStyle = '#DEB887';
    for (let x = 0; x < canvas.width; x += 30) {
        for (let y = canvas.height - 60; y < canvas.height; y += 30) {
            ctx.fillRect(x, y, 28, 28);
        }
    }
    
    // 창문
    ctx.fillStyle = '#87CEEB';
    ctx.fillRect(canvas.width - 80, 40, 60, 60);
    ctx.strokeStyle = '#8B4513';
    ctx.lineWidth = 3;
    ctx.strokeRect(canvas.width - 80, 40, 60, 60);
    ctx.strokeRect(canvas.width - 50, 40, 0, 60);
    ctx.strokeRect(canvas.width - 80, 70, 60, 0);
    
    // 햇빛
    ctx.fillStyle = 'rgba(255, 215, 0, 0.3)';
    ctx.fillRect(canvas.width - 120, 100, 40, 30);
}

// 먹이 그릇 (상세 버전)
function drawFoodBowl(ctx, centerX, centerY, frame) {
    // 그릇 그림자
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(centerX - 35, centerY + 15, 70, 8);
    
    // 그릇 바닥
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(centerX - 30, centerY, 60, 20);
    
    // 그릇 테두리
    ctx.fillStyle = '#CD853F';
    ctx.fillRect(centerX - 35, centerY - 5, 70, 8);
    ctx.fillRect(centerX - 35, centerY + 17, 70, 8);
    
    // 물 (약간 출렁이는 효과)
    const waterOffset = Math.sin(frame * 0.1) * 2;
    ctx.fillStyle = '#4169E1';
    ctx.fillRect(centerX - 25, centerY + 3 + waterOffset, 50, 12);
    
    // 물 반사 효과
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.fillRect(centerX - 20, centerY + 5 + waterOffset, 40, 3);
    
    // 그릇 장식
    ctx.fillStyle = '#FFD700';
    ctx.fillRect(centerX - 10, centerY - 8, 20, 3);
    ctx.font = '12px Arial';
    ctx.fillText('KIWI', centerX - 15, centerY - 10);
}

// 키위 행복 표시
function drawKiwiHappiness(ctx, x, y, frame) {
    const happiness = [
        {type: 'heart', offset: 0, color: '#FF69B4'},
        {type: 'star', offset: 20, color: '#FFD700'},
        {type: 'note', offset: 40, color: '#32CD32'}
    ];
    
    happiness.forEach((item, i) => {
        const phase = (frame + i * 15) % 60;
        const floatY = y - Math.sin(phase * 0.1) * 20;
        const alpha = (Math.sin(phase * 0.1) + 1) * 0.5;
        
        ctx.fillStyle = item.color + Math.floor(alpha * 255).toString(16).padStart(2, '0');
        
        switch(item.type) {
            case 'heart':
                // 하트
                ctx.fillRect(x - 4, floatY, 8, 6);
                ctx.fillRect(x - 6, floatY - 2, 4, 4);
                ctx.fillRect(x + 2, floatY - 2, 4, 4);
                break;
            case 'star':
                // 별
                ctx.fillRect(x + item.offset - 2, floatY, 4, 4);
                ctx.fillRect(x + item.offset, floatY - 2, 0, 8);
                ctx.fillRect(x + item.offset - 4, floatY + 2, 8, 0);
                break;
            case 'note':
                // 음표
                ctx.fillRect(x + item.offset, floatY, 2, 12);
                ctx.fillRect(x + item.offset - 3, floatY + 8, 6, 4);
                break;
        }
    });
}

// 따뜻한 분위기 효과
function drawWarmAtmosphere(ctx, canvas, frame) {
    // 따뜻한 빛 입자들
    for (let i = 0; i < 20; i++) {
        const x = (i * 50 + Math.sin(frame * 0.02 + i) * 30) % canvas.width;
        const y = 100 + Math.sin(frame * 0.03 + i) * 50;
        const alpha = (Math.sin(frame * 0.05 + i) + 1) * 0.3;
        
        ctx.fillStyle = `rgba(255, 215, 0, ${alpha})`;
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fill();
    }
}

// 놀이방 배경
function drawPlayroomBackground(ctx, canvas) {
    // 벽지 (귀여운 패턴)
    ctx.fillStyle = '#FFE4E1';
    ctx.fillRect(0, 0, canvas.width, canvas.height - 60);
    
    // 벽지 패턴 (작은 하트들)
    ctx.fillStyle = 'rgba(255, 182, 193, 0.3)';
    for (let x = 0; x < canvas.width; x += 40) {
        for (let y = 0; y < canvas.height - 60; y += 40) {
            ctx.fillRect(x + 15, y + 15, 8, 6);
            ctx.fillRect(x + 13, y + 13, 4, 4);
            ctx.fillRect(x + 19, y + 13, 4, 4);
        }
    }
    
    // 카펫
    ctx.fillStyle = '#FF69B4';
    ctx.fillRect(50, canvas.height - 120, canvas.width - 100, 80);
    ctx.fillStyle = '#FFB6C1';
    ctx.fillRect(60, canvas.height - 110, canvas.width - 120, 60);
}

// 하얀색 네모 텐트 (명확하게)
function drawWhiteSquareTent(ctx, centerX, centerY, frame) {
    const tentWidth = 140;
    const tentHeight = 80;
    
    // 텐트 그림자
    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.fillRect(centerX - tentWidth/2 - 8, centerY + tentHeight - 5, tentWidth + 16, 12);
    
    // 텐트 바닥 (회색 매트)
    ctx.fillStyle = '#D3D3D3';
    ctx.fillRect(centerX - tentWidth/2, centerY + tentHeight - 15, tentWidth, 15);
    
    // 텐트 뒷벽 (하얀색)
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(centerX - tentWidth/2, centerY + tentHeight - 15 - tentHeight, tentWidth, tentHeight);
    
    // 텐트 테두리 (검은 라인)
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3;
    ctx.strokeRect(centerX - tentWidth/2, centerY + tentHeight - 15 - tentHeight, tentWidth, tentHeight);
    
    // 텐트 지붕 (삼각형, 하얀색)
    ctx.fillStyle = '#F8F8FF';
    ctx.beginPath();
    ctx.moveTo(centerX - tentWidth/2, centerY + tentHeight - 15 - tentHeight);
    ctx.lineTo(centerX, centerY + tentHeight - 15 - tentHeight - 30);
    ctx.lineTo(centerX + tentWidth/2, centerY + tentHeight - 15 - tentHeight);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    
    // 지붕 중앙선
    ctx.strokeStyle = '#CCCCCC';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY + tentHeight - 15 - tentHeight - 30);
    ctx.lineTo(centerX, centerY + tentHeight - 15 - tentHeight);
    ctx.stroke();
    
    // 텐트 입구 (네모난 문)
    const doorWidth = 40;
    const doorHeight = 50;
    ctx.fillStyle = '#2F2F2F';
    ctx.fillRect(centerX - doorWidth/2, centerY + tentHeight - 15 - doorHeight, doorWidth, doorHeight);
    
    // 문 테두리
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.strokeRect(centerX - doorWidth/2, centerY + tentHeight - 15 - doorHeight, doorWidth, doorHeight);
    
    // 텐트 창문 (양쪽에)
    const windowSize = 15;
    // 왼쪽 창문
    ctx.fillStyle = '#87CEEB';
    ctx.fillRect(centerX - tentWidth/2 + 15, centerY + tentHeight - 15 - tentHeight + 20, windowSize, windowSize);
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.strokeRect(centerX - tentWidth/2 + 15, centerY + tentHeight - 15 - tentHeight + 20, windowSize, windowSize);
    // 창문 십자
    ctx.beginPath();
    ctx.moveTo(centerX - tentWidth/2 + 15 + windowSize/2, centerY + tentHeight - 15 - tentHeight + 20);
    ctx.lineTo(centerX - tentWidth/2 + 15 + windowSize/2, centerY + tentHeight - 15 - tentHeight + 20 + windowSize);
    ctx.moveTo(centerX - tentWidth/2 + 15, centerY + tentHeight - 15 - tentHeight + 20 + windowSize/2);
    ctx.lineTo(centerX - tentWidth/2 + 15 + windowSize, centerY + tentHeight - 15 - tentHeight + 20 + windowSize/2);
    ctx.stroke();
    
    // 오른쪽 창문
    ctx.fillStyle = '#87CEEB';
    ctx.fillRect(centerX + tentWidth/2 - 30, centerY + tentHeight - 15 - tentHeight + 20, windowSize, windowSize);
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.strokeRect(centerX + tentWidth/2 - 30, centerY + tentHeight - 15 - tentHeight + 20, windowSize, windowSize);
    // 창문 십자
    ctx.beginPath();
    ctx.moveTo(centerX + tentWidth/2 - 30 + windowSize/2, centerY + tentHeight - 15 - tentHeight + 20);
    ctx.lineTo(centerX + tentWidth/2 - 30 + windowSize/2, centerY + tentHeight - 15 - tentHeight + 20 + windowSize);
    ctx.moveTo(centerX + tentWidth/2 - 30, centerY + tentHeight - 15 - tentHeight + 20 + windowSize/2);
    ctx.lineTo(centerX + tentWidth/2 - 30 + windowSize, centerY + tentHeight - 15 - tentHeight + 20 + windowSize/2);
    ctx.stroke();
    
    // 텐트 깃발 (지붕 위)
    ctx.fillStyle = '#FF69B4';
    ctx.fillRect(centerX - 2, centerY + tentHeight - 15 - tentHeight - 40, 4, 15);
    ctx.fillRect(centerX + 2, centerY + tentHeight - 15 - tentHeight - 35, 12, 8);
}

// 고급 장난감 컬렉션 (더 디테일하게)
function drawAdvancedToyCollection(ctx, centerX, centerY, frame) {
    const baseY = centerY + 60;
    
    // 레고 블록 타워 (무지개색)
    const blockColors = ['#FF0000', '#FFD700', '#00FF00', '#0000FF', '#9370DB'];
    for (let i = 0; i < 5; i++) {
        ctx.fillStyle = blockColors[i];
        ctx.fillRect(centerX - 80, baseY - i * 15, 20, 15);
        // 블록 돌기들
        ctx.fillStyle = blockColors[i];
        for (let j = 0; j < 4; j++) {
            ctx.beginPath();
            ctx.arc(centerX - 75 + j * 5, baseY - i * 15 - 3, 2, 0, Math.PI * 2);
            ctx.fill();
        }
        // 블록 테두리
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1;
        ctx.strokeRect(centerX - 80, baseY - i * 15, 20, 15);
    }
    
    // 공들 (여러 개, 굴러가는 애니메이션)
    const balls = [
        {x: centerX - 40, color: '#FF69B4', size: 12},
        {x: centerX - 20, color: '#32CD32', size: 10},
        {x: centerX, color: '#FFD700', size: 8}
    ];
    
    balls.forEach((ball, i) => {
        const ballX = ball.x + Math.sin(frame * 0.05 + i) * 15;
        ctx.fillStyle = ball.color;
        ctx.beginPath();
        ctx.arc(ballX, baseY + 10, ball.size, 0, Math.PI * 2);
        ctx.fill();
        
        // 공 패턴/무늬
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(ballX - ball.size/3, baseY + 10 - ball.size/3, ball.size/4, 0, Math.PI * 2);
        ctx.fill();
        
        // 공 그림자
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.beginPath();
        ctx.ellipse(ballX, baseY + 20, ball.size * 0.8, ball.size * 0.3, 0, 0, Math.PI * 2);
        ctx.fill();
    });
    
    // 테디베어 (큰 인형)
    const bearX = centerX + 30;
    const bearY = baseY - 10;
    const bearSway = Math.sin(frame * 0.06) * 2;
    
    // 곰 몸
    ctx.fillStyle = '#DEB887';
    ctx.fillRect(bearX + bearSway, bearY, 18, 25);
    
    // 곰 머리
    ctx.fillStyle = '#DEB887';
    ctx.beginPath();
    ctx.arc(bearX + 9 + bearSway, bearY - 5, 12, 0, Math.PI * 2);
    ctx.fill();
    
    // 곰 귀
    ctx.beginPath();
    ctx.arc(bearX + 3 + bearSway, bearY - 12, 5, 0, Math.PI * 2);
    ctx.arc(bearX + 15 + bearSway, bearY - 12, 5, 0, Math.PI * 2);
    ctx.fill();
    
    // 곰 눈
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(bearX + 6 + bearSway, bearY - 7, 2, 0, Math.PI * 2);
    ctx.arc(bearX + 12 + bearSway, bearY - 7, 2, 0, Math.PI * 2);
    ctx.fill();
    
    // 곰 코
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(bearX + 8 + bearSway, bearY - 3, 2, 2);
    
    // 곰 팔다리
    ctx.fillStyle = '#DEB887';
    ctx.fillRect(bearX - 3 + bearSway, bearY + 5, 8, 15);
    ctx.fillRect(bearX + 13 + bearSway, bearY + 5, 8, 15);
    ctx.fillRect(bearX + 3 + bearSway, bearY + 25, 6, 12);
    ctx.fillRect(bearX + 9 + bearSway, bearY + 25, 6, 12);
    
    // 자동차들 (더 디테일하게)
    const cars = [
        {x: centerX + 60, color: '#FF0000', type: 'sports'},
        {x: centerX + 85, color: '#0000FF', type: 'truck'},
        {x: centerX + 110, color: '#00FF00', type: 'police'}
    ];
    
    cars.forEach(car => {
        const carY = baseY + 5;
        
        // 차 몸체
        ctx.fillStyle = car.color;
        ctx.fillRect(car.x, carY, 22, 10);
        
        if (car.type === 'truck') {
            // 트럭 적재함
            ctx.fillRect(car.x - 8, carY, 8, 10);
        } else if (car.type === 'sports') {
            // 스포츠카 스포일러
            ctx.fillRect(car.x - 3, carY + 2, 3, 6);
        }
        
        // 바퀴
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(car.x + 4, carY + 12, 4, 0, Math.PI * 2);
        ctx.arc(car.x + 18, carY + 12, 4, 0, Math.PI * 2);
        ctx.fill();
        
        // 바퀴 림
        ctx.fillStyle = '#SILVER';
        ctx.beginPath();
        ctx.arc(car.x + 4, carY + 12, 2, 0, Math.PI * 2);
        ctx.arc(car.x + 18, carY + 12, 2, 0, Math.PI * 2);
        ctx.fill();
        
        // 창문
        ctx.fillStyle = '#87CEEB';
        ctx.fillRect(car.x + 3, carY + 1, 16, 6);
        
        // 경찰차 표시
        if (car.type === 'police') {
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(car.x + 8, carY + 3, 6, 2);
        }
    });
    
    // 퍼즐 조각들 (바닥에 흩어져 있는)
    const puzzlePieces = [
        {x: centerX - 60, y: baseY + 25, color: '#FF69B4'},
        {x: centerX - 45, y: baseY + 30, color: '#32CD32'},
        {x: centerX - 30, y: baseY + 28, color: '#FFD700'},
        {x: centerX - 15, y: baseY + 32, color: '#9370DB'}
    ];
    
    puzzlePieces.forEach((piece, i) => {
        const rotation = Math.sin(frame * 0.03 + i) * 0.2;
        ctx.save();
        ctx.translate(piece.x, piece.y);
        ctx.rotate(rotation);
        
        ctx.fillStyle = piece.color;
        ctx.fillRect(-6, -6, 12, 12);
        // 퍼즐 돌기
        ctx.fillRect(6, -2, 4, 4);
        ctx.fillRect(-2, -10, 4, 4);
        
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1;
        ctx.strokeRect(-6, -6, 12, 12);
        ctx.strokeRect(6, -2, 4, 4);
        ctx.strokeRect(-2, -10, 4, 4);
        
        ctx.restore();
    });
}

// 텐트 내부 조명 (개선)
function drawTentInteriorLighting(ctx, centerX, centerY, frame) {
    // 따뜻한 내부 조명 효과
    const lightIntensity = (Math.sin(frame * 0.04) + 1) * 0.2 + 0.3;
    
    const gradient = ctx.createRadialGradient(
        centerX, centerY + 20, 0,
        centerX, centerY + 20, 100
    );
    gradient.addColorStop(0, `rgba(255, 248, 220, ${lightIntensity})`);
    gradient.addColorStop(0.7, `rgba(255, 248, 220, ${lightIntensity * 0.5})`);
    gradient.addColorStop(1, 'rgba(255, 248, 220, 0)');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(centerX - 100, centerY - 40, 200, 120);
}

// 향상된 놀이 효과
function drawEnhancedPlayEffects(ctx, centerX, centerY, frame) {
    // 비눗방울들
    for (let i = 0; i < 8; i++) {
        const bubbleX = centerX + Math.sin(frame * 0.02 + i) * 60;
        const bubbleY = centerY - 30 + Math.cos(frame * 0.03 + i) * 20;
        const bubbleSize = 3 + Math.sin(frame * 0.05 + i) * 2;
        
        // 방울 외곽
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(bubbleX, bubbleY, bubbleSize, 0, Math.PI * 2);
        ctx.stroke();
        
        // 방울 반사광
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.beginPath();
        ctx.arc(bubbleX - bubbleSize/3, bubbleY - bubbleSize/3, bubbleSize/3, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // 음표들 (즐거운 분위기)
    const notes = ['♪', '♫', '♩', '♬'];
    for (let i = 0; i < 4; i++) {
        const noteX = centerX - 50 + i * 30;
        const noteY = centerY - 50 + Math.sin(frame * 0.08 + i) * 15;
        const alpha = (Math.sin(frame * 0.06 + i) + 1) * 0.4;
        
        ctx.fillStyle = `rgba(255, 105, 180, ${alpha})`;
        ctx.font = '16px Arial';
        ctx.fillText(notes[i], noteX, noteY);
    }
    
    // 반짝이는 먼지 (더 세밀하게)
    for (let i = 0; i < 20; i++) {
        const sparkleX = centerX + Math.cos(frame * 0.03 + i) * 80;
        const sparkleY = centerY + Math.sin(frame * 0.04 + i) * 40;
        const sparklePhase = (frame + i * 5) % 40;
        const alpha = sparklePhase < 20 ? sparklePhase / 20 : (40 - sparklePhase) / 20;
        
        ctx.fillStyle = `rgba(255, 215, 0, ${alpha * 0.9})`;
        ctx.fillRect(sparkleX - 1, sparkleY - 1, 2, 2);
        
        // 십자 반짝임
        if (alpha > 0.5) {
            ctx.fillRect(sparkleX - 3, sparkleY, 6, 1);
            ctx.fillRect(sparkleX, sparkleY - 3, 1, 6);
        }
    }
}
