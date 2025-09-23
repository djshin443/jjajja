// 개선된 엔딩 시스템 - 자동 스크롤과 사용자 친화적 버튼 시스템
// 좌우 분할 레이아웃과 토글 가능한 버튼이 포함된 엔딩

// characters.js에서 픽셀 데이터 가져오기
function getCharacterPixelData(characterName) {
    if (typeof pixelData !== 'undefined' && pixelData[characterName]) {
        return pixelData[characterName];
    }
    return null;
}

// 픽셀 스프라이트 그리기 함수 (엔딩에서 사용)
function drawEndingPixelSprite(ctx, sprite, colorMap, x, y, scale = 4) {
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    
    for (let row = 0; row < sprite.length; row++) {
        for (let col = 0; col < sprite[row].length; col++) {
            const pixel = sprite[row][col];
            if (pixel !== 0 && colorMap[pixel]) {
                ctx.fillStyle = colorMap[pixel];
                ctx.fillRect(x + col * scale, y + row * scale, scale, scale);
            }
        }
    }
    ctx.restore();
}

// 고급 파티클 시스템 클래스 (엔딩 전용)
class EndingParticleSystem {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.particles = [];
        this.magicEffects = [];
    }
    
    create(x, y, type = 'star', count = 1) {
        for (let i = 0; i < count; i++) {
            const configs = {
                star: {
                    size: Math.random() * 8 + 4,
                    color: `hsl(${Math.random() * 60 + 30}, 100%, ${70 + Math.random() * 30}%)`,
                    velocity: { x: (Math.random() - 0.5) * 6, y: Math.random() * -8 - 2 },
                    lifetime: 200,
                    rotation: Math.random() * Math.PI * 2,
                    rotationSpeed: (Math.random() - 0.5) * 0.15
                },
                confetti: {
                    size: Math.random() * 15 + 8,
                    color: ['#FF6B9D', '#FFD700', '#00D9FF', '#7FFF00', '#FF1493', '#9370DB'][Math.floor(Math.random() * 6)],
                    velocity: { x: (Math.random() - 0.5) * 12, y: Math.random() * -15 - 4 },
                    lifetime: 250,
                    rotation: Math.random() * Math.PI * 2,
                    rotationSpeed: (Math.random() - 0.5) * 0.4
                },
                sparkle: {
                    size: Math.random() * 10 + 6,
                    color: '#FFFFFF',
                    velocity: { x: (Math.random() - 0.5) * 8, y: (Math.random() - 0.5) * 8 },
                    lifetime: 120,
                    rotation: 0,
                    rotationSpeed: 0.25
                },
                magic: {
                    size: Math.random() * 12 + 8,
                    color: `hsl(${270 + Math.random() * 60}, 80%, 70%)`,
                    velocity: { x: (Math.random() - 0.5) * 4, y: Math.random() * -6 - 1 },
                    lifetime: 180,
                    rotation: Math.random() * Math.PI * 2,
                    rotationSpeed: (Math.random() - 0.5) * 0.2
                }
            };
            
            const config = configs[type] || configs.star;
            this.particles.push({
                x: x + (Math.random() - 0.5) * 30,
                y: y + (Math.random() - 0.5) * 30,
                type,
                ...config,
                age: 0,
                opacity: 1,
                scale: 1,
                bounceCount: 0
            });
        }
    }
    
    createMagicTrail(x, y, targetX, targetY) {
        this.magicEffects.push({
            x, y, targetX, targetY,
            progress: 0,
            color: `hsl(${Math.random() * 360}, 80%, 60%)`,
            width: Math.random() * 4 + 2,
            lifetime: 60
        });
    }
    
    update() {
        // 파티클 업데이트
        this.particles = this.particles.filter(p => {
            p.age++;
            p.x += p.velocity.x;
            p.y += p.velocity.y;
            
            // 중력 효과
            if (p.type !== 'sparkle') {
                p.velocity.y += 0.15;
            }
            
            // 공기 저항
            p.velocity.x *= 0.995;
            p.rotation += p.rotationSpeed;
            
            // 바닥에서 튕기기 (일부 파티클만)
            if (p.y > this.canvas.height - 20 && p.velocity.y > 0 && p.bounceCount < 2) {
                p.velocity.y *= -0.6;
                p.velocity.x *= 0.8;
                p.bounceCount++;
            }
            
            // 페이드 아웃
            if (p.age > p.lifetime * 0.7) {
                p.opacity = Math.max(0, 1 - (p.age - p.lifetime * 0.7) / (p.lifetime * 0.3));
            }
            
            return p.age < p.lifetime && p.opacity > 0 && p.y < this.canvas.height + 50;
        });
        
        // 마법 효과 업데이트
        this.magicEffects = this.magicEffects.filter(effect => {
            effect.progress += 0.05;
            effect.lifetime--;
            return effect.lifetime > 0;
        });
    }
    
    render() {
        // 마법 효과 렌더링
        this.magicEffects.forEach(effect => {
            const currentX = effect.x + (effect.targetX - effect.x) * effect.progress;
            const currentY = effect.y + (effect.targetY - effect.y) * effect.progress;
            
            this.ctx.save();
            this.ctx.globalAlpha = 1 - effect.progress;
            this.ctx.strokeStyle = effect.color;
            this.ctx.lineWidth = effect.width;
            this.ctx.shadowColor = effect.color;
            this.ctx.shadowBlur = 10;
            
            this.ctx.beginPath();
            this.ctx.moveTo(effect.x, effect.y);
            this.ctx.lineTo(currentX, currentY);
            this.ctx.stroke();
            this.ctx.restore();
        });
        
        // 파티클 렌더링
        this.particles.forEach(p => {
            this.ctx.save();
            this.ctx.globalAlpha = p.opacity;
            this.ctx.translate(p.x, p.y);
            this.ctx.rotate(p.rotation);
            
            if (p.type === 'star') {
                this.ctx.shadowColor = p.color;
                this.ctx.shadowBlur = p.size * 3;
                this.ctx.fillStyle = p.color;
                this.ctx.beginPath();
                for (let i = 0; i < 5; i++) {
                    const angle = (Math.PI * 2 / 5) * i - Math.PI / 2;
                    const innerAngle = angle + Math.PI / 5;
                    const outerX = Math.cos(angle) * p.size;
                    const outerY = Math.sin(angle) * p.size;
                    const innerX = Math.cos(innerAngle) * p.size * 0.5;
                    const innerY = Math.sin(innerAngle) * p.size * 0.5;
                    
                    if (i === 0) this.ctx.moveTo(outerX, outerY);
                    else this.ctx.lineTo(outerX, outerY);
                    this.ctx.lineTo(innerX, innerY);
                }
                this.ctx.closePath();
                this.ctx.fill();
                this.ctx.shadowBlur = 0;
            } else if (p.type === 'confetti') {
                const scaleX = Math.cos(p.age * 0.1);
                this.ctx.scale(scaleX, 1);
                this.ctx.fillStyle = p.color;
                this.ctx.fillRect(-p.size/2, -p.size/3, p.size, p.size * 0.6);
            } else if (p.type === 'magic') {
                this.ctx.shadowColor = p.color;
                this.ctx.shadowBlur = 15;
                this.ctx.fillStyle = p.color;
                this.ctx.beginPath();
                this.ctx.arc(0, 0, p.size/2, 0, Math.PI * 2);
                this.ctx.fill();
                
                // 마법 원 그리기
                this.ctx.strokeStyle = p.color;
                this.ctx.lineWidth = 2;
                this.ctx.beginPath();
                this.ctx.arc(0, 0, p.size, 0, Math.PI * 2);
                this.ctx.stroke();
                this.ctx.shadowBlur = 0;
            }
            
            this.ctx.restore();
        });
    }
}

