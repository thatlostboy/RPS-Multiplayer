$(document).ready(function () {
    console.log("ready!");

    // add player on clicking Start
    $("body").on("click", "#playerStart", function (event) {
        event.preventDefault();
        var playerName = $("#playerName").val().trim();
        console.log(playerName);
        addPlayer(playerName);
    });



    // player pick rock,paper,scissor
    $("body").on("click", ".playerSelect", function (event) {
        event.preventDefault();
        let playerNumber = $(this).attr("playernum");
        let playerChoice = $(this).attr("playerchoice");

        // create info
        choice = { choice: playerChoice };

        //update selection on DB
        database.ref("players/" + playerNumber).update(choice);

        //update photo based on selection
        playerNumberInt = parseInt(playerNumber);
        renderSelection(playerNumberInt, playerChoice);

    });


    // trash talk handler
    $("body").on("click", ".trashTalk", function (event) {
        event.preventDefault();
        if (playingNow) {
            let name = player[playerNumber - 1].name;
            let msg = $("#trashTalkText").val().trim();
            if (msg !== "") {
                msgObj = {
                    playerNum: playerNumber,
                    playerName: name,
                    playerMsg: msg,
                }
                database.ref("/chat").push(msgObj);
                $("#trashTalkText").val("");
            }
        } else {
            $("#trashTalkText").val("Type in your name above and click Start to play and trash Talk!");
        }

    })

    // reset everything if acting wierd
    $("body").on("click", "#resetBtn", function (event) {
        event.preventDefault();
        var resetConfirmed = confirm("Are you sure you want to reset?  Reset will clear chat and current players?  You can just refresh your browser or shut it off if you want a new Participant to Join.  If so opt to do this reset, please refresh all the browsers watching or participating in the RPG game");
        if (resetConfirmed) {
            database.ref().remove();
        }

    });

});



//// initialize players in array
var player = [
    {
        name: "",
        wins: 0,
        losses: 0,
        choice: "",
    },
    {
        name: "",
        wins: 0,
        losses: 0,
        choice: "",
    }

]

var playerNumber = -1;
var playingNow = false;



// Initialize Firebase
var config = {
    apiKey: "AIzaSyCjzlU1T9qxbj-fuD1X-Ch8DP40ZOWcjNk",
    authDomain: "rps-multiplayer-3167b.firebaseapp.com",
    databaseURL: "https://rps-multiplayer-3167b.firebaseio.com",
    projectId: "rps-multiplayer-3167b",
    storageBucket: "rps-multiplayer-3167b.appspot.com",
    messagingSenderId: "452227592183"
};

firebase.initializeApp(config);
var database = firebase.database();

// initialize Names if any there.  
database.ref("players").once("value", function (snapshot) {
    var playersRes = snapshot.val();
    $("#player1name").text("Player 1: " + playersRes[1].name);
    $("#player2name").text("Player 2: " + playersRes[2].name);
});


