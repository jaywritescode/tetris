require.config({
    baseUrl: 'lib'
});

define(['jquery', 'underscore'], function() {
    var tetris = new Tetris($('#tetris').attr('tabindex', '1'));

    /**
     * Construct a new Tetris game
     * @constructor
     * @param {jQuery} $element The element to append the game to
     */
    function Tetris($element) {
        var $canvas, $score, $lines, $nextPiece, $startButton;

        var score = 0, lines = 0;

        var matrix =
            [[false, false, false, false, false, false, false, false, false, false],
             [false, false, false, false, false, false, false, false, false, false],
             [false, false, false, false, false, false, false, false, false, false],
             [false, false, false, false, false, false, false, false, false, false],
             [false, false, false, false, false, false, false, false, false, false],
             [false, false, false, false, false, false, false, false, false, false],
             [false, false, false, false, false, false, false, false, false, false],
             [false, false, false, false, false, false, false, false, false, false],
             [false, false, false, false, false, false, false, false, false, false],
             [false, false, false, false, false, false, false, false, false, false],
             [false, false, false, false, false, false, false, false, false, false],
             [false, false, false, false, false, false, false, false, false, false],
             [false, false, false, false, false, false, false, false, false, false],
             [false, false, false, false, false, false, false, false, false, false],
             [false, false, false, false, false, false, false, false, false, false],
             [false, false, false, false, false, false, false, false, false, false],
             [false, false, false, false, false, false, false, false, false, false],
             [false, false, false, false, false, false, false, false, false, false],
             [false, false, false, false, false, false, false, false, false, false],
             [false, false, false, false, false, false, false, false, false, false]];
        var height = matrix.length;
        var timeoutInterval = 1000;
        var softDrop = 0;

        $element.append($canvas = $('<canvas id="tetris-canvas" width="200" height="400"></canvas>')).
                 append($('<label for="tetris-score">Score: </label>')).
                 append($score = $('<span id="tetris-score">0</span>')).
                 append($('<label for="tetris-lines">Lines: </label>')).
                 append($lines = $('<span id="tetris-lines">0</span>')).
                 append($nextPiece = $(document.createElement('canvas')).attr({
                    id: 'tetris-next-piece',
                    width: $canvas.width() / matrix[0].length * 4,
                    height: $canvas.height() / matrix.length * 4
                })).
                append($startButton = $('<button id="start">Start New Game</button>').click( function() {
                    gameState == 'running' ? tetris.stop() : tetris.start();
                })).
                blur( function(event) {
                    if(gameState == 'running') {
                        tetris.stop();
                    }
                }).
                keydown( function(event) {
                    switch(event.which) {
                        case 37: tetris.left(); break;
                        case 39: tetris.right(); break;
                        case 32:
                        case 40: tetris.next(event); break;
                        case 90: tetris.rotate(false); break;
                        case 88: tetris.rotate(true); break;
                        case 80: gameState == 'running' ? tetris.stop() : tetris.start(); break;
                    }
                });

        var currentPiece = undefined, nextPiece = undefined;

        var startTranslate = {
            x: Math.floor((matrix[0].length - 1) / 2),
            y: matrix.length - 1
        };

        /**
         * Generates a random tetromino and puts it in its starting position (which is x == 4, y == 20)
         *
         * @return {Tetromino} the tetromino, translated to its starting position
         */
        function getNextTetromino(tetromino) {
            var shape;
            if(!(tetromino && tetromino.constructor.prototype instanceof Tetromino)) {
                shape = [OTetromino, ITetromino, TTetromino, LTetromino, STetromino][_.random(4)];
                shape = new shape.prototype.constructor();
            }
            else {
                shape = tetromino;
            }

            shape.squares.forEach( function(val) {
                val.x += startTranslate.x;
                val.y += startTranslate.y;
            }, this);
            return shape;
        }

        /************************************************************
         * Game execution functions
         ************************************************************/
        var timeoutId = undefined;
        var gameState = "gameover";

        /**
         * Runs the game if it's not already running.
         */
        this.start = function() {
            if(gameState == "gameOver") {
                for(var i = matrix.length - 1; i >= 0; --i) {
                    for(var j = matrix[i].length - 1; j >= 0; --j) {
                        matrix[i][j] = false;
                    }
                }
                nextPiece = undefined;
                currentPiece = undefined;
                drawBoard();
            }

            gameState = "running";
            timeoutId = setInterval( _.bind(function() {
                this.next();
            }, tetris), timeoutInterval);
            $startButton.text("Pause Game");
        };

        /**
         * Stops execution of the game if it's running.
         */
        this.stop = function() {
            if(gameState == "running") {
                clearInterval(timeoutId);
            }
            gameState = "paused";
            $startButton.text('Resume Game');
        };

        function gameOver() {
            gameState == "gameover";
            timeoutId = undefined;
            $startButton.text('Start New Game');
        }

        /**
         * Executes the next iteration of the game.
         *
         * @param {Event} caller The "thing" that called the next method. A falsy value indicates that setTimeout or setInterval called next().
         */
        this.next = function(caller, tetromino) {
            if(!nextPiece) {
                nextPiece = getNextTetromino(tetromino);
            }
            if(!currentPiece) {
                currentPiece = nextPiece;
                nextPiece = getNextTetromino();
                drawNextPiece();
            }
            else if(!currentPiece.drop()) {
                if(_.some(currentPiece.squares, function(aSquare) { return aSquare.y >= matrix.length; })) {
                    gameOver();
                }

                $score.text(score += softDrop * (Math.floor(lines / 10) + 1));

                var rowCount = 0;
                _.each(currentPiece.squares, function(aSquare) {
                    matrix[aSquare.y][aSquare.x] = currentPiece.constructor.prototype.type;
                    if(_.every(matrix[aSquare.y], function(val) { return !!val; })) {
                        ++rowCount;
                        matrix[aSquare.y] = null;
                    }
                });

                if(rowCount) {
                    matrix = _.compact(matrix);
                    $lines.text(lines += rowCount);
                    $score.text(score += (100 * Math.pow(2, rowCount - 1) * (Math.floor(lines / 10) + 1)));

                    while(matrix.length < height) {
                        matrix.push([false, false, false, false, false, false, false, false, false, false]);
                    }
                }

                softDrop = 0;
                currentPiece = undefined;
            }
            else if(caller && caller.type == 'keydown') {
                ++softDrop;
            }
            drawBoard();
        };

        this.left = function() {
            if(currentPiece && currentPiece.left()) {
                drawBoard();
            }
        };

        this.right = function() {
            if(currentPiece && currentPiece.right()) {
                drawBoard();
            }
        };

        this.rotate = function(clockwise) {
            if(currentPiece && currentPiece.rotate(clockwise)) {
                drawBoard();
            }
        };

        /************************************************************
         * Canvas-drawing functions
         ************************************************************/
        var colors = {
            OTetromino: 'red',
            ITetromino: 'green',
            TTetromino: 'yellow',
            LTetromino: 'blue',
            STetromino: 'orange',
        };

        function drawBoard() {
            var canvas = $canvas.get(0),
                context = canvas.getContext('2d');

            var squareWidth = canvas.width / matrix[0].length, squareHeight = canvas.height / matrix.length;

            context.fillStyle = 'white';
            context.fillRect(0, 0, canvas.width, canvas.height);

            for(var row = matrix.length - 1; row >= 0; --row) {
                for(var column = 0; column < matrix[row].length; ++column) {
                    if(!!matrix[row][column]) {
                        context.fillStyle = colors[matrix[row][column]];
                        context.strokeRect(column * squareWidth, canvas.height - ((row + 1) * squareHeight), squareWidth, squareHeight);
                        context.fillRect(column * squareWidth + 1, canvas.height - ((row + 1) * squareHeight) + 1,
                            squareWidth - 2, squareHeight - 2);
                    }
                }
            }

            if(currentPiece) {
                context.fillStyle = colors[currentPiece.constructor.prototype.type];
                _.each(currentPiece.squares, function(val) {
                    context.strokeRect(val.x * squareWidth, canvas.height - ((val.y + 1) * squareHeight), squareWidth, squareHeight);
                    context.fillRect(val.x * squareWidth + 1, canvas.height - ((val.y + 1) * squareHeight) + 1, squareWidth - 2, squareHeight - 2);
                }, this);
            }
        }

        function drawNextPiece() {
            var canvas = $nextPiece.get(0),
                context = canvas.getContext('2d');

            var squareWidth = canvas.width / 4, squareHeight = canvas.height / 4;

            context.fillStyle = 'white';
            context.fillRect(0, 0, canvas.width, canvas.height);

            context.fillStyle = colors[nextPiece.constructor.prototype.type];
            _.each(nextPiece.squares, function(val) {
                context.strokeRect((val.x - startTranslate.x) * squareWidth, canvas.height - ((val.y - startTranslate.y + 1) * squareHeight),
                        squareWidth, squareHeight);
                context.fillRect((val.x - startTranslate.x) * squareWidth + 1, canvas.height - ((val.y - startTranslate.y + 1) * squareHeight) + 1,
                        squareWidth - 2, squareHeight - 2);
            }, this);
            console.log('stop');
        }

        /************************************************************
         * Tetromino classes.
         ************************************************************/
        /**
         * Abstract tetromino constructor
         * @constructor
         */
        function Tetromino() {
            this.squares = new Array();

            /**
             * Drop this tetromino by one row, if possible.
             *
             * @return true iff we could successfully drop the tetromino, otherwise false
             */
            this.drop = function() {
                if(this.squares.every(function(val) { return val.y > 0 && (val.y >= matrix.length || matrix[val.y - 1][val.x] == false); })) {
                    this.squares.forEach( function(val) {
                        --val.y;
                    });
                    return true;
                }
                return false;
            };

            /**
             * Move this tetromino one unit left, if possible.
             *
             * @return true iff we could successfully move the tetronimo left, otherwise false
             */
            this.left = function() {
                if(this.squares.every(function(val) { return val.x > 0 && (val.y >= matrix.length || !matrix[val.y][val.x - 1]); })) {
                    this.squares.forEach( function(val) {
                        --val.x;
                    });
                    return true;
                }
                return false;
            };

            /**
             * Move this tetromino one unit right, if possible.
             *
             * @return true iff we could successfully move the tetromino right, otherwise false
             */
            this.right = function() {
                if(this.squares.every(function(val) { return val.x < matrix[0].length - 1 && (val.y >= matrix.length || !matrix[val.y][val.x + 1]); })) {
                    this.squares.forEach( function(val) {
                        ++val.x;
                    });
                    return true;
                }
                return false;
            };

            /**
             * Rotate this tetromino around a point, specifically the point at this.squares[1].
             *
             * @param {Boolean} clockwise true if we're rotating clockwise, false if counterclockwise
             * @return true iff we could successfully rotate the tetromino, otherwise false
             */
            this.rotate = function(clockwise) {
                var origin = this.squares[1], result = [];

                for(var i = this.squares.length - 1; i >= 0; --i) {
                    if(i == 1) {
                        result[i] = this.squares[i];
                    }
                    else {
                        result[i] = clockwise ?
                            {
                                x: this.squares[i].y - origin.y + origin.x,
                                y: -(this.squares[i].x - origin.x) + origin.y
                            } :
                            {
                                x: -(this.squares[i].y - origin.y) + origin.x,
                                y: this.squares[i].x - origin.x + origin.y
                            };
                                                            // result[i].y < 0 covers the case where we rotate beyond the bottom of the board
                                                            // result[i].x < 0 covers the case where we rotate beyond the left edge of the board
                                                            // matrix[result[i].y][result[i].x] !== false covers the case where we rotate onto
                                                            //      an occupied square AND the case where we rotate beyond the right edge
                                                            //      of the board...
                                                            //      n.b.: matrix[y][x] throws an error if y >= matrix.length but
                                                            //            matrix[y][x] === undefined if 0 <= y < matrix.length and x >= matrix[y].length
                        if(result[i].y < 0 || result[i].x < 0 || (result[i].y < matrix.length && matrix[result[i].y][result[i].x] !== false)) {
                            return false;
                        }
                    }
                }

                for(var i = this.squares.length - 1; i >= 0; --i) {
                    this.squares[i].x = result[i].x;
                    this.squares[i].y = result[i].y;
                }
                return true;
            };

            this.isAt = function(coords) {
                return this.squares.some( function(val) { return val.x == coords.x && val.y == coords.y; });
            };

            Tetromino.prototype.toString = function() {
                var string = "";
                this.squares.forEach( function(val) { string += "{x: " + val.x + ", y: " + val.y + "}"; });
                return string;
            };
        }

        Tetromino.prototype.congruent = function(t1, t2) {
            if(!(t1 instanceof Tetromino && t2 instanceof Tetromino)) {
                throw new TypeError("congruent function only applies to tetrominos");
            }
            return t1.constructor === t2.constructor;
        };

        Tetromino.prototype.colocated = function(t1, t2) {
            if(!(t1 instanceof Tetromino && t2 instanceof Tetromino)) {
                throw new TypeError("colocated function only applies to tetrominos");
            }
            if(!Tetromino.prototype.congruent(t1, t2)) {
                return false;
            }

            for(var i = t1.squares.length - 1; i >= 0; --i) {
                if(!t2.squares.some( function(val) {
                    return val.x == t1.squares[i].x && val.y == t1.squares[i].y;
                })) {
                    return false;
                }
            }
            return true;
        };

        Tetromino.prototype.Orientation = {
            HORIZONTAL: 1,
            VERTICAL: 2,
            RIGHT: 1,
            DOWN: 2,
            LEFT: 3,
            UP: 4,
        };

        /**
         * O-Tetromino constructor
         * @constructor
         * @extends Tetromino
         */
        function OTetromino() {
            this.prototype = OTetromino.prototype;

            Tetromino.call(this);

            this.squares = [{x: 0, y: 0}, {x: 0, y: 1}, {x: 1, y: 0}, {x: 1, y: 1}];
            this.rotate = function() { return true; };                  // rotating the O-tetromino doesn't do anything
            return this;
        }
        OTetromino.prototype = Object.create(Tetromino.prototype);
        OTetromino.prototype.constructor = OTetromino;
        OTetromino.prototype.type = 'OTetromino';

        /**
         * I-Tetromino constructor
         * @constructor
         * @extends Tetromino
         * @param {Orientation} o An optional orientation, or falsy for a random orientation
         */
        function ITetromino(o) {
            this.prototype = ITetromino.prototype;

            Tetromino.call(this);
            if(!o || !(o == Tetromino.prototype.Orientation.HORIZONTAL || o == Tetromino.prototype.Orientation.VERTICAL)) {
                o = Math.random() < .5 ? Tetromino.prototype.Orientation.HORIZONTAL : Tetromino.prototype.Orientation.VERTICAL;
            }

            this.squares =
                o == Tetromino.prototype.Orientation.HORIZONTAL ?
                    [{x: 0, y: 0}, {x: 1, y: 0}, {x: 2, y: 0}, {x: 3, y: 0}] :
                    [{x: 0, y: 0}, {x: 0, y: 1}, {x: 0, y: 2}, {x: 0, y: 3}];

            return this;
        }
        ITetromino.prototype = Object.create(Tetromino.prototype);
        ITetromino.prototype.constructor = ITetromino;
        ITetromino.prototype.type = 'ITetromino';

        /**
         * T-Tetromino constructor
         * @constructor
         * @extends Tetromino
         * @param {Orientation} o An optional orientation, or falsy for a random orientation
         */
        function TTetromino(o) {
            this.prototype = TTetromino.prototype;


            Tetromino.call(this);
            if(!o || !(o == Tetromino.prototype.Orientation.RIGHT ||
                       o == Tetromino.prototype.Orientation.DOWN  ||
                       o == Tetromino.prototype.Orientation.LEFT  ||
                       o == Tetromino.prototype.Orientation.UP)) {
                o = _.random(Tetromino.prototype.Orientation.RIGHT, Tetromino.prototype.Orientation.UP);
            }

            this.squares =
                o == Tetromino.prototype.Orientation.UP ?
                    [{x: 0, y: 0}, {x: 1, y: 0}, {x: 2, y: 0}, {x: 1, y: 1}] :
                o == Tetromino.prototype.Orientation.RIGHT ?
                    [{x: 0, y: 0}, {x: 0, y: 1}, {x: 0, y: 2}, {x: 1, y: 1}] :
                o == Tetromino.prototype.Orientation.DOWN ?
                    [{x: 0, y: 1}, {x: 1, y: 1}, {x: 2, y: 1}, {x: 1, y: 0}] :
                    [{x: 1, y: 0}, {x: 1, y: 1}, {x: 1, y: 2}, {x: 0, y: 1}];

            return this;
        }
        TTetromino.prototype = Object.create(Tetromino.prototype);
        TTetromino.prototype.constructor = TTetromino;
        TTetromino.prototype.type = 'TTetromino';

        /**
         * L-Tetromino constructor
         * @constructor
         * @extends Tetromino
         * @param {Orientation} o An optional orientation, or falsy for a random orientation
         * @param {Orientation} c An optional chirality, or falsy for a random chirality
         */
        function LTetromino(o, c) {
            this.prototype = LTetromino.prototype;

            Tetromino.call(this);
            if(!o || !(o == Tetromino.prototype.Orientation.RIGHT ||
                       o == Tetromino.prototype.Orientation.DOWN  ||
                       o == Tetromino.prototype.Orientation.LEFT  ||
                       o == Tetromino.prototype.Orientation.UP)) {
                o = _.random(Tetromino.prototype.Orientation.RIGHT, Tetromino.prototype.Orientation.UP);
            }
            if(!c || !(c == Tetromino.prototype.Orientation.LEFT || c == Tetromino.prototype.Orientation.RIGHT)) {
                c = Math.random() < .5 ? Tetromino.prototype.Orientation.LEFT : Tetromino.prototype.Orientation.RIGHT;
            }

            // LEFT chirality: UP *    LEFT ***    DOWN **    RIGHT   *
            //                    *         *            *          ***
            //                    **                     *
            if(c == Tetromino.prototype.Orientation.LEFT) {
                this.squares =
                    o == Tetromino.prototype.Orientation.UP ?
                        [{x: 1, y: 0}, {x: 0, y: 0}, {x: 0, y: 1}, {x: 0, y: 2}] :
                    o == Tetromino.prototype.Orientation.LEFT ?
                        [{x: 0, y: 0}, {x: 0, y: 1}, {x: 1, y: 1}, {x: 2, y: 1}] :
                    o == Tetromino.prototype.Orientation.DOWN ?
                        [{x: 0, y: 2}, {x: 1, y: 2}, {x: 1, y: 1}, {x: 1, y: 0}] :
                        [{x: 2, y: 1}, {x: 2, y: 0}, {x: 1, y: 0}, {x: 0, y: 0}];
            }
            // RIGHT chirality: UP  *    LEFT *     DOWN **    RIGHT ***
            //                      *         ***        *             *
            //                     **                    *
            else {
                this.squares =
                    o == Tetromino.prototype.Orientation.UP ?
                        [{x: 0, y: 0}, {x: 1, y: 0}, {x: 1, y: 1}, {x: 1, y: 2}] :
                    o == Tetromino.prototype.Orientation.LEFT ?
                        [{x: 0, y: 1}, {x: 0, y: 0}, {x: 1, y: 0}, {x: 2, y: 0}] :
                    o == Tetromino.prototype.Orientation.DOWN ?
                        [{x: 1, y: 2}, {x: 0, y: 2}, {x: 0, y: 1}, {x: 0, y: 0}] :
                        [{x: 2, y: 0}, {x: 2, y: 1}, {x: 1, y: 1}, {x: 0, y: 1}];
            }

            return this;
        }
        LTetromino.prototype = Object.create(Tetromino.prototype);
        LTetromino.prototype.constructor = LTetromino;
        LTetromino.prototype.type = 'LTetromino';

        /**
         * S-Tetromino constructor
         * @constructor
         * @extends
         * @param {Orientation} o An optional orientation, or undefined for a random orientation
         * @param {Object} c An optional chirality, or undefined for a random chirality
         */
        function STetromino(o, c) {
            this.prototype = STetromino.prototype;

            Tetromino.call(this);
            if(!o || !(o == Tetromino.prototype.Orientation.UP || o == Tetromino.prototype.Orientation.DOWN)) {
                o = Math.random() < .5 ? Tetromino.prototype.Orientation.UP : Tetromino.prototype.Orientation.DOWN;
            }
            if(!c || !(c == Tetromino.prototype.Orientation.LEFT || c == Tetromino.prototype.Orientation.RIGHT)) {
                c = Math.random() < .5 ? Tetromino.prototype.Orientation.LEFT : Tetromino.prototype.Orientation.RIGHT;
            }

            // LEFT chirality: UP *     DOWN  **
            //                    **         **
            //                     *
            if(c == Tetromino.prototype.Orientation.LEFT) {
                this.squares =
                    o == Tetromino.prototype.Orientation.UP ?
                        [{x: 0, y: 2}, {x: 0, y: 1}, {x: 1, y: 1}, {x: 1, y: 0}] :
                        [{x: 2, y: 1}, {x: 1, y: 1}, {x: 1, y: 0}, {x: 0, y: 0}];
            }
            // RIGHT chirality: UP  *    DOWN **
            //                     **          **
            //                     *
            else {
                this.squares =
                    o == Tetromino.prototype.Orientation.UP ?
                        [{x: 0, y: 0}, {x: 0, y: 1}, {x: 1, y: 1}, {x: 1, y: 2}] :
                        [{x: 0, y: 1}, {x: 1, y: 1}, {x: 1, y: 0}, {x: 2, y: 0}];
            }

            return this;
        }
        STetromino.prototype = Object.create(Tetromino.prototype);
        STetromino.prototype.constructor = STetromino;
        STetromino.prototype.type = 'STetromino';
    }
});
