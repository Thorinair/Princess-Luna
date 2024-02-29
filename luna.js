// Modules
const util           = require("util")
const fs             = require("fs");
const readline       = require("readline");
const http           = require("http");
const url            = require('url');
const exec           = require('child_process').exec;
const WebSocket      = require('ws');
const dgram          = require('dgram');

// 3rd Party Modules
const Discord        = require("discord.io");
const CronJob        = require("cron").CronJob;
const moment         = require("moment-timezone");
const request        = require("request");
const XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
const archiver       = require("archiver");
const tradfrilib     = require('node-tradfri');
const color          = require('c0lor');
const jsmegahal      = require("jsmegahal");
const tripwire       = require("tripwire");
const blitzorapi     = require("@simonschick/blitzortungapi");
const Fili           = require('fili');

const package  = require("./package.json");

// Load file data
var token      = require("./config/token.json");
var config     = require("./config/config.json");
var commands   = require("./config/commands.json");
var custom     = require("./config/custom.json");
var strings    = require("./config/strings.json");
var gotn       = require("./config/gotn.json");
var phases     = require("./config/phases.json");
var mlp        = require("./config/mlp.json");
var channels   = require("./config/channels.json");
var varipass   = require("./config/varipass.json");
var printer    = require("./config/printer.json");
var dtls       = require("./config/dtls.json");
var tradfri    = require("./config/tradfri.json");
var schedule   = require("./config/schedule.json");
var httpkey    = require("./config/httpkey.json");
var mac        = require("./config/mac.json");
var blitzor    = require("./config/blitzor.json");
var thori      = require("./config/thori.json");
var devices    = require("./config/devices.json");
var reactrole  = require("./config/reactrole.json");
var talosmeets = require("./config/talosmeets.json");

var moon = require(config.moon.lunamoon.pathdata);

require("tls").DEFAULT_ECDH_CURVE = "auto"

/************************************
 * Princess Luna's functions are divided in multiple categories
 * based on various functionality. In order to jump to a
 * certain category, please search for the terms below.
 *
 * Function index:
 *
 *   STATUS VARIABLES
 *   COMMAND DEFINITIONS
 *   COMPONENT AND CONFIG LOADING
 *   REST API REQUESTS
 *   DISCORD FUNCTIONALITY
 *   VARIPASS FUNCTIONALITY
 *   BLITZORTUNG FUNCTIONALITY
 *   TRADFRI FUNCTIONALITY
 *   CHANNEL AND DATA TRANSLATION
 *   STRING MANIPULATION AND GENERATION
 *   GEOGRAPHIC DATA PROCESSING
 *   SEISMOGRAPH DATA PROCESSING
 *   STATUS MONITORING
 *   MISCELLANEOUS FUNCTIONS
 *
 ************************************/
 


/*******************
 * STATUS VARIABLES
 *******************/

var started = false;

// Loaded
var jobsGOTN = [];
var lyrics;
var art;
var story;
var spool;
var nptoggles;
var annStatus;
var blacklist;
var ignore;

// Phase Data
var jobsPhases = [];

// Brain Data
var brains    = {};
var brainProg = 0;
var messages  = {};

// Now Playing Data
var np        = {};
var npradio   = {};
var npstarted = false;
var nppaused  = false;
var npover    = {};

// EEG Data
var eegValues;
var eegValuesEMA;
var eegValuesEMAPrev;
var eegTable;
var eegTableEMA;
var eegInitial   = true;
var eegRecording = false;
var eegConfig;

// Tradfri
var hub;
var tBulbs;
var tToggles;
var tRemotes;
var hubFails        = 0;
var scheduleEntries = [];
var scheduleJobs    = [];
var hubReady        = true;

// VariPass
var vpTimeDose;
var vpTimePressure;
var doseWasWarned   = false;
var pm025WasWarned  = false;
var nightLightCount = 0;

// Purging
var purgeReady = false;
var purgeBrain = "";
var purgeStart = "";
var purgeEnd   = "";

// Power Monitoring
var powerStatus = null;

// Blitzortung
var blitzorws;
var lightningRange = blitzor.range;
var lightningNew   = blitzor.range;
var lightningLat   = 0;
var lightningLng   = 0;
var lightningExpire;
var lightningSpread;
var lightningReconnect;

// Blitzortung Storm Chasing
var chasews;
var isChasing  = false;
var chaseRange = blitzor.range;
var chaseNew   = blitzor.range;
var chaseLat   = 0;
var chaseLng   = 0;
var chaseExpire;
var chaseSpread;
var chaseReconnect;
var chaseThoriLat = 0.0;
var chaseThoriLng = 0.0;

// RariTUSH Data
var tushStep = 0;
var tushEncL;
var tushEncR;
var tushWeight;
var tushRaw;
var tushPaused = false;
var tushStart;

// Status
var statusGlobal = {};
var statusTimeoutLunaLocal;
var statusTimeoutLunaPublic;
var statusTimeoutChrysalisFileLocal;
var statusTimeoutChrysalisFilePublic;
var statusTimeoutChrysalisIcecastLocal;
var statusTimeoutChrysalisIcecastPublic;
var statusTimeoutChrysalisAnn;
var statusTimeoutRarityLocal;
var statusTimeoutRarityPublic;
var statusTimeoutFluttershyLocal;
var statusTimeoutMoonLocal;
var statusTimeoutTantabusLocal;
var statusTimeoutTantabusPublic;

// Seismo
var seismoLatest = {};
var seismoSamplesBuf = [];
var seismoSamples = [];
var seismoFilter;
var seismoReadyFilter = false;
var seismoReadyEarthquake = false;
var seismoSampleCounter = 0;
var seismoQuakeStartTimeTemp;
var seismoQuakeStartTime;
var seismoQuakePrevTime;
var seismoIsShaking = false;
var seismoIsQuake = false;
var seismoLastMinute = -1;
var seismoAccu = [];
var sampleMedian = 0;
var lastQuake;

// Miscellaneous
var bot;
var server;
var discordReqReconnect = false;

var startTime;
var waifuTimeout;
var cameraTimeout;
var reconnectTime = 0;

var rebooting       = false;
var isLive          = false;
var isplushie       = false;
var isShowingLyrics = false;
var isShowingStory  = false;
var isShowingArt    = false;

var hTrack = {};
var corona;
var udpServer;



/**********************
 * COMMAND DEFINITIONS
 **********************/

// Object storing all the commands.
var comm = {};

// Command: !gotn
comm.gotn = function(data) {
    var now = new Date();
    var found = false;

    var timezone = data.message.replace(config.options.commandsymbol + data.command + " ", "");
    if (timezone == config.options.commandsymbol + data.command)
        timezone = "";

    if (moment.tz.zone(timezone) || timezone == "") {
        gotn.dates.forEach(function(d) {
            if (!found) {
                var partsDate = d.split(config.separators.date);
                var partsTime = gotn.time.split(config.separators.time);

                var date = new Date(partsDate[0], parseInt(partsDate[1]) - 1, partsDate[2], partsTime[0], partsTime[1], 0, 0);
                if (date > now) {
                    send(data.channelID, util.format(
                        strings.commands.gotn.message, 
                        mention(data.userID), 
                        getTimeLeft(now, date, timezone)
                    ), true);
                    found = true;
                }
            }
        }); 
    }
    else {
        send(data.channelID, util.format(
            strings.misc.timezone,
            mention(data.userID)
        ), true);
    }
};

// Command: !mlp
comm.mlp = function(data) {
    var now = new Date();
    var found = false;

    var timezone = data.message.replace(config.options.commandsymbol + data.command + " ", "");
    if (timezone == config.options.commandsymbol + data.command)
        timezone = "";

    if (moment.tz.zone(timezone) || timezone == "") {
        mlp.episodes.forEach(function(e) {
            if (!found) {
                var partsDate = e.date.split(config.separators.date);
                var partsTime = e.time.split(config.separators.time);

                var date = new Date(partsDate[0], parseInt(partsDate[1]) - 1, partsDate[2], partsTime[0], partsTime[1], 0, 0);
                if (date > now) {
                    send(data.channelID, util.format(
                        strings.commands.mlp.message, 
                        mention(data.userID),
                        e.name,
                        getTimeLeft(now, date, timezone),
                        mlp.channel
                    ), true);
                    found = true;
                }
            }
        }); 
        if (!found)
            send(data.channelID, util.format(
                strings.commands.mlp.error, 
                mention(data.userID)
            ), true);           
    }
    else {
        send(data.channelID, util.format(
            strings.misc.timezone,
            mention(data.userID)
        ), true);
    }
};

// Command: !time
comm.time = function(data) {
    var now = new Date();
    var found = false;

    var timezone = data.message.replace(config.options.commandsymbol + data.command + " ", "");

    var useEq = (
        timezone == "QST" || 
        timezone == "Equestria" ||
        timezone == "Equestria/Canterlot" ||
        timezone == "Equestria/Ponyville" ||
        timezone == "Equestria/Manehattan" ||
        timezone == "Equestria/Fillydelphia" ||
        timezone == "Equestria/Crystal_Empire" ||
        timezone == "Equestria/Cloudsdale"
        )

    if (timezone == config.options.commandsymbol + data.command || useEq)
        timezone = "";

    if (moment.tz.zone(timezone) || timezone == "") {

        if (useEq) {
            var momentTime = moment.tz(now / 8760 + 93*365*24*60*60*1000 + 11*60*60*1000, timezone);
            send(data.channelID, util.format(
                strings.commands.time.messagetz, 
                mention(data.userID),
                momentTime.format("ddd MMM DD, YYYY"),
                momentTime.format("HH:mm:ss") + " (QST)",
                Math.round(momentTime / 1000)
            ), true);
        }
        else {
            if (timezone == "") {
                send(data.channelID, util.format(
                    strings.commands.time.message, 
                    mention(data.userID),
                    getDiscordTimestamp(now),
                    Math.round(now.getTime() / 1000)
                ), true);
            }
            else {
                var momentTime = moment.tz(now, timezone);
                send(data.channelID, util.format(
                    strings.commands.time.messagetz, 
                    mention(data.userID),
                    momentTime.format("ddd MMM DD, YYYY"),
                    momentTime.format("HH:mm:ss (z)"),
                    Math.round(now / 1000)
                ), true);
            }
        }
    }
    else {
        send(data.channelID, util.format(
            strings.misc.timezone, 
            mention(data.userID)
        ), true);
    }
};

// Command: !np
comm.np = function(data) {
    if (np.nowplaying != undefined)
        send(data.channelID, util.format(
            strings.commands.np.message, 
            mention(data.userID),
            np.nowplaying
        ), true);
    else
        send(data.channelID, util.format(
            strings.commands.np.error, 
            mention(data.userID)
        ), true);
};

// Command: !phase
comm.phase = function(data) {
    var dateNow = new Date();
    var message;
    var phaseNext;

    var timezone = data.message.replace(config.options.commandsymbol + data.command + " ", "");
    if (timezone == config.options.commandsymbol + data.command)
        timezone = "";

    if (moment.tz.zone(timezone) || timezone == "") {

        var found = false;
        phases.forEach(function(p) {
            if (!found) {

                var datePhase = new Date(p.date);

                if (datePhase > dateNow) {

                    config.phases.forEach(function(n, i) {
                        if (n.name == p.phase)
                            phaseNext = config.phases[i].name;
                    });

                    message = util.format(
                        strings.commands.phase.messageA, 
                        mention(data.userID), 
                        getPhaseString(p.phase, -1), 
                        getPhaseString(p.phase, 0),
                        getTimeLeft(dateNow, datePhase, timezone)
                    );

                    found = true;
                }
            }
        });

        if (found) {

            if (phaseNext != config.moon.fullmoon) {
                found = false;
                phases.forEach(function(p) {
                    if (!found) {

                        var datePhase = new Date(p.date);

                        if (datePhase > dateNow && p.phase == config.moon.fullmoon) {

                            message += util.format(
                                " " + strings.commands.phase.messageB,
                                getPhaseString(config.moon.fullmoon, 0),
                                getTimeLeft(dateNow, datePhase, timezone)
                            );
                            
                            found = true;
                        }
                    }
                });
            }
        }

        if (!found) {
            send(data.channelID, util.format(
                strings.commands.phase.error,
                mention(data.userID)
            ), true);
        }
        else {
            send(data.channelID, message, true);
        }

    }
    else {
        send(data.channelID, util.format(
            strings.misc.timezone,
            mention(data.userID)
        ), true);
    }

};

// Command: !moon
comm.moon = function(data) {
    var dateNow = new Date();
    var found = false;

    if (config.moon.lunamoon.enabled) {
        moon.forEach(function(m, i) {
            if (!found) {
                var dateMoonNext = new Date(m.time);

                if (dateMoonNext > dateNow) {
                    var id = i-1;
                    if (id < 0)
                        id = moon.length-1;
                    var p = moon[id];
                    var diff;
                    var age = {};
                    var dist = {};

                    p.moment = moment.tz(new Date(p.time), "UTC");

                    age.days = Math.floor(p.age);
                    diff = (p.age - age.days) * 24;
                    age.hours = Math.floor(diff);
                    diff = (diff - age.hours) * 60;
                    age.minutes = Math.floor(diff);

                    dist.a = Math.floor(p.distance / 1000);
                    dist.b = fillUpZeros(3, Math.floor(p.distance % 1000));
                    
                    embed(data.channelID, util.format(
                        strings.commands.moon.messageB,
                        mention(data.userID),
                        p.phase,
                        age.days,
                        age.hours,
                        age.minutes,
                        dist.a,
                        dist.b,
                        p.diameter,
                        p.moment.format("ddd MMM DD, YYYY"),
                        p.moment.format("HH:mm (z)")
                    ), util.format(
                        config.moon.lunamoon.pathmoon,
                        fillUpZeros(4, id)
                    ), "Moon " + (new Date(p.date)) + ".png", true, false);

                    found = true;
                }
            }
        });
    }
    else {
        phases.forEach(function(p, i) {
            if (!found && i > 0) {
                var datePhasePrev = new Date(phases[i-1].date);
                var datePhaseNext = new Date(p.date);

                if (datePhaseNext > dateNow) {

                    var imagePh = "a";
                    if (phases[i-1].phase == config.phases[6].name)
                        imagePh = "b";
                    else if (phases[i-1].phase == config.phases[0].name)
                        imagePh = "c";
                    else if (phases[i-1].phase == config.phases[2].name)
                        imagePh = "d";

                    var offset = ((dateNow - datePhasePrev) / (datePhaseNext - datePhasePrev)) * 8;
                    var imageId = Math.round(offset);
                    if (imageId == 8) {
                        imageId = 0;
                        switch (imagePh) {
                            case "a": imagePh = "b"; break;
                            case "b": imagePh = "c"; break;
                            case "c": imagePh = "d"; break;
                            case "d": imagePh = "a"; break;
                        }
                    }

                    embed(data.channelID, util.format(
                        strings.commands.moon.messageA,
                        mention(data.userID)
                    ), util.format(
                        config.moon.moonimg,
                        imagePh,
                        imageId
                    ), "Moon " + (new Date()) + ".png", true, false);

                    found = true;
                }
            }
        });
    }

    if (!found) {
        send(data.channelID, util.format(
            strings.commands.moon.error,
            mention(data.userID)
        ), true);
    }
};

// Command: !room
comm.room = function(data) {
    var _key = varipass.main.key;

    var payload = {
            "key": _key,
            "action": "all"
        };

    var xhr = new XMLHttpRequest();
    xhr.open("POST", config.options.varipassurl, true);
    xhr.setRequestHeader("Content-type", "application/json");

    xhr.onreadystatechange = function () { 
        if (xhr.readyState == 4 && xhr.status == 200) {
            var vpData = JSON.parse(xhr.responseText);
            console.log(strings.debug.varipass.done);

            var diffCelly = (vpData.current - findVariable(vpData, varipass.main.ids.temperature).history[0].time);
            var timeCelly = {};

            timeCelly.seconds = Math.floor(diffCelly % 60);
            diffCelly = Math.floor(diffCelly / 60);
            timeCelly.minutes = Math.floor(diffCelly % 60);
            diffCelly = Math.floor(diffCelly / 60);
            timeCelly.hours = Math.floor(diffCelly % 24);
            timeCelly.days = Math.floor(diffCelly / 24);
            
            var diffChryssy = (vpData.current - findVariable(vpData, varipass.main.ids.counts).history[0].time);
            var timeChryssy = {};

            timeChryssy.seconds = Math.floor(diffChryssy % 60);
            diffChryssy = Math.floor(diffChryssy / 60);
            timeChryssy.minutes = Math.floor(diffChryssy % 60);
            diffChryssy = Math.floor(diffChryssy / 60);
            timeChryssy.hours = Math.floor(diffChryssy % 24);
            timeChryssy.days = Math.floor(diffChryssy / 24);
            
            var diffDashie = (vpData.current - findVariable(vpData, varipass.main.ids.pm010).history[0].time);
            var timeDashie = {};

            timeDashie.seconds = Math.floor(diffDashie % 60);
            diffDashie = Math.floor(diffDashie / 60);
            timeDashie.minutes = Math.floor(diffDashie % 60);
            diffDashie = Math.floor(diffDashie / 60);
            timeDashie.hours = Math.floor(diffDashie % 24);
            timeDashie.days = Math.floor(diffDashie / 24);

            send(data.channelID, util.format(
                strings.commands.room.message, 
                mention(data.userID),
                getTimeStringSimple(timeCelly),
                findVariable(vpData, varipass.main.ids.temperature).history[0].value,
                findVariable(vpData, varipass.main.ids.humidity).history[0].value,
                findVariable(vpData, varipass.main.ids.pressure).history[0].value,
                findVariable(vpData, varipass.main.ids.co2).history[0].value,
                findVariable(vpData, varipass.main.ids.voc).history[0].value,
                findVariable(vpData, varipass.main.ids.light).history[0].value,
                findVariable(vpData, varipass.main.ids.magnitude).history[0].value,
                findVariable(vpData, varipass.main.ids.inclination).history[0].value,
                findVariable(vpData, varipass.main.ids.vibrations_x).history[0].value,
                findVariable(vpData, varipass.main.ids.vibrations_y).history[0].value,
                findVariable(vpData, varipass.main.ids.vibrations_z).history[0].value,
                findVariable(vpData, varipass.main.ids.gravity_x).history[0].value,
                findVariable(vpData, varipass.main.ids.gravity_y).history[0].value,
                findVariable(vpData, varipass.main.ids.gravity_z).history[0].value,
                getTimeStringSimple(timeChryssy),
                findVariable(vpData, varipass.main.ids.doseema).history[0].value,
                findVariable(vpData, varipass.main.ids.counts).history[0].value,
                getTimeStringSimple(timeDashie),
                findVariable(vpData, varipass.main.ids.pm010).history[0].value,
                findVariable(vpData, varipass.main.ids.pm025).history[0].value,
                findVariable(vpData, varipass.main.ids.pm100).history[0].value,
                findVariable(vpData, varipass.main.ids.particles003).history[0].value,
                findVariable(vpData, varipass.main.ids.particles005).history[0].value,
                findVariable(vpData, varipass.main.ids.particles010).history[0].value,
                findVariable(vpData, varipass.main.ids.particles025).history[0].value,
                findVariable(vpData, varipass.main.ids.particles050).history[0].value,
                findVariable(vpData, varipass.main.ids.particles100).history[0].value
            ), true);
        }
    }
    xhr.onerror = function(err) {
        console.log(util.format(
            strings.debug.varipass.errorR,
            err.target.status
        ));
        xhr.abort();
    }
    xhr.ontimeout = function() {
        console.log(strings.debug.varipass.timeout);
        xhr.abort();
    }

    console.log(strings.debug.varipass.load);
    xhr.send(JSON.stringify(payload));
};

// Command: !power
comm.power = function(data) {
    var dateNow = new Date() / 1000;
    var diff = dateNow - statusGlobal.sparkle;
    var time = {};

    time.seconds = Math.floor(diff % 60);
    diff = Math.floor(diff / 60);
    time.minutes = Math.floor(diff % 60);
    diff = Math.floor(diff / 60);
    time.hours = Math.floor(diff % 24);
    time.days = Math.floor(diff / 24);

    var message = "";
    if (powerStatus == null)
        send(data.channelID, util.format(
            strings.commands.power.error, 
            mention(data.userID)
        ), true);
    else if (powerStatus == 0)
        send(data.channelID, util.format(
            strings.commands.power.messageA, 
            mention(data.userID),
            getTimeString(time),
            time.seconds
        ), true);
    else if (powerStatus > 0)
        send(data.channelID, util.format(
            strings.commands.power.messageB, 
            mention(data.userID),
            getTimeString(time),
            time.seconds,
            mention(config.options.adminid)
        ), true);   
};

// Command: !eeg
comm.eeg = function(data) {
    if (eegValues == undefined) {
        send(data.channelID, util.format(
            strings.commands.eeg.error, 
            mention(data.userID)
        ), true);
    }
    else {
        var dateNow = new Date() / 1000;
        var diff = dateNow - eegValues.time;
        var time = {};

        time.seconds = Math.floor(diff % 60);
        diff = Math.floor(diff / 60);
        time.minutes = Math.floor(diff % 60);
        diff = Math.floor(diff / 60);
        time.hours = Math.floor(diff % 24);
        time.days = Math.floor(diff / 24);

        var message = util.format(
            strings.commands.eeg.messageA, 
            mention(data.userID),
            getTimeString(time),
            time.seconds
        );

        message += util.format(
            strings.commands.eeg.messageB, 
            eegValues.battery,
            eegValues.signal,
            eegValuesEMA.attention.toFixed(2),
            eegValuesEMA.meditation.toFixed(2),
            eegValuesEMA.waves[0].toFixed(2),
            eegValuesEMA.waves[1].toFixed(2),
            eegValuesEMA.waves[2].toFixed(2),
            eegValuesEMA.waves[3].toFixed(2),
            eegValuesEMA.waves[4].toFixed(2),
            eegValuesEMA.waves[5].toFixed(2),
            eegValuesEMA.waves[6].toFixed(2),
            eegValuesEMA.waves[7].toFixed(2)
        );

        send(data.channelID, message, true);
    }
};

// Command: !printer
comm.printer = function(data) {

    send(data.channelID, util.format(
        strings.commands.printer.messageA, 
        mention(data.userID)
    ), true);

    download(printer.baseurl + printer.webcam, config.printer.webimg, function(code) {

        var xhr = new XMLHttpRequest();
        xhr.open("GET", printer.baseurl + config.printer.urls.job + printer.key, true);

        xhr.onreadystatechange = function () { 
            if (xhr.readyState == 4 && xhr.status == 200) {
                var response = JSON.parse(xhr.responseText);

                var message = "";

                // Nightmare Rarity
                if (response.progress.completion != null && response.state == "Printing") {

                    var left = response.progress.printTimeLeft;
                    var time = {};

                    time.seconds = Math.floor(left % 60);
                    left = Math.floor(left / 60);
                    time.minutes = Math.floor(left % 60);
                    left = Math.floor(left / 60);
                    time.hours = Math.floor(left % 24);
                    time.days = Math.floor(left / 24);

                    message += util.format(
                        strings.commands.printer.messageD, 
                        response.job.file.name,
                        response.progress.completion.toFixed(1),
                        getTimeString(time)
                    );
                }
                else if (response.state == "Paused") {
                    message += util.format(
                        strings.commands.printer.messageC, 
                        response.job.file.name
                    );
                }
                else {
                    message += strings.commands.printer.messageB;
                }

                // RariTUSH
                if (tushEncL != undefined && tushEncR != undefined && tushWeight != undefined && tushRaw != undefined) {
                    var age = Math.floor((new Date()) / 1000) - statusGlobal.raritush;
                    var time = {};

                    time.seconds = Math.floor(age % 60);
                    age = Math.floor(age / 60);
                    time.minutes = Math.floor(age % 60);
                    age = Math.floor(age / 60);
                    time.hours = Math.floor(age % 24);
                    time.days = Math.floor(age / 24);

                    message += util.format(
                        strings.commands.printer.messageF, 
                        tushWeight.toFixed(1),
                        tushEncL,
                        tushEncR,
                        getTimeString(time),
                        time.seconds
                    );
                }
                else {
                    message += strings.commands.printer.messageE;
                }

                message += strings.commands.printer.messageG;

                if (code != 503)
                    embed(data.channelID, message, config.printer.webimg, "Nightmare Rarity Webcam.jpg", true, true);
                else
                    send(data.channelID, message, true);
            }
        }

        xhr.onerror = function(err) {
            send(data.channelID, strings.commands.printer.error, true);
            xhr.abort();
        }
        xhr.ontimeout = function() {
            send(data.channelID, strings.commands.printer.error, true);
            xhr.abort();
        }

        xhr.send();

    }, function() {

        send(data.channelID, strings.commands.printer.error, true);
        
    }, 0);
};

// Command: !devices
comm.devices = function(data) {
    var name = data.message.replace(config.options.commandsymbol + data.command + " ", "");
    if (name == "" || name == config.options.commandsymbol + data.command) {
        var message = util.format(
            strings.commands.devices.messageA,
            mention(data.userID)
        );
        devices.list.forEach(function(d) {
            message += util.format(
                strings.commands.devices.messageB,
                d.name,
                d.description
            );
        });
        send(data.channelID, message, true);
    }
    else {      
        var found = false;

        devices.list.forEach(function(d) {       
            if (d.name == name) {
                found = true;
                embed(data.channelID, util.format(
                    d.details,
                    mention(data.userID)
                ), devices.folder + d.picture, d.name + ".jpg", true, false);
            }
        });

        if (!found)
            send(data.channelID, util.format(
                strings.commands.devices.error,
                mention(data.userID)
            ), true);
    }
};

// Command: !assault
comm.assault = function(data) {
    var region = data.message.replace(config.options.commandsymbol + data.command + " ", "");
    if (region == "" || region == config.options.commandsymbol + data.command)
        region = "EU";

    if (region == "NA" || region == "EU" || region == "OC") {

        var dueTime = getAssault(region);
        var dateNow = new Date();

        var ending = dueTime - config.wow.assault.interval*1000 + config.wow.assault.duration*1000;

        if (ending > dateNow) {
            send(data.channelID, util.format(
                strings.commands.assault.messageA, 
                mention(data.userID),
                region,
                getTimeLeft(dateNow, new Date(ending), ""),
                getTimeLeft(dateNow, new Date(dueTime), "")
            ), true);
        }
        else {
            send(data.channelID, util.format(
                strings.commands.assault.messageB, 
                mention(data.userID),
                region,
                getTimeLeft(dateNow, new Date(dueTime), "")
            ), true);
        }
    }
    else {
        send(data.channelID, strings.commands.assault.error, true);
    }
};

// Command: !blacklist
comm.blacklist = function(data) {
    if (blacklist[data.userID] == undefined) {
        blacklist[data.userID] = true;
        send(data.channelID, util.format(
            strings.commands.blacklist.messageA, 
            mention(data.userID)
        ), true);

        console.log(util.format(
            strings.debug.blacklist.add,
            data.userID
        ));
    }
    else {
        delete blacklist[data.userID];
        send(data.channelID, util.format(
            strings.commands.blacklist.messageB, 
            mention(data.userID)
        ), true);

        console.log(util.format(
            strings.debug.blacklist.remove,
            data.userID
        ));
    }

    fs.writeFileSync(config.options.blacklistpath, JSON.stringify(blacklist), "utf-8");
};

// Command: !coin
comm.coin = function(data) {
    send(data.channelID, strings.commands.coin.message, true);

    setTimeout(function() {
        if (Math.random() < 0.5)
            send(data.channelID, strings.commands.coin.tails, true);
        else
            send(data.channelID, strings.commands.coin.heads, true);
    }, 2000);   
};

// Command: !minesweeper
comm.minesweeper = function(data) {
    var difficulty = data.message.replace(config.options.commandsymbol + data.command + " ", "");
    if (difficulty == "" || difficulty == config.options.commandsymbol + data.command || config.minesweeper.difficulties[difficulty] == undefined) {
        send(data.channelID, util.format(
            strings.commands.minesweeper.error, 
            mention(data.userID)
        ), true);
    }
    else {
        // Prepare values.
        var i, j, k, m, n, count;
        var x = config.minesweeper.difficulties[difficulty].x;
        var y = config.minesweeper.difficulties[difficulty].y;
        var field = new Array(y);

        // Prepare a new empty field.
        for (i = 0; i < y; i++) {
            field[i] = new Array(x);
        }

        // Randomly place mines.
        for (k = 0; k < config.minesweeper.difficulties[difficulty].m; k++) {
            do {
                i = Math.floor(Math.random() * y);
                j = Math.floor(Math.random() * x);
            }
            while (field[i][j] == strings.commands.minesweeper.icomine);
            field[i][j] = strings.commands.minesweeper.icomine;
        }

        // Calculate numbers.
        for (i = 0; i < y; i++)
            for (j = 0; j < x; j++)
                if (field[i][j] != strings.commands.minesweeper.icomine) {
                    count = 0;
                    for (m = -1; m <= 1; m++)
                        for (n = -1; n <= 1; n++)
                            if (i + m >= 0 && j + n >= 0 && i + m < y && j + n < x)
                                if (field[i + m][j + n] == strings.commands.minesweeper.icomine)
                                    count++;
                    field[i][j] = strings.commands.minesweeper["ico" + count];
                }

        // Spoiler relevant tiles.
        for (i = 0; i < y; i++)
            for (j = 0; j < x; j++) {
                    count = 0;
                    for (m = -1; m <= 1; m++)
                        for (n = -1; n <= 1; n++)
                            if (i + m >= 0 && j + n >= 0 && i + m < y && j + n < x)
                                if (field[i + m][j + n] == strings.commands.minesweeper.ico0)
                                    count++;
                    if (count == 0)
                        field[i][j] = strings.commands.minesweeper.spoiler + field[i][j] + strings.commands.minesweeper.spoiler;
            }

        // Construct messages.
        var messages = [];
        var message = "";
        var messageNew = "";
        for (i = 0; i < y; i++) {

            for (j = 0; j < x; j++)
                messageNew += field[i][j];
            messageNew += "\n";

            if (message.length + messageNew.length > config.options.maxlength) {
                messages.push(message);
                message = "" + messageNew;
                messageNew = "";
            }
            else {
                message += messageNew;
                messageNew = "";
            }

        }
        messages.push(message);

        // Dump messages.
        send(data.channelID, util.format(
            strings.commands.minesweeper.message, 
            mention(data.userID),
            x,
            y,
            config.minesweeper.difficulties[difficulty].m
        ), true);
        messages.forEach(function(m, i) {
            setTimeout(function() {
                send(data.channelID, m, true);
            }, config.minesweeper.delay * (i+1));
        });
    }
};

