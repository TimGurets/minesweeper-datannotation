
const ROWS = 9;
const COLS = 9;
const MINE_COUNT = 10;

const boardElement = document.getElementById("board");
const mineCounter = document.getElementById("mine-counter");
const timerElement = document.getElementById("timer");
const statusElement = document.getElementById("status");
const restartButton = document.getElementById("restart");
const flagModeButton = document.getElementById("flag-mode");

let cells = [];
let firstMove = true;
let gameOver = false;
let flagMode = false;
let flagsPlaced = 0;
let revealedCount = 0;
let seconds = 0;
let timerInterval = null;

function createBoard() {
  clearInterval(timerInterval);

  cells = [];
  firstMove = true;
  gameOver = false;
  flagMode = false;
  flagsPlaced = 0;
  revealedCount = 0;
  seconds = 0;

  timerElement.textContent = "000";
  mineCounter.textContent = MINE_COUNT;
  statusElement.textContent = "Find all safe squares.";
  restartButton.textContent = "🙂";
  flagModeButton.textContent = "⚑ Flag mode: OFF";
  flagModeButton.classList.remove("active");

  boardElement.innerHTML = "";

  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      cells.push({
        row,
        col,
        mine: false,
        adjacent: 0,
        revealed: false,
        flagged: false,
        element: null
      });
    }
  }

  for (const cell of cells) {
    const button = document.createElement("button");
    button.className = "cell";
    button.type = "button";
    button.setAttribute(
      "aria-label",
      `Row ${cell.row + 1}, column ${cell.col + 1}, hidden`
    );

    button.addEventListener("click", () => {
      if (gameOver) return;

      if (flagMode) {
        toggleFlag(cell);
      } else {
        revealCell(cell);
      }
    });

    button.addEventListener("contextmenu", event => {
      event.preventDefault();
      if (!gameOver) toggleFlag(cell);
    });

    cell.element = button;
    boardElement.appendChild(button);
  }
}

function getNeighbors(cell) {
  const neighbors = [];

  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;

      const row = cell.row + dr;
      const col = cell.col + dc;

      if (row < 0 || row >= ROWS ||
          col < 0 || col >= COLS) {
        continue;
      }

      neighbors.push(cells[row * COLS + col]);
    }
  }

  return neighbors;
}

function placeMines(firstCell) {
  // Keep the first clicked cell and its neighbors safe.
  const safeCells = new Set([
    firstCell,
    ...getNeighbors(firstCell)
  ]);

  const availableCells = cells.filter(
    cell => !safeCells.has(cell)
  );

  for (let i = 0; i < MINE_COUNT; i++) {
    const randomIndex = Math.floor(
      Math.random() * availableCells.length
    );

    const [mineCell] = availableCells.splice(randomIndex, 1);
    mineCell.mine = true;
  }

  for (const cell of cells) {
    if (!cell.mine) {
      cell.adjacent = getNeighbors(cell)
        .filter(neighbor => neighbor.mine).length;
    }
  }
}

function startTimer() {
  if (timerInterval !== null) return;

  timerInterval = setInterval(() => {
    seconds++;
    timerElement.textContent = String(
      Math.min(seconds, 999)
    ).padStart(3, "0");
  }, 1000);
}

function toggleFlag(cell) {
  if (gameOver || cell.revealed) return;

  cell.flagged = !cell.flagged;
  flagsPlaced += cell.flagged ? 1 : -1;

  cell.element.textContent = cell.flagged ? "⚑" : "";
  cell.element.classList.toggle("flagged", cell.flagged);
  cell.element.setAttribute(
    "aria-label",
    `Row ${cell.row + 1}, column ${cell.col + 1}, ${
      cell.flagged ? "flagged" : "hidden"
    }`
  );

  mineCounter.textContent = MINE_COUNT - flagsPlaced;
}

function revealCell(cell) {
  if (gameOver || cell.revealed || cell.flagged) return;

  if (firstMove) {
    firstMove = false;
    placeMines(cell);
    startTimer();
  }

  if (cell.mine) {
    cell.revealed = true;
    cell.element.textContent = "✹";
    cell.element.classList.add("revealed", "mine", "exploded");
    cell.element.setAttribute("aria-label", "Mine hit");
    loseGame();
    return;
  }

  // Reveal connected empty cells without recursive calls.
  const stack = [cell];

  while (stack.length > 0) {
    const current = stack.pop();

    if (current.revealed || current.flagged || current.mine) {
      continue;
    }

    current.revealed = true;
    revealedCount++;

    current.element.classList.add("revealed");
    current.element.textContent = current.adjacent || "";
    current.element.setAttribute(
      "aria-label",
      `Row ${current.row + 1}, column ${current.col + 1}, ${
        current.adjacent === 0
          ? "empty"
          : `${current.adjacent} nearby mines`
      }`
    );

    if (current.adjacent > 0) {
      current.element.classList.add(`n${current.adjacent}`);
    } else {
      for (const neighbor of getNeighbors(current)) {
        if (!neighbor.revealed &&
            !neighbor.flagged &&
            !neighbor.mine) {
          stack.push(neighbor);
        }
      }
    }
  }

  checkWin();
}

function loseGame() {
  gameOver = true;
  clearInterval(timerInterval);
  timerInterval = null;

  restartButton.textContent = "😵";
  statusElement.textContent = "Boom! You hit a mine.";

  for (const cell of cells) {
    if (cell.mine && !cell.revealed) {
      cell.element.textContent = "✹";
      cell.element.classList.add("revealed", "mine");
    } else if (cell.flagged && !cell.mine) {
      cell.element.textContent = "✕";
      cell.element.classList.add("revealed", "mine");
    }
  }
}

function checkWin() {
  const safeCellCount = ROWS * COLS - MINE_COUNT;

  if (revealedCount !== safeCellCount) return;

  gameOver = true;
  clearInterval(timerInterval);
  timerInterval = null;

  restartButton.textContent = "😎";
  statusElement.textContent =
    `You win! Completed in ${seconds} seconds.`;
}

restartButton.addEventListener("click", createBoard);

flagModeButton.addEventListener("click", () => {
  if (gameOver) return;

  flagMode = !flagMode;
  flagModeButton.classList.toggle("active", flagMode);
  flagModeButton.textContent =
    `⚑ Flag mode: ${flagMode ? "ON" : "OFF"}`;
});

createBoard();
