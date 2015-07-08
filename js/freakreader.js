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
    var CHUNK_WORDS = true;
    var WORD_CHUNK_SIZE = 1;
    var PIX_CHUNK_SIZE = 300;
    var SPEED = 400;

    /*************
     * constants */

    /*********************
     * working variables */
    var sourceText = [];
    var currentlyReading = false;
    var isPaused = false;
    var wordPtr = 0;
    var train = null;

    /******************
     * work functions */
    function initFreakReader() {
        //default values
        $s('#chunk-words').checked = CHUNK_WORDS ? 'checked' : false;
        $s('#chunk-size-words').value = WORD_CHUNK_SIZE;
        $s('#chunk-pix').checked =  !CHUNK_WORDS ? 'checked' : false;
        $s('#chunk-size-pix').value = PIX_CHUNK_SIZE;
        $s('#wpm').value = SPEED;

        //event listeners
        $s('#chunk-words').addEventListener('change', function() {
            CHUNK_WORDS = !!$s('#chunk-words').checked;
            $s('#chunk-pix').checked = !CHUNK_WORDS ? 'checked' : false;
        });
        $s('#chunk-pix').addEventListener('change', function() {
            CHUNK_WORDS = !$s('#chunk-pix').checked;
            $s('#chunk-words').checked = CHUNK_WORDS ? 'checked' : false;
        });
        $s('#chunk-size-words').addEventListener('input', function() {
            WORD_CHUNK_SIZE = parseInt($s('#chunk-size-words').value);
        });
        $s('#chunk-size-pix').addEventListener('input', function() {
            PIX_CHUNK_SIZE = parseInt($s('#chunk-size-pix').value);
        });
        $s('#wpm').addEventListener('input', function() {
            SPEED = parseInt($s('#wpm').value);
        });

        $s('#start-btn').addEventListener('click', function() {
            //keep track of state
            wordPtr = 0;
            isPaused = false;
            $s('#pause-btn').value = 'Pause';
            currentlyReading = true;

            //get the text to speed read
            sourceText = $s('#source-text').value.split(' ');

            //build the AsyncTrain
            train = new AsyncTrain(function workFunc() {
                $s('#text').innerHTML = sourceText[wordPtr];
                wordPtr++;
            }, function delayFunc() {
                return 60000/SPEED; //in ms
            });

            //run it!
            train.run();
        });
        $s('#pause-btn').addEventListener('click', function() {
            if (!currentlyReading) return;

            isPaused = !isPaused; //toggle
            $s('#pause-btn').value = isPaused ? 'Continue' : 'Pause';

            train.pause();
        });
    }

    /***********
     * objects */
    function AsyncTrain(chooChoo, getNextDelay) {
        var self = this;
        this.timer = null;
        this.isPaused = false;
        this.run = function() {
            chooChoo();
            this.timer = setTimeout(function() {
                self.run();
            }, getNextDelay());
        };
        this.pause = function() {
            //pause here
            this.isPaused = !this.isPaused;
            if (this.isPaused) { //they're pausing
                clearTimeout(this.timer);
            } else { //they're unpausing
                this.timer = setTimeout(function() {
                    self.run();
                }, getNextDelay());
            }
        };
    }

    /********************
     * helper functions */
    function getWordDifficulty(word) { //from 0 to 1, 0 is easy
        var cleanedUpWord = word.replace(/[^a-zA-Z0-9-]/g, '');
        var maxFreq = wordFreqs['you'];
        var freq = wordFreqs.hasOwnProperty(
            cleanedUpWord
        ) ? wordFreqs[cleanedUpWord] : 1;
        return (maxFreq - freq)/maxFreq;
    }

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