// Command: !waifu
comm.waifu = function(data) {
    var isPublicChannel = false
    channels.list.forEach(function(c) {
        if (data.channelID == c.id)
            isPublicChannel = true;
    });

    if (isPublicChannel) {

        if (annStatus.enabled) {
            var parameters = data.message.replace(config.options.commandsymbol + data.command + " ", "");
            if ((parameters == "" || parameters == config.options.commandsymbol + data.command) && data.data.d.attachments[0] == undefined) {
                send(data.channelID, util.format(
                    strings.commands.waifu.errorA, 
                    mention(data.userID)
                ), true);
            }
            else {
                if (data.data.d.attachments[0] != undefined) {
                    var image = data.data.d.attachments[0].url;

                    var parameterParts = parameters.split(" ");
                    var n = 0;
                    var s = 1;
                    var hasParameters = false;
                    parameterParts.forEach(function(p) {
                        if (p[0] == "n" || p[0] == "N") {
                            hasParameters = true;
                            n = p[1];
                        }
                        else if (p[0] == "s" || p[0] == "S") {
                            hasParameters = true;
                            s = p[1];
                        }
                    });

                    if (hasParameters) {
                        if (n == 0 || n == 1 || n == 2 || n == 3) {
                            if (s == 1 || s == 2 || s == 4 || s == 8) {
                                if (!(n == 0 && s == 1)) {
                                    send(data.channelID, util.format(
                                        strings.commands.waifu.message,
                                        mention(data.userID),
                                        n,
                                        s
                                    ), true);

                                    var url = util.format(
                                        config.ann.waifu.request,
                                        httpkey.key,
                                        image,
                                        data.channelID,
                                        data.userID,
                                        n,
                                        s
                                    );

                                    var xhr = new XMLHttpRequest();
                                    xhr.open("GET", url, true);

                                    xhr.onreadystatechange = function () { 
                                        if (xhr.readyState == 4) {
                                            if (xhr.status != 200)
                                                setTimeout(function() {
                                                    send(data.channelID, util.format(
                                                        strings.commands.waifu.errorG,
                                                        mention(data.userID)
                                                    ), true);
                                                    send(channelNameToID(config.options.channels.debug), util.format(
                                                        strings.commands.waifu.errorI,
                                                        mention(config.options.adminid)
                                                    ), true);
                                                }, 2000);
                                            
                                            clearTimeout(waifuTimeout);
                                        }
                                    }
                                    xhr.onerror = function(err) {
                                        xhr.abort();

                                        send(data.channelID, util.format(
                                            strings.commands.waifu.errorG,
                                            mention(data.userID)
                                        ), true);
                                        send(channelNameToID(config.options.channels.debug), util.format(
                                            strings.commands.waifu.errorI,
                                            mention(config.options.adminid)
                                        ), true);
                                    }
                                    xhr.ontimeout = function() {
                                        xhr.abort();

                                        send(data.channelID, util.format(
                                            strings.commands.waifu.errorH,
                                            mention(data.userID)
                                        ), true);
                                        send(channelNameToID(config.options.channels.debug), util.format(
                                            strings.commands.waifu.errorJ,
                                            mention(config.options.adminid)
                                        ), true);
                                    }

                                    xhr.send();

                                    waifuTimeout = setTimeout(function() {
                                        xhr.abort();

                                        send(data.channelID, util.format(
                                            strings.commands.waifu.errorH,
                                            mention(data.userID)
                                        ), true);
                                        send(channelNameToID(config.options.channels.debug), util.format(
                                            strings.commands.waifu.errorJ,
                                            mention(config.options.adminid)
                                        ), true);
                                    }, config.ann.waifu.timeout * 1000);
                                }
                                else {
                                    send(data.channelID, util.format(
                                        strings.commands.waifu.errorK,
                                        mention(data.userID)
                                    ), true);
                                }
                            }
                            else {
                                send(data.channelID, util.format(
                                    strings.commands.waifu.errorE,
                                    mention(data.userID),
                                    s
                                ), true);
                            }
                        }
                        else {
                            send(data.channelID, util.format(
                                strings.commands.waifu.errorD,
                                mention(data.userID),
                                n
                            ), true);
                        }
                    }
                    else {
                        send(data.channelID, util.format(
                            strings.commands.waifu.errorC, 
                            mention(data.userID)
                        ), true);
                    }
                }
                else {
                    send(data.channelID, util.format(
                        strings.commands.waifu.errorB, 
                        mention(data.userID)
                    ), true);
                }
            }
        }
        else {
            send(data.channelID, util.format(
                strings.commands.waifu.paused, 
                mention(data.userID),
                annStatus.message
            ), true);
        }
    }
    else {
        send(data.channelID, util.format(
            strings.commands.waifu.errorF, 
            mention(data.userID)
        ), true);
    }
};

// Command: !spools
comm.spools = function(data) {
    if (Object.keys(spool).length > 0) {
        var spools = [];

        Object.keys(spool).sort().forEach(function(s) {
            spools.push(util.format(
                strings.commands.spools.messageB,
                s,
                spool[s]
            ));
        });

        sendLarge(data.channelID, spools, util.format(
            strings.commands.spools.messageA,
            mention(data.userID)
        ), false);
    }
    else {
        send(data.channelID, util.format(
            strings.commands.spools.error, 
            mention(data.userID)
        ), true);
    }
};

// Command: !seismo
comm.seismo = function(data) {
    var dateNow = new Date();
    var heliString = ""
    heliString += dateNow.getFullYear();
    var month = dateNow.getMonth() + 1;
    if (month < 10)
        heliString += "0" + month;
    else
        heliString += month;
    var day = dateNow.getDate();
    if (day < 10)
        heliString += "0" + day;
    else
        heliString += day;
    var hours = dateNow.getUTCHours();
    if (hours < 12)
        heliString += "00";
    else
        heliString += "12";

    if (lastQuake != undefined)
        send(data.channelID, util.format(
            strings.commands.seismo.messageA, 
            mention(data.userID),
            lastQuake.format("YYYY-MM-DD"),
            lastQuake.format("HH:mm:ss (z)"),
            Math.sqrt(sampleMedian).toFixed(2),
            sampleMedian.toFixed(2)
        ), true);
    else
        send(data.channelID, util.format(
            strings.commands.seismo.messageB, 
            mention(data.userID),
            Math.sqrt(sampleMedian).toFixed(2),
            sampleMedian.toFixed(2)
        ), true);

    download(util.format(
        config.seismo.baseurl,
        heliString)
    , config.seismo.heliimage, function(code) {
        if (code != 404)
            embed(data.channelID, strings.commands.seismo.messageC, config.seismo.heliimage, "Maud (" + config.seismo.station + ") Helicorder " + (new Date()) + ".gif", true, true);
        else
            send(data.channelID, strings.commands.seismo.error, true);
    }, function() {
        send(data.channelID, strings.commands.seismo.error, true);
    }, 0);
};

// Command: !pop
comm.pop = function(data) {
    var message = util.format(
        strings.commands.pop.message,
        mention(data.userID)
    );

    for (var i = 0; i < config.options.popcount; i++) {
        message += strings.commands.pop.pop;
    }

    send(data.channelID, message, true);
};

// Command: !owo
// The OwO functionality was mostly taken from LonelessCodes' TrixieBot (https://github.com/LonelessCodes/trixiebot).
// They have done an amazing job at fine tuning the text transformation so that it is as painful as cringy as possible.
// All credits for the string transformation goes to them.
comm.owo = function(data) {
    var text = data.message.replace(config.options.commandsymbol + data.command + " ", "");
    if (text == "" || text == config.options.commandsymbol + data.command) {
        send(data.channelID, util.format(
            strings.commands.owo.error,
            mention(data.userID)
        ), true);
    }
    else {
        send(data.channelID, util.format(
            strings.commands.owo.message,
            mention(data.userID),
            owoFaces(owoStutter(owoCasing(owoTransform(text))))
        ), true);
    }
};

// Command: !custom
comm.custom = function(data) {
    var interractionCommands = ""
    custom.list.forEach(function(c) {
        if (interractionCommands != "")
            interractionCommands += ", ";
        interractionCommands += util.format(
            strings.commands.custom.messageC, 
            config.options.commandsymbol,
            c.command
        );
    });

    var nocommand = true;
    // Custom interractions
    custom.list.forEach(function(c, i) {
        // Server filtering
        if (bot.channels[data.channelID] != undefined) {
            c.servers.forEach(function(s) {
                if (bot.channels[data.channelID].guild_id == s && nocommand) {
                    send(data.channelID, util.format(                           
                        strings.commands.custom.messageA,
                        mention(data.userID),
                        interractionCommands
                    ), true);
                    nocommand = false;
                }
            });
        }
        // Channel filtering
        c.channels.forEach(function(s) {
            if (channelIDToName(data.channelID) == s && nocommand) {
                send(data.channelID, util.format(
                    strings.commands.custom.messageB,
                    mention(data.userID),
                    interractionCommands
                ), true);
                nocommand = false;
            }
        });
    });
    // Channel was not found
    if (nocommand) {
        send(data.channelID, util.format(
            strings.commands.custom.error,
            mention(data.userID),
        ), true);
    }
};

// Command: !thori
comm.thori = function(data) {
    var found = false;
    if (data.userID == config.options.adminid)
        found = true;
    thori.whitelist.forEach(function(u) {
        if (data.userID == u.id)
            found = true;
    });

    if (found) {
        var _key = varipass.main.key;
        var _id = varipass.main.ids.location;

        var payload = {
                "key": _key,
                "action": "read",
                "id": _id
            };

        var xhr = new XMLHttpRequest();
        xhr.open("POST", config.options.varipassurl, true);
        xhr.setRequestHeader("Content-type", "application/json");

        xhr.onreadystatechange = function () { 
            if (xhr.readyState == 4 && xhr.status == 200) {
                var vpData = JSON.parse(xhr.responseText);
                console.log(strings.debug.varipass.done);

                var values = vpData.value.split("\\n");
                var lat = 0.0;
                var lng = 0.0;
                var alt = 0.0;
                values.forEach(function(v) {
                    var parts = v.split(":");
                    if (parts[0] == "lat")
                        lat = parseFloat(parts[1]);
                    else if (parts[0] == "lng")
                        lng = parseFloat(parts[1]);
                    else if (parts[0] == "alt")
                        alt = parseFloat(parts[1]);
                });

                var diff = vpData.current - vpData.time;
                var time = {};

                time.seconds = Math.floor(diff % 60);
                diff = Math.floor(diff / 60);
                time.minutes = Math.floor(diff % 60);
                diff = Math.floor(diff / 60);
                time.hours = Math.floor(diff % 24);
                time.days = Math.floor(diff / 24);

                var url = util.format(
                    config.options.mapsurl,
                    lat,
                    lng
                );


                bot.createDMChannel(data.userID, function(){});
            
                getLocationInfo(function(locInfo) {
                    send(data.userID, util.format(
                        strings.commands.thori.messageB,
                        locInfo.town,
                        locInfo.country,
                        alt.toFixed(1),
                        getTimeString(time),
                        time.seconds,
                        url
                    ), false);

                    if (bot.channels[data.channelID] != undefined)  
                        send(data.channelID, util.format(
                            strings.commands.thori.messageA, 
                            mention(data.userID)
                        ), true);
                }, lat, lng);
            }
        }
        xhr.onerror = function(err) {
            console.log(util.format(
                strings.debug.varipass.errorR,
                err.target.status
            ));
            xhr.abort();
        }
        xhr.ontimeout = function() {
            console.log(strings.debug.varipass.timeout);
            xhr.abort();
        }

        console.log(strings.debug.varipass.load);
        xhr.send(JSON.stringify(payload));
    }
    else {
        send(data.channelID, util.format(
            strings.commands.thori.error, 
            mention(data.userID)
        ), true);
    }
};

// Command: !temp
comm.temp = function(data) {
    exec("sudo /home/luna/temp.sh", (error, stdout, stderr) => {
        if (error) {
            console.log(error);
            send(data.channelID, util.format(
                strings.commands.temp.errorA,
                mention(data.userID)
            ), true);
            return;
        }

        var lines = stdout.split("\n");
        var cpu = parseFloat(lines[0].split("=")[1].split("'")[0]);
        var gpu = parseFloat(lines[1].split("=")[1].split("'")[0]);
        var raspi = ((cpu + gpu) / 2).toFixed(2);


        var payload = {
                "key": varipass.main.key,
                "id":  varipass.main.ids.body,
                "action": "read"
            };

        var xhr = new XMLHttpRequest();
        xhr.open("POST", config.options.varipassurl, true);
        xhr.setRequestHeader("Content-type", "application/json");

        xhr.onreadystatechange = function () { 
            if (xhr.readyState == 4 && xhr.status == 200) {
                var vpData = JSON.parse(xhr.responseText);
                console.log(strings.debug.varipass.done);

                var diff = vpData.current - vpData.time;
                var time = {};

                time.seconds = Math.floor(diff % 60);
                diff = Math.floor(diff / 60);
                time.minutes = Math.floor(diff % 60);
                diff = Math.floor(diff / 60);
                time.hours = Math.floor(diff % 24);
                time.days = Math.floor(diff / 24);


                send(data.channelID, util.format(
                    strings.commands.temp.message,
                    mention(data.userID),
                    raspi,
                    cpu,
                    gpu,
                    vpData.value.toFixed(2),
                    getTimeString(time),
                    time.seconds
                ), true);

            }
        }
        xhr.onerror = function(err) {
            console.log(util.format(
                strings.debug.varipass.errorR,
                err.target.status
            ));
            xhr.abort();
            send(data.channelID, util.format(
                strings.commands.temp.errorB,
                mention(data.userID)
            ), true);
        }
        xhr.ontimeout = function() {
            console.log(strings.debug.varipass.timeout);
            xhr.abort();
            send(data.channelID, util.format(
                strings.commands.temp.errorB,
                mention(data.userID)
            ), true);
        }

        xhr.send(JSON.stringify(payload));
    });
};

// Command: !stats
comm.stats = function(data) {
    var dateNow = new Date();

    var timezone = data.message.replace(config.options.commandsymbol + data.command + " ", "");
    if (timezone == "" || timezone == config.options.commandsymbol + data.command)
        timezone = "";

    if (moment.tz.zone(timezone) || timezone == "") {

        var diff = (dateNow - startTime) / 1000;
        var time = {};

        time.seconds = Math.floor(diff % 60);
        diff = Math.floor(diff / 60);
        time.minutes = Math.floor(diff % 60);
        diff = Math.floor(diff / 60);
        time.hours = Math.floor(diff % 24);
        time.days = Math.floor(diff / 24);

        var momentTime = moment.tz(startTime, timezone);

        var canLearn;
        if (processWhitelist(data.channelID))
            canLearn = strings.commands.stats.learnyes;
        else
            canLearn = strings.commands.stats.learnno;

        if (timezone == "")
            send(data.channelID, util.format(
                strings.commands.stats.message,
                mention(data.userID),
                package.version,
                getDiscordTimestamp(startTime),
                getTimeString(time),
                time.seconds,
                channelIDToName(data.channelID),
                channelIDToBrain(data.channelID),
                messages[channelIDToBrain(data.channelID)].length,
                canLearn
            ), true);
        else
            send(data.channelID, util.format(
                strings.commands.stats.messagetz,
                mention(data.userID),
                package.version,
                momentTime.format("ddd MMM DD, YYYY"),
                momentTime.format("HH:mm (z)"),
                getTimeString(time),
                time.seconds,
                channelIDToName(data.channelID),
                channelIDToBrain(data.channelID),
                messages[channelIDToBrain(data.channelID)].length,
                canLearn
            ), true);
    }
    else {
        send(data.channelID, util.format(
            strings.misc.timezone, 
            mention(data.userID)
        ), true);
    }
};

// Command: !status
comm.status = function(data) {
    send(data.channelID, util.format(
        strings.commands.status.message, 
        mention(data.userID),
        config.status.home
    ), true);
};

// Command: !about
comm.about = function(data) {
    send(data.channelID, util.format(
        strings.commands.about.message, 
        mention(data.userID),
        package.homepage,
        config.options.chrysalisgit
    ), true);
};

// Command: !help
comm.help = function(data) {
    var reply = strings.commands.help.messageA;

    commands.list.forEach(function(c, i) {
        if (i < 8)
            if (c.type == "public")
                reply += util.format(
                    strings.commands.help.messageB, 
                    config.options.commandsymbol,
                    c.command,
                    c.help
                );
    });

    bot.createDMChannel(data.userID, function(){});

    send(data.userID, reply, true);

    setTimeout(function() {
        var reply = "";

        commands.list.forEach(function(c, i) {
            if (i >= 8 && i < 16)
                if (c.type == "public")
                    reply += util.format(
                        strings.commands.help.messageB, 
                        config.options.commandsymbol,
                        c.command,
                        c.help
                    );
        });

        send(data.userID, reply, true);
    }, 1000);

    setTimeout(function() {
        var reply = "";

        commands.list.forEach(function(c, i) {
            if (i >= 16)
                if (c.type == "public")
                    reply += util.format(
                        strings.commands.help.messageB, 
                        config.options.commandsymbol,
                        c.command,
                        c.help
                    );
        });

        send(data.userID, reply, true);
    }, 2000);


    setTimeout(function() {
        var reply = strings.commands.help.messageC;

        commands.list.forEach(function(c) {
            if (c.type == "dj")
                reply += util.format(
                    strings.commands.help.messageB, 
                    config.options.commandsymbol,
                    c.command,
                    c.help
                );
        });

        var interractionCommands = ""
        commands.list.forEach(function(c) {
            if (c.type == "interraction") {
                if (interractionCommands != "")
                    interractionCommands += ", ";
                interractionCommands += util.format(
                    strings.commands.help.messageD, 
                    config.options.commandsymbol,
                    c.command
                );
            }
        });

        reply += util.format(
            strings.commands.help.messageE,
            interractionCommands
        );

        reply += strings.commands.help.messageF;

        send(data.userID, reply, true);
    }, 3000);

    if (bot.channels[data.channelID] != undefined)  
        send(data.channelID, util.format(
            strings.commands.help.message, 
            mention(data.userID)
        ), true);
};



// Interraction commands are called dynamically by type.



// Command: !lyrics
comm.lyrics = function(data) {
    var param = data.message.replace(config.options.commandsymbol + data.command + " ", "");

    if (param == "" || param == config.options.commandsymbol + data.command) {
        if (lyrics[np.nowplaying] != undefined) {

            sendLarge(data.channelID, lyrics[np.nowplaying].split("\n"), util.format(
                strings.commands.lyrics.radio,
                mention(data.userID)
            ), true);

        }
        else {

            send(data.channelID, util.format(
                strings.commands.lyrics.errorB,
                mention(data.userID)
            ), true);

        }
    }
    else if (param == "list") {
        if (bot.channels[data.channelID] != undefined)  
            send(data.channelID, util.format(
                strings.commands.lyrics.listA, 
                mention(data.userID)
            ), true);

        bot.createDMChannel(data.userID, function(){});
        sendLarge(data.userID, Object.keys(lyrics).sort(), util.format(
            strings.commands.lyrics.listB
        ), false);
    }
    else if (lyrics[param] != undefined) {

        sendLarge(data.channelID, lyrics[param].split("\n"), util.format(
            strings.commands.lyrics.message,
            mention(data.userID)
        ), true);

    }
    else {
        send(data.channelID, util.format(
            strings.commands.lyrics.errorA,
            mention(data.userID)
        ), true);
    }
};

// Command: !art
comm.art = function(data) {
    var param = data.message.replace(config.options.commandsymbol + data.command + " ", "");

    if (param == "" || param == config.options.commandsymbol + data.command) {
        if (art[np.nowplaying] != undefined) {

            send(data.channelID, util.format(
                strings.commands.art.load,
                mention(data.userID)
            ), true);

            var parts = art[np.nowplaying].split(".");
            var artimg = util.format(
                config.options.artimg,
                data.channelID,
                parts[parts.length-1]
            );
            download(art[np.nowplaying], artimg, function() {
                console.log(strings.debug.download.stop);
                embed(data.channelID, strings.commands.art.radio, artimg, np.nowplaying + "." + parts[parts.length-1], true, true);
            }, function() {
                send(data.channelID, strings.commands.art.errorC, true);
            }, 0);

        }
        else {

            send(data.channelID, util.format(
                strings.commands.art.errorB,
                mention(data.userID)
            ), true);

        }
    }
    else if (param == "list") {
        if (bot.channels[data.channelID] != undefined)  
            send(data.channelID, util.format(
                strings.commands.art.listA, 
                mention(data.userID)
            ), true);

        bot.createDMChannel(data.userID, function(){});
        sendLarge(data.userID, Object.keys(art).sort(), util.format(
            strings.commands.art.listB
        ), false);
    }
    else if (art[param] != undefined) {

        send(data.channelID, util.format(
            strings.commands.art.load,
            mention(data.userID)
        ), true);

        var parts = art[param].split(".");
        var artimg = util.format(
            config.options.artimg,
            data.channelID,
            parts[parts.length-1]
        );
        download(art[param], artimg, function() {
            console.log(strings.debug.download.stop);
            embed(data.channelID, strings.commands.art.message, artimg, param + "." + parts[parts.length-1], true, true);
        }, function() {
            send(data.channelID, strings.commands.art.errorC, true);
        }, 0);

    }
    else {
        send(data.channelID, util.format(
            strings.commands.art.errorA,
            mention(data.userID)
        ), true);
    }
};

// Command: !story
comm.story = function(data) {
    var param = data.message.replace(config.options.commandsymbol + data.command + " ", "");

    if (param == "" || param == config.options.commandsymbol + data.command) {
        if (story[np.nowplaying] != undefined) {

            send(data.channelID, util.format(
                strings.commands.story.radio,
                mention(data.userID),
                story[np.nowplaying]
            ), true);

        }
        else {

            send(data.channelID, util.format(
                strings.commands.story.errorB,
                mention(data.userID)
            ), true);

        }
    }
    else if (param == "list") {
        if (bot.channels[data.channelID] != undefined)  
            send(data.channelID, util.format(
                strings.commands.story.listA, 
                mention(data.userID)
            ), true);

        bot.createDMChannel(data.userID, function(){});
        sendLarge(data.userID, Object.keys(story).sort(), util.format(
            strings.commands.story.listB
        ), false);
    }
    else if (story[param] != undefined) {

        send(data.channelID, util.format(
            strings.commands.story.message,
            mention(data.userID),
            story[param]
        ), true);

    }
    else {
        send(data.channelID, util.format(
            strings.commands.story.errorA,
            mention(data.userID)
        ), true);
    }
};

// Command: !npt
comm.npt = function(data) {
    if (nptoggles[data.channelID] == undefined) {
        nptoggles[data.channelID] = true;
        send(data.channelID, util.format(
            strings.commands.npt.messageA, 
            mention(data.userID)
        ), true);

        console.log(util.format(
            strings.debug.nptoggles.add,
            channelIDToName(data.channelID),
            data.channelID
        ));

        setTimeout(function() {
            if (np.nowplaying != undefined) {

                // Post track name
                send(data.channelID, util.format(
                    strings.announcements.nowplaying,
                    np.nowplaying
                ), true);

            }
            else
                send(data.channelID, strings.announcements.nperror, true);
        }, 1000);       
    }
    else {
        delete nptoggles[data.channelID];
        send(data.channelID, util.format(
            strings.commands.npt.messageB, 
            mention(data.userID)
        ), true);

        console.log(util.format(
            strings.debug.nptoggles.remove,
            channelIDToName(data.channelID),
            data.channelID
        ));
    }

    fs.writeFileSync(config.options.nptogglespath, JSON.stringify(nptoggles), "utf-8");
};

// Command: !npo
comm.npo = function(data) {
    var track = data.message.replace(config.options.commandsymbol + data.command + " ", "");
    if (track == "" || track == config.options.commandsymbol + data.command) {
        send(data.channelID, util.format(
            strings.commands.npo.error,
            mention(data.userID)
        ),  false);
    }
    else {
        send(data.channelID, util.format(
            strings.commands.npo.message, 
            mention(data.userID),
            track
        ), false);

        np.nowplaying = track;

        processNowPlayingChange();
    }
};




// Command: !stop
comm.stop = function(data) {
    if (isLive) {
        isLive = false;
        var livedata = {}
        livedata.isLive = isLive;
        fs.writeFileSync(config.options.livepath, JSON.stringify(livedata), "utf-8");

        send(data.channelID, strings.commands.stop.message, false);

        send(channelNameToID(config.options.channels.announceA), strings.announcements.gotn.afterA, true);
        send(channelNameToID(config.options.channels.announceB), strings.announcements.gotn.afterB, true);
        setMood("norm", function(result) {
            if (!result)
                send(channelNameToID(config.options.channels.debug), strings.misc.tradfrierror, false);    
        });

        config.options.channels.nowplaying.forEach(function(n, i) {
            if (nptoggles[channelNameToID(n)] != undefined)
                delete nptoggles[channelNameToID(n)];
        });
        fs.writeFileSync(config.options.nptogglespath, JSON.stringify(nptoggles), "utf-8");
    }
    else {
        send(data.channelID, strings.commands.stop.error, false);
    }
};

// Command: !send
comm.send = function(data) {    
    var lines = data.message.split("\n");

    var channel = lines[0].replace(config.options.commandsymbol + data.command + " ", "");
    if (channel == "" || channel == config.options.commandsymbol + data.command) {
        send(channelNameToID(config.options.channels.debug), strings.commands.send.errorA, false);
    }
    else {
        var text = "";
        lines.forEach(function(l, i) {
            if (i != 0) {
                text += l + "\n";
            }
        });

        if (text != "") {
            send(channelNameToID(config.options.channels.debug), strings.commands.send.message, false);
            send(channelNameToID(channel), text, true);
        }
        else {
            send(channelNameToID(config.options.channels.debug), strings.commands.send.errorB, false);
        }
    }
};

// Command: !learn
comm.learn = function(data) {
    var lines = data.message.split("\n");


    var brain = lines[0].replace(config.options.commandsymbol + data.command + " ", "");
    if (brain == "" || brain == config.options.commandsymbol + data.command) {
        send(data.channelID, strings.commands.learn.errorA, false);
    }
    else {
        if (brains[brain] != null) {
            var text = "";
            lines.forEach(function(l, i) {
                if (i != 0) {
                    text += l + "\n"; 
                }
            });

            if (text != "") {
                var cleanText = cleanMessage(text);
                brains[brain].addMass(cleanText);
                messages[brain].push(cleanText);
                send(data.channelID, strings.commands.learn.message, false);
            }
            else {
                send(data.channelID, strings.commands.learn.errorC, false);
            }
        }
        else {
            send(data.channelID, strings.commands.learn.errorB, false);
        }
    }
};

// Command: !l
comm.l = function(data) {
    if (lyrics[np.nowplaying] != undefined) {
        isShowingLyrics = true;
        send(data.channelID, strings.commands.l.messageA, false);
        Object.keys(nptoggles).forEach(function(n, i) {
            if (nptoggles[n])
                sendLarge(n, lyrics[np.nowplaying].split("\n"), strings.commands.l.messageB, true);
        });
    }
    else {
        send(data.channelID, strings.commands.l.error, false);
    }
};

// Command: !purge
comm.purge = function(data) {
    if (purgeReady) {
        if (data.message == config.options.commandsymbol + data.command + " yes") {

            var found = false;
            var indexStart = -1;
            messages[purgeBrain].forEach(function(l, i) {
                if (l == purgeStart) {
                    found = true;
                    indexStart = i;
                }
            });

            if (found) {

                found = false;
                var indexEnd = -1;
                messages[purgeBrain].forEach(function(l, i) {
                    if (l == purgeEnd) {
                        found = true;
                        indexEnd = i;
                    }
                }); 

                if (found) {
                    messages[purgeBrain].splice(indexStart, indexEnd - indexStart + 1);

                    send(data.channelID, util.format(
                        strings.commands.purge.messageB, 
                        messages[purgeBrain].length
                    ), false);

                    purgeReady = false;
                    rebooting = true;

                    Object.keys(nptoggles).forEach(function(n, i) {
                        if (nptoggles[n])
                            send(n, strings.announcements.npreboot, true);
                    });

                    saveAllBrains();
                    blitzorws.close();

                    setTimeout(function() {
                        printStopMessage();
                        process.exit();
                    }, config.options.reboottime * 1000);
                }
                else {
                    send(data.channelID, strings.commands.purge.errorG, false);
                }
            }
            else {
                send(data.channelID, strings.commands.purge.errorG, false);
            }           
        }
        else if (data.message == config.options.commandsymbol + data.command + " no") {
            send(data.channelID, strings.commands.purge.messageC, false);
            purgeReady = false;
        }
        else {
            send(data.channelID, strings.commands.purge.errorF, false);
        }
    }
    else {
        var lines = data.message.split("\n");

        var brain = lines[0].replace(config.options.commandsymbol + data.command + " ", "");
        if (brain == "" || brain == config.options.commandsymbol + data.command) {
            send(data.channelID, strings.commands.purge.errorA, false);
        }
        else {
            if (brains[brain] != null) {
                purgeBrain = brain;

                purgeStart = lines[1];
                purgeEnd = lines[2];

                if (purgeStart != undefined && purgeEnd != undefined) {

                    var found = false;
                    var indexStart = -1;
                    messages[brain].forEach(function(l, i) {
                        if (l == purgeStart) {
                            found = true;
                            indexStart = i;
                        }
                    });

                    if (found) {

                        found = false;
                        var indexEnd = -1;
                        messages[brain].forEach(function(l, i) {
                            if (l == purgeEnd) {
                                found = true;
                                indexEnd = i;
                            }
                        });

                        if (found) {
                            send(data.channelID, util.format(
                                strings.commands.purge.messageA, 
                                indexEnd - indexStart + 1,
                                purgeBrain,
                                messages[purgeBrain].length,
                                messages[purgeBrain].length - (indexEnd - indexStart + 1)
                            ), false);
                            purgeReady = true;
                        }
                        else {
                            send(data.channelID, strings.commands.purge.errorE, false);
                        }
                    }
                    else {
                        send(data.channelID, strings.commands.purge.errorD, false);
                    }
                }
                else {
                    send(data.channelID, strings.commands.purge.errorC, false);
                }
            }
            else {
                send(data.channelID, strings.commands.purge.errorB, false);
            }
        }
    }
};

// Command: !nppause
comm.nppause = function(data) {
    if (!nppaused) {
        send(data.channelID, strings.commands.nppause.messageA, false);
        nppaused = true;
    }
    else {
        send(data.channelID, strings.commands.nppause.messageB, false);
        nppaused = false;
        npradio = {};
    }    
};

