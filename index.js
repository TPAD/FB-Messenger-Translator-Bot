/*
 *	11/7/2016 Antonio Padilla
 *
 *  Simple facebook messenger bot that translates text
 *  using google-translate api
 *  FB Page: Test-Bot
 *  
 *	Uses a lightweight Node.js framework Express for routing
 * 
 */

var G_API_KEY = 'AIzaSyCBckYCeXQ6j_voOmOq7UHuWqWjHUYEz7E';
var express = require('express');
var bodyParser = require('body-parser');
var request = require('request');
var gt = require('google-translate')(G_API_KEY);

var app = express();

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
app.listen((process.env.PORT || 3000));

/* Usage message giving user instructions on how to use the bot */
var usage = 
            'Usage:\n translate <text> from <source> to <target>\n\n' +
            'text: text you would like to translate\n' + 
            'source: language of text\n' + 
            'target: language you would like to translate text to\n' + 
            'type \'help\' to display this message\n\n' +
            'for supported languages, type \'support\'.\n' + 
            'what would you like translated?';
var error = 'Sorry, I do not understand. Send \'help\' to learn how to use me.';

/* supported languages supported by the api (this is not necessary) */
var language = {afrikaans: 'af', albanian: 'sq', amharic: 'am', arabic: 'ar', 
                armenian: 'hy', azeerbaijani: 'az', basque: 'eu', belarusian: 'be', 
                bengali: 'bn', bosnian: 'bs', bulgarian: 'bg', catalan: 'ca', 
                chichewa: 'ny', chinese: 'zh', corsican: 'co', croatian: 'hr', 
                czech: 'cs', danish: 'da', dutch: 'nl', english: 'en', 
                esperanto: 'eo', estonian: 'et', filipino: 'tl', finnish: 'fi', 
                french: 'fr', frisian: 'fy', galician: 'gl', georgian: 'ka', 
                greek: 'el', german: 'de', gujarati: 'gu', haitian: 'ht', 
                hausa: 'ha', hawaiian: 'haw', hebrew: 'iw', hindi: 'hi', 
                hmong: 'hmn', hungarian: 'hu', icelandic: 'is', igbo: 'ig', 
                indonesian: 'id', irish: 'ga', italian: 'it', japanese: 'ja', 
                javanese: 'jw', kannada: 'kn', kazakh: 'kk', korean: 'ko', 
                kurdish: 'ku', kyrgyz: 'ky', lao: 'lo', latin: 'la', 
                latvian: 'lv', lithuanian: 'lt', luxembourgish: 'lb', 
                macedonian: 'mk', malagasy: 'mg', malay: 'ms', malayalam: 'ml', 
                maltese: 'mt', maori: 'mi', marathi: 'mr', mongolian: 'mn', 
                burmese: 'my', nepali: 'ne', norwegian: 'no', pashto: 'ps', 
                persian: 'fa', polish: 'pl', portuguese: 'pt', punjabi: 'ma', 
                romanian: 'ro', russian: 'ru', samoan: 'sm', gaelic: 'gd', 
                serbian: 'sr', sesotho: 'st', shona: 'sn', sindhi: 'sd', 
                sinhala: 'si', slovak: 'sk', slovenian: 'sl', somali: 'so', 
                spanish: 'es', sundanese: 'su', swahili: 'sw', swedish: 'sv', 
                tajik: 'tg', tamil: 'ta', telugu: 'te', thai: 'th', turkish: 'tr', 
                ukrainian: 'uk', urdu: 'ur', uzbek: 'uz', vietnamese: 'vi', 
                welsh: 'cy', xhosa: 'xh', yiddish: 'yi', yoruba: 'yo', zulu: 'zu'};

var supported_lang_a = '';
var supported_lang_b = '';
var supported_lang_c = '';
var supported_lang_d = '';

