// Small visual effects: confetti, sparkle bursts and retriggerable CSS bumps.
const fx = (() => {
  const calm = matchMedia('(prefers-reduced-motion: reduce)');
  const colors = ['#ffcf62', '#f39a3d', '#16716e', '#53a981', '#ef6f6c', '#7cc6e8', '#fff3c4'];

  function bump(element, className = 'bump') {
    if (!element) return;
    element.classList.remove(className);
    void element.offsetWidth; // restart the animation
    element.classList.add(className);
    element.addEventListener('animationend', () => element.classList.remove(className), { once: true });
  }

  // Stars that fly out from the middle of an element.
  function burst(element, { count = 10, symbols = ['★', '✦', '•'], spread = 90 } = {}) {
    if (!element || calm.matches) return;
    const layer = document.createElement('span');
    layer.className = 'fx-burst';
    layer.setAttribute('aria-hidden', 'true');
    for (let i = 0; i < count; i++) {
      const piece = document.createElement('i');
      const angle = (i / count) * Math.PI * 2 + Math.random() * 0.5;
      const distance = spread * (0.6 + Math.random() * 0.6);
      piece.textContent = symbols[i % symbols.length];
      piece.style.setProperty('--x', Math.cos(angle) * distance + 'px');
      piece.style.setProperty('--y', Math.sin(angle) * distance + 'px');
      piece.style.setProperty('--r', (Math.random() * 300 - 150) + 'deg');
      piece.style.color = colors[i % colors.length];
      piece.style.animationDelay = Math.random() * 80 + 'ms';
      layer.append(piece);
    }
    element.append(layer);
    setTimeout(() => layer.remove(), 1100);
  }

  // Paper confetti over the whole screen. `host` must be in the top layer
  // (an open dialog) so the pieces are drawn above the dialog backdrop.
  function confetti(host, { count = 140, duration = 3200 } = {}) {
    if (!host || calm.matches) return;
    const canvas = document.createElement('canvas');
    canvas.className = 'fx-confetti';
    canvas.setAttribute('aria-hidden', 'true');
    host.append(canvas);
    const context = canvas.getContext('2d');
    const scale = Math.min(2, window.devicePixelRatio || 1);
    const width = canvas.width = innerWidth * scale;
    const height = canvas.height = innerHeight * scale;
    const pieces = Array.from({ length: count }, (_, i) => {
      const fromLeft = i % 2 === 0;
      return {
        x: fromLeft ? -10 * scale : width + 10 * scale,
        y: height * (0.55 + Math.random() * 0.35),
        vx: (fromLeft ? 1 : -1) * (4 + Math.random() * 9) * scale,
        vy: -(11 + Math.random() * 11) * scale,
        size: (6 + Math.random() * 7) * scale,
        spin: Math.random() * Math.PI,
        turn: (Math.random() - 0.5) * 0.35,
        wobble: Math.random() * 10,
        color: colors[i % colors.length],
        round: Math.random() < 0.25
      };
    });
    const start = performance.now();
    let last = start;
    function frame(now) {
      const step = Math.min(2.5, (now - last) / 16.7);
      last = now;
      const age = now - start;
      context.clearRect(0, 0, width, height);
      context.globalAlpha = Math.min(1, (duration - age) / 600);
      for (const p of pieces) {
        p.vy += 0.38 * scale * step;
        p.vx *= Math.pow(0.985, step);
        p.vy = Math.min(p.vy, 5.5 * scale);
        p.x += (p.vx + Math.sin(p.wobble + age / 260) * 0.8 * scale) * step;
        p.y += p.vy * step;
        p.spin += p.turn * step;
        context.save();
        context.translate(p.x, p.y);
        context.rotate(p.spin);
        context.fillStyle = p.color;
        if (p.round) {
          context.beginPath();
          context.arc(0, 0, p.size * 0.4, 0, Math.PI * 2);
          context.fill();
        } else {
          context.scale(1, Math.cos(p.spin * 2));
          context.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        }
        context.restore();
      }
      if (age < duration && canvas.isConnected) requestAnimationFrame(frame);
      else canvas.remove();
    }
    requestAnimationFrame(frame);
  }

  return { bump, burst, confetti };
})();
