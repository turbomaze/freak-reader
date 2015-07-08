/******************\
|   Freak Reader   |
| @author Anthony  |
| @version 1.0.1   |
| @date 2015/07/07 |
| @edit 2015/07/07 |
\******************/

var FreakReader = (function() {
    /**********
     * config */
    var DIFFICULTY_TIME_RATIO = 6;
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
        /*$s('#chunk-pix').checked =  !CHUNK_WORDS ? 'checked' : false;
        $s('#chunk-size-pix').value = PIX_CHUNK_SIZE;*/
        $s('#diff-ratio').value = DIFFICULTY_TIME_RATIO;
        $s('#wpm').value = SPEED;

        //event listeners
        $s('#chunk-words').addEventListener('change', function() {
            CHUNK_WORDS = !!$s('#chunk-words').checked;
            $s('#chunk-pix').checked = !CHUNK_WORDS ? 'checked' : false;
            train.setDelayFunc(getDelayFunction());
        });
        /*$s('#chunk-pix').addEventListener('change', function() {
            CHUNK_WORDS = !$s('#chunk-pix').checked;
            $s('#chunk-words').checked = CHUNK_WORDS ? 'checked' : false;
            train.setDelayFunc(getDelayFunction());
        });*/
        $s('#chunk-size-words').addEventListener('input', function() {
            WORD_CHUNK_SIZE = parseInt($s('#chunk-size-words').value);
            train.setDelayFunc(getDelayFunction());
        });
        /*$s('#chunk-size-pix').addEventListener('input', function() {
            PIX_CHUNK_SIZE = parseInt($s('#chunk-size-pix').value);
            train.setDelayFunc(getDelayFunction());
        });*/
        $s('#diff-ratio').addEventListener('input', function() {
            DIFFICULTY_TIME_RATIO = parseInt(
                $s('#diff-ratio').value
            );
            train.setDelayFunc(getDelayFunction());
        });
        $s('#wpm').addEventListener('input', function() {
            SPEED = parseInt($s('#wpm').value);
            train.setDelayFunc(getDelayFunction());
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
                var chunk = '';
                var upTo = Math.min(
                    sourceText.length, wordPtr+WORD_CHUNK_SIZE
                );
                for (; wordPtr < upTo; wordPtr++) {
                    chunk += ' '+sourceText[wordPtr];
                }
                chunk = chunk.substring(1);

                $s('#text').innerHTML = chunk;

                //false when you need to stop
                return wordPtr < sourceText.length;
            }, getDelayFunction());

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

    function getDelayFunction() {
        var tools = getBaseRateAndDilaFunc();
        var getDilationFromDiff = tools[0];
        var baseRate = tools[1];
        return function() {
            var nextChunk = [];
            var upTo = Math.min(
                sourceText.length, wordPtr+WORD_CHUNK_SIZE
            );
            for (var ai = wordPtr; ai < upTo; ai++) {
                nextChunk.push(sourceText[ai]);
            }

            var diff = nextChunk.reduce(function(a, b) {
                return a + getWordDifficulty(b);
            }, 0);
            return getDilationFromDiff(diff)*baseRate;
        };
    }

    function getBaseRateAndDilaFunc() {
        var chunks = [];
        var ai = wordPtr;
        while (ai < sourceText.length) {
            var chunk = [];
            var upTo = Math.min(
                sourceText.length, ai+WORD_CHUNK_SIZE
            );
            for (; ai < upTo; ai++) {
                chunk.push(sourceText[ai]);
            }
            chunks.push(chunk);
        }
        var difficulties = chunks.map(function(chunk) {
            return chunk.reduce(function(a, b) {
                return a + getWordDifficulty(b);
            }, 0);
        });
        var minDiff = difficulties.reduce(function(a, b) {
            return Math.min(a, b);
        });
        var maxDiff = difficulties.reduce(function(a, b) {
            return Math.max(a, b);
        });
        var getDilationFromDiff = function(diff) {
            var extra = DIFFICULTY_TIME_RATIO-1;
            return 1+extra*(diff-minDiff)/(maxDiff-minDiff);
        };
        var dilations = difficulties.map(getDilationFromDiff);
        var dilationSum = dilations.reduce(function(a, b) {
            return a+b;
        });
        var totalTime = (60000/SPEED)*(sourceText.length - wordPtr);
        var baseRate = totalTime/dilationSum;

        return [getDilationFromDiff, baseRate];
    }

    /***********
     * objects */
    function AsyncTrain(chooChoo, getNextDelay) {
        var self = this;
        this.timer = null;
        this.isPaused = false;
        this.delayFunc = getNextDelay;
        this.run = function() {
            var keepGoing = chooChoo();
            if (keepGoing) {
                this.timer = setTimeout(function() {
                    self.run();
                }, this.delayFunc());
            } else {
                //stop
            }
        };
        this.pause = function() {
            //pause here
            this.isPaused = !this.isPaused;
            if (this.isPaused) { //they're pausing
                clearTimeout(this.timer);
            } else { //they're unpausing
                this.timer = setTimeout(function() {
                    self.run();
                }, this.delayFunc());
            }
        };
        this.setDelayFunc = function(func) {
            this.delayFunc = func;
        };
    }

    /********************
     * helper functions */
    function getWordDifficulty(word) { //from 0 to 1, 0 is easy
        var cleanedUpWord = word.replace(/[^a-zA-Z0-9-]/g, '');
        cleanedUpWord = cleanedUpWord.toLowerCase();
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
