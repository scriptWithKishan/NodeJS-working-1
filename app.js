const express = require('express')
const path = require('path')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')

const app = express()
app.use(express.json())

const dbPath = path.join(__dirname, 'cricketMatchDetails.db')
let db = null

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server Running at http://localhost:3000/')
    })
  } catch (e) {
    console.log(`db error ${e.message}`)
  }
}
initializeDbAndServer()

app.get('/players/', async (request, response) => {
  const getPlayersQuery = `
        SELECT 
            *
        FROM
            player_details
    `
  const playerArray = await db.all(getPlayersQuery)
  response.send(
    playerArray.map(eachEle => ({
      playerId: eachEle.player_id,
      playerName: eachEle.player_name,
    })),
  )
})

app.get('/players/:playerId/', async (request, response) => {
  const {playerId} = request.params
  const getEachPlayerQuery = `
    SELECT 
      *
    FROM 
      player_details
    WHERE 
      player_id = ${playerId};
  `
  const player = await db.get(getEachPlayerQuery)
  response.send({
    playerId: player.player_id,
    playerName: player.player_name,
  })
})

app.put('/players/:playerId/', async (request, response) => {
  const {playerId} = request.params
  const playerDetails = request.body
  const {playerName} = playerDetails
  const updatePlayerQuery = `
    UPDATE 
      player_details
    SET 
      player_name = '${playerName}'
    WHERE
      player_id = ${playerId};
  `
  await db.run(updatePlayerQuery)
  response.send('Player Details Updated')
})

app.get('/matches/:matchId', async (request, response) => {
  const {matchId} = request.params
  const getEachMatchQuery = `
    SELECT 
      *
    FROM
      match_details
    WHERE 
      match_id = ${matchId};
  `
  const match = await db.get(getEachMatchQuery)
  response.send({
    matchId: match.match_id,
    match: match.match,
    year: match.year,
  })
})

app.get('/players/:playerId/matches/', async (request, response) => {
  const {playerId} = request.params

  const getMatchesQuery = `
    SELECT 
      match_details.match_id, match_details.match, match_details.year
    FROM 
      match_details
      NATURAL JOIN player_match_score
    WHERE
      player_match_score.player_id = ${playerId};
  `
  const matchArray = await db.all(getMatchesQuery)
  response.send(
    matchArray.map(eachEle => ({
      matchId: eachEle.match_id,
      match: eachEle.match,
      year: eachEle.year,
    })),
  )
})

app.get('/matches/:matchId/players/', async (request, response) => {
  const {matchId} = request.params

  const getPlayersQuery = `
    SELECT 
      player_details.player_id AS playerId, player_details.player_name AS playerName
    FROM 
      player_details 
      NATURAL JOIN player_match_score
    WHERE
      player_match_score.match_id = ${matchId}; 
  `
  const playersArray = await db.all(getPlayersQuery)
  response.send(playersArray)
})

app.get('/players/:playerId/playerScores/', async (request, response) => {
  const {playerId} = request.params

  const getPlayerScoreQuery = `
    SELECT
      player_details.player_id AS playerId,
      player_details.player_name AS playerName, 
      SUM(player_match_score.score) AS totalScore,
      SUM(player_match_score.fours) AS totalFours, 
      SUM(player_match_score.sixes) AS totalSixes
    FROM 
      player_details
      INNER JOIN player_match_score ON player_details.player_id = player_match_score.player_id
    WHERE
      player_details.player_id = ${playerId}
  `

  const playerArray = await db.get(getPlayerScoreQuery)
  response.send(playerArray)
})

module.exports = app
