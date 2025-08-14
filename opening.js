// 오프닝 시퀀스 클래스
class OpeningSequence {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.scene = 0;
        this.frame = 0;
        this.isPlaying = true;
        this.onComplete = null;
        
        // 캐릭터 위치
        this.jiyul = { x: 200, y: 200 };
        this.kiwi = { x: 300, y: 220 };
        this.whitehouse = { x: 400, y: 200 };
        
        // UFO와 알파벳 몬스터들
        this.ufo = { x: -200, y: 50 };
        this.alphabetMonsters = [];
        
        // 대화 텍스트
        this.dialogues = [
            { scene: 1, text: "평화로운 어느 날...", duration: 120 },
            { scene: 2, text: "잉글리쉬 행성에서 UFO가 나타났다!", duration: 150 },
            { scene: 3, text: "\"지구의 아이들아! 영어 단어를 모르면 지구는 우리 것이다!\"", duration: 180 },
            { scene: 4, text: "지율: \"안돼! 우리가 지구를 지킬거야!\"", duration: 150 },
            { scene: 5, text: "키위: \"키위키위! 함께 싸우자!\"", duration: 150 },
            { scene: 6, text: "화이트하우스: \"우리 모두 영어 공부하고 무찌르자!\"", duration: 150 },
            { scene: 7, text: "모두: \"영어 모험을 시작하자!\"", duration: 120 }
        ];
        
        this.currentDialogue = 0;
        this.textTimer = 0;
        
