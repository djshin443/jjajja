// 영어 게임 로직 - 완전 버전

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;

// 픽셀 스케일과 물리 상수
let PIXEL_SCALE = 3;
const GRAVITY = 0.8;
const JUMP_POWER = -18;
const JUMP_FORWARD_SPEED = 6;
let GROUND_Y = 240;

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
    selectedUnits: [], // 선택된 Unit들
    selectedCharacter: 'jiyul',
	selectedVehicle: 'none',
    distance: 0,
    speed: 4,
    questionActive: false,
    currentEnemy: null,
    backgroundOffset: 0,
    currentQuestion: null, // 현재 문제 객체
    isMoving: true,
    cameraX: 0,
    screenShake: 0,
    shakeTimer: 0
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
let particles = [];

// 캔버스 크기 조정
function resizeCanvas() {
    const container = document.getElementById('gameContainer');
    const controls = document.getElementById('controls');
    const controlsHeight = controls ? controls.offsetHeight : 0;
    
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight - controlsHeight;
    
    canvas.width = screenWidth;
    canvas.height = screenHeight;
    
    if (screenWidth > screenHeight) {
        PIXEL_SCALE = Math.floor(screenHeight / 120);
        if (PIXEL_SCALE < 2) PIXEL_SCALE = 2;
        if (PIXEL_SCALE > 4) PIXEL_SCALE = 4;
    } else {
        PIXEL_SCALE = 3;
    }
    
    if (player) {
        player.width = 16 * PIXEL_SCALE;
        player.height = 16 * PIXEL_SCALE;
    }
    
    GROUND_Y = screenHeight - (screenHeight * 0.25);
    
    if (player && gameState && !gameState.questionActive) {
        player.y = GROUND_Y;
    }
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
            fullscreenBtn.textContent = '🏠추가';
        }
    }
}

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
    
    player.sprite = gameState.selectedCharacter;
    player.x = 100;
    player.worldX = 100;
    player.y = GROUND_Y;
    player.hp = 100;
    player.velocityY = 0;
    player.velocityX = 0;
    player.onGround = true;
    player.isJumping = false;
    
    // 게임 통계 초기화
    gameStats.startTime = Date.now();
    gameStats.correctAnswers = 0;
    gameStats.totalQuestions = 0;
    
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

    generateMoreEnemies();
}

