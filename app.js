const express = require('express');
const Joi = require('@hapi/joi');
const morgan = require('morgan');
const mongoose = require('mongoose');
const app = express();

const utility = require("./routes/utility");

app.use(function (req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    res.setHeader('Access-Control-Allow-Credentials', true);
    next();
});
app.use(express.json());
app.use(express.static('public'));
app.use(morgan('tiny'));
app.use('/api/status', utility);

const URI = "mongodb+srv://fpslabs:fpslabs@123@cluster0.apkym.mongodb.net/okr-node?retryWrites=true&w=majority";
const LocalURI = "mongodb://localhost/okr-node";

mongoose.connect(URI, { useNewUrlParser: true })
    .then(() => console.log('Connected to MongoDB...'))
    .catch(() => console.log('Unable to connect MongoDB...'))

const userSchema = new mongoose.Schema({
    username: String
});
const Users = mongoose.model('Users', userSchema);

const boardSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Users'
    },
    title: String,
    description: String,
    author: String,
    tags: [String],
    selectedDate: {
        start: Date,
        end: Date
    },
    createdAt: Date
});
const Boards = mongoose.model('Boards', boardSchema);

const cardSchema = new mongoose.Schema({
    boradId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Boards'
    },
    title: String,
    parentId: String,
    description: String,
    author: String,
    tags: [String],
    selectedDate: {
        start: Date,
        end: Date
    },
    createdAt: Date
});
const Cards = mongoose.model('Cards', cardSchema);

// Update login information
app.post('/api/login', (req, res) => {
    try {
        let { error } = validateLogin(req.body);
        if (error) {
            res.status(400).send(error.details[0].message);
            return;
        }
        async function createUser(username) {
            const isUser = await Users.findOne({ username });
            if (!isUser) {
                const users = new Users({
                    username
                });
                const response = await users.save();
                res.send(response);
                return;
            }
            res.send(isUser)
        }
        createUser(req.body.username);
    }
    catch (error) {
        res.status(500).send(error);
    }
});

//Get list of boards based on User ID
app.get('/api/boards/:userId', (req, res) => {
    async function getBoards() {
        try {
            const userId = req.params.userId;
            const boards = await Boards.find({ userId });
            res.send(boards);
        }
        catch (error) {
            res.status(500).send(error);
        }
    }
    getBoards();
});

//Create new board
app.post('/api/board/add', (req, res) => {
    async function addBoard() {
        try {
            const board = new Boards({
                userId: req.body.userId,
                title: req.body.title,
                description: req.body.description,
                author: req.body.author,
                tags: req.body.tags,
                selectedDate: req.body.selectedDate,
                createdAt: req.body.createdAt
            });
            const response = await board.save();
            res.send(response);
        }
        catch (error) {
            res.send(error);
        }
    }
    addBoard(req.body);
});

//Edit an existing board
app.put('/api/board/edit', (req, res) => {
    async function editBoard() {
        try {
            const _id = req.body._id;
            const updatedBoard = {
                userId: req.body.userId,
                title: req.body.title,
                description: req.body.description,
                author: req.body.author,
                tags: req.body.tags,
                selectedDate: req.body.selectedDate,
                createdAt: req.body.createdAt,
            };
            const response = await Boards.findByIdAndUpdate(_id, updatedBoard);
            res.send(response);
        }
        catch (error) {
            res.send(error);
        }
    }
    editBoard();
});

//Delete an existing board
app.delete('/api/board/delete/:boardId', (req, res) => {
    async function deleteBoard() {
        try {
            const _id = req.params.boardId;
            const response = await Boards.findByIdAndDelete(_id);
            res.send(response);
        }
        catch (error) {
            res.send(error);
        }
    }
    deleteBoard();
});

//Get list of cards based on Board Id
app.get('/api/cards/:boradId', (req, res) => {
    async function getCards() {
        try {
            const boradId = req.params.boradId;
            const cards = await Cards.find({ boradId });
            res.send(cards);
        }
        catch (error) {
            res.status(500).send(error);
        }
    }
    getCards();
})

//Create new cards
app.post('/api/card/add', (req, res) => {
    async function addCard() {
        try {
            const card = new Cards({
                boradId: req.body.boradId,
                title: req.body.title,
                description: req.body.description,
                author: req.body.author,
                parentId: req.body.parentId,
                tags: req.body.tags,
                selectedDate: req.body.selectedDate,
                createdAt: req.body.createdAt
            });
            const response = await card.save();
            res.send(response);
        }
        catch (error) {
            res.send(error);
        }
    }
    addCard();
});

//Edit an existing card
app.put('/api/card/edit', (req, res) => {
    async function editCard() {
        try {
            const _id = req.body._id;
            const updatedCard = {
                boradId: req.body.boradId,
                parentId: req.body.parentId,
                title: req.body.title,
                description: req.body.description,
                author: req.body.author,
                tags: req.body.tags,
                selectedDate: req.body.selectedDate,
                createdAt: req.body.createdAt,
            };
            const response = await Cards.findByIdAndUpdate(_id, updatedCard);
            res.send(response);
        }
        catch (error) {
            res.send(error);
        }
    }
    editCard();
});

//Delete an existing card
app.delete('/api/card/delete/:cardId', (req, res) => {
    async function deleteBoard() {
        try {
            const _id = req.params.cardId;
            const response = await Cards.findByIdAndDelete(_id);
            res.send(response);
        }
        catch (error) {
            res.send(error);
        }
    }
    deleteBoard();
});

function validateLogin(data) {
    const schema = Joi.object({
        username: Joi.string()
            .min(3)
            .required()
    });
    return schema.validate(data);
}

const PORT = process.env.PORT || 3000;
app.listen(PORT);