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
// 스프라이트를 1픽셀=1px 오프스크린에 한 번만 굽고 이후엔 drawImage 한 번으로 그린다
const _endingSpriteBakeCache = new WeakMap();

function drawEndingPixelSprite(ctx, sprite, colorMap, x, y, scale = 4) {
    if (!sprite || !colorMap) return;
    let baked = _endingSpriteBakeCache.get(sprite);
    if (!baked) {
        if (typeof bakePixelSprite === 'function') {
            baked = bakePixelSprite(sprite, colorMap, false);  // 슬러그 후처리 포함
        } else {
            baked = document.createElement('canvas');
            baked.width = sprite[0].length;
            baked.height = sprite.length;
            const bctx2 = baked.getContext('2d');
            for (let row = 0; row < sprite.length; row++) {
                for (let col = 0; col < sprite[row].length; col++) {
                    const pixel = sprite[row][col];
                    if (pixel !== 0 && colorMap[pixel]) {
                        bctx2.fillStyle = colorMap[pixel];
                        bctx2.fillRect(col, row, 1, 1);
                    }
                }
            }
        }
        _endingSpriteBakeCache.set(sprite, baked);
    }
    const padCells = (baked.width - sprite[0].length) / 2;
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(baked, x - padCells * scale, y - padCells * scale, baked.width * scale, baked.height * scale);
    ctx.restore();
}

// ── 엔딩 도트화 & 무이모지 렌더링 도우미 ─────────────────────
const ENDING_PIXEL = 3;   // 배경 도트 블록 크기

function getEndingPixelCtx(canvas) {
    const w = Math.max(1, Math.ceil(canvas.width / ENDING_PIXEL));
    const h = Math.max(1, Math.ceil(canvas.height / ENDING_PIXEL));
    if (!canvas._pixCanvas || canvas._pixCanvas.width !== w || canvas._pixCanvas.height !== h) {
        canvas._pixCanvas = document.createElement('canvas');
        canvas._pixCanvas.width = w;
        canvas._pixCanvas.height = h;
    }
    return canvas._pixCanvas.getContext('2d');
}

function blitEndingPixel(ctx, canvas) {
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(canvas._pixCanvas, 0, 0, canvas.width, canvas.height);
}

// 도트 텍스트 (opening.js의 createPixelTextCanvas 재사용 + 캐시)
const _endingTextCache = new Map();
function drawEndingBakedText(ctx, text, cx, cy, opts = {}) {
    if (typeof createPixelTextCanvas !== 'function') return;
    const key = text + '|' + (opts.fontPx || 14) + '|' + (opts.color || '');
    let c = _endingTextCache.get(key);
    if (!c) {
        c = createPixelTextCanvas(text, Object.assign({ scale: 1 }, opts));
        _endingTextCache.set(key, c);
    }
    const s = opts.dispScale || 2;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(c, cx - (c.width * s) / 2, cy - (c.height * s) / 2, c.width * s, c.height * s);
}

// 이모지 제거 유틸 (스토리 텍스트용)
function stripEmoji(s) {
    return String(s)
        .replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}\u{200D}\u{2049}\u{203C}]/gu, '')
        .replace(/ {2,}/g, ' ')
        .trim();
}

// 픽셀 음표 (이모지 대신 콩나물 모양을 직접 그림)
function drawPixelNote(c, x, y, size, color, rotation = 0) {
    c.save();
    c.translate(x, y);
    c.rotate(rotation);
    const u = Math.max(2, size / 5);
    c.fillStyle = color;
    c.fillRect(-u * 1.5, u, u * 2, u * 1.5);           // 머리
    c.fillRect(u * 0.5, -u * 2.5, u * 0.7, u * 5);     // 줄기
    c.fillRect(u * 0.5, -u * 2.5, u * 1.8, u * 0.8);   // 깃발
    c.restore();
}

// 픽셀 랜드마크 (이모지 대신 세계 명소를 도트로)
function drawPixelLandmark(c, type, cx, baseY, h) {
    c.save();
    c.translate(cx, baseY);
    switch (type) {
        case 'tower':                                   // 철탑
            c.fillStyle = '#C46A2B';
            c.fillRect(-6, -h, 12, h * 0.2);
            c.fillRect(-8, -h * 0.8, 16, h * 0.62);
            c.fillRect(-15, -h * 0.8, 30, h * 0.1);
            c.fillRect(-24, -h * 0.45, 48, h * 0.1);
            c.fillStyle = '#A34F16';
            c.fillRect(-32, -h * 0.14, 20, h * 0.14);
            c.fillRect(12, -h * 0.14, 20, h * 0.14);
            c.fillStyle = '#FFD700';
            c.fillRect(-3, -h - 12, 6, 12);
            break;
        case 'castle':                                  // 성
            c.fillStyle = '#8B7355';
            c.fillRect(-42, -h * 0.6, 84, h * 0.6);
            c.fillStyle = '#A0826D';
            c.fillRect(-54, -h * 0.85, 20, h * 0.85);
            c.fillRect(34, -h * 0.85, 20, h * 0.85);
            c.fillStyle = '#B0413E';
            c.fillRect(-58, -h, 28, h * 0.17);
            c.fillRect(30, -h, 28, h * 0.17);
            c.fillStyle = '#654321';
            c.fillRect(-12, -h * 0.34, 24, h * 0.34);
            c.fillStyle = '#FFD700';
            c.fillRect(-2, -h * 1.12, 4, h * 0.14);
            break;
        case 'bridge':                                  // 다리
            c.fillStyle = '#C0392B';
            c.fillRect(-72, -h * 0.34, 144, 10);
            c.fillRect(-48, -h, 12, h);
            c.fillRect(36, -h, 12, h);
            c.strokeStyle = '#E74C3C';
            c.lineWidth = 5;
            c.beginPath();
            c.moveTo(-72, -h * 0.3);
            c.quadraticCurveTo(0, -h * 1.15, 72, -h * 0.3);
            c.stroke();
            break;
        default:                                        // 석상
            c.fillStyle = '#7F8C8D';
            c.fillRect(-18, -h, 36, h);
            c.fillStyle = '#95A5A6';
            c.fillRect(-18, -h, 10, h);
            c.fillStyle = '#566573';
            c.fillRect(-13, -h * 0.7, 10, 6);
            c.fillRect(4, -h * 0.7, 10, 6);
            c.fillRect(-7, -h * 0.38, 14, 8);
            break;
    }
    c.restore();
}

