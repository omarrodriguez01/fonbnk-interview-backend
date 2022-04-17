import express, { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken"
import { User } from "../models/user";
import { getUserInfo, registerUser, transfer } from "../helpers/apiHelpers";
import * as Auth from "../middleware/auth"

export const usersRouter = express.Router();

usersRouter.use(express.json());

usersRouter.get("/", async (_req: Request, res: Response) => {
    try {
        console.log('getting users')
        // Call find with an empty filter object, meaning it returns all documents in the collection. Saves as Game array to take advantage of types
        const users = await User.find({})

        res.status(200).send(users);
    } catch (error) {
        res.status(500).send(error.message);
    }
});


usersRouter.post("/register", async (req: Request, res: Response) => {
    try {
        // Get user input
        const { username, password } = req.body;

        // Validate user input
        if (!(username && password)) {
            res.status(400).send("All input is required");
        }
        const oldUser = await User.findOne({ username });

        if (oldUser) {
            return res.status(409).send("User Already Exist. Please Login");
        }
        const encryptedPassword = await bcrypt.hash(password, 10);
        const user = await registerUser(username, encryptedPassword)


        // Create token
        const token = jwt.sign(
            { user_id: user._id, username },
            process.env.TOKEN_KEY,
            {
                expiresIn: "2h",
            }
        );

        res.status(201).json(token);
    } catch (err) {
        res.status(500).send('Error creating user')
        console.log(err);
    }

});

usersRouter.post("/login", async (req: Request, res: Response) => {
    try {
        // Get user input
        const { username, password } = req.body;

        // Validate user input
        if (!(username && password)) {
            res.status(400).send("All input is required");
        }
        // Validate if user exist in our database
        const user = await User.findOne({ username });

        if (user && (await bcrypt.compare(password, user.password))) {
            // Create token
            const token = jwt.sign(
                { user_id: user._id, username },
                process.env.TOKEN_KEY,
                {
                    expiresIn: "2h",
                }
            );
            return res.status(201).json(token);
        }
        return res.status(400).send("Invalid Credentials");
    } catch (err) {
        console.log(err);
    }
});

usersRouter.post("/transfer", Auth.authorize, async (req: Request, res: Response) => {
    try {
        const body = req.body;
        const address = String(body.address)
        const username = String(body.username)
        const amount = String(body.amount)

        await transfer(address, username, amount);
        return res.status(200).send('Succesful Transaction');

    } catch (error) {
        console.error(error);
        res.status(400).send(error.message);
    }
});

usersRouter.post("/getUser", Auth.authorize, async (req: Request, res: Response) => {
    try {
        const { username } = req.body;
        const userInfo = await getUserInfo(username);
        return res.status(201).json(userInfo);
    } catch (error) {
        console.error(error);
        res.status(400).send(error.message);
    }
});
