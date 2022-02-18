import express, { Express } from "express";
import { Server } from "http";
import { userRouter } from "./users/users";

export class App {
    app: Express;
    server: Server;
    port: number;

    constructor() {
        this.app = express();
        this.port = 8000;
    }

    useRoutes() {
        this.app.use('/users', userRouter)
    }

    public async init() {
        this.useRoutes();
        this.server = this.app.listen(this.port);
        console.log(`Сервер запущен на ${this.port}`);
    }
}


// app.get('/hello', (req, res) => {
//     res.send('Привет!');
// });

// app.get('/error', (req, res) => {
//     throw new Error('Всё пропало!!!!');
// });