// 엔딩용 2D 비행기 스프라이트 (46x22)
const ENDING_PLANE = {
    sprite: [
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,2,3,3,1,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,2,3,3,3,3,1,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,3,3,3,3,3,3,3,1,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,0,0,0,0,0,0,0,1,3,3,3,3,3,3,3,3,3,1,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,4,4,4,4,4,1,0,0,0,0,0,1,3,3,3,3,3,3,3,3,3,3,1,0,0],
    [0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,4,4,4,4,4,4,4,1,1,1,1,1,3,3,3,3,3,3,3,3,3,3,3,1,0,0],
    [0,0,0,0,0,0,1,1,1,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,1,1,1,1,1,1,1,1,1,1,1,1,1,0],
    [0,1,1,1,1,1,5,5,6,7,7,7,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,3,3,3,3,3,3,3,3,3,3,3,1],
    [1,8,8,9,9,9,10,10,6,7,7,7,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,11,11,11,11,11,11,11,11,11,11,1],
    [1,8,8,9,9,9,10,10,6,6,6,6,10,10,7,7,10,7,7,10,7,7,10,7,7,10,7,7,10,7,7,10,10,10,10,10,1,1,1,1,1,1,1,1,1,0],
    [1,8,8,9,9,9,10,10,10,10,10,10,10,10,7,7,10,7,7,10,7,7,10,7,7,10,7,7,10,7,7,10,10,10,10,10,1,0,0,0,0,0,0,0,0,0],
    [0,1,1,1,9,9,10,10,10,10,10,10,10,10,10,10,10,12,12,12,12,12,12,12,12,12,12,12,10,10,10,10,10,10,10,1,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,1,1,13,13,13,13,13,13,13,13,13,13,14,14,14,14,14,14,14,14,14,14,14,13,13,13,13,13,13,13,1,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,1,1,1,13,13,13,13,13,13,14,14,14,14,14,14,14,14,14,14,13,13,13,13,13,13,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,1,1,1,1,1,14,14,14,14,14,14,14,14,14,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,1,14,14,14,14,14,14,14,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,14,14,14,14,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
    ],
    colorMap: {
    0: null,
    1: "#283746",
    2: "#FFA0BE",
    3: "#FF6B9D",
    4: "#304FAF",
    5: "#FFFFFF",
    6: "#546E7A",
    7: "#87CEEB",
    8: "#546E7A",
    9: "#FFC107",
    10: "#ECEFF1",
    11: "#D84678",
    12: "#7896F0",
    13: "#B0BEC5",
    14: "#4169E1"
    }
};

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
        font-family: 'DungGeunMo', 'Jua', sans-serif;
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
        font-family: 'DungGeunMo', 'Jua', sans-serif;
        user-select: none;
    `;
    buttonToggler.innerHTML = 'GO';
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
            font-family: 'DungGeunMo', 'Jua', sans-serif;
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
            title: "크림이의 신나는 글로벌 영어 대모험!",
            scenes: [
                {
                    text: "크림이: '와하하! 모든 몬스터를 이겼다!'",
                    emoji: ""
                },
                {
                    text: "갑자기 하늘에서 무지개가 내려와서...",
                    emoji: ""
                },
                {
                    text: "미국 대통령: 'Hello! 크림아! 우리나라로 와줘!'",
                    emoji: ""
                },
                {
                    text: "영국 여왕: '브라보! 런던에서 차 한 잔 할까?'",
                    emoji: ""
                },
                {
                    text: "프랑스 대통령: '마니피크! 파리에서 크루아상 먹자!'",
                    emoji: ""
                },
                {
                    text: "크림이: '어어? 다 알아들어! 나 천재인가?'",
                    emoji: ""
                },
                {
                    text: "그래서 크림이는 제주도에 '영어 마법 카페'를 열었어요!",
                    emoji: ""
                },
                {
                    text: "매일 외국인들이 줄을 서서 영어 마법을 배우러 와요!",
                    emoji: ""
                },
                {
                    text: "크림이: '영어로 제주도 구경 시켜드릴게요~!'",
                    emoji: ""
                },
                {
                    text: "그리고 크림이는 영어 마법사가 되어 행복하게 살았답니다!",
                    emoji: ""
                }
            ]
        },
        kiwi: {
            title: "키위의 우주 대모험 시간여행!",
            scenes: [
                {
                    text: "키위: '라룹라룹!' (와! 내가 해냈어!)",
                    emoji: ""
                },
                {
                    text: "그때 갑자기, 번쩍번쩍 UFO가 내려와요!",
                    emoji: ""
                },
                {
                    text: "외계인: '우와! 키위! 너는 전설의 영어 도마뱀이구나!'",
                    emoji: ""
                },
                {
                    text: "키위: '라룹?' (엥? 외계인도 있었어?)",
                    emoji: ""
                },
                {
                    text: "외계인: '우리 은하수 영어 학교 선생님이 되어줘!'",
                    emoji: ""
                },
                {
                    text: "키위: '라룹라룹!' (오오! 재밌겠네!)",
                    emoji: ""
                },
                {
                    text: "이제 키위는 우주 최고 영어 선생님이 되어서...",
                    emoji: ""
                },
                {
                    text: "외계 각 행성 친구들에게 영어를 가르치고 있어요!",
                    emoji: ""
                },
                {
                    text: "키위: 'Laloop means Hello in Earth language!'",
                    emoji: ""
                },
                {
                    text: "우주에서 가장 유명한 영어 도마뱀이 되었답니다!",
                    emoji: ""
                }
            ]
        },
        whitehouse: {
            title: "화이트하우스의 마법 왕국 건설기!",
            scenes: [
                {
                    text: "화이트하우스: '드디어! 모든 정보를 학습했다!'",
                    emoji: ""
                },
                {
                    text: "갑자기 텐트가 반짝반짝 거대한 성으로 변해요!",
                    emoji: ""
                },
                {
                    text: "영어 단어들이 살아나서 춤을 춰요!",
                    emoji: ""
                },
                {
                    text: "Hello: '새로운 왕님! 여기 앉으세요!'",
                    emoji: ""
                },
                {
                    text: "Wonderful: '오늘은 정말 멋진 날이네요!'",
                    emoji: ""
                },
                {
                    text: "Amazing: '이 왕국이 정말 놀라워요!'",
                    emoji: ""
                },
                {
                    text: "화이트하우스: '오호! 이것이 진짜 영어 마법 왕국이구나!'",
                    emoji: ""
                },
                {
                    text: "매일 새로운 영어 단어 친구들이 이사를 와요!",
                    emoji: ""
                },
                {
                    text: "'사전 성(Dictionary Castle)'이라고 불리는 이곳은...",
                    emoji: ""
                },
                {
                    text: "온 세상에서 가장 재밌고 신나는 영어 왕국이 되었답니다!",
                    emoji: ""
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
            ">${stripEmoji(story.title)}</h1>
            <div style="font-size: 28px; color: #FF69B4;">
                재미있는 이야기가 시작돼요!
            </div>
        </div>
    `;
    
    // 각 씬 추가
    story.scenes.forEach((scene, index) => {
        storyHTML += `
            <div class="story-scene">
                <canvas class="scene-pixel-art" width="96" height="96" style="image-rendering: pixelated;"></canvas>
                <p class="scene-text">${stripEmoji(scene.text)}</p>
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
        gradeEmoji = "";
        gradeColor = "#FFD700";
    } else if (accuracy >= 85) {
        grade = "영어 마법사";
        gradeEmoji = "";
        gradeColor = "#FF69B4";
    } else if (accuracy >= 70) {
        grade = "영어 용사";
        gradeEmoji = "";
        gradeColor = "#00D9FF";
    } else {
        grade = "영어 새싹";
        gradeEmoji = "";
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
            ">최종 성적표</h2>
            
            <div class="score-grid">
                <div class="score-item">
                    <div class="score-label">최종 점수</div>
                    <div class="score-value" style="color: #FFD700;">
                        ${finalScore.toLocaleString()}점
                    </div>
                </div>
                
                <div class="score-item">
                    <div class="score-label">정답률</div>
                    <div class="score-value" style="color: #FF69B4;">
                        ${accuracy}%
                    </div>
                </div>
                
                <div class="score-item">
                    <div class="score-label">플레이 시간</div>
                    <div class="score-value" style="color: #00D9FF;">
                        ${Math.floor(playTime / 60)}분 ${playTime % 60}초
                    </div>
                </div>

                <div class="score-item">
                    <div class="score-label">최고 콤보</div>
                    <div class="score-value" style="color: #FF8C00;">
                        ${(typeof gameStats !== 'undefined' && gameStats.maxCombo) ? gameStats.maxCombo : 0}연속
                    </div>
                </div>

                <div class="score-item" style="
                    background: linear-gradient(135deg, ${gradeColor}40, ${gradeColor}20);
                    border: 3px solid ${gradeColor};
                ">
                    <div class="score-label">등급</div>
                    <div class="score-value" style="color: ${gradeColor};">
                        ${grade}
                    </div>
                </div>
            </div>
            
            <div style="
                margin-top: 50px;
                font-size: 26px;
                color: #FFFFFF;
                text-shadow: 3px 3px 6px rgba(0,0,0,0.7);
            ">
                와! 정말 대단해요! 알파벳 대마왕까지 물리치고 총정리전을 클리어했어요!
            </div>
            ${(typeof gameStats !== 'undefined' && gameStats.wrongWords && gameStats.wrongWords.length > 0) ? `
            <div style="
                margin-top: 40px;
                padding: 20px 30px;
                background: rgba(255, 255, 255, 0.12);
                border-radius: 16px;
                border: 2px solid rgba(255, 215, 0, 0.5);
                text-align: left;
                display: inline-block;
            ">
                <div style="font-size: 20px; color: #FFD700; margin-bottom: 12px;">오늘 틀린 단어 - 한 번 더 읽어봐요!</div>
                ${gameStats.wrongWords.slice(0, 10).map(w =>
                    `<div style="font-size: 16px; color: #FFFFFF; margin: 4px 0;">• <b>${w.english}</b> = ${w.korean}</div>`
                ).join('')}
                ${gameStats.wrongWords.length > 10 ? `<div style="font-size: 14px; color: #E0E0E0;">... 외 ${gameStats.wrongWords.length - 10}개</div>` : ''}
            </div>` : ''}
            
            <div style="
                margin-top: 30px;
                font-size: 18px;
                color: #E0E0E0;
                text-align: center;
            ">
                우하단 메뉴 버튼을 눌러서 게임 옵션을 확인하세요!
            </div>
        </div>
    `;
    
    // 여백 추가
    storyHTML += `<div style="height: 300px;"></div>`;
    
    storyContent.innerHTML = storyHTML;

    // 씬 일러스트: 이모지 대신 캐릭터 도트 스프라이트를 그린다
    const sceneData = getCharacterPixelData(selectedCharacter) || getCharacterPixelData('jiyul');
    const scenePoses = ['idle', 'walking1', 'jump', 'walking3', 'walking2', 'walking4'];
    storyContent.querySelectorAll('.scene-pixel-art').forEach((cv, idx) => {
        if (!sceneData) return;
        const pose = sceneData[scenePoses[idx % scenePoses.length]] || sceneData.idle;
        const c2 = cv.getContext('2d');
        c2.imageSmoothingEnabled = false;
        const fit = Math.min(cv.width / pose[0].length, cv.height / pose.length);
        const offX = (cv.width - pose[0].length * fit) / 2;
        const offY = (cv.height - pose.length * fit) / 2;
        c2.save();
        c2.translate(offX, offY);
        drawEndingPixelSprite(c2, pose, sceneData.colorMap, 0, 0, fit);
        c2.restore();
    });
    
    // 버튼들 생성
    const retryButton = document.createElement('button');
    retryButton.className = 'ending-button';
    retryButton.innerHTML = '다시하기';
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
    menuButton.innerHTML = '메인으로';
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
        buttonToggler.innerHTML = '×';
        buttonToggler.title = '게임 옵션 닫기';
        buttonToggler.style.background = 'linear-gradient(135deg, #FF6B6B, #FF8E8E)';
    }
    
    function hideEndingButtons() {
        buttonsVisible = false;
        fixedButtonContainer.classList.remove('button-show');
        buttonToggler.innerHTML = 'GO';
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

// 크림이 엔딩 애니메이션 (캐릭터 픽셀 데이터 사용)
function animateJiyulEndingScene(ctx, canvas) {
    let frame = 0;
    const landmarkTypes = ['tower', 'castle', 'bridge', 'moai'];
    let currentLandmark = 0;
    const stars = [];
    const floatingWords = ['HELLO', 'WORLD', 'AMAZING', 'WONDERFUL'];
    let wordIndex = 0;
    const jiyulData = getCharacterPixelData('jiyul');
    let currentAnimation = 'idle';

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
        // ── 저해상 도트 패스: 밤하늘·별·비행기·랜드마크 ──
        const p = getEndingPixelCtx(canvas);
        p.save();
        p.setTransform(1 / ENDING_PIXEL, 0, 0, 1 / ENDING_PIXEL, 0, 0);
        const gradient = p.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, '#000428');
        gradient.addColorStop(0.3, '#004E92');
        gradient.addColorStop(0.6, '#1A237E');
        gradient.addColorStop(1, '#E91E63');
        p.fillStyle = gradient;
        p.fillRect(0, 0, canvas.width, canvas.height);

        stars.forEach(star => {
            const brightness = (Math.sin(star.twinkle + frame * star.speed) + 1) / 2;
            p.fillStyle = `rgba(255, 255, 255, ${brightness})`;
            p.fillRect(star.x, star.y, star.size * 2, star.size * 2);
        });

        // 세계 랜드마크 (도트 그림)
        const landmarkY = canvas.height - 30 + Math.sin(frame * 0.06) * 8;
        drawPixelLandmark(p, landmarkTypes[currentLandmark], canvas.width / 2, landmarkY, 130);

        p.restore();
        blitEndingPixel(ctx, canvas);

        // 2D 스프라이트 비행기 (원본 해상도로 선명하게)
        drawFlyingAirplaneWithJiyul(ctx, canvas, frame);

        // ── 원본 해상도: 크림 스프라이트·마법 링·도트 텍스트 ──
        if (jiyulData) {
            const centerX = canvas.width / 2 - 32;
            const centerY = canvas.height / 2 - 32 + Math.sin(frame * 0.05) * 20;
            if (frame % 180 < 60) currentAnimation = 'jump';
            else if (frame % 180 < 120) currentAnimation = 'walking1';
            else currentAnimation = 'idle';
            drawEndingPixelSprite(ctx, jiyulData[currentAnimation], jiyulData.colorMap, centerX, centerY, 64 / jiyulData.idle[0].length);

            const magicRadius = 80 + Math.sin(frame * 0.04) * 20;
            for (let i = 0; i < 8; i++) {
                const angle = (Math.PI * 2 / 8) * i + frame * 0.02;
                ctx.save();
                ctx.globalAlpha = 0.8;
                ctx.fillStyle = `hsl(${(frame + i * 45) % 360}, 80%, 60%)`;
                ctx.fillRect(centerX + 32 + Math.cos(angle) * magicRadius - 4,
                             centerY + 32 + Math.sin(angle) * magicRadius - 4, 8, 8);
                ctx.restore();
            }
        }

        if (frame % 120 === 0 && frame > 0) {
            currentLandmark = (currentLandmark + 1) % landmarkTypes.length;
            wordIndex = (wordIndex + 1) % floatingWords.length;
            if (endingParticleSystem) {
                endingParticleSystem.create(canvas.width / 2, canvas.height - 100, 'star', 8);
                endingParticleSystem.create(canvas.width / 2, canvas.height - 100, 'magic', 5);
            }
        }

        // 떠다니는 영어 단어 (도트 텍스트)
        drawEndingBakedText(ctx, floatingWords[wordIndex],
            canvas.width / 2, 100 + Math.sin(frame * 0.08) * 20,
            { fontPx: 16, color: '#FF69B4', outline: '#FFFFFF', shadow: 'rgba(0,0,0,0.3)', dispScale: 3 });

        if (endingParticleSystem) {
            if (frame % 30 === 0) {
                endingParticleSystem.create(Math.random() * canvas.width, Math.random() * canvas.height * 0.5, 'star', 2);
            }
            endingParticleSystem.update();
            endingParticleSystem.render();
        }

        frame++;
        // 엔딩 화면이 닫히면 루프 종료 (rAF 누수 방지)
        if (document.getElementById('endingScreen')) {
            requestAnimationFrame(draw);
        }
    }

    draw();
}

