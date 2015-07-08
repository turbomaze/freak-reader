/******************\
|   Freak Reader   |
| @author Anthony  |
| @version 0.1     |
| @date 2015/07/07 |
| @edit 2015/07/07 |
\******************/

var FreakReader = (function() {
    /**********
     * config */

    /*************
     * constants */

    /*********************
     * working variables */

    /******************
     * work functions */
    function initFreakReader() {
         //code
    }

    /***********
     * objects */

    /********************
     * helper functions */
    function $s(id) { //for convenience
        if (id.charAt(0) !== '#') return false;
        return document.getElementById(id.substring(1));
    }

    function getRandInt(low, high) { //output is in [low, high)
        return Math.floor(low + Math.random()*(high-low));
    }

    function round(n, places) {
        var mult = Math.pow(10, places);
        return Math.round(mult*n)/mult;
    }

    return {
        init: initFreakReader
    };
})();

window.addEventListener('load', FreakReader.init);
