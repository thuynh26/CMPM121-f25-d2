import "./style.css";

document.body.innerHTML = `
  <h1>Temp Heading</h1>
`;

const canvas = document.createElement("canvas");
canvas.width = 256;
canvas.height = 256;
canvas.style.cursor = "none";
document.body.append(canvas);
