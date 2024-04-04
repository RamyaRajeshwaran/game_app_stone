const express = require('express');
const mysql = require('mysql');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(cors());

const connection = mysql.createConnection({
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: 'ramya@1601',
  database: 'game'
});

connection.connect(err => {
  if (err) {
    console.error('Error connecting to MySQL:', err);
    return;
  }
  console.log('Connected to MySQL');
});

app.post('/api/games', (req, res) => {
  const { player1, player2 } = req.body;
  const insertQuery = `INSERT INTO players (player1, player2) VALUES (?, ?)`;
  connection.query(insertQuery, [player1, player2], (err, result) => {
    if (err) {
      console.error('Error creating game:', err);
      res.status(500).json({ message: 'Failed to create game' });
      return;
    }
    res.status(201).json({ id: result.insertId });
  });
});

app.put('/api/games/:id', (req, res) => {
  const gameId = req.params.id;
  const { round, player1Choice, player2Choice, winner } = req.body;

  // Determine the scores based on the winner of the round
  let player1Score = 0;
  let player2Score = 0;
  if (winner === 'player1') {
    player1Score = 1;
  } else if (winner === 'player2') {
    player2Score = 1;
  }

  const updateQuery = `
    UPDATE players 
    SET round${round}=?, 
        player1_score = player1_score + ?, 
        player2_score = player2_score + ?,
        winner=?
    WHERE id=?
  `;

  connection.query(updateQuery, [JSON.stringify({ player1Choice, player2Choice }), player1Score, player2Score, winner, gameId], (err, result) => {
    if (err) {
      console.error('Error updating game:', err);
      res.status(500).json({ message: 'Failed to update game' });
      return;
    }
    res.status(200).json({ message: 'Game updated successfully' });
  });
});

app.get('/api/games/:id/scores', (req, res) => {
  const gameId = req.params.id;
  const selectQuery = `SELECT player1_score, player2_score, winner FROM players WHERE id=?`;

  connection.query(selectQuery, [gameId], (err, result) => {
    if (err) {
      console.error('Error fetching scores:', err);
      res.status(500).json({ message: 'Failed to fetch scores' });
      return;
    }
    
    if (result.length === 0) {
      res.status(404).json({ message: 'Game not found' });
      return;
    }

    const { player1_score, player2_score, winner } = result[0];

    res.status(200).json({ player1_score, player2_score, winner });
  });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
