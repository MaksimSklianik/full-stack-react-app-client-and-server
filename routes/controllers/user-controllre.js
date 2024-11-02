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
            // Проверяем, существует ли пользователь с таким email
            const existingUser = await prisma.user.findUnique({where: {email}});
            if (existingUser) {
                return res.status(400).json({error: "Пользователь уже существует"});
            }

            // Хешируем пароль
            const hashedPassword = await bcrypt.hash(password, 10);


            // Генерируем аватар для нового пользователя
            const jpg = jdenticon.toPng(name, 200);
            const avatarName = `${name}_${Date.now()}.jpg`;
            const avatarPath = path.join(avatarName, '/../uploads', avatarName);
            fs.writeFileSync(avatarPath, jpg);


            // Создаем пользователя
            const user = await prisma.user.create({
                data: {
                    email,
                    password: hashedPassword,
                    name,
                    avatarUrl: `/uploads/${avatarName}`,
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
        const {id} = req.params;
        const userId = req.user.userId;
        try {
            const user = await prisma.user.findUnique({
                where: {id},
                include: {
                    followers: true,
                    following: true
                }
            });
            if (!user) {
                return res.status(404).json({error: "Пользователь не найден"});
            }
            //проверка на то подписан ли ты на пользователя
            const isFollowing = await prisma.follows.findFirst({
                where: {
                    AND: [
                        {followerId: userId},
                        {followingId: id}
                    ]
                }
            })
            res.json({user, isFollowing: Boolean(isFollowing)});
        } catch (e) {
            console.error('get current error', e);
            res.status(500).json({error: "Internal server error"});
        }
    },


    updateUser: async (req, res) => {
        const {id} = req.params;
        const {email, name, dateOfBirth, bio, location} = req.body;

        let filePath;

        if (req.file && req.file.path) {
            filePath = req.file.path;
        }

        // Проверка, что пользователь обновляет свою информацию
        if (id !== req.user.userId) {
            return res.status(403).json({error: "Нет доступа"});
        }

        try {
            if (email) {
                const existingUser = await prisma.user.findFirst({
                    where: {email: email},
                });

                if (existingUser && existingUser.id !== parseInt(id)) {
                    return res.status(400).json({error: "Почта уже используется"});
                }
            }

            const user = await prisma.user.update({
                where: {id},
                data: {
                    email: email || undefined,
                    name: name || undefined,
                    avatarUrl: filePath ? `/${filePath}` : undefined,
                    dateOfBirth: dateOfBirth || undefined,
                    bio: bio || undefined,
                    location: location || undefined,
                },
            });
            res.json(user);
        } catch (error) {
            console.log('error', error)
            res.status(500).json({error: "Что-то пошло не так"});
        }
    },


    current: async (req, res) => {
        try {
            const user = await prisma.user.findUnique({
                where: {
                    id: req.user.userId
                },
                include: {
                    followers: {
                        include: {
                            follower: true
                        }
                    }, following: {
                        include: {
                            following: true
                        }
                    }

                }
            })
            if (!user) {
                return res.status(400).json({error: "неудолось найти пользователя "})
            }
            res.json(user)

        } catch (error) {
            console.error("Get Current Error", error)
            res.status(500).json({error: "Internal server error"})

        }
    }
};

module.exports = UserController;