const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const dbPath = path.join(__dirname, "cricketMatchDetails.db");

const app = express();
app.use(express.json());

let db = null;

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};
initializeDbAndServer();

const convertPlayerDbObjectToResponseObject = (dbObject) => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  };
};

const convertMatchDetailsDbObjectToResponseObject = (dbObject) => {
  return {
    matchId: dbObject.match_id,
    match: dbObject.match,
    year: dbObject.year,
  };
};

// Get Players API
app.get("/players/", async (Request, Response) => {
  const getPlayersQuery = `
    SELECT 
    * 
    FROM 
    player_details
    `;
  const playersArray = await db.all(getPlayersQuery);
  Response.send(
    playersArray.map((eachPlayer) =>
      convertPlayerDbObjectToResponseObject(eachPlayer)
    )
  );
});

// Get Player API

app.get("/players/:playerId/", async (Request, Response) => {
  const { playerId } = Request.params;
  const getPlayerQuery = `
    SELECT 
    *
    FROM player_details
    WHERE player_id = ${playerId}
    `;
  let player = await db.get(getPlayerQuery);
  Response.send(convertPlayerDbObjectToResponseObject(player));
});

// Update player API
app.put("/players/:playerId/", async (Request, Response) => {
  const { playerId } = Request.params;
  const { playerName } = Request.body;

  const updatePlayerQuery = `
    UPDATE 
    player_details
    SET 
    player_name = '${playerName}'
    WHERE 
    player_id = ${playerId};
    `;
  await db.run(updatePlayerQuery);
  Response.send("Player Details Updated");
});
// Get Match API
app.get("/matches/:matchId/", async (Request, Response) => {
  const { matchId } = Request.params;
  const getMatchQuery = `
    SELECT 
    *
    FROM
    match_details
    WHERE match_id = ${matchId};
    `;
  const matchDetails = await db.get(getMatchQuery);
  Response.send(convertMatchDetailsDbObjectToResponseObject(matchDetails));
});

// get matches of Player

app.get("/players/:playerId/matches", async (Request, Response) => {
  const { playerId } = Request.params;
  const getPlayerMatchQuery = `
    SELECT 
    * 
    FROM
    player_match_score
    NATURAL JOIN match_details
    WHERE 
    player_id = ${playerId};
    `;
  const playerMatches = await db.all(getPlayerMatchQuery);
  Response.send(
    playerMatches.map((eachMatch) =>
      convertMatchDetailsDbObjectToResponseObject(eachMatch)
    )
  );
});

//Get players of specific match
app.get("/matches/:matchId/players", async (Request, Response) => {
  const { matchId } = Request.params;
  const matchesPlayerQuery = `
    SELECT 
    * 
    FROM 
    player_matcH_score
    NATURAL JOIN player_details
    WHERE match_id = ${matchId};
    `;
  const playersArray = await db.all(matchesPlayerQuery);
  Response.send(
    playersArray.map((eachPlayer) =>
      convertPlayerDbObjectToResponseObject(eachPlayer)
    )
  );
});

//Get score of specific player
app.get("/players/:playerId/playerScores", async (Request, Response) => {
  const { playerId } = Request.params;
  const getMatchPlayersQuery = `
    SELECT
      player_id AS playerId,
      player_name AS playerName,
      SUM(score) AS totalScore,
      SUM(fours) AS totalFours,
      SUM(sixes) AS totalSixes
    FROM player_match_score
      NATURAL JOIN player_details
    WHERE
      player_id = ${playerId};`;
  const playersMatchDetails = await db.get(getMatchPlayersQuery);
  Response.send(playersMatchDetails);
});

module.exports = app;
