import express from "express"
import bodyParser from 'body-parser'
import usersRoute from './routes/users.js';

const app = express()
const port = process.env.PORT || 4000

// Middleware
app.use(bodyParser.json())

//Routes
app.get('/', (req, res) => {
    res.send('Welcome to the LMS API!');
  });

// Use the users route
app.use(usersRoute);

//Listening to the port
app.listen(port, () => {
    console.log(`The app is listening to the Port: ${port}`)
})