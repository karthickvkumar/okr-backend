const express = require('express');
const app = express();
const Joi = require('@hapi/joi');

app.use(express.json());
app.use(function (req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    res.setHeader('Access-Control-Allow-Credentials', true);
    next();
    express.json();
});

let Users = [];


app.get('/api/status', (req, res) => {
    res.send('Server is Up and Running')
});

app.get('/api/users', (req, res) => {
    let userList = Users.map(user => user.name);
    res.send(userList);
});

app.post('/api/login', (req, res) => {
    let { error } = validateLogin(req.body);
    if (error) {
        res.status(400).send(error.details[0].message);
        return;
    }
    let user = findUser(req.body.username);
    if (user instanceof Object && user.name == req.body.username) {
        let response = {
            isAuthenticated: true,
            status: 'Username alredy registered'
        }
        res.send(response);
        return;
    }
    let createUser = {
        name: req.body.username,
        boards: [{
            "id": "board-1",
            "title": "OKR Board 1",
            "board": {
                "title": 'Requirement Management',
                "talks": []
            }
        }, {
            "id": "board-2",
            "title": "OKR Board 2",
            "board": {
                "title": 'Requirement Management',
                "talks": []
            }
        }]
    }
    Users.push(createUser);
    let response = {
        isAuthenticated: true,
        status: 'Username registered successfully'
    }
    res.send(response);
});

app.get('/api/board/:username', (req, res) => {
    let user = findUser(req.params.username);
    if (user && user.boards && user.boards.length > 0) {
        res.send(user.boards);
    }
    else {
        let message = {
            text: "There is no boards to display"
        }
        res.send(message);
    }
})

app.post('/api/board/add', (req, res) => {
    let user = findUser(req.body.username);
    let board = req.body.board;
    if (user && user.boards instanceof Array && board instanceof Object) {
        user.boards.push(board);
        let message = {
            text: board.title + " created successfully"
        }
        res.send(message);
    }
    else {
        let message = {
            text: "There is no boards to display"
        }
        res.send(message);
    }
})

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
                res.send(user.boards);
            }
            else if (parentCard && parentCard.talks && card) {
                parentCard.talks.push(card);
                let message = {
                    text: 'Card created successfully',
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
            text: 'No user found',
        }
        res.send(user.boards);
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
                    text: 'No card found',
                }
                res.send(user.boards);
            }
            else if (oldCard && newCard) {
                Object.assign(oldCard, newCard);
                let message = {
                    text: 'Card updated successfully',
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
            text: 'No user found',
        }
        res.send(user.boards);
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
            text: 'No user found',
        }
        res.send(user.boards);
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