// Command: !npstatus
comm.npstatus = function(data) {
    if (Object.keys(nptoggles).length == 0)
        send(channelNameToID(config.options.channels.debug), strings.commands.npstatus.error, false);
    else {
        var message = strings.commands.npstatus.messageA;
        Object.keys(nptoggles).forEach(function(n, i) {
            var type = "Public";

            if (bot.channels[n] == undefined)
                type = "Private";

            message += util.format(
                strings.commands.npstatus.messageB, 
                channelIDToName(n),
                type
            );
        });
        send(channelNameToID(config.options.channels.debug), message, false);
    }
};

// Command: !nppurge
comm.nppurge = function(data) {
    if (Object.keys(nptoggles).length == 0)
        send(data.channelID, strings.commands.nppurge.error, false);
    else {
        Object.keys(nptoggles).forEach(function(n, i) {
            if (nptoggles[n])
                send(n, strings.commands.nppurge.notify, true);
        });     
        nptoggles = {};

        fs.writeFileSync(config.options.nptogglespath, JSON.stringify(nptoggles), "utf-8");
        send(data.channelID, strings.commands.nppurge.message, false);
    }
};

// Command: !lyricsadd
comm.lyricsadd = function(data) {
    var lines = data.message.split("\n");

    var track = lines[0].replace(config.options.commandsymbol + data.command + " ", "");
    if (track == "" || track == config.options.commandsymbol + data.command) {
        send(data.channelID, strings.commands.lyricsadd.errorA, false);
    }
    else {
        var lyriclines = "";
        lines.forEach(function(l, i) {
            if (i != 0) {
                lyriclines += l + "\n"; 
            }
        });

        if (lyriclines != "") {

            if (lyrics[track] == undefined)
                lyrics[track] = lyriclines;
            else
                lyrics[track] += lyriclines;

            fs.writeFileSync(config.options.lyricspath, JSON.stringify(lyrics), "utf-8");

            send(data.channelID, util.format(
                strings.commands.lyricsadd.message, 
                track
            ), false);
        }
        else {
            send(data.channelID, strings.commands.lyricsadd.errorB, false);
        }
    }
};

// Command: !lyricsdel
comm.lyricsdel = function(data) {
    var track = data.message.replace(config.options.commandsymbol + data.command + " ", "");
    if (track == "" || track == config.options.commandsymbol + data.command) {
        send(data.channelID, strings.commands.lyricsdel.errorA, false);
    }
    else {
        if (lyrics[track] != undefined) {
            delete lyrics[track];

            fs.writeFileSync(config.options.lyricspath, JSON.stringify(lyrics), "utf-8");

            send(data.channelID, util.format(
                strings.commands.lyricsdel.message, 
                track
            ), false);
        }
        else {
            send(data.channelID, strings.commands.lyricsdel.errorB, false);
        }
    }
};

// Command: !artadd
comm.artadd = function(data) {
    var lines = data.message.split("\n");

    var track = lines[0].replace(config.options.commandsymbol + data.command + " ", "");
    if (track == "" || track == config.options.commandsymbol + data.command) {
        send(data.channelID, strings.commands.artadd.errorA, false);
    }
    else {
        if (lines[1] != undefined) {
            var url = lines[1];

            if (art[track] == undefined) {              
                art[track] = url;
                fs.writeFileSync(config.options.artpath, JSON.stringify(art), "utf-8");
                send(data.channelID, util.format(
                    strings.commands.artadd.messageA, 
                    track
                ), false);
            }
            else {
                art[track] = url;
                fs.writeFileSync(config.options.artpath, JSON.stringify(art), "utf-8");
                send(data.channelID, util.format(
                    strings.commands.artadd.messageB, 
                    track
                ), false);
            }           
        }
        else {
            send(data.channelID, strings.commands.artadd.errorB, false);
        }
    }
};

// Command: !artdel
comm.artdel = function(data) {
    var track = data.message.replace(config.options.commandsymbol + data.command + " ", "");
    if (track == "" || track == config.options.commandsymbol + data.command) {
        send(data.channelID, strings.commands.artdel.errorA, false);
    }
    else {
        if (art[track] != undefined) {
            delete art[track];

            fs.writeFileSync(config.options.artpath, JSON.stringify(art), "utf-8");

            send(data.channelID, util.format(
                strings.commands.artdel.message, 
                track
            ), false);
        }
        else {
            send(data.channelID, strings.commands.artdel.errorB, false);
        }
    }
};

// Command: !storyadd
comm.storyadd = function(data) {
    var lines = data.message.split("\n");

    var track = lines[0].replace(config.options.commandsymbol + data.command + " ", "");
    if (track == "" || track == config.options.commandsymbol + data.command) {
        send(data.channelID, strings.commands.storyadd.errorA, false);
    }
    else {
        var storylines = "";
        lines.forEach(function(l, i) {
            if (i != 0) {
                storylines += l + "\n"; 
            }
        });

        if (storylines != "") {

            if (story[track] == undefined)
                story[track] = storylines;
            else
                story[track] += storylines;

            fs.writeFileSync(config.options.storypath, JSON.stringify(story), "utf-8");

            send(data.channelID, util.format(
                strings.commands.storyadd.message, 
                track
            ), false);
        }
        else {
            send(data.channelID, strings.commands.storyadd.errorB, false);
        }
    }
};

// Command: !storydel
comm.storydel = function(data) {
    var track = data.message.replace(config.options.commandsymbol + data.command + " ", "");
    if (track == "" || track == config.options.commandsymbol + data.command) {
        send(data.channelID, strings.commands.storydel.errorA, false);
    }
    else {
        if (story[track] != undefined) {
            delete story[track];

            fs.writeFileSync(config.options.storypath, JSON.stringify(story), "utf-8");

            send(data.channelID, util.format(
                strings.commands.storydel.message, 
                track
            ), false);
        }
        else {
            send(data.channelID, strings.commands.storydel.errorB, false);
        }
    }
};

// Command: !spooladd
comm.spooladd = function(data) {
    var lines = data.message.split("\n");

    var name = lines[0].replace(config.options.commandsymbol + data.command + " ", "");
    if (name == "" || name == config.options.commandsymbol + data.command) {
        send(data.channelID, strings.commands.spooladd.errorA, false);
    }
    else {
        var weight = lines[1];

        if (weight != "" && weight != undefined) {

            if (spool[name] == undefined)
                send(data.channelID, util.format(
                    strings.commands.spooladd.messageA, 
                    name
                ), false);
            else
                send(data.channelID, util.format(
                    strings.commands.spooladd.messageB, 
                    name
                ), false);

            spool[name] = parseInt(weight);
            fs.writeFileSync(config.options.spoolpath, JSON.stringify(spool), "utf-8");
        }
        else {
            send(data.channelID, strings.commands.spooladd.errorB, false);
        }
    }
};

// Command: !spooldel
comm.spooldel = function(data) {
    var name = data.message.replace(config.options.commandsymbol + data.command + " ", "");
    if (name == "" || name == config.options.commandsymbol + data.command) {
        send(data.channelID, strings.commands.spooldel.errorA, false);
    }
    else {
        if (spool[name] != undefined) {
            delete spool[name];

            fs.writeFileSync(config.options.spoolpath, JSON.stringify(spool), "utf-8");

            send(data.channelID, util.format(
                strings.commands.spooldel.message, 
                name
            ), false);
        }
        else {
            send(data.channelID, strings.commands.spooldel.errorB, false);
        }
    }
};

// Command: !h
comm.h = function(data) {
    if (Object.keys(hTrack).length == 0)
        send(channelNameToID(config.options.channels.debug), strings.commands.h.error, false);
    else {
        var message = strings.commands.h.messageA;
        Object.keys(hTrack).forEach(function(h, i) {
            var status = "Cooldown";

            if (moment() - hTrack[h] >= config.options.htimeout * 1000)
                status = "Expired";

            message += util.format(
                strings.commands.h.messageB, 
                channelIDToName(h),
                moment.tz(new Date(hTrack[h]), "UTC").format("YYYY-MM-DD, HH:mm:ss"),
                status
            );
        });
        send(channelNameToID(config.options.channels.debug), message, false);
    }
};

// Command: !ignore
comm.ignore = function(data) {
    var user = data.message.replace(config.options.commandsymbol + data.command + " ", "");
    if (user == "" || user == config.options.commandsymbol + data.command) {
        send(data.channelID, strings.commands.ignore.error, true);
    }
    else {
        if (ignore[user] == undefined) {
            ignore[user] = true;
            send(data.channelID, strings.commands.ignore.messageA, true);

            console.log(util.format(
                strings.debug.ignore.add,
                user
            ));
        }
        else {
            delete ignore[user];
            send(data.channelID, strings.commands.ignore.messageB, true);

            console.log(util.format(
                strings.debug.ignore.remove,
                user
            ));
        }

        fs.writeFileSync(config.options.ignorepath, JSON.stringify(ignore), "utf-8");
        
    }
};

// Command: !mood
comm.mood = function(data) {
    var name = data.message.replace(config.options.commandsymbol + data.command + " ", "");
    if (name == "" || name == config.options.commandsymbol + data.command) {
        var message = strings.commands.mood.messageA;
        tradfri.moods.forEach(function(m) {
            message += util.format(
                strings.commands.mood.messageB, 
                m.name
            );
        });
        send(data.channelID, message, false);
    }
    else {      
        var found = false;

        tradfri.moods.forEach(function(m) {     
            if (m.name == name) {
                found = true;  
                setMood(m.name, function(result) {
                    if (result) 
                        send(data.channelID, util.format(
                            strings.commands.mood.messageC, 
                            m.name
                        ), false);
                    else
                        send(data.channelID, strings.misc.tradfrierror, false);
                });
            }
        });

        if (!found)
            send(data.channelID, strings.commands.mood.error, false);
    }
};

// Command: !bulb
comm.bulb = function(data) {
    var lines = data.message.split("\n");

    var name = lines[0].replace(config.options.commandsymbol + data.command + " ", "");
    if ((name == "" || name == config.options.commandsymbol + data.command) && lines.length <= 1) {
        refreshTradfriDevices(function(result) {
            if (result) {
                var message = strings.commands.bulb.messageA;
                tBulbs.forEach(function(d) {
                    var color = d.color;
                    if (color == "0")
                        color = "custom";
                    message += util.format(
                        strings.commands.bulb.messageB, 
                        d.name,
                        color
                    );
                });
                send(data.channelID, message, false);
            }
            else {
                send(data.channelID, strings.misc.tradfrierror, false);                
            }
        });
    }
    else {
        var found = false;
        var id;
        tBulbs.forEach(function(d) {
            if (d.name == name) {               
                found = true;
                id = d.id;
            }           
        });
        if (found) {
            var bulb = {};
            if (lines.length == 3) {

                bulb.transitionTime = parseInt(lines[2]);

                var rgb = color.RGB().hex(lines[1]);
                rgb.r = rgb.R;
                rgb.g = rgb.G;
                rgb.b = rgb.B;

                var cie = color.space.rgb['CIE-RGB'];
                var XYZ = cie.XYZ(rgb);

                var xyY = XYZ.xyY();

                bulb.colorX     = xyY.x;
                bulb.colorY     = xyY.y;
                bulb.brightness = xyY.Y;

                setBulb(bulb, id);

                send(data.channelID, strings.commands.bulb.messageC, false);
            }
            else if (lines.length == 5) {

                bulb.colorX         = parseFloat(lines[1]);
                bulb.colorY         = parseFloat(lines[2]);
                bulb.brightness     = parseFloat(lines[3]);
                bulb.transitionTime = parseInt(lines[4]);

                setBulb(bulb, id);

                send(data.channelID, strings.commands.bulb.messageC, false);
            }
            else {
                send(data.channelID, strings.commands.bulb.errorA + strings.commands.bulb.errorB + strings.commands.bulb.errorC, false);
            }
        }
        else {
            send(data.channelID, strings.commands.bulb.errorD, false);
        }
    }
};

// Command: !toggle
comm.toggle = function(data) {
    var name = data.message.replace(config.options.commandsymbol + data.command + " ", "");
    if (name == "" || name == config.options.commandsymbol + data.command) {
        refreshTradfriDevices(function(result) {
            if (result) {
                var message = strings.commands.toggle.messageA;
                tToggles.forEach(function(d) {
                    var type = strings.commands.toggle.iconPlug;
                    if (d.color != undefined)
                        type = strings.commands.toggle.iconBulb;

                    if (d.on == true)
                        message += util.format(
                            strings.commands.toggle.messageBon,
                            type,
                            d.name
                        );
                    else
                        message += util.format(
                            strings.commands.toggle.messageBoff,
                            type,
                            d.name
                        );
                });
                send(data.channelID, message, false);
            }
            else {
                send(data.channelID, strings.misc.tradfrierror, false);                
            }
        });
    }
    else {      
        var found = false;

        tToggles.forEach(function(d) {       
            if (d.name == name) {
                found = true;   
                send(data.channelID, strings.commands.toggle.messageC, false);
                hub.toggleDevice(d.id);
            }
        });

        if (!found)
            send(data.channelID, strings.commands.toggle.error, false);
    }
};

// Command: !battery
comm.battery = function(data) {
    refreshTradfriDevices(function(result) {
        if (result) {
            var message = strings.commands.battery.messageA;
            tRemotes.forEach(function(d) {
                if (d.battery <= tradfri.lowbattery)
                    message += util.format(
                        strings.commands.battery.messageBLow,
                        strings.commands.battery.iconBattLow,
                        d.battery,
                        d.name
                    );
                else
                    message += util.format(
                        strings.commands.battery.messageBHi,
                        strings.commands.battery.iconBattHi,
                        d.battery,
                        d.name
                    );
            });
            send(data.channelID, message, false);
        }
        else {
            send(data.channelID, strings.misc.tradfrierror, false);                
        }
    });
};

// Command: !schedulestart
comm.schedulestart = function(data) {
    var days = data.message.replace(config.options.commandsymbol + data.command + " ", "");
    if (days == "" || days == config.options.commandsymbol + data.command) {
        send(channelNameToID(config.options.channels.home), strings.commands.schedulestart.errorA, false);
    }
    else {
        if (scheduleEntries != undefined && scheduleEntries.length > 0) {
            send(channelNameToID(config.options.channels.home), strings.commands.schedulestart.errorB, false);
        }
        else {
            scheduleEntries = [];

            var now = new Date();
            var day = now.getDate();
            var month = now.getMonth();
            var year = now.getFullYear();

            for (i = 0; i < parseInt(days); i++) { 
                schedule.schedules.forEach(function(s) {
                    var partsTime = s.time.split(config.separators.time);
                    var date = new Date(year, month, day + i, partsTime[0], partsTime[1], 0, 0);
                    var delta = Math.floor((Math.random() * (2 * 60000 * s.delta) - 60000 * s.delta));

                    var entry = {};
                    date.setTime(date.getTime() + delta); 
                    entry.date = date;
                    entry.delta = delta;
                    entry.name = s.name;
                    entry.toggle = s.toggle;
                    entry.bulbs = s.bulbs;

                    scheduleEntries.push(entry);
                });
            }

            var message = strings.commands.schedulestart.messageA;
            var j = 0;
            scheduleEntries.forEach(function(e, i) {
                if (i % schedule.schedules.length == 0) {
                    j++;
                    message += util.format(
                        strings.commands.schedulestart.messageB, 
                        j
                    );
                }

                message += util.format(
                    strings.commands.schedulestart.messageC, 
                    e.name,
                    e.toggle,
                    getDiscordTimestamp(e.date)
                );

                var job = new CronJob(e.date, function() {
                    refreshTradfriDevices(function(result) {
                        if (result) {
                            var message = "";
                            e.bulbs.forEach(function(b) {
                                tToggles.forEach(function(d) {
                                    if (b == d.name) {
                                        if (e.toggle == "off" && d.on) {
                                            hub.toggleDevice(d.id);
                                        }
                                        else if (e.toggle == "on" && !d.on) {
                                            hub.toggleDevice(d.id);
                                        }
                                    }
                                }); 
                                if (message == "")
                                    message += b;
                                else
                                    message += ", " + b;
                            });                     
                            send(channelNameToID(config.options.channels.home), util.format(
                                    strings.announcements.schedule, 
                                    e.toggle,
                                    message
                                ), false);
                        }
                        else {
                            send(channelNameToID(config.options.channels.home), strings.misc.tradfrierror, false);                
                        }
                    });
                }, function () {}, true);
                scheduleJobs.push(job);
            });

            send(channelNameToID(config.options.channels.home), util.format(
                    message,
                    days
                ), false);
        }
    }
};

// Command: !schedulestart
comm.schedulestop = function(data) {
    if (scheduleEntries != undefined && scheduleEntries.length > 0) {
        scheduleJobs.forEach(function(j) {
            j.stop();
        });
        scheduleJobs    = [];
        scheduleEntries = [];

        send(channelNameToID(config.options.channels.home), strings.commands.schedulestop.message, false);
    }
    else {
        send(channelNameToID(config.options.channels.home), strings.commands.schedulestop.error, false);
    }
};

// Command: !eegstart
comm.eegstart = function(data) {
    if (eegRecording) {
        send(data.channelID, strings.commands.eegstart.error, true);
    }
    else {
        eegTable = [];
        eegTableEMA = [];
        eegRecording = true;
        send(data.channelID, strings.commands.eegstart.message, true);
    }
};

// Command: !eegstop
comm.eegstop = function(data) {
    if (!eegRecording) {
        send(data.channelID, strings.commands.eegstop.errorA, true);
    }
    else {
        eegRecording = false;
        send(data.channelID, strings.commands.eegstop.messageA, true);
        saveEEG();  

        setTimeout(function() {
            if (fs.existsSync(config.eeg.basicpath)) {
                embed(channelNameToID(config.options.channels.debug), strings.commands.eegstop.messageB, config.eeg.basicpath, util.format(
                    strings.misc.eeg.basic.upload,
                    (new Date(eegTable[0].time * 1000)),
                    (new Date(eegTable[eegTable.length - 1].time * 1000))
                ), true, true);
                setTimeout(function() {
                    if (fs.existsSync(config.eeg.rawpath))
                        embed(channelNameToID(config.options.channels.debug), "", config.eeg.rawpath, util.format(
                            strings.misc.eeg.raw.upload,
                            (new Date(eegTable[0].time * 1000)),
                            (new Date(eegTable[eegTable.length - 1].time * 1000))
                        ), true, true);
                }, 1000);
                setTimeout(function() {
                    if (fs.existsSync(config.eeg.emapath))
                        embed(channelNameToID(config.options.channels.debug), "", config.eeg.emapath, util.format(
                            strings.misc.eeg.ema.upload,
                            (new Date(eegTable[0].time * 1000)),
                            (new Date(eegTable[eegTable.length - 1].time * 1000))
                        ), true, true);
                }, 2000);
            }
            else
                send(channelNameToID(config.options.channels.debug), strings.commands.eegstop.errorB, true);    
        }, 1000);
    }
};

// Command: !eegset
comm.eegset = function(data) {
    var lines = data.message.split("\n");

    if (lines.length == 6) {        
        eegConfig.ema    = parseInt(lines[1]);
        eegConfig.type   = lines[2];
        eegConfig.value  = lines[3];
        eegConfig.max    = parseInt(lines[4]);
        eegConfig.expire = parseInt(lines[5]);

        fs.writeFileSync(config.options.eegpath, JSON.stringify(eegConfig), "utf-8");

        eegVaripassEdit();

        send(data.channelID, strings.commands.eegset.message, false);
    }
    else {
        send(data.channelID, strings.commands.eegset.errorA + strings.commands.eegset.errorB + strings.commands.eegset.errorC + util.format(
            strings.commands.eegset.errorD,
            eegConfig.ema,
            eegConfig.type,
            eegConfig.value,
            eegConfig.max,
            eegConfig.expire
        ), false);
    }
};

// Command: !leave
comm.leave = function(data) {
    var server = data.message.replace(config.options.commandsymbol + data.command + " ", "");
    if (server == "" || server == config.options.commandsymbol + data.command) {
        var message = strings.commands.leave.messageA;
        Object.keys(bot.servers).forEach(function(s, i) {
            message += util.format(
                strings.commands.leave.messageB,
                bot.servers[s].name,
                s
            );
        });
        send(channelNameToID(config.options.channels.debug), message, false);
    }
    else {
        if (bot.servers[server] != undefined) {
            var left = bot.servers[server].name;
            bot.leaveServer(server);
            send(channelNameToID(config.options.channels.debug), util.format(
                strings.commands.leave.messageC,
                left,
            ), false);
        }
        else {
            send(channelNameToID(config.options.channels.debug), strings.commands.leave.error, false);
        }
    }
};

// Command: !camera
comm.camera = function(data) {
    var params = data.message.replace(config.options.commandsymbol + data.command + " ", "");
    if (params == "" || params == config.options.commandsymbol + data.command) {
        send(data.channelID, strings.commands.camera.errorA, true);
    }
    else {
        params = params.split(" ");
        if (params[1] != undefined && (params[1] == "on" || params[1] == "off")) {
            if (params[0] == "luna") {
                if (params[1] == "on") {
                    exec("sudo /home/luna/mjpg-streamer_norm.sh start");
                    send(data.channelID, util.format(
                        strings.commands.camera.messageA,
                        "my",
                    ), true);
                }
                else if (params[1] == "off") {
                    exec("sudo /home/luna/mjpg-streamer_norm.sh stop");
                    send(data.channelID, util.format(
                        strings.commands.camera.messageB,
                        "my",
                    ), true);
                }         
            }
            else if (params[0] == "chrysalis") {
                send(data.channelID, util.format(
                    strings.commands.camera.messageC,
                    params[0]
                ), false);

                var url = util.format(
                    config.ann.camera.request,
                    httpkey.key,
                    params[1]
                );

                var xhr = new XMLHttpRequest();
                xhr.open("GET", url, true);

                xhr.onreadystatechange = function () { 
                    if (xhr.readyState == 4) {
                        if (xhr.status != 200)
                            setTimeout(function() {
                                send(data.channelID, strings.commands.camera.errorC, true);
                            }, 2000);
                        
                        clearTimeout(cameraTimeout);
                    }
                }
                xhr.onerror = function(err) {
                    xhr.abort();
                    send(data.channelID, strings.commands.camera.errorC, true);
                }
                xhr.ontimeout = function() {
                    xhr.abort();
                    send(data.channelID, strings.commands.camera.errorD, true);
                }

                xhr.send();

                cameraTimeout = setTimeout(function() {
                    xhr.abort();

                    send(data.channelID, strings.commands.camera.errorD, true);
                }, config.ann.camera.timeout * 1000);
            }
            else {                
                send(data.channelID, strings.commands.camera.errorE, true);
            }
        }
        else {
            send(data.channelID, strings.commands.camera.errorB, true);
        }
    }
};

// Command: !stream
comm.stream = function(data) {
    var state = data.message.replace(config.options.commandsymbol + data.command + " ", "");
    if (state == "" || state == config.options.commandsymbol + data.command) {
        send(data.channelID, strings.commands.camera.error, true);
    }
    else {
        if (state == "start") {
            exec("sudo -H -u luna bash -c \"/usr/bin/tmux new-session -d -s live '/home/luna/live.sh'\"");
            send(data.channelID, strings.commands.stream.messageA, true);
        }
        else if (state == "stop") {
            exec("sudo -H -u luna bash -c \"/usr/bin/tmux kill-session -t live\"");
            send(data.channelID, strings.commands.stream.messageB, true);
        }
        else
            send(data.channelID, strings.commands.stream.error, true);
    }
};

// Command: !ann
comm.ann = function(data) {
    var parts = data.message.split("\n");
    var state = parts[0].replace(config.options.commandsymbol + data.command + " ", "");
    if (state == "" || state == config.options.commandsymbol + data.command) {
        send(data.channelID, strings.commands.ann.errorA, true);
    }
    else {
        if (state == "on") {
            annStatus.enabled = true;
            annStatus.message = "";
            fs.writeFileSync(config.ann.path, JSON.stringify(annStatus), "utf-8");
            send(data.channelID, strings.commands.ann.messageB, true);
        }
        else if (state == "off") {
            if (parts[1] != undefined && parts[1] != "" && parts[1] != " ") {
                annStatus.enabled = false;
                annStatus.message = parts[1];
                fs.writeFileSync(config.ann.path, JSON.stringify(annStatus), "utf-8");
                send(data.channelID, strings.commands.ann.messageA, true);
            }
            else
                send(data.channelID, strings.commands.ann.errorB, true);
        }
        else
            send(data.channelID, strings.commands.ann.errorA, true);
    }
};

// Command: !chase
comm.chase = function(data) {
    var state = data.message.replace(config.options.commandsymbol + data.command + " ", "");
    if (state == "" || state == config.options.commandsymbol + data.command) {
        send(data.channelID, strings.commands.chase.errorA, true);
    }
    else {
        if (state == "start") {
            if (!isChasing) {
                isChasing = true;

                connectChase(false);
                send(data.channelID, strings.commands.chase.messageA, true);
            }
            else {
                send(data.channelID, strings.commands.chase.errorB, true);
            }
        }
        else if (state == "stop") {
            if (isChasing) {
                isChasing = false;
                
                clearTimeout(chaseReconnect);
                chasews.close();

                if (chaseRange > blitzor.range) {
                    chaseRange = blitzor.range;
                    chaseNew = blitzor.range;
                }
                send(data.channelID, strings.commands.chase.messageB, true);
            }
            else {
                send(data.channelID, strings.commands.chase.errorC, true);
            }
        }
        else
            send(data.channelID, strings.commands.chase.errorA, true);
    }
};

// Command: !wake
comm.wake = function(data) {
    var device = data.message.replace(config.options.commandsymbol + data.command + " ", "");
    if (device == "" || device == config.options.commandsymbol + data.command) {
        send(data.channelID, strings.commands.wake.errorA, false);
    }
    else {
        if (device in mac) {
            send(data.channelID, util.format(
                strings.commands.wake.message,
                device
            ), false);
            exec("sudo etherwake " + mac[device]);
        }
        else {
            send(data.channelID, strings.commands.wake.errorB, false);
        }
    }
};


// Command: !reboot
comm.reboot = function(data) {
    rebooting = true;

    Object.keys(nptoggles).forEach(function(n, i) {
        if (nptoggles[n])
            send(n, strings.announcements.npreboot, true);
    });
    send(data.channelID, strings.commands.reboot.message, false);

    saveAllBrains();
    blitzorws.close();

    setTimeout(function() {
        printStopMessage();
        process.exit();
    }, config.options.reboottime * 1000);
};

// Command: !reload
comm.reload = function(data) {  
    reloadConfig();
    send(data.channelID, strings.commands.reload.message, false);
};

// Command: !backup
comm.backup = function(data) {
    console.log(strings.debug.backup.start);
    send(data.channelID, strings.commands.backup.messageA, false);

    var output = fs.createWriteStream(config.backup.output.path);
    var _zlib = config.backup.compression;
    var archive = archiver("zip", {
        "zlib": { "level": _zlib }
    });

    output.on('close', function() {
        console.log(util.format(
            strings.debug.backup.done,
            archive.pointer()
        ));

        embed(channelNameToID(config.options.channels.debug), strings.commands.backup.messageB, config.backup.output.path, util.format(
            config.backup.output.file,
            moment.tz(new Date(), "UTC").format("YYYY-MM-DD_HH-mm")
        ), false, true);
    });

    archive.on('warning', function(err) {
        console.log(util.format(
            strings.debug.backup.error,
            "Warning: " + err
        ));
        send(channelNameToID(config.options.channels.debug), util.format(
            strings.commands.backup.error,
            "Warning: " + err           
        ), false);
    });

    archive.on('error', function(err) {
        console.log(util.format(
            strings.debug.backup.error,
            "Error: " + err
        ));
        send(channelNameToID(config.options.channels.debug), util.format(
            strings.commands.backup.error,
            "Error: " + err         
        ), false);
    });

    archive.pipe(output);

    config.backup.input.entries.forEach(function(e) {
        archive.directory(config.backup.input.path + e + "/", e);
    });

    archive.finalize();
};

// Command: !system
comm.system = function(data) {
    var command = data.message.replace(config.options.commandsymbol + data.command + " ", "");
    if (command == "" || command == config.options.commandsymbol + data.command) {
        send(data.channelID, strings.commands.system.errorA, false);
    }
    else {
        var parts = command.split(" ");
        switch (parts[0]) {

            case "reboot":
                rebooting = true;

                Object.keys(nptoggles).forEach(function(n, i) {
                    if (nptoggles[n])
                        send(n, strings.announcements.npreboot, true);
                });
                send(data.channelID, strings.commands.system.mreboot, false);

                saveAllBrains();
                blitzorws.close();

                setTimeout(function() {
                    printStopMessage();

                    exec("sudo /sbin/reboot");

                }, config.options.reboottime * 1000);
                break;

            default:
                send(data.channelID, strings.commands.system.errorB, false);
                break;
        }
    }
};



/*******************************
 * COMPONENT AND CONFIG LOADING
 *******************************/

/*
 * Starts the loading procedure.
 */
function startupProcedure() {
    startTime = new Date();
    console.log(" ");
    console.log(strings.debug.started);
    console.log(" ");
    console.log(util.format(
        strings.debug.startedtime,
        moment.tz(startTime, "UTC").format("YYYY-MM-DD, HH:mm")
    ));

    loadAnnouncements();
    loadPhases();
    loadLyrics();
    loadArt();
    loadStory();
    loadSpool();
    loadNPToggles();
    loadANN();
    loadBlacklist();
    loadIgnore();
    loadCorona();
    loadLive();
    loadEEG();
    loadTimezones();
    loadTradfri();
    loadAssaults();
    loadDailyCron();
    loadBrain();
}

/*
 * Loads all announcements from the config.
 */
