A Requirement Management Tool

To set enviromnet:
export NODE_ENV=development //default
NODE_ENV=production nodemon app.js //alternative
To read env - app.get('env')

Templating:
- pug, mustache, ejs
app.set('view engine', 'pug')
app.set('views', './views')