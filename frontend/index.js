BG_COLOR = "#231f20"
SNAKE_COLOR = "#c2c2c2"
FOOD_COLOR = "#e66916"

const socket = io("http://localhost:3000", {
  extraHeaders: {
    "Access-Control-Allow-Origin": "http://localhost:8080",
  },
  transports: ["websocket"],
})

socket.connect()
socket.on("connect_error", (err) => {
  console.log(`connect_error due to ${err.message}`)
})

socket.on("init", handleInit)
socket.on("gameState", handleGameState)
socket.on("gameOver", handleGameOver)
socket.on("gameCode", handleGameCode)
socket.on("unknownGame", handleUnknownGame)
socket.on("tooManyPlayers", handleTooManyPlayers)

const gameScreen = document.getElementById("gameScreen")
const initialScreen = document.getElementById("menuScreen")
const newGameBtn = document.getElementById("newGameButton")
const joinGameBtn = document.getElementById("joinGameButton")
const gameCodeInput = document.getElementById("gameCodeInput")
const gameCodeDisplay = document.getElementById("gameCodeDisplay")

newGameBtn.addEventListener("click", newGame)
joinGameBtn.addEventListener("click", joinGame)

let canvas, ctx
let playerNumber
let gameActive = false

function newGame() {
  socket.emit("newGame")
  init()
}

function joinGame() {
  const code = gameCodeInput.value
  socket.emit("joinGame", code)
  init()
}

function init() {
  initialScreen.style.display = "none"
  gameScreen.style.display = "block"

  canvas = document.getElementById("canvas")
  ctx = canvas.getContext("2d")

  canvas.width = canvas.height = 600

  ctx.fillStyle = BG_COLOR
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  document.addEventListener("keydown", keydown)
  gameActive = true
}

function keydown(e) {
  socket.emit("keydown", e.keyCode)
}

function paintGame(state) {
  ctx.fillStyle = BG_COLOR
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  const food = state.food
  const gridsize = state.gridsize
  const size = canvas.width / gridsize

  ctx.fillStyle = FOOD_COLOR
  ctx.fillRect(food.x * size, food.y * size, size, size)

  paintPlayer(state.players[0], size, SNAKE_COLOR)
  paintPlayer(state.players[1], size, "red")
}

function paintPlayer(playerState, size, SNAKE_COLOR) {
  const snake = playerState.snake

  ctx.fillStyle = SNAKE_COLOR
  for (let cell of snake) {
    ctx.fillRect(cell.x * size, cell.y * size, size, size)
  }
}

function handleInit(number) {
  playerNumber = number
}

function handleGameState(gameState) {
  if (!gameActive) {
    return
  }
  gameState = JSON.parse(gameState)
  requestAnimationFrame(() => paintGame(gameState))
}

function handleGameOver(data) {
  if (!gameActive) {
    return
  }

  data = JSON.parse(data)

  if (data.winner === playerNumber) {
    alert("You win!")
  } else {
    alert("you lose!")
  }
  gameActive = false
}

function handleGameCode(gameCode) {
  gameCodeDisplay.innerText = gameCode
}

// handle more gracefully :/
function handleUnknownGame() {
  reset()
  alert("Unknown game code")
}

function handleTooManyPlayers() {
  reset()
  alert("This game is already in progress")
}

function reset() {
  playerNumber = null
  gameCodeInput.value = ""
  gameCodeDisplay.innerText = ""
  initialScreen.style.display = "block"
  gameScreen.style.display = "none"
}
