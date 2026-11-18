// Keyboard + mouse input, kept as plain state the game loop reads each frame.
export function createInput(canvas) {
  const input = {
    keys: new Set(),
    mouseX: 640,
    mouseY: 400,
    mouseDown: false,
    clicked: null,      // {x, y} consumed once per click
    pressedKeys: new Set(), // edge-triggered keys, consumed by the loop
  };

  function keyName(e) {
    return e.key.toLowerCase();
  }

  window.addEventListener('keydown', (e) => {
    const k = keyName(e);
    if ([' ', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(k)) e.preventDefault();
    if (!input.keys.has(k)) input.pressedKeys.add(k);
    input.keys.add(k);
  });
  window.addEventListener('keyup', (e) => input.keys.delete(keyName(e)));
  window.addEventListener('blur', () => { input.keys.clear(); input.mouseDown = false; });

  function trackMouse(e) {
    const r = canvas.getBoundingClientRect();
    input.mouseX = ((e.clientX - r.left) / r.width) * 1280;
    input.mouseY = ((e.clientY - r.top) / r.height) * 800;
  }
  canvas.addEventListener('mousemove', trackMouse);
  canvas.addEventListener('mousedown', (e) => {
    trackMouse(e);
    input.mouseDown = true;
    input.clicked = { x: input.mouseX, y: input.mouseY };
  });
  window.addEventListener('mouseup', () => { input.mouseDown = false; });
  canvas.addEventListener('contextmenu', (e) => e.preventDefault());

  input.down = (...names) => names.some((n) => input.keys.has(n));
  input.wasPressed = (name) => input.pressedKeys.has(name);
  input.endFrame = () => { input.pressedKeys.clear(); input.clicked = null; };
  input.moveVector = () => {
    let x = 0, y = 0;
    if (input.down('a', 'arrowleft')) x -= 1;
    if (input.down('d', 'arrowright')) x += 1;
    if (input.down('w', 'arrowup')) y -= 1;
    if (input.down('s', 'arrowdown')) y += 1;
    if (x !== 0 && y !== 0) { x *= 0.7071; y *= 0.7071; }
    return { x, y };
  };
  return input;
}
