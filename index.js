
/***** Define global variables: *****/
var inPlay   = false;
var gameWon  = false;
var currRow  = 1;
var currCol  = 1;
var wordLen  = 5;
var numRows  = wordLen + 1;
var prevCols = 6;
var prevRows = 6 + 1;
var currGuess = "";
var currAnswer = "";
var currAnsChar = [" ", " ", " ", " ", " ", " "];
var currHints = [0, 0];
var gamesStarted = [0, 0, 0];
var gamesWon = [0, 0, 0];
var totalHints = [0, 0, 0];
var hintDebt = 0;

//Define the multi-segment buttons and callbacks:
var seg4 = document.querySelector("button.seg4");
var seg5 = document.querySelector("button.seg5");
var seg6 = document.querySelector("button.seg6");

var keys = document.querySelectorAll("button.key");
var startBtn = document.querySelector("button.start");
var endBtn = document.querySelector("button.end");
var checkBtn = document.querySelector("button.check");
var hints = document.querySelectorAll("button.hint");


/***** Perform initialization: *****/

seg4.addEventListener("click", handleSegmentButton);
seg5.addEventListener("click", handleSegmentButton);
seg6.addEventListener("click", handleSegmentButton);
startBtn.addEventListener("click", startGame);
endBtn.addEventListener("click", endGame);
checkBtn.addEventListener("click", checkWord);

if (readLocalStorage() !== true) {
    updateLocalStorage();
}

//Initialize the callback functions for the onscreen keyboard buttons
for (var idx = 0; idx < keys.length; idx++) {
    keys[idx].addEventListener("click", keyButtonListener);
}

for (var idx = 0; idx < hints.length; idx++) {
    hints[idx].addEventListener("click", hintButtonListener);
}

//Initialize the entire letter grid
for (var idx = 1; idx <= 7; idx ++) {
    resetRow(idx);
}

//Setup the initial board:
adjustSegButtons();
adjustGameBoard();
updateStats();


/***** Functions, Handler functions for buttons and keys: *****/

function handleSegmentButton() {
    if (inPlay === false) {
        var btnNum = parseInt(this.innerHTML);
        if (wordLen !== btnNum)
            updateGameScreen(btnNum);
    }
    else {
        alert("Can't change the board during gameplay.")
    }
}

//Listen for keyboard presses
document.addEventListener("keydown", function(event) {
    if (inPlay === true) {
        var key = event.key;
        updateGuess(key);
    }
});

//Listen for [screen] button presses
function keyButtonListener() {
    if (inPlay === true) {
        var key = this.innerHTML;
        updateGuess(key);
    }
}

//Listen for hint button presses
function hintButtonListener() {
    if (inPlay === true) {
        var btnText = this.innerHTML;
        var hintText = "";

        if (this.classList.contains("hint1")) {
            currHints[0] = 1;
            if (containsDoubles())
                hints[0].innerHTML = "Hint: Answer contains double letters.";
            else
                hints[0].innerHTML = "Hint: No double letters in answer.";
        }
        else {
            currHints[1] = 1;
            if (allVowelsFound())
                hints[1].innerHTML = "Hint: All vowels have been found.";
            else
                hints[1].innerHTML = "Hint: Not all vowels found.";
        }
        this.classList.add("started");
    }
}


/***** Functions, Game logic: *****/

//User starts a game
function startGame() {
    if (inPlay === false) {
        inPlay  = true;
        gameWon = false;
        currRow = 1;
        currCol = 1;
        currGuess  = "";
        currAnswer = "";
        gamesStarted[wordLen-4] ++;
        currHints = [0, 0];

        for (var idx = 1; idx <= numRows; idx ++) {
            resetRow(idx);
        }

        startBtn.classList.add("started");
        startBtn.innerHTML = "Game Started";

        var title = document.querySelector("h1");
        title.innerHTML = "MasterWord";
        getNewWord();
        setKeyColor("all");
        highlightCurrCell();
        resetHintButtons();
    }
}


//User ends a game
function endGame() {
    if (inPlay === true) {
        var sound = new Audio('sounds/retro_game_over.wav');
        sound.play();
        if (currRow === 1) { //didn't complete the first guess; abort
            gamesStarted[wordLen-4] --;
        }
        else { //this counts in the stats
            var title = document.querySelector("h1");
            title.innerHTML = "Aaaw! The word was " + currAnswer.toUpperCase();
        }

        endGameInternal();
    }

    inPlay = false;
}


