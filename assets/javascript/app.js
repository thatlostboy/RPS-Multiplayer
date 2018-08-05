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
var notPlayingNow = true;

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


// game played mostly by checking the results
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

        // capture player ifno
        var player1Choice = playerRes[1].choice;
        var player1Wins = playerRes[1].wins;
        var player1Losses = playerRes[1].losses;
        var player2Choice = playerRes[2].choice;
        var player2Wins = playerRes[2].wins;
        var player2Losses = playerRes[2].losses;

        // if both values are  filled in, we have a game!  
        if (player1Choice !== "" && player2Choice !== "") {

            // reset values
            let clearChoice = { choice: "" };
            database.ref("players/1").update(clearChoice);
            database.ref("players/2").update(clearChoice);
            console.log("it's battle time: ", player1Choice, player2Choice);

            // update winner
            var winner = playGameLogic(player1Choice, player2Choice);
            console.log("winner is: ", winner);

            // each player update their own scores
            if (playerNumber === 1) {
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


            // update displays for both revealing all!
            renderEndGame(playerNumber, winner);

        }

    });


});




// this is used to check if we want to add new pariticpants when they join 
database.ref('players').on("child_added", function (snappy) {

    console.log("waht was added: ", snappy.val());

    var playersParent = database.ref().on("value", function (snapshot) {

        let player1Exist = snapshot.child('players/1').exists();
        let player2Exist = snapshot.child('players/2').exists();

        database.ref().off("value");

        console.log("let's see if I detect added");
        console.log("initialize playerstatus add", player1Exist, player2Exist);
        console.log(snapshot.val());

        /// display "Game is in Progress"
        if (notPlayingNow) {
            if (player1Exist && player2Exist) {
                $('#gameStatus').show();
                $('#nameEntry').hide();
                console.log("should block now!")
            } else {
                $('#gameStatus').hide();
                $('#nameEntry').show();
            }
        } else {
            // if playing and both players exist, show the names
            if (player1Exist && player2Exist) {
                database.ref("players").once("value", function (snapshot) {
                    var playersRes = snapshot.val();
                    $("#player1name").text(playersRes[1].name);
                    $("#player2name").text(playersRes[2].name);
                });
            }
        }

    });
});


// this is used to check if we want to add new pariticpants when they leave
database.ref('players').on("child_removed", function (snapshot) {
    var player1Exist = snapshot.child('1').exists();
    var player2Exist = snapshot.child('2').exists();
    console.log("let's see if I detect removed");
    console.log(player1Exist);
    console.log("------");
    console.log("initialize playerstatus removed", player1Exist, player2Exist);
    console.log(snapshot.val());


    if (notPlayingNow) {
        if (player1Exist && player2Exist) {
            $('#gameStatus').show();
            $('#nameEntry').hide();
            console.log("should block now!")
        } else {
            $('#gameStatus').hide();
            $('#nameEntry').show();
        }
    }
});



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


            notPlayingNow = false;

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

            notPlayingNow = false;

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

            notPlayingNow = false;

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

            if (!notPlayingNow) {
                if (playerNumber === 1) {
                    $('#whoAmI').html(player[0].name)
                } else if (playerNumber === 2) {
                    $('#whoAmI').html(player[1].name)
                }

            }

        }

    });



}


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
            $("#player1name").text(playersRes[1].name);
            $("#player1wins").text(playersRes[1].wins);
            $("#player1losses").text(playersRes[1].losses);
            $("#player1Select").html(card1BodyHTML);
            $("#player2Select").empty();
            $("#winnerDeclared").html("BATTLING!")
        } else if (playerNum === 2) {
            $("#player2name").text(playersRes[2].name);
            $("#player2Select").html(card2BodyHTML);
            $("#player1Select").empty();
            $("#player2wins").text(playersRes[2].wins);
            $("#player2losses").text(playersRes[2].losses);
            $("#winnerDeclared").html("BATTLING!")
        } else {
            $("#player2Select").empty();
            $("#player2Select").empty();
            $("#winnerDeclared").html("BATTLING!")
        };


    });
}


function renderEndGame(playerNum, winner) {
    console.log("endGame!")

    database.ref("players").once("value", function (snapshot) {
        var playersRes = snapshot.val();

        console.log("winner paassed in is: ",winner);
        // display winner
        if (winner === "player1") {
            $("#winnerDeclared").html("Winner is: " + playersRes[1].name);
        } else if (winner === "player2") {
            $("#winnerDeclared").html("Winner is: " + playersRes[2].name);
        } else {
            $("#winnerDeclared").html("It's a Tie!");
        }

        console.log("Did I make it here?");

        // update scores on display
        $("#player1wins").text(playersRes[1].wins);
        $("#player1losses").text(playersRes[1].losses);
        $("#player2wins").text(playersRes[2].wins);
        $("#player2losses").text(playersRes[2].losses);


        // show both chosen weapons


        // wait 1 second to next round
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