// 전역 파티클 시스템 변수
let endingParticleSystem = null;

// 새로운 엔딩 표시 함수 (개선된 스크롤 + 사용자 친화적 버튼)
function showEnding() {
    // 게임 상태 정리
    if (typeof gameState !== 'undefined') {
        gameState.running = false;
        gameState.isMoving = false;
    }
    
    // 엔딩 화면 메인 컨테이너
    const endingDiv = document.createElement('div');
    endingDiv.id = 'endingScreen';
    endingDiv.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: linear-gradient(45deg, #1a1a2e, #16213e, #0f3460, #533483, #e94560);
        z-index: 10000;
        display: flex;
        font-family: 'Jua', sans-serif;
        overflow: hidden;
        animation: endingFadeIn 2s ease-in;
    `;
    
    // 왼쪽 그림 영역 (50%)
    const canvasContainer = document.createElement('div');
    canvasContainer.style.cssText = `
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
        background: rgba(0, 0, 0, 0.2);
        border-right: 3px solid rgba(255, 255, 255, 0.3);
    `;
    
    const endingCanvas = document.createElement('canvas');
    const canvasSize = Math.min(window.innerWidth * 0.45, window.innerHeight * 0.8);
    endingCanvas.width = canvasSize;
    endingCanvas.height = canvasSize;
    endingCanvas.style.cssText = `
        width: 90%;
        height: 90%;
        border-radius: 20px;
        background: linear-gradient(135deg, rgba(30, 30, 60, 0.8), rgba(90, 30, 120, 0.8));
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
        border: 3px solid rgba(255, 255, 255, 0.3);
    `;
    
    // 오른쪽 스토리 영역 (50%)
    const storyContainer = document.createElement('div');
    storyContainer.style.cssText = `
        flex: 1;
        position: relative;
        background: linear-gradient(135deg, rgba(0, 0, 0, 0.8), rgba(30, 30, 60, 0.9));
    `;
    
    // 스토리 텍스트 영역 (스크롤 컨테이너)
    const scrollContainer = document.createElement('div');
    scrollContainer.style.cssText = `
        height: 100%;
        overflow: hidden;
        position: relative;
    `;
    
    const storyContent = document.createElement('div');
    storyContent.id = 'storyScrollContent';
    storyContent.style.cssText = `
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        padding: 40px;
        color: white;
        font-size: 20px;
        line-height: 2.5;
        animation: slowScrollUp 80s linear forwards;
    `;
    
    // 버튼 토글러 (작은 원형 버튼)
    const buttonToggler = document.createElement('div');
    buttonToggler.id = 'buttonToggler';
    buttonToggler.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 60px;
        height: 60px;
        background: linear-gradient(135deg, #FF69B4, #FF1493);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        z-index: 10003;
        box-shadow: 0 8px 25px rgba(255, 105, 180, 0.5);
        font-size: 24px;
        color: white;
        font-weight: bold;
        transition: all 0.3s ease;
        animation: gentlePulse 4s ease-in-out infinite;
        font-family: 'Jua', sans-serif;
        user-select: none;
    `;
    buttonToggler.innerHTML = '🎮';
    buttonToggler.title = '게임 옵션 열기';
    
    // 숨김/표시 가능한 버튼 영역 (처음엔 숨김)
    const fixedButtonContainer = document.createElement('div');
    fixedButtonContainer.id = 'endingButtonContainer';
    fixedButtonContainer.style.cssText = `
        position: fixed;
        bottom: 90px;
        right: 20px;
        display: none;
        flex-direction: column;
        gap: 15px;
        z-index: 10002;
        opacity: 0;
        transform: translateY(20px);
        transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    `;
    
    // 엔딩 CSS 애니메이션 추가
    const endingStyle = document.createElement('style');
    endingStyle.textContent = `
        @keyframes endingFadeIn {
            0% { opacity: 0; transform: scale(0.9); }
            100% { opacity: 1; transform: scale(1); }
        }
        @keyframes slowScrollUp {
            0% {
                transform: translateY(100%);
            }
            75% {
                transform: translateY(-60%);
            }
            100% {
                transform: translateY(-60%);
            }
        }
        @keyframes gentlePulse {
            0%, 100% { 
                transform: scale(1);
                box-shadow: 0 8px 25px rgba(255, 105, 180, 0.5);
            }
            50% { 
                transform: scale(1.05);
                box-shadow: 0 12px 35px rgba(255, 105, 180, 0.7);
            }
        }
        @keyframes glowText {
            0%, 100% { 
                text-shadow: 0 0 15px #FFD700, 0 0 25px #FFD700, 0 0 35px #FFD700; 
            }
            50% { 
                text-shadow: 0 0 25px #FFD700, 0 0 35px #FFD700, 0 0 45px #FF69B4, 0 0 55px #FF69B4; 
            }
        }
        @keyframes fadeInScore {
            0% { 
                opacity: 0; 
                transform: scale(0.3) rotate(-10deg);
            }
            50% {
                transform: scale(1.1) rotate(5deg);
            }
            100% { 
                opacity: 1; 
                transform: scale(1) rotate(0deg);
            }
        }
        @keyframes bounce {
            0%, 100% { transform: translateY(0) rotate(0deg); }
            25% { transform: translateY(-15px) rotate(-5deg); }
            50% { transform: translateY(-25px) rotate(0deg); }
            75% { transform: translateY(-10px) rotate(5deg); }
        }
        @keyframes wiggle {
            0%, 100% { transform: rotate(0deg) scale(1); }
            25% { transform: rotate(-10deg) scale(1.1); }
            50% { transform: rotate(10deg) scale(1.2); }
            75% { transform: rotate(-5deg) scale(1.1); }
        }
        .ending-emoji {
            font-size: 2em;
            display: inline-block;
            animation: bounce 2s infinite;
            margin: 0 10px;
        }
        .wiggle-emoji {
            font-size: 1.8em;
            display: inline-block;
            animation: wiggle 3s infinite;
            margin: 0 8px;
        }
        .story-scene {
            margin: 80px 0;
            padding: 40px;
            background: linear-gradient(135deg, rgba(255, 255, 255, 0.15), rgba(147, 112, 219, 0.1));
            border-radius: 25px;
            border-left: 8px solid #FF69B4;
            backdrop-filter: blur(15px);
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
            animation: fadeInScore 2s ease-out;
        }
        .scene-emoji {
            font-size: 48px;
            text-align: center;
            margin-bottom: 25px;
            animation: bounce 2.5s infinite;
        }
        .scene-text {
            font-size: 24px;
            text-align: center;
            color: #FFFFFF;
            text-shadow: 3px 3px 6px rgba(0,0,0,0.7);
            line-height: 2.2;
            word-spacing: 3px;
        }
        .score-section {
            margin: 120px 0;
            padding: 50px;
            background: linear-gradient(135deg, rgba(255, 215, 0, 0.25), rgba(138, 43, 226, 0.35));
            border-radius: 30px;
            border: 4px solid #FFD700;
            text-align: center;
            animation: fadeInScore 3s ease-out;
            box-shadow: 0 0 40px rgba(255, 215, 0, 0.6);
        }
        .score-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 25px;
            margin: 40px 0;
        }
        .score-item {
            padding: 25px;
            background: rgba(255, 255, 255, 0.15);
            border-radius: 20px;
            backdrop-filter: blur(10px);
            animation: fadeInScore 2.5s ease-out;
        }
        .score-label {
            font-size: 18px;
            color: #E0E0E0;
            margin-bottom: 12px;
        }
        .score-value {
            font-size: 28px;
            font-weight: bold;
            text-shadow: 0 0 15px currentColor;
        }
        .ending-button {
            background: linear-gradient(135deg, #F093FB, #F5576C);
            border: none;
            color: white;
            padding: 15px 30px;
            font-size: 18px;
            font-weight: bold;
            cursor: pointer;
            font-family: 'Jua', sans-serif;
            border-radius: 25px;
            box-shadow: 0 8px 20px rgba(245, 87, 108, 0.4);
            transition: all 0.3s ease;
            min-width: 150px;
            position: relative;
            overflow: hidden;
        }
        .ending-button::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
            transition: left 0.5s;
        }
        .ending-button:hover {
            transform: translateY(-3px) scale(1.05);
            box-shadow: 0 12px 30px rgba(245, 87, 108, 0.6);
        }
        .ending-button:hover::before {
            left: 100%;
        }
        .ending-button:active {
            transform: translateY(-1px) scale(1.02);
        }
        .ending-button.main {
            background: linear-gradient(135deg, #667EEA, #764BA2);
            box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
        }
        .ending-button.main:hover {
            box-shadow: 0 12px 30px rgba(102, 126, 234, 0.6);
        }
        .button-show {
            display: flex !important;
            opacity: 1 !important;
            transform: translateY(0) !important;
        }
    `;
    document.head.appendChild(endingStyle);
    
    // 캐릭터별 더 코믹하고 재미있는 엔딩 스토리
    const selectedCharacter = (typeof gameState !== 'undefined' && gameState.selectedCharacter) ? 
                              gameState.selectedCharacter : 'jiyul';
    
    const comicEndingStories = {
        jiyul: {
            title: "지율이의 신나는 글로벌 영어 대모험! 🌟",
            scenes: [
                {
                    text: "지율이: '와하하! 모든 몬스터를 이겼다!' <span class='wiggle-emoji'>🎉</span>",
                    emoji: "🌈"
                },
                {
                    text: "갑자기 하늘에서 무지개가 내려와서... <span class='ending-emoji'>🌈</span>",
                    emoji: "☁️"
                },
                {
                    text: "미국 대통령: 'Hello! 지율아! 우리나라로 와줘!' <span class='wiggle-emoji'>🇺🇸</span>",
                    emoji: "🏛️"
                },
                {
                    text: "영국 여왕: '브라보! 런던에서 차 한 잔 할까?' <span class='ending-emoji'>🫖</span>",
                    emoji: "👑"
                },
                {
                    text: "프랑스 대통령: '마니피크! 파리에서 크루아상 먹자!' <span class='wiggle-emoji'>🥐</span>",
                    emoji: "🗼"
                },
                {
                    text: "지율이: '어어? 다 알아들어! 나 천재인가?' <span class='ending-emoji'>🤯</span>",
                    emoji: "🧠"
                },
                {
                    text: "그래서 지율이는 제주도에 '영어 마법 카페'를 열었어요! <span class='wiggle-emoji'>✨</span>",
                    emoji: "☕"
                },
                {
                    text: "매일 외국인들이 줄을 서서 영어 마법을 배우러 와요! <span class='ending-emoji'>🏃‍♂️</span><span class='ending-emoji'>🏃‍♀️</span>",
                    emoji: "🗿"
                },
                {
                    text: "지율이: '영어로 제주도 구경 시켜드릴게요~!' <span class='wiggle-emoji'>🌊</span>",
                    emoji: "🖏"
                },
                {
                    text: "그리고 지율이는 영어 마법사가 되어 행복하게 살았답니다! <span class='ending-emoji'>🎊</span>",
                    emoji: "🧙‍♀️"
                }
            ]
        },
        kiwi: {
            title: "키위의 우주 대모험 시간여행! 🚀",
            scenes: [
                {
                    text: "키위: '라룹라룹!' (와! 내가 해냈어!) <span class='wiggle-emoji'>🦎</span>",
                    emoji: "🎉"
                },
                {
                    text: "그때 갑자기, 번쩍번쩍 UFO가 내려와요! <span class='ending-emoji'>🛸</span>",
                    emoji: "✨"
                },
                {
                    text: "외계인: '우와! 키위! 너는 전설의 영어 도마뱀이구나!' <span class='wiggle-emoji'>👽</span>",
                    emoji: "🌌"
                },
                {
                    text: "키위: '라룹?' (엥? 외계인도 있었어?) <span class='ending-emoji'>❓</span>",
                    emoji: "🤔"
                },
                {
                    text: "외계인: '우리 은하수 영어 학교 선생님이 되어줘!' <span class='wiggle-emoji'>🌟</span>",
                    emoji: "📚"
                },
                {
                    text: "키위: '라룹라룹!' (오오! 재밌겠네!) <span class='ending-emoji'>😄</span>",
                    emoji: "💫"
                },
                {
                    text: "이제 키위는 우주 최고 영어 선생님이 되어서... <span class='wiggle-emoji'>👨‍🏫</span>",
                    emoji: "🚀"
                },
                {
                    text: "외계 각 행성 친구들에게 영어를 가르치고 있어요! <span class='ending-emoji'>👾</span><span class='ending-emoji'>🛸</span>",
                    emoji: "🪐"
                },
                {
                    text: "키위: 'Laloop means Hello in Earth language!' <span class='wiggle-emoji'>🌍</span>",
                    emoji: "🗣️"
                },
                {
                    text: "우주에서 가장 유명한 영어 도마뱀이 되었답니다! <span class='ending-emoji'>⭐</span>",
                    emoji: "🏆"
                }
            ]
        },
        whitehouse: {
            title: "화이트하우스의 마법 왕국 건설기! 🏰",
            scenes: [
                {
                    text: "화이트하우스: '드디어! 모든 정보를 학습했다!' <span class='wiggle-emoji'>🤖</span>",
                    emoji: "💡"
                },
                {
                    text: "갑자기 텐트가 반짝반짝 거대한 성으로 변해요! <span class='ending-emoji'>✨</span>",
                    emoji: "🏰"
                },
                {
                    text: "영어 단어들이 살아나서 춤을 춰요! <span class='wiggle-emoji'>💃</span><span class='wiggle-emoji'>🕺</span>",
                    emoji: "🎭"
                },
                {
                    text: "Hello: '새로운 왕님! 여기 앉으세요!' <span class='ending-emoji'>👋</span>",
                    emoji: "👑"
                },
                {
                    text: "Wonderful: '오늘은 정말 멋진 날이네요!' <span class='wiggle-emoji'>☀️</span>",
                    emoji: "🌞"
                },
                {
                    text: "Amazing: '이 왕국이 정말 놀라워요!' <span class='ending-emoji'>😍</span>",
                    emoji: "🏰"
                },
                {
                    text: "화이트하우스: '오호! 이것이 진짜 영어 마법 왕국이구나!' <span class='wiggle-emoji'>🎩</span>",
                    emoji: "👑"
                },
                {
                    text: "매일 새로운 영어 단어 친구들이 이사를 와요! <span class='ending-emoji'>📦</span><span class='ending-emoji'>🚚</span>",
                    emoji: "🏡"
                },
                {
                    text: "'사전 성(Dictionary Castle)'이라고 불리는 이곳은... <span class='wiggle-emoji'>📖</span>",
                    emoji: "🏛️"
                },
                {
                    text: "온 세상에서 가장 재밌고 신나는 영어 왕국이 되었답니다! <span class='ending-emoji'>🎪</span>",
                    emoji: "🎯"
                }
            ]
        }
    };
    
    const story = comicEndingStories[selectedCharacter] || comicEndingStories.jiyul;
    
    // 스토리 내용 생성
    let storyHTML = `
        <div style="text-align: center; margin-bottom: 80px;">
            <h1 style="
                font-size: 42px; 
                color: #FFD700; 
                text-shadow: 0 0 25px #FFD700, 0 0 35px #FFD700;
                animation: glowText 3s ease-in-out infinite;
                margin-bottom: 40px;
                letter-spacing: 2px;
            ">${story.title}</h1>
            <div style="font-size: 28px; color: #FF69B4;">
                <span class="ending-emoji">🎭</span> 재미있는 이야기가 시작돼요! <span class="ending-emoji">🎭</span>
            </div>
        </div>
    `;
    
    // 각 씬 추가
    story.scenes.forEach((scene, index) => {
        storyHTML += `
            <div class="story-scene">
                <div class="scene-emoji">${scene.emoji}</div>
                <p class="scene-text">${scene.text}</p>
            </div>
        `;
    });
    
    // 점수 표시 부분 추가
    const accuracy = (typeof gameStats !== 'undefined' && gameStats.totalQuestions > 0) ? 
        Math.round((gameStats.correctAnswers / gameStats.totalQuestions) * 100) : 100;
    const playTime = (typeof gameStats !== 'undefined' && gameStats.startTime) ?
        Math.round((Date.now() - gameStats.startTime) / 1000) : 180;
    const finalScore = (typeof gameState !== 'undefined' && gameState.score) ? gameState.score : 1000;
    
    // 등급 계산
    let grade, gradeEmoji, gradeColor;
    if (accuracy >= 95) {
        grade = "슈퍼 천재";
        gradeEmoji = "👑";
        gradeColor = "#FFD700";
    } else if (accuracy >= 85) {
        grade = "영어 마법사";
        gradeEmoji = "🧙‍♂️";
        gradeColor = "#FF69B4";
    } else if (accuracy >= 70) {
        grade = "영어 용사";
        gradeEmoji = "⚔️";
        gradeColor = "#00D9FF";
    } else {
        grade = "영어 새싹";
        gradeEmoji = "🌱";
        gradeColor = "#7FFF00";
    }
    
    storyHTML += `
        <div class="score-section">
            <h2 style="
                font-size: 36px; 
                color: #FFD700; 
                margin-bottom: 40px;
                text-shadow: 0 0 20px #FFD700;
                animation: glowText 2s ease-in-out infinite;
            "><span class="ending-emoji">🏆</span> 최종 성적표 <span class="ending-emoji">🏆</span></h2>
            
            <div class="score-grid">
                <div class="score-item">
                    <div class="score-label">최종 점수 <span class="wiggle-emoji">💎</span></div>
                    <div class="score-value" style="color: #FFD700;">
                        ${finalScore.toLocaleString()}점
                    </div>
                </div>
                
                <div class="score-item">
                    <div class="score-label">정답률 <span class="wiggle-emoji">🎯</span></div>
                    <div class="score-value" style="color: #FF69B4;">
                        ${accuracy}%
                    </div>
                </div>
                
                <div class="score-item">
                    <div class="score-label">플레이 시간 <span class="wiggle-emoji">⏰</span></div>
                    <div class="score-value" style="color: #00D9FF;">
                        ${Math.floor(playTime / 60)}분 ${playTime % 60}초
                    </div>
                </div>
                
                <div class="score-item" style="
                    background: linear-gradient(135deg, ${gradeColor}40, ${gradeColor}20);
                    border: 3px solid ${gradeColor};
                ">
                    <div class="score-label">등급 <span class="wiggle-emoji">⭐</span></div>
                    <div class="score-value" style="color: ${gradeColor};">
                        ${gradeEmoji} ${grade}
                    </div>
                </div>
            </div>
            
            <div style="
                margin-top: 50px;
                font-size: 26px;
                color: #FFFFFF;
                text-shadow: 3px 3px 6px rgba(0,0,0,0.7);
            ">
                <span class="ending-emoji">🎉</span> 와! 정말 대단해요! 모든 스테이지를 클리어했어요! <span class="ending-emoji">🎉</span>
            </div>
            
            <div style="
                margin-top: 30px;
                font-size: 18px;
                color: #E0E0E0;
                text-align: center;
            ">
                우하단 🎮 버튼을 눌러서 게임 옵션을 확인하세요!
            </div>
        </div>
    `;
    
    // 여백 추가
    storyHTML += `<div style="height: 300px;"></div>`;
    
    storyContent.innerHTML = storyHTML;
    
    // 버튼들 생성
    const retryButton = document.createElement('button');
    retryButton.className = 'ending-button';
    retryButton.innerHTML = '🔄 다시하기';
    retryButton.onclick = () => {
        hideEndingButtons();
        setTimeout(() => {
            document.body.removeChild(endingDiv);
            if (typeof restartGame === 'function') {
                restartGame();
            }
        }, 300);
    };
    
    const menuButton = document.createElement('button');
    menuButton.className = 'ending-button main';
    menuButton.innerHTML = '🏠 메인으로';
    menuButton.onclick = () => {
        hideEndingButtons();
        setTimeout(() => {
            document.body.removeChild(endingDiv);
            if (typeof saveGameRecord === 'function') {
                saveGameRecord();
            }
            if (typeof showMenu === 'function') {
                showMenu();
            }
        }, 300);
    };
    
    fixedButtonContainer.appendChild(retryButton);
    fixedButtonContainer.appendChild(menuButton);
    
    // 버튼 토글러 이벤트
    let buttonsVisible = false;
    buttonToggler.onclick = () => {
        if (buttonsVisible) {
            hideEndingButtons();
        } else {
            showEndingButtons();
        }
    };
    
    function showEndingButtons() {
        buttonsVisible = true;
        fixedButtonContainer.classList.add('button-show');
        buttonToggler.innerHTML = '❌';
        buttonToggler.title = '게임 옵션 닫기';
        buttonToggler.style.background = 'linear-gradient(135deg, #FF6B6B, #FF8E8E)';
    }
    
    function hideEndingButtons() {
        buttonsVisible = false;
        fixedButtonContainer.classList.remove('button-show');
        buttonToggler.innerHTML = '🎮';
        buttonToggler.title = '게임 옵션 열기';
        buttonToggler.style.background = 'linear-gradient(135deg, #FF69B4, #FF1493)';
    }
    
    // 요소들 조립
    canvasContainer.appendChild(endingCanvas);
    scrollContainer.appendChild(storyContent);
    storyContainer.appendChild(scrollContainer);
    
    endingDiv.appendChild(canvasContainer);
    endingDiv.appendChild(storyContainer);
    
    document.body.appendChild(endingDiv);
    document.body.appendChild(buttonToggler);
    document.body.appendChild(fixedButtonContainer);
    
    // 스크롤이 끝나면 자동으로 버튼 표시 (45초 후)
    setTimeout(() => {
        if (!buttonsVisible) {
            showEndingButtons();
            // 부드러운 알림 효과
            buttonToggler.style.animation = 'gentlePulse 1s ease-in-out 3';
        }
    }, 46000);
    
    // 엔딩 애니메이션 시작
    const endingCtx = endingCanvas.getContext('2d');
    endingCtx.imageSmoothingEnabled = false;
    
    // 파티클 시스템 초기화
    endingParticleSystem = new EndingParticleSystem(endingCanvas, endingCtx);
    
    // 캐릭터별 애니메이션 선택
    let animationFunction;
    switch(selectedCharacter) {
        case 'jiyul':
            animationFunction = animateJiyulEndingScene;
            break;
        case 'kiwi':
            animationFunction = animateKiwiEndingScene;
            break;
        case 'whitehouse':
            animationFunction = animateWhitehouseEndingScene;
            break;
        default:
            animationFunction = animateJiyulEndingScene;
    }
    
    // 애니메이션 실행
    animationFunction(endingCtx, endingCanvas);
    
    // 축하 파티클
    createEndingParticles();
    
    // 축하 효과
    createCelebrationEffects();
}

// 지율이 엔딩 애니메이션 (캐릭터 픽셀 데이터 사용)
function animateJiyulEndingScene(ctx, canvas) {
    let frame = 0;
    const landmarks = ['🗼', '🗽', '🏰', '🗿', '🎆', '🌉', '🕌'];
    let currentLandmark = 0;
    const stars = [];
    const floatingWords = ['HELLO', 'WORLD', 'AMAZING', 'WONDERFUL'];
    let wordIndex = 0;
    
    // 지율이 캐릭터 데이터 가져오기
    const jiyulData = getCharacterPixelData('jiyul');
    let currentAnimation = 'idle';
    let animationFrame = 0;
    
    // 별 초기화
    for (let i = 0; i < 60; i++) {
        stars.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height * 0.5,
            size: Math.random() * 3 + 1,
            twinkle: Math.random() * Math.PI * 2,
            speed: Math.random() * 0.03 + 0.01
        });
    }
    
    function draw() {
        // 우주 배경
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, '#000428');
        gradient.addColorStop(0.3, '#004E92');
        gradient.addColorStop(0.6, '#1A237E');
        gradient.addColorStop(1, '#E91E63');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // 반짝이는 별들
        stars.forEach(star => {
            const brightness = (Math.sin(star.twinkle + frame * star.speed) + 1) / 2;
            ctx.fillStyle = `rgba(255, 255, 255, ${brightness})`;
            ctx.beginPath();
            ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            ctx.fill();
            
            // 별 주변에 작은 반짝임
            if (brightness > 0.8) {
                ctx.fillStyle = `rgba(255, 215, 0, ${brightness * 0.5})`;
                ctx.beginPath();
                ctx.arc(star.x, star.y, star.size * 2, 0, Math.PI * 2);
                ctx.fill();
            }
        });
        
        // 지율이 캐릭터 그리기
        if (jiyulData) {
            const centerX = canvas.width / 2 - 32;
            const centerY = canvas.height / 2 - 32 + Math.sin(frame * 0.05) * 20;
            
            // 점프 애니메이션 전환
            if (frame % 180 < 60) {
                currentAnimation = 'jump';
            } else if (frame % 180 < 120) {
                currentAnimation = 'walking1';
            } else {
                currentAnimation = 'idle';
            }
            
            drawEndingPixelSprite(ctx, jiyulData[currentAnimation], jiyulData.colorMap, centerX, centerY, 4);
            
            // 지율이 주변 마법 효과
            const magicRadius = 80 + Math.sin(frame * 0.04) * 20;
            for (let i = 0; i < 8; i++) {
                const angle = (Math.PI * 2 / 8) * i + frame * 0.02;
                const x = centerX + 32 + Math.cos(angle) * magicRadius;
                const y = centerY + 32 + Math.sin(angle) * magicRadius;
                
                ctx.save();
                ctx.globalAlpha = 0.8;
                ctx.fillStyle = `hsl(${(frame + i * 45) % 360}, 80%, 60%)`;
                ctx.beginPath();
                ctx.arc(x, y, 6, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }
        }
        
        // 비행기와 함께 여행
        drawFlyingAirplaneWithJiyul(ctx, canvas, frame);
        
        // 세계 랜드마크 회전
        if (frame % 120 === 0) {
            currentLandmark = (currentLandmark + 1) % landmarks.length;
            wordIndex = (wordIndex + 1) % floatingWords.length;
            
            if (endingParticleSystem) {
                const centerX = canvas.width / 2;
                const centerY = canvas.height - 100;
                endingParticleSystem.create(centerX, centerY, 'star', 8);
                endingParticleSystem.create(centerX, centerY, 'magic', 5);
            }
        }
        
        // 랜드마크 표시
        ctx.save();
        ctx.font = 'bold 72px Arial';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#FFD700';
        ctx.shadowColor = '#FFD700';
        ctx.shadowBlur = 30;
        
        const landmarkY = canvas.height - 80 + Math.sin(frame * 0.06) * 15;
        ctx.fillText(landmarks[currentLandmark], canvas.width / 2, landmarkY);
        ctx.restore();
        
        // 영어 단어 떠다니기
        ctx.save();
        ctx.font = 'bold 32px Arial';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#FF69B4';
        ctx.shadowColor = '#FF69B4';
        ctx.shadowBlur = 15;
        
        const wordY = 100 + Math.sin(frame * 0.08) * 20;
        ctx.fillText(floatingWords[wordIndex], canvas.width / 2, wordY);
        ctx.restore();
        
        // 파티클 시스템 업데이트
        if (endingParticleSystem) {
            // 자동으로 파티클 생성
            if (frame % 30 === 0) {
                endingParticleSystem.create(
                    Math.random() * canvas.width,
                    canvas.height,
                    'confetti',
                    3
                );
            }
            
            endingParticleSystem.update();
            endingParticleSystem.render();
        }
        
        // 땅
        const groundGradient = ctx.createLinearGradient(0, canvas.height - 60, 0, canvas.height);
        groundGradient.addColorStop(0, '#2E7D32');
        groundGradient.addColorStop(1, '#1B5E20');
        ctx.fillStyle = groundGradient;
        ctx.fillRect(0, canvas.height - 60, canvas.width, 60);
        
        frame++;
        requestAnimationFrame(draw);
    }
    
    draw();
}

