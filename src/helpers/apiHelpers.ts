import { ethers } from "ethers"
import crypto from "crypto"
import mongoose from "mongoose"

import { User } from "../models/user";

export const registerUser = async (username: string, password: string) => {
    const INFURA_ID = process.env.INFURA_ID
    const provider = new ethers.providers.JsonRpcProvider(`https://rinkeby.infura.io/v3/${INFURA_ID}`);
    const cryptoId = crypto.randomBytes(32).toString('hex');
    const privateKey = "0x" + cryptoId;
    const wallet = new ethers.Wallet(privateKey, provider);
    const address = wallet.address
    try {
        const newUser = await User.create({
            _id: new mongoose.Types.ObjectId(),
            privateKey: privateKey,
            address: address,
            username: username,
            password: password,
        })
        if (newUser) {
            return {
                _id: newUser._id,
                privateKey,
                address
            }
        }
    } catch (error) {
        throw 'Failed to a create new user'
    }
};

export const getUserInfo = async (userId: string) => {
    const INFURA_ID = process.env.INFURA_ID
    const provider = new ethers.providers.JsonRpcProvider(`https://rinkeby.infura.io/v3/${INFURA_ID}`);

    const user = await User.findById(userId)
    const address = user.address
    const balance = await provider.getBalance(address);
    const etherscanProvider = new ethers.providers.EtherscanProvider('rinkeby');
    const rawTransactions = await etherscanProvider.getHistory(address)

    const transactions = rawTransactions.map((txn) => {
        if (txn.to === address)
            return {
                type: 1,
                amount: ethers.utils.formatEther(txn.value),
                date: txn.timestamp,
                address: txn.from
            }
        return {
            type: 0,
            amount: ethers.utils.formatEther(txn.value),
            date: txn.timestamp,
            address: txn.to
        }
    });
    return {
        user,
        address,
        balance: ethers.utils.formatEther(balance),
        transactions
    }
};

export const getUserPrivateKey = async (userId: string): Promise<String> => {
    const user = await User.findById(userId)
    return String(user.privateKey)
}

export const transfer = async (address: string, userId: string, amount: string) => {
    const INFURA_ID = process.env.INFURA_ID
    const provider = new ethers.providers.JsonRpcProvider(`https://rinkeby.infura.io/v3/${INFURA_ID}`);
    try {
        const senderKey = await getUserPrivateKey(userId)
        // const senderKey = process.env.PRIVATE_KEY
        const wallet = new ethers.Wallet(String(senderKey), provider)

        // const senderBalanceBefore = await provider.getBalance('0x60e5784ae03A5D98D80dE051683a3C0a3122c16E')
        // const receiverBalanceBefore = await provider.getBalance(address)

        // console.log(`balance of sender before ${ethers.utils.formatEther(senderBalanceBefore)}`)
        // console.log(`balance of receiver before ${ethers.utils.formatEther(receiverBalanceBefore)}`)

        const tx = await wallet.sendTransaction({
            to: address,
            value: ethers.utils.parseEther(amount)
        })
        await tx.wait()

        // const senderBalanceAfter = await provider.getBalance('0x60e5784ae03A5D98D80dE051683a3C0a3122c16E')
        // const receiverBalanceAfter = await provider.getBalance(address)

        // console.log(`balance of sender After ${ethers.utils.formatEther(senderBalanceAfter)}`)
        // console.log(`balance of receiver After ${ethers.utils.formatEther(receiverBalanceAfter)}`)
        return
    } catch (error) {
        if (error.code === 'INSUFFICIENT_FUNDS') {
            console.log('lol no funds')
        }
        throw error
    }

};