// 몬스터 무한 생성
function generateMoreEnemies() {
    const currentMaxX = Math.max(...enemies.map(e => e.x), player.worldX);
    const startX = Math.max(currentMaxX + 300, player.worldX + 800);
    
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

    if (Math.random() < 0.3) {
        const bossX = startX + 1000;
        enemies.push({
            x: bossX,
            y: GROUND_Y,
            width: 16 * PIXEL_SCALE,
            height: 16 * PIXEL_SCALE,
            hp: 1,
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
    if (gameState.isMoving && !gameState.questionActive) {
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
    updateParticles();

    enemies = enemies.filter(enemy => 
        enemy.alive && (enemy.x > gameState.cameraX - 500)
    );

    const aheadEnemies = enemies.filter(enemy => 
        enemy.x > player.worldX && enemy.x < player.worldX + 2000
    );
    
    if (aheadEnemies.length < 3) {
        generateMoreEnemies();
    }

    if (gameState.distance > gameState.stage * 3000) {
        if (gameState.stage >= 20) {
            showEnding();
            return;
        }
        nextStage();
    }
}

// 플레이어 물리 업데이트
function updatePlayerPhysics() {
    if (!player.onGround) {
        player.velocityY += GRAVITY;
    }
    
    player.y += player.velocityY;
    
    if (player.velocityX !== 0) {
        player.worldX += player.velocityX;
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
        
        if (player.velocityX > 2) {
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
                    enemy.velocityY = JUMP_POWER * 0.7;
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
        }
    });
}

// 충돌 체크
function checkCollisions() {
    obstacles.forEach(obstacle => {
        const obstacleScreenX = obstacle.x - gameState.cameraX;
        
        if (obstacleScreenX > -100 && obstacleScreenX < canvas.width + 100) {
            if (checkBoxCollision(
                {x: player.worldX, y: player.y, width: player.width, height: player.height},
                {x: obstacle.x, y: obstacle.y, width: obstacle.width, height: obstacle.height}
            )) {
                if (obstacle.type === 'spike' && !obstacle.passed) {
                    obstacle.passed = true;
                    createParticles(player.x, player.y, 'hint');
                    gameState.score += 5;
                    updateUI();
                }
                else if (obstacle.type !== 'spike' && player.onGround) {
                    player.worldX = obstacle.x - player.width - 5;
                    player.velocityX = 0;
                    gameState.isMoving = false;
                    gameState.shakeTimer = 10;
                    
                    if (Math.random() < 0.01) {
                        createParticles(player.x, player.y - 30, 'hint');
                    }
                }
            } else {
                if (player.worldX > obstacle.x + obstacle.width && !obstacle.passed) {
                    obstacle.passed = true;
                    gameState.isMoving = true;
                    gameState.score += 10;
                    createParticles(player.x, player.y - 20, 'hint');
                    updateUI();
                }
            }
        }
    });
    
    enemies.forEach(enemy => {
        if (!enemy.alive) return;
        
        const enemyScreenX = enemy.x - gameState.cameraX;
        
        if (enemyScreenX > -100 && enemyScreenX < canvas.width + 100) {
            if (checkBoxCollision(
                {x: player.worldX, y: player.y, width: player.width, height: player.height},
                {x: enemy.x, y: enemy.y, width: enemy.width, height: enemy.height}
            )) {
                if (!gameState.questionActive) {
                    gameState.questionActive = true;
                    gameState.currentEnemy = enemy;
                    gameState.isMoving = false;
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
    
    drawBackground();
    
    ctx.fillStyle = '#228B22';
    ctx.fillRect(0, GROUND_Y + 16 * PIXEL_SCALE, canvas.width, canvas.height);
    
    obstacles.forEach(obstacle => {
        const screenX = obstacle.x - gameState.cameraX;
        if (screenX > -100 && screenX < canvas.width + 100) {
            if (typeof pixelData !== 'undefined' && pixelData[obstacle.type]) {
                const data = pixelData[obstacle.type];
                drawPixelSprite(data.sprite, data.colorMap, screenX, obstacle.y - obstacle.height);
            }
            
            if (!gameState.isMoving && Math.abs(player.worldX - obstacle.x) < 100) {
                ctx.fillStyle = 'rgba(255, 255, 0, 0.5)';
                ctx.fillRect(screenX, obstacle.y - obstacle.height - 10, obstacle.width, 5);
            }
        }
    });
    
    enemies.forEach(enemy => {
        if (!enemy.alive) return;
        const screenX = enemy.x - gameState.cameraX;
        if (screenX > -100 && screenX < canvas.width + 100) {
            if (typeof pixelData !== 'undefined' && pixelData[enemy.type]) {
                const data = pixelData[enemy.type];
                drawPixelSprite(data.idle, data.colorMap, screenX, enemy.y - enemy.height);
            }
            
            if (enemy.type === 'boss' && enemy.isAggro) {
                ctx.fillStyle = 'red';
                ctx.fillRect(screenX, enemy.y - enemy.height - 15, enemy.width, 3);
            }
        }
    });
    
    if (typeof pixelData !== 'undefined' && pixelData[player.sprite]) {
		// 지율이가 탈것을 타고 있는 경우
		if (player.sprite === 'jiyul' && gameState.selectedVehicle !== 'none') {
			// 먼저 탈것 그리기
			if (gameState.selectedVehicle === 'kiwi' && pixelData.kiwi) {
				const kiwiData = pixelData.kiwi;
				let kiwiSprite;
				
				if (player.isJumping) {
					kiwiSprite = kiwiData.jump;
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
				
				// 키위를 약간 아래에 그리기
				drawPixelSprite(kiwiSprite, kiwiData.colorMap, player.x, player.y - player.height + 20);
				
				// 지율이를 키위 위에 그리기
				const jiyulData = pixelData.jiyul;
				drawPixelSprite(jiyulData.idle, jiyulData.colorMap, player.x, player.y - player.height - 6);
				
			} else if (gameState.selectedVehicle === 'whitehouse' && pixelData.whitehouse) {
				const whData = pixelData.whitehouse;
				let whSprite;
				
				if (player.isJumping) {
					whSprite = whData.jump;
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
				
				// 화이트하우스 그리기
				drawPixelSprite(whSprite, whData.colorMap, player.x, player.y - player.height);
				
				// 지율이를 화이트하우스 위에 그리기
				const jiyulData = pixelData.jiyul;
				drawPixelSprite(jiyulData.idle, jiyulData.colorMap, player.x, player.y - player.height - 30);
			}
		} else {
			// 일반적인 캐릭터 그리기
			const playerData = pixelData[player.sprite];
			let sprite;
			
			if (player.isJumping) {
				sprite = playerData.jump;
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
			
			drawPixelSprite(sprite, playerData.colorMap, player.x, player.y - player.height);
		}
	}
    
    particles.forEach(particle => {
        ctx.fillStyle = particle.color;
        ctx.fillRect(particle.x, particle.y, 4, 4);
    });
    
    updateTextParticles(ctx);
    
    if (!gameState.isMoving && !gameState.questionActive) {
        ctx.fillStyle = 'rgba(255, 255, 0, 0.8)';
        ctx.font = 'bold 18px Jua';
        ctx.textAlign = 'center';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.strokeText('점프로 장애물을 뛰어넘으세요!', canvas.width / 2, 50);
        ctx.fillText('점프로 장애물을 뛰어넘으세요!', canvas.width / 2, 50);
    }
    
    ctx.restore();
}

// 배경 그리기 (화려한 버전)
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
    
    // 날아다니는 요소들
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
    // 가장 먼 산맥들 (보라색 계열)
    const farOffset = (gameState.backgroundOffset * 0.1) % (canvas.width + 600);
    ctx.fillStyle = '#9370DB';
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
}

// 식물들 그리기
function drawVegetation() {
    const treeOffset = (gameState.backgroundOffset * 0.5) % (canvas.width + 400);
    
    const trees = [
        {x: 120, type: 'pine', size: 1.0},
        {x: 280, type: 'oak', size: 1.2},
        {x: 450, type: 'pine', size: 0.8},
        {x: 620, type: 'birch', size: 1.1},
        {x: 800, type: 'oak', size: 1.3}
    ];
    
    trees.forEach(tree => {
        drawTree(tree.x - treeOffset, GROUND_Y, tree.type, tree.size);
    });
}

// 나무 그리기
function drawTree(x, y, type, size) {
    if (x < -100 || x > canvas.width + 100) return;
    
    const trunkHeight = 60 * size;
    const trunkWidth = 12 * size;
    
    // 나무 기둥
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(x - trunkWidth/2, y - trunkHeight, trunkWidth, trunkHeight);
    
    // 나무 잎사귀
    ctx.fillStyle = '#228B22';
    if (type === 'pine') {
        // 소나무 모양
        for (let i = 0; i < 3; i++) {
            const leafY = y - trunkHeight + i * 15 * size;
            const leafSize = (35 - i * 5) * size;
            ctx.beginPath();
            ctx.moveTo(x, leafY - leafSize);
            ctx.lineTo(x - leafSize/2, leafY);
            ctx.lineTo(x + leafSize/2, leafY);
            ctx.closePath();
            ctx.fill();
        }
    } else {
        // 둥근 나무
        ctx.beginPath();
        ctx.arc(x, y - trunkHeight, 35 * size, 0, Math.PI * 2);
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
            ctx.strokeStyle = '#228B22';
            ctx.lineWidth = 2;
            for (let j = 0; j < 3; j++) {
                ctx.beginPath();
                ctx.moveTo(x + j * 3, GROUND_Y + 5);
                ctx.lineTo(x + j * 3 + Math.random() * 4 - 2, GROUND_Y - 3 - Math.random() * 5);
                ctx.stroke();
            }
        }
    }
    
    // 꽃들
    const flowers = [
        {x: 80, color: '#FF69B4'},
        {x: 180, color: '#FFB6C1'},
        {x: 280, color: '#FF1493'},
        {x: 380, color: '#FFC0CB'},
        {x: 480, color: '#FFD700'}
    ];
    
    flowers.forEach(flower => {
        const x = flower.x - flowerOffset;
        if (x > -50 && x < canvas.width + 50) {
            // 꽃 줄기
            ctx.strokeStyle = '#228B22';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(x, GROUND_Y + 10);
            ctx.lineTo(x, GROUND_Y - 15);
            ctx.stroke();
            
            // 꽃잎
            ctx.fillStyle = flower.color;
            ctx.beginPath();
            ctx.arc(x, GROUND_Y - 15, 8, 0, Math.PI * 2);
            ctx.fill();
        }
    });
}

// 날아다니는 요소들
function drawFlyingElements() {
    // 새들
    const birdOffset = (gameState.backgroundOffset * 0.6) % (canvas.width + 500);
    const birds = [
        {x: 150, y: 80},
        {x: 400, y: 120},
        {x: 650, y: 60}
    ];
    
    birds.forEach(bird => {
        const x = bird.x - birdOffset;
        if (x > -50 && x < canvas.width + 50) {
            const wingFlap = Math.sin(gameState.distance * 0.2) * 5;
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(x - 15, bird.y + wingFlap);
            ctx.lineTo(x, bird.y - 8);
            ctx.lineTo(x + 15, bird.y + wingFlap);
            ctx.stroke();
        }
    });
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

// 간단한 구름 그리기
function drawSimpleClouds() {
    const cloudOffset = (gameState.backgroundOffset * 0.3) % (canvas.width + 200);
    
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    for (let i = 0; i < 5; i++) {
        const x = (i * 200) - cloudOffset;
        const y = 50 + Math.sin(i) * 20;
        
        if (x > -100 && x < canvas.width + 100) {
            // 구름 모양
            ctx.beginPath();
            ctx.arc(x, y, 25, 0, Math.PI * 2);
            ctx.arc(x + 25, y, 35, 0, Math.PI * 2);
            ctx.arc(x + 50, y, 25, 0, Math.PI * 2);
            ctx.arc(x + 25, y - 15, 20, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}

// 영어 문제 생성
function generateEnglishQuestion() {
    if (!wordManager || gameState.selectedUnits.length === 0) {
        console.error('WordManager가 초기화되지 않았거나 선택된 Unit이 없습니다.');
        return;
    }
    
    gameState.currentQuestion = wordManager.generateMultipleChoice(gameState.selectedUnits);
    
    // 보스전의 경우 더 어려운 문제 (Unit 7-8에서만)
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
    
    // 영어 단어 표시
    document.getElementById('questionText').innerHTML = `✨ ${gameState.currentQuestion.question}`;
    
    // 적 정보 표시
    if (gameState.currentEnemy) {
        const enemyName = gameState.currentEnemy.type === 'boss' ? '👑 보스' : 
                         gameState.currentEnemy.type === 'slime' ? '💧 슬라임' : '👹 고블린';
        document.getElementById('enemyInfo').textContent = 
            `${enemyName} 체력: ${gameState.currentEnemy.hp}/${gameState.currentEnemy.maxHp}`;
    }
    
    // 4지선다 버튼 생성
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
        // 정답!
        gameState.score += 20;
        gameStats.correctAnswers++;
        
        if (gameState.currentEnemy) {
            gameState.currentEnemy.hp -= 1;
            const enemyScreenX = gameState.currentEnemy.x - gameState.cameraX;
            createParticles(enemyScreenX, gameState.currentEnemy.y, 'hit');
            
            if (gameState.currentEnemy.hp <= 0) {
                gameState.currentEnemy.alive = false;
                gameState.score += gameState.currentEnemy.type === 'boss' ? 100 : 50;
                createParticles(enemyScreenX, gameState.currentEnemy.y, 'defeat');
                
                gameState.isMoving = true;
                
                document.getElementById('questionPanel').style.display = 'none';
                gameState.questionActive = false;
                gameState.currentEnemy = null;
                
                showFloatingText(player.x, player.y - 50, '완료!', '#00FF00');
            } else {
                generateEnglishQuestion();
                updateQuestionPanel();
                showFloatingText(player.x, player.y - 30, '맞았어요!', '#FFD700');
            }
        }
    } else {
        // 오답
        player.hp -= 15;
        createParticles(player.x, player.y, 'hurt');
        const correctAnswer = gameState.currentQuestion.choices[gameState.currentQuestion.correctIndex];
        showFloatingText(player.x, player.y - 30, `틀렸어요! 정답: ${correctAnswer}`, '#FF0000');
        
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
    
    document.getElementById('characterSelectMenu').style.display = 'none';
    document.getElementById('unitSelectMenu').style.display = 'none';
    document.getElementById('ui').style.display = 'block';
    
    const displayText = gameState.selectedUnits.join(', ');
    document.getElementById('unitText').textContent = displayText;
    
    initGame();
}

// 메뉴 표시
function showMenu() {
    gameState.running = false;
    document.getElementById('characterSelectMenu').style.display = 'flex';
    document.getElementById('unitSelectMenu').style.display = 'none';
    document.getElementById('ui').style.display = 'none';
    document.getElementById('questionPanel').style.display = 'none';
}

// 화면 전환 함수들
function showUnitSelectMenu() {
    document.getElementById('characterSelectMenu').style.display = 'none';
    document.getElementById('unitSelectMenu').style.display = 'flex';
    updateSelectedCharacterDisplay();
}

function showCharacterSelectMenu() {
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

// 게임 오버
function gameOver() {
    gameState.running = false;
    alert(`게임 오버! 😢\n최종 점수: ${gameState.score}점\n다시 도전해보세요!`);
    showMenu();
}

// 다음 스테이지
function nextStage() {
    if (gameState.stage >= 20) {
        showEnding();
        return;
    }
    
    gameState.stage++;
    gameState.speed += 0.5;
    alert(`🎉 스테이지 ${gameState.stage - 1} 클리어! 🎉\n스테이지 ${gameState.stage}로 이동합니다!`);
    
    generateMoreEnemies();
}

// 엔딩 표시 (간단 버전)
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

// 떠다니는 텍스트 효과 (이미 있지만 보완)
function showFloatingText(x, y, text, color) {
    const textParticle = {
        x: x,
        y: y,
        text: text,
        color: color,
        life: 60,
        vy: -2,
        alpha: 1.0
    };
    
    if (!window.textParticles) {
        window.textParticles = [];
    }
    window.textParticles.push(textParticle);
}

// 텍스트 파티클 업데이트 (이미 있지만 보완)
function updateTextParticles(ctx) {
    if (!window.textParticles) return;
    
    window.textParticles = window.textParticles.filter(particle => {
        particle.y += particle.vy;
        particle.life--;
        particle.alpha = particle.life / 60;
        
        if (particle.life > 0) {
            ctx.save();
            ctx.globalAlpha = particle.alpha;
            ctx.fillStyle = particle.color;
            ctx.font = 'bold 16px Jua';
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

// 파티클 생성
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

// 점프 함수
function jump() {
    if (player.onGround && !gameState.questionActive) {
        const jumpPower = getJumpPower();
        player.velocityY = jumpPower;
        
        const forwardSpeed = isMobileDevice() ? JUMP_FORWARD_SPEED * 1.2 : JUMP_FORWARD_SPEED * 1.5;
        player.velocityX = forwardSpeed;
        
        player.isJumping = true;
        player.onGround = false;
        gameState.isMoving = true;
        
        createParticles(player.x, player.y, 'hint');
        gameState.score += 1;
        updateUI();
    }
}

// 떠다니는 텍스트 효과
function showFloatingText(x, y, text, color) {
    const textParticle = {
        x: x,
        y: y,
        text: text,
        color: color,
        life: 60,
        vy: -2,
        alpha: 1.0
    };
    
    if (!window.textParticles) {
        window.textParticles = [];
    }
    window.textParticles.push(textParticle);
}

// 텍스트 파티클 업데이트
function updateTextParticles(ctx) {
    if (!window.textParticles) return;
    
    window.textParticles = window.textParticles.filter(particle => {
        particle.y += particle.vy;
        particle.life--;
        particle.alpha = particle.life / 60;
        
        if (particle.life > 0) {
            ctx.save();
            ctx.globalAlpha = particle.alpha;
            ctx.fillStyle = particle.color;
            ctx.font = 'bold 16px Jua';
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

// 픽셀 스프라이트 그리기 함수 (characters.js가 없을 경우를 대비)
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
window.addEventListener('load', checkIOSFullscreen);

// 키보드 이벤트 처리
document.addEventListener('keydown', function(e) {
    if (!gameState.running) return;
    
    switch(e.code) {
        case 'Space':
            e.preventDefault();
            jump();
            break;
        case 'Escape':
            e.preventDefault();
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

// 터치 이벤트 처리 (모바일 지원)
let touchStartY = 0;
let touchStartTime = 0;

document.addEventListener('touchstart', function(e) {
    touchStartY = e.touches[0].clientY;
    touchStartTime = Date.now();
}, { passive: true });

document.addEventListener('touchend', function(e) {
    if (!gameState.running || gameState.questionActive) return;
    
    const touchEndY = e.changedTouches[0].clientY;
    const touchEndTime = Date.now();
    const deltaY = touchStartY - touchEndY;
    const deltaTime = touchEndTime - touchStartTime;
    
    // 위로 스와이프 또는 빠른 터치 감지
    if ((deltaY > 50 && deltaTime < 500) || (deltaTime < 200 && Math.abs(deltaY) < 30)) {
        e.preventDefault();
        jump();
    }
}, { passive: false });

// 게임 초기화 및 메뉴 표시
function initializeGame() {
    // 초기 상태 설정
    gameState.selectedCharacter = 'jiyul';
    gameState.selectedUnits = [];
    
    // 캔버스 초기화
    resizeCanvas();
    
    // 메뉴 표시
    showMenu();
    
    console.log('🌸 지율이의 픽셀 영어 게임이 초기화되었습니다! 🌸');
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
    if (gameState.selectedUnits.length === 0) {
        alert('Unit을 하나 이상 선택해주세요!');
        return;
    }
    
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
        recordText += `   캐릭터: ${record.character === 'jiyul' ? '지율이' : 
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
    message += `플레이 시간: ${Math.floor(record.playTime / 60)}분 ${record.playTime % 60}초\n\n`;
    message += `다시 도전해보세요! 💕`;
    
    gameState.running = false;
    alert(message);
    showMenu();
}

// 기존 gameOver 함수 교체
window.gameOver = gameOverWithRecord;

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

// 기존 showEnding 함수 교체
window.showEnding = showEndingWithRecord;

// 디버그 모드 (개발용)
let debugMode = false;

function toggleDebugMode() {
    debugMode = !debugMode;
    console.log(`디버그 모드: ${debugMode ? 'ON' : 'OFF'}`);
    
    if (debugMode) {
        // 디버그 정보 표시
        const debugInfo = document.createElement('div');
        debugInfo.id = 'debugInfo';
        debugInfo.style.cssText = `
            position: fixed;
            top: 100px;
            right: 10px;
            background: rgba(0,0,0,0.8);
            color: white;
            padding: 10px;
            font-size: 12px;
            font-family: monospace;
            z-index: 999;
            border-radius: 5px;
        `;
        document.body.appendChild(debugInfo);
        
        // 디버그 정보 업데이트
        setInterval(() => {
            if (debugMode && debugInfo) {
                debugInfo.innerHTML = `
                    FPS: ${Math.round(1000 / 16)}<br>
                    Player X: ${Math.round(player.worldX)}<br>
                    Camera X: ${Math.round(gameState.cameraX)}<br>
                    Enemies: ${enemies.length}<br>
                    Obstacles: ${obstacles.length}<br>
                    Speed: ${gameState.speed}<br>
                    Distance: ${Math.round(gameState.distance)}
                `;
            }
        }, 100);
    } else {
        const debugInfo = document.getElementById('debugInfo');
        if (debugInfo) {
            debugInfo.remove();
        }
    }
}

// 치트 코드 (개발용)
let cheatSequence = [];
const CHEAT_CODE = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight'];

document.addEventListener('keydown', function(e) {
    cheatSequence.push(e.code);
    if (cheatSequence.length > CHEAT_CODE.length) {
        cheatSequence.shift();
    }
    
    if (cheatSequence.join(',') === CHEAT_CODE.join(',')) {
        toggleDebugMode();
        cheatSequence = [];
    }
});

// 추가 도움말 함수
function showAdvancedHelp() {
    const helpText = `
🌸 지율이의 픽셀 영어 게임 - 상세 도움말 🌸

🎮 조작법:
• 스페이스바 또는 점프 버튼: 점프
• 위로 스와이프: 점프 (모바일)
• 1,2,3,4 키: 문제 선택지 선택
• ESC 키: 메뉴로 돌아가기
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

// 전역 함수로 등록하여 HTML에서 접근 가능하게 함
window.showAdvancedHelp = showAdvancedHelp;
window.showGameRecords = showGameRecords;
window.restartGame = restartGame;
window.selectCharacterByName = selectCharacterByName;

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
        if (debugMode) {
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
function enableAudio() {
    const audioContext = window.AudioContext || window.webkitAudioContext;
    if (audioContext) {
        const ctx = new audioContext();
        if (ctx.state === 'suspended') {
            ctx.resume();
        }
    }
}

// 첫 번째 사용자 상호작용에서 오디오 활성화
document.addEventListener('touchstart', enableAudio, { once: true });
document.addEventListener('click', enableAudio, { once: true });

console.log('✨ 지율이의 픽셀 영어 게임 준비 완료! ✨');
