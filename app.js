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

mongoose.connect('mongodb://localhost/okr-node', { useNewUrlParser: true })
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
    date: Date,
    createdAt: Date
});
const Boards = mongoose.model('Boards', boardSchema);


app.get('/api/users', (req, res) => {
    let userList = Users.map(user => user.name);
    res.send(userList);
});

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

app.post('/api/board/add', (req, res) => {
    async function listBoards() {
        try {
            const board = new Boards({
                userId: req.body.userId,
                title: req.body.title,
                description: req.body.description
            });
            const response = await board.save();
            res.send(response);
        }
        catch (error) {
            res.send(error);
        }
    }
    listBoards(req.body);
});


app.get('/api/board/:boardId/:username', (req, res) => {
    let user = findUser(req.params.username);
    if (user && user.boards) {
        let board = findBoard(user, req.params.boardId);
        if (board) {
            res.send(board);
        } else {
            let message = {
                text: "There is no boards to display"
            }
            res.send(message);
        }
    }
    else {
        let message = {
            text: "There is no boards to display"
        }
        res.send(message);
    }
});

app.post('/api/board/:boardId/add', (req, res) => {
    let user = findUser(req.body.username);
    if (user && user.boards) {
        let selectedBoard = findBoard(user, req.params.boardId);
        if (selectedBoard && selectedBoard.board) {
            let parentCard = getByID(selectedBoard.board, req.body.parentId);
            let card = req.body.card;
            if (!parentCard && selectedBoard.board.talks) {
                selectedBoard.board.talks.push(card);
                let message = {
                    text: 'Card created successfully',
                }
                res.send(message);
            }
            else if (parentCard && parentCard.talks && card) {
                parentCard.talks.push(card);
                let message = {
                    text: 'Card created successfully',
                }
                res.send(message);
            } else {
                let message = {
                    text: 'There is no cards found',
                }
                res.send(message);
            }
        } else {
            let message = {
                text: 'There is no boards found',
            }
            res.send(message);
        }
    }
    else {
        let message = {
            text: 'Invalid username, please re-login',
        }
        res.send(message);
    }
});

app.put('/api/board/:boardId/edit', (req, res) => {
    let user = findUser(req.body.username);
    if (user && user.boards) {
        let selectedBoard = findBoard(user, req.params.boardId);
        if (selectedBoard && selectedBoard.board) {
            let oldCard = getByID(selectedBoard.board, req.body.cardId);
            let newCard = req.body.card;
            if (!oldCard) {
                let message = {
                    text: 'There is no cards found',
                }
                res.send(message);
            }
            else if (oldCard && newCard) {
                Object.assign(oldCard, newCard);
                let message = {
                    text: 'Card updated successfully',
                }
                res.send(message);
            } else {
                let message = {
                    text: 'There is no cards found',
                }
                res.send(message);
            }
        } else {
            let message = {
                text: 'There is no boards found',
            }
            res.send(message);
        }
    }
    else {
        let message = {
            text: 'Invalid username, please re-login',
        }
        res.send(message);
    }
});

app.delete('/api/board/:boardId/:username/delete/:parentId/:cardIndex', (req, res) => {
    let user = findUser(req.params.username);
    if (user && user.boards) {
        let selectedBoard = findBoard(user, req.params.boardId);
        if (selectedBoard && selectedBoard.board) {
            let parentCard = getByID(selectedBoard.board, req.params.parentId);
            let cardIndex = req.params.cardIndex;
            if (!parentCard) {
                let message = {
                    text: 'No card found',
                }
                res.send(user.boards);
            }
            else if (parentCard && parentCard.talks && cardIndex) {
                parentCard.talks.splice(cardIndex, 1)
                let message = {
                    text: 'Card deleted successfully',
                }
                res.send(user.boards);
            } else {
                let message = {
                    text: 'No card found',
                }
                res.send(user.boards);
            }
        } else {
            let message = {
                text: 'No board found',
            }
            res.send(user.boards);
        }
    }
    else {
        let message = {
            text: 'Invalid username, please re-login',
        }
        res.send(message);
    }
});

function findUser(username) {
    return Users.find(user => user.name == username);
}

function findBoard(user, boardId) {
    return user.boards.find(board => board.id == boardId);
}

function getByID(board, id) {
    let result = null
    if (id === board.id) {
        return board
    } else {
        if (board.talks) {
            board.talks.some(card => result = getByID(card, id));
        }
        return result;
    }
}

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