//The game logic ends the game
function endGameInternal() {
    if (inPlay === true) {
        startBtn.classList.remove("started");
        startBtn.innerHTML = "Start Game";
        totalHints[wordLen-4] += currHints[0] + currHints[1];
        if (gameWon === true)
            hintDebt += (currHints[0] + currHints[1]) * 10;
        updateStats();
    }

    inPlay = false;
}


//Use the internal word lists to find the solution word for this game.
function getNewWord() {

    switch (wordLen) {
       case 4:
           var len = data4puzzle.length;
           var idx = Math.floor(Math.random() * len);
           currAnswer = data4puzzle[idx];
           break;
       case 5:
           var len = data5puzzle.length;
           var idx = Math.floor(Math.random() * len);
           currAnswer = data5puzzle[idx];
           break;
       case 6:
           var len = data6puzzle.length;
           var idx = Math.floor(Math.random() * len);
           currAnswer = data6puzzle[idx];
           break;
   }

   for (var idx = 0; idx < currAnswer.length; idx++) {
       currAnsChar[idx] = currAnswer.slice(idx, idx+1);
   }
}


//Validates a guess when the user presses "Check Word".
function checkWord() {
    if (inPlay === true) {
        if (currGuess.length < wordLen) {
            alert("Complete your guess!");
        }
        else {
            currGuess = currGuess.toLowerCase();
            if (checkWordInternal() === true) {
                judgeGuess();
                isGameOver();
            }
        }
    }
}


function isGameOver() {

    if (gameWon === true) {
        var sound = new Audio('sounds/cheer_and_applause.wav');
        sound.play();
        var title = document.querySelector("h1");
        title.innerHTML = "TADA! You Got It!!!";
        gamesWon[wordLen-4] ++;
        endGameInternal();
    }
    else if (currRow < numRows) { /* nope, advance to the next row */
        clearCurrCell(false);
        currRow ++;
        currCol = 1;
        currGuess = "";
        highlightCurrCell();
    }
    else { /* out of guesses - game is over */
        var sound = new Audio('sounds/retro_game_over.wav');
        sound.play();
        var title = document.querySelector("h1");
        title.innerHTML = "Oops! The word was " + currAnswer.toUpperCase();
        endGameInternal();
    }
}


function checkWordInternal() {

    switch (wordLen) {
        case 4:
            foundIt = data4.includes(currGuess);
            break;
        case 5:
            foundIt = data5.includes(currGuess);
            break;
        case 6:
            foundIt = data6.includes(currGuess);
            break;
        default:
            foundIt = false;
            break;
    }

    if (foundIt === false) {
        alert("I didn't find that word in my lists.");
    }
    return foundIt;
}


function setCharAt(str,index,chr) {
    if (index > str.length-1) return str;
    return str.substring(0,index) + chr + str.substring(index+1);
}


function judgeGuess() {

    var correct = 0;
    var colors  = [0, 0, 0, 0, 0, 0];
    var workingAnswer = currAnswer;

    //this is only a problem when online dictionaries fail to respond:
    if (currAnswer.length !== wordLen) {
        alert("No game word was chosen. Stopping this game.");
        endGameInternal();
        return;
    }

    //Check for position matches first.
    for (var idx = 0; idx < wordLen; idx++) {
        var letter = currGuess.slice(idx, idx+1);
        if (letter === currAnsChar[idx]) {
            colors[idx] = 1; /* position match */
            workingAnswer = setCharAt(workingAnswer, idx, '.');
            correct ++;
        }
    }

    //Check for mis-matches next, eliminating repeats.
    for (var idx = 0; idx < wordLen; idx++) {
        var letter = currGuess.slice(idx, idx+1);
        if ((colors[idx] != 1) && (workingAnswer.includes(letter))) {
            colors[idx] = 2; /* word contains it */
            var newIdx = workingAnswer.lastIndexOf(letter);
            workingAnswer = setCharAt(workingAnswer, newIdx, '.');
        }
    }

    colorizeRow(colors);
    colorizeKeyboard(colors);

    if (correct === wordLen) { /* Winner! */
        gameWon = true;
    }
}


