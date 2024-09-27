const express = require('express');
const router = express.Router();
const multer = require('multer');
const {UserController} = require('./controllers');

const uploadDestination = 'uploads';

// показываем где хранить файлы
const storage = multer.diskStorage({
    destination: uploadDestination,
    filename: function (req, file, cd) {
        cd(null, file.originalname);
    }
});
const uploads = multer({storage: storage});

// ролторы
router.post('/rester', UserController.register)
router.post('/login', UserController.login)
router.get('/current', UserController.current)
router.get('/users/:id', UserController.getUserById)
router.put('/users/:id', UserController.updateUser)

module.exports = router;