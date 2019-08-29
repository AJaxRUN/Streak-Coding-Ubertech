// This program serves as a broker, leak detector and publisher. That is, it is a broker that continuously monitors leak and publishes values to the broker spun up by itself, for clients that have been connected to it

// Setting up the Broker
import * as express from "express";
import * as bodyParser from "body-parser";
import * as fs from "fs";
import * as request from "request";
import * as WebSocket from "ws";
import * as http from 'http';

let httpport = 8133;

// The following data are taken from "saved data" folder
// This is a JSON with UID as the key
let candidates = {};
// This is a JSON with UID as the key
let scores = {};
// These are all the other misc data that we would want to store
let misc = {
    "setno": 0
};

let round3percentage = 70/100;

let app
let app2;
let server;
let websocket: WebSocket[] = [];
let socketsettings = {
    port: 8134
};
//let host = "localhost";
//let host = "34.93.141.229";
//let contestName = "thisisatemporaryevent";
//let contestName = "9e95a086a6fcc6889f7f22b17b18eeed79f911ed61b91e6f806c3f22ac720a83"
let contestName = "ffb441d5ac87ce80e1503a3d81340a22167dd883ff369a6032224b4c52ff5d0b"
let adminpassword = "ola";

ourprocess();

async function ourprocess(){
    try{
        // In the following three lines, we load the data from the saved file
        await loadCandidates();
        await loadScores();
        
        app = express();
        app.use(bodyParser.json());
        app.use(bodyParser.urlencoded());
        
        app.get("/", (req, res, next)=>{
            res.sendFile(__dirname + "/wwwroot/index.html");
        });
        app.get("*", (req, res, next)=>{
            try{
                if(req.path == "/leaderboard.html"){
                    res.sendFile(__dirname + "/wwwroot/leaderboard2.html");
                }
                else if(req.path != ""){
                    res.sendFile(__dirname + "/wwwroot/" + req.path);
                }
            }
            catch(err){
                res.send('This is a Typical 404');
            }
        });
        app.post("/getAllCandidates", (req, res, next) => {
            // This request would sent by admins
            if(req.body["password"] == adminpassword){
                let temp = [];
                Object.keys(candidates).forEach((key, index) => {
                    // key: the name of the object key
                    // index: the ordinal position of the key within the object 
                    temp.push(candidates[key]);
                });
                res.send(temp);
            }
            else{
                res.send("404");
            }
        });
        app.listen(httpport, function () {
            console.log("HTTP server live in port " + httpport);
        });

        const app2 = express();
        //initialize a simple http server
        server = http.createServer(app2);
        //initialize the WebSocket server instance
        const wss = new WebSocket.Server({server});

        wss.on('connection', (ws: WebSocket) => {
            console.log("Connected to a client");
            websocket.push(ws);
        });

        //start our server
        server.listen(8134, () => {
            console.log("Socket Server started on port 8134");
        });
    }
    catch(err){
        console.log("Error happened... Restarting server");
        console.log(err);
        setTimeout(()=>{
            ourprocess();
        }, 1000);
    }
    repeatProcedure();
}

function repeatProcedure(){
    let url = "https://www.hackerrank.com/rest/contests/"+ contestName +"/leaderboard";
    request(url, (err, res, body)=>{
        if(err == null){
            body = JSON.parse(body);
            let result = {};
            for(let candidate of body["models"]){
                result[candidate["hacker"]] = candidate;
            }
            Object.keys(scores).forEach((key, index) => {
                if(result[candidates[key]["hackerrank"]] != undefined){
                    scores[key]["hackscore"] = Number.parseInt(result[candidates[key]["hackerrank"]]["score"]);
                    scores[key]["hackrank"] = Number.parseInt(result[candidates[key]["hackerrank"]]["rank"]);
                }
            });
            saveScores();
        }
    });
    setTimeout(()=>{
        repeatProcedure();
    }, 3000);
}

function publish(message: string) {
    console.log("Publishing " + message);
    for (let i = 0; i<websocket.length;){
        try{
            websocket[i].send(message);
            i++;
        }
        catch(err){
            websocket.splice(i, 1);
        }
    }
}

function loadCandidates(){
    try{
        candidates = JSON.parse(fs.readFileSync(__dirname + "/saved data/candidates2.json").toString());
    }
    catch(err){
        candidates = {};
        saveCandidates();
    }
}
function loadScores(){
    try{
        scores = JSON.parse(fs.readFileSync(__dirname + "/saved data/scores2.json").toString());
    }
    catch(err){
        scores = {};
        saveScores();
    }
}
function saveCandidates(){
    fs.writeFileSync(__dirname + '/saved data/candidates.json', JSON.stringify(candidates));
}
function saveScores(){
    fs.writeFileSync(__dirname + '/saved data/scores.json', JSON.stringify(scores));
    let temp = [];
    Object.keys(scores).forEach((key, index) => {
        // key: the name of the object key
        // index: the ordinal position of the key within the object 
        temp.push({
            "hasTraced": scores[key]["hasTraced"],
            "warning": scores[key]["warning"],
            "score": (1-round3percentage) * scores[key]["score"] + round3percentage*scores[key]["hackscore"],
            "attempt": scores[key]["attempt"],
            "penalty": scores[key]["penalty"],
            "team_name": candidates[key]["team_name"],
            "hackerrank": candidates[key]["hackerrank"],
            "hackrank": scores[key]["hackrank"]
        });
    });
    publish(JSON.stringify(temp));
}
function pad(num, size) {
    let s = num+"";
    while (s.length < size) s = "0" + s;
    return s;
}