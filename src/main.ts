import "./style.css";

// ========== DOM setup ========== //
document.body.innerHTML = `
  <h1>Temp Heading</h1>
`;

const canvas = document.createElement("canvas");
canvas.width = 256;
canvas.height = 256;
document.body.append(canvas);

const ctx = canvas.getContext("2d")!;

const cursor = { active: false, x: 0, y: 0 };

const linesDraw: Draw[] = [];
const redoStack: Draw[] = [];
let currentCommand: Draggable | null = null;

// ========== Display Commands ========== //
interface Draw {
  display(ctx: CanvasRenderingContext2D): void;
}

interface Draggable extends Draw {
  drag(x: number, y: number): void;
}

class DrawLines implements Draggable {
  points: { x: number; y: number }[] = [];

  constructor(startX: number, startY: number) {
    this.points.push({ x: startX, y: startY });
  }

  // grow/extend the drawing by adding points
  drag(x: number, y: number): void {
    this.points.push({ x, y });
  }

  display(ctx: CanvasRenderingContext2D) {
    if (this.points.length === 0) return;

    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#222";
    ctx.fillStyle = "#222";

    if (this.points.length === 1) {
      const p = this.points[0];
      ctx.beginPath();
      ctx.arc(p.x, p.y, ctx.lineWidth / 2, 0, Math.PI * 2);
      ctx.fill();
      return;
    }

    ctx.beginPath();
    ctx.moveTo(this.points[0].x, this.points[0].y);
    for (let i = 1; i < this.points.length; i++) {
      ctx.lineTo(this.points[i].x, this.points[i].y);
    }
    ctx.stroke();
  }
}
// ========== Functions ========== //
function notifyChange() {
  canvas.dispatchEvent(new Event("drawing-changed"));

  // debug output
  console.clear();
  console.log("Lines: ", linesDraw);
  console.log("Redo Stack: ", redoStack);
}

function redraw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (const draw of linesDraw) {
    draw.display(ctx);
  }
}

// ========== Event Listeners ========== //
canvas.addEventListener("drawing-changed", redraw);

canvas.addEventListener("mousedown", (e) => {
  cursor.active = true;
  cursor.x = e.offsetX;
  cursor.y = e.offsetY;

  redoStack.length = 0; // Clear redo stack on new actions

  currentCommand = new DrawLines(cursor.x, cursor.y);
  linesDraw.push(currentCommand);

  notifyChange();
});

canvas.addEventListener("mousemove", (e) => {
  if (!cursor.active || !currentCommand) return;
  cursor.x = e.offsetX;
  cursor.y = e.offsetY;

  currentCommand.drag(cursor.x, cursor.y);

  notifyChange();
});

canvas.addEventListener("mouseup", (_e) => {
  cursor.active = false;
  currentCommand = null;

  notifyChange();
});

// ========== UI Controls ========== //
document.body.append(document.createElement("br"));

// UNDO BTN
const undoButton = document.createElement("button");
undoButton.innerHTML = "Undo";
document.body.append(undoButton);

undoButton.addEventListener("click", () => {
  if (linesDraw.length === 0) return;
  const undoneLine = linesDraw.pop()!;
  redoStack.push(undoneLine);
  currentCommand = null;
  notifyChange();
});

// REDO BTN
const redoButton = document.createElement("button");
redoButton.innerHTML = "Redo";
document.body.append(redoButton);

redoButton.addEventListener("click", () => {
  if (redoStack.length === 0) return;
  const redoneLine = redoStack.pop()!;
  linesDraw.push(redoneLine);
  currentCommand = null;
  notifyChange();
});

// CLEAR BTN
const clearButton = document.createElement("button");
clearButton.innerHTML = "Clear";
document.body.append(clearButton);

clearButton.addEventListener("click", () => {
  linesDraw.length = 0;
  redoStack.length = 0;
  currentCommand = null;
  notifyChange();
});

document.body.append(document.createElement("br"));

// THIN MARKER BTN
const thinButton = document.createElement("button");
thinButton.innerHTML = "Thin Marker";
document.body.append(thinButton);

thinButton.addEventListener("click", () => {
  console.log("Thin Marker Selected");
});

// THICK MARKER BTN
const thickButton = document.createElement("button");
thickButton.innerHTML = "Thick Marker";
document.body.append(thickButton);

thickButton.addEventListener("click", () => {
  console.log("Thick Marker Selected");
});