//Handles key presses and button clicks to add/remove letters from the
//current guess (a single row on the letter grid).
function updateGuess(key) {

    if (key.length === 1) {
        setCurrCell(key);
        if (currCol === wordLen) {
            currGuess = currGuess.slice(0, currCol-1);
        }
        currGuess = currGuess + key;

        if (currCol < wordLen) {
            currCol += 1;
            highlightCurrCell();
        }
    }
    else {
        var ctrlKey = key.slice(0, 4);
        ctrlKey = ctrlKey.toLowerCase();

        if ((ctrlKey === "back") || (ctrlKey === "dele")) {
            clearCurrCell(true);

            if ((currCol > 1) && (currGuess.length < wordLen)) {
                currCol -= 1;
                clearCurrCell(true);
            }
            currGuess = currGuess.slice(0, currCol-1);
            highlightCurrCell();
        }
    }
}


function updateStats() {
    var stat4 = document.querySelector("h3.stat4");
    if (gamesStarted[0] === 0)
       var rate = 0;
    else
       var rate = Math.round(gamesWon[0] / gamesStarted[0] * 100);
    var newstr = "Stats (word length 4):  Won " + gamesWon[0] + ", Started " + gamesStarted[0] + " (" + rate + "%)" + " Hints: " + totalHints[0]
    stat4.innerHTML = newstr;

    var stat5 = document.querySelector("h3.stat5");
    if (gamesStarted[1] === 0)
       var rate = 0;
    else
    var rate = Math.round(gamesWon[1] / gamesStarted[1] * 100);
    var newstr = "Stats (word length 5):  Won " + gamesWon[1] + ", Started " + gamesStarted[1] + " (" + rate + "%)" + " Hints: " + totalHints[1]
    stat5.innerHTML = newstr;

    var stat6 = document.querySelector("h3.stat6");
    if (gamesStarted[2] === 0)
       var rate = 0;
    else
    var rate = Math.round(gamesWon[2] / gamesStarted[2] * 100);
    var newstr = "Stats (word length 6):  Won " + gamesWon[2] + ", Started " + gamesStarted[2] + " (" + rate + "%)" + " Hints: " + totalHints[2]
    stat6.innerHTML = newstr;

    var avg = document.querySelector("h3.avg");
    var starts = 0;
    var wins   = 0;
    for (idx = 0; idx < 3; idx++) {
        wins   += gamesWon[idx];
        starts += gamesStarted[idx];
    }

    var score = 0;
    if (starts > 0) {
        var sum = (wins * 100) - hintDebt;
        score = (sum / starts);
    }

    score = Math.round(score * 10) / 10; //round to 1 decimal
    avg.innerHTML = "Average Score: " + score;

    updateLocalStorage();
}


function containsDoubles() {

    for (var idx = 0; idx < (wordLen-1); idx++) {
        var letter = currAnswer.slice(idx, idx+1);
        var newIdx = currAnswer.lastIndexOf(letter);
        if (newIdx != idx)
            return true;
    }

    return false;
}


function allVowelsFound() {

    if (currAnswer.includes("a")) {
        var btn = document.querySelector("button.a");
        if ((!btn.classList.contains("key_green")) &&
            (!btn.classList.contains("key_yellow")))
            return false;
    }

    if (currAnswer.includes("e")) {
        var btn = document.querySelector("button.e");
        if ((!btn.classList.contains("key_green")) &&
            (!btn.classList.contains("key_yellow")))
            return false;
    }

    if (currAnswer.includes("i")) {
        var btn = document.querySelector("button.i");
        if ((!btn.classList.contains("key_green")) &&
            (!btn.classList.contains("key_yellow")))
            return false;
    }

    if (currAnswer.includes("o")) {
        var btn = document.querySelector("button.o");
        if ((!btn.classList.contains("key_green")) &&
            (!btn.classList.contains("key_yellow")))
            return false;
    }

    if (currAnswer.includes("u")) {
        var btn = document.querySelector("button.u");
        if ((!btn.classList.contains("key_green")) &&
            (!btn.classList.contains("key_yellow")))
            return false;
    }

    return true;
}


//This function is not used (responds to online dictionary)
function checkWordOnlineListener () {
    var json = this.responseText;
    var response = JSON.parse(json);

    if (response.title === "No Definitions Found") {
        alert("Is that a word? Didn't find it.")
        resetRow(currRow);
    }
    else {
        judgeGuess();
        if (gameWon === true) {
            alert("TADA! You Got It!!!");
            endGame();
        }
        else if (currRow < numRows) { /* advance to the next row */
            clearCurrCell(false);
            currRow ++;
            currCol = 1;
            currGuess = "";
            highlightCurrCell();
        }
        else { /* out of guesses - game is over */
            sound.play();
            endGame();
        }
    }
}


