/**
 * Construct a new Tetris game
 * @param {jQuery} $element The element we .append() the game to
 * @constructor
 */
Tetris = function($element) {
    var $theElement = $(document.createElement('div')).attr({
        id: 'tetris',
        tabindex: 0
    });
    var $canvas, $score, $lines, $next, $start;

    var score = 0, lines = 0, softDrop = 0, level = 1;

    var matrix;
    var height = 19, width = 10;

    var gameStates = { GAME_OVER: 0, RUNNING: 1, STOPPED: 2 };
    var gameState = gameStates.GAME_OVER;
    var timeoutId;
    
    $('head').append('<link rel="stylesheet" href="res/tetris.css" type="text/css" />');
    $('head').append('<link rel="stylesheet" href="res/tetris-sprites.css" type="text/css" />');

    $element.append($theElement);
    $theElement.append($canvas = $('<canvas id="tetris-canvas" width="200" height="400"></canvas')).
        append($('<div id="tetris-right"></div>').
            append($score = $('<span id="score">0</span>')).
            append($lines = $('<span id="lines">0</span>')).
            append($next = $(document.createElement('div')).attr({
                id: 'tetris-next-piece',
                class: 'next-tetromino',
            })).
            append($start = $('<button id="start">Start New Game</button>').click( function() {
                gameState == gameStates.RUNNING ? stop() : start();
            }))).
        blur( function(event) {
            if(gameState == gameStates.RUNNING) {
                stop();
            }
        }).
        keydown( function(evt) {
            evt.preventDefault();
            evt.stopPropagation();
            if(gameState != gameStates.GAME_OVER) {
                switch(evt.which) {
                    case 37: left(); break;
                    case 39: right(); break;
                    case 32:
                    case 40: next(evt); break;
                    case 90: rotate(false); break;
                    case 88: rotate(true); break;
                    case 80: gameState == gameStates.RUNNING ? stop() : start(); break;
                    default: break;
                }
            }
            return false;
        });
        
    var piecesQueue = new Array();
    var speed = 1000;

    var tetrominoes = [OTetromino, ITetromino, TTetromino, STetromino, ZTetromino, LTetromino, JTetromino];
    var currentPiece = null;

    var colors = {
        I: 'cyan',
        O: 'yellow',
        T: 'purple',
        S: 'green',
        Z: 'red',
        J: 'blue',
        L: 'orange'
    };
    
    /**
     * Start (or re-start) the game. The pith here is the call to setInterval.
     * @see stop
     */
    function start() {
        if(gameState == gameStates.GAME_OVER) {
            init_matrix();
            score = 0;
            lines = 0;
            level = 1;
            softDrop = 0;
            draw();
        }

        next();
        gameState = gameStates.RUNNING;
        timeoutId = setInterval( _.bind(function() {
            next();
        }, tetris), speed);
        $start.text('Pause Game');
    }
    
    /**
     * Stop (or pause) the game. The pith here is the call to clearInterval.
     * @see start
     */
    function stop() {
        clearInterval(timeoutId);
        if(gameState == gameStates.RUNNING) {
            gameState = gameStates.STOPPED;
            $start.text('Resume Game');
        }
    }

    /**
     * Terminate the game.
     */
    function gameover() {
        clearInterval(timeoutId);
        gameState = gameStates.GAME_OVER;
        $start.text('Start New Game');
    }
    
    function init_matrix() {
        matrix = [];
        for(var row = 0; row < height + 3; ++row) {
            matrix[row] = [];
            for(var column = 0; column < width; ++column) {
                matrix[row][column] = "";
            }
        }
        return matrix;
    }
    
     /**
     * Execute the next iteration of the game: drop the current piece one unit
     * (if there is a current piece), clear out any completed lines, and retrieve
     * the next piece in the queue if necessary.
     * 
     * @param {Event} event The event that triggered this call. This will be falsy
     * if the method was called by the setInterval callback.
     */
    function next(event) {
        var rows = {}, removed = 0;

        if(currentPiece) {
            if(!drop(event)) {
                _(currentPiece.squares).forEach(function(val) {
                    matrix[val.y][val.x] = currentPiece.prototype.type;
                    rows[val.y] = true;
                });
                
                updateScore(softDrop * level);

                _(rows).keys().forEach(function(row) {
                    if(_(matrix[row]).every(function(square) { return !!square; })) {
                        matrix[row] = null;
                        ++removed;
                    }
                });
                if(removed) {
                    matrix = _(matrix).compact();
                    for(var i = 0; i < removed; ++i) {
                        matrix.push(["", "", "", "", "", "", "", "", "", ""]);
                    }
                    updateLines(removed);
                    updateScore(Math.pow(removed, 2) * 10 * level + softDrop * level);
                }
                currentPiece = null;
                softDrop = 0;
            }
        }
        else {
            if(piecesQueue.length <= 1) {
                piecesQueue = piecesQueue.concat(_(tetrominoes).shuffle());
            }
            currentPiece = new (piecesQueue.shift())();

            $next.attr('class', 'next-tetromino-' + piecesQueue[0].prototype.type.toLowerCase());

            if(_(currentPiece.squares).any(function(theSquare) {
                return theSquare.y > height + 2 || matrix[theSquare.y][theSquare.x];
            })) {
                gameover();
                return;
            }
        }

        draw();
    }
    
    /**
     * Tries to drop the current piece one unit. Returns true on success
     * or false if the piece can't be dropped.
     * 
     * @param {Event} event The event that triggered this call. This will be falsy
     * if the method was called by the setInterval callback.
     * @return true iff the piece was successfully dropped
     */
    function drop(event) {
        if(_(currentPiece.squares).all(function(theSquare) {
            return theSquare.y > 0 && !matrix[theSquare.y - 1][theSquare.x];
        })) {
            currentPiece.drop();
            draw();

            if(event && event.type == 'keydown') {
                ++softDrop;
                clearInterval(timeoutId);
                timeoutId = setInterval( _.bind(function() {
                    next();
                }, tetris), speed);
            }

            return true;
        }
        return false;
    }
    
    /**
     * Move the current piece left, if possible.
     * 
     * @return true iff the piece was successfully moved
     */
    function left() {
        if(!currentPiece) { return; }

        if(_(currentPiece.squares).all(function(theSquare) {
            return theSquare.x > 0 && !matrix[theSquare.y][theSquare.x - 1];
        })) {
            currentPiece.left();
            draw();
            return true;
        }
        return false;
    }
    
    /**
     * Move the current piece right, if possible.
     * 
     * @return true iff the piece was successfully moved
     */
    function right() {
        if(!currentPiece) { return; }

        if(_(currentPiece.squares).all(function(theSquare) {
            return theSquare.x < width - 1 && !matrix[theSquare.y][theSquare.x + 1];
        })) {
            currentPiece.right();
            draw();
            return true;
        }
        return false;
    }
    
    /**
     * Rotate the current piece, if possible.
     * 
     * @param {Boolean} clockwise true to rotate clockwise, false for counterclockwise
     * @return true iff the piece was successfully rotated
     */
    function rotate(clockwise) {
        if(!currentPiece) { return; }

        if(clockwise) {
            currentPiece.rotateClockwise();
        }
        else {
            currentPiece.rotateCounterClockwise();
        }

        if(_(currentPiece.squares).any(function(theSquare) {
            return theSquare.x < 0 || theSquare.x >= width || theSquare.y < 0 || matrix[theSquare.y][theSquare.x];
        })) {
            if(clockwise) {
                currentPiece.rotateCounterClockwise();
            }
            else {
                currentPiece.rotateClockwise();
            }
            return false;
        }
        draw();
        return true;
    }
    
    /**
     * Draw the game.
     */
    function draw() {
        var canvas = $canvas.get(0), context = canvas.getContext('2d');
        var squareWidth = canvas.width / width, squareHeight = canvas.height / (height + 1);

        context.fillStyle = 'white';
        context.fillRect(0, 0, canvas.width, canvas.height);

        var c;
        for(var row = 0; row <= height; ++row) {
            for(var column = 0; column < width; ++column) {
                c = matrix[row][column];

                if(!c) {
                    continue;
                }

                context.fillStyle = colors[c];
                context.strokeRect(column * squareWidth, canvas.height - ((row + 1) * squareHeight), squareWidth, squareHeight);
                context.fillRect(column * squareWidth + 1, canvas.height - ((row + 1) * squareHeight) + 1,
                        squareWidth - 2, squareHeight - 2);
            }
        }

        if(currentPiece) {
            context.fillStyle = colors[currentPiece.prototype.type];
            _(currentPiece.squares).each(function(theSquare) {
                context.strokeRect(theSquare.x * squareWidth, canvas.height - (theSquare.y + 1) * squareHeight,
                    squareWidth, squareHeight);
                context.fillRect(theSquare.x * squareWidth + 1, canvas.height - (theSquare.y + 1) * squareHeight + 1,
                    squareWidth - 2, squareHeight - 2);
            });
        }
    }
    
     /**
     * Update the lines counter and the corresponding DOM element. (Also
     * the level counter, and therefore the game speed).
     * 
     * @param {Number} amount The amount of lines to add to the counter.
     */
    function updateLines(amount) {
        lines += amount;
        level = Math.floor(lines / 10) + 1;
        speed = 1050 - (50 * level);
        $lines.text(lines);
    }
    
    /**
     * Update the score counter and the corresponding DOM element.
     */
    function updateScore(amount) {
        $score.text(score += amount);
    }
    
    /************************************************************
     * Tetromino classes.
     ************************************************************/
    /**
     * Abstract constructor.
     * @constructor
     */
    function Tetromino() {
        this.squares = new Array();

        this.spawn();

        /**
         * Move this tetromino one unit down. This method does not do collision testing;
         * that's the responsibility of the caller.
         */
        this.drop = function() {
            _.forEach(this.squares, function(theSquare) {
                --theSquare.y;
            });
        };

        /**
         * Move this tetromino one unit left. This method does not do collision testing;
         * that's the responsibility of the caller.
         */
        this.left = function() {
            _.forEach(this.squares, function(theSquare) {
                --theSquare.x;
            });
        };

        /**
         * Move this tetromino one unit right. This method does not do collision testing;
         * that's the responsibility of the caller.
         */
        this.right = function() {
            _.forEach(this.squares, function(theSquare) {
                ++theSquare.x;
            });
        };

        this.rotateClockwise = _.identity;
        this.rotateCounterClockwise = _.identity;
    }
    Tetromino.prototype.Orientation = { HORIZONTAL: 0, VERTICAL: 1, DOWN: 0, LEFT: 1, UP: 2, RIGHT: 3 };

    /**
     * @constructor
     */
    function OTetromino() {
        this.prototype = OTetromino.prototype;
        Tetromino.call(this);

        this.rotateClockwise = this.rotateCounterClockwise = function() { return true; };
    };
    OTetromino.prototype = Object.create(Tetromino.prototype);
    OTetromino.prototype.constructor = OTetromino;
    OTetromino.prototype.spawn = function() {
        this.squares = [{x: 4, y: height}, {x: 5, y: height}, {x: 4, y: height + 1}, {x: 5, y: height + 1}];
        return this;
    };
    OTetromino.prototype.type = "O";

    /**
     * @constructor
     */
    function ITetromino() {
        this.prototype = ITetromino.prototype;
        Tetromino.call(this);

        this.rotateClockwise = this.rotateCounterClockwise = this.rotate = function() {
            if(this.orientation == this.Orientation.HORIZONTAL) {
                this.squares[0] = {x: this.squares[0].x + 2, y: this.squares[0].y + 2};
                this.squares[1] = {x: this.squares[1].x + 1, y: this.squares[1].y + 1};
                this.squares[3] = {x: this.squares[3].x - 1, y: this.squares[3].y - 1};
            }
            else {
                this.squares[0] = {x: this.squares[0].x - 2, y: this.squares[0].y - 2};
                this.squares[1] = {x: this.squares[1].x - 1, y: this.squares[1].y - 1};
                this.squares[3] = {x: this.squares[3].x + 1, y: this.squares[3].y + 1};
            }
            this.orientation = (this.orientation + 1) % 2;
        };
    }
    ITetromino.prototype = Object.create(Tetromino.prototype);
    ITetromino.prototype.constructor = ITetromino;
    ITetromino.prototype.spawn = function() {
        this.squares = [{x: 3, y: height}, {x: 4, y: height}, {x: 5, y: height}, {x: 6, y: height}];
        this.orientation = this.Orientation.HORIZONTAL;
    };
    ITetromino.prototype.type = "I";

    /**
     * @constructor
     */
    function TTetromino() {
        this.prototype = TTetromino.prototype;
        Tetromino.call(this);

        this.rotateClockwise = function() {
            if(this.orientation == this.Orientation.UP) {
                this.squares[0] = {x: this.squares[0].x + 1, y: this.squares[0].y + 1};
                this.squares[2] = {x: this.squares[2].x + 1, y: this.squares[2].y - 1};
                this.squares[3] = {x: this.squares[3].x - 1, y: this.squares[3].y - 1};
            }
            else if(this.orientation == this.Orientation.RIGHT) {
                this.squares[0] = {x: this.squares[0].x + 1, y: this.squares[0].y - 1};
                this.squares[2] = {x: this.squares[2].x - 1, y: this.squares[2].y - 1};
                this.squares[3] = {x: this.squares[3].x - 1, y: this.squares[3].y + 1};
            }
            else if(this.orientation == this.Orientation.DOWN) {
                this.squares[0] = {x: this.squares[0].x - 1, y: this.squares[0].y - 1};
                this.squares[2] = {x: this.squares[2].x - 1, y: this.squares[2].y + 1};
                this.squares[3] = {x: this.squares[3].x + 1, y: this.squares[3].y + 1};
            }
            else {
                this.squares[0] = {x: this.squares[0].x - 1, y: this.squares[0].y + 1};
                this.squares[2] = {x: this.squares[2].x + 1, y: this.squares[2].y + 1};
                this.squares[3] = {x: this.squares[3].x + 1, y: this.squares[3].y - 1};
            }
            this.orientation = (this.orientation + 1) % 4;
        };

        this.rotateCounterClockwise = function() {
            if(this.orientation == this.Orientation.UP) {
                this.squares[0] = {x: this.squares[0].x + 1, y: this.squares[0].y - 1};
                this.squares[2] = {x: this.squares[2].x - 1, y: this.squares[2].y - 1};
                this.squares[3] = {x: this.squares[3].x - 1, y: this.squares[3].y + 1};
            }
            else if(this.orientation == this.Orientation.LEFT) {
                this.squares[0] = {x: this.squares[0].x + 1, y: this.squares[0].y + 1};
                this.squares[2] = {x: this.squares[2].x + 1, y: this.squares[2].y - 1};
                this.squares[3] = {x: this.squares[3].x - 1, y: this.squares[3].y - 1};
            }
            else if(this.orientation == this.Orientation.DOWN) {
                this.squares[0] = {x: this.squares[0].x - 1, y: this.squares[0].y + 1};
                this.squares[2] = {x: this.squares[2].x + 1, y: this.squares[2].y + 1};
                this.squares[3] = {x: this.squares[3].x + 1, y: this.squares[3].y - 1};
            }
            else {
                this.squares[0] = {x: this.squares[0].x - 1, y: this.squares[0].y - 1};
                this.squares[2] = {x: this.squares[2].x - 1, y: this.squares[2].y + 1};
                this.squares[3] = {x: this.squares[3].x + 1, y: this.squares[3].y + 1};
            }
            this.orientation = (this.orientation + 3) % 4;
        };
    }
    TTetromino.prototype = Object.create(Tetromino.prototype);
    TTetromino.prototype.constructor = TTetromino;
    TTetromino.prototype.spawn = function() {
        this.squares = [{x: 3, y: height}, {x: 4, y: height}, {x: 4, y: height + 1}, {x: 5, y: height}];
        this.orientation = this.Orientation.UP;
    };
    TTetromino.prototype.type = "T";

    /**
     * @constructor
     */
    function STetromino() {
        this.prototype = STetromino.prototype;
        Tetromino.call(this);

        this.rotateClockwise = this.rotateCounterClockwise = this.rotate = function() {
            if(this.orientation == this.Orientation.HORIZONTAL) {
                this.squares[0] = {x: this.squares[0].x + 1, y: this.squares[0].y + 2};
                this.squares[1] = {x: this.squares[1].x + 0, y: this.squares[1].y + 1};
                this.squares[2] = {x: this.squares[2].x + 1, y: this.squares[2].y + 0};
                this.squares[3] = {x: this.squares[3].x + 0, y: this.squares[3].y - 1};
            }
            else {
                this.squares[0] = {x: this.squares[0].x - 1, y: this.squares[0].y - 2};
                this.squares[1] = {x: this.squares[1].x - 0, y: this.squares[1].y - 1};
                this.squares[2] = {x: this.squares[2].x - 1, y: this.squares[2].y - 0};
                this.squares[3] = {x: this.squares[3].x - 0, y: this.squares[3].y + 1};
            }
            this.orientation = (this.orientation + 1) % 2;
        };
    }
    STetromino.prototype = Object.create(Tetromino.prototype);
    STetromino.prototype.constructor = STetromino;
    STetromino.prototype.spawn = function() {
        this.squares = [{x: 3, y: height}, {x: 4, y: height}, {x: 4, y: height + 1}, {x: 5, y: height + 1}];
        this.orientation = this.Orientation.HORIZONTAL;
    };
    STetromino.prototype.type = "S";

    /**
     * @constructor
     */
    function ZTetromino() {
        this.prototype = ZTetromino.prototype;
        Tetromino.call(this);

        this.rotateClockwise = this.rotateCounterClockwise = this.rotate = function() {
            if(this.orientation == this.Orientation.HORIZONTAL) {
                this.squares[0] = {x: this.squares[0].x + 2, y: this.squares[0].y + 1};
                this.squares[1] = {x: this.squares[1].x + 1, y: this.squares[1].y + 0};
                this.squares[2] = {x: this.squares[2].x + 0, y: this.squares[2].y + 1};
                this.squares[3] = {x: this.squares[3].x - 1, y: this.squares[3].y + 0};
            }
            else {
                this.squares[0] = {x: this.squares[0].x - 2, y: this.squares[0].y - 1};
                this.squares[1] = {x: this.squares[1].x - 1, y: this.squares[1].y - 0};
                this.squares[2] = {x: this.squares[2].x - 0, y: this.squares[2].y - 1};
                this.squares[3] = {x: this.squares[3].x + 1, y: this.squares[3].y - 0};
            }
            this.orientation = (this.orientation + 1) % 2;
        };
    }
    ZTetromino.prototype = Object.create(Tetromino.prototype);
    ZTetromino.prototype.constructor = ZTetromino;
    ZTetromino.prototype.spawn = function() {
        this.squares = [{x: 3, y: height + 1}, {x: 4, y: height + 1}, {x: 4, y: height}, {x: 5, y: height}];
        this.orientation = this.Orientation.HORIZONTAL;
    };
    ZTetromino.prototype.type = "Z";

    /**
     * @constructor
     */
    function LTetromino() {
        this.prototype = LTetromino.prototype;
        Tetromino.call(this);

        this.rotateClockwise = function() {
            if(this.orientation == this.Orientation.DOWN) {
                this.squares[0] = {x: this.squares[0].x + 1, y: this.squares[0].y + 1};
                this.squares[2] = {x: this.squares[2].x - 1, y: this.squares[2].y - 1};
                this.squares[3] = {x: this.squares[3].x + 0, y: this.squares[3].y - 2};
            }
            else if(this.orientation == this.Orientation.LEFT) {
                this.squares[0] = {x: this.squares[0].x + 1, y: this.squares[0].y - 1};
                this.squares[2] = {x: this.squares[2].x - 1, y: this.squares[2].y + 1};
                this.squares[3] = {x: this.squares[3].x - 2, y: this.squares[3].y - 0};
            }
            else if(this.orientation == this.Orientation.UP) {
                this.squares[0] = {x: this.squares[0].x - 1, y: this.squares[0].y - 1};
                this.squares[2] = {x: this.squares[2].x + 1, y: this.squares[2].y + 1};
                this.squares[3] = {x: this.squares[3].x + 0, y: this.squares[3].y + 2};
            }
            else {
                this.squares[0] = {x: this.squares[0].x - 1, y: this.squares[0].y + 1};
                this.squares[2] = {x: this.squares[2].x + 1, y: this.squares[2].y - 1};
                this.squares[3] = {x: this.squares[3].x + 2, y: this.squares[3].y - 0};
            }
            this.orientation = (this.orientation + 1) % 4;
        };

        this.rotateCounterClockwise = function() {
            if(this.orientation == this.Orientation.DOWN) {
                this.squares[0] = {x: this.squares[0].x + 1, y: this.squares[0].y - 1};
                this.squares[2] = {x: this.squares[2].x - 1, y: this.squares[2].y + 1};
                this.squares[3] = {x: this.squares[3].x - 2, y: this.squares[3].y + 0};
            }
            else if(this.orientation == this.Orientation.RIGHT) {
                this.squares[0] = {x: this.squares[0].x + 1, y: this.squares[0].y + 1};
                this.squares[2] = {x: this.squares[2].x - 1, y: this.squares[2].y - 1};
                this.squares[3] = {x: this.squares[3].x - 0, y: this.squares[3].y - 2};
            }
            else if(this.orientation == this.Orientation.UP) {
                this.squares[0] = {x: this.squares[0].x - 1, y: this.squares[0].y + 1};
                this.squares[2] = {x: this.squares[2].x + 1, y: this.squares[2].y - 1};
                this.squares[3] = {x: this.squares[3].x + 2, y: this.squares[3].y + 0};
            }
            else {
                this.squares[0] = {x: this.squares[0].x - 1, y: this.squares[0].y - 1};
                this.squares[2] = {x: this.squares[2].x + 1, y: this.squares[2].y + 1};
                this.squares[3] = {x: this.squares[3].x - 0, y: this.squares[3].y + 2};
            }
            this.orientation = (this.orientation + 3) % 4;
        };
    }
    LTetromino.prototype = Object.create(Tetromino.prototype);
    LTetromino.prototype.constructor = LTetromino;
    LTetromino.prototype.spawn = function() {
        this.squares = [{x: 3, y: height}, {x: 4, y: height}, {x: 5, y: height}, {x: 5, y: height + 1}];
        this.orientation = this.Orientation.DOWN;
    };
    LTetromino.prototype.type = "L";

    /**
     * @constructor
     */
    function JTetromino() {
        this.prototype = JTetromino.prototype;
        Tetromino.call(this);

        this.rotateClockwise = function() {
            if(this.orientation == this.Orientation.DOWN) {
                this.squares[0] = {x: this.squares[0].x + 2, y: this.squares[0].y + 0};
                this.squares[1] = {x: this.squares[1].x + 1, y: this.squares[1].y + 1};
                this.squares[3] = {x: this.squares[3].x - 1, y: this.squares[3].y - 1};
            }
            else if(this.orientation == this.Orientation.LEFT) {
                this.squares[0] = {x: this.squares[0].x + 0, y: this.squares[0].y - 2};
                this.squares[1] = {x: this.squares[1].x + 1, y: this.squares[1].y - 1};
                this.squares[3] = {x: this.squares[3].x - 1, y: this.squares[3].y + 1};
            }
            else if(this.orientation == this.Orientation.UP) {
                this.squares[0] = {x: this.squares[0].x - 2, y: this.squares[0].y - 0};
                this.squares[1] = {x: this.squares[1].x - 1, y: this.squares[1].y - 1};
                this.squares[3] = {x: this.squares[3].x + 1, y: this.squares[3].y + 1};
            }
            else {
                this.squares[0] = {x: this.squares[0].x - 0, y: this.squares[0].y + 2};
                this.squares[1] = {x: this.squares[1].x - 1, y: this.squares[1].y + 1};
                this.squares[3] = {x: this.squares[3].x + 1, y: this.squares[3].y - 1};
            }
            this.orientation = (this.orientation + 1) % 4;
        };

        this.rotateCounterClockwise = function() {
            if(this.orientation == this.Orientation.DOWN) {
                this.squares[0] = {x: this.squares[0].x + 0, y: this.squares[0].y - 2};
                this.squares[1] = {x: this.squares[1].x + 1, y: this.squares[1].y - 1};
                this.squares[3] = {x: this.squares[3].x - 1, y: this.squares[3].y + 1};
            }
            else if(this.orientation == this.Orientation.RIGHT) {
                this.squares[0] = {x: this.squares[0].x + 2, y: this.squares[0].y + 0};
                this.squares[1] = {x: this.squares[1].x + 1, y: this.squares[1].y + 1};
                this.squares[3] = {x: this.squares[3].x - 1, y: this.squares[3].y - 1};
            }
            else if(this.orientation == this.Orientation.UP) {
                this.squares[0] = {x: this.squares[0].x - 0, y: this.squares[0].y + 2};
                this.squares[1] = {x: this.squares[1].x - 1, y: this.squares[1].y + 1};
                this.squares[3] = {x: this.squares[3].x + 1, y: this.squares[3].y - 1};
            }
            else {
                this.squares[0] = {x: this.squares[0].x - 2, y: this.squares[0].y - 0};
                this.squares[1] = {x: this.squares[1].x - 1, y: this.squares[1].y - 1};
                this.squares[3] = {x: this.squares[3].x + 1, y: this.squares[3].y + 1};
            }
            this.orientation = (this.orientation + 3) % 4;
        };
    }
    JTetromino.prototype = Object.create(Tetromino.prototype);
    JTetromino.prototype.constructor = JTetromino;
    JTetromino.prototype.spawn = function() {
        this.squares = [{x: 3, y: height + 1}, {x: 3, y: height}, {x: 4, y: height}, {x: 5, y: height}];
        this.orientation = this.Orientation.DOWN;
    };
    JTetromino.prototype.type = "J";  
};