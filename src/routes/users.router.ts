import express, { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken"
import { User } from "../models/user";
import { getUserInfo, registerUser, transfer } from "../helpers/apiHelpers";
import * as Auth from "../middleware/auth"

export const usersRouter = express.Router();

usersRouter.use(express.json());

usersRouter.post("/register", async (req: Request, res: Response) => {
    try {
        const { username, password } = req.body;
        if (!(username && password)) {
            res.status(400).send("All input is required");
        }
        const oldUser = await User.findOne({ username });

        if (oldUser) {
            return res.status(409).send("User Already Exist. Please Login");
        }
        const encryptedPassword = await bcrypt.hash(password, 10);
        const user = await registerUser(username, encryptedPassword)

        const token = jwt.sign(
            { user_id: user._id, username },
            process.env.TOKEN_KEY,
            {
                expiresIn: "2h",
            }
        );
        if (user) {
            return res.status(201).json({ token, userId: user._id });
        }
        return res.status(500).send('Error creating user')

    } catch (err) {
        res.status(500).send('Error creating user')
        console.log(err);
    }

});

usersRouter.post("/login", async (req: Request, res: Response) => {
    try {
        const { username, password } = req.body;
        if (!(username && password)) {
            res.status(400).send("All input is required");
        }
        const user = await User.findOne({ username });

        if (user && (await bcrypt.compare(password, user.password))) {
            const token = jwt.sign(
                { user_id: user._id, username },
                process.env.TOKEN_KEY,
                {
                    expiresIn: "2h",
                }
            );
            return res.status(201).json({ token, userId: user._id });
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
        const userId = String(body.id)
        const amount = String(body.amount)

        await transfer(address, userId, amount);
        return res.status(200).send('Succesful Transaction');

    } catch (error) {
        console.error(error);
        res.status(400).send(error.message);
    }
});

usersRouter.post("/getUser", Auth.authorize, async (req: Request, res: Response) => {
    try {
        const { userId } = req.body;
        const userInfo = await getUserInfo(userId);
        return res.status(201).json(userInfo);
    } catch (error) {
        console.error(error);
        res.status(400).send(error.message);
    }
});

// usersRouter.post("/getTransactions", Auth.authorize, async (req: Request, res: Response) => {
//     try {
//         const { userId } = req.body;
//         const userInfo = await getTransactions(userId);
//         return res.status(201).json(userInfo);
//     } catch (error) {
//         console.error(error);
//         res.status(400).send(error.message);
//     }
// });