function resetHintButtons() {

    hints[0].innerHTML = "Hint: (double letters?)";
    hints[1].innerHTML = "Hint: (all vowels used?)";

    for (idx = 0; idx < hints.length; idx++) {
        if (hints[idx].classList.contains("started"))
            hints[idx].classList.remove("started");
    }
}


/***** Functions, HTML element updates to the screen: *****/

// Sets the specified onscreen keyboard key(s) to the indicated color.
function setKeyColor(key, state) {

    if (key === "all") { //set all keys to the same class
        for (var idx = 0; idx < keys.length; idx++) {
            keys[idx].classList.remove("key_yellow");
            keys[idx].classList.remove("key_red");
            keys[idx].classList.remove("key_green");

            switch (state) {
                case 1: /* yellow */
                  keys[idx].classList.add("key_yellow");
                  break;
                case 2: /* green */
                  keys[idx].classList.add("key_green");
                  break;
                case 3: /* red */
                  keys[idx].classList.add("key_red");
                  break;
            }
        }
    }
    else {
        var srch = "button." + key;
        var btn = document.querySelector(srch);

        btn.classList.remove("key_yellow");
        btn.classList.remove("key_red");

        //Once a key turns green, it stays green:
        if (!btn.classList.contains("key_green")) {
            switch (state) {
            case 1: /* yellow */
              btn.classList.add("key_yellow");
            break;
            case 2: /* green */
              btn.classList.add("key_green");
              break;
            case 3: /* red */
              btn.classList.add("key_red");
              break;
            }
        }
    }
}


function updateGameScreen(newWordLen) {
    prevCols = wordLen;
    prevRows = numRows;
    wordLen  = newWordLen;
    numRows  = newWordLen + 1;
    adjustSegButtons();
    adjustGameBoard();
}


function adjustSegButtons() {

    switch(wordLen) {
        case 4:
            seg4.classList.remove("segNotPushed");
            seg4.classList.add("segPushed");
            if (prevCols === 5) {
                seg5.classList.remove("segPushed");
                seg5.classList.add("segNotPushed");
            }
            else {
                seg6.classList.remove("segPushed");
                seg6.classList.add("segNotPushed");
            }
            break;
        case 5:
            seg5.classList.remove("segNotPushed");
            seg5.classList.add("segPushed");
            if (prevCols === 4) {
                seg4.classList.remove("segPushed");
                seg4.classList.add("segNotPushed");
            }
            else {
                seg6.classList.remove("segPushed");
                seg6.classList.add("segNotPushed");
            }
            break;
        case 6:
            seg6.classList.remove("segNotPushed");
            seg6.classList.add("segPushed");
            if (prevCols === 5) {
                seg5.classList.remove("segPushed");
                seg5.classList.add("segNotPushed");
            }
            else {
                seg4.classList.remove("segPushed");
                seg4.classList.add("segNotPushed");
            }
            break;
        default:
            console.log("WordLen is broken");
    }
}


function clearCurrCell(killText) {
  if (inPlay === true) {
    var rowStr = "button.row" + currRow;
    var rowBtn = document.querySelectorAll(rowStr);

    rowBtn[currCol-1].classList.remove("sq_hilite");
    if (killText === true) {
        //force an invisible character to keep buttons from moving
        rowBtn[currCol-1].innerHTML = '\u2060';
        rowBtn[currCol-1].innerText = '\u2060';
        rowBtn[currCol-1].textContent = '\u2060';
    }
  }
}


function setCurrCell(key) {
  if (inPlay === true) {
      var rowStr = "button.row" + currRow;
      var rowBtn = document.querySelectorAll(rowStr);
  
      if (currCol < wordLen) {
        rowBtn[currCol-1].classList.remove("sq_hilite");
    }
      rowBtn[currCol-1].textContent = key.toUpperCase();
  }
}


function highlightCurrCell() {
  if (inPlay === true) {
    var rowStr = "button.row" + currRow;
    var rowBtn = document.querySelectorAll(rowStr);

    rowBtn[currCol-1].classList.add("sq_hilite");

    if (currCol > 1) {
        rowBtn[currCol-2].classList.remove("sq_hilite");
    }
  }
}


