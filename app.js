const express = require("express");
const socket = require("socket.io");
const http = require("http");
const { Chess } = require("chess.js");
const path = require("path");
const { disconnect } = require("process");
const app = express();

//connecting the express with the http server
const server =  http.createServer(app);
const io = socket(server);

const chess = new Chess();
let players = {};
let currentPlayer = "w";

app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname,"public")));


app.get("/",(req, res) => {
    res.render("index", {title: "Chess Game"});
})

io.on("connection", function(uniquesocket){
    console.log("connected")
    // sending something from the server to all the clients after receiving something from the single user i.e browser
    // uniquesocket.on("churan", function(){
    //     io.emit("churan paapdi");
    // });

    //to display message when the user disconnects !
    // uniquesocket.on("disconnect", function(){
    //     console.log("disconnected");
    // })

    
    // assigning the id's to the players entered 
    //first player who enters the game is always asigned with the white ponn
    if (!players.white) {
        players.white = uniquesocket.id;
        uniquesocket.emit("playerRole" , "w");   
    }
    //second player who enters the game is always asigned with the black ponn
    else if (!players.black) {
        players.black = uniquesocket.id;
        uniquesocket.emit("playerRole", "b");
    }
    //the left out player who enter the game will be assigned as the spectator 
    else{
        uniquesocket.emit("spectatorRole");
    }

    //to delete the player when any player disconnects and wait for another player to join 
    uniquesocket.on("disconnect", function(){
        if(uniquesocket.id === players.white){
            delete players.white;
        }
        else if(uniquesocket.id === players.black){
            delete players.black;
        }
    });

    uniquesocket.on("move",(move) =>{
        try {
            if (chess.turn() === "w" && uniquesocket.id !== players.white) return;
            if (chess.turn() === "b" && uniquesocket.id !== players.black) return;

            const result = chess.move(move);
            if (result) {
                currentPlayer = chess.turn();
                io.emit("move",move)
                io.emit("boardState", chess.fen()) // here fen method is used to get the current board state
            }
            else{
                console.log("Invalid move :", move);
                uniquesocket.emit("invalidMove",move)
            }
        } catch (err) {
            console.log(err);
            uniquesocket.emit("Invalid Move", move);
        }
    })
});

server.listen(3000, function(){
    console.log("Server is running at the port 3000")
});