function loadAnnouncements() {

    // Long Message
    var partsLong = gotn.announce.long.split(config.separators.time);
    var long = (parseInt(partsLong[0]) * 60 + parseInt(partsLong[1])) * 60000;

    var dateLong = {};
    dateLong.hours   = parseInt(partsLong[0]);
    dateLong.minutes = parseInt(partsLong[1]);

    // Short Message
    var partsShort = gotn.announce.short.split(config.separators.time);
    var short = (parseInt(partsShort[0]) * 60 + parseInt(partsShort[1])) * 60000;

    var dateShort = {};
    dateShort.hours   = parseInt(partsShort[0]);
    dateShort.minutes = parseInt(partsShort[1]);

    console.log(strings.debug.announcements.load);

    gotn.dates.forEach(function(d) {

        var partsDate = d.split(config.separators.date);
        var partsTime = gotn.time.split(config.separators.time);

        var date = new Date(partsDate[0], parseInt(partsDate[1]) - 1, partsDate[2], partsTime[0], partsTime[1], 0, 0);
        if (config.options.debuggotn)
            console.log(util.format(
                strings.debug.announcements.item,
                date
            ));

        // Long air-time announcement.
        var jobLong = new CronJob(new Date(date - long), function() {
                send(channelNameToID(config.options.channels.announceA), util.format(
                    strings.announcements.gotn.long,
                    getTimeString(dateLong)
                ), true);
            }, function () {}, true);

        // Short air-time announcement.
        var jobShort = new CronJob(new Date(date - short), function() {
                send(channelNameToID(config.options.channels.announceA), util.format(
                    strings.announcements.gotn.shortA,
                    getTimeString(dateShort)
                ), true);
                send(channelNameToID(config.options.channels.announceB), util.format(
                    strings.announcements.gotn.shortB,
                    getTimeString(dateShort)
                ), true);
                config.options.channels.announceC.forEach(function(c, i) {
                    send(c, util.format(
                        strings.announcements.gotn.shortC,
                        getTimeString(dateShort)
                    ), true);
                });
            }, function () {}, true);

        // Now air-time announcement.
        var jobNow = new CronJob(new Date(date), function() {
                isLive = true;
                var livedata = {}
                livedata.isLive = isLive;
                fs.writeFileSync(config.options.livepath, JSON.stringify(livedata), "utf-8");

                send(channelNameToID(config.options.channels.announceA), strings.announcements.gotn.nowA, true);
                send(channelNameToID(config.options.channels.announceB), util.format(
                    strings.announcements.gotn.nowB,
                    mentionRole(config.options.squadid)
                ), true);
                setMood(gotn.mood, function(result) {
                    if (!result)
                        send(channelNameToID(config.options.channels.debug), strings.misc.tradfrierror, false);    
                });                

                setTimeout(function() {

                    send(channelNameToID(config.options.channels.debug), strings.debug.nptoggles.autoon, false);
                    config.options.channels.nowplaying.forEach(function(n, i) {
                        nptoggles[channelNameToID(n)] = true;
                    });
                    fs.writeFileSync(config.options.nptogglespath, JSON.stringify(nptoggles), "utf-8");

                }, config.options.starttime * 1000);
            }, function () {}, true);

        jobsGOTN.push(jobLong);
        jobsGOTN.push(jobShort);
        jobsGOTN.push(jobNow);
    });

    console.log(util.format(
        strings.debug.announcements.done,
        jobsGOTN.length
    ));
}

/*
 * Loads the lyrics data, or creates new.
 */
function loadLyrics() {
    lyrics = {};

    if (fs.existsSync(config.options.lyricspath)) {
        console.log(strings.debug.lyrics.old);
        lyrics = JSON.parse(fs.readFileSync(config.options.lyricspath, "utf8"));
        console.log(strings.debug.lyrics.done);
    }
    else {
        fs.writeFileSync(config.options.lyricspath, JSON.stringify(lyrics), "utf-8");
        console.log(strings.debug.lyrics.new);
    }
}

/*
 * Loads the art data, or creates new.
 */
function loadArt() {
    art = {};

    if (fs.existsSync(config.options.artpath)) {
        console.log(strings.debug.art.old);
        art = JSON.parse(fs.readFileSync(config.options.artpath, "utf8"));
        console.log(strings.debug.art.done);
    }
    else {
        fs.writeFileSync(config.options.artpath, JSON.stringify(art), "utf-8");
        console.log(strings.debug.art.new);
    }
}

/*
 * Loads the story data, or creates new.
 */
function loadStory() {
    story = {};

    if (fs.existsSync(config.options.storypath)) {
        console.log(strings.debug.story.old);
        story = JSON.parse(fs.readFileSync(config.options.storypath, "utf8"));
        console.log(strings.debug.story.done);
    }
    else {
        fs.writeFileSync(config.options.storypath, JSON.stringify(story), "utf-8");
        console.log(strings.debug.story.new);
    }
}

/*
 * Loads the spool data, or creates new.
 */
function loadSpool() {
    spool = {};

    if (fs.existsSync(config.options.spoolpath)) {
        console.log(strings.debug.spool.old);
        spool = JSON.parse(fs.readFileSync(config.options.spoolpath, "utf8"));
        console.log(strings.debug.spool.done);
    }
    else {
        fs.writeFileSync(config.options.spoolpath, JSON.stringify(spool), "utf-8");
        console.log(strings.debug.spool.new);
    }
}

/*
 * Loads the Now Playing toggle data, or creates new.
 */
function loadNPToggles() {
    nptoggles = {};

    if (fs.existsSync(config.options.nptogglespath)) {
        console.log(strings.debug.nptoggles.old);
        nptoggles = JSON.parse(fs.readFileSync(config.options.nptogglespath, "utf8"));
        console.log(strings.debug.nptoggles.done);
    }
    else {
        fs.writeFileSync(config.options.nptogglespath, JSON.stringify(nptoggles), "utf-8");
        console.log(strings.debug.nptoggles.new);
    }
}

/*
 * Loads the ANN toggle data, or creates new.
 */
function loadANN() {
    annStatus = {};

    if (fs.existsSync(config.ann.path)) {
        console.log(strings.debug.ann.old);
        annStatus = JSON.parse(fs.readFileSync(config.ann.path, "utf8"));
        console.log(strings.debug.ann.done);
    }
    else {
        annStatus.enabled = true;
        annStatus.message = "";
        fs.writeFileSync(config.ann.path, JSON.stringify(annStatus), "utf-8");
        console.log(strings.debug.ann.new);
    }
}

/*
 * Loads the blacklist data, or creates new.
 */
function loadBlacklist() {
    blacklist = {};

    if (fs.existsSync(config.options.blacklistpath)) {
        console.log(strings.debug.blacklist.old);
        blacklist = JSON.parse(fs.readFileSync(config.options.blacklistpath, "utf8"));
        console.log(strings.debug.blacklist.done);
    }
    else {
        fs.writeFileSync(config.options.blacklistpath, JSON.stringify(blacklist), "utf-8");
        console.log(strings.debug.blacklist.new);
    }
}

/*
 * Loads the ignore data, or creates new.
 */
function loadIgnore() {
    ignore = {};

    if (fs.existsSync(config.options.ignorepath)) {
        console.log(strings.debug.ignore.old);
        ignore = JSON.parse(fs.readFileSync(config.options.ignorepath, "utf8"));
        console.log(strings.debug.ignore.done);
    }
    else {
        fs.writeFileSync(config.options.ignorepath, JSON.stringify(ignore), "utf-8");
        console.log(strings.debug.ignore.new);
    }
}

/*
 * Loads the corona data, or creates new and prepares it.
 */
function loadCorona() {
    if (config.corona.enabled) {
        if (fs.existsSync(config.corona.path)) {
            console.log(strings.debug.corona.old);
            corona = JSON.parse(fs.readFileSync(config.corona.path, "utf8"));
            console.log(strings.debug.corona.done);
        }
        else {
            corona = {};
            corona.dateTotal  = "";
            corona.dateCounty = "";
            fs.writeFileSync(config.corona.path, JSON.stringify(corona), "utf-8");
            console.log(strings.debug.corona.new);
        }
    }
}

/*
 * Loads the live data, or creates new and prepares it.
 */
function loadLive() {
    if (fs.existsSync(config.options.livepath)) {
        console.log(strings.debug.live.old);
        var livedata = JSON.parse(fs.readFileSync(config.options.livepath, "utf8"));
        isLive = livedata.isLive;
        console.log(strings.debug.live.done);
    }
    else {
        var livedata = {}
        livedata.isLive = isLive;
        fs.writeFileSync(config.options.livepath, JSON.stringify(livedata), "utf-8");
        console.log(strings.debug.live.new);
    }
}

/*
 * Loads the EEG configuration, or creates new.
 */
function loadEEG() {

    if (fs.existsSync(config.options.eegpath)) {
        console.log(strings.debug.eeg.old);
        eegConfig = JSON.parse(fs.readFileSync(config.options.eegpath, "utf8"));
        console.log(strings.debug.eeg.done);
    }
    else {
        eegConfig = {};
        eegConfig.ema    = config.eeg.ema;
        eegConfig.type   = config.eeg.varipass.type;
        eegConfig.value  = config.eeg.varipass.value;
        eegConfig.max    = config.eeg.varipass.max;
        eegConfig.expire = config.eeg.varipass.expire;

        fs.writeFileSync(config.options.eegpath, JSON.stringify(eegConfig), "utf-8");
        console.log(strings.debug.eeg.new);
    }

    eegVaripassEdit();
}

/*
 * Loads the timezone data.
 */
function loadTimezones() {
    console.log(strings.debug.timezones.load);

    var timezoneData = require("./node_modules/moment-timezone/data/packed/latest.json");
    moment.tz.load(timezoneData);

    console.log(strings.debug.timezones.done);
}

/*
 * Initializes the Tradfri client.
 */
function loadTradfri() {
    //if (tradfri.debugconn)
    //    console.log(strings.debug.tradfri.connect);

    hub = tradfrilib.create({
        "coapClientPath": config.options.coappath,
        "identity":       dtls.identity,
        "preSharedKey":   dtls.preSharedKey,
        "hubIpAddress":   dtls.hubIpAddress
    });
}

/*
 * Starts the REST API server.
 */
function loadServer() {
    server = http.createServer(processRequest).listen(config.options.serverport);
}

/*
 * Loads the WoW Faction Assault announcements.
 */
function loadAssaults() {
    if (config.wow.assault.enabled) {
        console.log(strings.debug.assaults.load);

        prepareAssaultAnnounce();

        console.log(strings.debug.assaults.done);
    }
}

/*
 * Loads the daily cron procedures.
 */
function loadDailyCron() {
    console.log(strings.debug.dailycron.load);

    prepareDailyCron();

    console.log(strings.debug.dailycron.done);
}

/*
 * Processes the phase data for announcements.
 */
function loadPhases() {
    console.log(strings.debug.phases.load);

    phases.forEach(function(p) {
        var date = new Date(p.date);
        var message;
        if (config.options.debugphase)
            console.log(util.format(
                strings.debug.phases.item,
                date,
                p.phase
            ));

        if (p.phase == config.moon.fullmoon) {
            message = util.format(
                strings.announcements.phases.full, 
                getPhaseString(p.phase, 0)
            );
        }
        else {
            message = util.format(
                strings.announcements.phases.else, 
                getPhaseString(p.phase, 0)
            );
        }

        var job = new CronJob(date, function() {
                send(channelNameToID(config.options.channels.phases), message, true);
            }, function () {}, true);
        jobsPhases.push(job);
    });

    console.log(util.format(
        strings.debug.phases.done,
        jobsPhases.length
    ));
}

/*
 * Loads the brain data, or creates new.
 */
function loadBrain() {
    console.log(strings.debug.brain.start);

    channels.list.forEach(function(c) {
        if (brains[c.brain] == undefined) {
            brains[c.brain] = new jsmegahal(config.brain.markov, config.brain.default, config.brain.maxloop);
        }
        if (messages[c.brain] == undefined) {
            messages[c.brain] = [];
        }
    });
    console.log(util.format(
        strings.debug.brain.prog,
        brainProg,
        Object.keys(brains).length
    ));

    Object.keys(brains).forEach(function(b) {
        if (fs.existsSync(config.brain.path + b)) {
            if (config.brain.debug)
                console.log(util.format(
                    strings.debug.brain.old,
                    b
                ));
            openBrain(b);
            if (config.brain.debug)
                console.log(util.format(
                    strings.debug.brain.done,
                    b
                ));
        }
        else {
            saveBrain(b);
            console.log(util.format(
                strings.debug.brain.new,
                b
            ));
        }
    }); 

    loadBrainWait();
}

/*
 * Waits until all the brains were loaded.
 */
function loadBrainWait() {
    var counter = 0;
    Object.keys(brains).forEach(function(b) {
        if (brains[b].loaded)
            counter++;
    });

    if (counter > brainProg) {
        brainProg = counter;
        console.log(util.format(
            strings.debug.brain.prog,
            brainProg,
            Object.keys(brains).length
        ));        
    }

    if (counter == Object.keys(brains).length) {
        console.log(strings.debug.brain.end);
        loadBot();
    }
    else {
        setTimeout(function() {
            loadBrainWait();
        }, 100);
    }
}

/*
 * Opens brain data from a file.
 * @param  name  Name of the brain.
 */
function openBrain(name) {
    var path = config.brain.path + name;

    if (fs.existsSync(path)) {
        readline.createInterface({
            "input": fs.createReadStream(path),
            "terminal": false
        }).on("line", function(line) {
            if (config.brain.cleanbrain) {
                var newLine = cleanMessage(line);
                if (isMessageNotEmpty(newLine)) {
                    messages[name].push(newLine);
                    brains[name].addMass(newLine);
                }
            }
            else {
                messages[name].push(line);
                brains[name].addMass(line);
            }
        }).on("close", function() {
            brains[name].loaded = true;
        });
    }
}

/*
 * Loops to continuously save brain data.
 */
function loopBrainSave() {
    if (!rebooting)
        saveAllBrains();

    setTimeout(loopBrainSave, config.brain.saveloop * 1000);
}

/*
 * Saves all brain data.
 */
function saveAllBrains() {
    Object.keys(brains).forEach(function(b) {
        saveBrain(b);
    });
}

/*
 * Saves brain data to a file.
 * @param  name  Name of the brain.
 */
function saveBrain(name) {
    if (messages[name].length > config.brain.maxlines)
        messages[name].splice(0, messages[name].length - config.brain.maxlines);

    var path = config.brain.path + name;

    var file = fs.createWriteStream(path + ".new");

    file.on("error", function(err) {
        console.log(util.format(
            strings.debug.brain.error, 
            err
        ));
    });

    messages[name].forEach(function(m) {
        file.write(m + "\n", "utf-8");
    });

    file.end();

    brains[name].loaded = true;

    setTimeout(function() {
        fs.rename(path + ".new", path, function(e) {
        });        
    }, 1000);    
}

/*
 * Loads the seizure data, or creates new and then cleans it up.
 */
function loadSeizure() {
    var seizure = {};

    if (fs.existsSync(config.options.seizurepath)) {
        console.log(strings.debug.seizure.old);
        seizure = JSON.parse(fs.readFileSync(config.options.seizurepath, "utf8"));
        console.log(strings.debug.seizure.done);
    }
    else {
        fs.writeFileSync(config.options.seizurepath, JSON.stringify(seizure), "utf-8");
        console.log(strings.debug.seizure.new);
    }

    if (seizure.channel != undefined) {
        send(seizure.channel, strings.announcements.seizure.return, false);
    }

    seizure = {};
    fs.writeFileSync(config.options.seizurepath, JSON.stringify(seizure), "utf-8");
}




/********************
 * REST API REQUESTS
 ********************/

/*
 * Catches and processes the REST API requests.
 * @param  req  The request object, containing parameters.
 * @param  res  The returned result. 
 */
var processRequest = function(req, res) {
    if (req.method == "GET") {
        var query = url.parse(req.url, true).query;

        //console.log("Connection! " + res.socket.remoteAddress + " " + req.url);

        if (query.key == httpkey.key) {
            switch (query.action) {
                // Action requests
                case "power":  processReqPower(query);  break;
                case "motion": processReqMotion(query); break;
                case "boot":   processReqBoot(query);   break;
                case "eeg":    processReqEEG(query);    break;
                case "celly":  processReqCelly(query);  break;
                case "toggle": processReqToggle(query); break;
                case "state":  processReqState(query);  break;
                case "mood":   processReqMood(query);   break;
                case "camera": processReqCamera(query); break;
                case "stream": processReqStream(query); break;
                case "reboot": processReqReboot(query); break;
                case "reload": processReqReload(query); break;
                case "waifu":  processReqWaifu(query);  break;
                case "tush":   processReqTush(query);   break;
                // Data requests
                case "ping":   processResPing(res);   return; break;
                case "spools": processResSpools(res); return; break;
                case "l":      processResL(res);      return; break;
                case "lq":     processResLQ(res);     return; break;
                // JSON Rquests
                case "np":       processJsonNp(res);       return; break;
                case "lyrics":   processJsonLyrics(res);   return; break;
                case "storyart": processJsonStoryArt(res); return; break;
            }
        }
    }

    res.writeHead(200, [
        ["Content-Type", "text/plain"], 
        ["Content-Length", 0]
            ]);
    res.write("");
    
    res.end();
};

/*
 * Processes the "power" request.
 * @param  data  Request parameters.
 */
function processReqPower(query) {
    statusGlobal.sparkle = Math.floor((new Date()) / 1000);

    if (query.power == "on") {
        if (powerStatus != null && powerStatus != 0)            
            send(channelNameToID(config.options.channels.home), strings.announcements.power.on, false);
        powerStatus = 0;
    }
    else if (query.power == "off") {
        if (powerStatus == null || powerStatus == 0) {
            send(channelNameToID(config.options.channels.home), strings.announcements.power.off1, false);
            powerStatus = 1;
        }
        else if (powerStatus == 1) {
            send(channelNameToID(config.options.channels.home), strings.announcements.power.off2, false);
            powerStatus = 2;
        }
        else if (powerStatus == 2) {
            send(channelNameToID(config.options.channels.home), strings.announcements.power.off3, false);
            powerStatus = 3;

            var xhr = new XMLHttpRequest();
            xhr.open("GET", printer.baseurl + config.printer.urls.job + printer.key, true);

            xhr.onreadystatechange = function () { 
                if (xhr.readyState == 4 && xhr.status == 200) {
                    var response = JSON.parse(xhr.responseText);
                    if (response.progress.completion != null && response.state == "Printing") {
                        tushPaused = true;
                        console.log(strings.debug.printer.pause);
                        pausePrint(config.printer.pauseretry);

                        send(channelNameToID(config.options.channels.printer), util.format(
                            strings.announcements.power.print,
                            mention(config.options.adminid)
                        ), false);
                    }
                }
            }

            xhr.onerror = function(err) {
                send(data.channelID, strings.commands.printer.error, true);
                xhr.abort();
            }
            xhr.ontimeout = function() {
                send(data.channelID, strings.commands.printer.error, true);
                xhr.abort();
            }

            xhr.send();
        }
    }
}

/*
 * Processes the "motion" request.
 * @param  data  Request parameters.
 */
function processReqMotion(query) {
    send(channelNameToID(config.options.channels.home), util.format(
            strings.announcements.motion,
            query.camera
        ), false);
    download(query.snapshot + "&_signature=" + query._signature, config.options.motionimg, function() {
        console.log(strings.debug.download.stop);
        embed(channelNameToID(config.options.channels.home), "", config.options.motionimg, query.camera + " " + (new Date()) + ".jpg", false, false);
    }, function() {
        console.log(strings.debug.download.cancel);
    }, 0, false);
}

/*
 * Processes the "boot" request.
 * @param  data  Request parameters.
 */
function processReqBoot(query) {
    if (query.device != undefined) {
        var now = new Date();
        var momentTime = moment.tz(now, "UTC");
        send(channelNameToID(config.options.channels.debug), util.format(
                strings.announcements.boot,
                query.device,
                momentTime.format("ddd MMM DD, YYYY"),
                momentTime.format("HH:mm:ss (z)")
            ), false);
    }
}

/*
 * Processes the "eeg" request.
 * @param  data  Request parameters.
 */
function processReqEEG(query) {
    statusGlobal.lulu = Math.floor((new Date()) / 1000);

    var w;
    var alpha = parseFloat(1.0 / eegConfig.ema);

    eegValues = {};
    eegValues.waves = [];

    eegValuesEMA = {};
    eegValuesEMA.waves = [];

    // Basic Data
    eegValues.time = Math.floor((new Date()) / 1000);   
    eegValuesEMA.time = eegValues.time;

    eegValues.battery    = query.battery;
    eegValues.signal     = query.signal;

    // Raw Attention/Meditation
    eegValues.attention  = query.attention;
    eegValues.meditation = query.meditation;

    // Raw Waves
    for (w = 0; w <= 7; w++)
        eegValues.waves.push(query["wave" + w]);

    // Raw Averages
    eegValues.sumlow = 0;
    for (w = 0; w <= 3; w++)
        eegValues.sumlow += parseFloat(eegValues.waves[w]);

    eegValues.sumhigh = 0;
    for (w = 4; w <= 7; w++)
        eegValues.sumhigh += parseFloat(eegValues.waves[w]);


    if (eegInitial) {
        // EMA Attention/Meditation
        eegValuesEMA.attention  = eegValues.attention;
        eegValuesEMA.meditation = eegValues.meditation;

        // EMA Waves
        for (w = 0; w <= 7; w++)
            eegValuesEMA.waves.push(eegValues.waves[w]);
        eegInitial = false;
    }
    else {
        // EMA Attention/Meditation
        eegValuesEMA.attention  = alpha * eegValues.attention + (1.0 - alpha) * eegValuesEMAPrev.attention;
        eegValuesEMA.meditation = alpha * eegValues.meditation + (1.0 - alpha) * eegValuesEMAPrev.meditation;

        eegValuesEMA.waves = [];
        for (w = 0; w <= 7; w++)
            eegValuesEMA.waves.push(alpha * eegValues.waves[w] + (1.0 - alpha) * eegValuesEMAPrev.waves[w]);
    }

    // EMA Averages
    eegValuesEMA.sumlow = 0;
    for (w = 0; w <= 3; w++)
        eegValuesEMA.sumlow += parseFloat(eegValuesEMA.waves[w]);

    eegValuesEMA.sumhigh = 0;
    for (w = 4; w <= 7; w++)
        eegValuesEMA.sumhigh += parseFloat(eegValuesEMA.waves[w]);

    // Copy data to previous.
    eegValuesEMAPrev = JSON.parse(JSON.stringify(eegValuesEMA));
    
    // Push data to array if recording.
    if (eegRecording) {
        eegTable.push(eegValues);
        eegTableEMA.push(eegValuesEMA);
    }

    eegVaripassWrite();
}

/*
 * Processes the "celly" request.
 * @param  data  Request parameters.
 */
function processReqCelly(query) {
    delete query.key;
    delete query.action;

    var message = strings.misc.celly.messageA;
    Object.keys(query).forEach(function(q) {
        message += util.format(
            strings.misc.celly.messageB,
            q,
            query[q]
        );
    });
    message += strings.misc.celly.messageC;

    send(channelNameToID(config.options.channels.debug), message, false);
}

/*
 * Processes the "toggle" request.
 * @param  data  Request parameters.
 */
function processReqToggle(query) {
    if (query.bulbs != undefined) { 
        refreshTradfriDevices(function(result) {
            if (result) {
                var found = false;
                query.bulbs.split(",").forEach(function(b) {
                    tToggles.forEach(function(d) {       
                        if (d.name == b) {
                            hub.toggleDevice(d.id);
                            found = true;
                        }
                    });
                });
                if (found)
                    send(channelNameToID(config.options.channels.debug), strings.misc.voicetag + util.format(
                        strings.voice.toggle.message,
                        query.bulbs
                    ), false);
                else
                    send(channelNameToID(config.options.channels.debug), strings.misc.voicetag + strings.voice.toggle.error, false);
            }
            else {
                send(channelNameToID(config.options.channels.debug), strings.misc.voicetag + strings.misc.tradfrierror, false);                
            }
        });
    }
}

/*
 * Processes the "state" request.
 * @param  data  Request parameters.
 */
function processReqState(query) {
    if (query.bulbs != undefined && query.state != undefined) {
        refreshTradfriDevices(function(result) {
            if (result) {
                var found = false;
                query.bulbs.split(",").forEach(function(b) {
                    tToggles.forEach(function(d) {  
                        if (d.name == b) {
                            if (d.on == true && query.state == "off") {
                                hub.toggleDevice(d.id);
                                found = true;
                            }
                            else if (d.on == false && query.state == "on") {
                                hub.toggleDevice(d.id);
                                found = true;
                            }
                        }
                    });
                });
                if (found)
                    send(channelNameToID(config.options.channels.debug), strings.misc.voicetag + util.format(
                        strings.voice.state.message,
                        query.state,
                        query.bulbs
                    ), false);
                else
                    send(channelNameToID(config.options.channels.debug), strings.misc.voicetag + strings.voice.state.error, false);
            }
            else {
                send(channelNameToID(config.options.channels.debug), strings.misc.voicetag + strings.misc.tradfrierror, false);                
            }
        });
    }
}

/*
 * Processes the "mood" request.
 * @param  data  Request parameters.
 */
function processReqMood(query) {
    if (query.mood != undefined) {
        var found = false;
        var result = false;
        tradfri.moods.forEach(function(m) {     
            if (m.name == query.mood) {
                setMood(m.name, function(result) {
                    if (result)
                        send(channelNameToID(config.options.channels.debug), strings.misc.voicetag + util.format(
                            strings.commands.mood.messageC,
                            query.mood
                        ), false);
                    else
                        send(channelNameToID(config.options.channels.debug), strings.misc.voicetag + strings.misc.tradfrierror, false);
                });
                found = true;
            }
        });
        if (!found) {
            send(channelNameToID(config.options.channels.debug), strings.misc.voicetag + strings.commands.mood.error, false);
        }
    }
}

/*
 * Processes the "camera" request.
 * @param  data  Request parameters.
 */
function processReqCamera(query) {
    if (query.state != undefined) {
        if (query.state == "on") {
            if (query.camera == httpkey.camera) {
                exec("sudo /home/luna/mjpg-streamer_norm.sh start");
                send(channelNameToID(config.options.channels.debug), strings.misc.voicetag + strings.commands.camera.messageA, false);
            }
            else
                send(channelNameToID(config.options.channels.debug), strings.misc.voicetag + strings.voice.camera.error, false);
        }
        else if (query.state == "off") {
            if (query.camera == httpkey.camera) {
                exec("sudo /home/luna/mjpg-streamer_norm.sh stop");
                send(channelNameToID(config.options.channels.debug), strings.misc.voicetag + strings.commands.camera.messageB, false);
            }
            else
                send(channelNameToID(config.options.channels.debug), strings.misc.voicetag + strings.voice.camera.error, false);
        }
        else
            send(channelNameToID(config.options.channels.debug), strings.misc.voicetag + strings.commands.camera.error, false);
    }
    else if (query.device != undefined && query.response != undefined) {
        if (query.response == "on" || query.response == "off") {
            send(channelNameToID(config.options.channels.debug), util.format(
                strings.announcements.camera,
                query.device,
                query.response
            ), true);
        }
    }
}

/*
 * Processes the "strean" request.
 * @param  data  Request parameters.
 */
function processReqStream(query) {
    if (query.state != undefined) {
        if (query.state == "start") {
            if (query.stream == httpkey.stream) {
                exec("sudo -H -u luna bash -c \"/usr/bin/tmux new-session -d -s live '/home/luna/live.sh'\"");
                send(channelNameToID(config.options.channels.debug), strings.misc.voicetag + strings.commands.stream.messageA, false);
            }
            else
                send(channelNameToID(config.options.channels.debug), strings.misc.voicetag + strings.voice.stream.error, false);
        }
        else if (query.state == "stop") {
            if (query.stream == httpkey.stream) {
                exec("sudo -H -u luna bash -c \"/usr/bin/tmux kill-session -t live\"");
                send(channelNameToID(config.options.channels.debug), strings.misc.voicetag + strings.commands.stream.messageB, false);
            }
            else
                send(channelNameToID(config.options.channels.debug), strings.misc.voicetag + strings.voice.stream.error, false);
        }
        else
            send(channelNameToID(config.options.channels.debug), strings.misc.voicetag + strings.commands.stream.error, false);
    }
}

/*
 * Processes the "reboot" request.
 * @param  data  Request parameters.
 */
function processReqReboot(query) {
    if (query.reboot != undefined) {
        if (query.reboot == httpkey.reboot) {
            Object.keys(nptoggles).forEach(function(n, i) {
                if (nptoggles[n])
                    send(n, strings.announcements.npreboot, true);
            });
            send(channelNameToID(config.options.channels.debug), strings.misc.voicetag + strings.commands.reboot.message, false);

            saveAllBrains();
            blitzorws.close();

            setTimeout(function() {
                printStopMessage();
                process.exit();
            }, config.options.reboottime * 1000);

            rebooting = true;
        }
        else
            send(channelNameToID(config.options.channels.debug), strings.misc.voicetag + strings.voice.reboot.error, false);
    }
}

/*
 * Processes the "reload" request.
 * @param  data  Request parameters.
 */
function processReqReload(query) {    
    reloadConfig();
    send(channelNameToID(config.options.channels.debug), strings.misc.voicetag + strings.commands.reload.message, false);
}

/*
 * Processes the "waifu" request.
 * @param  data  Request parameters.
 */
function processReqWaifu(query) {
    if (query.url != undefined && query.channelid != undefined && query.userid != undefined && query.time != undefined && query.size != undefined) {
        send(query.channelid, util.format(
            strings.misc.ann.waifu.message,
            mention(query.userid),
            query.time,
            query.size,
            query.url
        ), true);
    }
    else if (query.error != undefined && query.channelid != undefined && query.userid != undefined) {
        send(query.channelid, util.format(
            strings.misc.ann.waifu.errorA,
            mention(query.userid)
        ), true);
        send(channelNameToID(config.options.channels.debug), util.format(
            strings.misc.ann.waifu.errorB,
            mention(config.options.adminid)
        ), true);       
    }
    else if (query.toobig != undefined && query.channelid != undefined && query.userid != undefined) {
        send(query.channelid, util.format(
            strings.misc.ann.waifu.toobig,
            mention(query.userid)
        ), true);     
    }
    else if (query.queue != undefined && query.channelid != undefined && query.userid != undefined) {
        send(query.channelid, util.format(
            strings.misc.ann.waifu.queue,
            mention(query.userid),
            query.queue
        ), true);
    }
}

/*
 * Processes the "tush" request.
 * @param  data  Request parameters.
 */
