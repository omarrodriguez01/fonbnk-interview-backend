import express, { Express } from "express";
import { connectToDatabase } from "./services/database.service"
import { usersRouter } from "./routes/users.router";

const app: Express = express();
const port: any = process.env.PORT ?? 8080;

connectToDatabase()
    .then(() => {
        app.use("/users", usersRouter);

        app.listen(port, () => {
            console.log(`Server started at http://localhost:${port}`);
        });
    })
    .catch((error: Error) => {
        console.error("Database connection failed", error);
        process.exit();
    });