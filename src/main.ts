import "./style.css";

document.body.innerHTML = `
  <h1>Temp Heading</h1>
`;

const canvas = document.createElement("canvas");
canvas.width = 256;
canvas.height = 256;
document.body.append(canvas);

const ctx = canvas.getContext("2d")!;

const cursor = { active: false, x: 0, y: 0 };

const lines: { x: number; y: number }[][] = [];
let currentLine: { x: number; y: number }[] | null = null;
const redoStack: { x: number; y: number }[][] = [];

function notifyChange() {
  canvas.dispatchEvent(new Event("drawing-changed"));

  // debug output
  console.clear();
  console.log("Lines Array: ", JSON.stringify(lines));
  console.log("Redo Stack: ", JSON.stringify(redoStack));
}

function redraw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Styling can be adjusted here
  ctx.lineWidth = 3;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = "#222";
  ctx.fillStyle = "#222";

  for (const line of lines) {
    if (line.length === 0) continue;

    if (line.length === 1) {
      // Single-click "dot"
      const p = line[0];
      ctx.beginPath();
      ctx.arc(p.x, p.y, 1.5, 0, Math.PI * 2);
      ctx.fill();
      continue;
    }

    ctx.beginPath();
    ctx.moveTo(line[0].x, line[0].y);
    for (let i = 1; i < line.length; i++) {
      ctx.lineTo(line[i].x, line[i].y);
    }
    ctx.stroke();
  }
}

canvas.addEventListener("drawing-changed", redraw);

canvas.addEventListener("mousedown", (e) => {
  cursor.active = true;
  cursor.x = e.offsetX;
  cursor.y = e.offsetY;

  redoStack.length = 0; // Clear redo stack on new action

  currentLine = [];
  lines.push(currentLine);
  currentLine.push({ x: cursor.x, y: cursor.y });

  notifyChange();
});

canvas.addEventListener("mousemove", (e) => {
  if (cursor.active) {
    cursor.x = e.offsetX;
    cursor.y = e.offsetY;
    currentLine!.push({ x: cursor.x, y: cursor.y });

    notifyChange();
  }
});

canvas.addEventListener("mouseup", (_e) => {
  cursor.active = false;
  currentLine = null;

  notifyChange();
});

document.body.append(document.createElement("br"));

const undoButton = document.createElement("button");
undoButton.innerHTML = "Undo";
document.body.append(undoButton);

undoButton.addEventListener("click", () => {
  if (lines.length === 0) return;
  const undoneLine = lines.pop()!;
  redoStack.push(undoneLine);
  currentLine = null;
  notifyChange();
});

const redoButton = document.createElement("button");
redoButton.innerHTML = "Redo";
document.body.append(redoButton);

redoButton.addEventListener("click", () => {
  if (redoStack.length === 0) return;
  const redoneLine = redoStack.pop()!;
  lines.push(redoneLine);
  currentLine = null;
  notifyChange();
});

const clearButton = document.createElement("button");
clearButton.innerHTML = "Clear";
document.body.append(clearButton);

clearButton.addEventListener("click", () => {
  lines.length = 0;
  redoStack.length = 0;
  currentLine = null;
  notifyChange();
});
