// This program serves as a broker, leak detector and publisher. That is, it is a broker that continuously monitors leak and publishes values to the broker spun up by itself, for clients that have been connected to it

// Setting up the Broker
import * as express from "express";
import * as bodyParser from "body-parser";
import * as fs from "fs";
import * as request from "request";
import * as WebSocket from "ws";
import * as http from 'http';

let httpport = 8133;
let sockport = 8134;

// The following data are taken from "saved data" folder
// This is a JSON with UID as the key
let candidates = {};
// This is a JSON with UID as the key
let scores = {};
// These are all the other misc data that we would want to store
let misc = {
    "setno": 0
};

let app
let app2;
let server;
let websocket: WebSocket[] = [];

//let host = "localhost";
let host = "34.93.141.229";
//let contestName = "thisisatemporaryevent";
let contestName = "9e95a086a6fcc6889f7f22b17b18eeed79f911ed61b91e6f806c3f22ac720a83"
//let contestName2 = "ffb441d5ac87ce80e1503a3d81340a22167dd883ff369a6032224b4c52ff5d0b"
let adminpassword = "olatech";

let passwords = ["6fBgDhF0UBER!", "3aLbNcP2UBER!", "3lFmHnJ2UBER!", "1gHhJiL2UBER!", "5tEuGvI0UBER!", "1eIfKgM1UBER!", "2wTxVyX1UBER!", "4qArCsE2UBER!", "6oCpEqG2UBER!", "1iEjGkI1UBER!", "0kJlLmN0UBER!", "0aBbDcF2UBER!", "4uFvHwJ1UBER!", "1jUkWlY2UBER!", "1pDqFrH0UBER!"];

let points = {
    "traceforpass": 3,
    "traceforpassPenalty": 3,
    "hackerrankwithouttracePenaltyPenalty": 1000
};

ourprocess();

async function ourprocess(){
    try{
        // In the following three lines, we load the data from the saved file
        await loadCandidates();
        await loadScores();
        await loadMisc();

        app = express();
        app.use(bodyParser.json());
        app.use(bodyParser.urlencoded());
        
        app.get("/getPass", (req, res, next) => {
            // This request would be sent by candidates
            if(scores[req.query["uid"]] === undefined){
                res.send("There is no such registered candidate");
            }
            else{
                try{
                    if(scores[req.query["uid"]]["hasTraced"] == true){
                        res.send("You can do that only once (warning for your safety). Stop fiddling around and solve round two. This act of yours has been noted by the team");
                        scores[req.query["uid"]]["warning"] += 1;
                        saveScores();
                        return;
                    }
                    if(passwords[Number.parseInt(req.query["uid"].substr(3, 5))] == req.query["password"]){
                        scores[req.query["uid"]]["hasTraced"] = true;
                        saveScores();
                        Object.keys(scores).forEach((key, index) => {
                            // key: the name of the object key
                            // index: the ordinal position of the key within the object 
                            if(scores[key]["hasTraced"] == true){
                                scores[key]["score"] += points.traceforpass;
                            }
                        });
                        scores[req.query["uid"]]["attempt"] += 1;
                        saveScores();
                        res.send("Congratulations! Head over to http://www.hackerrank.com/" + contestName + " for your next challenge");
                    }
                    else{
                        scores[req.query["uid"]]["score"] -= points.traceforpassPenalty;
                        scores[req.query["uid"]]["penalty"] += points.traceforpassPenalty;
                        scores[req.query["uid"]]["attempt"] += 1;
                        saveScores();
                        res.send("The Password you have traced is wrong. Attempt no: " + scores[req.query["uid"]]["attempt"]);
                    }
                }
                catch(err){
                    res.send("An Error occured");
                }
            }
        });
        app.get("/getQuestion", (req, res, next)=>{
            if(req.query["set"] == undefined){
                res.send("Give the set number as 'set'");
            }
            else{
                if(req.query["pass"] != adminpassword){
                    res.send("Give the correct Admin password as 'pass'");
                }
                else{
                    res.sendFile(__dirname + "/wwwroot/questions/user" + req.query["set"] + ".pdf");
                }
            }
        });
        app.get("/", (req, res, next)=>{
            res.sendFile(__dirname + "/wwwroot/index.html");
        });
        app.get("*", (req, res, next)=>{
            try{
                if(req.path == "/password.html/thereisnoneedofthisroute"){
                    res.send("We really mean it! 'There is no need of this route'. Remove the last part. Go to http://" + host + ":" + httpport + "/password.html");
                }
                else if(req.path != "" && !req.path.startsWith("/questions")){
                    res.sendFile(__dirname + "/wwwroot/" + req.path);
                }
            }
            catch(err){
                res.send('This is a Typical 404');
            }
        });
        app.post("/addCandidate", (req, res, next)=>{
            try{
                if(req.body["password"] == adminpassword){
                    let rand = pad(Number.parseInt((Math.random() * 1000).toString()), 3);
                    let set = pad(misc.setno, 3);
                    let uid = rand + set;
                    candidates[uid] = req.body;
                    candidates[uid]["uid"] = uid;
                    saveCandidates();
                    misc.setno++;
                    if(misc.setno == 15){
                        misc.setno = 0;
                    }
                    saveMisc();
                    scores[uid] = {
                        "hasTraced": false,
                        "warning": 0,
                        "score": 0,
                        "attempt": 0,
                        "penalty": 0,
                        "hackscore": 0,
                        "hackrank": 10000
                    };
                    saveScores();
                    res.send(uid);
                }
                else{
                    res.send("Admin Password is Wrong!");
                }
            }
            catch(err){
                res.send("Error in the server");
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
        server.listen(sockport, () => {
            console.log("Socket Server started on port " + sockport);
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
                    if(scores[key]["hasTraced"] == false){
                        scores[key]["score"] -= points.hackerrankwithouttracePenaltyPenalty;
                        scores[key]["penalty"] += points.hackerrankwithouttracePenaltyPenalty;
                    }
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
        candidates = JSON.parse(fs.readFileSync(__dirname + "/saved data/candidates.json").toString());
    }
    catch(err){
        candidates = {};
        saveCandidates();
    }
}
function loadScores(){
    try{
        scores = JSON.parse(fs.readFileSync(__dirname + "/saved data/scores.json").toString());
    }
    catch(err){
        scores = {};
        saveScores();
    }
}
function loadMisc(){
    try{
        misc = JSON.parse(fs.readFileSync(__dirname + "/saved data/misc.json").toString());
    }
    catch(err){
        misc = {
            "setno": 0
        };
        saveMisc();
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
            "score": scores[key]["score"] + scores[key]["hackscore"],
            "attempt": scores[key]["attempt"],
            "penalty": scores[key]["penalty"],
            "team_name": candidates[key]["team_name"],
            "hackerrank": candidates[key]["hackerrank"],
            "hackrank": scores[key]["hackrank"]
        });
    });
    publish(JSON.stringify(temp));
}
function saveMisc(){
    fs.writeFileSync(__dirname + '/saved data/misc.json', JSON.stringify(misc));
}

function pad(num, size) {
    let s = num+"";
    while (s.length < size) s = "0" + s;
    return s;
}