// This is simply text that appears on the front page
app.get('/', function (req, res) {
    res.sendfile('test.html', {root: __dirname });
    gt.getSupportedLanguages('en', function(err, languageCodes) {
        var i; var j; var k; var l;
        for (i = 0; i < languageCodes.length/4; i++) {
            supported_lang_a += languageCodes[i]['name'] + ', ';
        }
        for (j = languageCodes.length/4; j < languageCodes.length/2; j++) {
            supported_lang_b += languageCodes[j]['name'] + ', ';
        }
        for (k = languageCodes.length/2; k < 3*languageCodes.length/4; k++) {
            supported_lang_c += languageCodes[k]['name'] + ', ';
        }
        for (l = 3*languageCodes.length/4; l < languageCodes.length; l++) {
            supported_lang_d += languageCodes[l]['name'] + ', ';
        }
    });
});

// Facebook Webhook
app.get('/webhook', function (req, res) {
    if (req.query['hub.verify_token'] === 'testbot_token') {
        res.send(req.query['hub.challenge']);
    } else {
        res.send('Invalid verify token');
    }
});

// handler receiving messages
app.post('/webhook', function (req, res) {
    var events = req.body.entry[0].messaging;
    console.dir(events);
    for (i = 0; i < events.length; i++) {
        var event = events[i];
        if (event.message && event.message.text) {
            var string = event.message.text;
            var array = string.split(" ");
            console.log(array);
            parse(string, event);
        }
    }
    res.sendStatus(200);
});

// generic function sending messages
function sendMessage(recipientId, message) {
    request({
        url: 'https://graph.facebook.com/v2.6/me/messages',
        qs: {access_token: process.env.PAGE_ACCESS_TOKEN},
        method: 'POST',
        json: {
            recipient: {id: recipientId},
            message: message,
        }
    }, function(error, response, body) {
        if (error) {
            console.log('Error sending message: ', error);
        } else if (response.body.error) {
        	if (response.body.error.code === 100) {
        		// This is a user auth error
        	}
        	console.log(response.body.error.code);
            console.log('Error: ', response.body.error);
        }
    });
};

function parse(message, event) {
    var tok_arr = message.split(" ");
    // help message case
    if (tok_arr.length == 1) {
        switch (tok_arr[0]) {
            case 'help':
                sendMessage(event.sender.id, {text: usage});
                break;
            case 'support':
                sendMessage(event.sender.id, {text: supported_lang_a});
                sendMessage(event.sender.id, {text: supported_lang_b});
                sendMessage(event.sender.id, {text: supported_lang_c});
                sendMessage(event.sender.id, {text: supported_lang_d});
                break;
            default:
                sendMessage(event.sender.id, {text: error});
                break;
        }
    /* any less than 6 word in request means it is incomplete */
    } else if (tok_arr.length < 6) {
        var msg = 'Your request is incomplete.' +
                  'Send \'help\' to learn how to complete a request.'
        sendMessage(event.sender.id, {text: msg});
    } else {
        var txt = ''; var src = ''; var tgt = ''; 
        /* lo and hi based on keywords required to complete request */
        var lo = 1; var hi = tok_arr.length - 4;
        var i; var j;
        /* get source and destination languages */
        for (i = 0; i < tok_arr.length; i++) {
            if (tok_arr[i] === 'from') 
                src = language[tok_arr[i + 1]];
            if (tok_arr[i] === 'to')
                tgt = language[tok_arr[i + 1]];
        }
        /* get the desired text to be translated */
        for(j = lo; j < hi; j++) {
            txt += tok_arr[j] + ' ';
        }
        /* translate request only if all necessary information is gathered */
        if (txt != '' && src != '' && tgt != '') {
            gt.translate(txt, src, tgt, function(err, translation) {
                if (err) {
                    sendMessage(event.sender.id, {text: 'An error ocurred'});
                } else {
                    sendMessage(event.sender.id, {text: translation.translatedText});
                }
            }); 
        } else {
            sendMessage(event.sender.id, {text: 'It appears your request is incomplete'});
        }
    }
}



