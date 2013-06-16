Tetris
======

Tetris — Javascript + HTML5

Here's a stand-alone library that plunks a Tetris game into some DOM, _because nobody has ever written code for that before, ever._  

The library loads with [RequireJS](http://requirejs.org) so here's the HTML that sets off the whole chain reaction:

    <script data-main="tetris" src="lib/require.js"></script>

The application searches the DOM for a node matching the CSS selector `#tetris` and `jQuery.append`s to it the following HTML:

    <canvas id="tetris-canvas" width="200" height="400"></canvas>
    <span id="score">0</span>
    <span id="lines">0</span>
    <div id="tetris-next-piece" class="next-tetromino" />
    <button id="start">New Game</button>
    
...which should be styled and made to look all pretty. I recommend something that looks like

    #tetris {
      font-family: Trebuchet, Geneva, Helvetica, Arial, sans-serif;
    }
    
    #tetris canvas {
      border: 1px solid black;
      float: left;
    }
    
    #tetris canvas ~ * {
      margin-left: 215px;
      display: block;
    }
      
    #score:before {
      content: "Score: ";
    }
      
    #lines:before {
      content: "Lines: ";
    }
    
    #tetris-next-piece {
      /* sprites are 100px x 100px */
      width: 100px;
      height: 100px;
    }
    
    #tetris-next-piece:before {
      content: "Next:";
    }
    
But you know, it's your page, so whatever makes you happy.
