export function heartBg() {
    // Heart-bg component: concentric heart outlines that follow the cursor.
    // Ported from the arranca-coracoes Heart prototype (index.html, no pulse).
    // The whole shape moves toward the cursor. All lines aim at the same spot, but the outer lines
    // have more inertia, so they trail behind while the cursor moves and settle back into concentric
    // rings once it stops. data-depth on each .heart-bg_layer is its position, 0 = innermost
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

    // ===== Setup ===============================================================
    const N = layers.length;
    const pointer = { x: 0, y: 0 };                          // cursor position, -1..1 from the screen centre
    const offsets = layers.map(() => ({ x: 0, y: 0 }));      // where each line currently is
    const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

    // 0 for the innermost line, 1 for the outermost
    const farness = el => +el.dataset.depth / (N - 1);

    // Resting opacity: the SVG's own opacity, dimmed a bit more towards the outside
    layers.forEach(el => {
        const original = parseFloat(el.getAttribute('opacity') || '1');
        el.style.opacity = original * (REST_INNER + (REST_OUTER - REST_INNER) * farness(el));
    });

    // Reduced motion: the lines stay concentric, so there is nothing to animate
    if (reduceMotion) return;

    window.addEventListener('pointermove', e => {
        pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
        pointer.y = (e.clientY / window.innerHeight) * 2 - 1;
    });
    document.documentElement.addEventListener('pointerleave', () => { pointer.x = pointer.y = 0; });

    // ===== Animation loop ======================================================
    (function frame() {
        // Every line chases the same target...
        const targetX = pointer.x * TRAVEL;
        const targetY = pointer.y * TRAVEL;

        layers.forEach((el, i) => {
            // ...but outer lines close the gap more slowly: that lag is the echo trail
            const ease = EASE_INNER - el.dataset.depth * EASE_STEP;
            const pos = offsets[i];
            pos.x += (targetX - pos.x) * ease;
            pos.y += (targetY - pos.y) * ease;
            el.style.transform = `translate(${pos.x}px, ${pos.y}px)`;
        });
        requestAnimationFrame(frame);
    })();
}
