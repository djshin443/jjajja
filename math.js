// 수학 연산 관련 함수들

// 이스터에그 관련 변수들
let gameStats = {
    startTime: null,
    correctAnswers: 0,
    totalQuestions: 0,
    requiredCorrectAnswers: 0
};

// 구구단 문제 생성
function generateQuestion() {
    if (gameState.selectedOps.length > 0) {
        // 연산 선택된 경우
        const op = gameState.selectedOps[Math.floor(Math.random() * gameState.selectedOps.length)];
        let num1, num2, questionText, answer;
        
        switch(op) {
            case 'add':
                num1 = Math.floor(Math.random() * 50) + 1;
                num2 = Math.floor(Math.random() * 50) + 1;
                questionText = `${num1} + ${num2}`;
                answer = num1 + num2;
                break;
            case 'sub':
                num1 = Math.floor(Math.random() * 50) + 20;
                num2 = Math.floor(Math.random() * num1) + 1;
                questionText = `${num1} - ${num2}`;
                answer = num1 - num2;
                break;
            case 'mul':
                if (gameState.selectedDans.length > 0) {
                    // 구구단도 선택된 경우
                    num1 = gameState.selectedDans[Math.floor(Math.random() * gameState.selectedDans.length)];
                    num2 = Math.floor(Math.random() * 9) + 1;
                } else {
                    num1 = Math.floor(Math.random() * 9) + 1;
                    num2 = Math.floor(Math.random() * 9) + 1;
                }
                questionText = `${num1} × ${num2}`;
                answer = num1 * num2;
                break;
            case 'div':
                num2 = Math.floor(Math.random() * 9) + 1;
                answer = Math.floor(Math.random() * 9) + 1;
                num1 = num2 * answer;
                questionText = `${num1} ÷ ${num2}`;
                break;
        }
        
        gameState.currentQuestion = questionText;
        gameState.correctAnswer = answer;
    } else {
        // 구구단만 선택된 경우
        const dan = gameState.selectedDans[Math.floor(Math.random() * gameState.selectedDans.length)];
        const num2 = Math.floor(Math.random() * 9) + 1;
        gameState.currentQuestion = `${dan} × ${num2}`;
        gameState.correctAnswer = dan * num2;
    }
}

// 답 제출 (개선된 버전)
function submitAnswer() {
    const answerInput = document.getElementById('answerInput');
    const userAnswer = parseInt(answerInput.value);
    
    if (isNaN(userAnswer)) {
        // 입력 오류시 힌트 표시
        answerInput.style.borderColor = '#FF0000';
        answerInput.placeholder = '숫자만 입력하세요!';
        setTimeout(() => {
            answerInput.style.borderColor = '#FF69B4';
            answerInput.placeholder = '답은?';
        }, 1000);
        return;
    }
    
    // 통계 업데이트
    gameStats.totalQuestions++;
    
    if (userAnswer === gameState.correctAnswer) {
        // 정답! 더 화려한 효과
        gameState.score += 20;
        answerInput.style.borderColor = '#00FF00';
        gameStats.correctAnswers++;
        
        // 이스터에그 체크
        checkEasterEgg();
        
        if (gameState.currentEnemy) {
            gameState.currentEnemy.hp -= 1;
            const enemyScreenX = gameState.currentEnemy.x - gameState.cameraX;
            createParticles(enemyScreenX, gameState.currentEnemy.y, 'hit');
            
            if (gameState.currentEnemy.hp <= 0) {
                gameState.currentEnemy.alive = false;
                gameState.score += gameState.currentEnemy.type === 'boss' ? 100 : 50;
                createParticles(enemyScreenX, gameState.currentEnemy.y, 'defeat');
                
                // 몬스터 처치 시 화면 이동 재개
                gameState.isMoving = true;
                
                // 전투 종료
                document.getElementById('questionPanel').style.display = 'none';
                gameState.questionActive = false;
                gameState.currentEnemy = null;
                
                // 성공 메시지
                showFloatingText(jiyul.x, jiyul.y - 50, '완료!', '#00FF00');
            } else {
                // 몬스터가 아직 살아있으면 다음 문제
                generateQuestion();
                updateQuestionPanel();
                showFloatingText(jiyul.x, jiyul.y - 30, '맞았어요!', '#FFD700');
            }
        }
    } else {
        // 오답 - 더 명확한 피드백
        answerInput.style.borderColor = '#FF0000';
        jiyul.hp -= 15;
        createParticles(jiyul.x, jiyul.y, 'hurt');
        showFloatingText(jiyul.x, jiyul.y - 30, `틀렸어요! 정답: ${gameState.correctAnswer}`, '#FF0000');
        
        if (jiyul.hp <= 0) {
            gameOver();
            return;
        }
        
        // 틀렸을 때 힌트 제공
        setTimeout(() => {
            answerInput.style.borderColor = '#FF69B4';
            generateQuestion(); // 새 문제 생성
            updateQuestionPanel();
        }, 1500);
    }
    
    answerInput.value = '';
    answerInput.focus();
    updateUI();
}

