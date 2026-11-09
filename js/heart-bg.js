export function heartBg() {
    // Heart-bg component: concentric heart outlines that follow the cursor, with an outward pulse.
    // Ported from the arranca-coracoes Heart prototype (index-pulse.html).
    // The whole shape moves toward the cursor. All lines aim at the same spot, but the outer lines
    // have more inertia, so they trail behind while the cursor moves and settle back into concentric
    // rings once it stops. Every few seconds a soft pulse travels outward through the lines: each line
    // grows a little and brightens as it passes (inner lines get a short, dry kick; outer lines a bigger,
    // softer swell). data-depth on each .heart-bg_layer is its position, 0 = innermost
    const layers = [...document.querySelectorAll('.heart-bg_layer')];
    if (!layers.length) return;

    // ===== Settings ============================================================
    // Cursor follow
    const TRAVEL = 70;            // px the shape shifts when the cursor is at a screen edge
    const EASE_INNER = 0.065;     // follow speed of the innermost line (share of the gap closed per frame)
    const EASE_STEP = 0.0066;     // each line further out follows this much slower (keep EASE_INNER - 9 * EASE_STEP > 0)

    // Resting look: multipliers on each line's original opacity, blended from inner to outer
    const REST_INNER = 0.8;
    const REST_OUTER = 0.5;

    // Pulse timing
    const FIRST_PULSE = 0.6;      // seconds after load until the first pulse
    const PULSE_EVERY = 6;        // seconds between pulses
    const PULSE_TIME = 5;         // seconds for one pulse to travel from the innermost to the outermost line

    // Pulse travel: a fast "drum hit" at the start, then a slow, steady travel outward
    const FAST_SHARE = 0.25;      // share of the pulse's distance covered by the fast hit
    const FAST_RATE = 22;         // how abrupt that hit is (bigger = snappier, over sooner)
    const PULSE_SLOWDOWN = 0.21;  // shape of the slow travel (0 = constant speed, bigger = slows down more outwards)

    // Pulse shape: how a line reacts as the pulse passes over it
    const PULSE_WIDTH = 1.1;      // how many lines the pulse spans at the centre (bigger = softer)
    const OUTER_SOFTEN = 1.5;     // the pulse gets this much wider by the outermost line
    const INNER_TIGHTEN = 0.58;   // the pulse is this much narrower at the innermost line (a briefer flash)
    const SCALE_INNER = 0.008;    // how much the innermost line grows at the peak (0.8%)
    const SCALE_OUTER = 0.05;     // how much the outermost line grows at the peak (5%); blended in between
    const PULSE_GLOW = 0.7;       // extra opacity at the peak
    const OUTER_STRENGTH = 0.06;  // brightness effect on the outermost line, as a share of the inner line's
    const OPACITY_FALL = 1.6;     // brightness drops back this much faster than size does (1 = same speed)

    // Internal: keep the pulse starting and ending at zero strength so nothing pops
    const FADE_IN = 0.02;                                       // share of PULSE_TIME spent fading the pulse in
    const LEAD_IN = PULSE_WIDTH * 2;                            // lines of run-up before the pulse reaches the innermost line
    const LEAD_OUT = PULSE_WIDTH * (1 + OUTER_SOFTEN) * 3.5;    // lines of run-out after the outermost line, so it fully relaxes

    // ===== Setup ===============================================================
    const N = layers.length;
    const pointer = { x: 0, y: 0 };                          // cursor position, -1..1 from the screen centre
    const offsets = layers.map(() => ({ x: 0, y: 0 }));      // where each line currently is
    const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

    // ===== Helpers =============================================================
    // 0 for the innermost line, 1 for the outermost
    const farness = el => +el.dataset.depth / (N - 1);

    // Bell curve: 1 at x = 0, fading to 0 either side
    const bell = x => Math.exp(-x * x / 2);

    // 0 -> 1 as x goes from a to b, with soft ends
    const smoothstep = (a, b, x) => {
        const u = Math.min(1, Math.max(0, (x - a) / (b - a)));
        return u * u * (3 - 2 * u);
    };

    // Resting opacity: the SVG's own opacity, dimmed a bit more towards the outside
    const restingOpacity = (el, far) =>
        parseFloat(el.getAttribute('opacity') || '1') * (REST_INNER + (REST_OUTER - REST_INNER) * far);

    layers.forEach(el => { el.style.opacity = restingOpacity(el, farness(el)); });

    // Reduced motion: no cursor follow and no pulse, so there is nothing to animate
    if (reduceMotion) return;

    // Desktop pointer tracking: pointer.x/y are -1..1 from the screen centre, 0 at rest
    if (window.innerWidth > 991) {
        window.addEventListener('pointermove', e => {
            pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
            pointer.y = (e.clientY / window.innerHeight) * 2 - 1;
        });
        document.documentElement.addEventListener('pointerleave', () => { pointer.x = pointer.y = 0; });
    }

    // Lines grow around the centre of the innermost outline
    const inner = layers.find(el => el.dataset.depth === '0') || layers[0];
    const innerBox = inner.querySelector('path').getBBox();
    const centreX = innerBox.x + innerBox.width / 2;
    const centreY = innerBox.y + innerBox.height / 2;

    // Where the pulse is, `seconds` after the page loaded.
    //   front    - its position in "line numbers" (0 = on the innermost line, 9 = on the outermost)
    //   strength - 0..1, so it fades in rather than popping on
    function pulseAt(seconds) {
        if (seconds < FIRST_PULSE) return { front: -99, strength: 0 };
        const sinceStart = (seconds - FIRST_PULSE) % PULSE_EVERY;
        const progress = sinceStart / PULSE_TIME;                  // 0..1 over one pulse
        if (progress > 1) return { front: -99, strength: 0 };      // between pulses

        // Slow travel: always decelerating, never stops, so lines relax at the speed the front leaves them
        const slow = (1 - Math.exp(-PULSE_SLOWDOWN * progress)) / (1 - Math.exp(-PULSE_SLOWDOWN));
        // Fast hit: covers its share almost instantly
        const fast = (1 - Math.exp(-FAST_RATE * progress)) / (1 - Math.exp(-FAST_RATE));
        const distance = LEAD_IN + (N - 1) + LEAD_OUT;
        return {
            front: -LEAD_IN + (FAST_SHARE * fast + (1 - FAST_SHARE) * slow) * distance,
            strength: smoothstep(0, FADE_IN, progress),
        };
    }

    // ===== Animation loop ======================================================
    const startTime = performance.now();

    (function frame(now) {
        const seconds = (now - startTime) / 1000;

        // Cursor follow: every line chases the same target...
        const targetX = pointer.x * TRAVEL;
        const targetY = pointer.y * TRAVEL;
        const pulse = pulseAt(seconds);

        layers.forEach((el, i) => {
            const depth = +el.dataset.depth;
            const far = farness(el);

            // ...but outer lines close the gap more slowly: that lag is the echo trail
            const ease = EASE_INNER - depth * EASE_STEP;
            const pos = offsets[i];
            pos.x += (targetX - pos.x) * ease;
            pos.y += (targetY - pos.y) * ease;

            // How far this line is from the pulse front, in pulse widths.
            // Positive = the pulse hasn't reached it yet, negative = it has already passed
            const width = PULSE_WIDTH * (1 + OUTER_SOFTEN * far) * (1 - INNER_TIGHTEN * Math.pow(1 - far, 3));
            const away = (depth - pulse.front) / width;

            // Size: symmetric bump, bigger on the outer lines
            const sizeBump = bell(away) * pulse.strength;
            const scale = 1 + (SCALE_INNER + (SCALE_OUTER - SCALE_INNER) * far) * sizeBump;

            // Brightness: same bump, but a steeper way back down, and weaker on the outer lines
            const brightAway = away < 0 ? away * OPACITY_FALL : away;
            const outerFade = 1 - (1 - OUTER_STRENGTH) * far * far;
            const brightBump = bell(brightAway) * pulse.strength * outerFade;

            el.style.transform =
                `translate(${pos.x}px, ${pos.y}px) translate(${centreX}px, ${centreY}px) scale(${scale}) translate(${-centreX}px, ${-centreY}px)`;
            el.style.opacity = Math.min(1, restingOpacity(el, far) + PULSE_GLOW * brightBump);
        });
        requestAnimationFrame(frame);
    })(performance.now());
}
