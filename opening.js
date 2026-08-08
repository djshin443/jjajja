// HTML 스타일 타이틀 화면 표시 함수
function showTitleScreen() {
    // 기존 타이틀 화면 제거
    const existingTitle = document.getElementById('titleScreen');
    if (existingTitle) {
        existingTitle.remove();
    }

    // 모바일 뷰포트 메타 태그 설정 (검정 공백 방지)
    let viewportMeta = document.querySelector('meta[name="viewport"]');
    const originalViewportContent = viewportMeta ? viewportMeta.content : '';

    if (!viewportMeta) {
        viewportMeta = document.createElement('meta');
        viewportMeta.name = 'viewport';
        document.head.appendChild(viewportMeta);
    }

    viewportMeta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover';

    // 원래 viewport 설정 저장
    window._originalViewport = originalViewportContent;

    // 실제 화면 높이를 CSS 변수로 설정 (모바일 브라우저의 주소창 고려)
    const setAppHeight = () => {
        const vh = window.innerHeight;
        document.documentElement.style.setProperty('--app-height', `${vh}px`);
    };

    const orientationChangeHandler = () => {
        setTimeout(setAppHeight, 100);
    };

    setAppHeight();
    window.addEventListener('resize', setAppHeight);
    window.addEventListener('orientationchange', orientationChangeHandler);

    // 타이틀 종료 시 이벤트 리스너 제거를 위한 함수 저장
    window._titleScreenCleanup = () => {
        window.removeEventListener('resize', setAppHeight);
        window.removeEventListener('orientationchange', orientationChangeHandler);
        delete window._titleScreenCleanup;
    };
    
    // 화면 방향 및 크기 체크
    const isPortrait = window.innerHeight > window.innerWidth;
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
                     (navigator.maxTouchPoints > 0) || window.innerWidth <= 768;
    const isMobilePortrait = isPortrait && isMobile;

    // gameContainer에 menu-mode 클래스 추가 (타이틀 화면은 메뉴 모드)
    const gameContainer = document.getElementById('gameContainer');
    if (gameContainer) {
        gameContainer.classList.add('menu-mode');
    }

    // 타이틀 화면 컨테이너 생성
    const titleScreen = document.createElement('div');
    titleScreen.id = 'titleScreen';
    titleScreen.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        width: 100vw;
        height: 100vh;
        min-height: 100vh;
        min-height: -webkit-fill-available;
        max-height: 100vh;
        max-height: -webkit-fill-available;
        background: linear-gradient(135deg, #FFB6C1, #87CEEB, #DDA0DD);
        z-index: 10000;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        font-family: 'Jua', sans-serif;
        overflow: hidden;
        animation: backgroundShimmer 3s ease-in-out infinite alternate;
        padding: 0;
        margin: 0;
        box-sizing: border-box;
    `;

    // CSS 애니메이션 추가
    if (!document.getElementById('titleScreenStyles')) {
        const style = document.createElement('style');
        style.id = 'titleScreenStyles';
        style.textContent = `
		    /* body, html 여백 제거 */
			html, body {
				margin: 0 !important;
				padding: 0 !important;
				overflow: hidden !important;
				width: 100% !important;
				height: 100% !important;
			}
    
    /* 타이틀 화면 전체 채우기 */
    #titleScreen {
        position: fixed !important;
        top: 0 !important;
            /* 타이틀 화면 전체 채우기 - html/body는 건드리지 않음 */
            #titleScreen {
                position: fixed !important;
                top: 0 !important;
                left: 0 !important;
                right: 0 !important;
                bottom: 0 !important;
                width: 100vw !important;
                height: 100vh !important;
                min-height: 100vh !important;
                min-height: -webkit-fill-available !important;
                max-height: 100vh !important;
                max-height: -webkit-fill-available !important;
                margin: 0 !important;
                padding: 0 !important;
                box-sizing: border-box !important;
            }

            @supports (-webkit-touch-callout: none) {
                /* iOS Safari 전용 스타일 - 주소창 고려 */
                #titleScreen {
                    height: -webkit-fill-available !important;
                    min-height: -webkit-fill-available !important;
                    max-height: -webkit-fill-available !important;
                }
            }

            @keyframes backgroundShimmer {
                0% { background: linear-gradient(135deg, #FFB6C1, #87CEEB, #DDA0DD); }
                50% { background: linear-gradient(135deg, #87CEEB, #DDA0DD, #FFB6C1); }
                100% { background: linear-gradient(135deg, #DDA0DD, #FFB6C1, #87CEEB); }
            }
            
            @keyframes titleBounce {
                0%, 20%, 50%, 80%, 100% { transform: translateY(0) scale(1) rotate(0deg); }
                40% { transform: translateY(-30px) scale(1.1) rotate(-2deg); }
                60% { transform: translateY(-15px) scale(1.05) rotate(2deg); }
            }
            
            @keyframes sparkle {
                0% { opacity: 0; transform: scale(0) rotate(0deg); }
                50% { opacity: 1; transform: scale(1.5) rotate(180deg); }
                100% { opacity: 0; transform: scale(0) rotate(360deg); }
            }
            
            @keyframes float {
                0%, 100% { transform: translateY(0px) translateX(0px) rotate(0deg); }
                25% { transform: translateY(-15px) translateX(5px) rotate(5deg); }
                50% { transform: translateY(-10px) translateX(-5px) rotate(-5deg); }
                75% { transform: translateY(-5px) translateX(3px) rotate(3deg); }
            }
            
            @keyframes buttonGlow {
                0% { box-shadow: 0 5px 20px rgba(255, 105, 180, 0.3), 0 0 30px rgba(255, 105, 180, 0.2); }
                50% { box-shadow: 0 8px 40px rgba(255, 105, 180, 0.6), 0 0 50px rgba(255, 105, 180, 0.4); }
                100% { box-shadow: 0 5px 20px rgba(255, 105, 180, 0.3), 0 0 30px rgba(255, 105, 180, 0.2); }
            }
            
            @keyframes pixelMove {
                0%, 100% { transform: translateX(0); }
                50% { transform: translateX(10px); }
            }
            
            @keyframes coinRotate {
                0% { transform: rotateY(0deg); }
                100% { transform: rotateY(360deg); }
            }
            
            @keyframes pulse {
                0%, 100% { transform: scale(1); opacity: 1; }
                50% { transform: scale(1.2); opacity: 0.8; }
            }
            
            @keyframes fall {
                0% {
                    transform: translateY(0);
                }
                100% {
                    transform: translateY(calc(100vh + 100px));
                    /* 모바일에서도 작동하도록 대체값 설정 */
                    transform: translateY(calc(var(--app-height, 100vh) + 100px));
                }
            }
            
            @keyframes flashFade {
                from { opacity: 1; }
                to { opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }
    
    // 반짝이는 별들 배경 - 화면 가득
    const starCount = isMobilePortrait ? 20 : 30;
    for (let i = 0; i < starCount; i++) {
        const star = document.createElement('div');
        star.innerHTML = '✨';
        star.style.cssText = `
            position: absolute;
            font-size: ${Math.random() * 20 + 15}px;
            left: ${Math.random() * 100}%;
            top: ${Math.random() * 100}%;
            animation: sparkle ${2 + Math.random() * 3}s infinite;
            animation-delay: ${Math.random() * 2}s;
            pointer-events: none;
            opacity: ${0.6 + Math.random() * 0.4};
        `;
        titleScreen.appendChild(star);
    }

    // 하트 이모지들 - 화면 가득
    const heartCount = isMobilePortrait ? 10 : 15;
    for (let i = 0; i < heartCount; i++) {
        const heart = document.createElement('div');
        heart.innerHTML = '💖';
        heart.style.cssText = `
            position: absolute;
            font-size: ${Math.random() * 15 + 20}px;
            left: ${Math.random() * 100}%;
            top: ${Math.random() * 100}%;
            animation: float ${3 + Math.random() * 2}s ease-in-out infinite;
            animation-delay: ${Math.random() * 2}s;
            pointer-events: none;
            opacity: ${0.5 + Math.random() * 0.5};
        `;
        titleScreen.appendChild(heart);
    }

    // 게임 코인들 - 화면 가득
    const coinCount = isMobilePortrait ? 12 : 20;
    for (let i = 0; i < coinCount; i++) {
        const coin = document.createElement('div');
        coin.innerHTML = '🪙';
        const randomLeft = Math.random() * 100;
        coin.style.cssText = `
            position: absolute;
            font-size: ${Math.random() * 20 + 20}px;
            left: ${randomLeft}%;
            top: -50px;
            animation: fall ${5 + Math.random() * 5}s linear infinite, coinRotate 2s linear infinite;
            animation-delay: ${Math.random() * 5}s;
            pointer-events: none;
            z-index: 3;
            opacity: ${0.7 + Math.random() * 0.3};
        `;
        titleScreen.appendChild(coin);
    }
    
    
    // 컨텐츠를 담을 중앙 컨테이너 - 완전 풀스크린
    const contentContainer = document.createElement('div');
    const isLandscape = window.innerWidth > window.innerHeight;
    contentContainer.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        text-align: center;
        padding: env(safe-area-inset-top, 0) env(safe-area-inset-right, 0) env(safe-area-inset-bottom, 0) env(safe-area-inset-left, 0);
        box-sizing: border-box;
        z-index: 5;
    `;
    
    // 메인 타이틀 컨테이너
    const mainTitle = document.createElement('div');
    mainTitle.style.cssText = `
        text-align: center;
        margin-bottom: ${isMobilePortrait ? '20px' : '40px'};
        animation: titleBounce 2s ease-in-out infinite;
        width: 100%;
        padding: 0 10px;
    `;
    
    // 게임 제목 (반응형 폰트 크기)
    const title = document.createElement('h1');
    title.innerHTML = '🚀 지율이의 잉글리쉬 어드벤쳐 🚀';

    // 뷰포트 단위 사용하여 반응형 폰트 크기 설정
    const titleFontSize = isMobilePortrait ?
        'min(7vw, 28px)' :
        (isMobile ? '2.2em' : '3em');

    title.style.cssText = `
        font-size: ${titleFontSize};
        color: #FF69B4;
        text-shadow:
            2px 2px 0px #FFD700,
            3px 3px 0px rgba(255,105,180,0.5),
            4px 4px 10px rgba(0,0,0,0.3);
        margin: 0;
        font-weight: bold;
        text-align: center;
        line-height: 1.3;
        word-break: keep-all;
        white-space: normal;
    `;

    // 부제목 (반응형 폰트 크기)
    const subtitle = document.createElement('h2');
    subtitle.innerHTML = '👽 ABC 대마왕의 지구 침공! 👾';

    const subtitleFontSize = isMobilePortrait ?
        'min(5vw, 22px)' :
        (isMobile ? '1.5em' : '2em');

    subtitle.style.cssText = `
        font-size: ${subtitleFontSize};
        color: #FFD700;
        text-shadow: 2px 2px 0px #FF69B4,
                     3px 3px 0px rgba(255,215,0,0.5),
                     4px 4px 8px rgba(0,0,0,0.3);
        margin: ${isMobilePortrait ? '10px 0 15px 0' : '20px 0 25px 0'};
        font-weight: bold;
        animation: float 2.5s ease-in-out infinite;
    `;
    
    mainTitle.appendChild(title);
    mainTitle.appendChild(subtitle);

    // 시작 버튼 (반응형 크기)
    const startButton = document.createElement('button');
    startButton.innerHTML = '⚔️ 지구를 지켜라! ⚔️';
    
    const buttonFontSize = isMobilePortrait ? 
        'min(5vw, 20px)' : 
        (isMobile ? '1.5em' : '2em');
    
    const buttonPadding = isMobilePortrait ? 
        '15px 25px' : 
        '20px 40px';
    
    startButton.style.cssText = `
        background: linear-gradient(135deg, #FF69B4, #FFB6C1);
        border: 4px solid #FFFFFF;
        color: white;
        font-size: ${buttonFontSize};
        font-weight: bold;
        font-family: 'Jua', sans-serif;
        padding: ${buttonPadding};
        border-radius: 50px;
        cursor: pointer;
        text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        transition: all 0.3s ease;
        animation: buttonGlow 2s ease-in-out infinite;
        margin-top: ${isMobilePortrait ? '20px' : '30px'};
        box-shadow: 0 10px 25px rgba(255, 105, 180, 0.4);
        white-space: nowrap;
    `;
    
    startButton.onmouseover = () => {
        startButton.style.transform = 'scale(1.1)';
        startButton.style.background = 'linear-gradient(135deg, #FF1493, #FF69B4)';
    };
    
    startButton.onmouseout = () => {
        startButton.style.transform = 'scale(1)';
        startButton.style.background = 'linear-gradient(135deg, #FF69B4, #FFB6C1)';
    };
    
    startButton.onclick = () => {
        // 중복 클릭 방지
        if (startButton.disabled) return;
        startButton.disabled = true;

        // 전체화면 진입 시도
        const elem = document.documentElement;
        if (elem.requestFullscreen) {
            elem.requestFullscreen().catch(() => {});
        } else if (elem.webkitRequestFullscreen) {
            elem.webkitRequestFullscreen();
        } else if (elem.mozRequestFullScreen) {
            elem.mozRequestFullScreen();
        } else if (elem.msRequestFullscreen) {
            elem.msRequestFullscreen();
        }

        // 화면 방향 잠금 시도 (가로 모드)
        if (screen.orientation && screen.orientation.lock) {
            screen.orientation.lock('landscape').catch(() => {});
        }

        // 화면 전체 폭죽 효과 (모바일에서는 개수 줄이기)
        const fireworkCount = isMobilePortrait ? 15 : 30;
        const fireworkElements = [];

        for (let i = 0; i < fireworkCount; i++) {
            setTimeout(() => {
                const firework = document.createElement('div');
                const colors = ['✨', '🌟', '💫', '⭐', '🎆'];
                firework.innerHTML = colors[Math.floor(Math.random() * colors.length)];
                firework.style.cssText = `
                    position: absolute;
                    font-size: ${Math.random() * 30 + 20}px;
                    left: ${Math.random() * window.innerWidth}px;
                    top: ${Math.random() * window.innerHeight}px;
                    animation: sparkle 1s ease-out forwards;
                    pointer-events: none;
                    z-index: 10002;
                `;
                titleScreen.appendChild(firework);
                fireworkElements.push(firework);
                setTimeout(() => firework.remove(), 1000);
            }, i * 50);
        }
        
        // 화면 플래시 효과
        const flash = document.createElement('div');
        flash.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            width: 100%;
            height: 100%;
            background: radial-gradient(circle, rgba(255,255,255,0.8), transparent);
            z-index: 10001;
            animation: flashFade 0.5s ease-out forwards;
            pointer-events: none;
        `;
        titleScreen.appendChild(flash);
        setTimeout(() => flash.remove(), 500);
        
        // 타이틀 화면 회전하며 사라지기
        titleScreen.style.transition = 'all 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
        titleScreen.style.transform = 'scale(0) rotate(720deg)';
        titleScreen.style.opacity = '0';
        
        setTimeout(() => {
            // gameContainer의 menu-mode 클래스 제거 (게임 모드로 전환)
            const gameContainer = document.getElementById('gameContainer');
            if (gameContainer) {
                gameContainer.classList.remove('menu-mode');
            }

            // 타이틀 화면 이벤트 리스너 정리
            if (window._titleScreenCleanup) {
                window._titleScreenCleanup();
            }

            // 타이틀 화면 스타일 태그 제거
            const styleTag = document.getElementById('titleScreenStyles');
            if (styleTag) styleTag.remove();

            // 타이틀 화면 요소 제거
            titleScreen.remove();

            // 원래 viewport 복원
            const viewportMeta = document.querySelector('meta[name="viewport"]');
            if (viewportMeta && window._originalViewport) {
                viewportMeta.content = window._originalViewport;
            }

            // 캔버스 크기 재조정 후 오프닝 시작
            setTimeout(() => {
                if (typeof resizeCanvas === 'function') {
                    resizeCanvas();
                }
                startOpeningSequence();
            }, 100);
        }, 800);
    };
    
    // 작은 도움말 텍스트 (반응형 폰트)
    const helpText = document.createElement('div');
    helpText.innerHTML = '💥 지율이와 함께 ABC 대마왕을 물리치자! 💥';
    
    const helpFontSize = isMobilePortrait ? 
        'min(3.5vw, 14px)' : 
        '1.1em';
    
    helpText.style.cssText = `
        font-size: ${helpFontSize};
        color: #8B008B;
        text-shadow: 1px 1px 2px rgba(255,255,255,0.8);
        margin-top: ${isMobilePortrait ? '15px' : '30px'};
        animation: float 3s ease-in-out infinite;
        text-align: center;
    `;
    
    // 모든 요소를 컨테이너에 추가
    contentContainer.appendChild(mainTitle);
    contentContainer.appendChild(startButton);
    contentContainer.appendChild(helpText);

    // 컨테이너를 타이틀 화면에 추가
    titleScreen.appendChild(contentContainer);

    // 세로모드 회전 메시지 오버레이 (항상 추가, CSS로 제어)
    const rotateOverlay = document.createElement('div');
    rotateOverlay.id = 'titleRotateOverlay';
    rotateOverlay.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.8);
        display: none;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        z-index: 10001;
        pointer-events: auto;
    `;

    // 회전 아이콘
    const rotateIcon = document.createElement('div');
    rotateIcon.innerHTML = '📱';
    rotateIcon.style.cssText = `
        font-size: min(20vw, 100px);
        transform: rotate(90deg);
        animation: pulse 2s ease-in-out infinite;
        margin-bottom: 30px;
    `;

    // 메시지 텍스트
    const rotateText = document.createElement('div');
    rotateText.innerHTML = '💜 화면을 가로로 돌려주세요! 💜';
    rotateText.style.cssText = `
        font-family: 'Jua', sans-serif;
        font-size: min(6vw, 28px);
        color: #FFFFFF;
        text-shadow: 2px 2px 8px rgba(0,0,0,0.5);
        text-align: center;
        padding: 0 20px;
        line-height: 1.5;
        font-weight: bold;
    `;

    // 작은 안내 텍스트
    const rotateSubtext = document.createElement('div');
    rotateSubtext.innerHTML = '최적의 게임 경험을 위해';
    rotateSubtext.style.cssText = `
        font-family: 'Jua', sans-serif;
        font-size: min(4vw, 18px);
        color: #FFD700;
        text-shadow: 1px 1px 4px rgba(0,0,0,0.5);
        margin-top: 15px;
        text-align: center;
    `;

    rotateOverlay.appendChild(rotateIcon);
    rotateOverlay.appendChild(rotateText);
    rotateOverlay.appendChild(rotateSubtext);
    titleScreen.appendChild(rotateOverlay);

    // 실시간으로 화면 방향 감지하여 오버레이 표시/숨김
    const checkOrientation = () => {
        const isNowPortrait = window.innerHeight > window.innerWidth;
        rotateOverlay.style.display = isNowPortrait ? 'flex' : 'none';
    };

    // 초기 체크
    checkOrientation();

    // 이벤트 리스너 등록
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);

    // 정리 함수에 이벤트 리스너 제거 추가
    const originalCleanup = window._titleScreenCleanup;
    window._titleScreenCleanup = () => {
        window.removeEventListener('resize', checkOrientation);
        window.removeEventListener('orientationchange', checkOrientation);
        if (originalCleanup) originalCleanup();
    };

    // 타이틀 화면을 페이지에 추가
    document.body.appendChild(titleScreen);

    // 터치 이벤트도 추가 (모바일 지원)
    startButton.addEventListener('touchend', (e) => {
        e.preventDefault();
        startButton.click();
    });
}

// 방향 체크 후 타이틀 화면 시작 (세로모드든 가로모드든 항상 타이틀 표시)
function checkOrientationAndShowTitle() {
    // 세로모드든 가로모드든 항상 타이틀 화면 표시
    showTitleScreen();
}

// 전역 함수로 등록
window.showTitleScreen = showTitleScreen;
window.checkOrientationAndShowTitle = checkOrientationAndShowTitle;

// 오프닝 시퀀스 클래스 (코믹 버전 + 클릭 진행) - 기존 코드 유지
class OpeningSequence {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.scene = 0;
        this.frame = 0;
        this.isPlaying = true;
        this.onComplete = null;
        
        // 화면 방향 및 디바이스 체크
        this.isLandscape = canvas.width > canvas.height;
        this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        // 캐릭터 위치 (가로모드 최적화)
        this.setupCharacterPositions();
        
        // UFO와 알파벳 몬스터들
        this.ufo = { x: -200, y: 50, rotation: 0 };
        this.alphabetMonsters = [];
        
        // 코믹한 대화 텍스트
        this.dialogues = [
            { 
                scene: 1, 
                text: "🌸 평화로운 어느 날... 지율이는 간식을 먹고 있었다 🍪", 
                speaker: "narrator",
                effect: "peaceful"
            },
            { 
                scene: 2, 
                text: "🚨 삐용삐용! 갑자기 이상한 UFO가 나타났다! 🛸", 
                speaker: "narrator",
                effect: "alert"
            },
            { 
                scene: 3, 
                text: "👽 \"푸하하! 나는 알파벳 대마왕이다! ABCD도 모르는 지구 꼬맹이들!\"", 
                speaker: "alien",
                effect: "villain"
            },
            { 
                scene: 4, 
                text: "👽 \"영어 단어 시험에서 100점 못 맞으면... 지구는 내 거다! 푸푸푸!\"", 
                speaker: "alien",
                effect: "villain"
            },
            { 
                scene: 5, 
                text: "지율: \"뭐어어?! 내 간식 빼앗아가는 건 참을 수 없어! 😤\"", 
                speaker: "jiyul",
                effect: "angry"
            },
            { 
                scene: 6, 
                text: "키위: \"라룩라룩! (번역: 감히 우리 지구를?!) 🦎💢\"", 
                speaker: "kiwi",
                effect: "angry"
            },
            { 
                scene: 7, 
                text: "화이트하우스: \"흠... 내 안에는 영어 백과사전이 있다구! 📚✨\"", 
                speaker: "whitehouse",
                effect: "confident"
            },
            { 
                scene: 8, 
                text: "👽 \"흥... 그럼 내가 준비한 슈퍼 울트라 영어 문제를 풀어보거라!\"", 
                speaker: "alien",
                effect: "challenge"
            },
            { 
                scene: 9, 
                text: "모두: \"좋아! 우리가 영어 챔피언이 되어줄게! 🔥 LET'S GO! 🔥\"", 
                speaker: "all",
                effect: "heroic"
            }
        ];
        
        this.currentDialogue = 0;
        this.textDisplayed = false;
        this.typewriterIndex = 0;
        this.canProceed = false;
        
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
        
        // 코믹 효과용 변수들
        this.shakeAmount = 0;
        this.explosionParticles = [];
        this.sweatDrops = [];
        this.angryMarks = [];
        
        // Skip 버튼 (오른쪽 상단 고정)
        this.setupSkipButton();
        
        // 클릭 안내 메시지
        this.showClickHint = true;
        this.clickHintAlpha = 0;
    }
    
    // 캐릭터 위치 설정 (화면 방향에 따라)
    setupCharacterPositions() {
        if (this.isLandscape) {
            // 가로모드: 캐릭터들을 화면 중앙에 배치
            const centerX = this.canvas.width / 2;
            const centerY = this.canvas.height * 0.5;
            const spacing = this.isMobile ? 120 : 150;
            
            this.jiyul = { 
                x: centerX - spacing, 
                y: centerY,
                scale: this.isMobile ? 3 : 4,
                rotation: 0,
                expression: 'normal'
            };
            this.kiwi = { 
                x: centerX, 
                y: centerY + 20,
                scale: this.isMobile ? 3 : 4,
                rotation: 0,
                expression: 'normal'
            };
            this.whitehouse = { 
                x: centerX + spacing, 
                y: centerY,
                scale: this.isMobile ? 3 : 4,
                rotation: 0,
                expression: 'normal'
            };
        } else {
            // 세로모드: 기존 배치
            this.jiyul = { 
                x: this.canvas.width * 0.2, 
                y: this.canvas.height * 0.4,
                scale: 3,
                rotation: 0,
                expression: 'normal'
            };
            this.kiwi = { 
                x: this.canvas.width * 0.5, 
                y: this.canvas.height * 0.45,
                scale: 3,
                rotation: 0,
                expression: 'normal'
            };
            this.whitehouse = { 
                x: this.canvas.width * 0.8, 
                y: this.canvas.height * 0.4,
                scale: 3,
                rotation: 0,
                expression: 'normal'
            };
        }
    }
    
    // Skip 버튼 설정
    setupSkipButton() {
        const buttonSize = this.isMobile ? 
            { width: 70, height: 35 } : 
            { width: 80, height: 40 };
            
        this.skipButton = {
            x: this.canvas.width - buttonSize.width - 20,
            y: 20,
            width: buttonSize.width,
            height: buttonSize.height,
            text: "SKIP ⏭"
        };
    }
    
    // 픽셀 스프라이트 그리기
    drawPixelSprite(sprite, colorMap, x, y, scale = 3, rotation = 0) {
        this.ctx.save();
        this.ctx.translate(x + 8 * scale, y + 8 * scale);
        this.ctx.rotate(rotation);
        this.ctx.translate(-8 * scale, -8 * scale);
        
        for (let row = 0; row < sprite.length; row++) {
            for (let col = 0; col < sprite[row].length; col++) {
                const pixel = sprite[row][col];
                if (pixel !== 0 && colorMap[pixel]) {
                    this.ctx.fillStyle = colorMap[pixel];
                    this.ctx.fillRect(col * scale, row * scale, scale, scale);
                }
            }
        }
        
        this.ctx.restore();
    }
    
    // 씬 업데이트
    update() {
        if (!this.isPlaying) return;
        
        this.frame++;
        
        // 타이핑 효과
        if (this.currentDialogue < this.dialogues.length && !this.textDisplayed) {
            const dialogue = this.dialogues[this.currentDialogue];
            if (this.typewriterIndex < dialogue.text.length) {
                this.typewriterIndex += 2;
                if (this.typewriterIndex >= dialogue.text.length) {
                    this.typewriterIndex = dialogue.text.length;
                    this.textDisplayed = true;
                    this.canProceed = true;
                }
            }
        }
        
        // 클릭 힌트 애니메이션
        if (this.canProceed) {
            this.clickHintAlpha = (Math.sin(this.frame * 0.1) + 1) * 0.5;
        }
        
        // 씬별 애니메이션
        this.updateSceneAnimation();
        
        // 코믹 효과 업데이트
        this.updateComicEffects();
        
        // 화면 흔들림 감소
        if (this.shakeAmount > 0) {
            this.shakeAmount *= 0.9;
        }
    }
    
    // 씬별 애니메이션 업데이트
    updateSceneAnimation() {
        const dialogue = this.dialogues[this.currentDialogue];
        if (!dialogue) return;
        
        switch(dialogue.scene) {
            case 1: // 평화로운 씬
                this.jiyul.rotation = Math.sin(this.frame * 0.05) * 0.05;
                this.kiwi.rotation = Math.sin(this.frame * 0.05 + 1) * 0.05;
                this.whitehouse.rotation = Math.sin(this.frame * 0.05 + 2) * 0.05;
                break;
                
            case 2: // UFO 등장
            case 3:
            case 4:
                if (this.ufo.x < this.canvas.width / 2 - 50) {
                    this.ufo.x += 8;
                } else if (dialogue.scene === 2) {
                    this.shakeAmount = 10;
                }
                this.ufo.y = 50 + Math.sin(this.frame * 0.05) * 20;
                this.ufo.rotation += 0.1;
                break;
                
            case 5: // 지율이 화남
                this.jiyul.y = (this.isLandscape ? this.canvas.height * 0.5 : this.canvas.height * 0.4) + 
                              Math.abs(Math.sin(this.frame * 0.2)) * -10;
                this.jiyul.expression = 'angry';
                
                if (this.frame % 30 === 0) {
                    this.angryMarks.push({
                        x: this.jiyul.x + Math.random() * 40 - 20,
                        y: this.jiyul.y - 40,
                        life: 30
                    });
                }
                break;
                
            case 6: // 키위 점프
                this.kiwi.y = (this.isLandscape ? this.canvas.height * 0.5 + 20 : this.canvas.height * 0.45) + 
                             Math.abs(Math.sin(this.frame * 0.15 + 1)) * -30;
                this.kiwi.expression = 'determined';
                break;
                
            case 7: // 화이트하우스 자신감
                const baseX = this.isLandscape ? 
                    this.canvas.width / 2 + (this.isMobile ? 120 : 150) :
                    this.canvas.width * 0.8;
                this.whitehouse.x = baseX + Math.sin(this.frame * 0.1) * 3;
                this.whitehouse.expression = 'confident';
                
                if (this.frame % 20 === 0) {
                    this.explosionParticles.push({
                        x: this.whitehouse.x + Math.random() * 60 - 30,
                        y: this.whitehouse.y - Math.random() * 40,
                        vx: (Math.random() - 0.5) * 5,
                        vy: -Math.random() * 5,
                        life: 20,
                        color: '#FFD700'
                    });
                }
                break;
                
            case 8: // 외계인 도전
                this.ufo.y = 70 + Math.sin(this.frame * 0.1) * 30;
                this.ufo.rotation += 0.2;
                
                if (this.frame % 25 === 0) {
                    this.sweatDrops.push({
                        character: ['jiyul', 'kiwi', 'whitehouse'][Math.floor(Math.random() * 3)],
                        x: 0,
                        y: 0,
                        life: 40
                    });
                }
                break;
                
            case 9: // 모두 영웅 포즈
                const baseY = this.isLandscape ? this.canvas.height * 0.5 : this.canvas.height * 0.4;
                this.jiyul.y = baseY + Math.abs(Math.sin(this.frame * 0.15)) * -50;
                this.kiwi.y = (baseY + 20) + Math.abs(Math.sin(this.frame * 0.15 + 0.5)) * -45;
                this.whitehouse.y = baseY + Math.abs(Math.sin(this.frame * 0.15 + 1)) * -50;
                
                this.jiyul.expression = 'heroic';
                this.kiwi.expression = 'heroic';
                this.whitehouse.expression = 'heroic';
                
                if (this.frame % 10 === 0) {
                    for (let i = 0; i < 3; i++) {
                        const colors = ['#FF69B4', '#FFD700', '#87CEEB'];
                        this.explosionParticles.push({
                            x: this.canvas.width / 2 + (Math.random() - 0.5) * 400,
                            y: this.canvas.height / 2 + (Math.random() - 0.5) * 200,
                            vx: (Math.random() - 0.5) * 10,
                            vy: (Math.random() - 0.5) * 10,
                            life: 30,
                            color: colors[i]
                        });
                    }
                }
                break;
        }
    }
    
    // 코믹 효과 업데이트
    updateComicEffects() {
        // 폭발 파티클 업데이트
        this.explosionParticles = this.explosionParticles.filter(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.5;
            p.life--;
            return p.life > 0;
        });
        
        // 땀방울 업데이트
        this.sweatDrops = this.sweatDrops.filter(drop => {
            drop.y += 2;
            drop.life--;
            return drop.life > 0;
        });
        
        // 화난 마크 업데이트
        this.angryMarks = this.angryMarks.filter(mark => {
            mark.y -= 1;
            mark.life--;
            return mark.life > 0;
        });
    }
    
    // 렌더링
    render() {
        // 실시간으로 세로모드 확인 (매 프레임마다)
        const currentIsLandscape = this.canvas.width > this.canvas.height;

        // 세로모드일 때 무조건 가로모드 권장 메시지 표시
        if (!currentIsLandscape) {
            this.drawRotateMessage();
            return;
        }

        // 화면 흔들림 적용
        this.ctx.save();
        if (this.shakeAmount > 0.1) {
            this.ctx.translate(
                (Math.random() - 0.5) * this.shakeAmount,
                (Math.random() - 0.5) * this.shakeAmount
            );
        }

        // 배경 그리기
        this.drawBackground();

        // 씬 그리기
        this.drawScene();

        // 코믹 효과 그리기
        this.drawComicEffects();

        this.ctx.restore();

        // 대화 텍스트 (캐릭터와 겹치지 않게)
        this.drawDialogue();

        // Skip 버튼
        this.drawSkipButton();

        // 클릭 힌트
        if (this.canProceed) {
            this.drawClickHint();
        }
    }

    // 가로모드 권장 메시지
    drawRotateMessage() {
        // 검은 반투명 배경
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // 회전 아이콘
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const iconSize = Math.min(this.canvas.width, this.canvas.height) * 0.15;

        this.ctx.save();
        this.ctx.translate(centerX, centerY - 30);
        this.ctx.rotate(Math.PI / 2);
        this.ctx.font = `${iconSize}px Arial`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText('📱', 0, 0);
        this.ctx.restore();

        // 메시지 텍스트
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = 'bold 28px "Jua", sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.shadowColor = 'rgba(0,0,0,0.5)';
        this.ctx.shadowBlur = 8;
        this.ctx.fillText('💜 화면을 가로로 돌려주세요! 💜', centerX, centerY + iconSize + 20);
        this.ctx.shadowBlur = 0;

        // 작은 안내 텍스트
        this.ctx.font = '18px "Jua", sans-serif';
        this.ctx.fillStyle = '#FFD700';
        this.ctx.shadowColor = 'rgba(0,0,0,0.5)';
        this.ctx.shadowBlur = 4;
        this.ctx.fillText('최적의 게임 경험을 위해', centerX, centerY + iconSize + 55);
        this.ctx.shadowBlur = 0;
    }
    
    // 배경 그리기
    drawBackground() {
        const dialogue = this.dialogues[this.currentDialogue];
        if (!dialogue) return;
        
        // 그라데이션 하늘
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        
        switch(dialogue.effect) {
            case 'peaceful':
                gradient.addColorStop(0, '#87CEEB');
                gradient.addColorStop(1, '#98D8E8');
                break;
            case 'alert':
            case 'villain':
                gradient.addColorStop(0, '#4B0082');
                gradient.addColorStop(1, '#8B008B');
                break;
            case 'angry':
                gradient.addColorStop(0, '#FF6B6B');
                gradient.addColorStop(1, '#FFA500');
                break;
            case 'confident':
                gradient.addColorStop(0, '#FFD700');
                gradient.addColorStop(1, '#FFA500');
                break;
            case 'heroic':
                gradient.addColorStop(0, '#FF69B4');
                gradient.addColorStop(1, '#FFB6C1');
                break;
            default:
                gradient.addColorStop(0, '#87CEEB');
                gradient.addColorStop(1, '#98D8E8');
        }
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 별 그리기 (밤 씬)
        if (dialogue.effect === 'villain' || dialogue.effect === 'alert') {
            this.drawStars();
        }
        
        // 땅 (가로모드에서 더 낮게)
        const groundHeight = this.isLandscape ? 80 : 100;
        this.ctx.fillStyle = '#228B22';
        this.ctx.fillRect(0, this.canvas.height - groundHeight, this.canvas.width, groundHeight);
        
        // 꽃밭 (평화로운 씬)
        if (dialogue.effect === 'peaceful') {
            this.drawFlowers(groundHeight);
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
    drawFlowers(groundHeight) {
        const colors = ['#FF69B4', '#FFD700', '#FF6347', '#DDA0DD'];
        const flowerCount = this.isLandscape ? 30 : 20;
        const spacing = this.canvas.width / flowerCount;
        
        for (let i = 0; i < flowerCount; i++) {
            const x = i * spacing + spacing / 2;
            const y = this.canvas.height - groundHeight + 20;
            
            // 줄기
            this.ctx.strokeStyle = '#228B22';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.moveTo(x, y + 15);
            this.ctx.lineTo(x, y);
            this.ctx.stroke();
            
            // 꽃
            this.ctx.fillStyle = colors[i % colors.length];
            this.ctx.beginPath();
            this.ctx.arc(x, y, 6, 0, Math.PI * 2);
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
                    this.jiyul.x - (this.jiyul.scale * 8),
                    this.jiyul.y - (this.jiyul.scale * 16),
                    this.jiyul.scale,
                    this.jiyul.rotation
                );
                
                // 표정 그리기
                this.drawExpression(this.jiyul);
            }
            
            // 키위
            if (characterPixelData.kiwi) {
                this.drawPixelSprite(
                    characterPixelData.kiwi.idle,
                    characterPixelData.kiwi.colorMap,
                    this.kiwi.x - (this.kiwi.scale * 8),
                    this.kiwi.y - (this.kiwi.scale * 16),
                    this.kiwi.scale,
                    this.kiwi.rotation
                );
                
                this.drawExpression(this.kiwi);
            }
            
            // 화이트하우스
            if (characterPixelData.whitehouse) {
                this.drawPixelSprite(
                    characterPixelData.whitehouse.idle,
                    characterPixelData.whitehouse.colorMap,
                    this.whitehouse.x - (this.whitehouse.scale * 8),
                    this.whitehouse.y - (this.whitehouse.scale * 16),
                    this.whitehouse.scale,
                    this.whitehouse.rotation
                );
                
                this.drawExpression(this.whitehouse);
            }
        }
        
        // UFO와 알파벳 몬스터
        const dialogue = this.dialogues[this.currentDialogue];
        if (dialogue && dialogue.scene >= 2 && dialogue.scene <= 8) {
            this.drawUFO();
            if (dialogue.scene === 3 || dialogue.scene === 4 || dialogue.scene === 8) {
                this.drawAlphabetInvasion();
            }
        }
    }
    
    // 표정 그리기
    drawExpression(character) {
        const x = character.x;
        const y = character.y - 50;
        
        switch(character.expression) {
            case 'angry':
                // 화난 눈썹
                this.ctx.strokeStyle = '#FF0000';
                this.ctx.lineWidth = 3;
                this.ctx.beginPath();
                this.ctx.moveTo(x - 10, y - 5);
                this.ctx.lineTo(x - 5, y);
                this.ctx.moveTo(x + 5, y);
                this.ctx.lineTo(x + 10, y - 5);
                this.ctx.stroke();
                break;
                
            case 'determined':
                // 결의에 찬 불꽃
                this.ctx.font = '20px Arial';
                this.ctx.fillText('🔥', x - 10, y);
                break;
                
            case 'confident':
                // 반짝임
                this.ctx.font = '20px Arial';
                this.ctx.fillText('✨', x - 10, y);
                break;
                
            case 'heroic':
                // 별
                this.ctx.font = '20px Arial';
                this.ctx.fillText('⭐', x - 10, y);
                break;
        }
    }
    
    // UFO 그리기 (코믹 버전)
    drawUFO() {
        const x = this.ufo.x;
        const y = this.ufo.y;
        
        this.ctx.save();
        this.ctx.translate(x + 50, y + 30);
        this.ctx.rotate(this.ufo.rotation);
        this.ctx.translate(-50, -30);
        
        // UFO 본체
        this.ctx.fillStyle = '#C0C0C0';
        this.ctx.beginPath();
        this.ctx.ellipse(50, 30, 60, 25, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        // UFO 돔
        this.ctx.fillStyle = '#87CEEB';
        this.ctx.beginPath();
        this.ctx.arc(50, 20, 30, Math.PI, 0);
        this.ctx.fill();
        
        // 외계인 얼굴
        this.ctx.fillStyle = '#00FF00';
        this.ctx.beginPath();
        this.ctx.arc(50, 15, 15, 0, Math.PI * 2);
        this.ctx.fill();
        
        // 외계인 눈
        this.ctx.fillStyle = '#000000';
        this.ctx.beginPath();
        this.ctx.arc(45, 12, 3, 0, Math.PI * 2);
        this.ctx.arc(55, 12, 3, 0, Math.PI * 2);
        this.ctx.fill();
        
        // 사악한 미소
        this.ctx.strokeStyle = '#000000';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.arc(50, 18, 5, 0, Math.PI);
        this.ctx.stroke();
        
        this.ctx.restore();
        
        // UFO 빛
        const lightColors = ['#FFFF00', '#FFD700', '#FFA500'];
        for (let i = 0; i < 6; i++) {
            const lightX = x + 20 + i * 10;
            const lightY = y + 35;
            this.ctx.fillStyle = lightColors[(i + Math.floor(this.frame / 5)) % 3];
            this.ctx.beginPath();
            this.ctx.arc(lightX, lightY, 4, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        // 빔 (가로모드에서 조정)
        const dialogue = this.dialogues[this.currentDialogue];
        if (dialogue && (dialogue.scene === 3 || dialogue.scene === 4)) {
            const beamTarget = this.isLandscape ? 
                this.canvas.height - 80 : 
                this.canvas.height - 100;
                
            const beamGradient = this.ctx.createLinearGradient(x + 50, y + 40, x + 50, beamTarget);
            beamGradient.addColorStop(0, 'rgba(124, 252, 0, 0.8)');
            beamGradient.addColorStop(1, 'rgba(124, 252, 0, 0)');
            
            this.ctx.fillStyle = beamGradient;
            this.ctx.beginPath();
            this.ctx.moveTo(x + 30, y + 40);
            this.ctx.lineTo(x + 70, y + 40);
            this.ctx.lineTo(x + 100, beamTarget);
            this.ctx.lineTo(x, beamTarget);
            this.ctx.closePath();
            this.ctx.fill();
        }
    }
    
    // 알파벳 침략 효과 (코믹 버전)
    drawAlphabetInvasion() {
        const alphabets = ['A', 'B', 'C', 'X', 'Y', 'Z'];
        const colors = ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF'];
        
        this.ctx.save();
        this.ctx.imageSmoothingEnabled = true;
        
        alphabets.forEach((letter, i) => {
            const x = this.ufo.x + 50 + Math.sin(this.frame * 0.1 + i) * 80;
            const y = this.ufo.y + 80 + i * 20 + Math.sin(this.frame * 0.15 + i) * 10;
            const rotation = Math.sin(this.frame * 0.1 + i) * 0.3;
            
            this.ctx.save();
            this.ctx.translate(x, y);
            this.ctx.rotate(rotation);
            
            // 알파벳 그림자
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            this.ctx.font = `bold ${this.isLandscape ? '25px' : '30px'} Arial`;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(letter, 2, 2);
            
            // 알파벳
            this.ctx.fillStyle = colors[i];
            this.ctx.fillText(letter, 0, 0);
            
            // 사악한 눈
            this.ctx.fillStyle = '#FF0000';
            this.ctx.beginPath();
            this.ctx.arc(-5, -5, 2, 0, Math.PI * 2);
            this.ctx.arc(5, -5, 2, 0, Math.PI * 2);
            this.ctx.fill();
            
            this.ctx.restore();
            
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
    
    // 코믹 효과 그리기
    drawComicEffects() {
        // 폭발 파티클
        this.explosionParticles.forEach(p => {
            this.ctx.fillStyle = p.color + Math.floor((p.life / 30) * 255).toString(16).padStart(2, '0');
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, 3 + (30 - p.life) / 10, 0, Math.PI * 2);
            this.ctx.fill();
        });
        
        // 땀방울
        this.sweatDrops.forEach(drop => {
            const char = this[drop.character];
            if (char) {
                const x = char.x + 20;
                const y = char.y - 30 + drop.y;
                
                this.ctx.fillStyle = '#87CEEB';
                this.ctx.beginPath();
                this.ctx.arc(x, y, 5, 0, Math.PI * 2);
                this.ctx.fill();
            }
        });
        
        // 화난 마크
        this.angryMarks.forEach(mark => {
            this.ctx.save();
            this.ctx.font = 'bold 20px Arial';
            this.ctx.fillStyle = `rgba(255, 0, 0, ${mark.life / 30})`;
            this.ctx.fillText('💢', mark.x, mark.y);
            this.ctx.restore();
        });
    }
    
    // 대화 텍스트 그리기 (개선된 버전)
    drawDialogue() {
        if (this.currentDialogue < this.dialogues.length) {
            const dialogue = this.dialogues[this.currentDialogue];
            
            // 대화 박스 위치 (캐릭터와 겹치지 않게)
            let boxY, boxHeight;
            if (this.isLandscape) {
                // 가로모드: 화면 하단에 작게
                boxHeight = 60;
                boxY = this.canvas.height - boxHeight - 10;
            } else {
                // 세로모드: 기존 위치
                boxHeight = 100;
                boxY = this.canvas.height - 150;
            }
            
            const boxX = 20;
            const boxWidth = this.canvas.width - 40;
            
            // 말풍선 스타일 대화 박스
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
            this.ctx.fillRect(boxX, boxY, boxWidth, boxHeight);
            
            // 대화 박스 테두리
            this.ctx.strokeStyle = this.getSpeakerColor(dialogue.speaker);
            this.ctx.lineWidth = 4;
            this.ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);
            
            // 말풍선 꼬리 (화자에 따라 위치 변경)
            if (dialogue.speaker !== 'narrator') {
                this.drawSpeechBubbleTail(dialogue.speaker, boxX, boxY, boxWidth, boxHeight);
            }
            
            // 텍스트 렌더링
            this.ctx.save();
            this.ctx.imageSmoothingEnabled = true;
            
            // 타이핑 효과로 표시할 텍스트
            const displayText = dialogue.text.substring(0, this.typewriterIndex);
            
            // 텍스트 크기 조정
            const fontSize = this.isLandscape ? 
                (this.isMobile ? '16px' : '20px') : 
                '18px';
            
            // 텍스트 그리기
            this.ctx.fillStyle = '#000000';
            this.ctx.font = `bold ${fontSize} Jua, sans-serif`;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            
            // 긴 텍스트 줄바꿈 처리
            const maxWidth = boxWidth - 40;
            const words = displayText.split(' ');
            let line = '';
            let lines = [];
            
            for (let n = 0; n < words.length; n++) {
                const testLine = line + words[n] + ' ';
                const metrics = this.ctx.measureText(testLine);
                const testWidth = metrics.width;
                
                if (testWidth > maxWidth && n > 0) {
                    lines.push(line);
                    line = words[n] + ' ';
                } else {
                    line = testLine;
                }
            }
            lines.push(line);
            
            // 여러 줄 텍스트 렌더링
            const lineHeight = this.isLandscape ? 20 : 25;
            const startY = boxY + boxHeight / 2 - (lines.length - 1) * lineHeight / 2;
            
            lines.forEach((line, index) => {
                this.ctx.fillText(line.trim(), this.canvas.width / 2, startY + index * lineHeight);
            });
            
            this.ctx.restore();
        }
    }
    
    // 말풍선 꼬리 그리기
    drawSpeechBubbleTail(speaker, boxX, boxY, boxWidth, boxHeight) {
        let tailX;
        
        switch(speaker) {
            case 'jiyul':
                tailX = this.jiyul.x;
                break;
            case 'kiwi':
                tailX = this.kiwi.x;
                break;
            case 'whitehouse':
                tailX = this.whitehouse.x;
                break;
            case 'alien':
                tailX = this.ufo.x + 50;
                break;
            case 'all':
                tailX = this.canvas.width / 2;
                break;
            default:
                return;
        }
        
        const color = this.getSpeakerColor(speaker);
        
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = 3;
        
        this.ctx.beginPath();
        this.ctx.moveTo(tailX - 10, boxY);
        this.ctx.lineTo(tailX + 10, boxY);
        this.ctx.lineTo(tailX, boxY - 20);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.stroke();
    }
    
    // 화자별 색상
    getSpeakerColor(speaker) {
        switch(speaker) {
            case 'jiyul': return '#FF69B4';
            case 'kiwi': return '#32CD32';
            case 'whitehouse': return '#4169E1';
            case 'alien': return '#8B008B';
            case 'all': return '#FFD700';
            default: return '#9370DB';
        }
    }
    
    // 클릭 힌트 그리기
    drawClickHint() {
        this.ctx.save();
        
        const hintY = this.isLandscape ? 
            this.canvas.height - 80 : 
            this.canvas.height - 180;
        
        // 클릭 아이콘
        this.ctx.fillStyle = `rgba(255, 215, 0, ${this.clickHintAlpha})`;
        this.ctx.font = 'bold 16px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('▼ 클릭하여 계속 ▼', this.canvas.width / 2, hintY);
        
        this.ctx.restore();
    }
    
    // Skip 버튼 그리기
    drawSkipButton() {
        // 버튼 스타일
        const gradient = this.ctx.createLinearGradient(
            this.skipButton.x, 
            this.skipButton.y,
            this.skipButton.x + this.skipButton.width,
            this.skipButton.y + this.skipButton.height
        );
        gradient.addColorStop(0, 'rgba(147, 112, 219, 0.8)');
        gradient.addColorStop(1, 'rgba(221, 160, 221, 0.8)');
        
        // 버튼 배경
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(this.skipButton.x, this.skipButton.y, this.skipButton.width, this.skipButton.height);
        
        // 버튼 테두리
        this.ctx.strokeStyle = '#FFFFFF';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(this.skipButton.x, this.skipButton.y, this.skipButton.width, this.skipButton.height);
        
        // 호버 효과
        if (this.isHoveringSkip) {
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
            this.ctx.fillRect(this.skipButton.x, this.skipButton.y, this.skipButton.width, this.skipButton.height);
        }
        
        // 텍스트
        this.ctx.save();
        this.ctx.imageSmoothingEnabled = true;
        
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = `bold ${this.isMobile ? '12px' : '14px'} Arial`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(
            this.skipButton.text, 
            this.skipButton.x + this.skipButton.width / 2, 
            this.skipButton.y + this.skipButton.height / 2
        );
        
        this.ctx.restore();
    }
    
    // 마우스/터치 이벤트 처리
    handleClick(x, y) {
        // Skip 버튼 클릭 체크
        if (x >= this.skipButton.x && x <= this.skipButton.x + this.skipButton.width &&
            y >= this.skipButton.y && y <= this.skipButton.y + this.skipButton.height) {
            this.skip();
        } else {
            // 텍스트가 완전히 표시되지 않았으면 빠르게 표시
            if (!this.textDisplayed) {
                this.typewriterIndex = this.dialogues[this.currentDialogue].text.length;
                this.textDisplayed = true;
                this.canProceed = true;
            } 
            // 텍스트가 완전히 표시되었으면 다음 대화로
            else if (this.canProceed) {
                this.nextDialogue();
            }
        }
    }
    
    // 다음 대화로 진행
    nextDialogue() {
        this.currentDialogue++;
        this.typewriterIndex = 0;
        this.textDisplayed = false;
        this.canProceed = false;
        
        if (this.currentDialogue >= this.dialogues.length) {
            this.complete();
        } else {
            // 씬 변경 시 효과 초기화
            this.scene = this.dialogues[this.currentDialogue].scene;
            this.shakeAmount = 0;
            
            // 캐릭터 표정 초기화
            this.jiyul.expression = 'normal';
            this.kiwi.expression = 'normal';
            this.whitehouse.expression = 'normal';
        }
    }
    
    // 마우스 호버 체크
    handleMouseMove(x, y) {
        this.isHoveringSkip = (
            x >= this.skipButton.x && 
            x <= this.skipButton.x + this.skipButton.width &&
            y >= this.skipButton.y && 
            y <= this.skipButton.y + this.skipButton.height
        );
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
    
    // 화면 크기 변경 처리
    handleResize() {
        this.isLandscape = this.canvas.width > this.canvas.height;
        this.setupCharacterPositions();
        this.setupSkipButton();
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
    
    // orientation change 핸들러
    const orientationHandler = () => {
        setTimeout(resizeHandler, 100);
    };

    // 모든 리스너 제거 함수
    const removeAllListeners = () => {
        canvas.removeEventListener('click', clickHandler);
        canvas.removeEventListener('touchend', touchHandler);
        canvas.removeEventListener('mousemove', moveHandler);
        window.removeEventListener('resize', resizeHandler);
        window.removeEventListener('orientationchange', orientationHandler);
    };

    // 클릭 이벤트 리스너
    const clickHandler = (e) => {
        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) * (canvas.width / rect.width);
        const y = (e.clientY - rect.top) * (canvas.height / rect.height);
        opening.handleClick(x, y);

        if (!opening.isPlaying) {
            removeAllListeners();
        }
    };

    // 터치 이벤트 리스너
    const touchHandler = (e) => {
        e.preventDefault();
        const rect = canvas.getBoundingClientRect();
        const touch = e.changedTouches[0];
        const x = (touch.clientX - rect.left) * (canvas.width / rect.width);
        const y = (touch.clientY - rect.top) * (canvas.height / rect.height);
        opening.handleClick(x, y);

        if (!opening.isPlaying) {
            removeAllListeners();
        }
    };
    
    // 마우스 이동 이벤트 (호버 효과용)
    const moveHandler = (e) => {
        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) * (canvas.width / rect.width);
        const y = (e.clientY - rect.top) * (canvas.height / rect.height);
        opening.handleMouseMove(x, y);
    };
    
    // 리사이즈 이벤트
    const resizeHandler = () => {
        // 강제 레이아웃 재계산
        const controls = document.getElementById('controls');
        if (controls) controls.offsetHeight;

        // 오프닝 중에는 전체 화면 사용 (controls 무시)
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        // 오프닝 요소들 재배치
        opening.handleResize();
    };
    
    canvas.addEventListener('click', clickHandler);
    canvas.addEventListener('touchend', touchHandler);
    canvas.addEventListener('mousemove', moveHandler);
    window.addEventListener('resize', resizeHandler);
    window.addEventListener('orientationchange', orientationHandler);

    opening.run();
    
    return opening;
}

// 전역 함수로 등록
window.startOpening = startOpening;
window.showTitleScreen = showTitleScreen;

console.log('📚 opening.js 로드 완료');