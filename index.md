---
pagetitle: Tetris
---

<script type="text/javascript" src="build/tetris.js"></script>
<script type="text/javascript">
    var $ = require('jquery');

    $(document).ready(function() {
       new Tetris($('#main'));
    });
</script>

Tetris {#tetris_}
======

<div id="main"></div>

# which keys to mash

+ The left and right arrow keys do exactly what you'd expect them to do.
+ The space bar and down arrow are soft drop keys. Hard drop isn't implemented.
+ The Z and X keys rotate the current tetromino counter-clockwise and clockwise, respectively.
+ The P key pauses (and un-pauses) the game. So does the "Pause Game" button. So does clicking outside of the game.
