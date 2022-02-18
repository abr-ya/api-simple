import express from "express";

const port = 8000;

const app = express();

app.get('/hello', (req, res) => {
    res.send('Привет!');
});

app.get('/error', (req, res) => {
    throw new Error('Всё пропало!!!!');
});

app.listen(port, () => {
    console.log(`Сервер запущен на ${port}`);
});
