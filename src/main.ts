import "./style.css";

document.body.innerHTML = `
  <h1>Heading</h1>
  <canvas id="myCanvas" width="256" height="256"></canvas>

`;

const canvas = document.getElementById("myCanvas")! as HTMLCanvasElement;

const ctx = canvas.getContext("2d");

const cursor = { active: false, x: 0, y: 0 };

canvas.addEventListener("mousedown", (e) => {
  cursor.active = true;
  cursor.x = e.offsetX;
  cursor.y = e.offsetY;
});

canvas.addEventListener("mousemove", (e) => {
  if (cursor.active) {
    ctx!.beginPath();
    ctx!.moveTo(cursor.x, cursor.y);
    ctx!.lineTo(e.offsetX, e.offsetY);
    ctx!.stroke();
    cursor.x = e.offsetX;
    cursor.y = e.offsetY;
   }
});

canvas.addEventListener("mouseup", () => {
  cursor.active = false;
});