function processReqTush(query) {
    if (query.tush != undefined) {
        if (query.tush == httpkey.tush) {
            if (query.encL != undefined && query.encR != undefined && query.weight != undefined && query.raw != undefined) {
                statusGlobal.raritush = Math.floor((new Date()) / 1000);

                var tempEncL = parseInt(query.encL);
                var tempEncR = parseInt(query.encR);
                var tempWeight = parseFloat(query.weight);
                var tempRaw = parseFloat(query.raw);

                var xhr = new XMLHttpRequest();
                xhr.open("GET", printer.baseurl + config.printer.urls.printer + printer.key, true);

                xhr.onreadystatechange = function () { 
                    if (xhr.readyState == 4 && xhr.status == 200) {
                        var response = JSON.parse(xhr.responseText);

                        if (response.state.text == "Printing" && 
                            response.temperature.tool0.target > config.printer.constraints.tempmin && 
                            response.temperature.tool0.actual > response.temperature.tool0.target - config.printer.constraints.tempdiff) {
                            if (tushStep >= config.printer.constraints.rampup) {

                                // Spool Drop - Warn
                                if (tushRaw > config.printer.detections.spooldrop.threshold_weight) {
                                    if (tempRaw <= config.printer.detections.spooldrop.threshold_weight) {
                                        send(channelNameToID(config.options.channels.printer), util.format(
                                            strings.announcements.tush.spooldrop.warn,
                                            mention(config.options.adminid),
                                            tempRaw,
                                            config.printer.interval
                                        ), true);

                                        setMood("warn", function(result) {
                                            if (!result)
                                                send(channelNameToID(config.options.channels.printer), strings.misc.tradfrierror, false);    
                                        });
                                    }

                                    // Spool Stop - Warn
                                    else if (tushEncL + tushEncR > config.printer.detections.spoolstop.threshold_count) {
                                        if (tempEncL + tempEncR <= config.printer.detections.spoolstop.threshold_count) {
                                            send(channelNameToID(config.options.channels.printer), util.format(
                                                strings.announcements.tush.spoolstop.warn,
                                                mention(config.options.adminid),
                                                tempEncL + tempEncR,
                                                config.printer.interval
                                            ), true);

                                            setMood("warn", function(result) {
                                                if (!result)
                                                    send(channelNameToID(config.options.channels.printer), strings.misc.tradfrierror, false);    
                                            });
                                        }
                                    }

                                    else if (tushEncL + tushEncR <= config.printer.detections.spoolstop.threshold_count) {

                                        // Spool Stop - Stop
                                        if (tempEncL + tempEncR <= config.printer.detections.spoolstop.threshold_count) {
                                            if (!tushPaused) {
                                                // PERFORM PAUSE
                                                tushPaused = true;
                                                console.log(strings.debug.printer.pause);
                                                pausePrint(config.printer.pauseretry);

                                                send(channelNameToID(config.options.channels.printer), util.format(
                                                    strings.announcements.tush.spoolstop.stop,
                                                    mention(config.options.adminid)
                                                ), true);
                                            }
                                        }
                                        // Spool Stop - Okay
                                        else {
                                            tushPaused = false;

                                            send(channelNameToID(config.options.channels.printer), util.format(
                                                strings.announcements.tush.spoolstop.okay,
                                                mention(config.options.adminid),
                                                tempEncL + tempEncR
                                            ), true);

                                            setMood("norm", function(result) {
                                                if (!result)
                                                    send(channelNameToID(config.options.channels.printer), strings.misc.tradfrierror, false);    
                                            });
                                        }
                                    }  
                                }

                                else if (tushRaw <= config.printer.detections.spooldrop.threshold_weight) {

                                    // Spool Drop - Stop
                                    if (tempRaw <= config.printer.detections.spooldrop.threshold_weight) {
                                        if (!tushPaused) {

                                            // PERFORM PAUSE
                                            tushPaused = true;
                                            console.log(strings.debug.printer.pause);
                                            pausePrint(config.printer.pauseretry);

                                            send(channelNameToID(config.options.channels.printer), util.format(
                                                strings.announcements.tush.spooldrop.stop,
                                                mention(config.options.adminid)
                                            ), true);
                                        }
                                    }
                                    // Spool Drop - Okay
                                    else {
                                        tushPaused = false;

                                        send(channelNameToID(config.options.channels.printer), util.format(
                                            strings.announcements.tush.spooldrop.okay,
                                            mention(config.options.adminid),
                                            tempRaw
                                        ), true);

                                        setMood("norm", function(result) {
                                            if (!result)
                                                send(channelNameToID(config.options.channels.printer), strings.misc.tradfrierror, false);    
                                        });
                                    }
                                }               
                            }
                            else {
                                if (tushStep == 0) {
                                    tushStart = Math.floor((new Date()) / 1000);
                                    send(channelNameToID(config.options.channels.printer), strings.announcements.tush.start, false);  
                                }
                                tushStep++;
                                if (tushStep >= config.printer.constraints.rampup)
                                    console.log(util.format(
                                        strings.debug.printer.rampB,
                                        tushStep
                                    ));
                                else
                                    console.log(util.format(
                                        strings.debug.printer.rampA,
                                        tushStep
                                    ));
                            }
                        }
                        else {
                            if (!tushPaused) {
                                if (tushStep > 0)
                                    finishPrint(); 
                                tushStep = 0;                               
                            }
                        }
                    }

                    if (xhr.readyState == 4) {
                        if (xhr.status != 200 && !tushPaused) {
                            if (tushStep > 0)
                                finishPrint();
                            tushStep = 0;
                        }

                        if (!tushPaused) {
                            tushEncL = tempEncL;
                            tushEncR = tempEncR;
                            tushWeight = tempWeight;
                            tushRaw = tempRaw;
                        }

                        if (tushEncL != undefined && tushEncR != undefined) {
                            writeVariPass(varipass.main.key, varipass.main.ids.enc, tushEncL + tushEncR);
                        }
                        if (tushWeight != undefined) {
                            writeVariPass(varipass.main.key, varipass.main.ids.weight, tushWeight);
                        }
                    }
                }

                xhr.onerror = function(err) {
                    xhr.abort();
                }
                xhr.ontimeout = function() {
                    xhr.abort();
                }

                xhr.send();
            }
        }
    }
}

/*
 * Responds to the "ping" request.
 * @param  res  The response object.
 */
function processResPing(res) {
    res.writeHead(200, [
        ["Content-Type", "text/plain"], 
        ["Content-Length", 4]
            ]);
    res.write("pong");
    
    res.end();
}

/*
 * Responds to the "spools" request.
 * @param  res  The response object.
 */
function processResSpools(res) {
    var spools = Object.keys(spool).length.toString();

    Object.keys(spool).sort().forEach(function(s) {
        spools += "|" + s + "|" + spool[s];
    });

    res.writeHead(200, [
        ["Content-Type", "text/plain"], 
        ["Content-Length", spools.length]
            ]);
    res.write(spools);
    
    res.end();
}

/*
 * Responds to the "l" request.
 * @param  res  The response object.
 */
function processResL(res) {
    statusGlobal.exclaml = Math.floor((new Date()) / 1000);

    var response = "no_lyrics";
    if (lyrics[np.nowplaying] != undefined) {
        response = "success";

        isShowingLyrics = true;
        Object.keys(nptoggles).forEach(function(n, i) {
            if (nptoggles[n])
                sendLarge(n, lyrics[np.nowplaying].split("\n"), strings.commands.l.messageB, true);
        });
    }

    res.writeHead(200, [
        ["Content-Type", "text/plain"], 
        ["Content-Length", response.length]
            ]);
    res.write(response);
    
    res.end();
}

/*
 * Responds to the "lq" request.
 * @param  res  The response object.
 */
function processResLQ(res) {
    statusGlobal.exclaml = Math.floor((new Date()) / 1000);

    var response = "false"
    if (lyrics[np.nowplaying] != undefined)
        response = "true";

    response += "|" + np.nowplaying;

    res.writeHead(200, [
        ["Content-Type", "text/plain charset=UTF-8"], 
        ["Content-Length", Buffer.byteLength(response, "utf8")]
            ]);
    res.write(response);
    
    res.end();
}

/*
 * Responds to the "np" request.
 * @param  res  The response object.
 */
function processJsonNp(res) {
    statusGlobal.overlay_np = Math.floor((new Date()) / 1000);

    var json = JSON.stringify(npover);

    res.writeHead(200, [
        ["Access-Control-Allow-Origin", "*"],
        ["Content-Type", "application/json; charset=UTF-8"],
        ["Content-Length", Buffer.byteLength(json, "utf8")]
            ]);
    res.write(json);
    
    res.end();
}

/*
 * Responds to the "lyrics" request.
 * @param  res  The response object.
 */
function processJsonLyrics(res) {
    statusGlobal.overlay_lyrics = Math.floor((new Date()) / 1000);

    var data = {}
    if(isShowingLyrics) {
        if (lyrics[np.nowplaying] != undefined)
            data.lyrics = lyrics[np.nowplaying].split("\n");
        else
            data.lyrics = [];
    }
    else {
        data.lyrics = [];
    }

    var json = JSON.stringify(data);

    res.writeHead(200, [
        ["Access-Control-Allow-Origin", "*"],
        ["Content-Type", "application/json; charset=UTF-8"],
        ["Content-Length", Buffer.byteLength(json, "utf8")]
            ]);
    res.write(json);
    
    res.end();
}

/*
 * Responds to the "storyart" request.
 * @param  res  The response object.
 */
function processJsonStoryArt(res) {
    statusGlobal.overlay_storyart = Math.floor((new Date()) / 1000);

    var data = {}

    if(isShowingStory) {
        if (story[np.nowplaying] != undefined)
            data.story = story[np.nowplaying].split("\n");
        else
            data.story = [];
    }
    else {
        data.story = [];
    }

    if(isShowingArt) {
        if (art[np.nowplaying] != undefined)
            data.art = art[np.nowplaying];
        else
            data.art = "";
    }
    else {
        data.art = "";
    }

    var json = JSON.stringify(data);

    res.writeHead(200, [
        ["Access-Control-Allow-Origin", "*"],
        ["Content-Type", "application/json; charset=UTF-8"],
        ["Content-Length", Buffer.byteLength(json, "utf8")]
            ]);
    res.write(json);
    
    res.end();
}



/************************
 * DISCORD FUNCTIONALITY
 ************************/

/*
 * Loads the Discord bot.
 */
function loadBot() {

    bot = new Discord.Client({
        "token": token.value,
        "autorun": true
    });
     
    bot.on("ready", function() {
        reconnectTime = 0;
        bot.setPresence({
            "game": {
                "name": config.options.game
            }
        });
        if (!discordReqReconnect) {
            console.log(util.format(
                strings.debug.join,
                bot.username,
                bot.id
            ));
        }
        else {
            discordReqReconnect = false;
            console.log(strings.debug.reconnect);
        }
        if (!started) {
            started = true;
            send(channelNameToID(config.options.channels.debug), util.format(
                strings.misc.load,
                package.version
            ), false);

            Object.keys(nptoggles).forEach(function(n, i) {
                if (nptoggles[n])
                    send(n, strings.announcements.npback, true);
            });

            loadServer();
            loadSeizure();
            connectBlitzortung(false);
            startSeizmoServer();

            loopLightning();
            loopNowPlaying();
            //loopCorona();
            loopStatusPull();
            loopStatusPush();
            setTimeout(loopBrainSave, config.brain.saveloop * 1000);

            prepareReactroleMessages();
            updateTalosMeets();
            checkTradfriBatteries();
        }
    });

    bot.on("guildMemberAdd", function(user) {
        if (user.guild_id == config.options.serverid) {
            console.log(util.format(
                strings.debug.welcome,
                user.username
            ));
            send(channelNameToID(config.options.channels.welcome), util.format(
                strings.misc.welcome,
                mention(user.id)
            ), true);
            bot.addToRole( {
                "serverID": user.guild_id,
                "userID": user.id,
                "roleID": config.options.roleid
            }, function(err, response) {
                if (err) 
                    console.error(util.format(
                        strings.debug.welcomefail, 
                        err
                    ));
            });
        }
    });

    bot.on("message", function(user, userID, channelID, message, data) {

        config.autoreact.channels.forEach(function(c, i) {
            if (c == channelID)
                react(channelID, data.d.id, config.autoreact.reacts[i]);
        });

        config.options.channels.autopublish.forEach(function(c, i) {
            if (channelNameToID(c) == channelID) {
                console.log(util.format(
                    strings.debug.autopublish,
                    channelIDToName(channelID)
                ));
                var msg = {
                    "channelID": channelID,
                    "messageID": data.d.id
                };
                bot.publishMessage(msg);
            }
        });

        if (message[0] == config.options.commandsymbol) {

            var nocommand = true;
            var command = message.split("\n")[0];
            command = command.split(" ")[0];
            var lower = command.toLowerCase();

            var packed = {};
            packed.user      = user;
            packed.userID    = userID;
            packed.channelID = channelID;
            packed.message   = message;
            packed.data      = data;
            packed.command   = command.replace(config.options.commandsymbol, "");

            commands.list.forEach(function(c) {
                if (lower == config.options.commandsymbol + c.command && nocommand) {
                    // Private commands
                    if (c.type == "private") {
                        if (userID == config.options.adminid) {
                            comm[c.command](packed);
                            nocommand = false;
                        }
                        else {
                            send(channelID, util.format(
                                strings.misc.noadmin,
                                mention(userID)
                            ), true);
                            nocommand = false;
                        }
                    }
                    // DJ only commands
                    else if (c.type == "dj") {
                        var roleFound = false;

                        if (userID == config.options.adminid)
                            roleFound = true;

                        if (!roleFound && data.d != undefined) {
                            if (data.d.member != undefined) {
                                if (data.d.member.roles != undefined) {
                                    data.d.member.roles.forEach(function (r1, i) {
                                        config.options.djroles.forEach(function (r2, j) {
                                            if (r1 == r2) {
                                                roleFound = true;
                                            }
                                        });
                                    });
                                }
                            }
                            else {
                                if (lower == config.options.commandsymbol + "npt")
                                    roleFound = true;
                            }
                        }

                        if (roleFound) {
                            comm[c.command](packed);
                            nocommand = false;          
                        }
                        else {
                            send(channelID, util.format(
                                strings.misc.noperm,
                                mention(userID)
                            ), true);
                        }
                    }
                    // Interractions
                    else if (c.type == "interraction") {
                        doInterraction(packed);
                        nocommand = false;
                    }
                    // Other commands
                    else {
                        comm[c.command](packed);
                        nocommand = false;
                    }
                }
            });

            // Custom interractions
            custom.list.forEach(function(c, i) {
                if (lower == config.options.commandsymbol + c.command && nocommand) {
                    // Server filtering
                    if (bot.channels[channelID] != undefined) {
                        c.servers.forEach(function(s) {
                            if (bot.channels[channelID].guild_id == s && nocommand) {
                                doInterractionCustom(packed, i);
                                nocommand = false;
                            }
                        });
                    }
                    // Channel filtering
                    c.channels.forEach(function(s) {
                        if (channelIDToName(channelID) == s && nocommand) {
                            doInterractionCustom(packed, i);
                            nocommand = false;
                        }
                    });
                }
            });
        }
        else {
            if (message == "h")
                h(channelID);

            // Clean up the message.
            var newMessage = cleanMessage(message);

            // When the bot is mentioned.
            if (isMentioned(bot.id, data)) {
                console.log(util.format(
                    strings.debug.chatting,
                    user,
                    channelIDToName(channelID),
                    message
                ));

                if (config.seizure.enabled) {
                    process.on('uncaughtException', function (e) {                  
                        seizureReboot(channelID, userID, message);
                    });

                    tripwire.resetTripwire(config.seizure.timeout * 1000);
                }

                if (config.seizure.debug && newMessage == config.seizure.force)
                    while (true) {}

                var genMessage = completeRoleplay(brains[channelIDToBrain(channelID)].getReplyFromSentence(newMessage));
                send(channelID, mention(userID) + " " + genMessage, true);

                if (config.seizure.enabled) {
                    tripwire.clearTripwire();
                    process.removeAllListeners();
                }
            }
            // All other messages.
            if (data.d.author.id != bot.id && processWhitelist(channelID) && processBlacklist(userID) && processIgnore(userID) && isMessageNotEmpty(newMessage)) {

                if (config.seizure.enabled) {
                    process.on('uncaughtException', function (e) {                  
                        seizureReboot(channelID, userID, message);
                    });

                    tripwire.resetTripwire(config.seizure.timeout * 1000);
                }

                if (config.seizure.debug && newMessage == config.seizure.force)
                    while (true) {}

                brains[channelIDToBrain(channelID)].addMass(newMessage);
                messages[channelIDToBrain(channelID)].push(newMessage);

                if (config.seizure.enabled) {
                    tripwire.clearTripwire();
                    process.removeAllListeners();
                }
            }
        }
    });

    bot.on("messageReactionAdd", function(data) {
        if (data.d.user_id != bot.id) {
            reactrole.mapping.forEach(function(m) {
                if (channelNameToID(m.channel) == data.d.channel_id && m.message == data.d.message_id) {
                    Object.keys(m.map).forEach(function (r) {
                        var clean = r.substring(2, r.length - 1);
                        var parts = clean.split(":");
                        if (parts[1] === "")
                            parts[1] = null;
                        if (data.d.emoji.name === parts[0] && data.d.emoji.id === parts[1]) {
                            bot.addToRole( {
                                "serverID": data.d.guild_id,
                                "userID": data.d.user_id,
                                "roleID": m.map[r]
                            }, function(err, response) {
                                bot.createDMChannel(data.d.user_id, function(){});
                                if (err) {
                                    console.error(util.format(
                                        strings.debug.reactrolefail, 
                                        m.map[r],
                                        data.d.guild_id
                                    ));
                                    send(data.d.user_id, util.format(
                                        strings.misc.reactrole.error,
                                        mention(data.d.user_id)
                                    ), false);
                                }
                                else {
                                    send(data.d.user_id, util.format(
                                        strings.misc.reactrole.add,
                                        mention(data.d.user_id)
                                    ), false);
                                }
                            });
                        }
                    });                
                }
            });
        }
    });

    bot.on("messageReactionRemove", function(data) {
        if (data.d.user_id != bot.id) {
            reactrole.mapping.forEach(function(m) {
                if (channelNameToID(m.channel) == data.d.channel_id && m.message == data.d.message_id) {
                    Object.keys(m.map).forEach(function (r) {
                        var clean = r.substring(2, r.length - 1);
                        var parts = clean.split(":");
                        if (parts[1] === "")
                            parts[1] = null;
                        if (data.d.emoji.name === parts[0] && data.d.emoji.id === parts[1]) {
                            bot.removeFromRole( {
                                "serverID": data.d.guild_id,
                                "userID": data.d.user_id,
                                "roleID": m.map[r]
                            }, function(err, response) {
                                bot.createDMChannel(data.d.user_id, function(){});
                                if (err) {
                                    console.error(util.format(
                                        strings.debug.reactrolefail, 
                                        m.map[r],
                                        data.d.guild_id
                                    ));
                                    send(data.d.user_id, util.format(
                                        strings.misc.reactrole.error,
                                        mention(data.d.user_id)
                                    ), false);
                                }
                                else {
                                    send(data.d.user_id, util.format(
                                        strings.misc.reactrole.remove,
                                        mention(data.d.user_id)
                                    ), false);
                                }
                            });
                        }
                    });
                }
            });
        }
    });

    bot.on("disconnect", function(erMsg, code) {
        if (erMsg != config.options.reconnectmsg) {            
            console.error(util.format(
                    strings.debug.disconnected,
                    erMsg
                ));
        }
        else {
            discordReqReconnect = true;
        }
        if (reconnectTime < config.options.reconnectmax) {
            reconnectTime += config.options.reconnecttime;
            if (discordReqReconnect) {
                bot.connect();
            }
            else {
                // Wait for reconnect to prevent spamming.
                setTimeout(function() {
                    bot.connect();
                }, config.options.reconnecttime * 1000);
            }
        }
        else {
            rebooting = true;
            console.log(util.format(
                strings.debug.fullreconnect,
                reconnectTime
            ));

            saveAllBrains();
            blitzorws.close();

            setTimeout(function() {
                printStopMessage();
                process.exit();
            }, config.options.reboottime * 1000);
        }    
    });
}

/*
 * Sends a message to a channel on Discord.
 * @param  id       ID of the channel to send to.
 * @param  message  String message to send.
 * @param  typing   Whether the typing delay should be added.
 */
function send(id, message, typing, retry=0) {
    if (retry < config.options.sendretry) {
        if (message.length <= config.options.maxlength) {

            var channel = channelIDToName(id);
            var msg = {
                "to": id,
                "message": message
            };

            if (typing) {
                bot.simulateTyping(id);
                setTimeout(function() {
                    console.log(util.format(
                        strings.debug.message,
                        channel,
                        message
                    ));
                    bot.sendMessage(msg, function(err) {
                        if (err != undefined) {
                            retry++;
                            if (err.response.code != undefined && err.response.code == 50007) {
                                console.log(strings.debug.failoff);
                            }
                            else {
                                console.log(err);
                                console.log(strings.debug.failedm);
                                setTimeout(function() {
                                    send(id, message, typing, retry);
                                }, 1000);
                            }
                        }
                    });
                }, config.options.typetime * 1000); 
            }
            else {
                console.log(util.format(
                    strings.debug.message,
                    channel,
                    message
                ));
                bot.sendMessage(msg, function(err) {
                    if (err != undefined) {
                        retry++;
                        if (err.response.code != undefined && err.response.code == 50007) {
                            console.log(strings.debug.failoff);
                        }
                        else {
                            console.log(err);
                            console.log(strings.debug.failedm);
                            setTimeout(function() {
                                send(id, message, typing, retry);
                            }, 1000);
                        }
                    }
                });
            }
        }
        else {
            send(id, strings.misc.toolong, typing);
        }
    }
    else {
        console.log(strings.debug.failgiveup);
    }
};

/*
 * Sends a large message to some chat using multiple messages. Used for lyrics and lists.
 * @param  id       Data of the message.
 * @param  list     List to be sent.
 * @param  message  Initial message string.
 * @param  format   Whether lyrics formatting should be used.
 */
function sendLarge(id, list, message, format) {

    var length = message.length;
    var multi = [];

    list.forEach(function(l, i) {
        var line = l;
        if (format && line.length > 0) {
            while (line[line.length - 1] == " ")
                line = line.slice(0, -1);
            line = config.options.lyricformat + line + config.options.lyricformat;
        }
        line += "\n";

        if (length + line.length >= config.options.maxlength) {
            multi.push(message);
            length = line.length;
            message = line;
        }
        else {
            length += line.length;
            message += line;
        }
    });

    if (message != "")
        multi.push(message);

    multi.forEach(function(m, i){
        setTimeout(function() {
            send(id, m, true);
        }, i * 1000);           
    });
};

/*
 * Sends a message with image to a channel on Discord.
 * @param  id        ID of the channel to send to.
 * @param  message   String message to send.
 * @param  file      Path to the image file.
 * @param  filename  Name of the image as seeon on Discord.
 * @param  typing    Whether the typing delay should be added.
 * @param  del       Whether the file will be deleted after embedding.
 */
function embed(id, message, file, filename, typing, del) {
    var channel = channelIDToName(id);

    var msg = {
        "to": id,
        "file": file,
        "filename": filename,
        "message": message
    };

    if (typing) {
        setTimeout(function() {
            console.log(util.format(
                strings.debug.embed,
                channel,
                message,
                msg.filename,
                msg.file
            ));
            bot.uploadFile(msg);

            if (del && fs.existsSync(file)) {
                fs.unlinkSync(file);
            }
        }, config.options.typetime * 1000); 
    }
    else {
        console.log(util.format(
            strings.debug.embed,
            channel,
            message,
            msg.filename,
            msg.file
        ));
        bot.uploadFile(msg);

        if (del && fs.existsSync(file)) {
            fs.unlinkSync(file);
        }   
    }
};

/*
 * Edits an existing message in a channel on Discord.
 * @param  chaId    ID of the channel message is in.
 * @param  msgId    ID of the message to edit.
 * @param  message  New string for the message.
 * @param  typing   Whether the typing delay should be added.
 */
function edit(chaId, msgId, message, typing, retry=0) {
    if (retry < config.options.sendretry) {
        if (message.length <= config.options.maxlength) {

            var channel = channelIDToName(chaId);
            var msg = {
                "channelID": chaId,
                "messageID": msgId,
                "message": message
            };

            if (typing) {
                bot.simulateTyping(chaId);
                setTimeout(function() {
                    console.log(util.format(
                        strings.debug.edit,
                        channel,
                        message
                    ));
                    bot.editMessage(msg, function(err) {
                        if (err != undefined) {
                            retry++;
                            console.log(err)
                            console.log(strings.debug.failede);
                            setTimeout(function() {
                                edit(chaId, msgId, message, typing, retry);
                            }, 1000);
                        }
                    });
                }, config.options.typetime * 1000); 
            }
            else {
                console.log(util.format(
                    strings.debug.edit,
                    channel,
                    message
                ));
                bot.editMessage(msg, function(err) {
                    if (err != undefined) {
                        retry++;
                        console.log(err)
                        console.log(strings.debug.failede);
                        setTimeout(function() {
                            edit(chaId, msgId, message, typing, retry);
                        }, 1000);
                    }
                });
            }
        }
        else {
            console.log(strings.debug.faillong);
        }
    }
    else {
        console.log(strings.debug.failgiveup);
    }

};

/*
 * Adds a reaction to a message on Discord.
 * @param  channelID   ID of the channel.
 * @param  messageID   ID of the message.
 * @param  reaction    String of the react to use.
 * @param  useUnicode  Whether unicode emoji is to be used.
 */
function react(channelID, messageID, reaction) {
    var clean = reaction.substring(2, reaction.length - 1);
    if (clean.split(":")[1] === "")
        clean = reaction.substring(2, reaction.length - 2);
    var input = {
        "channelID": channelID,
        "messageID": messageID,
        "reaction": clean
    };

    bot.addReaction(input, function(err) {
        if (err != undefined) {
            console.log(strings.debug.failedr);
            react(channelID, messageID, reaction);
        }
    });
};

/*
 * Executes an interraction command on one person or more people.
 * @param  data  Data of the message.
 */
function doInterraction(data) {
    data.command = data.command.toLowerCase();
    if (!isplushie) {
        if (data.data.d.mentions[0] != null) {
            if (isMentioned(bot.id, data.data) && data.data.d.mentions.length == 1) {
                if (data.command == "unplushie") {
                    send(data.channelID, strings.commands[data.command].error, true);
                }
                else {
                    if (data.command == "plushie")
                        isplushie = true;

                    if (data.command == "socks") {
                        send(data.channelID, util.format(
                            strings.commands[data.command].self,
                            generateSock()
                        ), true);
                    }
                    else {
                        send(data.channelID, strings.commands[data.command].self, true);
                    }
                }
            }
            else {
                for (i = 0; i < data.data.d.mentions.length; i++)
                    if (bot.id == data.data.d.mentions[i].id)
                        data.data.d.mentions.splice(i, 1);

                if (data.data.d.mentions.length <= 1) {
                    if (data.command == "socks") {
                        send(data.channelID, util.format(
                            strings.commands[data.command].single,
                            mention(data.data.d.mentions[0].id),
                            generateSock()
                        ), true);                       
                    }
                    else {
                        send(data.channelID, util.format(
                            strings.commands[data.command].single, 
                            mention(data.data.d.mentions[0].id)
                        ), true);
                    }
                }
                else {
                    var mentions = "";
                    var i;
                    for (i = 0; i < data.data.d.mentions.length - 1; i++) {
                        mentions += mention(data.data.d.mentions[i].id);
                        if (i < data.data.d.mentions.length - 2) {
                            mentions += config.separators.list;
                        }
                    }
                    mentions += config.separators.lend + mention(data.data.d.mentions[i].id);

                    if (data.command == "socks") {
                        send(data.channelID, util.format(
                            strings.commands[data.command].multiple,
                            generateSocks(data.data.d.mentions.length),
                            mentions
                        ), true);
                    }
                    else {
                        send(data.channelID, util.format(
                            strings.commands[data.command].multiple,
                            mentions
                        ), true);
                    }
                }
            }
        }
        else {
            if (data.command == "socks") {
                send(data.channelID, util.format(
                    strings.commands[data.command].single,
                    mention(data.userID),
                    generateSock()
                ), true);
            }
            else {
                send(data.channelID, util.format(
                    strings.commands[data.command].single, 
                    mention(data.userID)
                ), true);
            }
        }
    }
    else {
        if (data.command == "unplushie" && isMentioned(bot.id, data.data)) {
            isplushie = false;
            send(data.channelID, util.format(
                strings.commands[data.command].self, 
                mention(data.userID)
            ), true);
        }
        else
            send(data.channelID, strings.commands["plushie"].error, true);
    }
};

/*
 * Executes a custom interraction command on one person or more people.
 * @param  data  Data of the message.
 * @param  index Index of the command.
 */
function doInterractionCustom(data, index) {
    if (!isplushie) {
        if (data.data.d.mentions[0] != null) {
            if (isMentioned(bot.id, data.data) && data.data.d.mentions.length == 1) {
                send(data.channelID, custom.list[index].strings.self, true);
            }
            else {
                for (i = 0; i < data.data.d.mentions.length; i++)
                    if (bot.id == data.data.d.mentions[i].id)
                        data.data.d.mentions.splice(i, 1);

                if (data.data.d.mentions.length <= 1) {
                    send(data.channelID, util.format(
                        custom.list[index].strings.single, 
                        mention(data.data.d.mentions[0].id)
                    ), true);
                }
                else {
                    var mentions = "";
                    var i;
                    for (i = 0; i < data.data.d.mentions.length - 1; i++) {
                        mentions += mention(data.data.d.mentions[i].id);
                        if (i < data.data.d.mentions.length - 2) {
                            mentions += config.separators.list;
                        }
                    }
                    mentions += config.separators.lend + mention(data.data.d.mentions[i].id);

                    send(data.channelID, util.format(
                        custom.list[index].strings.multiple,
                        mentions
                    ), true);
                }
            }
        }
        else {
            send(data.channelID, util.format(
                custom.list[index].strings.single, 
                mention(data.userID)
            ), true);
        }
    }
    else {
        send(data.channelID, strings.commands["plushie"].error, true);
    }
};

/*
 * Loads specific reactrole messages into cache.
 */
function prepareReactroleMessages() {
    reactrole.mapping.forEach(function(m) {
        var message = {};
        message.channelID = channelNameToID(m.channel);
        message.messageID = m.message;

        bot.getMessage(message, function(err, msg) {
            if (msg != undefined) {
                var i = 0;
                Object.keys(m.map).forEach(function (r1) {
                    var clean = r1.substring(2, r1.length - 1);
                    var parts = clean.split(":");
                    if (parts[1] === "")
                        parts[1] = null;
                    var found = false;
                    if (msg.reactions != undefined)
                        msg.reactions.forEach(function (r2) {
                            if (r2.emoji.name === parts[0] && r2.emoji.id === parts[1])
                                found = true;
                        });
                    if (!found) {
                        setTimeout(function() {
                            react(message.channelID, message.messageID, r1);
                        }, i * 1000);
                        i++;
                    }
                });
            }
            else {
                console.log(util.format(
                    strings.debug.reactroleerr,
                    m.channel
                ));
                setTimeout(function() {
                    prepareReactroleMessages();
                }, config.options.reactroleretr * 1000);
            }
        });
    });
}

/*
 * Prepared a Discord compatible timestamp string.
 * @param  timestamp  Timestamp in unix format.
 */
function getDiscordTimestamp(timestamp, type=config.options.timestamptype) {
    return util.format(
        strings.misc.timestamp,
        Math.round(timestamp.getTime() / 1000),
        type
    );
}



/*************************
 * VARIPASS FUNCTIONALITY
 *************************/

/*
 * Pulls all data from VariPass and does adequate processing.
 */
