// ═══════════════════════════════════════════════════════════════
// 메탈슬러그풍 2D 도트 배경 시스템 - background.js
// - 그라데이션 없음: 하늘은 픽셀 색 밴드 + 경계 체커 디더링
// - 3중 패럴랙스: 원경 실루엣(0.25x) / 중경 소품(0.6x) / 근경 지면(1x)
// - 소품은 전부 문자 그리드 + colorMap 데이터 (이미지 파일 없음)
//   → drawPixelSprite(_slug)로 외곽선+림라이트+셰이드 자동 적용
// - 별/자갈/소품 배치는 결정적 해시 (프레임마다 흔들리지 않음)
// - 모든 좌표는 정수 스냅
// ═══════════════════════════════════════════════════════════════

// ── 결정적 해시 (0~1) ──
function bgHash(n) {
    n = (n ^ 61) ^ (n >>> 16);
    n = (n + (n << 3)) | 0;
    n = n ^ (n >>> 4);
    n = Math.imul(n, 0x27d4eb2d);
    n = n ^ (n >>> 15);
    return (n >>> 0) / 4294967295;
}

// ── 소품 스프라이트 (문자 그리드 → 셀 그대로 colorMap 키) ──
function bgSprite(rows) {
    return rows.map(r => [...r].map(ch => (ch === '.' ? 0 : ch)));
}

const BG_PROPS = {
    // 모래주머니 방벽
    sandbag: {
        sprite: bgSprite([
            '....aaaa.aaaa...',
            '...aaaaaaaaaaa..',
            '..aAAaaaAAaaaa..',
            '.aaaaaaaaaaaaaa.',
            'aAAaaaAAaaaAAaa.',
            'aaaaaaaaaaaaaaa.',
            'aAAaaaAAaaaAAaa.',
            'aaaaaaaaaaaaaaa.',
        ]),
        colorMap: { _slug: true, 'a': '#B09258', 'A': '#8A7040' },
    },
    // 보급 상자
    crate: {
        sprite: bgSprite([
            'kkkkkkkkkkkk',
            'kwwkwwwwkwwk',
            'kwkwwwwwwkwk',
            'kkwwwwwwwwkk',
            'kwwwwkkwwwwk',
            'kwwwkwwkwwwk',
            'kkwwwwwwwwkk',
            'kwkwwwwwwkwk',
            'kwwkwwwwkwwk',
            'kkkkkkkkkkkk',
        ]),
        colorMap: { _slug: true, 'w': '#A87C4F', 'k': '#6B4A2A' },
    },
    // 군용 텐트
    tent: {
        sprite: bgSprite([
            '........tt........',
            '.......tttt.......',
            '......tttttt......',
            '.....ttTTtttt.....',
            '....ttTTTTtttt....',
            '...ttTToooTTttt...',
            '..tttTooooooTttt..',
            '.ttttToooooooTttt.',
            'tttttooooooooTtttt',
        ]),
        colorMap: { _slug: true, 't': '#5A7A4A', 'T': '#48633C', 'o': '#241C12' },
    },
    // 나무
    tree: {
        sprite: bgSprite([
            '....gggggg....',
            '..gggggggggg..',
            '.gggGGggggggg.',
            'ggGGggggGGgggg',
            'ggggggGGgggggg',
            '.ggGGggggggg..',
            '..ggggggggg...',
            '....kkkk......',
            '....kkkk......',
            '....kkkk......',
            '...kkkkkk.....',
        ]),
        colorMap: { _slug: true, 'g': '#3E7A34', 'G': '#2E5C28', 'k': '#5C3A24' },
    },
    // 수풀
    bush: {
        sprite: bgSprite([
            '..gggg.ggg..',
            '.gggggggggg.',
            'ggGGgggGGggg',
            'gggggggggggg',
        ]),
        colorMap: { _slug: true, 'g': '#4A8A3C', 'G': '#376B2E' },
    },
    // 선인장
    cactus: {
        sprite: bgSprite([
            '....cc....',
            '....cc....',
            'cc..cc..cc',
            'cc..cc..cc',
            'cccccc..cc',
            '....cccccc',
            '....cc....',
            '....cc....',
            '....cc....',
            '....cc....',
        ]),
        colorMap: { _slug: true, 'c': '#4F8A4A' },
    },
};

