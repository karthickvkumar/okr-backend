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

let Board = {
    title: 'Requirement Management',
    talks: []
};

app.get('/api/status', (req, res) => {
    res.send('Server is Up and Running')
});

app.get('/api/users', (req, res) => {
    res.send(Users)
});

app.get('/api/board/:username', (req, res) => {
    let user = findUser(req.params.username)
    if (user && user.board instanceof Array) {
        res.send(user.board);
    }
    else {
        res.send(user);
    }
});

app.post('/api/board/add', (req, res) => {
    let user = findUser(req.body.username);
    let talks = req.body.talks;
    user.board.talks = talks;

    // let parentId = req.body.parentId;
    // let card = req.body.card;
    // if (!parentId) {
    //     user.board.talks.push(card);
    // }
    // else {
    //     let parentCard = findCard(user.board.talks, parentId);
    //     console.log(parentCard)
    //     if (!parentCard || parentCard.talks == undefined) {
    //         res.status(400).send("Something went worng, try again.");
    //         return;
    //     }
    //     parentCard.talks.push(card);
    // }

    let response = {
        status: 'card created successfully',
        createdAt: new Date()
    }
    res.send(response);
});

app.post('/api/board/edit', (req, res) => {
    let user = findUser(req.body.username);
    let talks = req.body.talks;
    user.board.talks = talks;

    // let id = req.body.id;
    // let editedCard = req.body.card;
    // let uneditedCard = findCard(user.board.talks, id);
    // Object.assign(uneditedCard, editedCard)

    let response = {
        status: 'card updated successfully',
        createdAt: new Date()
    }
    res.send(response);
});

app.post('/api/board/:username/delete', (req, res) => {
    let user = findUser(req.params.username);
    let talks = req.body.talks;
    user.board.talks = talks;

    // let parentId = req.params.parentId;
    // let id = req.params.id;
    // let parentCard = findCard(user.board.talks, parentId);
    // let index = parentCard.talks.findIndex(card => card.id == id);
    // parentCard.talks.splice(index, 1);

    let response = {
        status: 'card deleted successfully',
        createdAt: new Date()
    }
    res.send(response);
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
        board: Board
    }
    Users.push(createUser);

    let response = {
        isAuthenticated: true
    }
    res.send(response);
});

function findCard(talks, parentId) {
    const iterateFind = (childcard) => {
        return childcard.find((child) => {
            if (child.id == parentId) {
                return child
            }
            if (childcard.id !== parentId && childcard.talks instanceof Array && childcard.talks.length > 0) {
                return iterateFind(childcard.talks);
            }
        });
    }

    let targetcard = [];
    talks.forEach((card) => {
        if (card.id == parentId) {
            targetcard.push(card);
        }
        if (card.id !== parentId && card.talks instanceof Array && card.talks.length > 0) {
            targetcard.push(iterateFind(card.talks));
        }
    });
    return targetcard.length > 0 ? targetcard[0] : targetcard;
}

function findUser(username) {
    return Users.find(user => user.name == username);
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