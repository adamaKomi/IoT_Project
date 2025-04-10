require("dotenv").config();
const app = require("./src/app")
const cors = require("cors");
const {connect_congestionDB} = require("./src/config/db/congestionDB");
const {connect_sumoTrafficDB} = require("./src/config/db/sumoTraficDB")

const PORT = 5001;
app.use(cors());

async function startServer(){
    await connect_sumoTrafficDB();
    await connect_congestionDB();

    app.listen(PORT, ()=>{
        console.log(`Server en cours d'execution sur http://127.0.0.1:${PORT}`)
    })
}


startServer();