function statusVariPass() {
    var payload = {
            "key": varipass.main.key,
            "action": "all"
        };

    var xhr = new XMLHttpRequest();
    xhr.open("POST", config.options.varipassurl, true);
    xhr.setRequestHeader("Content-type", "application/json");

    xhr.onreadystatechange = function () { 
        if (xhr.readyState == 4 && xhr.status == 200) {
            statusGlobal.varipass = Math.floor((new Date()) / 1000);

            var vpData;
            try {
                vpData = JSON.parse(xhr.responseText);
            }
            catch(error) {
            }
            if (vpData != undefined) {
                var timeOffset = Math.floor((new Date()) / 1000) - vpData.current;
                statusGlobal.celly    = findVariable(vpData, varipass.main.ids.temperature ).history[0].time + timeOffset;
                statusGlobal.chryssy  = findVariable(vpData, varipass.main.ids.counts      ).history[0].time + timeOffset;
                statusGlobal.dashie   = findVariable(vpData, varipass.main.ids.pm010       ).history[0].time + timeOffset;
                statusGlobal.unicorn  = findVariable(vpData, varipass.main.ids.unicorn_temp).history[0].time + timeOffset;
                statusGlobal.twilight = findVariable(vpData, varipass.main.ids.location    ).history[0].time + timeOffset;
                
                // Geiger Calculation
                var vpDose = findVariable(vpData, varipass.main.ids.dose).history;
                var vpDoseEMA = findVariable(vpData, varipass.main.ids.doseema).history;

                if (!(vpTimeDose != undefined && vpDose[0].time <= vpTimeDose)) {
                    vpTimeDose = vpDose[0].time;

                    var alpha = parseFloat(1.0 / config.varipass.geiger.samples);
                    var value = alpha * vpDose[0].value + (1.0 - alpha) * vpDoseEMA[0].value;
                    sendDoseEMA(value);

                    if (value <= config.varipass.geiger.okay) {
                        if (doseWasWarned) {
                            doseWasWarned = false;
                            send(channelNameToID(config.options.channels.home), util.format(
                                strings.announcements.varipass.doseokay,
                                value.toFixed(4),
                                config.varipass.geiger.okay
                            ), false);
                        }
                    }
                    else if (value >= config.varipass.geiger.warning) {
                        if (!doseWasWarned) {
                            doseWasWarned = true;
                            send(channelNameToID(config.options.channels.home), util.format(
                                strings.announcements.varipass.dosewarning,
                                config.varipass.geiger.warning,
                                value.toFixed(4)
                            ), false);
                        }
                    }
                }

                // Pressure Alerts
                var vpPressure = findVariable(vpData, varipass.main.ids.pressure).history;

                if (!(vpTimePressure != undefined && vpPressure[0].time <= vpTimePressure)) {
                    vpTimePressure = vpPressure[0].time;

                    if (vpPressure[1].value != undefined) {
                        if (vpPressure[0].time - vpPressure[1].time <= config.varipass.pressure.pause) {
                            var value = vpPressure[0].value - vpPressure[1].value;
                            if (Math.abs(value) >= config.varipass.pressure.warning) {
                                send(channelNameToID(config.options.channels.home), util.format(
                                    strings.announcements.varipass.pressure,
                                    value.toFixed(2)
                                ), false);
                            }
                        }
                    }
                }

                // Particle Alerts
                var vpPM025 = findVariable(vpData, varipass.main.ids.pm025).history[0].value;

                if (vpPM025 <= config.varipass.pm025.okay) {
                    if (pm025WasWarned) {
                        pm025WasWarned = false;
                        send(channelNameToID(config.options.channels.debug), util.format(
                            strings.announcements.varipass.pm025okay,
                            mention(config.options.adminid),
                            strings.announcements.varipass.pm025okayname,
                            vpPM025.toFixed(2)
                        ), false);
                    }
                }
                else if (vpPM025 >= config.varipass.pm025.warning) {
                    if (!pm025WasWarned) {
                        pm025WasWarned = true;
                        send(channelNameToID(config.options.channels.debug), util.format(
                            strings.announcements.varipass.pm025warning,
                            mention(config.options.adminid),
                            strings.announcements.varipass.pm025warningname,
                            vpPM025.toFixed(2)
                        ), false);
                    }
                }

                // Light Control Features
                var vpLight = findVariable(vpData, varipass.main.ids.light).history[0].value;

                refreshTradfriDevices(function(result) {
                    if (result) {
                        statusGlobal.tradfri = Math.floor((new Date()) / 1000);

                        // Day Lamp Off
                        if (vpLight >= config.varipass.daylight.threshold) {
                            config.varipass.daylight.bulbs.forEach(function(b) {
                                tToggles.forEach(function(d) {  
                                    if (d.name == b && d.on == true) {
                                        hub.toggleDevice(d.id);
                                        send(channelNameToID(config.options.channels.debug), util.format(
                                            strings.announcements.varipass.daylightoff,
                                            mention(config.options.adminid),
                                            b
                                        ), false);
                                    }
                                });
                            });
                        }

                        // Night Lamp Off
                        var controlOn = false;
                        tToggles.forEach(function(d) {  
                            if (d.name == config.varipass.nightlight.control && d.on == true) {
                                controlOn = true;
                            }
                        });                 
                        if (vpLight > config.varipass.nightlight.value - config.varipass.nightlight.delta &&
                            vpLight < config.varipass.nightlight.value + config.varipass.nightlight.delta &&
                            !controlOn) {
                            nightLightCount++;

                            if (nightLightCount >= config.varipass.nightlight.count) {
                                nightLightCount = 0;
                                config.varipass.nightlight.bulbs.forEach(function(b) {
                                    tToggles.forEach(function(d) {  
                                        if (d.name == b && d.on == true) {
                                            hub.toggleDevice(d.id);
                                            send(channelNameToID(config.options.channels.debug), util.format(
                                                strings.announcements.varipass.nightlightoff,
                                                mention(config.options.adminid),
                                                b
                                            ), false);
                                        }
                                    });
                                });                                
                            }
                        }
                        else {
                            nightLightCount = 0;
                        }
                    }
                });
            }
        }
    }
    xhr.onerror = function(err) {
        console.log(util.format(
            strings.debug.varipass.errorR,
            err.target.status
        ));
        xhr.abort();
    }
    xhr.ontimeout = function() {
        console.log(strings.debug.varipass.timeout);
        xhr.abort();
    }

    xhr.send(JSON.stringify(payload));
}

/*
 * Writes the radiation dose exponential moving average data to VariPass.
 * @param  value  Dose value to write.
 */
function sendDoseEMA(value) {
    var payload = {
            "key": varipass.main.key,
            "id": varipass.main.ids.doseema,
            "action": "write",
            "value": value.toFixed(4)
        };

    var xhr = new XMLHttpRequest();
    xhr.open("POST", config.options.varipassurl, true);
    xhr.setRequestHeader("Content-type", "application/json");

    xhr.onreadystatechange = function () { 
        if (xhr.readyState == 4 && xhr.status == 200) {
        }
    }
    xhr.onerror = function(err) {
        console.log(util.format(
            strings.debug.varipass.errorW,
            err.target.status
        ));
        xhr.abort();
    }
    xhr.ontimeout = function() {
        console.log(strings.debug.varipass.timeout);
        xhr.abort();
    }

    xhr.send(JSON.stringify(payload));
}

/*
 * Writes the EEG data to VariPass.
 */
function eegVaripassWrite() {
    var value;

    if (eegConfig.type == "raw") {
        switch (eegConfig.value) {
            case "timestamp":  value = eegValues.time;       break;
            case "battery":    value = eegValues.battery;    break;
            case "signal":     value = eegValues.signal;     break;
            case "attention":  value = eegValues.attention;  break;
            case "meditation": value = eegValues.meditation; break;
            case "wave0":      value = eegValues.waves[0];   break;
            case "wave1":      value = eegValues.waves[1];   break;
            case "wave2":      value = eegValues.waves[2];   break;
            case "wave3":      value = eegValues.waves[3];   break;
            case "wave4":      value = eegValues.waves[4];   break;
            case "wave5":      value = eegValues.waves[5];   break;
            case "wave6":      value = eegValues.waves[6];   break;
            case "wave7":      value = eegValues.waves[7];   break;
            case "sumlow":     value = eegValues.sumlow;     break;
            case "sumhigh":    value = eegValues.sumhigh;    break;
        }
    }
    else if (eegConfig.type == "ema") {
        switch (eegConfig.value) {
            case "timestamp":  value = eegValuesEMA.time;       break;
            case "battery":    value = eegValuesEMA.battery;    break;
            case "signal":     value = eegValuesEMA.signal;     break;
            case "attention":  value = eegValuesEMA.attention;  break;
            case "meditation": value = eegValuesEMA.meditation; break;
            case "wave0":      value = eegValuesEMA.waves[0];   break;
            case "wave1":      value = eegValuesEMA.waves[1];   break;
            case "wave2":      value = eegValuesEMA.waves[2];   break;
            case "wave3":      value = eegValuesEMA.waves[3];   break;
            case "wave4":      value = eegValuesEMA.waves[4];   break;
            case "wave5":      value = eegValuesEMA.waves[5];   break;
            case "wave6":      value = eegValuesEMA.waves[6];   break;
            case "wave7":      value = eegValuesEMA.waves[7];   break;
            case "sumlow":     value = eegValuesEMA.sumlow;     break;
            case "sumhigh":    value = eegValuesEMA.sumhigh;    break;
        }
    }

    if (value != undefined) {
        var payload = {
                "key":    varipass.eeg.key,
                "action": "write",
                "id":     varipass.eeg.ids.eeg,
                "value":  value
            };

        var xhr = new XMLHttpRequest();
        xhr.open("POST", config.options.varipassurl, true);
        xhr.setRequestHeader("Content-type", "application/json");

        xhr.onerror = function(err) {
            console.log(util.format(
                strings.debug.varipass.errorW,
                err.target.status
            ));
            xhr.abort();
        }
        xhr.ontimeout = function() {
            console.log(strings.debug.varipass.timeout);
            xhr.abort();
        }

        xhr.send(JSON.stringify(payload));
    }
}

function eegVaripassEdit() {
    var name = util.format(
        strings.commands.eegset.varipassA,
        eegConfig.type,
        eegConfig.value
    );

    var description = strings.commands.eegset.varipassB;

    if (eegConfig.type == "ema")
        description += util.format(
            strings.commands.eegset.varipassC,
            eegConfig.ema
        );

    var payload = {
            "key":    varipass.eeg.key,
            "action": "edit",
            "id":     varipass.eeg.ids.eeg,
            "type":   "float",
            "name":   name,
            "description": description,
            "unit":   "",
            "graph":  true,
            "perc":   false,
            "max":    eegConfig.max,
            "expire": eegConfig.expire
        };

    var xhr = new XMLHttpRequest();
    xhr.open("POST", config.options.varipassurl, true);
    xhr.setRequestHeader("Content-type", "application/json");

    xhr.onerror = function(err) {
        console.log(util.format(
            strings.debug.varipass.errorW,
            err.target.status
        ));
        xhr.abort();
        eegVaripassEdit();
    }
    xhr.ontimeout = function() {
        console.log(strings.debug.varipass.timeout);
        xhr.abort();
        eegVaripassEdit();
    }

    xhr.send(JSON.stringify(payload));
}

/*
 * Pulls all data from VariPass and does processes the average values. Pushes the data back once done.
 */
function avgVariPass() {
    var payload = {
            "key": varipass.main.key,
            "action": "all"
        };

    var xhr = new XMLHttpRequest();
    xhr.open("POST", config.options.varipassurl, true);
    xhr.setRequestHeader("Content-type", "application/json");

    xhr.onreadystatechange = function () { 
        if (xhr.readyState == 4 && xhr.status == 200) {            
            var vpData = JSON.parse(xhr.responseText);

            var vpPressure    = findVariable(vpData, varipass.main.ids.pressure).history;
            var vpMagnitude   = findVariable(vpData, varipass.main.ids.magnitude).history;
            var vpInclination = findVariable(vpData, varipass.main.ids.inclination).history;
            var vpDoseEMA     = findVariable(vpData, varipass.main.ids.doseema).history;

            var avgPressure = 0.0;
            vpPressure.forEach(function(v) {
                avgPressure += v.value / vpPressure.length;
            });

            var avgMagnitude = 0.0;
            vpMagnitude.forEach(function(v) {
                avgMagnitude += v.value / vpMagnitude.length;
            });

            var avgInclination = 0.0;
            vpInclination.forEach(function(v) {
                avgInclination += v.value / vpInclination.length;
            });
            
            var avgDoseEMA = 0.0;
            vpDoseEMA.forEach(function(v) {
                avgDoseEMA += v.value / vpDoseEMA.length;
            });

            send(channelNameToID(config.options.channels.debug), util.format(
                strings.announcements.dailyavg,
                avgPressure.toFixed(4),
                avgMagnitude.toFixed(4),
                avgInclination.toFixed(4),
                avgDoseEMA.toFixed(4)
            ), true);

            writeVariPass(varipass.main.key, varipass.main.ids.avgPressure, avgPressure);
            writeVariPass(varipass.main.key, varipass.main.ids.avgMagnitude, avgMagnitude);
            writeVariPass(varipass.main.key, varipass.main.ids.avgInclination, avgInclination);
            writeVariPass(varipass.main.key, varipass.main.ids.avgDoseEMA, avgDoseEMA);
        }
    }
    xhr.onerror = function(err) {
        console.log(util.format(
            strings.debug.varipass.errorR,
            err.target.status
        ));
        xhr.abort();
    }
    xhr.ontimeout = function() {
        console.log(strings.debug.varipass.timeout);
        xhr.abort();
    }

    xhr.send(JSON.stringify(payload));
}

/*
 * Writes a value to VariPass.
 * @param  key  The key of the VariPass account.
 * @param  id   The ID of the variable.
 * @param  val  The value to write.
 */
function writeVariPass(key, id, val) {
    var payload = {
        "key":    key,
        "action": "write",
        "id":     id,
        "value":  val
    };
    var xhr = new XMLHttpRequest();
    xhr.open("POST", config.options.varipassurl, true);
    xhr.setRequestHeader("Content-type", "application/json");
    xhr.onreadystatechange = function () { 
        if (xhr.readyState == 4 && xhr.status == 200) {            
            var vpData = JSON.parse(xhr.responseText);

            if (vpData.result != "success" && vpData.result != "error_cooldown") {
                console.log(util.format(
                    strings.debug.varipass.errorW,
                    vpData.result
                ));
            }
        }
    }
    xhr.onerror = function(err) {
        console.log(util.format(
            strings.debug.varipass.errorW,
            err.target.status
        ));
        xhr.abort();
    }
    xhr.ontimeout = function() {
        console.log(strings.debug.varipass.timeout);
        xhr.abort();
    }
    xhr.send(JSON.stringify(payload));
} 

/*
 * Parses VariPass data to return a certain variable.
 * @param  data  VariPass data to search in.
 * @param  id    The ID of the variable to look for.
 * @return       The VariPass variable with all the data.
 */
function findVariable(data, id) {
    var found    = false;
    var variable = null;

    data.list.forEach(function(v) {
        if (v.id == id && !found)
            variable = v;
    });

    return variable;
}         



/****************************
 * BLITZORTUNG FUNCTIONALITY
 ****************************/

/*
 * Connects to the Blitzortung API.
 * @param  reconnect  Whether this is an automatic reconnect.
 */
function connectBlitzortung(reconnect) {
    var area = {};    
    area.from = {};
    area.from.latitude = blitzor.location.latitude + blitzor.expand;
    area.from.longitude = blitzor.location.longitude - blitzor.expand;
    area.to = {};
    area.to.latitude = blitzor.location.latitude - blitzor.expand;
    area.to.longitude = blitzor.location.longitude + blitzor.expand;

    if (reconnect && blitzor.debugconnect)
        console.log(util.format(
            strings.debug.blitzor.reconnect,
            area.from.latitude,
            area.to.latitude,
            area.from.longitude,
            area.to.longitude
        ));
    else if (!reconnect)
        console.log(util.format(
            strings.debug.blitzor.connect,
            area.from.latitude,
            area.to.latitude,
            area.from.longitude,
            area.to.longitude
        ));

    blitzorws = new blitzorapi.Client({
        make(address) {
            if (blitzor.debugconnect)
                console.log("  " + address);
            return new WebSocket(address, {
                rejectUnauthorized: blitzor.usecert
            });
        }
    });

    blitzorws.connect();
    blitzorws.on("error", console.error);
    //blitzorws.on("connect", () => {
    //    blitzorws.setArea(area);
    //});
    blitzorws.on("data", strike => {
        var distance = earthDistance(blitzor.location.latitude, blitzor.location.longitude, strike.location.latitude, strike.location.longitude);

        if (distance < lightningNew) {
            lightningNew = distance;
            lightningLat = strike.location.latitude;
            lightningLng = strike.location.longitude;

            if (!blitzor.debugstrikes)
                console.log(util.format(
                    strings.debug.blitzor.strike,
                    distance,
                    strike.location.latitude,
                    strike.location.longitude                
                ));
        }
        if (blitzor.debugstrikes)
            console.log(util.format(
                strings.debug.blitzor.strike,
                distance,
                strike.location.latitude,
                strike.location.longitude                
            ));
    });

    lightningReconnect = setTimeout(function() {
        blitzorws.close();
        connectBlitzortung(true);
    }, blitzor.reconnect * 1000);

    if (reconnect && blitzor.debugconnect)
        console.log(strings.debug.blitzor.done);
    else if (!reconnect)
        console.log(strings.debug.blitzor.done);
}

/*
 * Connects to the Blitzortung API for storm chasing.
 * @param  reconnect  Whether this is an automatic reconnect.
 */
function connectChase(reconnect) {

    var payload = {
            "key": varipass.main.key,
            "action": "read",
            "id": varipass.main.ids.location
        };

    var xhr = new XMLHttpRequest();
    xhr.open("POST", config.options.varipassurl, true);
    xhr.setRequestHeader("Content-type", "application/json");

    xhr.onreadystatechange = function () { 
        if (xhr.readyState == 4 && xhr.status == 200) {
            var vpData = JSON.parse(xhr.responseText);

            var values = vpData.value.split("\\n");
            chaseThoriLat = 0.0;
            chaseThoriLng = 0.0;
            values.forEach(function(v) {
                var parts = v.split(":");
                if (parts[0] == "lat")
                    chaseThoriLat = parseFloat(parts[1]);
                else if (parts[0] == "lng")
                    chaseThoriLng = parseFloat(parts[1]);
            });

            var area = {};
            area.from = {};
            area.from.latitude = chaseThoriLat + blitzor.expand;
            area.from.longitude = chaseThoriLng - blitzor.expand;
            area.to = {};
            area.to.latitude = chaseThoriLat - blitzor.expand;
            area.to.longitude = chaseThoriLng + blitzor.expand;

            if (reconnect && blitzor.debugconnect)
                console.log(util.format(
                    strings.debug.chase.reconnect,
                    area.from.latitude,
                    area.to.latitude,
                    area.from.longitude,
                    area.to.longitude
                ));
            else if (!reconnect)
                console.log(util.format(
                    strings.debug.chase.connect,
                    area.from.latitude,
                    area.to.latitude,
                    area.from.longitude,
                    area.to.longitude
                ));

            chasews = new blitzorapi.Client({
                make(address) {
                    return new WebSocket(address, {
                        rejectUnauthorized: blitzor.usecert
                    });
                }
            });

            chasews.connect();
            chasews.on("error", console.error);
            //chasews.on("connect", () => {
            //    chasews.setArea(area);
            //});
            chasews.on("data", strike => {
                var distance = earthDistance(chaseThoriLat, chaseThoriLng, strike.location.latitude, strike.location.longitude);

                if (distance < chaseNew) {
                    chaseNew = distance;
                    chaseLat = strike.location.latitude;
                    chaseLng = strike.location.longitude;

                    if (!blitzor.debugstrikes)
                        console.log(util.format(
                            strings.debug.chase.strike,
                            distance,
                            strike.location.latitude,
                            strike.location.longitude                
                        ));
                }
                if (blitzor.debugstrikes)
                    console.log(util.format(
                        strings.debug.chase.strike,
                        distance,
                        strike.location.latitude,
                        strike.location.longitude                
                    ));
            });

            chaseReconnect = setTimeout(function() {
                chasews.close();
                connectChase(true);
            }, blitzor.chase * 1000);

            if (reconnect && blitzor.debugconnect)
                console.log(strings.debug.chase.done);
            else if (!reconnect)
                console.log(strings.debug.chase.done);      
        }
    }
    xhr.onerror = function(err) {
        connectChase(true);
        xhr.abort();
    }
    xhr.ontimeout = function() {
        connectChase(true);
        xhr.abort();
    }

    xhr.send(JSON.stringify(payload));
}

/*
 * Performs the lightning data checking in a loop.
 */
function loopLightning() {
    if (lightningNew < lightningRange) {
        lightningRange = lightningNew;

        clearTimeout(lightningSpread);
        lightningSpread = setTimeout(spreadLightning, blitzor.spread * 1000);

        clearTimeout(lightningExpire);
        lightningExpire = setTimeout(function() {
            send(channelNameToID(config.options.channels.home), strings.announcements.blitzor.expire, false);
        }, blitzor.expire * 1000);

        var time = moment.tz(new Date(), "Europe/Zagreb").format("HH:mm:ss");
        var rng = lightningRange;
        var lat = lightningLat;
        var lng = lightningLng;
        var b  = earthBearing(blitzor.location.latitude, blitzor.location.longitude, lat, lng);

        var bear = "N";
             if (b >  11.25 && b <  33.75) bear = "NNE";
        else if (b >  33.75 && b <  56.25) bear = "NE";
        else if (b >  56.25 && b <  78.75) bear = "ENE";
        else if (b >  78.75 && b < 101.25) bear = "E";
        else if (b > 101.25 && b < 123.75) bear = "ESE";
        else if (b > 123.75 && b < 146.25) bear = "SE";
        else if (b > 146.25 && b < 168.75) bear = "SSE";
        else if (b > 168.75 && b < 191.25) bear = "S";
        else if (b > 191.25 && b < 213.75) bear = "SSW";
        else if (b > 213.75 && b < 236.25) bear = "SW";
        else if (b > 236.25 && b < 258.75) bear = "WSW";
        else if (b > 258.75 && b < 281.25) bear = "W";
        else if (b > 281.25 && b < 303.75) bear = "WNW";
        else if (b > 303.75 && b < 326.25) bear = "NW";
        else if (b > 326.25 && b < 348.75) bear = "NNW";
        
        getLocationInfo(function(locInfo) {
            send(channelNameToID(config.options.channels.home), util.format(
                strings.announcements.blitzor.strike,
                rng.toFixed(2),
                bear,
                b.toFixed(2),
                locInfo.town,
                locInfo.country,
                time
            ), false);
        }, lat, lng);
    }

    if (chaseNew < chaseRange) {
        chaseRange = chaseNew;

        clearTimeout(chaseSpread);
        chaseSpread = setTimeout(spreadChase, blitzor.spread * 1000);

        clearTimeout(chaseExpire);
        chaseExpire = setTimeout(function() {
            send(config.options.adminid, strings.announcements.chase.expire, false);
        }, blitzor.expire * 1000);

        var time = moment.tz(new Date(), "Europe/Zagreb").format("HH:mm:ss");
        var rng = chaseRange;
        var lat = chaseLat;
        var lng = chaseLng;
        var b  = earthBearing(chaseThoriLat, chaseThoriLng, lat, lng);

        var bear = "N";
             if (b >  11.25 && b <  33.75) bear = "NNE";
        else if (b >  33.75 && b <  56.25) bear = "NE";
        else if (b >  56.25 && b <  78.75) bear = "ENE";
        else if (b >  78.75 && b < 101.25) bear = "E";
        else if (b > 101.25 && b < 123.75) bear = "ESE";
        else if (b > 123.75 && b < 146.25) bear = "SE";
        else if (b > 146.25 && b < 168.75) bear = "SSE";
        else if (b > 168.75 && b < 191.25) bear = "S";
        else if (b > 191.25 && b < 213.75) bear = "SSW";
        else if (b > 213.75 && b < 236.25) bear = "SW";
        else if (b > 236.25 && b < 258.75) bear = "WSW";
        else if (b > 258.75 && b < 281.25) bear = "W";
        else if (b > 281.25 && b < 303.75) bear = "WNW";
        else if (b > 303.75 && b < 326.25) bear = "NW";
        else if (b > 326.25 && b < 348.75) bear = "NNW";
        
        getLocationInfo(function(locInfo) {
            send(config.options.adminid, util.format(
                strings.announcements.chase.strike,
                rng.toFixed(2),
                bear,
                b.toFixed(2),
                locInfo.town,
                locInfo.country,
                time
            ), false);
        }, lat, lng);
    }

    setTimeout(loopLightning, blitzor.loop * 1000);
}

/*
 * Spread the lightning range when there is no new lightning.
 */
function spreadLightning() {
    var rangeSpread = blitzor.range / (blitzor.expire / blitzor.spread);
    if (blitzor.debugstrikes)
        console.log(util.format(
            strings.debug.blitzor.spread,
            lightningRange,
            lightningRange + rangeSpread
        ));

    lightningRange = lightningRange + rangeSpread;
    lightningNew   = lightningNew + rangeSpread;

    if (lightningRange > blitzor.range) {
        if (blitzor.debugstrikes)
            console.log(util.format(
                strings.debug.blitzor.max,
                blitzor.range
            ));
        lightningRange = blitzor.range;
        lightningNew = blitzor.range;
    }
    else {
        lightningSpread = setTimeout(spreadLightning, blitzor.spread * 1000);
    }
}

/*
 * Spread the lightning range when there is no new lightning, used when storm chasing.
 */
function spreadChase() {
    var rangeSpread = blitzor.range / (blitzor.expire / blitzor.spread);
    if (blitzor.debugstrikes)
        console.log(util.format(
            strings.debug.chase.spread,
            chaseRange,
            chaseRange + rangeSpread
        ));

    chaseRange = chaseRange + rangeSpread;
    chaseNew   = chaseNew + rangeSpread;

    if (chaseRange > blitzor.range) {
        if (blitzor.debugstrikes)
            console.log(util.format(
                strings.debug.chase.max,
                blitzor.range
            ));
        chaseRange = blitzor.range;
        chaseNew = blitzor.range;
    }
    else {
        chaseSpread = setTimeout(spreadChase, blitzor.spread * 1000);
    }
}



/************************
 * TRADFRI FUNCTIONALITY
 ************************/

/*
 * Connects to the Tradfri hub and refreshes all devices.
 * @param  callback  Function called once processing is done. Returns true if successful.
 * @param  repeats   Number of repeated attempts.
 */
function refreshTradfriDevices(callback, repeats=0) {
    hub.getDevices().then((result) => {

        tBulbs = result.filter(function(d) {
            return d.type_id == 2;
        });
        tBulbs.sort((a, b) => (a.name > b.name) ? 1 : -1);

        tToggles = result.filter(function(d) {
            return d.type_id == 2 || d.type_id == 3;
        });        
        tToggles.sort((a, b) => (a.name > b.name) ? 1 : -1);

        tRemotes = result.filter(function(d) {
            return d.type_id == 0;
        });        
        tRemotes.sort((a, b) => (a.name > b.name) ? 1 : -1);

        if (tradfri.debugdata) {
            console.log(util.format(
                strings.debug.tradfri.doneb,
                tBulbs.length
            ));

            tBulbs.forEach(function(d) {
                console.log(util.format(
                    strings.debug.tradfri.bulb,
                    d.name,
                    d.id,
                    d.type,
                    d.color,
                    d.brightness,
                    d.on
                ));
            });

            console.log(util.format(
                strings.debug.tradfri.donet,
                tToggles.length
            ));

            tToggles.forEach(function(d) {
                console.log(util.format(
                    strings.debug.tradfri.toggle,
                    d.name,
                    d.id,
                    d.type,
                    d.on
                ));
            });

            console.log(util.format(
                strings.debug.tradfri.doner,
                tRemotes.length
            ));

            tRemotes.forEach(function(d) {
                console.log(util.format(
                    strings.debug.tradfri.remote,
                    d.name,
                    d.id,
                    d.type,
                    d.battery
                ));
            });
        }

        if (tradfri.debugconn && repeats > 0)
            console.log(util.format(
                strings.debug.tradfri.reconn,
                repeats+1
            ));
        hubFails = 0;
        callback(true);

    }).catch((error) => {
        if (repeats < tradfri.maxrepeats) {
            if (tradfri.debugconn) {
                console.log(util.format(
                    strings.debug.tradfri.repeatA,
                    repeats+1
                ));
                console.log(util.format(
                    strings.debug.tradfri.repeatB,
                    error
                ));
            }
            loadTradfri();
            refreshTradfriDevices(callback, repeats+1);
        }
        else {
            hubFails++;
            if (hubReady) {
                if (tradfri.debugfails)
                    console.log(util.format(
                        strings.debug.tradfri.errorA,
                        hubFails
                    ));

                if (hubFails >= tradfri.rebootwhen)
                    rebootHub();
            }
            callback(false);
        }
    });
}

/*
 * Sets the mood of the lighting.
 * @param  name  Name of the mood to use.
 * @param  callback  Function called once processing is done. Returns true if successful.
 */
function setMood(name, callback) {
    tradfri.moods.forEach(function(m) { 
        if (m.name == name) {
            refreshTradfriDevices(function(result) {
                if (result) {
                    m.bulbs.forEach(function(d1) {
                        tBulbs.forEach(function(d2) {
                            if (d1.name == d2.name) {
                                setBulb(d1.config, d2.id);
                            }
                        });
                    });
                    callback(true);
                }
                else {
                    callback(false);
                }
            });
        }
    }); 
}

/*
 * Sets the parameters of a specific bulb.
 * @param  bulb  The bulb object.
 * @param  id    ID of the bulb.
 */
function setBulb(bulb, id) {
    var newBulb = normalize(bulb);  

    hub.setDeviceState(id, newBulb).then((result) => {

    }).catch((error) => {
        console.log(strings.debug.tradfri.errorB);
        setBulb(bulb, id);
    });
}

/*
 * Normalizes the colors of a bulb.
 * @param  bulb  The bulb object.
 * @return       New bulb object with normalized color.
 */
function normalize(bulb) {  
    var newBulb = Object.assign({}, bulb);
    if (newBulb.colorX != undefined) {
        newBulb.colorX = Math.round(newBulb.colorX * 65535);
    }
    if (newBulb.colorY != undefined) {
        newBulb.colorY = Math.round(newBulb.colorY * 65535);
    }
    if (newBulb.brightness != undefined) {
        newBulb.brightness = Math.round(newBulb.brightness * 254);
    }
    return newBulb;
}

/*
 * Performs a reboot procedure of Tradfri hub by cutting USB power.
 */
