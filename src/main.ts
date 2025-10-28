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

// draft
const linesDraw: Draw[] = [];
const redoStackDraft: Draw[] = [];
let currentCommand: Draggable | null = null;

// ========== Display Commands ========== //
interface Draw {
  display(ctx: CanvasRenderingContext2D): void;
}

interface Draggable extends Draw {
  drag(x: number, y: number): void;
}

class drawLines implements Draggable {
  points: { x: number; y: number }[] = [];

  constructor(
    startY: number,
    startX: number,
  ) {
    this.points.push({ x: startX, y: startY });
  }

  // grow/extend the drawing by adding points
  drag(x: number, y: number): void {
    this.points.push({ x, y });
  }

  isEmpty() {
    return this.points.length === 0;
  }

  display(ctx: CanvasRenderingContext2D) {
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#222";
    ctx.fillStyle = "#222";

    ctx.beginPath();
    const { x, y } = this.points[0];
    ctx.moveTo(x, y);
    for (const { x, y } of this.points) {
      ctx.lineTo(x, y);
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
  console.log("Redo Stack: ", redoStackDraft);
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

  redoStackDraft.length = 0; // Clear redo stack on new actions

  currentCommand = new drawLines(cursor.x, cursor.y);
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

const undoButton = document.createElement("button");
undoButton.innerHTML = "Undo";
document.body.append(undoButton);

undoButton.addEventListener("click", () => {
  if (linesDraw.length === 0) return;
  const undoneLine = linesDraw.pop()!;
  redoStackDraft.push(undoneLine);
  currentCommand = null;
  notifyChange();
});

const redoButton = document.createElement("button");
redoButton.innerHTML = "Redo";
document.body.append(redoButton);

redoButton.addEventListener("click", () => {
  if (redoStackDraft.length === 0) return;
  const redoneLine = redoStackDraft.pop()!;
  linesDraw.push(redoneLine);
  currentCommand = null;
  notifyChange();
});

const clearButton = document.createElement("button");
clearButton.innerHTML = "Clear";
document.body.append(clearButton);

clearButton.addEventListener("click", () => {
  linesDraw.length = 0;
  redoStackDraft.length = 0;
  currentCommand = null;
  notifyChange();
});
