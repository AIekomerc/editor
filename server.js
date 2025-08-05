const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const app = express();
const port = 3000;
const filesDir = path.join(__dirname, 'files');

fs.mkdir(filesDir, { recursive: true }).catch(console.error);

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/files', async (req, res) => {
    try {
        const files = await fs.readdir(filesDir);
        const filteredFiles = files.filter(file => !file.endsWith('.class'));
        res.json(filteredFiles);
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

app.post('/run-java', async (req, res) => {
    const { filename } = req.body;
    if (!filename || !filename.endsWith('.java')) {
        return res.status(400).json({ error: 'Izaberi validan .java fajl' });
    }
    const filePath = path.join(filesDir, filename);
    try {
        await fs.access(filePath, fs.constants.R_OK);
        const className = filename.replace('.java', '');
        exec(`javac ${filePath} && java -cp ${filesDir} ${className}`, (err, stdout, stderr) => {
            if (err || stderr) {
                return res.status(500).json({ error: stderr || err.message, details: err });
            }
            res.json({ output: stdout });
        });
    } catch (err) {
        res.status(500).json({ error: 'Greška pri pokretanju Java fajla', details: err.message });
    }
});

app.post('/run-python', async (req, res) => {
    const { filename } = req.body;
    if (!filename || !filename.endsWith('.py')) {
        return res.status(400).json({ error: 'Izaberi validan .py fajl' });
    }
    const filePath = path.join(filesDir, filename);
    try {
        await fs.access(filePath, fs.constants.R_OK);
        exec(`python ${filePath}`, (err, stdout, stderr) => {
            if (err || stderr) {
                return res.status(500).json({ error: stderr || err.message, details: err });
            }
            res.json({ output: stdout });
        });
    } catch (err) {
        res.status(500).json({ error: 'Greška pri pokretanju Python fajla', details: err.message });
    }
});

app.listen(port, () => {
    console.log(`Server pokrenut na http://localhost:${port}`);
});