function rebootHub() {
    hubReady = false;
    console.log(strings.debug.tradfri.reboot);
    
    // Run USB OFF command.
    exec("sudo uhubctl -l 1-1 -p 2 -a 0");

    setTimeout(function() {
        // Run USB ON command.
        exec("sudo uhubctl -l 1-1 -p 2 -a 1");        
    }, tradfri.reboottime * 1000);

    setTimeout(function() {
        hubFails = 0;
        hubReady = true;
    }, tradfri.rebootdone * 1000);
}



/*******************************
 * CHANNEL AND DATA TRANSLATION
 *******************************/

/*
 * Parses a given channel name to retrieve the correct ID.
 * @param  name  The input name to look for.
 * @return       ID of the channel.
 */
function channelNameToID(name) {
    var found = false;
    var id = null;

    channels.list.forEach(function(c) {
        if (c.name == name && !found)
            id = c.id;
    });

    return id;
};

/*
 * Parses a given channel ID to retrieve the correct name.
 * @param  id  The input ID to look for.
 * @return     Name of the channel.
 */
function channelIDToName(id) {
    var found = false;
    var name = "unknown";

    channels.list.forEach(function(c) {
        if (c.id == id && !found)
            name = c.name;
    });

    return name;
};

/*
 * Parses a given channel ID to retrieve the correct brain.
 * @param  id  The input ID to look for.
 * @return     Brain of the channel.
 */
function channelIDToBrain(id) {
    var found = false;
    var brain = null;

    channels.list.forEach(function(c) {
        if (c.id == id && !found)
            brain = c.brain;
    });

    if (brain == null)
        brain = channels.default.brain;

    return brain;
};

/*
 * Processes the channel whitelist and checks if the channel is whitelisted.
 * @param  channelID  ID of the channel to check whitelist of.
 * @return            Boolean whether the channel is whitelisted.
 */
function processWhitelist(channelID) {
    var okay = false;
    channels.list.forEach(function(c) {
        if (c.id == channelID && c.learn)
            okay = true;
    });
    return okay;
}

/*
 * Processes the user blacklist and checks if the user is blacklisted.
 * @param  userID  ID of the user to check blacklist of.
 * @return         Boolean whether the user is NOT blacklisted.
 */
function processBlacklist(userID) {
    var okay = true;
    if (blacklist[userID] != undefined) {
        okay = false;
    };
    return okay;
}

/*
 * Processes the user ignore list and checks if the user is ignored.
 * @param  userID  ID of the user to check ignore list for.
 * @return         Boolean whether the user is NOT ignored.
 */
function processIgnore(userID) {
    var okay = true;
    if (ignore[userID] != undefined) {
        okay = false;
    };
    return okay;
}



/*************************************
 * STRING MANIPULATION AND GENERATION
 *************************************/

/*
 * Formats a mention string.
 * @param  id  ID to mention.
 * @return     String usable by Discord as a mention.
 */
function mention(id) {
    return util.format(config.options.mention, id);
};

/*
 * Formats a role mention string.
 * @param  id  ID to mention.
 * @return     String usable by Discord as a mention.
 */
function mentionRole(id) {
    return util.format(config.options.mentionrole, id);
};

/*
 * Checks whether a certain ID was mentioned.
 * @param  id    ID to check the mentions of.
 * @param  data  Discord's event data.
 * @return       Boolean whether the ID was mentioned.
 */
function isMentioned(id, data) {
    var mentioned = false;
    data.d.mentions.forEach(function(m) {
        if (m.id == id)
            mentioned = true;
    });
    return mentioned;
};

/*
 * Uses regex to clean up a message.
 * @param  message  Message text to clean up.
 * @return          The cleaned up message.
 */
function cleanMessage(message) {
    return message.replace(/\*\*/g, "").replace(/<@.*>/g, "").replace(/\|\|.*\|\|/g, "").replace(/http(|s):\/\/(\S+)*/g, "");
}

/*
 * Analyzes the message and completes it with _ or * for an RP action if needed.
 * @param  message  Message text to analyze.
 * @return          The completed RP message.
 */
function completeRoleplay(message) {
    var newMessage = message;

    if (newMessage[0] == "*" && newMessage[1] == " ")
        newMessage = "*" + newMessage.substring(2, newMessage.length);
    if (newMessage[0] == "_" && newMessage[1] == " ")
        newMessage = "_" + newMessage.substring(2, newMessage.length);
    if (newMessage[newMessage.length - 1] == "*" && newMessage[newMessage.length - 2] == " ")
        newMessage = newMessage.substring(0, newMessage.length - 2) + "*";
    if (newMessage[newMessage.length - 1] == "_" && newMessage[newMessage.length - 2] == " ")
        newMessage = newMessage.substring(0, newMessage.length - 2) + "_";

    var words = newMessage.split(" ");

    var startUnd = -1;
    var startAst = -1;
    var endUnd   = -1;
    var endAst   = -1;
    var doSUnd   = false;
    var doSAst   = false;
    var doEUnd   = false;
    var doEAst   = false;

    words.forEach(function (w, i) {
        if (w[0] == "_")
            startUnd = i;
        if (w[0] == "*")
            startAst = i;
        if (w[w.length - 1] == "_")
            endUnd = i;
        if (w[w.length - 1] == "*")
            endAst = i;
    });

    if (startUnd > -1 && endUnd == -1)
        doEUnd = true;
    if (startAst > -1 && endAst == -1)
        doEAst = true;
    if (startUnd == -1 && endUnd > -1)
        doSUnd = true;
    if (startAst == -1 && endAst > -1)
        doSAst = true;

    if (config.brain.debugrp) {
        console.log(newMessage);
        console.log("Ast Und - Ast Und: " + doSUnd + " " + doSAst + " " + doEUnd + " " + doEAst);        
    }

    if (doEUnd && doEAst) {
        if (startUnd < startAst)
            newMessage = newMessage + "*_";
        else
            newMessage = newMessage + "_*";
    }
    else if (doEUnd)
        newMessage = newMessage + "_";
    else if (doEAst)
        newMessage = newMessage + "*";

    if (doSUnd && doSAst) {
        if (endUnd < endAst)
            newMessage = "*_" + newMessage;
        else
            newMessage = "_*" + newMessage;
    }
    else if (doSUnd)
        newMessage = "_" + newMessage;
    else if (doSAst)
        newMessage = "*" + newMessage;
    return newMessage;
}

/*
 * Checks if a message has usable contents.
 * @param  message  Message text analyze.
 * @return          Whether the message had contents.
 */
function isMessageNotEmpty(message) {
    return message != "" && message != " " && message != "\n";
}

function toUpper(str) {
    return str.toLowerCase().replace(/^[a-zA-Z0-9À-ž]|[-\r\n\t\f\v ][a-zA-Z0-9À-ž]/g, function (letter) {
        return letter.toUpperCase();
    })
}

/*
 * Converts a given date to a more readable format.
 * @param  date  The input date, this is not the JS Date object.
 * @return       Formatted string.
 */
function getTimeString(date) {
    var string = "";

    if (date.days != null && date.days != 0) {
        string += date.days + " day";
        if (date.days > 1)
            string += "s";
    }

    if ((date.days != null && date.days != 0) && (date.hours != null && date.hours != 0) && (date.minutes == null || date.minutes == 0))
        string += " and ";
    else if ((date.days != null && date.days != 0) && (date.hours != null && date.hours != 0) && (date.minutes != null && date.minutes != 0))
        string += ", ";

    if (date.hours != null && date.hours != 0) {
        string += date.hours + " hour";
        if (date.hours > 1)
            string += "s";
    }

    if ((date.hours != null && date.hours != 0) && (date.minutes != null && date.minutes != 0))
        string += " and ";
    else if ((date.days != null && date.days != 0) && (date.hours == null || date.hours == 0) && (date.minutes != null && date.minutes != 0))
        string += " and ";

    if (date.minutes != null && date.minutes != 0) {
        string += date.minutes + " minute";
        if (date.minutes > 1)
            string += "s";
    }

    if (string == "")
        string = "0 minutes";

    return string;
}

/*
 * Converts a given date to a simplified format.
 * @param  date  The input date, this is not the JS Date object.
 * @return       Formatted string.
 */
function getTimeStringSimple(date) {
    var string = "";

    if (date.days != null && date.days != 0) {
        string += date.days + "d ";
    }

    if (date.hours != null && date.hours != 0) {
        string += date.hours + "h ";
    }

    if (date.minutes != null) {
        string += date.minutes + "m ";
    }

    if (date.seconds != null) {
        string += date.seconds + "s";
    }

    return string;
}

/*
 * Parses two given dates to return the time left and final time.
 * @param  start    Starting date.
 * @param  stop     Final date.
 * @param  timezone The timezone to calculate for.
 * @return          String of time left and final time.
 */
function getTimeLeft(start, stop, timezone) {
    var diff = (stop - start) / 60000;
    var time = {};

    time.minutes = Math.floor(diff % 60);
    diff = Math.floor(diff / 60);
    time.hours = Math.floor(diff % 24);
    time.days = Math.floor(diff / 24);

    var momentTime = moment.tz(stop, timezone);
    if (timezone == "")
        return util.format(
            strings.misc.left, 
            getTimeString(time),
            getDiscordTimestamp(stop)
        );
    else
        return util.format(
            strings.misc.lefttz, 
            getTimeString(time),
            momentTime.format("ddd MMM DD, YYYY"),
            momentTime.format("HH:mm (z)")
        );
}

/*
 * Parses the phase list to return a string compatible with Discord chat.
 * @param  name    Name of the Moon phse to look for.
 * @param  offset  Offset of the phase.
 * @return         Formatted string.
 */
function getPhaseString(name, offset) {
    var id = 0;
    config.phases.forEach(function(n, i) {
        if (n.name == name)
            id = i;
    });

    id += offset;
    if (id >= config.phases.length)
        id -= config.phases.length;
    else if (id < 0)
        id += config.phases.length;

    return config.phases[id].name + " " + config.phases[id].icon;
}

/*
 * Generates a random color string for a single sock.
 * @return    Sock color string.
 */
function generateSock() {
    if (Math.random() < 0.5) {
        // Single color
        return strings.misc.socks.single[Math.floor(Math.random() * strings.misc.socks.single.length)];
    }
    else {
        // Double color
        var colorA = strings.misc.socks.double[Math.floor(Math.random() * strings.misc.socks.double.length)];
        var colorB = "";
        do {
            colorB = strings.misc.socks.double[Math.floor(Math.random() * strings.misc.socks.double.length)];
        } while (colorB == colorA);
        return colorA + "-" + colorB;
    }
}

/*
 * Generates a randomized string containing colors of multiple socks.
 * @return    A string of multiple sock colors.
 */
function generateSocks(count) {
    var sockList = [];
    var socks = "";
    var i;

    for (i = 0; i < count; i++)
        sockList.push(generateSock());

    for (i = 0; i < count - 1; i++) {
        socks += sockList[i];
        if (i < count - 2) {
            socks += config.separators.list;
        }
    }
    socks += config.separators.lend + sockList[i];

    return socks;
}

/*
 * Returns a random element in array.
 * @param  arr  The array to process.
 * @return      The element.
 */