// game played mostly by checking the results of child changed for players below
// t
var count = 0;
database.ref("players").on("child_changed", function (snapshot) {
    count++;
    console.log("checking count: ", count);

    // detect change in player activities
    console.log("let's see if I detect change on player X");
    console.log("changedinfo playerX:", snapshot.val());

    // capture value of choices made by players
    database.ref("players").once("value", function (snapshot) {

        var playerRes = snapshot.val();

        // let's see what changed
        console.log("changed results: ", playerRes);

        // capture player information into variable
        var player1Choice = playerRes[1].choice;
        var player1Wins = playerRes[1].wins;
        var player1Losses = playerRes[1].losses;
        var player2Choice = playerRes[2].choice;
        var player2Wins = playerRes[2].wins;
        var player2Losses = playerRes[2].losses;

        // refresh name list
        player[0].name = playerRes[1].name;
        player[1].name = playerRes[2].name;

        // update names and scores on display 
        $("#player1wins").text(player1Wins);
        $("#player1losses").text(player1Losses);
        $("#player2wins").text(player2Wins);
        $("#player2losses").text(player2Losses);


        var playerRes = snapshot.val();

        // who's turn is it?
        console.log("what is playerNumver an choice?", playerNumber, player1Choice, player2Choice);



        if (playerNumber === 1) {
            if (player1Choice === "") {
                $("#playerTurn").text("It's your turn , " + player[0].name + " !");
                console.log("It's your turn , player 1!");
                // if player 1 already made selection then waiting on player 2
            } else if (player2Choice === "") {
                $("#playerTurn").text("Waiting on " + player[1].name + " !");
                console.log("Waiting on player 2!", player[1].name);
            };
        } else if (playerNumber === 2) {
            if (player2Choice === "") {
                $("#playerTurn").text("It's your turn , " + player[1].name + " !");
                console.log("It's your turn , player 2!");
                // if player 1 already made selection then waiting on player 2
            } else if (player1Choice === "") {
                $("#playerTurn").text("Waiting on " + player[0].name + " !");
                console.log("Waiting on player 1!");
            };
        } else {
            $("#playerTurn").empty();
        }



        // if both values are filled in, we have a game!  
        if (player1Choice !== "" && player2Choice !== "") {

            // reset values
            let clearChoice = { choice: "" };
            database.ref("players/1").update(clearChoice);
            database.ref("players/2").update(clearChoice);
            console.log("it's battle time: ", player1Choice, player2Choice);

            // update winner
            var winner = playGameLogic(player1Choice, player2Choice);
            console.log("winner is: ", winner);

            // each player update their own score on the DB
            // this is to avoid duplication where 
            // each player updates the same DB with the same wins/loss
            // resulting in doublein
            // eg.  player 1, updates their record in the DB for player 1
            // plyaer 2 updates their record in the DB for player 2
            if (playerNumber === 1) {

                // increment their own win/loss counter in DB
                if (winner === "player1") {
                    player1Wins++;
                    player1results = {
                        wins: player1Wins,
                    }
                    database.ref("players/1").update(player1results);
                } else if (winner == "player2") {
                    player1Losses++;
                    player1results = {
                        losses: player1Losses,
                    }
                    database.ref("players/1").update(player1results);
                }



            } else if (playerNumber === 2) {

                // increment their own win/loss counter in DB
                if (winner === "player2") {
                    player2Wins++;
                    player2results = {
                        wins: player2Wins,
                    }
                    database.ref("players/2").update(player2results);
                } else if (winner == "player1") {
                    player2Losses++;
                    player2results = {
                        losses: player2Losses,
                    }
                    database.ref("players/2").update(player2results);
                }
            }

            // update the display to show all  
            renderSelection(1, player1Choice);
            renderSelection(2, player2Choice);

            // update displays for both revealing all!
            renderEndGame(playerNumber, winner);

        }

    });


});



// append any new chat messages to the log
database.ref('chat').on("child_added", function (snappy) {


    msgObj = snappy.val();
    console.log("what chat message was was added: ", msgObj);

    var spanObj = $("<span>");
    if (msgObj.playerNum === 1) {
        spanObj.addClass("player1RPS");
    } else if (msgObj.playerNum === 2) {
        spanObj.addClass("player2RPS");
    }



    spanObj.text(msgObj.playerName + ": " + msgObj.playerMsg);


    $("#chatBox").append(spanObj);
    $('#chatBox').animate({ scrollTop: "100000px" });

    
});



// this is used to check if we want to add new pariticpants when they join 
database.ref('players').on("child_added", function (snappy) {

    console.log("waht was added: ", snappy.val());

    var playersParent = database.ref().on("value", function (snapshot) {

        let player1Exist = snapshot.child('players/1').exists();
        let player2Exist = snapshot.child('players/2').exists();
        database.ref("players").once("value", function (snapshot) {
            var playersRes = snapshot.val();
            $("#player1name").text("Player 1: " + playersRes[1].name);
            $("#player2name").text("Player 2: " + playersRes[2].name);
        });

        if (player1Exist) {
            player[0].name=snapshot.child('players/1').val().name.trim();
        }

        if (player2Exist) {
            player[1].name = snapshot.child('players/2').val().name.trim();
        }

        database.ref().off("value");

        console.log("let's see if I detect added");
        console.log("initialize playerstatus add", player1Exist, player2Exist);
        console.log(snapshot.val());

        /// display "Game is in Progress"
        if (!playingNow) {
            if (player1Exist && player2Exist) {
                $('#nameEntry').html("<h3>Game is in Progress</h3>")
                $('.trashTalk').attr("disabled", "disabled");
            }
        }

    });
});


