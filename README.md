Tetris
======

Tetris — Javascript + HTML5

Here's a stand-alone library that plunks a Tetris game into some DOM, _because nobody has ever written code for that before, ever._  

The program's only requirements are [jQuery](http://jquery.com) and [Underscore.js](http://underscorejs.org), which you probably already have loaded on your site. HTML5 is also a requirement; Tetris draws on a `<canvas>` element.

`tetris.js` exposes a single `Tetris` constructor function to the global environment:

`Tetris($element)`, where `$element` is the jQuery object that the Tetris DOM gets injected into. That's it! 

    <script type="text/javascript" src="tetris.js"></script>
    <script type="text/javascript">
        $(document).ready(function() {
            new Tetris($('div#tetris-game'));
        });
    </script>
    
The Tetris script `.append`s elements with id's "tetris", "tetris-canvas", "tetris-right", "score", "lines", "tetris-next-piece", and "start", so you probably shouldn't `id` any of your own elements with those names. I probably should've done a better job namespacing this thing, but never mind. There's also a CSS class "next-tetromino".
