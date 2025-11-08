import "./style.css";

// ========== DOM setup ========== //
document.body.innerHTML = `
  <h1>Temp Heading</h1>
`;

const canvas = document.createElement("canvas");
canvas.width = 256;
canvas.height = 256;
canvas.style.cursor = "none";
document.body.append(canvas);

document.body.append(document.createElement("br"));

// UNDO, REDO, AND CLEAR BTN
const undoButton = document.createElement("button");
undoButton.innerHTML = "Undo";
document.body.append(undoButton);

const redoButton = document.createElement("button");
redoButton.innerHTML = "Redo";
document.body.append(redoButton);

const clearButton = document.createElement("button");
clearButton.innerHTML = "Clear";
document.body.append(clearButton);

document.body.append(document.createElement("br"));

// MARKER TOOLS BTN
const thinButton = document.createElement("button");
thinButton.innerHTML = "Thin Marker";
document.body.append(thinButton);

const thickButton = document.createElement("button");
thickButton.innerHTML = "Thick Marker";
document.body.append(thickButton);

// ========== Global States ========== //
const ctx = canvas.getContext("2d")!;

const cursor = { active: false, x: 0, y: 0 };

const linesDraw: Draw[] = [];
const redoStack: Draw[] = [];
let currentCommand: Draggable | null = null;
let preview: ToolPreview | null = null; // NEW

interface DrawStyle {
  lineWidth: number;
  strokeStyle: string;
  fillStyle: string;
  dotRadius: number;
}

const THIN: DrawStyle = {
  lineWidth: 2,
  strokeStyle: "black",
  fillStyle: "black",
  dotRadius: 1,
};

const THICK: DrawStyle = {
  lineWidth: 8,
  strokeStyle: "black",
  fillStyle: "black",
  dotRadius: 4,
};

// set default tool as thin tool
let currentTool: DrawStyle = THIN;

function setTool(btn: HTMLButtonElement) {
  // Reset styles for all buttons
  [thinButton, thickButton].forEach((b) => b.classList.remove("active-tool"));
  // Highlight the selected button
  btn.classList.add("active-tool");
}

setTool(thinButton);

// ========== Display Commands ========== //
interface Draw {
  display(ctx: CanvasRenderingContext2D): void;
}

interface Draggable extends Draw {
  drag(x: number, y: number): void;
}

class DrawLines implements Draggable {
  points: { x: number; y: number }[] = [];

  constructor(startX: number, startY: number, private style: DrawStyle) {
    this.points.push({ x: startX, y: startY });
  }

  // grow/extend the drawing by adding points
  drag(x: number, y: number): void {
    this.points.push({ x, y });
  }

  display(ctx: CanvasRenderingContext2D) {
    if (this.points.length === 0) return;

    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = this.style.lineWidth;
    ctx.strokeStyle = this.style.strokeStyle;
    ctx.fillStyle = this.style.fillStyle;

    if (this.points.length === 1) {
      const p = this.points[0];
      ctx.beginPath();
      ctx.arc(p.x, p.y, this.style.dotRadius, 0, Math.PI * 2);
      ctx.fill();
      return;
    }

    ctx.beginPath();
    const { x, y } = this.points[0];
    ctx.moveTo(x, y);
    for (let i = 1; i < this.points.length; i++) {
      ctx.lineTo(this.points[i].x, this.points[i].y);
    }
    ctx.stroke();
  }
}

class ToolPreview implements Draw {
  constructor(private x: number, private y: number, private style: DrawStyle) {}

  display(ctx: CanvasRenderingContext2D) {
    const dotRadius = Math.max(1, this.style.lineWidth / 2);
    ctx.save();
    ctx.beginPath();
    ctx.lineWidth = 2;
    ctx.arc(this.x, this.y, dotRadius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
}

// ========== Functions ========== //
function notifyChange(name: string) {
  canvas.dispatchEvent(new Event(name));

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

  if (preview) preview.display(ctx);
}

// ========== Event Listeners ========== //
canvas.addEventListener("drawing-changed", redraw);
// NOT USED:
// canvas.addEventListener("cursor-changed", redraw);
canvas.addEventListener("tool-moved", redraw);

canvas.addEventListener("mouseenter", (e) => {
  if (!cursor.active) {
    preview = new ToolPreview(e.offsetX, e.offsetY, currentTool);
    notifyChange("tool-moved");
  }
});

canvas.addEventListener("mousedown", (e) => {
  cursor.active = true;
  cursor.x = e.offsetX;
  cursor.y = e.offsetY;

  preview = null; // Remove preview when drawing
  redoStack.length = 0; // Clear redo stack on new actions

  currentCommand = new DrawLines(cursor.x, cursor.y, currentTool);
  linesDraw.push(currentCommand);

  notifyChange("drawing-changed");
});

canvas.addEventListener("mousemove", (e) => {
  cursor.x = e.offsetX;
  cursor.y = e.offsetY;

  // update preview position if not drawing
  if (!cursor.active) {
    preview = new ToolPreview(cursor.x, cursor.y, currentTool);
    notifyChange("tool-moved");
    return;
  }

  if (!currentCommand) return;
  currentCommand.drag(cursor.x, cursor.y);

  notifyChange("drawing-changed");
});

canvas.addEventListener("mouseup", (_e) => {
  cursor.active = false;
  currentCommand = null;

  // resume showing preview when not drawing
  preview = new ToolPreview(cursor.x, cursor.y, currentTool);
  notifyChange("drawing-changed");
});

// ========== UI Controls ========== //

// UNDO BTN
undoButton.addEventListener("click", () => {
  if (linesDraw.length === 0) return;
  const undoneLine = linesDraw.pop()!;
  redoStack.push(undoneLine);
  currentCommand = null;
  notifyChange("drawing-changed");
});

// REDO BTN
redoButton.addEventListener("click", () => {
  if (redoStack.length === 0) return;
  const redoneLine = redoStack.pop()!;
  linesDraw.push(redoneLine);
  currentCommand = null;
  notifyChange("drawing-changed");
});

// CLEAR BTN
clearButton.addEventListener("click", () => {
  linesDraw.length = 0;
  redoStack.length = 0;
  currentCommand = null;
  notifyChange("drawing-changed");
});

document.body.append(document.createElement("br"));

// THIN MARKER BTN
thinButton.addEventListener("click", () => {
  currentTool = THIN;
  setTool(thinButton);

  if (preview) {
    preview = new ToolPreview(cursor.x, cursor.y, currentTool);
    notifyChange("tool-moved");
  }

  console.log("Thin Marker Selected");
});

// THICK MARKER BTN
thickButton.addEventListener("click", () => {
  currentTool = THICK;
  setTool(thickButton);

  if (preview) {
    preview = new ToolPreview(cursor.x, cursor.y, currentTool);
    notifyChange("tool-moved");
  }

  console.log("Thick Marker Selected");
});