// 키위 엔딩 애니메이션 (캐릭터 픽셀 데이터 사용)
function animateKiwiEndingScene(ctx, canvas) {
    let frame = 0;
    const musicNotes = [];
    const friends = [];
    const kiwiData = getCharacterPixelData('kiwi');
    let currentAnimation = 'idle';

    for (let i = 0; i < 10; i++) {
        musicNotes.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            size: Math.random() * 18 + 14,
            speed: Math.random() * 1.5 + 0.5,
            rotation: Math.random() * Math.PI * 2,
            rotationSpeed: (Math.random() - 0.5) * 0.05,
            color: `hsl(${Math.random() * 360}, 90%, 70%)`
        });
    }
    for (let i = 0; i < 5; i++) {
        friends.push({
            x: (canvas.width / 6) * (i + 1),
            y: canvas.height - 80,
            size: 16 + Math.random() * 10,
            color: `hsl(${i * 70}, 85%, 65%)`,
            jumpPhase: Math.random() * Math.PI * 2,
            jumpSpeed: Math.random() * 0.08 + 0.04
        });
    }

    function draw() {
        // ── 저해상 도트 패스: 파티 배경·디스코볼·음표·친구들 ──
        const p = getEndingPixelCtx(canvas);
        p.save();
        p.setTransform(1 / ENDING_PIXEL, 0, 0, 1 / ENDING_PIXEL, 0, 0);
        const bgGradient = p.createRadialGradient(
            canvas.width / 2, canvas.height / 2, 0,
            canvas.width / 2, canvas.height / 2, canvas.width
        );
        bgGradient.addColorStop(0, '#FF006E');
        bgGradient.addColorStop(0.3, '#8338EC');
        bgGradient.addColorStop(0.6, '#3A86FF');
        bgGradient.addColorStop(1, '#06FFB4');
        p.fillStyle = bgGradient;
        p.fillRect(0, 0, canvas.width, canvas.height);

        // 디스코볼
        const discoX = canvas.width / 2, discoY = 80;
        p.fillStyle = '#C0C0C0';
        p.fillRect(discoX - 2, 0, 4, 30);
        p.beginPath();
        p.arc(discoX, discoY, 30, 0, Math.PI * 2);
        p.fill();
        for (let i = 0; i < 12; i++) {
            const angle = (Math.PI * 2 / 12) * i + frame * 0.05;
            const brightness = (Math.sin(frame * 0.1 + i) + 1) / 2;
            p.fillStyle = `hsla(${(frame + i * 30) % 360}, 100%, 80%, ${brightness})`;
            p.fillRect(discoX + Math.cos(angle) * 25 - 3, discoY + Math.sin(angle) * 25 - 3, 6, 6);
        }

        // 픽셀 음표 (이모지 대신 직접 그림)
        musicNotes.forEach(note => {
            note.y -= note.speed;
            note.rotation += note.rotationSpeed;
            if (note.y < -note.size) {
                note.y = canvas.height + note.size;
                note.x = Math.random() * canvas.width;
            }
            drawPixelNote(p, note.x, note.y, note.size, note.color, note.rotation);
        });

        // 춤추는 친구들 (동글이)
        friends.forEach((friend, i) => {
            const jumpHeight = Math.abs(Math.sin(frame * friend.jumpSpeed + friend.jumpPhase)) * 60;
            const wiggle = Math.sin(frame * 0.12 + i) * 10;
            const fx = friend.x + wiggle, fy = friend.y - jumpHeight;
            p.fillStyle = friend.color;
            p.beginPath();
            p.arc(fx, fy, friend.size, 0, Math.PI * 2);
            p.fill();
            p.fillStyle = '#FFFFFF';
            p.fillRect(fx - friend.size / 3 - 3, fy - friend.size / 3 - 3, 7, 7);
            p.fillRect(fx + friend.size / 3 - 3, fy - friend.size / 3 - 3, 7, 7);
            p.fillStyle = '#000000';
            p.fillRect(fx - friend.size / 3 - 1, fy - friend.size / 3 - 1, 4, 4);
            p.fillRect(fx + friend.size / 3 - 1, fy - friend.size / 3 - 1, 4, 4);
        });
        p.restore();
        blitEndingPixel(ctx, canvas);

        // ── 원본 해상도: 춤추는 키위 + 댄스 링 ──
        if (kiwiData) {
            const centerX = canvas.width / 2 - 32;
            const centerY = canvas.height - 150 + Math.abs(Math.sin(frame * 0.15)) * -50;
            currentAnimation = (frame % 40 < 20) ? 'walking1' : 'walking3';

            ctx.save();
            ctx.translate(centerX + 32, centerY + 32);
            ctx.rotate(Math.sin(frame * 0.1) * 0.3);
            ctx.translate(-32, -32);
            drawEndingPixelSprite(ctx, kiwiData[currentAnimation], kiwiData.colorMap, 0, 0, 64 / kiwiData.idle[0].length);
            ctx.restore();

            const ringRadius = 100 + Math.sin(frame * 0.08) * 30;
            for (let i = 0; i < 16; i++) {
                const angle = (Math.PI * 2 / 16) * i + frame * 0.15;
                ctx.save();
                ctx.globalAlpha = 0.8;
                ctx.fillStyle = `hsl(${(frame * 2 + i * 22.5) % 360}, 90%, 65%)`;
                ctx.fillRect(centerX + 32 + Math.cos(angle) * ringRadius - 5,
                             centerY + 32 + Math.sin(angle) * (ringRadius * 0.5) - 5, 10, 10);
                ctx.restore();
            }
        }

        if (endingParticleSystem) {
            if (frame % 15 === 0) {
                endingParticleSystem.create(Math.random() * canvas.width, Math.random() * canvas.height, 'confetti', 4);
            }
            if (frame % 8 === 0) {
                endingParticleSystem.create(canvas.width / 2, canvas.height / 2, 'magic', 2);
            }
            endingParticleSystem.update();
            endingParticleSystem.render();
        }

        frame++;
        // 엔딩 화면이 닫히면 루프 종료 (rAF 누수 방지)
        if (document.getElementById('endingScreen')) {
            requestAnimationFrame(draw);
        }
    }

    draw();
}

