const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const app = express();
const port = 3000;

const filesDir = path.join(__dirname, 'files');

fs.mkdir(filesDir, { recursive: true }).catch(console.error);

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/files', async (req, res) => {
    try {
        const files = await fs.readdir(filesDir);
        res.json(files);
    } catch (err) {
        res.status(500).json({ error: 'Greška pri čitanju fajlova' });
    }
});

app.post('/save', async (req, res) => {
    const { filename, content } = req.body;
    if (!filename || !content) {
        return res.status(400).json({ error: 'Nedostaje naziv fajla ili sadržaj' });
    }
    try {
        await fs.writeFile(path.join(filesDir, filename), content);
        res.json({ message: `Fajl ${filename} uspešno sačuvan` });
    } catch (err) {
        res.status(500).json({ error: 'Greška pri čuvanju fajla' });
    }
});

app.get('/file/:name', async (req, res) => {
    const filename = req.params.name;
    try {
        const content = await fs.readFile(path.join(filesDir, filename), 'utf-8');
        res.json({ content });
    } catch (err) {
        res.status(404).json({ error: 'Fajl nije pronađen' });
    }
});

app.listen(port, () => {
    console.log(`Server pokrenut na http://localhost:${port}`);
});