//Adds or removes rows and columns of the letter grid.
function adjustGameBoard() {
       
    //Need to delete rows?
    if ((prevRows > 6) && (numRows < 7)) {
        var row7btn = document.querySelectorAll("button.row7");

        for (var idx = 0; idx < prevCols; idx++) {
          row7btn[idx].style.visibility = "hidden";
          row7btn[idx].style.display = "none";
       }
    }
    if ((prevRows > 5) && (numRows < 6)) {
        var row6btn = document.querySelectorAll("button.row6");

        for (var idx = 0; idx < prevCols; idx++) {
            row6btn[idx].style.visibility = "hidden";
            row6btn[idx].style.display = "none";
         }
    }

    //Need to add rows?
    if ((prevRows < 6) && (numRows > 5)) {
        var row6btn = document.querySelectorAll("button.row6");

        for (var idx = 0; idx < prevCols; idx++) {
          row6btn[idx].style.visibility = "visible";
          row6btn[idx].style.display = "inline";
       }
    }
    if ((prevRows < 7) && (numRows > 6)) {
        var row7btn = document.querySelectorAll("button.row7");

        for (var idx = 0; idx < prevCols; idx++) {
          row7btn[idx].style.visibility = "visible";
          row7btn[idx].style.display = "inline";
       }
    }
    
    //Need to delete columns?
    if ((prevCols > 5) && (wordLen < 6)) {
        var col6btn = document.querySelectorAll("button.col6");

        for (var idx = 0; idx < numRows; idx++) {
          col6btn[idx].style.visibility = "hidden";
          col6btn[idx].style.display = "none";
       }
    }
    if ((prevCols > 4) && (wordLen < 5)) {
        var col5btn = document.querySelectorAll("button.col5");

        for (var idx = 0; idx < numRows; idx++) {
          col5btn[idx].style.visibility = "hidden";
          col5btn[idx].style.display = "none";
       }
    }
    
    //Need to add columns?
    if ((prevCols < 5) && (wordLen > 4)) {
        var col5btn = document.querySelectorAll("button.col5");

        for (var idx = 0; idx < numRows; idx++) {
          col5btn[idx].style.visibility = "visible";
          col5btn[idx].style.display = "inline";
       }
    }
    if ((prevCols < 6) && (wordLen > 5)) {
        var col6btn = document.querySelectorAll("button.col6");

        for (var idx = 0; idx < numRows; idx++) {
          col6btn[idx].style.visibility = "visible";
          col6btn[idx].style.display = "inline";
       }
    }

    //Adjust width of hint buttons
    var sqBtn = document.querySelector("button.sq"); //find the 1st one
    var wid1 = sqBtn.offsetWidth; //width + padding + border
    var wid2 = (wid1 * wordLen) + (12 * (wordLen-1)); 
    for (var idx = 0; idx < hints.length; idx++) {
        hints[idx].style.width = wid2;
    }
}


function colorizeKeyboard(colors) {

    /* set unused first */
    for (var idx = 0; idx < wordLen; idx++) {
        var letter = currGuess.slice(idx, idx+1);
        if (colors[idx] === 0) {
            setKeyColor(letter, 3);
        }
    }

    /* set "contains it" next */
    for (var idx = 0; idx < wordLen; idx++) {
        var letter = currGuess.slice(idx, idx+1);
        if (colors[idx] === 2) {
            setKeyColor(letter, 1);
        }
    }

    /* set matched last */
    for (var idx = 0; idx < wordLen; idx++) {
        var letter = currGuess.slice(idx, idx+1);
        if (colors[idx] === 1) {
            setKeyColor(letter, 2);
        }
    }
}


function colorizeRow(colors) {

    var rowStr = "button.row" + currRow;
    var rowBtn = document.querySelectorAll(rowStr);

    for (var idx = 0; idx < wordLen; idx++) {

        if (colors[idx] === 1) {
            rowBtn[idx].classList.add("sq_green");
        }
        else if (colors[idx] === 2) {
            rowBtn[idx].classList.add("sq_yellow");
        }
    }
}


function resetRow(row) {

    var rowStr = "button.row" + row;
    var rowBtn = document.querySelectorAll(rowStr);

    for (var idx = 0; idx < 6; idx++) {
        rowBtn[idx].classList.remove("sq_green");
        rowBtn[idx].classList.remove("sq_yellow");
        rowBtn[idx].classList.remove("sq_hilite");
        //force an invisible character to keep buttons from moving
        rowBtn[idx].innerHTML = '\u2060';
        rowBtn[idx].innerText = '\u2060';
        rowBtn[idx].textContent = '\u2060';
    }

    currGuess = "";
    currCol = 1;
    highlightCurrCell();
}


