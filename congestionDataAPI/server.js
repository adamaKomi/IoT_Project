require("dotenv").config();
const cors = require("cors");

const app = require("./src/app");
const {connect_congestionDB} = require("./src/config/db/congestionDB");

const PORT = 4000;

app.use(cors());



const startServer = async() =>{
    try {
        await connect_congestionDB();
        
        app.listen(PORT, () =>{
            console.log(`Server en cours d'execution sur http://127.0.0.1:${PORT}`)
        })
    } catch (error) {
        
    }
}

startServer();