// ── 스테이지 테마 매핑 테이블 ──
const BG_THEMES = [
    {   // 1. 노을 전장
        sky: ['#2A1845', '#4A2A60', '#7C3A6E', '#B0504E', '#DD7038', '#F09048'],
        stars: true, starCol: '#FFD8A0',
        far: '#2A1830', farWin: '#FFB84A',
        props: ['tree', 'sandbag', 'bush'],
        ground: { line: '#1A0F08', grass1: '#4A7A2E', grass2: '#5F9A3E',
                  dirt1: '#5C3A24', dirt2: '#4E3120', gravel: '#3E2A1C', pebble: '#6B4A30' },
    },
    {   // 2. 맑은 낮
        sky: ['#2E5FA3', '#3F74B8', '#5B90CC', '#7FACD9', '#A5C8E8', '#C8E0F2'],
        stars: false,
        far: '#4A6A88', farWin: '#D8E8F2',
        props: ['tree', 'bush', 'crate'],
        ground: { line: '#14200C', grass1: '#3E8E2F', grass2: '#5FB53E',
                  dirt1: '#5C3A24', dirt2: '#4E3120', gravel: '#403020', pebble: '#78583A' },
    },
    {   // 3. 사막 작전
        sky: ['#8A5A9A', '#B06A80', '#D08858', '#E8A848', '#F0C060', '#F8D888'],
        stars: false,
        far: '#6B4A32', farWin: '#3A2818',
        props: ['cactus', 'sandbag', 'crate'],
        ground: { line: '#3A2410', grass1: '#D8B060', grass2: '#E8C878',
                  dirt1: '#B08048', dirt2: '#986C3C', gravel: '#7A5630', pebble: '#C89858' },
    },
    {   // 4. 야간 침투
        sky: ['#0A0A1E', '#10142E', '#1A1E42', '#242A56', '#303A6E', '#3E4A82'],
        stars: true, starCol: '#FFFFFF',
        far: '#0C1020', farWin: '#FFE070',
        props: ['tent', 'sandbag', 'crate'],
        ground: { line: '#080C06', grass1: '#28481E', grass2: '#365E28',
                  dirt1: '#38281A', dirt2: '#2E2014', gravel: '#241A10', pebble: '#4A3624' },
    },
];

// ── 메인 배경 그리기 ──
function drawBackground() {
    const theme = BG_THEMES[(Math.max(1, gameState.stage) - 1) % BG_THEMES.length];
    const U = Math.max(2, Math.round(PIXEL_SCALE));           // 도트 단위
    const W = canvas.width;
    const skyH = Math.round(GROUND_Y);
    const cam = Math.round(gameState.cameraX || 0);

    // ── 1) 하늘: 픽셀 색 밴드 + 경계 체커 디더링 ──
    const n = theme.sky.length;
    const bandH = Math.ceil(skyH / n / U) * U;
    for (let i = 0; i < n; i++) {
        const y0 = i * bandH;
        ctx.fillStyle = theme.sky[i];
        ctx.fillRect(0, y0, W, bandH);
        if (i < n - 1) {
            // 다음 밴드 색으로 체커 한 줄 (도트 그라데이션)
            ctx.fillStyle = theme.sky[i + 1];
            const dy = y0 + bandH - U;
            for (let x = (i % 2) * U; x < W; x += U * 2) {
                ctx.fillRect(x, dy, U, U);
            }
        }
    }

    // ── 2) 별 (결정적 해시 배치, 위쪽 3개 밴드) ──
    if (theme.stars) {
        ctx.fillStyle = theme.starCol;
        for (let i = 0; i < 34; i++) {
            const sx = Math.round(bgHash(i * 13 + 7) * W / U) * U;
            const sy = Math.round(bgHash(i * 29 + 3) * bandH * 3 / U) * U;
            // 깜빡임: 위치는 고정, 표시 여부만 시간에 따라
            if ((Math.floor(Date.now() / 400) + i) % 5 !== 0) {
                ctx.fillRect(sx, sy, U, U);
            }
        }
    }

    // ── 3) 원경(0.25x): 폐허 빌딩 실루엣 ──
    drawFarSkyline(theme, U, W, skyH, cam);

    // ── 4) 중경(0.6x): 소품 스프라이트 ──
    drawMidProps(theme, U, W, cam);

    // ── 5) 근경: 지면 타일 ──
    drawGroundTiles(theme, U, W, cam);
}