function updateLocalStorage() {

    localStorage.setItem("saveflag", "true");
    localStorage.setItem("gwon4", gamesWon[0]);
    localStorage.setItem("gwon5", gamesWon[1]);
    localStorage.setItem("gwon6", gamesWon[2]);
    localStorage.setItem("gstrt4", gamesStarted[0]);
    localStorage.setItem("gstrt5", gamesStarted[1]);
    localStorage.setItem("gstrt6", gamesStarted[2]);
    localStorage.setItem("hint4", totalHints[0]);
    localStorage.setItem("hint5", totalHints[1]);
    localStorage.setItem("hint6", totalHints[2]);
    localStorage.setItem("hdbt", hintDebt);
}


function readLocalStorage() {

    saveflag = localStorage.getItem("saveflag");

    if (saveflag === "true") {
        gamesWon[0] = parseInt(localStorage.getItem("gwon4"));
        gamesWon[1] = parseInt(localStorage.getItem("gwon5"));
        gamesWon[2] = parseInt(localStorage.getItem("gwon6"));
        gamesStarted[0] = parseInt(localStorage.getItem("gstrt4"));
        gamesStarted[1] = parseInt(localStorage.getItem("gstrt5"));
        gamesStarted[2] = parseInt(localStorage.getItem("gstrt6"));
        totalHints[0] = parseInt(localStorage.getItem("hint4"));
        totalHints[1] = parseInt(localStorage.getItem("hint5"));
        totalHints[2] = parseInt(localStorage.getItem("hint6"));
        hintDebt = parseInt(localStorage.getItem("hdbt"));
        return true;
    }
    else
        return false;
}


/***** Functions, used to access online dictionaries: *****/
/* They are not currently used since the switch to internal word lists. */

function checkWordErrorListener () {
    alert("Online dictionary is not responding.")
}


//Call the dictionaryapi.dev API to see if a user's guess is an actual word.
function checkWordOnline(word) {
    var xhttp = new XMLHttpRequest();
    xhttp.addEventListener("load", checkWordOnlineListener);
    xhttp.addEventListener("abort", checkWordErrorListener);
    xhttp.open("GET", "https://api.dictionaryapi.dev/api/v2/entries/en/" + word);
    xhttp.send();
}


//Use dictonary word letter frequencies to pick the first letter of a word.
//Letter frequencies come from https://wikipedia.org/wiki/Letter_frequency
function randomLetter() {
    //values as percents, a through z: (adds up to > 100%, see totalFreq)
    var azFreq = [7.8, 2, 4, 3.8, 11, 1.4, 3, 2.3, 8.2, 0.21, 2.5, 5.3, 2.7, 7.2,
                6.1, 2.8, 0.24, 7.3, 8.7, 6.7, 3.3, 1, 0.91, 0.27, 1.6, 0.44];
    var letters = "abcdefghijklmnopqrstuvwxyz";
    var sum = 0;
    var totalFreq = 100.77; //sum of above percentages

    var randVal = Math.random() * totalFreq; //adjust randVal to the total percentage scaling

    for (var idx = 0; idx < 26; idx++) {
        if (randVal < (sum + azFreq[idx])) {
            return(letters.slice(idx, idx+1));
        }
        sum += azFreq[idx];
    }
}


function getNewWordListener () {
    var json = this.responseText;
    var wordList = JSON.parse(json);
    var numWords = wordList.length;
    var randIdx  = Math.floor(Math.random() * numWords);

    currAnswer = wordList[randIdx].word;

    for (var idx = 0; idx < currAnswer.length; idx++) {
        currAnsChar[idx] = currAnswer.slice(idx, idx+1);
    }
}


//Call the datamuse.com API to find a random dictionary word
function getNewWordOnline() {
    var firstLetter = randomLetter();
    var word = firstLetter + "???";
    var xhttp = new XMLHttpRequest();

    if (wordLen === 5)
      word = word + "?";
    else if (wordLen === 6)
      word = word + "??";
      
    xhttp.addEventListener("load", getNewWordListener);
    xhttp.open("GET", "https://api.datamuse.com/words?sp=" + word);
    xhttp.send();
}