        // 별 배경
        this.stars = [];
        for (let i = 0; i < 50; i++) {
            this.stars.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                size: Math.random() * 2 + 1,
                twinkle: Math.random() * Math.PI * 2
            });
        }
        
        // Skip 버튼
        this.skipButton = {
            x: canvas.width - 100,
            y: 30,
            width: 80,
            height: 30,
            text: "SKIP →"
        };
    }
    
    // 픽셀 스프라이트 그리기
    drawPixelSprite(sprite, colorMap, x, y, scale = 3) {
        for (let row = 0; row < sprite.length; row++) {
            for (let col = 0; col < sprite[row].length; col++) {
                const pixel = sprite[row][col];
                if (pixel !== 0 && colorMap[pixel]) {
                    this.ctx.fillStyle = colorMap[pixel];
                    this.ctx.fillRect(x + col * scale, y + row * scale, scale, scale);
                }
            }
        }
    }
    
    // 씬 업데이트
    update() {
        if (!this.isPlaying) return;
        
        this.frame++;
        this.textTimer++;
        
        // 대화 진행
        if (this.currentDialogue < this.dialogues.length) {
            const dialogue = this.dialogues[this.currentDialogue];
            if (this.textTimer >= dialogue.duration) {
                this.currentDialogue++;
                this.textTimer = 0;
                this.scene = this.currentDialogue + 1;
            }
        } else {
            // 오프닝 완료
            this.complete();
        }
        
        // 씬별 애니메이션
        this.updateSceneAnimation();
    }
    
    // 씬별 애니메이션 업데이트
    updateSceneAnimation() {
        switch(this.scene) {
            case 2: // UFO 등장
            case 3:
                if (this.ufo.x < this.canvas.width / 2 - 50) {
                    this.ufo.x += 5;
                }
                this.ufo.y = 50 + Math.sin(this.frame * 0.05) * 20;
                break;
                
            case 4: // 지율이 점프
                this.jiyul.y = 200 + Math.abs(Math.sin(this.frame * 0.1)) * -30;
                break;
                
            case 5: // 키위 점프
                this.kiwi.y = 220 + Math.abs(Math.sin(this.frame * 0.1 + 1)) * -25;
                break;
                
            case 6: // 화이트하우스 흔들기
                this.whitehouse.x = 400 + Math.sin(this.frame * 0.2) * 5;
                break;
                
            case 7: // 모두 점프
                this.jiyul.y = 200 + Math.abs(Math.sin(this.frame * 0.15)) * -40;
                this.kiwi.y = 220 + Math.abs(Math.sin(this.frame * 0.15 + 0.5)) * -35;
                this.whitehouse.y = 200 + Math.abs(Math.sin(this.frame * 0.15 + 1)) * -40;
                break;
        }
    }
    
    // 렌더링
    render() {
        // 배경 그리기
        this.drawBackground();
        
        // 씬 그리기
        this.drawScene();
        
        // 대화 텍스트
        this.drawDialogue();
        
        // Skip 버튼
        this.drawSkipButton();
    }
    
    // 배경 그리기
    drawBackground() {
        // 그라데이션 하늘
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        if (this.scene <= 1) {
            // 평화로운 낮
            gradient.addColorStop(0, '#87CEEB');
            gradient.addColorStop(1, '#98D8E8');
        } else if (this.scene <= 3) {
            // 위기의 순간
            gradient.addColorStop(0, '#4B0082');
            gradient.addColorStop(1, '#8B008B');
        } else {
            // 희망찬 분위기
            gradient.addColorStop(0, '#FF69B4');
            gradient.addColorStop(1, '#FFB6C1');
        }
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 별 그리기 (밤 씬)
        if (this.scene >= 2 && this.scene <= 3) {
            this.drawStars();
        }
        
        // 땅
        this.ctx.fillStyle = '#228B22';
        this.ctx.fillRect(0, this.canvas.height - 100, this.canvas.width, 100);
        
        // 꽃밭 (평화로운 씬)
        if (this.scene <= 1 || this.scene >= 6) {
            this.drawFlowers();
        }
    }
    
    // 별 그리기
    drawStars() {
        this.stars.forEach(star => {
            const twinkle = Math.sin(star.twinkle + this.frame * 0.05) * 0.5 + 0.5;
            this.ctx.fillStyle = `rgba(255, 255, 255, ${twinkle})`;
            this.ctx.beginPath();
            this.ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            this.ctx.fill();
        });
    }
    
    // 꽃 그리기
    drawFlowers() {
        const colors = ['#FF69B4', '#FFD700', '#FF6347', '#DDA0DD'];
        for (let i = 0; i < 20; i++) {
            const x = i * 50 + 20;
            const y = this.canvas.height - 80;
            
            // 줄기
            this.ctx.strokeStyle = '#228B22';
            this.ctx.lineWidth = 3;
            this.ctx.beginPath();
            this.ctx.moveTo(x, y + 20);
            this.ctx.lineTo(x, y);
            this.ctx.stroke();
            
            // 꽃
            this.ctx.fillStyle = colors[i % colors.length];
            this.ctx.beginPath();
            this.ctx.arc(x, y, 8, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }
    
    // 씬 그리기
    drawScene() {
        // 캐릭터들 그리기
        if (typeof characterPixelData !== 'undefined') {
            // 지율이
            if (characterPixelData.jiyul) {
                this.drawPixelSprite(
                    characterPixelData.jiyul.idle,
                    characterPixelData.jiyul.colorMap,
                    this.jiyul.x,
                    this.jiyul.y,
                    4
                );
            }
            
            // 키위
            if (characterPixelData.kiwi) {
                this.drawPixelSprite(
                    characterPixelData.kiwi.idle,
                    characterPixelData.kiwi.colorMap,
                    this.kiwi.x,
                    this.kiwi.y,
                    4
                );
            }
            
            // 화이트하우스
            if (characterPixelData.whitehouse) {
                this.drawPixelSprite(
                    characterPixelData.whitehouse.idle,
                    characterPixelData.whitehouse.colorMap,
                    this.whitehouse.x,
                    this.whitehouse.y,
                    4
                );
            }
        }
        
        // UFO와 알파벳 몬스터 (씬 2-3)
        if (this.scene >= 2 && this.scene <= 3) {
            this.drawUFO();
            this.drawAlphabetInvasion();
        }
        
        // 씬별 특수 효과
        this.drawSceneEffects();
    }
    
    // UFO 그리기
    drawUFO() {
        const x = this.ufo.x;
        const y = this.ufo.y;
        
        // UFO 본체
        this.ctx.fillStyle = '#C0C0C0';
        this.ctx.beginPath();
        this.ctx.ellipse(x + 50, y + 30, 60, 25, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        // UFO 돔
        this.ctx.fillStyle = '#87CEEB';
        this.ctx.beginPath();
        this.ctx.arc(x + 50, y + 20, 30, Math.PI, 0);
        this.ctx.fill();
        
        // UFO 빛
        const lightColors = ['#FFFF00', '#FFD700', '#FFA500'];
        for (let i = 0; i < 6; i++) {
            const lightX = x + 20 + i * 10;
            const lightY = y + 35;
            this.ctx.fillStyle = lightColors[i % 3];
            this.ctx.beginPath();
            this.ctx.arc(lightX, lightY, 3, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        // 빔
        if (this.scene === 3) {
            const beamGradient = this.ctx.createLinearGradient(x + 50, y + 40, x + 50, this.canvas.height - 100);
            beamGradient.addColorStop(0, 'rgba(124, 252, 0, 0.8)');
            beamGradient.addColorStop(1, 'rgba(124, 252, 0, 0)');
            
            this.ctx.fillStyle = beamGradient;
            this.ctx.beginPath();
            this.ctx.moveTo(x + 30, y + 40);
            this.ctx.lineTo(x + 70, y + 40);
            this.ctx.lineTo(x + 100, this.canvas.height - 100);
            this.ctx.lineTo(x, this.canvas.height - 100);
            this.ctx.closePath();
            this.ctx.fill();
        }
    }
    
    // 알파벳 침략 효과
    drawAlphabetInvasion() {
        if (this.scene === 3) {
            const alphabets = ['A', 'B', 'C', 'X', 'Y', 'Z'];
            const colors = ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF'];
            
            // 텍스트 렌더링을 위해 스무딩 활성화
            this.ctx.save();
            this.ctx.imageSmoothingEnabled = true;
            
            alphabets.forEach((letter, i) => {
                const x = this.ufo.x + 50 + Math.sin(this.frame * 0.1 + i) * 80;
                const y = this.ufo.y + 80 + i * 20 + Math.sin(this.frame * 0.15 + i) * 10;
                
                // 알파벳 그림자
                this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
                this.ctx.font = 'bold 24px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                this.ctx.fillText(letter, x + 2, y + 2);
                
                // 알파벳
                this.ctx.fillStyle = colors[i];
                this.ctx.font = 'bold 24px Arial';
                this.ctx.fillText(letter, x, y);
                
                // 반짝임 효과
                if (Math.random() < 0.1) {
                    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
                    this.ctx.beginPath();
                    this.ctx.arc(x + 10, y - 10, 3, 0, Math.PI * 2);
                    this.ctx.fill();
                }
            });
            
            this.ctx.restore();
        }
    }
    
    // 씬별 특수 효과
    drawSceneEffects() {
        switch(this.scene) {
            case 1: // 평화로운 씬 - 나비
                this.drawButterflies();
                break;
                
            case 4:
            case 5:
            case 6:
            case 7: // 결의 씬 - 용기의 오라
                this.drawCourageAura();
                break;
        }
    }
    
    // 나비 그리기
    drawButterflies() {
        for (let i = 0; i < 3; i++) {
            const x = 100 + i * 150 + Math.sin(this.frame * 0.05 + i) * 30;
            const y = 150 + Math.cos(this.frame * 0.05 + i) * 20;
            
            // 나비 날개
            this.ctx.fillStyle = ['#FF69B4', '#FFD700', '#87CEEB'][i];
            
            // 왼쪽 날개
            this.ctx.beginPath();
            this.ctx.ellipse(x - 8, y, 8, 5, -0.3, 0, Math.PI * 2);
            this.ctx.fill();
            
            // 오른쪽 날개
            this.ctx.beginPath();
            this.ctx.ellipse(x + 8, y, 8, 5, 0.3, 0, Math.PI * 2);
            this.ctx.fill();
            
            // 몸통
            this.ctx.fillStyle = '#000000';
            this.ctx.fillRect(x - 2, y - 8, 4, 16);
        }
    }
    
    // 용기의 오라
    drawCourageAura() {
        const characters = [this.jiyul, this.kiwi, this.whitehouse];
        
        characters.forEach((char, i) => {
            if (this.scene === 4 && i !== 0) return;
            if (this.scene === 5 && i !== 1) return;
            if (this.scene === 6 && i !== 2) return;
            
            const colors = ['#FFD700', '#FF69B4', '#87CEEB'];
            const alpha = (Math.sin(this.frame * 0.1) + 1) * 0.25;
            
            this.ctx.fillStyle = colors[i] + Math.floor(alpha * 255).toString(16).padStart(2, '0');
            this.ctx.beginPath();
            this.ctx.arc(char.x + 32, char.y + 32, 40 + Math.sin(this.frame * 0.1) * 5, 0, Math.PI * 2);
            this.ctx.fill();
        });
    }
    
    // 대화 텍스트 그리기
    drawDialogue() {
        if (this.currentDialogue < this.dialogues.length) {
            const dialogue = this.dialogues[this.currentDialogue];
            
            // 대화 박스 영역 완전히 클리어
            this.ctx.clearRect(50, this.canvas.height - 150, this.canvas.width - 100, 100);
            
            // 대화 박스
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
            this.ctx.fillRect(50, this.canvas.height - 150, this.canvas.width - 100, 100);
            
            // 대화 박스 테두리
            this.ctx.strokeStyle = '#FFD700';
            this.ctx.lineWidth = 3;
            this.ctx.strokeRect(50, this.canvas.height - 150, this.canvas.width - 100, 100);
            
            // 텍스트 렌더링 설정 초기화
            this.ctx.save();
            this.ctx.imageSmoothingEnabled = true;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            
            // 타이핑 효과
            const progress = Math.min(this.textTimer / 30, 1);
            const displayText = dialogue.text.substring(0, Math.floor(dialogue.text.length * progress));
            
            // 텍스트 (한 번만 그리기)
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.font = 'bold 20px Jua, sans-serif';
            this.ctx.fillText(displayText, this.canvas.width / 2, this.canvas.height - 90);
            
            // 다음 표시
            if (progress >= 1 && Math.sin(this.frame * 0.1) > 0) {
                this.ctx.fillStyle = '#FFD700';
                this.ctx.font = 'bold 16px Arial';
                this.ctx.textAlign = 'right';
                this.ctx.fillText('▶', this.canvas.width - 70, this.canvas.height - 60);
            }
            
            // 설정 복원
            this.ctx.restore();
        }
    }
    
    // Skip 버튼 그리기
    drawSkipButton() {
        // 버튼 배경
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        this.ctx.fillRect(this.skipButton.x, this.skipButton.y, this.skipButton.width, this.skipButton.height);
        
        // 버튼 테두리
        this.ctx.strokeStyle = '#FFFFFF';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(this.skipButton.x, this.skipButton.y, this.skipButton.width, this.skipButton.height);
        
        // 텍스트 렌더링을 위해 스무딩 활성화
        this.ctx.save();
        this.ctx.imageSmoothingEnabled = true;
        
        // 텍스트
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = 'bold 14px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(this.skipButton.text, this.skipButton.x + this.skipButton.width / 2, this.skipButton.y + this.skipButton.height / 2);
        
        // 원래 설정으로 복원
        this.ctx.restore();
    }
    
    // 마우스/터치 이벤트 처리
    handleClick(x, y) {
        // Skip 버튼 클릭 체크
        if (x >= this.skipButton.x && x <= this.skipButton.x + this.skipButton.width &&
            y >= this.skipButton.y && y <= this.skipButton.y + this.skipButton.height) {
            this.skip();
        } else {
            // 대화 스킵
            if (this.textTimer > 30) {
                this.textTimer = this.dialogues[this.currentDialogue]?.duration || 0;
            }
        }
    }
    
    // 스킵
    skip() {
        this.complete();
    }
    
    // 완료
    complete() {
        this.isPlaying = false;
        if (this.onComplete) {
            this.onComplete();
        }
    }
    
    // 실행
    run() {
        if (!this.isPlaying) return;
        
        this.update();
        this.render();
        
        requestAnimationFrame(() => this.run());
    }
}

// 오프닝 시작 함수
function startOpening(canvas, ctx, onComplete) {
    const opening = new OpeningSequence(canvas, ctx);
    opening.onComplete = onComplete;
    
    // 클릭 이벤트 리스너
    const clickHandler = (e) => {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        opening.handleClick(x, y);
        
        if (!opening.isPlaying) {
            canvas.removeEventListener('click', clickHandler);
            canvas.removeEventListener('touchend', touchHandler);
        }
    };
    
    // 터치 이벤트 리스너
    const touchHandler = (e) => {
        const rect = canvas.getBoundingClientRect();
        const touch = e.changedTouches[0];
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;
        opening.handleClick(x, y);
        
        if (!opening.isPlaying) {
            canvas.removeEventListener('click', clickHandler);
            canvas.removeEventListener('touchend', touchHandler);
        }
    };
    
    canvas.addEventListener('click', clickHandler);
    canvas.addEventListener('touchend', touchHandler);
    
    opening.run();
    
    return opening;
}

// 전역 함수로 등록
window.startOpening = startOpening;