// this is used to check if we want to add new pariticpants when they leave
database.ref('players').on("child_removed", function (snapshot) {

    var player1Exist = false;
    var player2Exist = false;
    database.ref("players").once("value", function (snapshot) {
        player1Exist = snapshot.child('1').exists();
    });

    database.ref("players").once("value", function (snapshot) {
        player2Exist = snapshot.child('2').exists();
    });

    console.log("let's see if I detect removed");
    console.log(player1Exist);
    console.log("------");
    console.log("initialize playerstatus removed", player1Exist, player2Exist);
    console.log(snapshot.val());


    // name entry
    addNameHTML = `
    <form id="nameEntry" class="form-inline">
    <div class="form-group mx-sm-3 mb-2">
        <label for="playerName" class="sr-only"></label>
        <input type="text" class="form-control" id="playerName" placeholder="Name">
    </div>
    <div id="playerInfo">
        <button id="playerStart" class="helo btn btn-primary mb-2"> Start</button>
    </div>
</form>`;

    // if you aren't currently playing, display prompt to allow new player to join
    if (!playingNow) {
        $('#whoAmI').html(addNameHTML);
    }

    console.log("-----> did i get called here?-----", player1Exist, player2Exist, "-----");
    // if player 1 exist, blank out player 2
    if (player1Exist) {
        $("#player2name").text("Waiting for Player 2");
        $("#player2wins").text("0");
        $("#player2losses").text("0");
        let name = player[1].name + " disconnected ";
        let msg = "";
        msgObj = {
            playerNum: 2,
            playerName: name,
            playerMsg: msg,
        };
        // only add chat message if you are player 1, this avoid duplicates
        if (playingNow && playerNumber === 1) {
            database.ref("/chat").push(msgObj);
            console.log("I just got pushed in!  ");
        }


        // if playdr 2 exit, blank out player 1
    } else if (player2Exist) {
        $("#player1name").text("Waiting for Player 1");
        $("#player1wins").text("0");
        $("#player1losses").text("0");
        let name = player[0].name + " disconnected" ;
        let msg = "";
        msgObj = {
            playerNum: 1,
            playerName: name,
            playerMsg: msg,
        };
        // only add chat message if you are player 2, this avoid duplicates
        if (playingNow && playerNumber === 2) {
            database.ref("/chat").push(msgObj);
            console.log("I just got pushed in!  ");
        }

        // if either exist, blank them all out!  
    } else {
        $("#player2name").text("Waiting for Player 2");
        $("#player2wins").text("0");
        $("#player2losses").text("0");
        $("#player1name").text("Waiting for Player 1");
        $("#player1wins").text("0");
        $("#player1losses").text("0");

    }




});

// after click, replace div with icon of rock, paper, or scissor
function renderSelection(playerNum, playerSel) {

    var placeholder = `<i class="far fa-hand-rock fa-rotate-90 player1RPS"></i><i class="far fa-hand-scissors fa-rotate-90 fa-flip-horizontal player1RPS"></i><i class="far fa-hand-paper fa-rotate-90 player1RPS"></i><i class="far fa-hand-rock player2RPS player2RP"></i><i class="far fa-hand-scissors player2RPS"></i><i class="far fa-hand-paper player2RPS player2RP"></i>`;

    var picSelection = "";
    if (playerNum === 1) {
        if (playerSel === "rock") {
            picSelection = '<i class="far fa-hand-rock fa-8x fa-rotate-90 player1RPS"></i>';
        } else if (playerSel === "paper") {
            picSelection = '<i class="far fa-hand-paper fa-8x fa-rotate-90 player1RPS"></i>';
        } else if (playerSel === "scissor") {
            picSelection = '<i class="far fa-hand-scissors fa-8x fa-rotate-90 fa-flip-horizontal player1RPS"></i>';
        }
        $("#player1Select").html(picSelection);
    } else if (playerNum === 2) {
        if (playerSel === "rock") {
            picSelection = '<i class="far fa-hand-rock fa-8x player2RPS player2RP"></i>';
        } else if (playerSel === "paper") {
            picSelection = '<i class="far fa-hand-paper fa-8x player2RPS player2RP"></i>';
        } else if (playerSel === "scissor") {
            picSelection = '<i class="far fa-hand-scissors fa-8x player2RPS"></i>';
        }
        $("#player2Select").html(picSelection);
    }
}





