import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
const routes = require('./routes/routes.js');


dotenv.config();


const app = express();
const PORT = 5000

//cors
app.use(cors());

//middleware
app.use(express.json())

//home route
app.get('/',(req,res)=>{
    res.send('Hello World!')
})

//routes
app.use('/api',routes)


app.listen(PORT,()=>{
    console.log(`Server is running on port ${PORT}`)
})