// ── 원경: 폐허 빌딩 실루엣 (어두운 단색 + 창문 도트) ──
function drawFarSkyline(theme, U, W, skyH, cam) {
    const off = Math.round(cam * 0.25);
    const segW = U * 34;
    const first = Math.floor(off / segW) - 1;
    const count = Math.ceil(W / segW) + 3;
    for (let i = first; i < first + count; i++) {
        const r = bgHash(i * 101 + 17);
        if (r < 0.18) continue;                               // 빈 자리
        const bw = Math.round((0.45 + bgHash(i * 53 + 5) * 0.4) * segW / U) * U;
        const bh = Math.round((0.2 + r * 0.32) * skyH / U) * U;
        const bx = i * segW - off + Math.round(bgHash(i * 71 + 9) * U * 6 / U) * U;
        const by = skyH - bh;
        ctx.fillStyle = theme.far;
        ctx.fillRect(bx, by, bw, bh);
        // 폐허 지붕: 위쪽 모서리를 계단형으로 깎기
        const notch = 1 + Math.floor(bgHash(i * 31 + 2) * 3);
        for (let k = 0; k < notch; k++) {
            const nx = bx + Math.round(bgHash(i * 91 + k * 7) * (bw / U - 3)) * U;
            ctx.fillStyle = theme.sky[Math.min(theme.sky.length - 1, Math.floor(by / (skyH / theme.sky.length)))];
            ctx.fillRect(nx, by, U * (1 + Math.floor(bgHash(i * 3 + k) * 2)), U * (1 + Math.floor(bgHash(i * 17 + k) * 2)));
        }
        // 창문 도트 (해시로 드문드문)
        ctx.fillStyle = theme.farWin;
        for (let wy = by + U * 2; wy < skyH - U * 2; wy += U * 3) {
            for (let wx = bx + U; wx < bx + bw - U; wx += U * 3) {
                if (bgHash(wx * 7 + wy * 13 + i) < 0.16) {
                    ctx.fillRect(wx, wy, U, U);
                }
            }
        }
    }
}

// ── 중경: 소품 스프라이트 (0.6x 패럴랙스, 지면 위에 배치) ──
function drawMidProps(theme, U, W, cam) {
    const off = Math.round(cam * 0.6);
    const segW = U * 60;
    const first = Math.floor(off / segW) - 1;
    const count = Math.ceil(W / segW) + 3;
    const scale = Math.max(2, Math.round(U * 0.75));
    for (let i = first; i < first + count; i++) {
        const r = bgHash(i * 47 + 11);
        if (r < 0.3) continue;                                // 빈 자리
        const prop = BG_PROPS[theme.props[Math.floor(bgHash(i * 19 + 4) * theme.props.length)]];
        if (!prop) continue;
        const x = Math.round(i * segW - off + bgHash(i * 67 + 8) * segW * 0.4);
        const y = Math.round(GROUND_Y - prop.sprite.length * scale + U);  // 발이 경계선에 살짝 걸치게
        drawPixelSprite(prop.sprite, prop.colorMap, x, y, scale);
    }
}

// ── 근경: 지면 타일 (경계선 / 풀 / 흙 / 자갈) ──
function drawGroundTiles(theme, U, W, cam) {
    const g = theme.ground;
    const top = Math.round(GROUND_Y);
    const H = canvas.height;
    const xo = -(((cam % U) + U) % U);                        // 정수 스냅 스크롤 오프셋

    // 메탈슬러그식 어두운 경계선
    ctx.fillStyle = g.line;
    ctx.fillRect(0, top, W, U);

    // 풀 층 (2톤: 밑색 + 해시 디더 술)
    const grassH = U * 4;
    ctx.fillStyle = g.grass1;
    ctx.fillRect(0, top + U, W, grassH);
    ctx.fillStyle = g.grass2;
    for (let sx = xo; sx < W + U; sx += U) {
        const t = Math.round((cam + sx) / U);
        if (bgHash(t * 3 + 1) < 0.4) ctx.fillRect(sx, top + U, U, U);            // 윗줄 밝은 술
        if (bgHash(t * 11 + 5) < 0.18) ctx.fillRect(sx, top + U * 2, U, U);      // 드문 하이라이트
    }

    // 흙 층 (체커 미세 톤)
    const dirtTop = top + U + grassH;
    const dirtH = U * 8;
    ctx.fillStyle = g.dirt1;
    ctx.fillRect(0, dirtTop, W, dirtH);
    ctx.fillStyle = g.dirt2;
    for (let sy = 0; sy < dirtH; sy += U) {
        for (let sx = xo; sx < W + U; sx += U * 2) {
            const t = Math.round((cam + sx) / U) + sy / U;
            if ((t & 1) === 0) ctx.fillRect(sx, dirtTop + sy, U, U);
        }
    }

    // 자갈 층 (해시 기반 고정 배치 자갈)
    const gravelTop = dirtTop + dirtH;
    ctx.fillStyle = g.gravel;
    ctx.fillRect(0, gravelTop, W, Math.max(0, H - gravelTop));
    ctx.fillStyle = g.pebble;
    for (let sy = gravelTop; sy < H; sy += U) {
        for (let sx = xo; sx < W + U; sx += U) {
            const t = Math.round((cam + sx) / U) * 31 + Math.round(sy / U) * 7;
            if (bgHash(t) < 0.06) {
                ctx.fillRect(sx, sy, U * 2, U);
            }
        }
    }
}