function random(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

/*
 * Inserts the OwO faces in a string.
 * @param  input  The input string.
 * @return        The output string.
 */
function owoFaces(input) {
    return input
        .replace(/(?<![.?!])$/, Math.random() > 0.7 ? " " + random(strings.misc.faces["."]) : "")
        .replace(/(!+|\?+|((?<!\.)\.(?!\.)))/g, match => (match[0] in strings.misc.faces ? " " + random(strings.misc.faces[match[0]]) : match));
}

/*
 * Adjusts the casing of a string.
 * @param  input  The input string.
 * @return        The output string.
 */
function owoCasing(input) {
    return input
        .split(/(?<=[!.?]\s*)/g)
        .map(satz => satz[0].toUpperCase() + satz.slice(1).toLowerCase())
        .join("");
}

/*
 * Inserts stuttering to a string.
 * @param  input  The input string.
 * @return        The output string.
 */
function owoStutter(input) {
    return input
        .split(/\s+/)
        .map(word => {
            const r = Math.random();
            if (r > 0.15 || word === "") return word;

            return word[0] + ("-" + word[0]).repeat(r > 0.05 ? 1 : 2) + word.slice(1);
        })
        .join(" ");
}

/*
 * Performs the main OwO transformation.
 * @param  input  The input string.
 * @return        The output string.
 */
function owoTransform(input) {
    input = cleanMessage(input);
    return input
        .split(/\s+/g)
        .map(word =>
            word
                .replace(/^you$/gi, "u")
                .replace(/^your$/gi, "ur")
                .replace(/^you're$/gi, "ur")
                .replace(/l/gi, "w")
                .replace(/v/gi, "w")
                .replace(/th/gi, "t")
                .replace(/^no/i, "nwo")
                .replace(/d(?!$)/gi, "w")
                .replace(/o$/i, "ow")
                .replace(/r([aeiou])/gi, (_, match) => `w${match}`)
                .replace(/([aeiou])r/gi, (_, match) => `${match}w`)
                .replace(/(?<=\w)([^AEIOUaeiou]+)ou/, (_, match) => `${"w".repeat(match.length)}ou`)
                .replace(/eou/, "ewou")
        )
        .join(" ");
}

/*
 * Formats a WoW currency string (gold/silver/copper).
 * @param  price  The price in copper.
 * @return        The formatted string.
 */
function getWoWPrice(price) {
    var c = Math.floor(price % 100);
    price = Math.floor(price / 100);
    var s = Math.floor(price % 100);
    price = Math.floor(price / 100);
    var g = "";
    while (price >= 1000) {
        g = config.separators.price + Math.floor(price % 1000) + g;
        price = Math.floor(price / 1000);
    }
    g = price + g;

    return util.format(
        strings.misc.gold,
        g,
        s,
        c
    );
}

/*
 * Returns a string version of a number, with added zeros to start.
 * @param  digits  Maximum number of digits.
 * @param  number  The number to format for.
 * @return        The formatted string.
 */
function fillUpZeros(digits, number) {
    var i = 0;
    var res = number;
    do {
        i++;
        res = Math.floor(res / 10);
    } while (res > 0);

    var out = number.toString();

    i = digits - i;
    while (i > 0) {
        i--;
        out = "0" + out;
    }

    return out;
}



/*****************************
 * GEOGRAPHIC DATA PROCESSING
 *****************************/

/*
 * Uses an API to fetch a translated geo location of coordinates.
 * @param  callback  Callback function called once done.
 * @param  lat       The latitude coordinate.
 * @param  lng       The longitude coordinate.
 */
 function getLocationInfo(callback, lat, lng) {
    var xhr = new XMLHttpRequest();

    xhr.open("GET", util.format(
        config.options.geourl,
        lat,
        lng,
        blitzor.auth
    ), true);

    xhr.onreadystatechange = function () { 
        if (xhr.readyState == 4 && xhr.status == 200) {
            var response = JSON.parse(xhr.responseText);

            var locInfo = {};
            locInfo.town = "Unknown";
            locInfo.country = "Unknown";

            if (response.error != undefined && response.error.code == "008") {
                if (response.suggestion != undefined) {
                    var north = response.suggestion.north;
                    var south = response.suggestion.south;

                    if (south != undefined && north != undefined && south.distance != undefined && north.distance != undefined) {
                        if (north.distance < south.distance) {
                            if (north.city != undefined)
                                locInfo.town = north.city;
                            if (north.prov != undefined)
                                locInfo.country = north.prov;
                        }
                        else {
                            if (south.city != undefined)
                                locInfo.town = south.city;
                            if (south.prov != undefined)
                                locInfo.country = south.prov;
                        }
                    }
                    else if (north != undefined && north.city != undefined) {
                        locInfo.town = north.city;
                        if (north.prov != undefined)
                            locInfo.country = north.prov;
                    }
                    else if (south != undefined && south.city != undefined) {
                        locInfo.town = south.city;
                        if (south.prov != undefined)
                            locInfo.country = south.prov;
                    }
                }
            }
            else {
                if (response.city != undefined)
                    locInfo.town = response.city;
                if (response.prov != undefined)
                    locInfo.country = response.prov;
            }
            var locs = locInfo.town.split(" / ");
            if (locs.length > 1)
                locInfo.town = locs[1];
            locInfo.town = toUpper(locInfo.town);

            //console.log(response);

            callback(locInfo);
        }
    }

    xhr.send();
}

/*
 * Calculates a realistic surface distance between two coordinate points on Earth.
 * @param  lat1  The starting latitude coordinate.
 * @param  lng1  The starting longitude coordinate.
 * @param  lat2  The ending latitude coordinate.
 * @param  lng2  The ending longitude coordinate.
 * @return       The distance in kilometers.
 */
function earthDistance(lat1, lng1, lat2, lng2) {
    var R = 6371;
    var dLat = degToRad(lat2-lat1);
    var dLon = degToRad(lng2-lng1); 
    var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(degToRad(lat1)) * Math.cos(degToRad(lat2)) * 
            Math.sin(dLon/2) * Math.sin(dLon/2); 
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    var d = R * c;
    return d;
}

/*
 * Calculates a bearing towards a certain coordinate point on Earth.
 * @param  lat1  The standing latitude coordinate.
 * @param  lng1  The standing longitude coordinate.
 * @param  lat2  The targeted latitude coordinate.
 * @param  lng2  The targeted longitude coordinate.
 * @return       The angle in degrees.
 */
function earthBearing(lat1, lng1, lat2, lng2) {
    var dLon = degToRad(lng2-lng1);
    var y = Math.sin(dLon) * Math.cos(degToRad(lat2));
    var x = Math.cos(degToRad(lat1)) * Math.sin(degToRad(lat2)) -
            Math.sin(degToRad(lat1)) * Math.cos(degToRad(lat2)) * 
            Math.cos(dLon);
    var brng = radToDeg(Math.atan2(y, x));
    return ((brng + 360) % 360);
}

/*
 * Converts degrees to radians.
 * @param  deg  Degree value.
 * @return      Radian value.
 */
function degToRad(deg) {
    return deg * (Math.PI/180);
}

/*
 * Converts radians to degrees.
 * @param  rad  Radian value.
 * @return      Degree value.
 */
function radToDeg(rad) {
    return rad * (180/Math.PI);
}



/******************************
 * SEISMOGRAPH DATA PROCESSING
 ******************************/

/*
 * Prepares the bandpass filter for processing seismographic data.
 */
function setupSeismoFilter() {
    var firCalculator = new Fili.FirCoeffs();

    var firFilterCoeffs = firCalculator.bandpass({
        order: config.seismo.data.bandpass.order,
        Fs: config.seismo.data.samplerate,
        F1: config.seismo.data.bandpass.low,
        F2: config.seismo.data.bandpass.high
    });

    seismoFilter = new Fili.FirFilter(firFilterCoeffs);
}

/*
 * Calculates the median value of a data array.
 * @param  values  An array of values.
 * @return         Median value.
 */
function median(values) {
    if(values.length === 0) return 0;

    values.sort(function(a, b) {
        return a - b;
    });

    var half = Math.floor(values.length / 2);

    if (values.length % 2)
        return values[half];

    return (values[half - 1] + values[half]) / 2.0;
}

/*
 * Generates an emoji string for quake intensity.
 * @param  velocity  The velocity value of the quake.
 * @return           A string of emojis representing quake intensity.
 */
function generateEmojigraph(velocity) {
    var emojis = "";

    var lowCnt    = 0;
    var mediumCnt = 0;
    var highCnt   = 0;

    if (velocity < config.seismo.emojigraph.low.max) {
        for (var i = 0; i < velocity; i += (config.seismo.emojigraph.low.max / config.seismo.emojigraph.low.seg))
            lowCnt++;
    }
    else {
        lowCnt = config.seismo.emojigraph.low.seg;

        if (velocity < config.seismo.emojigraph.medium.max) {
            var tempVelocity = velocity - config.seismo.emojigraph.low.max;

            for (var i = 0; i < tempVelocity; i += ((config.seismo.emojigraph.medium.max - config.seismo.emojigraph.low.max) / config.seismo.emojigraph.medium.seg))
                mediumCnt++;
        }
        else {
            mediumCnt = config.seismo.emojigraph.medium.seg;

            if (velocity < config.seismo.emojigraph.high.max) {
                var tempVelocity = velocity - config.seismo.emojigraph.medium.max;

                for (var i = 0; i < tempVelocity; i += ((config.seismo.emojigraph.high.max - config.seismo.emojigraph.medium.max) / config.seismo.emojigraph.high.seg))
                    highCnt++;
            }
            else {
                highCnt = config.seismo.emojigraph.high.seg;
            }
        }
    }

    for (var i = 0; i < lowCnt; i++)
        emojis += config.seismo.emojigraph.low.emoji;
    for (var i = 0; i < mediumCnt; i++)
        emojis += config.seismo.emojigraph.medium.emoji;
    for (var i = 0; i < highCnt; i++)
        emojis += config.seismo.emojigraph.high.emoji;

    if (velocity >= config.seismo.emojigraph.high.max) {
        emojis += config.seismo.emojigraph.overload;
    }

    return emojis;
}

/*
 * Begins listening to the periodic UDP seismograph data.
 */
 function startSeizmoServer() {
    console.log(strings.debug.seismo.start);

    setupSeismoFilter();

    udpServer = dgram.createSocket("udp4");

    udpServer.on("error", (err) => {
        console.log("UDP Server Error:\n" + err.stack);
        udpServer.close();
    });

    udpServer.on("message", (message, rinfo) => {
        var now = new Date();
        statusGlobal.maud = Math.floor(now / 1000);
        seismoLatest = message.toString("utf8");
        //console.log("server got: "+ seismoLatest + " from " + rinfo.address + ":" + rinfo.port);

        if ((seismoReadyFilter && seismoSamplesBuf.length < config.seismo.data.samplerate) || 
            (!seismoReadyFilter && seismoSamplesBuf.length < config.seismo.data.rampupsamples)) {
            var sampleData = message.toString("utf8").replace("{", "").replace("}", "").split(", ");
            for (var i = 2; i < sampleData.length; i++)
                seismoSamplesBuf.push((parseInt(sampleData[i]) / config.seismo.data.normalization) * 1000);
        }

        if ((seismoReadyFilter && seismoSamplesBuf.length >= config.seismo.data.samplerate) || 
            (!seismoReadyFilter && seismoSamplesBuf.length >= config.seismo.data.rampupsamples)) {

            //var filteredSamples = seismoFilter.multiStep(seismoSamplesBuf);

            var filtered = seismoFilter.multiStep(seismoSamplesBuf);

            var stringSeismoRaw = "";
            var stringSeismoFlt = "";
            var stringSeismoMed = "";
            if (config.seismo.outputfile) {
                if (now.getMinutes() != seismoLastMinute) {
                    seismoLastMinute = now.getMinutes();
                    var outDate = moment.tz(now, "UTC");
                    stringSeismoRaw += outDate.format("YYYY-MM-DD") + " " + outDate.format("HH:mm:ss (z)") + ":\n";
                    stringSeismoFlt += outDate.format("YYYY-MM-DD") + " " + outDate.format("HH:mm:ss (z)") + ":\n";
                    stringSeismoMed += outDate.format("YYYY-MM-DD") + " " + outDate.format("HH:mm:ss (z)") + ":\n";
                }
                seismoSamplesBuf.forEach(function(s) {
                    stringSeismoRaw += s.toFixed(3) + "\n";
                });
                filtered.forEach(function(s) {
                    stringSeismoFlt += s.toFixed(3) + "\n";
                });
            }

            seismoSamplesBuf = [];

            filtered.forEach(function(s) {
                seismoSamples.push(Math.pow(s, 2));
            })

            while(seismoSamples.length > config.seismo.data.sampletotal) {
                seismoSamples.shift();
            }

            if (!seismoReadyEarthquake) {
                if (seismoSampleCounter < config.seismo.data.sampletotal / config.seismo.data.samplerate) {
                    seismoSampleCounter++;
                }
                else {
                    seismoReadyEarthquake = true;
                    console.log(strings.debug.seismo.readye);
                }
            }

            if (seismoReadyEarthquake) {
                var samplesCopy = JSON.parse(JSON.stringify(seismoSamples));
                sampleMedian = median(samplesCopy);

                var nowS = Math.floor(now / 1000);
                var velocity = Math.sqrt(sampleMedian);

                //console.log("cnt: " + seismoSamples.length + " val: " + sampleMedian);

                if (config.seismo.outputfile) {
                    stringSeismoMed += sampleMedian.toFixed(3) + "\n";

                    var outDate = moment.tz(now, "UTC");

                    fs.appendFile(util.format(
                        config.seismo.file,
                        outDate.format("YYYY-MM-DD"),
                        "raw"
                    ), stringSeismoRaw, function (err) {
                        if (err)
                            throw err;
                    });
                    fs.appendFile(util.format(
                        config.seismo.file,
                        outDate.format("YYYY-MM-DD"),
                        "flt"
                    ), stringSeismoFlt, function (err) {
                        if (err)
                            throw err;
                    });
                    fs.appendFile(util.format(
                        config.seismo.file,
                        outDate.format("YYYY-MM-DD"),
                        "med"
                    ), stringSeismoMed, function (err) {
                        if (err)
                            throw err;
                    });
                }

                if (config.seismo.outputterm) {
                    console.log(velocity.toFixed(3) + " um/s");
                }

                if (!seismoIsShaking && !seismoIsQuake && velocity > config.seismo.detection.thresholdtrig) {
                    seismoIsShaking = true;
                    seismoQuakePrevTime = nowS;
                    seismoQuakeStartTimeTemp = nowS;

                    console.log(util.format(
                        strings.debug.seismo.qstartpr,
                        velocity.toFixed(3)
                    ));
                }

                if (seismoIsShaking && !seismoIsQuake && velocity > config.seismo.detection.thresholdprel && nowS - seismoQuakePrevTime <= config.seismo.detection.wait) {
                    console.log(util.format(
                        strings.debug.seismo.qtickpr,
                        velocity.toFixed(3)
                    ));
                }
                else if (seismoIsShaking && !seismoIsQuake && velocity > config.seismo.detection.thresholdprel && nowS - seismoQuakePrevTime > config.seismo.detection.wait) {
                    seismoIsQuake = true;
                    seismoQuakePrevTime = nowS;
                    seismoQuakeStartTime = seismoQuakeStartTimeTemp;

                    lastQuake = moment.tz(now, "UTC");                    
                    send(channelNameToID(config.options.channels.home), util.format(
                        strings.announcements.seismo.quake,
                        lastQuake.format("YYYY-MM-DD"),
                        lastQuake.format("HH:mm:ss (z)"),
                        generateEmojigraph(velocity),
                        velocity.toFixed(3)
                    ), false);

                    console.log(util.format(
                        strings.debug.seismo.qstartrl,
                        velocity.toFixed(3)
                    ));
                }

                if (seismoIsShaking && seismoIsQuake && velocity > config.seismo.detection.thresholdhold && nowS - seismoQuakePrevTime <= config.seismo.detection.hold) {
                    seismoQuakePrevTime = nowS;
                    seismoAccu.push(sampleMedian);

                    if (seismoAccu.length % config.seismo.detection.notice == 0) {                    
                        send(channelNameToID(config.options.channels.home), util.format(
                            strings.announcements.seismo.energy,
                            generateEmojigraph(velocity),
                            velocity.toFixed(3)
                        ), false);
                    }

                    console.log(util.format(
                        strings.debug.seismo.qtickrl,
                        velocity.toFixed(3)
                    ));
                }

                if (seismoIsShaking && seismoIsQuake && nowS - seismoQuakePrevTime > config.seismo.detection.hold) {
                    seismoIsShaking = false;
                    seismoIsQuake = false;

                    var diff = seismoQuakePrevTime - seismoQuakeStartTime + 1;

                    seconds = Math.floor(diff % 60);
                    diff = Math.floor(diff / 60);
                    minutes = Math.floor(diff % 60);

                    if (seconds < 10)
                        seconds = "0" + seconds;

                    var totalEnergy = 0;
                    seismoAccu.forEach(function(s) {
                        totalEnergy += s / seismoAccu.length;
                    });
                    seismoAccu.sort(function(a, b) {
                        return b - a;
                    });
                    var peakEnergy = seismoAccu[0];

                    seismoAccu = [];

                    send(channelNameToID(config.options.channels.home), util.format(
                        strings.announcements.seismo.end,
                        minutes,
                        seconds,
                        Math.sqrt(totalEnergy).toFixed(3),
                        totalEnergy.toFixed(3),
                        Math.sqrt(peakEnergy).toFixed(3),
                        peakEnergy.toFixed(3)
                    ), false);

                    console.log(strings.debug.seismo.qendrl);
                }
                else if (seismoIsShaking && !seismoIsQuake && nowS - seismoQuakePrevTime > config.seismo.detection.hold) {
                    seismoIsShaking = false;

                    console.log(strings.debug.seismo.qendpr);
                }
            }

            if (!seismoReadyFilter) {
                seismoReadyFilter = true;
                console.log(strings.debug.seismo.readyf);
            }
        }
    });

    udpServer.on("listening", () => {
        const address = udpServer.address();
        console.log(util.format(
            strings.debug.seismo.done,
            address.address,
            address.port
        ));
    });

    udpServer.bind(config.seismo.udpPort);
 }



/********************
 * STATUS MONITORING
 ********************/

/*
 * Periodically loops and checks status of various devices and components in the Lunar Infrastructure.
 */
function loopStatusPull() {
    statusVariPass();
    statusLuna();
    statusChrysalis();
    statusRarity();
    statusFluttershy();
    statusMoon();
    statusTantabus();

    setTimeout(loopStatusPull, config.options.statuspull * 1000);
}

/*
 * Periodically loops and pushes status data to the status page.
 */
function loopStatusPush() {
    var now =  Math.floor((new Date()) / 1000);

    var data = "";

    data += generateStatus("luna_local", statusGlobal.luna_local, now);
    data += generateStatus("luna_public", statusGlobal.luna_public, now);
    
    data += generateStatus("chrysalis_file_local", statusGlobal.chrysalis_file_local, now);
    data += generateStatus("chrysalis_file_public", statusGlobal.chrysalis_file_public, now);
    data += generateStatus("chrysalis_icecast_local", statusGlobal.chrysalis_icecast_local, now);
    data += generateStatus("chrysalis_icecast_public", statusGlobal.chrysalis_icecast_public, now);
    data += generateStatus("chrysalis_ann", statusGlobal.chrysalis_ann, now);

    data += generateStatus("pvfm", statusGlobal.pvfm, now);
    data += generateStatus("overlay_np", statusGlobal.overlay_np, now);
    data += generateStatus("overlay_lyrics", statusGlobal.overlay_lyrics, now);
    data += generateStatus("overlay_storyart", statusGlobal.overlay_storyart, now);
    data += generateStatus("exclaml", statusGlobal.exclaml, now);

    data += generateStatus("rarity_local", statusGlobal.rarity_local, now);
    data += generateStatus("rarity_public", statusGlobal.rarity_public, now);
    data += generateStatus("fluttershy_local", statusGlobal.fluttershy_local, now);
    data += generateStatus("moon_local", statusGlobal.moon_local, now);
    data += generateStatus("raritush", statusGlobal.raritush, now);

    data += generateStatus("tantabus_local", statusGlobal.tantabus_local, now);
    data += generateStatus("tantabus_public", statusGlobal.tantabus_public, now);

    data += generateStatus("varipass", statusGlobal.varipass, now);
    data += generateStatus("celly", statusGlobal.celly, now);
    data += generateStatus("chryssy", statusGlobal.chryssy, now);
    data += generateStatus("dashie", statusGlobal.dashie, now);
    data += generateStatus("unicorn", statusGlobal.unicorn, now);
    data += generateStatus("twilight", statusGlobal.twilight, now);

    data += generateStatus("tradfri", statusGlobal.tradfri, now);
    data += generateStatus("sparkle", statusGlobal.sparkle, now);
    data += generateStatus("maud", statusGlobal.maud, now);
    data += generateStatus("lulu", statusGlobal.lulu, now);

    var payload = {
            "key": httpkey.key,
            "data": data
        };

    var xhr = new XMLHttpRequest();
    xhr.open("POST", config.status.api, true);
    xhr.setRequestHeader("Content-type", "application/json");

    xhr.onreadystatechange = function () { 

        //console.log("status ready state: " + xhr.readyState + " status: " + xhr.status);
        if (xhr.readyState == 4)
            if (xhr.status != 200 && xhr.status != 503) {
                console.log(util.format(
                    strings.debug.status.error,
                    xhr.status
                ));
            }
    }
    xhr.onerror = function(err) {
        console.log(util.format(
            strings.debug.status.error,
            err.target.status
        ));
        xhr.abort();
    }
    xhr.ontimeout = function() {
        console.log(strings.debug.status.timeout);
        xhr.abort();
    }

    xhr.send(JSON.stringify(payload));

    setTimeout(loopStatusPush, config.options.statuspush * 1000);
}

/*
 * Checks the status of Pricness Luna's API.
 */
function statusLuna() {
    var url = util.format(
        config.status.urls.luna_local,
        httpkey.key
    );
    getStatus(url, statusTimeoutLunaLocal, function(r, s) {
        if (s == 200)
            if (r == config.status.responses.luna_local)
                statusGlobal.luna_local = Math.floor((new Date()) / 1000);
    });

    url = util.format(
        config.status.urls.luna_public,
        httpkey.port,
        httpkey.key
    );
    getStatus(url, statusTimeoutLunaPublic, function(r, s) {
        if (s == 200)
            if (r == config.status.responses.luna_public)
                statusGlobal.luna_public = Math.floor((new Date()) / 1000);
    });
}
    
/*
 * Checks the status of Queen Chrysalis.
 */
function statusChrysalis() {
    getStatus(config.status.urls.chrysalis_file_local, statusTimeoutChrysalisFileLocal, function(r, s) {
        if (r == config.status.responses.chrysalis_file_local)
            statusGlobal.chrysalis_file_local = Math.floor((new Date()) / 1000);
    });

    getStatus(config.status.urls.chrysalis_file_public, statusTimeoutChrysalisFilePublic, function(r, s) {
        if (r == config.status.responses.chrysalis_file_public)
            statusGlobal.chrysalis_file_public = Math.floor((new Date()) / 1000);
    });

    getStatus(config.status.urls.chrysalis_icecast_local, statusTimeoutChrysalisIcecastLocal, function(r, s) {
        if (s == 200)
            if (JSON.parse(r)[config.status.responses.chrysalis_icecast_local] != undefined)
                statusGlobal.chrysalis_icecast_local = Math.floor((new Date()) / 1000);
    });

    getStatus(config.status.urls.chrysalis_icecast_public, statusTimeoutChrysalisIcecastPublic, function(r, s) {
        if (s == 200)
            if (JSON.parse(r)[config.status.responses.chrysalis_icecast_public] != undefined)
                statusGlobal.chrysalis_icecast_public = Math.floor((new Date()) / 1000);
    });

    var url = util.format(
        config.status.urls.chrysalis_ann,
        httpkey.key
    );
    getStatus(url, statusTimeoutChrysalisAnn, function(r, s) {
        if (s == 200)
            if (r == config.status.responses.chrysalis_ann)
                statusGlobal.chrysalis_ann = Math.floor((new Date()) / 1000);
    });
}

/*
 * Checks the status of Nightmare Rarity.
 */
function statusRarity() {
    getStatus(config.status.urls.rarity_local, statusTimeoutRarityLocal, function(r, s) {
        if (r == config.status.responses.rarity_local)
            statusGlobal.rarity_local = Math.floor((new Date()) / 1000);
    });

    getStatus(printer.baseurl + config.status.urls.rarity_public, statusTimeoutRarityPublic, function(r, s) {
        if (r == config.status.responses.rarity_public)
            statusGlobal.rarity_public = Math.floor((new Date()) / 1000);
    });
}

/*
 * Checks the status of Nightmare Fluttershy.
 */
function statusFluttershy() {
    getStatus(config.status.simple.fluttershy_local, statusTimeoutFluttershyLocal, function(r, s) {
        if (s == 200)
            statusGlobal.fluttershy_local = Math.floor((new Date()) / 1000);
    });
}

/*
 * Checks the status of Nightmare Moon.
 */
function statusMoon() {
    getStatus(config.status.simple.moon_local, statusTimeoutMoonLocal, function(r, s) {
        if (s == 200)
            statusGlobal.moon_local = Math.floor((new Date()) / 1000);
    });
}

/*
 * Checks the status of Tantabus.
 */
function statusTantabus() {
    getStatus(config.status.urls.tantabus_local, statusTimeoutTantabusLocal, function(r, s) {
        if (r == config.status.responses.tantabus_local)
            statusGlobal.tantabus_local = Math.floor((new Date()) / 1000);
    });

    getStatus(config.status.urls.tantabus_public, statusTimeoutTantabusPublic, function(r, s) {
        if (r == config.status.responses.tantabus_public)
            statusGlobal.tantabus_public = Math.floor((new Date()) / 1000);
    });
}

/*
 * Fetches the status of a device using REST API.
 * @param  url       URL to connect to.
 * @param  timeout   The timeout object to use.
 * @param  callback  Callback function called once processing is done.
 */
function getStatus(url, timeout, callback) {
    var xhr = new XMLHttpRequest();

    xhr.open("GET", url, true);

    xhr.onreadystatechange = function () { 
        if (xhr.readyState == 4) {
            //console.log("Url: " + url);
            //console.log("   status: " + xhr.status + " text: " + xhr.responseText);
            callback(xhr.responseText, xhr.status);            
            clearTimeout(timeout);
        }
    }
    xhr.onerror = function(err) {
        console.log(util.format(
            strings.debug.status.error,
            err.target.status
        ));
        xhr.abort();
    }
    xhr.ontimeout = function() {
        console.log(strings.debug.status.timeout);
        xhr.abort();
    }

    xhr.send();

    timeout = setTimeout(function() {
        xhr.abort();
    }, config.status.timeout * 1000);
}

/*
 * Generates a status value string.
 * @param  key  Key of the status.
 * @param  val  Response timestamp to use.
 * @param  now  Current timestamp to use.
 * @return      The formatted string.
 */
function generateStatus(key, val, now) {
    var value;
    if (val == undefined)
        value = "undefined";
    else
        value = (now - val).toString();

    return key + ":" + value + ",";
}



/**************************
 * MISCELLANEOUS FUNCTIONS
 **************************/

 /*
 * Processes the change to now plying data.
 */
function processNowPlayingChange() {
    isShowingLyrics = false;
    isShowingStory  = false;
    isShowingArt    = false;
        
    Object.keys(nptoggles).forEach(function(n, i) {
        if (nptoggles[n]) {
            if (np.nowplaying != undefined) {

                if (config.options.storymode && story[np.nowplaying] != undefined) {

                    // Post story
                    send(n, story[np.nowplaying], true);

                    // Post art
                    if (art[np.nowplaying] != undefined) {
                        setTimeout(function() {
                            var parts = art[np.nowplaying].split(".");
                            var artimg = util.format(
                                config.options.artimg,
                                n,
                                parts[parts.length-1]
                            );
                            download(art[np.nowplaying], artimg, function() {
                                console.log(strings.debug.download.stop);
                                embed(n, "", artimg, np.nowplaying + "." + parts[parts.length-1], true, true);
                            }, function() {
                            }, 0);
                        }, config.options.nptstoryart * 1000);
                    }

                    // Post track name with delay
                    setTimeout(function() {
                        send(n, util.format(
                            strings.announcements.nowplaying,
                            np.nowplaying
                        ), true);
                    }, config.options.nptstorytrack * 1000);
                }
                else {

                    // Post track name normally
                    send(n, util.format(
                        strings.announcements.nowplaying,
                        np.nowplaying
                    ), true);

                    // Post art
                    if (art[np.nowplaying] != undefined) {
                        setTimeout(function() {
                            var parts = art[np.nowplaying].split(".");
                            var artimg = util.format(
                                config.options.artimg,
                                n,
                                parts[parts.length-1]
                            );
                            download(art[np.nowplaying], artimg, function() {
                                console.log(strings.debug.download.stop);
                                embed(n, "", artimg, np.nowplaying + "." + parts[parts.length-1], true, true);
                            }, function() {
                            }, 0);
                        }, config.options.nptstoryart * 1000);
                    }
                }
            }
            else
                send(n, strings.announcements.nperror, true);
        }
    });

    if (np.nowplaying != undefined) {

        if (story[np.nowplaying] != undefined) {

            // Show story
            isShowingStory = true;

            // Show art
            if (art[np.nowplaying] != undefined) {
                setTimeout(function() {
                    isShowingArt = true;
                }, config.options.nptstoryart * 1000);
            }

            // Show track name with delay
            setTimeout(function() {
                npover = JSON.parse(JSON.stringify(np));
            }, config.options.nptstorytrack * 1000);

        }
        else {
            // Show track name normally
            npover = JSON.parse(JSON.stringify(np));

            // Show art
            if (art[np.nowplaying] != undefined) {
                setTimeout(function() {
                    isShowingArt = true;
                }, config.options.nptstoryart * 1000);
            }
        }
    }
    else
        send(channelNameToID(config.options.channels.debug), util.format(
            strings.announcements.nperrorv,
            np.response
        ), false);
}

/*
 * Loops to continuously retrieve now playing data.
 */
function loopNowPlaying() {
    if (!nppaused) {
        var xhr = new XMLHttpRequest();
        xhr.open("GET", config.nowplaying.url, true);

        xhr.onreadystatechange = function () { 
            if (xhr.readyState == 4 && xhr.status == 200) {
                var response
                try {
                    response = JSON.parse(xhr.responseText);
                }
                catch(error) {
                }
                statusGlobal.pvfm = Math.floor((new Date()) / 1000);
                np.response = response;
                if (response != undefined) {
                    if (npradio == undefined || npradio.title != response.title || npradio.artist != response.artist) {
                        if (response.artist == config.nowplaying.ignore.artist && response.title == config.nowplaying.ignore.title) {
                            console.log(util.format(
                                strings.debug.nptoggles.instability,
                                response.artist,
                                response.title
                            ));                            
                        }
                        else {
                            npradio = response;
                            if (npradio.artist != undefined)
                                npradio.nowplaying = npradio.artist + config.separators.track + npradio.title;
                            else
                                npradio.nowplaying = npradio.title;

                            np = response;
                            if (np.artist != undefined)
                                np.nowplaying = np.artist + config.separators.track + np.title;
                            else
                                np.nowplaying = np.title;

                            if (npstarted)
                                processNowPlayingChange();
                            else
                                npstarted = true;
                    }
                    }
                }
            }
        }

        xhr.send();
    }
    setTimeout(loopNowPlaying, config.nowplaying.timeout * 1000);
}

/*
 * Loops to continuously retrieve corona data.
 */
function loopCorona() {
    if (config.corona.enabled) {
        var xhrTotal = new XMLHttpRequest();
        xhrTotal.open("GET", config.corona.urls.total, true);

        xhrTotal.onreadystatechange = function () { 
            if (xhrTotal.readyState == 4 && xhrTotal.status == 200) {
                var response;
                try {
                    response = JSON.parse(xhrTotal.responseText);
                }
                catch(error) {
                }
                if (response != undefined) {
                    var dateNew = response[0].Datum;
                    if (dateNew.trim() != corona.dateTotal.trim()) {
                        corona.dateTotal = dateNew;
                        fs.writeFileSync(config.corona.path, JSON.stringify(corona), "utf-8");

                        send(channelNameToID(config.options.channels.home), util.format(
                            strings.announcements.corona.total,
                            response[0].Datum,
                            response[0].SlucajeviHrvatska - response[1].SlucajeviHrvatska,
                            response[0].IzlijeceniHrvatska - response[1].IzlijeceniHrvatska,
                            response[0].UmrliHrvatska - response[1].UmrliHrvatska
                        ), true);
                    }
                }
            }
        }

        xhrTotal.send();


        var xhrCounty = new XMLHttpRequest();
        xhrCounty.open("GET", config.corona.urls.county, true);

        xhrCounty.onreadystatechange = function () { 
            if (xhrCounty.readyState == 4 && xhrCounty.status == 200) {
                var response;
                try {
                    response = JSON.parse(xhrCounty.responseText);
                }
                catch(error) {
                }
                if (response != undefined) {
                    var dateNew = response[0].Datum;
                    if (dateNew.trim() != corona.dateCounty.trim()) {
                        corona.dateCounty = dateNew;
                        fs.writeFileSync(config.corona.path, JSON.stringify(corona), "utf-8");

                        var infectedNew;
                        var infectedOld;
                        var diedNew;
                        var diedOld;

                        response[0].PodaciDetaljno.forEach(function (c) {
                            if (c.Zupanija.trim() == config.corona.county.trim()) {
                                infectedNew = c.broj_zarazenih;
                                diedNew = c.broj_umrlih;
                            }
                        });

                        response[1].PodaciDetaljno.forEach(function (c) {
                            if (c.Zupanija.trim() == config.corona.county.trim()) {
                                infectedOld = c.broj_zarazenih;
                                diedOld = c.broj_umrlih;
                            }
                        });

                        send(channelNameToID(config.options.channels.home), util.format(
                            strings.announcements.corona.county,
                            config.corona.county,
                            response[0].Datum,
                            infectedNew - infectedOld,
                            diedNew - diedOld
                        ), true);
                    }
                }
            }
        }

        xhrCounty.send();
    }
    setTimeout(loopCorona, config.corona.timeout * 1000);
}

/*
 * Reloads the configuration.
 */
function reloadConfig() {  
    token      = JSON.parse(fs.readFileSync(config.options.configpath + "token.json", "utf8"));
    config     = JSON.parse(fs.readFileSync(config.options.configpath + "config.json", "utf8"));
    commands   = JSON.parse(fs.readFileSync(config.options.configpath + "commands.json", "utf8"));
    custom     = JSON.parse(fs.readFileSync(config.options.configpath + "custom.json", "utf8"));
    strings    = JSON.parse(fs.readFileSync(config.options.configpath + "strings.json", "utf8"));
    gotn       = JSON.parse(fs.readFileSync(config.options.configpath + "gotn.json", "utf8"));
    mlp        = JSON.parse(fs.readFileSync(config.options.configpath + "mlp.json", "utf8"));
    channels   = JSON.parse(fs.readFileSync(config.options.configpath + "channels.json", "utf8"));
    varipass   = JSON.parse(fs.readFileSync(config.options.configpath + "varipass.json", "utf8"));
    printer    = JSON.parse(fs.readFileSync(config.options.configpath + "printer.json", "utf8"));
    dtls       = JSON.parse(fs.readFileSync(config.options.configpath + "dtls.json", "utf8"));
    tradfri    = JSON.parse(fs.readFileSync(config.options.configpath + "tradfri.json", "utf8"));
    schedule   = JSON.parse(fs.readFileSync(config.options.configpath + "schedule.json", "utf8"));
    httpkey    = JSON.parse(fs.readFileSync(config.options.configpath + "httpkey.json", "utf8"));
    mac        = JSON.parse(fs.readFileSync(config.options.configpath + "mac.json", "utf8"));
    blitzor    = JSON.parse(fs.readFileSync(config.options.configpath + "blitzor.json", "utf8"));
    thori      = JSON.parse(fs.readFileSync(config.options.configpath + "thori.json", "utf8"));
    devices    = JSON.parse(fs.readFileSync(config.options.configpath + "devices.json", "utf8"));
    reactrole  = JSON.parse(fs.readFileSync(config.options.configpath + "reactrole.json", "utf8"));
    talosmeets = JSON.parse(fs.readFileSync(config.options.configpath + "talosmeets.json", "utf8"));

    moon = JSON.parse(fs.readFileSync(config.moon.lunamoon.pathdata, "utf8"));

    clearTimeout(lightningReconnect);
    blitzorws.close();

    if (lightningRange > blitzor.range) {
        lightningRange = blitzor.range;
        lightningNew = blitzor.range;
    }

    connectBlitzortung(false);

    if (isChasing) {
        clearTimeout(chaseReconnect);
        chasews.close();

        if (chaseRange > blitzor.range) {
            chaseRange = blitzor.range;
            chaseNew = blitzor.range;
        }

        connectChase(false);
    }

    prepareReactroleMessages();
    updateTalosMeets();
}

/*
 * Saves EEG data to a CSV file.
 */
function saveEEG() {
    var file;

    if (eegTable.length > 0) {
        file = fs.createWriteStream(config.eeg.basicpath);

        file.on("error", function(err) {
            console.log(util.format(
                strings.debug.eegerror, 
                err
            ));
            return;
        });

        file.write(strings.misc.eeg.basic.title, "utf-8");
        eegTable.forEach(function(e) {
            file.write(util.format(
                strings.misc.eeg.basic.values,
                e.time,
                e.battery,
                e.signal
            ), "utf-8");
        });

        file.end();

        var file = fs.createWriteStream(config.eeg.rawpath);

        file.on("error", function(err) {
            console.log(util.format(
                strings.debug.eegerror, 
                err
            ));
            return;
        });

        file.write(strings.misc.eeg.raw.title, "utf-8");
        eegTable.forEach(function(e) {
            file.write(util.format(
                strings.misc.eeg.raw.values,
                e.time,
                e.attention,
                e.meditation,
                e.waves[0],
                e.waves[1],
                e.waves[2],
                e.waves[3],
                e.waves[4],
                e.waves[5],
                e.waves[6],
                e.waves[7],
                e.sumlow,
                e.sumhigh
            ), "utf-8");
        });

        file.end();
    }

    if (eegTableEMA.length > 0) {
        var file = fs.createWriteStream(config.eeg.emapath);

        file.on("error", function(err) {
            console.log(util.format(
                strings.debug.eegerror, 
                err
            ));
            return;
        });

        file.write(strings.misc.eeg.ema.title, "utf-8");
        eegTableEMA.forEach(function(e) {
            file.write(util.format(
                strings.misc.eeg.ema.values,
                e.time,
                e.attention,
                e.meditation,
                e.waves[0],
                e.waves[1],
                e.waves[2],
                e.waves[3],
                e.waves[4],
                e.waves[5],
                e.waves[6],
                e.waves[7],
                e.sumlow,
                e.sumhigh
            ), "utf-8");
        });

        file.end();
    }
}

/*
 * Performs a seizure induced reboot.
 * @param  channelID  Channel ID where the seizure happened.
 * @param  userID     User ID who caused the seizure.
 * @param  message    Message which caused the seizure.
 */
function seizureReboot(channelID, userID, message) {
    rebooting = true;

    Object.keys(nptoggles).forEach(function(n, i) {
        if (nptoggles[n])
            send(n, strings.announcements.npreboot, true);
    });
    send(channelNameToID(config.options.channels.debug), util.format(
        strings.announcements.seizure.debug,
        channelIDToName(channelID),
        message
    ), false);
    send(channelID, util.format(
        strings.announcements.seizure.reply,
        mention(userID)
    ), false);

    var seizure = {};
    seizure.channel = channelID;
    seizure.user = userID;
    fs.writeFileSync(config.options.seizurepath, JSON.stringify(seizure), "utf-8");

    saveAllBrains();
    blitzorws.close();

    setTimeout(function() {
        printStopMessage();
        process.exit();
    }, config.options.reboottime * 1000);
}

/*
 * h
 * @param  channelID h
 */
function h(channelID) {
    if (hTrack[channelID] == undefined) {       
        hTrack[channelID] = moment();
        setTimeout(function() {
            send(channelID, strings.misc.h, true);
        }, config.options.hmessage * 1000);
    }
    else if (moment() - hTrack[channelID] >= config.options.htimeout * 1000) {
        hTrack[channelID] = moment();
        setTimeout(function() {
            send(channelID, strings.misc.h, true);
        }, config.options.hmessage * 1000);
    }
    else {
        hTrack[channelID] = moment();
    }
}

/* 
 * Generates time for upcoming Faction Assault.
 * @param  region  Region to return the assault time for.
 * @return         Time of the assault, as moment.
 */
function getAssault(region) {
    var countDownDate = moment(1000 * config.wow.assault.regions[region]);
    for (var o = moment(), n = countDownDate - o, r = countDownDate; n < 0;) {
        //console.log((r + 0) / 1000);
        n = (r = r.clone().add(19, "hours")) - o;
    }
    return r.clone();
}

/* 
 * Prepares an assult announcement.
 */
function prepareAssaultAnnounce() {
    var dueTime = new Date(getAssault("EU"));

    var job = new CronJob(dueTime, function() {
        setTimeout(function() {
            send(channelNameToID(config.options.channels.home), util.format(
                strings.announcements.wow.assault,
                getTimeLeft((new Date()) - 2000, new Date(getAssault("EU")), "")
            ), true);

            prepareAssaultAnnounce();
        }, 1000);

    }, function () {}, true);

    console.log(util.format(
        strings.debug.assaults.date,
        dueTime
    ));  
}

/* 
 * Generates time for upcoming daily cron procedures.
 * @return         Time of the procedures, as moment.
 */
function getDailyCronTime() {
    var partsTime = config.options.dailycron.split(config.separators.time);

    var parseDate = new Date();
    parseDate.setHours(partsTime[0]);
    parseDate.setMinutes(partsTime[1]);
    parseDate.setSeconds(0);
    parseDate.setMilliseconds(0);

    var countDownDate = moment(parseDate);
    for (var o = moment(), n = countDownDate - o, r = countDownDate; n < 0;) {
        //console.log((r + 0) / 1000);
        n = (r = r.clone().add(24, "hours")) - o;
    }
    return r.clone();
}

/* 
 * Prepares a daily cron procedure.
 */
function prepareDailyCron() {
    var dueTime = new Date(getDailyCronTime());

    var job = new CronJob(dueTime, function() {

        // Daily cron events
        avgVariPass();
        updateTalosMeets();
        checkTradfriBatteries();

        setTimeout(function() {
            prepareDailyCron();
        }, 1000);
    }, function () {}, true);

    console.log(util.format(
        strings.debug.dailycron.date,
        dueTime
    ));  
}

/* 
 * Prepares a daily cron procedure.
 */
function updateTalosMeets() {
    var message = {};
    message.channelID = channelNameToID(talosmeets.channel);
    message.messageID = talosmeets.messageid;

    bot.getMessage(message, function(err, msg) {
        if (msg != undefined) {
            console.log(strings.debug.talosmeets.start);

            var text = strings.announcements.talosmeets.base;

            var oneDay = 1000 * 60 * 60 * 24;
            var partsStart = talosmeets.startday.split(config.separators.date);
            var start = new Date(partsStart[0], parseInt(partsStart[1]) - 1, partsStart[2], 0, 0, 0, 0);
            var now = new Date();
            var nowBase = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
            //console.log(nowBase.getFullYear() + "-" + (nowBase.getMonth() + 1) + "-" + now.getDate());
            var dayFromStart = Math.floor((nowBase - start) / oneDay);
            var dayInSet = dayFromStart % talosmeets.cycledays + 1;

            var maxshown = talosmeets.maxshown;
            if (maxshown > talosmeets.schedule.length)
                maxshown = talosmeets.schedule.length;
            var count = 0;

            for (i = 0; i < talosmeets.schedule.length; i++) {
                if (talosmeets.schedule[i].day >= dayInSet && count < maxshown) {
                    count++;
                    text += createTalosMeetup(i, nowBase, dayInSet, oneDay);
                }
            }

            for (i = 0; i < talosmeets.schedule.length; i++) {
                if (count < maxshown) {
                    count++;
                    text += createTalosMeetup(i, nowBase, dayInSet - talosmeets.cycledays, oneDay);
                }
            }

            text += util.format(
                strings.announcements.talosmeets.footer,
                getDiscordTimestamp(now, "R")
            );

            console.log(strings.debug.talosmeets.done);

            edit(channelNameToID(talosmeets.channel), talosmeets.messageid, text, false);
        }
        else {
            send(channelNameToID(talosmeets.channel), strings.announcements.talosmeets.inital, false);
        }
    });
}

/* 
 * Checks status of Tradfri remote batteries.
 */
function checkTradfriBatteries() {
    refreshTradfriDevices(function(result) {
        if (result) {
            var found = false;
            var message = "";
            tRemotes.forEach(function(d) {
                if (d.battery <= tradfri.lowbattery) {
                    if (!found) {
                        found = true;
                        message = util.format(
                            strings.announcements.tradfri.batterystart,
                            mention(config.options.adminid)       
                        );
                    }
                    message += util.format(
                        strings.announcements.tradfri.batteryentry,
                        d.battery,
                        d.name
                    );
                    send(channelNameToID(config.options.channels.debug), message, false);
                }
            });
        }
        else {
            send(channelNameToID(config.options.channels.debug), strings.misc.tradfrierror, false);
        }
    });
}

/* 
 * Generates a string for a single Talos meetup.
 * @param  i         ID of the meetup in the list.
 * @param  nowBase   Date object of current day, at midnight.
 * @param  dayInSet  Current day's number in the set.
 * @param  oneDay    Length of one day.
 * @return           Generated meetup string.
 */
function createTalosMeetup(i, nowBase, dayInSet, oneDay) {
    var meetupDate = new Date(nowBase.getTime() + (talosmeets.schedule[i].day - dayInSet) * oneDay);
    var partsMeetupTime = talosmeets.schedule[i].time.split(config.separators.time);
    meetupDate.setHours(partsMeetupTime[0]);
    meetupDate.setMinutes(partsMeetupTime[1]);
    console.log(util.format(
        strings.debug.talosmeets.add,
        talosmeets.schedule[i].day,
        talosmeets.schedule[i].name,
        talosmeets.schedule[i].time,
        meetupDate.toUTCString()
    ));
    return util.format(
        strings.announcements.talosmeets.meetup,
        getDiscordTimestamp(meetupDate),
        getDiscordTimestamp(meetupDate, "R"),
        talosmeets.schedule[i].name
    );
}

/*
 * Pauses the Octoprint job.
 * @param  retry  Number of times to retry the command if connection fails.
 */
function pausePrint(retry) {
    if (retry > 0) {
        var payload = {
                "command": "pause",
                "action":  "pause"
            };

        var xhr = new XMLHttpRequest();
        xhr.open("POST", printer.baseurl + config.printer.urls.job + printer.key, true);
        xhr.setRequestHeader("Content-Type", "application/json");

        xhr.onerror = function(err) {
            console.log(util.format(
                strings.debug.printer.error,
                retry - 1
            ));
            xhr.abort();
            pausePrint(retry - 1);
        }
        xhr.ontimeout = function() {
            console.log(util.format(
                strings.debug.printer.error,
                retry - 1
            ));
            xhr.abort();
            pausePrint(retry - 1);
        }

        xhr.send(JSON.stringify(payload));
    }
}

/*
 * Called when print is detected as finished. May also be called on cancelled.
 */
function finishPrint() {  
    console.log(strings.debug.printer.rampC);

    var dateNow = Math.floor((new Date()) / 1000);
    var diff = dateNow - tushStart;
    var time = {};

    time.seconds = Math.floor(diff % 60);
    diff = Math.floor(diff / 60);
    time.minutes = Math.floor(diff % 60);
    diff = Math.floor(diff / 60);
    time.hours = Math.floor(diff % 24);
    time.days = Math.floor(diff / 24);

    send(channelNameToID(config.options.channels.printer), util.format(
        strings.announcements.tush.finish,
        mention(config.options.adminid),
        getTimeString(time),
        time.seconds        
    ), false);

    download(printer.baseurl + printer.webcam, config.printer.webimg, function(code) {
        if (code != 503)  
            embed(channelNameToID(config.options.channels.printer), "", config.printer.webimg, "Nightmare Rarity Webcam.jpg", false, true);
        else
            send(channelNameToID(config.options.channels.printer), strings.announcements.tush.error, false);
    }, function() {
        send(channelNameToID(config.options.channels.printer), strings.announcements.tush.error, false);     
    }, 0);
}

/*
 * Prints stop message to console.
 */
function printStopMessage() {
    console.log(" ");
    console.log(strings.debug.stopped);
    console.log(" ");
}

/*
 * Downloads a file from the web.
 * @param  uri       URL to the file to download.
 * @param  filename  Path to location where file will be saved.
 * @param  callback  Callback function to call once done.
 */
var download = function(uri, filename, callbackDone, callbackErr, count, useJson = true) {
    if (count < config.options.downloadtry) {
        request.head(uri, function(err, res, body) {
            console.log(util.format(
                strings.debug.download.start,
                uri
            ));

            if (useJson)
                request({
                    "method": "GET", 
                    "rejectUnauthorized": false, 
                    "url": uri,
                    "headers" : {"Content-Type": "application/json"},
                    function(err,data,body) {}
                }).on("error", function(err) {
                    count++;
                    console.log(util.format(
                        strings.debug.download.error,
                        err
                    ));
                    download(uri, filename, callbackDone, callbackErr, count);
                }).pipe(fs.createWriteStream(filename)).on("close", callbackDone);
            else
                request({
                    "method": "GET", 
                    "rejectUnauthorized": false, 
                    "url": uri,
                    function(err,data,body) {}
                }).on("error", function(err) {
                    count++;
                    console.log(util.format(
                        strings.debug.download.error,
                        err
                    ));
                    download(uri, filename, callbackDone, callbackErr, count);
                }).pipe(fs.createWriteStream(filename)).on("close", function() {
                    callbackDone(response.statusCode);
                });
        });
    }
    else {
        callbackErr();
    }
};



// Start the bot.
startupProcedure();