function addPlayer(playerName) {
    console.log("addPlayer");

    var playersExist = false;
    var player1Exist = false;
    var player2Exist = false;

    database.ref().on("value", function (snapshot) {
        playersExist = snapshot.child('players').exists();
        player1Exist = snapshot.child('players/1').exists();
        player2Exist = snapshot.child('players/2').exists();
        console.log("------");
        console.log("playerstatus", player1Exist, player2Exist);

        // disable listening
        database.ref().off("value");


        // if players does not exist, join as player 1
        if (!playersExist) {
            // add player 1
            player[0].name = playerName;
            database.ref("/players/1").set(player[0]);
            console.log("Player 1 added on empty");
            playerNumber = 1;

            // blank out the opponent screen
            renderStartGame(playerNumber);


            playingNow = true;
            // call some display to update


        } // if only player 1 in game waiting, join as player 2 
        else if (player1Exist && !player2Exist) {
            // add player 2
            player[1].name = playerName;
            database.ref("/players/2").set(player[1]);
            console.log("Player 2 added.  Player 1 waiting");
            playerNumber = 2;

            // blank out the opponent screen
            renderStartGame(playerNumber);

            playingNow = true;

            // call some display to update

        } // if only player 2 in game waiting, join as player 1
        else if (player2Exist && !player1Exist) {
            // add player 1
            player[0].name = playerName;
            database.ref("/players/1").set(player[0]);
            console.log("Player 1 added.  Player 2 waiting");
            playerNumber = 1;

            // blank out the opponent screen
            renderStartGame(playerNumber);

            playingNow = true;
            // call some display to update


        }
        // else no space for game
        else {
            console.log("players slot is full");
            // call some display with bad news
        }


        // if players are in the game.   
        if (playerNumber > 0) {
            reference = "players/" + playerNumber;
            console.log(reference);

            // add disconnect listener, if disconected, will remove entry
            var playerStatus = database.ref("players/" + playerNumber);
            playerStatus.onDisconnect().remove();

            if (playingNow) {
                if (playerNumber === 1) {
                    $('#whoAmI').html("<h4>Welcome " + player[0].name + ', you are player 1: RED!</h4>');
                    $('#whoAmI').addClass('player1RPS');
                    $('.player1card').addClass("player1color");
                } else if (playerNumber === 2) {
                    $('#whoAmI').html("<h4>Welcome " + player[1].name + ', you are player 2: GREEN!</h4>');
                    $('#whoAmI').addClass('player2RPS');
                    $('.player2card').addClass("player2color");
                }

            }

        }

    });



}


// initialize display of start of game with the rock paper scissor selectors
function renderStartGame(playerNum) {

    var card1BodyHTML = `
    <p class="playerSelect" playernum="1" playerchoice="rock" >Rock</p>
    <p class="playerSelect" playernum="1" playerchoice="paper" >Paper</p>
    <p class="playerSelect" playernum="1" playerchoice="scissor">Scissor</p>
    `;

    var card2BodyHTML = `
    <p class="playerSelect" playerNum="2" playerchoice="rock" >Rock</p>
    <p class="playerSelect" playerNum="2" playerchoice="paper" >Paper</p>
    <p class="playerSelect" playerNum="2" playerchoice="scissor">Scissor</p>
    `;



    database.ref("players").once("value", function (snapshot) {
        var playersRes = snapshot.val();

        if (playerNum === 1) {
            $("#player1name").text("Player 1: " + playersRes[1].name);
            $("#player1wins").text(playersRes[1].wins);
            $("#player1losses").text(playersRes[1].losses);
            $("#player1Select").html(card1BodyHTML);
            $("#player2Select").empty();
            $("#winnerDeclared").html("BATTLING! <br> Pick your weapon!");
        } else if (playerNum === 2) {
            $("#player2name").text("Player 2: " + playersRes[2].name);
            $("#player2Select").html(card2BodyHTML);
            $("#player1Select").empty();
            $("#player2wins").text(playersRes[2].wins);
            $("#player2losses").text(playersRes[2].losses);
            $("#winnerDeclared").html("BATTLING! <br> Pick your weapon!");
        } else {
            $("#player1Select").empty();
            $("#player2Select").empty();
            $("#winnerDeclared").html("BATTLING! <br> Pick your weapon!");
        };


    });
}



// declare winner and update the results
function renderEndGame(playerNum, winner) {
    console.log("endGame!")

    database.ref("players").once("value", function (snapshot) {
        var playersRes = snapshot.val();

        console.log("winner paassed in is: ", winner);
        // display winner
        if (winner === "player1") {
            $("#winnerDeclared").html("Winner is:<br>" + playersRes[1].name);
        } else if (winner === "player2") {
            $("#winnerDeclared").html("Winner is:<br>" + playersRes[2].name);
        } else {
            $("#winnerDeclared").html("It's a Tie!");
        }

        // wait X seconds to enjoy victory before next round
        setTimeout(function () {
            renderStartGame(playerNum);
        }, 3000)

    });
}


function playGameLogic(player1, player2) {
    let result = "tie";
    if (player1 === "rock" && player2 == "scissor") {
        result = "player1";
    } else if (player1 === "rock" && player2 == "paper") {
        result = "player2";
    } else if (player1 === "paper" && player2 == "rock") {
        result = "player1";
    } else if (player1 === "paper" && player2 == "scissor") {
        result = "player2";
    } else if (player1 === "scissor" && player2 == "rock") {
        result = "player2";
    } else if (player1 === "scissor" && player2 == "paper") {
        result = "player1";
    } else {
        result = "tie";
    }
    return (result);
}
