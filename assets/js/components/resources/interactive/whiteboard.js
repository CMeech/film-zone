// whiteboard.js
// Put this file at static/js/components/resources/interactive/whiteboard.js
// Uses only standard browser APIs + Tailwind CSS classes present in page.

(() => {
    // Config
    const WIDTH = 600;
    const HEIGHT = 900; // portrait
    const courtPadding = 20;
    const viewBox = `0 0 ${WIDTH} ${HEIGHT}`;

    const root = document.getElementById('whiteboard-root');

    // Tools & state
    let tool = 'select'; // select, line, circle, free
    let drawColor = '#ff3b30';
    let scale = 1;
    const SCALE_STEP = 1.15;
    const MIN_SCALE = 0.4;
    const MAX_SCALE = 4;

    // Create SVG
    const svgNS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('viewBox', viewBox);
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '100%');
    // color for lines uses currentColor so Tailwind can switch
    svg.classList.add('block', 'w-full', 'h-full', 'text-black', 'dark:text-white');

    // Outer group structure: gPan -> gRoot
    const gPan = document.createElementNS(svgNS, 'g');
    const gRoot = document.createElementNS(svgNS, 'g');
    gRoot.setAttribute('transform', `scale(${scale})`);
    gPan.appendChild(gRoot);
    svg.appendChild(gPan);
    let panX = 0, panY = 0;
    root.appendChild(svg);

    // Draw court background rectangle
    const courtRect = document.createElementNS(svgNS, 'rect');
    courtRect.setAttribute('x', courtPadding);
    courtRect.setAttribute('y', courtPadding);
    courtRect.setAttribute('width', WIDTH - courtPadding * 2);
    courtRect.setAttribute('height', HEIGHT - courtPadding * 2);
    courtRect.setAttribute('fill', 'transparent');
    courtRect.setAttribute('stroke', 'currentColor');
    courtRect.setAttribute('stroke-width', '2');
    gRoot.appendChild(courtRect);

    // Draw center line (net) - horizontal across center
    const centerY = HEIGHT / 2;
    const centerLine = document.createElementNS(svgNS, 'line');
    centerLine.setAttribute('x1', courtPadding);
    centerLine.setAttribute('x2', WIDTH - courtPadding);
    centerLine.setAttribute('y1', centerY);
    centerLine.setAttribute('y2', centerY);
    centerLine.setAttribute('stroke', 'currentColor');
    centerLine.setAttribute('stroke-width', '2');
    gRoot.appendChild(centerLine);

    // Attack lines (3m from centre on each side) - typical court has attack line 3m from net
    // We'll place attack lines at 150 units from center roughly
    const attackOffset = 150;
    const attackTopY = centerY - attackOffset;
    const attackBottomY = centerY + attackOffset;
    const attackTop = document.createElementNS(svgNS, 'line');
    attackTop.setAttribute('x1', courtPadding);
    attackTop.setAttribute('x2', WIDTH - courtPadding);
    attackTop.setAttribute('y1', attackTopY);
    attackTop.setAttribute('y2', attackTopY);
    attackTop.setAttribute('stroke', 'currentColor');
    attackTop.setAttribute('stroke-width', '1.5');
    gRoot.appendChild(attackTop);

    const attackBottom = document.createElementNS(svgNS, 'line');
    attackBottom.setAttribute('x1', courtPadding);
    attackBottom.setAttribute('x2', WIDTH - courtPadding);
    attackBottom.setAttribute('y1', attackBottomY);
    attackBottom.setAttribute('y2', attackBottomY);
    attackBottom.setAttribute('stroke', 'currentColor');
    attackBottom.setAttribute('stroke-width', '1.5');
    gRoot.appendChild(attackBottom);

    // Out-of-bounds line (same as court rect stroke already)
    // Place player positions: 6 per side (3 front row near net, 3 back row near baseline)
    // Compute columns and rows
    function createPlayer(x, y, fill, label, id) {
        const g = document.createElementNS(svgNS, 'g');
        g.classList.add('player');
        g.setAttribute('data-id', id);
        g.setAttribute('transform', `translate(${x},${y})`);

        const r = 26;
        const circle = document.createElementNS(svgNS, 'circle');
        circle.setAttribute('cx', 0);
        circle.setAttribute('cy', 0);
        circle.setAttribute('r', r);
        circle.setAttribute('fill', fill);
        circle.setAttribute('stroke', 'currentColor');
        circle.setAttribute('stroke-width', '3');
        circle.setAttribute('cursor', 'grab');
        circle.setAttribute('id', `player-${id}`);

        const text = document.createElementNS(svgNS, 'text');
        text.setAttribute('x', 0);
        text.setAttribute('y', 6);
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('font-size', '18');
        text.setAttribute('font-family', 'sans-serif');
        text.setAttribute('fill', 'white');
        text.setAttribute('pointer-events', 'none');
        text.textContent = label;

        g.appendChild(circle);
        g.appendChild(text);

        // highlight state
        g.addEventListener('click', (ev) => {
            ev.stopPropagation();
            clearHighlights();
            circle.setAttribute('stroke-width', '6');
            circle.setAttribute('stroke-linejoin', 'round');
            // optional: add a subtle glow via filter? keep simple.
        });

        // Dragging using pointer events
        let dragging = false;
        let startPointer = null;
        function onPointerDown(e) {
            e.preventDefault();
            dragging = true;
            startPointer = getPointerSVGCoords(e);
            // compute offset
            const transform = g.getAttribute('transform'); // translate(x,y)
            const match = transform.match(/translate\(([-\d.]+),\s*([-\d.]+)\)/);
            let cx = 0, cy = 0;
            if (match) {
                cx = parseFloat(match[1]);
                cy = parseFloat(match[2]);
            }
            g._dragStart = { cx, cy, px: startPointer.x, py: startPointer.y };
            circle.setAttribute('cursor', 'grabbing');
            (e.target).setPointerCapture(e.pointerId);
        }
        function onPointerMove(e) {
            if (!dragging) return;
            const p = getPointerSVGCoords(e);
            const ds = g._dragStart;
            const nx = ds.cx + (p.x - ds.px);
            const ny = ds.cy + (p.y - ds.py);
            g.setAttribute('transform', `translate(${nx},${ny})`);
        }
        function onPointerUp(e) {
            dragging = false;
            try { (e.target).releasePointerCapture(e.pointerId); } catch (err) {}
            circle.setAttribute('cursor', 'grab');
        }
        circle.addEventListener('pointerdown', onPointerDown);
        svg.addEventListener('pointermove', onPointerMove);
        document.addEventListener('pointerup', onPointerUp);

        return g;
    }

    // Utility: get pointer coordinates in SVG coordinate space (taking account of transform scale)
    function getPointerSVGCoords(evt) {
        const pt = svg.createSVGPoint();
        pt.x = evt.clientX;
        pt.y = evt.clientY;
        const screenCTM = svg.getScreenCTM();
        if (!screenCTM) return { x: 0, y: 0 };
        const inv = screenCTM.inverse();
        const loc = pt.matrixTransform(inv);
        // Because we have a scale transform on gRoot, need to account for it
        const localX = (loc.x) / scale;
        const localY = (loc.y) / scale;
        return { x: localX, y: localY };
    }

    // Generate positions for players
    function generatePositions() {
        const left = courtPadding + 80;
        const right = WIDTH - courtPadding - 80;
        const centerX = WIDTH / 2;
        // For each side: three columns (left, center, right) and two rows (front near net, back near baseline)
        const topAreaTop = courtPadding + 60;
        const topAreaBottom = centerY - 70;
        const bottomAreaTop = centerY + 70;
        const bottomAreaBottom = HEIGHT - courtPadding - 60;

        // For simplicity, compute grid x positions: left, middle, right
        const xs = [left, centerX, right];
        // For each side rows, y positions front and back
        const topYs = [topAreaBottom - 40, topAreaTop + 40]; // front row nearer net is lower y (closer to center)
        const bottomYs = [bottomAreaTop + 40, bottomAreaBottom - 40];

        // We'll place players in order matching rotation specified:
        // Bottom (red) starting rotation (bottom is lower half):
        // Row arrangement asked:
        // Bottom (starting rotation on the bottom should look like):
        // OPP, M, OH
        // OH, M, S
        // So top row (front?) they show OPP, M, OH then next row OH, M, S — interpret as two rows: front row (near net) is top row of that side
        const bottomOrder = [
            { label: 'OPP', x: xs[0], y: bottomYs[0] },
            { label: 'M', x: xs[1], y: bottomYs[0] },
            { label: 'OH', x: xs[2], y: bottomYs[0] },
            { label: 'OH', x: xs[0], y: bottomYs[1] },
            { label: 'M', x: xs[1], y: bottomYs[1] },
            { label: 'S', x: xs[2], y: bottomYs[1] }
        ];

        // Top:
        // S, M, OH
        // OH, M, OPP
        const topOrder = [
            { label: 'S', x: xs[0], y: topYs[0] },
            { label: 'M', x: xs[1], y: topYs[0] },
            { label: 'OH', x: xs[2], y: topYs[0] },
            { label: 'OH', x: xs[0], y: topYs[1] },
            { label: 'M', x: xs[1], y: topYs[1] },
            { label: 'OPP', x: xs[2], y: topYs[1] }
        ];

        return { topOrder, bottomOrder };
    }

    // Add players to SVG
    const playersGroup = document.createElementNS(svgNS, 'g');
    playersGroup.setAttribute('id', 'players-group');
    gRoot.appendChild(playersGroup);

    function clearHighlights() {
        document.querySelectorAll('#players-group .player circle').forEach(c => {
            c.setAttribute('stroke-width', '3');
        });
    }

    function initPlayers() {
        const { topOrder, bottomOrder } = generatePositions();
        // top team blue (fill blue), bottom team red (fill red)
        topOrder.forEach((p, i) => {
            const id = `top-${i+1}`;
            const comp = createPlayer(p.x, p.y, '#007aff', p.label, id);
            playersGroup.appendChild(comp);
        });
        bottomOrder.forEach((p, i) => {
            const id = `bottom-${i+1}`;
            const comp = createPlayer(p.x, p.y, '#ff3b30', p.label, id);
            playersGroup.appendChild(comp);
        });
    }

    initPlayers();

    // Drawings group (user-created shapes)
    const drawingsGroup = document.createElementNS(svgNS, 'g');
    drawingsGroup.setAttribute('id', 'drawings-group');
    gRoot.appendChild(drawingsGroup);

    // Drawing state
    let currentDrawing = null;
    let origPoint = null;

    // Tool button wiring
    function setTool(t) {
        tool = t;
        document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('bg-gray-200','dark:bg-gray-700'));
        const el = {
            'select': document.getElementById('tool-select'),
            'line': document.getElementById('tool-line'),
            'circle': document.getElementById('tool-circle'),
            'free': document.getElementById('tool-free')
        }[t];
        if (el) el.classList.add('bg-gray-200', 'dark:bg-gray-700');
    }

    document.getElementById('tool-select').addEventListener('click', () => setTool('select'));
    document.getElementById('tool-line').addEventListener('click', () => setTool('line'));
    document.getElementById('tool-circle').addEventListener('click', () => setTool('circle'));
    document.getElementById('tool-free').addEventListener('click', () => setTool('free'));

    // color buttons
    document.querySelectorAll('.color-btn').forEach(b => {
        b.addEventListener('click', () => {
            document.querySelectorAll('.color-btn').forEach(x => x.classList.remove('bg-gray-200','dark:bg-gray-700'));
            b.classList.add('bg-gray-200','dark:bg-gray-700');
            drawColor = b.getAttribute('data-color');
        });
    });
    // initialize first color highlight
    document.querySelectorAll('.color-btn')[0].classList.add('bg-gray-200','dark:bg-gray-700');

    // zoom buttons
    function applyTransformation() {
        gPan.setAttribute('transform', `translate(${panX},${panY})`);
        gRoot.setAttribute('transform', `scale(${scale})`);
    }

    document.getElementById('zoom-in').addEventListener('click', () => {
        scale = Math.min(MAX_SCALE, scale * SCALE_STEP);
        applyTransformation();
    });
    document.getElementById('zoom-out').addEventListener('click', () => {
        scale = Math.max(MIN_SCALE, scale / SCALE_STEP);
        applyTransformation();
    });


    // --- Pan (drag background) ---
    let panning = false;
    let panStart = null;

    svg.addEventListener('pointerdown', (e) => {
        if (tool !== 'select') return;   // ⬅ only allow pan in select mode
        if (e.target === svg || e.target === courtRect) {
            panning = true;
            const pt = getPointerSVGCoords(e);
            panStart = { x: pt.x, y: pt.y, panX, panY };
            e.preventDefault();
        }
    });

    svg.addEventListener('pointermove', (e) => {
        if (!panning) return;
        const pt = getPointerSVGCoords(e);
        panX = panStart.panX + (pt.x - panStart.x) * scale; // scale factor
        panY = panStart.panY + (pt.y - panStart.y) * scale;
        applyTransformation();
    });

    svg.addEventListener('pointerup', () => {
        panning = false;
    });

    // clear drawings
    document.getElementById('clear-draw').addEventListener('click', () => {
        while (drawingsGroup.firstChild) drawingsGroup.removeChild(drawingsGroup.firstChild);
        currentDrawing = null;
    });

    // SVG drawing handlers
    let freePathPoints = [];
    svg.addEventListener('pointerdown', (e) => {
        // if clicked on player circle, don't start drawing (players handle their own pointerdown)
        if (e.target.closest && e.target.closest('.player')) return;
        // prevent text selection
        e.preventDefault();
        const p = getPointerSVGCoords(e);
        if (tool === 'line') {
            const line = document.createElementNS(svgNS, 'line');
            line.setAttribute('x1', p.x);
            line.setAttribute('y1', p.y);
            line.setAttribute('x2', p.x);
            line.setAttribute('y2', p.y);
            line.setAttribute('stroke', drawColor);
            line.setAttribute('stroke-width', '4');
            line.setAttribute('stroke-linecap', 'round');
            line.setAttribute('data-tool', 'line');
            drawingsGroup.appendChild(line);
            currentDrawing = line;
            origPoint = p;
        } else if (tool === 'circle') {
            const circ = document.createElementNS(svgNS, 'circle');
            circ.setAttribute('cx', p.x);
            circ.setAttribute('cy', p.y);
            circ.setAttribute('r', 0);
            circ.setAttribute('stroke', drawColor);
            circ.setAttribute('fill', 'transparent');
            circ.setAttribute('stroke-width', '4');
            circ.setAttribute('data-tool', 'circle');
            drawingsGroup.appendChild(circ);
            currentDrawing = circ;
            origPoint = p;
        } else if (tool === 'free') {
            freePathPoints = [p];
            const path = document.createElementNS(svgNS, 'path');
            path.setAttribute('d', `M ${p.x} ${p.y}`);
            path.setAttribute('stroke', drawColor);
            path.setAttribute('fill', 'none');
            path.setAttribute('stroke-width', '4');
            path.setAttribute('stroke-linecap', 'round');
            path.setAttribute('stroke-linejoin', 'round');
            path.setAttribute('data-tool', 'free');
            drawingsGroup.appendChild(path);
            currentDrawing = path;
        } else {
            // select tool: clicking empty space clears highlight
            clearHighlights();
        }
    });

    svg.addEventListener('pointermove', (e) => {
        if (!currentDrawing) return;
        const p = getPointerSVGCoords(e);
        const dt = currentDrawing.getAttribute('data-tool');
        if (dt === 'line') {
            currentDrawing.setAttribute('x2', p.x);
            currentDrawing.setAttribute('y2', p.y);
        } else if (dt === 'circle') {
            const dx = p.x - origPoint.x;
            const dy = p.y - origPoint.y;
            const r = Math.sqrt(dx * dx + dy * dy);
            currentDrawing.setAttribute('r', r);
        } else if (dt === 'free') {
            freePathPoints.push(p);
            const d = freePathPoints.map((pt, i) => (i === 0 ? `M ${pt.x} ${pt.y}` : `L ${pt.x} ${pt.y}`)).join(' ');
            currentDrawing.setAttribute('d', d);
        }
    });

    svg.addEventListener('pointerup', (e) => {
        if (!currentDrawing) return;
        // finalize
        // small optimizations: if line degenerate, remove
        const dt = currentDrawing.getAttribute('data-tool');
        if (dt === 'line') {
            const x1 = parseFloat(currentDrawing.getAttribute('x1'));
            const y1 = parseFloat(currentDrawing.getAttribute('y1'));
            const x2 = parseFloat(currentDrawing.getAttribute('x2'));
            const y2 = parseFloat(currentDrawing.getAttribute('y2'));
            if (Math.hypot(x2 - x1, y2 - y1) < 4) currentDrawing.remove();
        } else if (dt === 'circle') {
            const r = parseFloat(currentDrawing.getAttribute('r') || 0);
            if (r < 2) currentDrawing.remove();
        } else if (dt === 'free') {
            // nothing
        }
        currentDrawing = null;
        freePathPoints = [];
        origPoint = null;
    });

    // Clicking background clears highlight (already handled)
    svg.addEventListener('click', (e) => {
        if (e.target === svg) clearHighlights();
    });

    // Make SVG responsive to container resizing
    function resizeSVG() {
        // Nothing required; using preserveAspectRatio and viewBox handles it.
    }
    window.addEventListener('resize', resizeSVG);

    // initial tool highlight
    setTool('select');

    // Accessibility: keyboard shortcuts
    window.addEventListener('keydown', (e) => {
        if (e.key === '1') setTool('select');
        if (e.key === '2') setTool('line');
        if (e.key === '3') setTool('circle');
        if (e.key === '4') setTool('free');
        if (e.key === '+') {
            scale = Math.min(MAX_SCALE, scale * SCALE_STEP);
            applyTransformation();
        }
        if (e.key === '-') {
            scale = Math.max(MIN_SCALE, scale / SCALE_STEP);
            applyTransformation();
        }
    });

    // Prevent gestures from interfering on mobile (simple)
    svg.style.touchAction = 'none';

    // --- Reset players button ---
    document.getElementById('reset-players').addEventListener('click', () => {
        // Clear existing players
        while (playersGroup.firstChild) playersGroup.removeChild(playersGroup.firstChild);
        // Re-init
        initPlayers();
    });

})();