// 화이트하우스 엔딩 애니메이션 (캐릭터 픽셀 데이터 사용)
function animateWhitehouseEndingScene(ctx, canvas) {
    let frame = 0;
    const alphabetKnights = [];
    const fireworks = [];
    const whitehouseData = getCharacterPixelData('whitehouse');
    let currentAnimation = 'idle';

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
        // ── 저해상 도트 패스: 하늘·구름·성·불꽃놀이 ──
        const p = getEndingPixelCtx(canvas);
        p.save();
        p.setTransform(1 / ENDING_PIXEL, 0, 0, 1 / ENDING_PIXEL, 0, 0);
        const skyGradient = p.createLinearGradient(0, 0, 0, canvas.height);
        skyGradient.addColorStop(0, '#1A237E');
        skyGradient.addColorStop(0.3, '#3949AB');
        skyGradient.addColorStop(0.6, '#7E57C2');
        skyGradient.addColorStop(0.8, '#AB47BC');
        skyGradient.addColorStop(1, '#4CAF50');
        p.fillStyle = skyGradient;
        p.fillRect(0, 0, canvas.width, canvas.height);

        // 마법 구름들
        for (let i = 0; i < 5; i++) {
            const cloudX = (canvas.width / 5) * i + Math.sin(frame * 0.01 + i) * 30;
            const cloudY = 60 + Math.sin(frame * 0.02 + i) * 20;
            p.save();
            p.globalAlpha = 0.7;
            p.fillStyle = '#E8EAF6';
            p.beginPath();
            p.arc(cloudX, cloudY, 40, 0, Math.PI * 2);
            p.arc(cloudX + 30, cloudY, 50, 0, Math.PI * 2);
            p.arc(cloudX - 30, cloudY, 45, 0, Math.PI * 2);
            p.fill();
            p.restore();
        }

        // 영어 성
        drawEnglishCastle(p, canvas, frame);

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
        for (let i = fireworks.length - 1; i >= 0; i--) {
            const fw = fireworks[i];
            if (!fw.exploded) {
                fw.y -= 8;
                p.fillStyle = fw.color;
                p.fillRect(fw.x - 2, fw.y, 4, 30);
                if (fw.y <= fw.targetY) {
                    fw.exploded = true;
                    for (let j = 0; j < 40; j++) {
                        const angle = (Math.PI * 2 / 40) * j;
                        const velocity = Math.random() * 6 + 3;
                        fw.particles.push({
                            x: fw.x, y: fw.y,
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
                fw.particles = fw.particles.filter(pt => {
                    pt.x += pt.vx;
                    pt.y += pt.vy;
                    pt.vy += 0.15;
                    pt.vx *= 0.98;
                    pt.life--;
                    p.globalAlpha = pt.life / 80;
                    p.fillStyle = fw.color;
                    p.fillRect(pt.x - 3, pt.y - 3, 6, 6);
                    p.globalAlpha = 1;
                    return pt.life > 0;
                });
                if (fw.particles.length === 0) fireworks.splice(i, 1);
            }
        }
        p.restore();
        blitEndingPixel(ctx, canvas);

        // ── 원본 해상도: 왕 화이트하우스 + 알파벳 기사단 ──
        if (whitehouseData) {
            const centerX = canvas.width / 2 - 32;
            const centerY = canvas.height - 280 + Math.sin(frame * 0.06) * 8;
            ctx.save();
            ctx.translate(centerX + 32, centerY + 32);
            ctx.scale(1.2, 1.2);
            ctx.translate(-32, -32);
            drawEndingPixelSprite(ctx, whitehouseData[currentAnimation], whitehouseData.colorMap, 0, 0, 80 / whitehouseData.idle[0].length);
            ctx.restore();

            const auraRadius = 120 + Math.sin(frame * 0.05) * 20;
            ctx.save();
            ctx.globalAlpha = 0.3;
            ctx.strokeStyle = '#FFD700';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.arc(centerX + 32, centerY + 32, auraRadius, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }

        // 알파벳 기사단 행진 (방패 + 도트 글자 + 검)
        alphabetKnights.forEach((knight, i) => {
            const marchOffset = Math.sin(frame * 0.08 + knight.marchPhase) * 15;
            const jumpHeight = Math.abs(Math.sin(frame * 0.15 + i * 0.3)) * 25;
            ctx.save();
            ctx.translate(knight.x + marchOffset, knight.y - jumpHeight);
            ctx.fillStyle = knight.color;
            ctx.fillRect(-knight.size, -knight.size / 2, knight.size * 2, knight.size * 1.5);
            ctx.fillStyle = '#C0C0C0';
            ctx.fillRect(-2, -knight.size * 1.5, 4, knight.size);
            ctx.fillStyle = '#FFD700';
            ctx.fillRect(-6, -knight.size * 1.5, 12, 8);
            drawEndingBakedText(ctx, knight.letter, 0, knight.size / 4,
                { fontPx: 12, color: '#FFFFFF', outline: 'rgba(0,0,0,0.6)', shadow: 'rgba(0,0,0,0)', dispScale: 2 });
            ctx.restore();
        });

        if (endingParticleSystem) {
            if (frame % 20 === 0) {
                endingParticleSystem.create(Math.random() * canvas.width, 0, 'confetti', 3);
            }
            endingParticleSystem.update();
            endingParticleSystem.render();
        }

        frame++;
        // 엔딩 화면이 닫히면 루프 종료 (rAF 누수 방지)
        if (document.getElementById('endingScreen')) {
            requestAnimationFrame(draw);
        }
    }

    draw();
}

function drawFlyingAirplaneWithJiyul(ctx, canvas, frame) {
    const planeX = canvas.width / 2 + Math.sin(frame * 0.015) * 150;
    const planeY = 140 + Math.sin(frame * 0.04) * 40;
    const S = 3;   // 픽셀 배율
    const w = ENDING_PLANE.sprite[0].length * S;
    const h = ENDING_PLANE.sprite.length * S;
    const x = planeX - w / 2;
    const y = planeY - h / 2;

    // 그림자 (부드러운 타원 느낌의 납작 사각형)
    ctx.save();
    ctx.globalAlpha = 0.25;
    ctx.fillStyle = '#000000';
    ctx.fillRect(x + 10, y + h + 10, w - 20, 8);
    ctx.restore();

    // 2D 스프라이트 비행기
    drawEndingPixelSprite(ctx, ENDING_PLANE.sprite, ENDING_PLANE.colorMap, x, y, S);

    // 프로펠러 날개 (2프레임 회전) — 상태 누수 방지를 위해 save/restore
    ctx.save();
    const hubX = x + 1 * S;
    const hubY = y + 10 * S;
    ctx.fillStyle = 'rgba(84, 110, 122, 0.9)';
    if (Math.floor(frame / 4) % 2 === 0) {
        ctx.fillRect(hubX - S, hubY - 7 * S, S * 2, S * 14);   // 세로 날
    } else {
        ctx.fillRect(hubX - 2 * S, hubY - S, S * 5, S * 2);    // 가로 날
    }
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
    
    // 이모지 대신 픽셀 도형 파티클 (별/하트/다이아/반짝)
    const particlePatterns = [
        ['..1..', '.111.', '11111', '.111.', '1.1.1'],   // 별
        ['.1.1.', '11111', '11111', '.111.', '..1..'],   // 하트
        ['..1..', '.111.', '11111', '.111.', '..1..'],   // 다이아
        ['..1..', '..1..', '11111', '..1..', '..1..'],   // 반짝
    ];
    function makePixelParticle(pattern, color, px) {
        const c = document.createElement('canvas');
        c.width = pattern[0].length * px;
        c.height = pattern.length * px;
        const cc = c.getContext('2d');
        cc.fillStyle = color;
        pattern.forEach((row, ry) => {
            [...row].forEach((ch, rx) => {
                if (ch === '1') cc.fillRect(rx * px, ry * px, px, px);
            });
        });
        c.style.imageRendering = 'pixelated';
        return c;
    }

    for (let i = 0; i < 60; i++) {
        const pattern = particlePatterns[Math.floor(Math.random() * particlePatterns.length)];
        const color = `hsl(${Math.random() * 360}, 90%, 70%)`;
        const px = Math.floor(Math.random() * 3) + 3;
        const startX = Math.random() * 100;
        const duration = Math.random() * 5 + 4;
        const delay = Math.random() * 8;

        const particle = document.createElement('div');
        particle.appendChild(makePixelParticle(pattern, color, px));
        particle.style.cssText = `
            position: absolute;
            left: ${startX}%;
            top: -60px;
            animation: 
                particleFall ${duration}s linear ${delay}s infinite,
                particleRotate ${duration * 2}s linear ${delay}s infinite,
                particleScale ${duration}s ease-in-out ${delay}s infinite;
            filter: drop-shadow(0 0 10px rgba(255, 255, 255, 0.6));
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
        font-family: 'DungGeunMo', 'Jua', sans-serif;
        text-shadow: 0 0 30px #FFD700;
        z-index: 10004;
        pointer-events: none;
        animation: celebrationBounce 3s ease-out forwards;
    `;
    celebrationText.textContent = '축하합니다!';
    
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
// ═══════════════════════════════════════════════════════
// 히든 엔딩: 퍼펙트 클리어(정답률 100%) 전용 순수 도트 씬
// 전부 캔버스 2D 스프라이트 — DOM 텍스트/이모지 없음
// ═══════════════════════════════════════════════════════
const HIDDEN_TROPHY = [
    'g....gggggg....g',
    'g...gGGGGGGg...g',
    'gg..gGWGGGGg..gg',
    '.g..gGGGGGGg..g.',
    '.gg.gGGGGGGg.gg.',
    '..ggGGGGGGGGgg..',
    '....gGGGGGGg....',
    '.....gGGGGg.....',
    '......gGGg......',
    '......gGGg......',
    '.....gGGGGg.....',
    '....GGGGGGGG....',
    '..dddddddddddd..',
    '..dddddddddddd..'
];
const HIDDEN_TROPHY_COLORS = {
    g: '#B8860B', G: '#FFD700', W: '#FFFFFF', d: '#8B5A2B', _slug: true
};

function showHiddenEnding(onDone) {
    if (typeof gameState !== 'undefined') {
        gameState.running = false;
        gameState.isMoving = false;
    }
    const div = document.createElement('div');
    div.id = 'hiddenEndingScreen';
    div.style.cssText = 'position:fixed;inset:0;z-index:10000;background:#0E1230;overflow:hidden;';
    const cv = document.createElement('canvas');
    cv.style.cssText = 'width:100%;height:100%;display:block;image-rendering:pixelated;touch-action:manipulation;';
    div.appendChild(cv);
    document.body.appendChild(div);
    const g = cv.getContext('2d');

    // 축하 새벽 하늘 밴드 (위 → 아래)
    const BANDS = ['#1B1035', '#3D2560', '#7C3A6E', '#C75B4E', '#E87A3C', '#F5A048', '#FFD84A'];
    const CONFETTI_COLS = ['#FFD700', '#FF7B9C', '#3DDCFF', '#7ED957', '#FFFFFF'];
    let frame = 0, alive = true;

    // 큰 fontPx 래스터 + dispScale 축소로 획을 보존하는 텍스트
    const tCache = new Map();
    function tSprite(text, fontPx, color, outline) {
        const k = text + '@' + fontPx + color;
        if (!tCache.has(k) && typeof createPixelTextCanvas === 'function') {
            tCache.set(k, createPixelTextCanvas(text, {
                fontPx, scale: 1, color, outline, shadow: 'rgba(0,0,0,0.45)'
            }));
        }
        return tCache.get(k) || null;
    }
    function tDraw(text, cx, cy, fontPx, color, outline, targetH, maxW) {
        const tc = tSprite(text, fontPx, color, outline);
        if (!tc) return;
        let s = targetH / tc.height;
        if (tc.width * s > maxW) s = maxW / tc.width;
        const dw = Math.round(tc.width * s), dh = Math.round(tc.height * s);
        g.imageSmoothingEnabled = false;
        g.drawImage(tc, Math.round(cx - dw / 2), Math.round(cy - dh / 2), dw, dh);
    }

    // 스프라이트 베이크 (외곽선+림라이트/셰이드 포함)
    const bakes = new Map();
    function baked(name, pose) {
        const k = name + ':' + pose;
        if (!bakes.has(k)) {
            const d = getCharacterPixelData(name);
            if (!d || !d[pose] || typeof window.bakePixelSprite !== 'function') return null;
            bakes.set(k, window.bakePixelSprite(d[pose], d.colorMap, false));
        }
        return bakes.get(k);
    }
    let trophyBake = null;
    function drawTrophy(cx, bottomY, scale) {
        if (!trophyBake && typeof window.bakePixelSprite === 'function') {
            trophyBake = window.bakePixelSprite(HIDDEN_TROPHY, HIDDEN_TROPHY_COLORS, false);
        }
        if (!trophyBake) return;
        const dw = trophyBake.width * scale, dh = trophyBake.height * scale;
        g.drawImage(trophyBake, Math.round(cx - dw / 2), Math.round(bottomY - dh), dw, dh);
    }

    function draw() {
        if (!alive || !document.getElementById('hiddenEndingScreen')) return;
        frame++;
        const dpr = Math.max(1, Math.min(3, Math.round(window.devicePixelRatio || 1)));
        const cw = Math.round(div.clientWidth * dpr), chh = Math.round(div.clientHeight * dpr);
        if (cv.width !== cw || cv.height !== chh) { cv.width = cw; cv.height = chh; }
        const W = cv.width, H = cv.height;
        const groundY = Math.round(H * 0.8);
        const scale = Math.max(2, Math.floor(Math.min(W / 480, H / 320) * 2.2));

        // 하늘 밴드
        const bandH = Math.ceil(groundY / BANDS.length);
        BANDS.forEach((col, i) => { g.fillStyle = col; g.fillRect(0, i * bandH, W, bandH + 1); });
        // 고정 별 (위쪽 어두운 밴드)
        g.fillStyle = 'rgba(255,255,255,0.7)';
        for (let i = 1; i <= 18; i++) {
            g.fillRect((i * 73856093) % W, (i * 19349663) % Math.round(groundY * 0.4), 2, 2);
        }
        // 지면: 잔디 + 흙 체커
        g.fillStyle = '#3E8E2F';
        g.fillRect(0, groundY, W, scale * 2);
        g.fillStyle = '#5FB53E';
        for (let x = 0; x < W; x += scale * 4) g.fillRect(x, groundY, scale * 2, scale);
        const tile = scale * 8;
        for (let ty = groundY + scale * 2; ty < H + tile; ty += tile) {
            for (let tx = 0; tx < W + tile; tx += tile) {
                g.fillStyle = ((tx / tile | 0) + (ty / tile | 0)) % 2 === 0 ? '#5C3A24' : '#4E3120';
                g.fillRect(tx, ty, tile, tile);
            }
        }

        // 색종이 (결정적 낙하, 상태 저장 없음)
        for (let i = 0; i < 40; i++) {
            const cx2 = ((i * 73856093) % W + Math.round(Math.sin((frame + i * 37) * 0.03) * 6 * scale / 2)) % W;
            const cy2 = (frame * (2 + (i % 3)) + (i * 19349663) % H) % (H + 20) - 10;
            g.fillStyle = CONFETTI_COLS[i % CONFETTI_COLS.length];
            const cs = (i % 2 === 0 ? 2 : 3) * Math.max(1, Math.round(scale / 2));
            g.fillRect(Math.round(cx2), Math.round(cy2), cs, cs);
        }

        // 트로피 (중앙, 은은한 빛 점)
        const trophyScale = scale;
        drawTrophy(W / 2, groundY, trophyScale);
        g.fillStyle = 'rgba(255,215,0,0.85)';
        for (let a = 0; a < 6; a++) {
            const ang = (frame * 0.02) + a * Math.PI / 3;
            const rr = 14 * trophyScale;
            g.fillRect(Math.round(W / 2 + Math.cos(ang) * rr), Math.round(groundY - 7 * trophyScale + Math.sin(ang) * rr * 0.5), scale, scale);
        }

        // 캐릭터 3인: 크림(점프 환호) + 키위 + 화이트하우스
        const hop = Math.abs(Math.sin(frame * 0.08)) * 5 * scale;
        const trio = [
            { name: 'jiyul', pose: hop > 3 * scale ? 'jump' : 'idle', dx: -24, hop },
            { name: 'kiwi', pose: Math.floor(frame / 10) % 2 ? 'walking1' : 'idle', dx: -42, hop: 0 },
            { name: 'whitehouse', pose: 'idle', dx: 26, hop: 0 }
        ];
        trio.forEach(t => {
            const b = baked(t.name, t.pose) || baked(t.name, 'idle');
            if (!b) return;
            const s = (16 * scale) / (b.height - 2);
            const dw = Math.round(b.width * s), dh = Math.round(b.height * s);
            const x = Math.round(W / 2 + t.dx * scale - dw / 2);
            const y = Math.round(groundY - dh - t.hop + Math.floor(scale / 2));
            g.imageSmoothingEnabled = false;
            g.drawImage(b, x, y, dw, dh);
        });

        // 텍스트
        tDraw('HIDDEN ENDING', W / 2, H * 0.12, 24, '#FF7A1A', '#100C08', Math.round(9 * scale), W * 0.85);
        tDraw('퍼펙트 클리어!', W / 2, H * 0.24, 40, '#FFD700', '#100C08', Math.round(16 * scale), W * 0.9);
        tDraw('정답률 100%! 크림이는 진짜 영어 천재!', W / 2, H * 0.36, 28, '#FFFFFF', '#100C08', Math.round(8 * scale), W * 0.9);
        if (Math.floor(frame / 30) % 2 === 0) {
            tDraw('화면을 터치하면 계속', W / 2, H * 0.62, 24, '#3DDCFF', '#100C08', Math.round(7 * scale), W * 0.8);
        }

        requestAnimationFrame(draw);
    }

    function finish() {
        if (!alive) return;
        alive = false;
        div.remove();
        if (typeof onDone === 'function') onDone();
    }
    div.addEventListener('click', finish);
    div.addEventListener('touchend', function(e) { e.preventDefault(); finish(); }, { passive: false });

    draw();
}

window.showHiddenEnding = showHiddenEnding;
window.showEnding = showEnding;

console.log('최종 개선된 엔딩 시스템 로드 완료! 자동 스크롤 + 사용자 친화적 토글 버튼');