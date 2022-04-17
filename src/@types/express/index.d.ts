
import { userSchema, User } from "../../models/user";
import { Express } from 'express'

declare global {
    namespace Express {
        interface Request {
            user: any
        }
    }
}