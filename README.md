# MasterWord

This is my version of the MasterMind game called Wordle. It just uses words and
letters instead of colored pegs.

MasterWord creates 4, 5 and 6 letter puzzles. The dictonary used to check guesses is
from the Scrabble dictionary, but a reduced dictonary is used to pick the solution,
since many of the Scrabble words are not familiar and would be difficult at best to
solve.

Two hints are available: "Double Letters?" and "All Vowels Found?". Use of a hint
reduces the game score by 10 points. A correct game is 100 points, and failure is
zero. So a single game's score may be 100, 90, 80 or 0 (hints don't count against
you if you fail).

The user's average score is calculated by:

   ((number_wins * 100) - (10 * number_hints_used)) / total_games_started

Also, if a game is ended before clicking "Check Word" on the first row, the game
will not be counted as a game started.
