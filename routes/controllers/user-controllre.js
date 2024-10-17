const bcrypt = require("bcryptjs");
const path = require("path");
const jwt = require('jsonwebtoken')
const {prisma} = require("../../prisma/prisma-client");
const fs = require('fs')
const jdenticon = require("jdenticon");

const UserController = {
    register: async (req, res) => {
        const {email, password, name} = req.body;

        // Проверяем поля на существование
        if (!email || !password || !name) {
            return res.status(400).json({error: "Все поля обязательны"});
        }

        try {
            // Проверяем, существует ли пользователь с таким emai
            const existingUser = await prisma.user.findUnique({where: {email}});
            if (existingUser) {
                return res.status(400).json({error: "Пользователь уже существует"});
            }

            // Хешируем пароль
            const hashedPassword = await bcrypt.hash(password, 10);


            const size = 200;
            const value = "name ";

            // Генерируем аватар для нового пользователя
            const png = jdenticon.toPng(value, size);
            const avatarName = `${name}${Date.now()}.png`;
            const avatarPath = path.join(avatarName, '/../uploads', avatarName);
            fs.writeFileSync(avatarPath, png);


            // Создаем пользователя
            const user = await prisma.user.create({
                data: {
                    email,
                    password: hashedPassword,
                    name,
                    avatarUrl: `/../uploads ${avatarName}`,
                },
            });
            res.json(user);
        } catch (error) {
            console.error("Error in register:", error);
            res.status(500).json({error: "Internal server error"});
        }
    },

    //создаем логин

    login: async (req, res) => {
        const {email, password} = req.body;

        if (!email || !password) {
            return res.status(400).json({error: "Все поля обязательны"});
        }

        try {
            // Find the user
            const user = await prisma.user.findUnique({where: {email}});

            if (!user) {
                return res.status(400).json({error: "Неверный логин или пароль"});
            }

            // Check the password
            const valid = await bcrypt.compare(password, user.password);

            if (!valid) {
                return res.status(400).json({error: "Неверный логин или пароль"});
            }

            // Generate a JWT
            const token = jwt.sign({userId: user.id}, process.env.SECRET_KEY);

            res.json({token});
        } catch (error) {
            console.error("Error in login:", error);
            res.status(500).json({error: "Internal server error"});
        }
    },

    getUserById: async (req, res) => {
        res.send('getUserById')
    },

    updateUser: async (req, res) => {
        res.send('updateUser')
    },

    current: async (req, res) => {
        res.send('current')
    }

};

module.exports = UserController;