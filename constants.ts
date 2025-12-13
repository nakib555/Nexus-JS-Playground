export const INITIAL_CODE = `// Welcome to Nexus Playground
// You have access to a standard DOM environment.
// 1. Use console.log() to print to the console panel.
// 2. Attach elements to 'root' to render visuals.

console.log("Initializing visual environment...");

// Clear any previous styles
root.style.display = 'flex';
root.style.justifyContent = 'center';
root.style.alignItems = 'center';
root.style.background = 'radial-gradient(circle at center, #1e1b4b, #020617)';
root.style.height = '100%';

// Create a dynamic element
const circle = document.createElement('div');
circle.style.width = '100px';
circle.style.height = '100px';
circle.style.borderRadius = '50%';
circle.style.background = 'linear-gradient(45deg, #f43f5e, #6366f1)';
circle.style.boxShadow = '0 0 30px rgba(99, 102, 241, 0.5)';
circle.style.transition = 'transform 0.1s ease';
circle.style.cursor = 'pointer';

// Add interaction
let scale = 1;
circle.addEventListener('click', () => {
  scale += 0.2;
  circle.style.transform = \`scale(\${scale})\`;
  console.log(\`Circle clicked! New scale: \${scale.toFixed(1)}\`);
  
  const msg = document.createElement('div');
  msg.textContent = '+';
  msg.style.position = 'absolute';
  msg.style.color = 'white';
  msg.style.pointerEvents = 'none';
  msg.style.animation = 'floatUp 1s ease-out forwards';
  circle.appendChild(msg);
});

// Add animation logic
let hue = 0;
function animate() {
  if (!document.body.contains(circle)) return; // Stop if removed
  hue = (hue + 1) % 360;
  circle.style.filter = \`hue-rotate(\${hue}deg)\`;
  requestAnimationFrame(animate);
}

root.appendChild(circle);
console.log("Animation started.");
animate();
`;

export const EDITOR_THEME = {
  background: 'bg-gray-950',
  gutter: 'bg-gray-900',
  lineNo: 'text-gray-600',
  text: 'text-gray-100',
  cursor: 'border-blue-500',
};