// 이스터에그 체크 함수
function checkEasterEgg() {
    // 2~9단이 모두 선택되었는지 확인
    const allDansSelected = [2, 3, 4, 5, 6, 7, 8, 9].every(dan => gameState.selectedDans.includes(dan));
    
    if (!allDansSelected) return;
    
    // 20분(1200초) 이내인지 확인
    const currentTime = Date.now();
    const elapsedTime = (currentTime - gameStats.startTime) / 1000;
    
    if (elapsedTime > 1200) return; // 20분 초과
    
    // 100% 정답률인지 확인 (최소 50문제 이상)
    if (gameStats.totalQuestions >= 50 && gameStats.correctAnswers === gameStats.totalQuestions) {
        showEasterEggMessage();
    }
}

// 이스터에그 메시지 표시
function showEasterEggMessage() {
    // 게임 일시정지
    gameState.running = false;
    gameState.isMoving = false;
    
    // 축하 카드 생성
    const easterEggCard = document.createElement('div');
    easterEggCard.id = 'easterEggCard';
    easterEggCard.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: linear-gradient(135deg, #FFD700, #FFA500, #FF69B4);
        z-index: 9999;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        font-family: 'Jua', sans-serif;
        text-align: center;
        padding: 20px;
        animation: sparkle 2s infinite;
    `;
    
    easterEggCard.innerHTML = `
        <div style="background: rgba(255,255,255,0.95); padding: 40px; border-radius: 30px; border: 5px solid #FF1493; box-shadow: 0 0 50px rgba(255,215,0,0.8); max-width: 90vw; max-height: 90vh; overflow-y: auto;">
            <h1 style="font-size: min(8vw, 48px); color: #FF1493; margin-bottom: 30px; text-shadow: 3px 3px 0 #FFD700;">🎉 축하해요! 🎉</h1>
            <h2 style="font-size: min(6vw, 32px); color: #8B008B; margin-bottom: 30px;">미션을 통과했어요!</h2>
            <div style="font-size: min(4vw, 24px); color: #FF69B4; margin-bottom: 30px; line-height: 1.5;">
                🌟 2~9단 모든 문제를 20분 안에 100% 정답! 🌟<br>
                정말 대단해요! 💕
            </div>
            <div style="background: linear-gradient(135deg, #E6E6FA, #FFE4E1); padding: 30px; border-radius: 20px; margin: 20px 0; border: 3px solid #FF69B4;">
                <div style="font-size: min(4vw, 20px); color: #4B0082; font-weight: bold; margin-bottom: 15px;">💌 특별한 메시지 💌</div>
                <div style="font-size: min(3.5vw, 18px); color: #8B008B; line-height: 1.6;">
                    "July 18th, 2017 was the most blessed day<br>
                    from Mom and Dad for you!" ✨<br><br>
                    <span style="color: #FF1493;">2017년 07월 18일은 엄마와 아빠한테<br>
                    가장 축복받은 날이야! 💖</span>
                </div>
            </div>
            <button onclick="closeEasterEgg()" style="
                background: linear-gradient(135deg, #32CD32, #90EE90);
                border: 3px solid #FFF;
                color: white;
                padding: 15px 30px;
                font-size: min(4vw, 20px);
                font-weight: bold;
                cursor: pointer;
                font-family: 'Jua', sans-serif;
                border-radius: 25px;
                box-shadow: 0 5px 15px rgba(0,0,0,0.3);
                margin-top: 20px;
            ">🎮 게임 계속하기</button>
        </div>
    `;
    
    // CSS 애니메이션 추가
    const style = document.createElement('style');
    style.textContent = `
        @keyframes sparkle {
            0%, 100% { filter: brightness(1) saturate(1); }
            50% { filter: brightness(1.2) saturate(1.3); }
        }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(easterEggCard);
    
    // 축하 파티클 효과
    createCelebrationParticles();
}

// 이스터에그 닫기
function closeEasterEgg() {
    const easterEggCard = document.getElementById('easterEggCard');
    if (easterEggCard) {
        easterEggCard.remove();
    }
    
    // 게임 재개
    gameState.running = true;
    gameState.isMoving = true;
    gameLoop();
}

// 축하 파티클 효과
function createCelebrationParticles() {
    for (let i = 0; i < 100; i++) {
        setTimeout(() => {
            const colors = ['#FFD700', '#FF69B4', '#00FF00', '#FF6347', '#9370DB', '#FF1493'];
            const x = Math.random() * window.innerWidth;
            const y = Math.random() * window.innerHeight;
            
            const particle = document.createElement('div');
            particle.style.cssText = `
                position: fixed;
                left: ${x}px;
                top: ${y}px;
                width: 10px;
                height: 10px;
                background: ${colors[Math.floor(Math.random() * colors.length)]};
                border-radius: 50%;
                pointer-events: none;
                z-index: 10000;
                animation: celebrate 3s ease-out forwards;
            `;
            
            document.body.appendChild(particle);
            
            setTimeout(() => {
                if (particle.parentNode) {
                    particle.parentNode.removeChild(particle);
                }
            }, 3000);
        }, i * 50);
    }
    
    // 축하 애니메이션 CSS
    const celebrateStyle = document.createElement('style');
    celebrateStyle.textContent = `
        @keyframes celebrate {
            0% {
                transform: scale(0) translateY(0);
                opacity: 1;
            }
            50% {
                transform: scale(1) translateY(-100px);
                opacity: 1;
            }
            100% {
                transform: scale(0) translateY(-200px);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(celebrateStyle);
}

// 떠다니는 텍스트 효과 (새 기능)
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
    
    // 텍스트 파티클을 별도로 관리
    if (!window.textParticles) {
        window.textParticles = [];
    }
    window.textParticles.push(textParticle);
}

// 텍스트 파티클 업데이트 (render 함수에서 호출해야 함)
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


function updateQuestionPanel() {
    document.getElementById('questionText').textContent = `✨ ${gameState.currentQuestion} = ?`;
    if (gameState.currentEnemy) {
        const enemyName = gameState.currentEnemy.type === 'boss' ? '👑 보스' : 
                         gameState.currentEnemy.type === 'slime' ? '💧 슬라임' : '👹 고블린';
        document.getElementById('enemyInfo').textContent = 
            `${enemyName} 체력: ${gameState.currentEnemy.hp}/${gameState.currentEnemy.maxHp}`;
    }
    
    // 입력창 스타일 초기화
    const answerInput = document.getElementById('answerInput');
    answerInput.style.borderColor = '#FF69B4';
    answerInput.placeholder = '답은?';
    answerInput.value = '';
    
    // 모바일 키보드 방지
    answerInput.setAttribute('readonly', 'readonly');
    answerInput.addEventListener('click', function(e) {
        e.preventDefault();
        this.blur();
    });
    answerInput.addEventListener('focus', function(e) {
        e.preventDefault();
        this.blur();
    });
}

// 연산 선택 함수
function toggleOperator(op) {
    console.log('toggleOperator 호출됨, op:', op);
    
    const index = gameState.selectedOps.indexOf(op);
    const button = document.querySelector(`[data-op="${op}"]`);
    
    if (!button) {
        console.error('버튼을 찾을 수 없음, op:', op);
        return;
    }
    
    if (index === -1) {
        gameState.selectedOps.push(op);
        button.classList.add('selected');
        console.log('연산 추가됨:', op);
    } else {
        gameState.selectedOps.splice(index, 1);
        button.classList.remove('selected');
        console.log('연산 제거됨:', op);
    }
    
    console.log('현재 선택된 연산:', gameState.selectedOps);
    updateSelectedDisplay();
}

// 선택한 내용 표시 업데이트
function updateSelectedDisplay() {
    const selectedDansElement = document.getElementById('selectedDans');
    const selectedOpsElement = document.getElementById('selectedOps');
    const startButton = document.getElementById('startGameBtn');
    
    // 구구단 표시
    if (gameState.selectedDans.length > 0) {
        const sortedDans = gameState.selectedDans.sort((a, b) => a - b);
        selectedDansElement.textContent = `선택한 구구단: ${sortedDans.join(', ')}단`;
    } else {
        selectedDansElement.textContent = '선택한 구구단: 없음';
    }
    
    // 연산 표시
    if (gameState.selectedOps.length > 0) {
        const opNames = {
            'add': '더하기',
            'sub': '빼기',
            'mul': '곱하기',
            'div': '나누기'
        };
        const selectedOpNames = gameState.selectedOps.map(op => opNames[op]);
        selectedOpsElement.textContent = `선택한 연산: ${selectedOpNames.join(', ')}`;
    } else {
        selectedOpsElement.textContent = '선택한 연산: 없음';
    }
    
    // 시작 버튼 활성화 조건
    startButton.disabled = gameState.selectedDans.length === 0 && gameState.selectedOps.length === 0;
    
    console.log('선택 표시 업데이트 완료');
    console.log('구구단:', gameState.selectedDans);
    console.log('연산:', gameState.selectedOps);
    console.log('시작 버튼 비활성화:', startButton.disabled);
}

// 게임 시작
function startSelectedGame() {
    if (gameState.selectedDans.length === 0 && gameState.selectedOps.length === 0) {
        alert('구구단이나 연산을 하나 이상 선택해주세요!');
        return;
    }
    
    // 게임 통계 초기화
    gameStats.startTime = Date.now();
    gameStats.correctAnswers = 0;
    gameStats.totalQuestions = 0;
    
    document.getElementById('selectMenu').style.display = 'none';
    document.getElementById('ui').style.display = 'block';
    
    // UI 텍스트 업데이트
    let displayText = '';
    if (gameState.selectedDans.length > 0) {
        const sortedDans = gameState.selectedDans.sort((a, b) => a - b);
        displayText = sortedDans.join(',') + '단';
    }
    if (gameState.selectedOps.length > 0) {
        const opSymbols = {
            'add': '+',
            'sub': '-',
            'mul': '×',
            'div': '÷'
        };
        const symbols = gameState.selectedOps.map(op => opSymbols[op]).join(',');
        displayText += (displayText ? ' ' : '') + symbols;
    }
    document.getElementById('danText').textContent = displayText;
    
    initGame();
}
