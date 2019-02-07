const Nightmare = require('nightmare')

var DefineActions = function () {
    Nightmare.action('populate', function (selector, text, done) {
        //console.log('populate() %s into %s', text, selector);
        this.evaluate_now(function (selector, text) {
            var element = document.querySelector(selector);
            element.value = text;
        }, done, selector, text);
    });
};

module.exports = DefineActions;