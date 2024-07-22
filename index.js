const express = require('express');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const path = require('path');
const app = express();
const port = 3000;

// Middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

// Set EJS as templating engine
app.set('view engine', 'ejs');

// Database connection
let db;

(async () => {
    db = await open({
        filename: './database.db',
        driver: sqlite3.Database
    });

    await db.exec(`CREATE TABLE IF NOT EXISTS urls (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        original_url TEXT NOT NULL,
        short_code TEXT NOT NULL UNIQUE
    )`);
})();

// Generate short code
function generateShortCode() {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let shortCode = '';
    for (let i = 0; i < 6; i++) {
        shortCode += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return shortCode;
}

// Routes
app.get('/', (req, res) => {
    res.render('index');
});

app.post('/shorten', async (req, res) => {
    const originalUrl = req.body.original_url;
    const shortCode = generateShortCode();

    try {
        await db.run('INSERT INTO urls (original_url, short_code) VALUES (?, ?)', [originalUrl, shortCode]);
        res.render('index', { shortUrl: `${req.protocol}://${req.get('host')}/${shortCode}` });
    } catch (err) {
        res.render('index', { error: 'Failed to shorten URL. Please try again.' });
    }
});

app.get('/:short_code', async (req, res) => {
    const shortCode = req.params.short_code;

    const row = await db.get('SELECT original_url FROM urls WHERE short_code = ?', [shortCode]);
    if (row) {
        res.redirect(row.original_url);
    } else {
        res.status(404).send('URL not found');
    }
});

app.listen(port, () => {
    console.log(`URL shortener service listening at http://localhost:${port}`);
});