// 키위 엔딩 애니메이션 (캐릭터 픽셀 데이터 사용)
function animateKiwiEndingScene(ctx, canvas) {
    let frame = 0;
    const friends = [];
    const musicNotes = [];
    
    // 키위 캐릭터 데이터 가져오기
    const kiwiData = getCharacterPixelData('kiwi');
    let currentAnimation = 'idle';
    let animationFrame = 0;
    
    // 친구들과 음표 초기화
    for (let i = 0; i < 8; i++) {
        friends.push({
            x: (canvas.width / 8) * i + canvas.width / 16,
            y: canvas.height - 100 - Math.random() * 60,
            color: ['#FF6B9D', '#4ECDC4', '#FFD93D', '#6C5CE7', '#A8E6CF', '#FFB347', '#98FB98', '#DDA0DD'][i % 8],
            jumpPhase: Math.random() * Math.PI * 2,
            jumpSpeed: Math.random() * 0.08 + 0.04,
            size: Math.random() * 15 + 20
        });
    }
    
    for (let i = 0; i < 20; i++) {
        musicNotes.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            size: Math.random() * 25 + 15,
            speed: Math.random() * 3 + 2,
            rotation: Math.random() * Math.PI * 2,
            rotationSpeed: Math.random() * 0.08 - 0.04,
            color: `hsl(${Math.random() * 360}, 80%, 70%)`,
            note: ['♪', '♫', '♬', '♩', '♭', '♯'][Math.floor(Math.random() * 6)]
        });
    }
    
    function draw() {
        // 파티 배경
        const bgGradient = ctx.createRadialGradient(
            canvas.width / 2, canvas.height / 2, 0,
            canvas.width / 2, canvas.height / 2, canvas.width
        );
        bgGradient.addColorStop(0, '#FF006E');
        bgGradient.addColorStop(0.3, '#8338EC');
        bgGradient.addColorStop(0.6, '#3A86FF');
        bgGradient.addColorStop(1, '#06FFB4');
        ctx.fillStyle = bgGradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // 디스코볼 효과
        const discoX = canvas.width / 2;
        const discoY = 80;
        ctx.save();
        ctx.fillStyle = '#SILVER';
        ctx.beginPath();
        ctx.arc(discoX, discoY, 30, 0, Math.PI * 2);
        ctx.fill();
        
        // 반짝이는 조각들
        for (let i = 0; i < 12; i++) {
            const angle = (Math.PI * 2 / 12) * i + frame * 0.05;
            const x = discoX + Math.cos(angle) * 25;
            const y = discoY + Math.sin(angle) * 25;
            const brightness = (Math.sin(frame * 0.1 + i) + 1) / 2;
            
            ctx.fillStyle = `hsla(${(frame + i * 30) % 360}, 100%, 80%, ${brightness})`;
            ctx.fillRect(x - 3, y - 3, 6, 6);
        }
        ctx.restore();
        
        // 음표 애니메이션
        musicNotes.forEach(note => {
            note.y -= note.speed;
            note.rotation += note.rotationSpeed;
            
            if (note.y < -note.size) {
                note.y = canvas.height + note.size;
                note.x = Math.random() * canvas.width;
            }
            
            ctx.save();
            ctx.translate(note.x, note.y);
            ctx.rotate(note.rotation);
            ctx.font = `bold ${note.size}px Arial`;
            ctx.fillStyle = note.color;
            ctx.shadowColor = note.color;
            ctx.shadowBlur = 15;
            ctx.textAlign = 'center';
            ctx.fillText(note.note, 0, 0);
            ctx.restore();
        });
        
        // 춤추는 키위
        if (kiwiData) {
            const centerX = canvas.width / 2 - 32;
            const centerY = canvas.height - 150 + Math.abs(Math.sin(frame * 0.15)) * -50;
            
            // 춤 애니메이션 전환
            if (frame % 40 < 20) {
                currentAnimation = 'walking1';
            } else {
                currentAnimation = 'walking2';
            }
            
            // 키위 회전 효과
            ctx.save();
            ctx.translate(centerX + 32, centerY + 32);
            ctx.rotate(Math.sin(frame * 0.1) * 0.3);
            ctx.translate(-32, -32);
            
            drawEndingPixelSprite(ctx, kiwiData[currentAnimation], kiwiData.colorMap, 0, 0, 4);
            ctx.restore();
            
            // 키위 주변 댄스 링
            const ringRadius = 100 + Math.sin(frame * 0.08) * 30;
            for (let i = 0; i < 16; i++) {
                const angle = (Math.PI * 2 / 16) * i + frame * 0.15;
                const x = centerX + 32 + Math.cos(angle) * ringRadius;
                const y = centerY + 32 + Math.sin(angle) * (ringRadius * 0.5);
                
                ctx.save();
                ctx.globalAlpha = 0.8;
                ctx.fillStyle = `hsl(${(frame * 2 + i * 22.5) % 360}, 90%, 65%)`;
                ctx.beginPath();
                ctx.arc(x, y, 8, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }
        }
        
        // 춤추는 친구들
        friends.forEach((friend, i) => {
            const jumpHeight = Math.abs(Math.sin(frame * friend.jumpSpeed + friend.jumpPhase)) * 60;
            const wiggle = Math.sin(frame * 0.12 + i) * 10;
            
            ctx.save();
            ctx.translate(friend.x + wiggle, friend.y - jumpHeight);
            
            // 친구들 몸체
            ctx.fillStyle = friend.color;
            ctx.shadowColor = friend.color;
            ctx.shadowBlur = 20;
            ctx.beginPath();
            ctx.arc(0, 0, friend.size, 0, Math.PI * 2);
            ctx.fill();
            
            // 친구들 눈
            ctx.fillStyle = '#FFFFFF';
            ctx.beginPath();
            ctx.arc(-friend.size/3, -friend.size/3, friend.size/4, 0, Math.PI * 2);
            ctx.arc(friend.size/3, -friend.size/3, friend.size/4, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = '#000000';
            ctx.beginPath();
            ctx.arc(-friend.size/3, -friend.size/3, friend.size/6, 0, Math.PI * 2);
            ctx.arc(friend.size/3, -friend.size/3, friend.size/6, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.restore();
        });
        
        // 파티클 시스템
        if (endingParticleSystem) {
            if (frame % 15 === 0) {
                endingParticleSystem.create(
                    Math.random() * canvas.width,
                    Math.random() * canvas.height,
                    'confetti',
                    4
                );
            }
            
            if (frame % 8 === 0) {
                endingParticleSystem.create(
                    canvas.width / 2,
                    canvas.height / 2,
                    'magic',
                    2
                );
            }
            
            endingParticleSystem.update();
            endingParticleSystem.render();
        }
        
        frame++;
        requestAnimationFrame(draw);
    }
    
    draw();
}

// 화이트하우스 엔딩 애니메이션 (캐릭터 픽셀 데이터 사용)
function animateWhitehouseEndingScene(ctx, canvas) {
    let frame = 0;
    const alphabetKnights = [];
    const fireworks = [];
    const magicCircles = [];
    
    // 화이트하우스 캐릭터 데이터 가져오기
    const whitehouseData = getCharacterPixelData('whitehouse');
    let currentAnimation = 'idle';
    
    // 알파벳 기사단 초기화
    for (let i = 0; i < 26; i++) {
        alphabetKnights.push({
            letter: String.fromCharCode(65 + i),
            x: (canvas.width / 13) * (i % 13) + canvas.width / 26,
            y: Math.floor(i / 13) * 80 + 150,
            color: `hsl(${i * 14}, 80%, 65%)`,
            marchPhase: Math.random() * Math.PI * 2,
            size: 20 + Math.random() * 10
        });
    }
    
    function draw() {
        // 왕국 배경
        const skyGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        skyGradient.addColorStop(0, '#1A237E');
        skyGradient.addColorStop(0.3, '#3949AB');
        skyGradient.addColorStop(0.6, '#7E57C2');
        skyGradient.addColorStop(0.8, '#AB47BC');
        skyGradient.addColorStop(1, '#4CAF50');
        ctx.fillStyle = skyGradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // 마법 구름들
        for (let i = 0; i < 5; i++) {
            const cloudX = (canvas.width / 5) * i + Math.sin(frame * 0.01 + i) * 30;
            const cloudY = 60 + Math.sin(frame * 0.02 + i) * 20;
            
            ctx.save();
            ctx.globalAlpha = 0.7;
            ctx.fillStyle = '#E8EAF6';
            ctx.beginPath();
            ctx.arc(cloudX, cloudY, 40, 0, Math.PI * 2);
            ctx.arc(cloudX + 30, cloudY, 50, 0, Math.PI * 2);
            ctx.arc(cloudX - 30, cloudY, 45, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
        
        // 영어 성
        drawEnglishCastle(ctx, canvas, frame);
        
        // 왕 화이트하우스
        if (whitehouseData) {
            const centerX = canvas.width / 2 - 32;
            const centerY = canvas.height - 280 + Math.sin(frame * 0.06) * 8;
            
            // 왕관 효과 추가
            ctx.save();
            ctx.translate(centerX + 32, centerY + 32);
            ctx.scale(1.2, 1.2);
            ctx.translate(-32, -32);
            
            drawEndingPixelSprite(ctx, whitehouseData[currentAnimation], whitehouseData.colorMap, 0, 0, 5);
            
            // 왕의 오라
            const auraRadius = 120 + Math.sin(frame * 0.05) * 20;
            ctx.restore();
            
            ctx.save();
            ctx.globalAlpha = 0.3;
            ctx.strokeStyle = '#FFD700';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.arc(centerX + 32, centerY + 32, auraRadius, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }
        
        // 알파벳 기사단 행진
        alphabetKnights.forEach((knight, i) => {
            const marchOffset = Math.sin(frame * 0.08 + knight.marchPhase) * 15;
            const jumpHeight = Math.abs(Math.sin(frame * 0.15 + i * 0.3)) * 25;
            
            ctx.save();
            ctx.translate(knight.x + marchOffset, knight.y - jumpHeight);
            
            // 기사 방패
            ctx.fillStyle = knight.color;
            ctx.shadowColor = knight.color;
            ctx.shadowBlur = 15;
            ctx.fillRect(-knight.size, -knight.size/2, knight.size * 2, knight.size * 1.5);
            
            // 알파벳
            ctx.fillStyle = '#FFFFFF';
            ctx.font = `bold ${knight.size}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.shadowColor = '#000000';
            ctx.shadowBlur = 6;
            ctx.fillText(knight.letter, 0, knight.size/4);
            
            // 기사 검
            ctx.fillStyle = '#C0C0C0';
            ctx.fillRect(-2, -knight.size * 1.5, 4, knight.size);
            ctx.fillStyle = '#FFD700';
            ctx.fillRect(-6, -knight.size * 1.5, 12, 8);
            
            ctx.restore();
        });
        
        // 불꽃놀이
        if (frame % 80 === 0) {
            fireworks.push({
                x: Math.random() * canvas.width,
                y: canvas.height,
                targetY: Math.random() * canvas.height * 0.4 + 80,
                color: `hsl(${Math.random() * 360}, 100%, 70%)`,
                exploded: false,
                particles: []
            });
        }
        
        // 불꽃놀이 렌더링
        for (let i = fireworks.length - 1; i >= 0; i--) {
            const fw = fireworks[i];
            
            if (!fw.exploded) {
                fw.y -= 8;
                
                ctx.strokeStyle = fw.color;
                ctx.lineWidth = 4;
                ctx.shadowColor = fw.color;
                ctx.shadowBlur = 10;
                ctx.beginPath();
                ctx.moveTo(fw.x, fw.y);
                ctx.lineTo(fw.x, fw.y + 30);
                ctx.stroke();
                ctx.shadowBlur = 0;
                
                if (fw.y <= fw.targetY) {
                    fw.exploded = true;
                    
                    for (let j = 0; j < 40; j++) {
                        const angle = (Math.PI * 2 / 40) * j;
                        const velocity = Math.random() * 6 + 3;
                        fw.particles.push({
                            x: fw.x,
                            y: fw.y,
                            vx: Math.cos(angle) * velocity,
                            vy: Math.sin(angle) * velocity,
                            life: 80
                        });
                    }
                    
                    if (endingParticleSystem) {
                        endingParticleSystem.create(fw.x, fw.y, 'star', 15);
                        endingParticleSystem.create(fw.x, fw.y, 'magic', 10);
                    }
                }
            } else {
                fw.particles = fw.particles.filter(p => {
                    p.x += p.vx;
                    p.y += p.vy;
                    p.vy += 0.15;
                    p.vx *= 0.98;
                    p.life--;
                    
                    const alpha = p.life / 80;
                    ctx.globalAlpha = alpha;
                    ctx.fillStyle = fw.color;
                    ctx.shadowColor = fw.color;
                    ctx.shadowBlur = 8;
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.globalAlpha = 1;
                    ctx.shadowBlur = 0;
                    
                    return p.life > 0;
                });
                
                if (fw.particles.length === 0) {
                    fireworks.splice(i, 1);
                }
            }
        }
        
        // 파티클 시스템
        if (endingParticleSystem) {
            if (frame % 20 === 0) {
                endingParticleSystem.create(
                    Math.random() * canvas.width,
                    0,
                    'confetti',
                    3
                );
            }
            
            endingParticleSystem.update();
            endingParticleSystem.render();
        }
        
        frame++;
        requestAnimationFrame(draw);
    }
    
    draw();
}

// 보조 함수들 (개선된 버전)
function drawFlyingAirplaneWithJiyul(ctx, canvas, frame) {
    const planeX = canvas.width / 2 + Math.sin(frame * 0.015) * 150;
    const planeY = 140 + Math.sin(frame * 0.04) * 40;
    
    ctx.save();
    ctx.translate(planeX, planeY);
    
    // 비행기 그림자
    ctx.save();
    ctx.globalAlpha = 0.3;
    ctx.fillStyle = '#000000';
    ctx.fillRect(-65, 15, 130, 25);
    ctx.restore();
    
    // 비행기 몸체
    ctx.fillStyle = '#E0E0E0';
    ctx.fillRect(-70, -15, 140, 30);
    
    // 비행기 날개
    ctx.fillStyle = '#4169E1';
    ctx.fillRect(-30, -40, 60, 80);
    
    // 비행기 꼬리
    ctx.fillStyle = '#FF6B9D';
    ctx.beginPath();
    ctx.moveTo(60, -10);
    ctx.lineTo(80, -25);
    ctx.lineTo(80, 25);
    ctx.lineTo(60, 10);
    ctx.closePath();
    ctx.fill();
    
    // 창문들
    ctx.fillStyle = '#87CEEB';
    for (let i = 0; i < 10; i++) {
        ctx.beginPath();
        ctx.arc(-60 + i * 14, 0, 6, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // 프로펠러
    ctx.save();
    ctx.translate(-70, 0);
    ctx.rotate(frame * 0.5);
    ctx.strokeStyle = '#808080';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-20, 0);
    ctx.lineTo(20, 0);
    ctx.moveTo(0, -20);
    ctx.lineTo(0, 20);
    ctx.stroke();
    ctx.restore();
    
    ctx.restore();
}

function drawEnglishCastle(ctx, canvas, frame) {
    const castleX = canvas.width / 2;
    const castleY = canvas.height - 250;
    
    // 성 그림자
    ctx.save();
    ctx.globalAlpha = 0.3;
    ctx.fillStyle = '#000000';
    ctx.fillRect(castleX - 125, castleY + 130, 250, 20);
    ctx.restore();
    
    // 성 본체
    ctx.fillStyle = '#8B7355';
    ctx.fillRect(castleX - 120, castleY, 240, 120);
    
    // 성 문
    ctx.fillStyle = '#654321';
    ctx.fillRect(castleX - 20, castleY + 60, 40, 60);
    
    // 성 탑들
    const towers = [-80, -40, 0, 40, 80];
    towers.forEach((offset, i) => {
        const towerHeight = 60 + Math.sin(frame * 0.03 + i) * 5;
        
        ctx.fillStyle = '#A0826D';
        ctx.fillRect(castleX + offset - 20, castleY - towerHeight, 40, towerHeight + 120);
        
        // 탑 지붕
        ctx.fillStyle = `hsl(${220 + i * 10}, 70%, 50%)`;
        ctx.beginPath();
        ctx.moveTo(castleX + offset - 25, castleY - towerHeight);
        ctx.lineTo(castleX + offset, castleY - towerHeight - 40);
        ctx.lineTo(castleX + offset + 25, castleY - towerHeight);
        ctx.closePath();
        ctx.fill();
        
        // 탑 창문
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(castleX + offset, castleY - towerHeight/2, 8, 0, Math.PI * 2);
        ctx.fill();
    });
    
    // 성 벽 장식
    ctx.fillStyle = '#9370DB';
    for (let i = 0; i < 12; i++) {
        const flagX = castleX - 120 + i * 20;
        ctx.fillRect(flagX, castleY - 10, 4, 30);
    }
}

// 축하 파티클 생성 (개선된 버전)
function createEndingParticles() {
    const container = document.getElementById('endingScreen');
    if (!container) return;
    
    const particleContainer = document.createElement('div');
    particleContainer.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        overflow: hidden;
    `;
    
    const particleTypes = ['⭐', '💖', '✨', '🎊', '🎉', '💫', '🌟', '🦄', '🌈', '💎'];
    
    for (let i = 0; i < 60; i++) {
        const particle = document.createElement('div');
        const type = particleTypes[Math.floor(Math.random() * particleTypes.length)];
        const size = Math.random() * 25 + 15;
        const startX = Math.random() * 100;
        const duration = Math.random() * 5 + 4;
        const delay = Math.random() * 8;
        
        particle.textContent = type;
        particle.style.cssText = `
            position: absolute;
            font-size: ${size}px;
            left: ${startX}%;
            top: -60px;
            animation: 
                particleFall ${duration}s linear ${delay}s infinite,
                particleRotate ${duration * 2}s linear ${delay}s infinite,
                particleScale ${duration}s ease-in-out ${delay}s infinite;
            filter: drop-shadow(0 0 15px rgba(255, 255, 255, 0.8));
            z-index: 10001;
        `;
        
        particleContainer.appendChild(particle);
    }
    
    container.appendChild(particleContainer);
    
    const style = document.createElement('style');
    style.textContent += `
        @keyframes particleFall {
            0% {
                transform: translateY(-60px);
                opacity: 0;
            }
            10% {
                opacity: 1;
            }
            85% {
                opacity: 1;
            }
            100% {
                transform: translateY(calc(100vh + 60px));
                opacity: 0;
            }
        }
        @keyframes particleRotate {
            from { transform: rotate(0deg); }
            to { transform: rotate(720deg); }
        }
        @keyframes particleScale {
            0%, 100% { transform: scale(1); }
            25% { transform: scale(1.3); }
            50% { transform: scale(0.8); }
            75% { transform: scale(1.1); }
        }
    `;
    document.head.appendChild(style);
    
    setTimeout(() => {
        if (particleContainer.parentElement) {
            particleContainer.remove();
        }
    }, 20000);
}

// 축하 효과 (개선된 버전)
function createCelebrationEffects() {
    // 화면 플래시 효과
    const flash = document.createElement('div');
    flash.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: radial-gradient(circle at center, 
            rgba(255, 255, 255, 0.9),
            rgba(255, 215, 0, 0.8),
            rgba(255, 105, 180, 0.6),
            transparent 80%);
        pointer-events: none;
        z-index: 10003;
        animation: superFlash 2s ease-out;
    `;
    
    const flashStyle = document.createElement('style');
    flashStyle.textContent = `
        @keyframes superFlash {
            0% { 
                opacity: 0; 
                transform: scale(0.3);
            }
            30% { 
                opacity: 1; 
                transform: scale(1.5);
            }
            70% {
                opacity: 0.8;
                transform: scale(1.2);
            }
            100% { 
                opacity: 0;
                transform: scale(1);
            }
        }
    `;
    document.head.appendChild(flashStyle);
    document.body.appendChild(flash);
    
    setTimeout(() => flash.remove(), 2000);
    
    // 추가 축하 텍스트
    const celebrationText = document.createElement('div');
    celebrationText.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        font-size: 48px;
        color: #FFD700;
        font-family: 'Jua', sans-serif;
        text-shadow: 0 0 30px #FFD700;
        z-index: 10004;
        pointer-events: none;
        animation: celebrationBounce 3s ease-out forwards;
    `;
    celebrationText.textContent = '🎉 축하합니다! 🎉';
    
    const celebrationStyle = document.createElement('style');
    celebrationStyle.textContent = `
        @keyframes celebrationBounce {
            0% { 
                opacity: 0; 
                transform: translate(-50%, -50%) scale(0.1) rotate(-180deg);
            }
            50% { 
                opacity: 1; 
                transform: translate(-50%, -50%) scale(1.3) rotate(10deg);
            }
            70% {
                transform: translate(-50%, -50%) scale(0.9) rotate(-5deg);
            }
            85% {
                transform: translate(-50%, -50%) scale(1.1) rotate(2deg);
            }
            100% { 
                opacity: 0;
                transform: translate(-50%, -50%) scale(1) rotate(0deg);
            }
        }
    `;
    document.head.appendChild(celebrationStyle);
    document.body.appendChild(celebrationText);
    
    setTimeout(() => celebrationText.remove(), 3000);
}

// 전역 함수로 등록
window.showEnding = showEnding;

console.log('✨ 최종 개선된 엔딩 시스템 로드 완료! 자동 스크롤 + 사용자 친화적 토글 버튼 ✨');