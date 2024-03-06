const { initGame, gameLoop, getUpdatedVelocity } = require("./game.js")
const { FRAME_RATE } = require("./constants.js")
const { makeId } = require("./utils.js")
const state = {}
const clientRooms = {}

const express = require("express")
const app = express()
const http = require("http").createServer(app)
const io = require("socket.io")(http)
// const io = require("socket.io")(http, {
//   cors: {
//     origin: "http://localhost:8080",
//     methods: ["GET", "POST"],
//   },
// })

io.on("connection", (client) => {
  client.on("keydown", handleKeyDown)
  client.on("newGame", handleNewGame)
  client.on("joinGame", handleJoinGame)

  function handleJoinGame(roomName) {
    const room = io.sockets.adapter.rooms.get(roomName)

    let allUsers
    if (room) {
      allUsers = io.sockets.adapter.rooms.get(roomName)
    }

    let numClients = 0
    if (allUsers) {
      numClients = allUsers.size
    }

    if (numClients === 0) {
      client.emit("unknownGame")
      return
    } else if (numClients > 1) {
      client.emit("tooManyPlayers")
      return
    }

    clientRooms[client.id] = roomName

    client.join(roomName)
    client.number = 2
    client.emit("init", 2)

    startGameInterval(roomName)
  }

  function handleNewGame() {
    let roomName = makeId(5)
    clientRooms[client.id] = roomName
    client.emit("gameCode", roomName)

    state[roomName] = initGame()

    client.join(roomName)
    client.number = 1
    client.emit("init", 1)
  }

  // Handles player input
  function handleKeyDown(keyCode) {
    const roomName = clientRooms[client.id]

    if (!roomName) {
      return
    }

    try {
      keyCode = parseInt(keyCode)
    } catch (e) {
      console.error(e)
      return
    }

    const vel = getUpdatedVelocity(keyCode)

    if (vel) {
      state[roomName].players[client.number - 1].vel = vel
    }
  }
})

function startGameInterval(roomName) {
  const intervalId = setInterval(() => {
    const winner = gameLoop(state[roomName])

    if (!winner) {
      emitGameState(roomName, state[roomName])
    } else {
      emitGameOver(roomName, winner)
      state[roomName] = null
      clearInterval(intervalId)
    }
  }, 1000 / FRAME_RATE)
}

function emitGameState(room, state) {
  io.sockets.in(room).emit("gameState", JSON.stringify(state))
}

function emitGameOver(room, winner) {
  io.sockets.in(room).emit("gameOver", JSON.stringify({ winner }))
}

const port = 3000
try {
  http.listen(port, () => {
    console.log("listening on localhost:" + port)
  })
} catch (e) {
  console.error("Server failed to listen " + e)
}
