// Modules
const util           = require("util")
const fs             = require("fs");
const readline       = require("readline");
const http           = require("http");
const url            = require('url');
const exec           = require('child_process').exec;
const WebSocket      = require('ws');

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

const package  = require("./package.json");

// Load file data
var token    = require("./config/token.json");
var config   = require("./config/config.json");
var commands = require("./config/commands.json");
var custom   = require("./config/custom.json");
var strings  = require("./config/strings.json");
var gotn     = require("./config/gotn.json");
var mlp      = require("./config/mlp.json");
var channels = require("./config/channels.json");
var varipass = require("./config/varipass.json");
var printer  = require("./config/printer.json");
var dtls     = require("./config/dtls.json");
var tradfri  = require("./config/tradfri.json");
var schedule = require("./config/schedule.json");
var wow      = require("./config/wow.json");
var httpkey  = require("./config/httpkey.json");
var mac      = require("./config/mac.json");
var blitzor  = require("./config/blitzor.json");
var thori    = require("./config/thori.json");

// Commands
var comm = {};

// Command: !gotn
comm.gotn = function(data) {
    var now = new Date();
    var found = false;

    var timezone = data.message.replace(config.options.commandsymbol + data.command + " ", "");
    if (timezone == "" || timezone == config.options.commandsymbol + data.command)
        timezone = "UTC";

    if (moment.tz.zone(timezone)) {
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
    if (timezone == "" || timezone == config.options.commandsymbol + data.command)
        timezone = "UTC";

    if (moment.tz.zone(timezone)) {
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

    if (timezone == "" || timezone == config.options.commandsymbol + data.command || useEq)
        timezone = "UTC";

    if (moment.tz.zone(timezone)) {

        if (useEq) {
            var momentTime = moment.tz(now / 8760 + 93*365*24*60*60*1000 + 11*60*60*1000, timezone);
            send(data.channelID, util.format(
                strings.commands.time.message, 
                mention(data.userID),
                momentTime.format("ddd MMM DD, YYYY"),
                momentTime.format("HH:mm:ss") + " (QST)",
                Math.round(momentTime / 1000)
            ), true);
        }
        else {
            var momentTime = moment.tz(now, timezone);
            send(data.channelID, util.format(
                strings.commands.time.message, 
                mention(data.userID),
                momentTime.format("ddd MMM DD, YYYY"),
                momentTime.format("HH:mm:ss (z)"),
                Math.round(momentTime / 1000)
            ), true);
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
    if (timezone == "" || timezone == config.options.commandsymbol + data.command)
        timezone = "UTC";

    if (moment.tz.zone(timezone)) {

        var found = false;
        phases.forEach(function(p) {
            if (!found) {

                var datePhase = new Date(p.date + " " + p.time);
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

            if (phaseNext != config.options.fullmoon) {
                found = false;
                phases.forEach(function(p) {
                    if (!found) {

                        var datePhase = new Date(p.date + " " + p.time);
                        if (datePhase > dateNow && p.phase == config.options.fullmoon) {

                            message += util.format(
                                " " + strings.commands.phase.messageB,
                                getPhaseString(config.options.fullmoon, 0),
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
    send(data.channelID, util.format(
        strings.commands.moon.messageA,
        mention(data.userID)
    ), true);

    download(config.options.moonurl, config.options.moonimg, function() {
        console.log(strings.debug.download.stop);
        embed(data.channelID, strings.commands.moon.messageB, config.options.moonimg, "Moon " + (new Date()) + ".png", true, true);
    });
};

// Command: !room
comm.room = function(data) {

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
            console.log(strings.debug.varipass.done);

            var diff = (vpData.current - vpData.list[0].history[0].time);
            var time = {};

            time.seconds = Math.floor(diff % 60);
            diff = Math.floor(diff / 60);
            time.minutes = Math.floor(diff % 60);
            diff = Math.floor(diff / 60);
            time.hours = Math.floor(diff % 24);
            time.days = Math.floor(diff / 24);

            send(data.channelID, util.format(
                strings.commands.room.message, 
                mention(data.userID),
                getTimeString(time),
                time.seconds,
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
                findVariable(vpData, varipass.main.ids.doseema).history[0].value,
                findVariable(vpData, varipass.main.ids.counts).history[0].value
            ), true);
        }
    }
    xhr.onerror = function(err) {
        console.log(util.format(
            strings.debug.varipass.error,
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
    var diff = dateNow - powerTime;
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

    download(printer.webcam, printer.printerimg, function() {

        var xhr = new XMLHttpRequest();
        xhr.open("GET", printer.api, true);

        xhr.onreadystatechange = function () { 
            if (xhr.readyState == 4 && xhr.status == 200) {
                var response = JSON.parse(xhr.responseText);
                if (response.progress.completion != null && response.state == "Printing") {

                    var left = response.progress.printTimeLeft;
                    var time = {};

                    time.seconds = Math.floor(left % 60);
                    left = Math.floor(left / 60);
                    time.minutes = Math.floor(left % 60);
                    left = Math.floor(left / 60);
                    time.hours = Math.floor(left % 24);
                    time.days = Math.floor(left / 24);


                    embed(data.channelID, util.format(
                        strings.commands.printer.messageC, 
                        response.job.file.name,
                        response.progress.completion.toFixed(1),
                        getTimeString(time)
                    ), printer.printerimg, "Nightmare Rarity Webcam.jpg", true, true);
                }
                else {
                    embed(data.channelID, strings.commands.printer.messageB, printer.printerimg, "Nightmare Rarity Webcam.jpg", true, true);
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
    });
};

// Command: !token
comm.token = function(data) {

    var url = config.wow.url + util.format(
        config.wow.token.url,
        wow.access_token
    );

    var xhr = new XMLHttpRequest();
    xhr.open("GET", url, true);

    xhr.onreadystatechange = function () { 
        if (xhr.readyState == 4 && xhr.status == 200) {
            var response = JSON.parse(xhr.responseText);

            if (response.price != undefined) {

                var now = new Date();

                var diff = (now - response.last_updated_timestamp) / 1000;
                var time = {};

                time.seconds = Math.floor(diff % 60);
                diff = Math.floor(diff / 60);
                time.minutes = Math.floor(diff % 60);
                diff = Math.floor(diff / 60);
                time.hours = Math.floor(diff % 24);
                time.days = Math.floor(diff / 24);

                send(data.channelID, util.format(
                    strings.commands.token.message,
                    getWoWPrice(response.price),
                    getTimeString(time)
                ), true);
            }
            else {
                send(data.channelID, strings.commands.token.error, true);
            }
        }
    }

    xhr.onerror = function(err) {
        send(data.channelID, strings.commands.token.error, true);
        xhr.abort();
    }
    xhr.ontimeout = function() {
        send(data.channelID, strings.commands.token.error, true);
        xhr.abort();
    }

    xhr.send();
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
	            strings.debug.varipass.error,
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

// Command: !stats
comm.stats = function(data) {
    var dateNow = new Date();

    var timezone = data.message.replace(config.options.commandsymbol + data.command + " ", "");
    if (timezone == "" || timezone == config.options.commandsymbol + data.command)
        timezone = "UTC";

    if (moment.tz.zone(timezone)) {

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

        send(data.channelID, util.format(
            strings.commands.stats.message,
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
        if (i < 10)
            if (c.type == "public")
                reply += util.format(
                    strings.commands.help.messageB, 
                    config.options.commandsymbol,
                    c.command,
                    c.help
                );
    });

    send(data.userID, reply, true);

    setTimeout(function() {
        var reply = "";

        commands.list.forEach(function(c, i) {
            if (i >= 10)
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
    }, 2000);

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

            sendLargeMessage(data, lyrics[np.nowplaying].split("\n"), util.format(
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

        data.channelID = data.userID;
        sendLargeMessage(data, Object.keys(lyrics).sort(), util.format(
            strings.commands.lyrics.listB
        ), false);
    }
    else if (lyrics[param] != undefined) {

        sendLargeMessage(data, lyrics[param].split("\n"), util.format(
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

// Command: !artwork
comm.artwork = function(data) {
    var param = data.message.replace(config.options.commandsymbol + data.command + " ", "");

    if (param == "" || param == config.options.commandsymbol + data.command) {
        if (artwork[np.nowplaying] != undefined) {

            send(data.channelID, util.format(
                strings.commands.artwork.load,
                mention(data.userID)
            ), true);

            download(artwork[np.nowplaying], config.options.artimg, function() {
                console.log(strings.debug.download.stop);
                embed(data.channelID, strings.commands.artwork.radio, config.options.artimg, np.nowplaying + ".png", true, true);
            });

        }
        else {

            send(data.channelID, util.format(
                strings.commands.artwork.errorB,
                mention(data.userID)
            ), true);

        }
    }
    else if (param == "list") {
        if (bot.channels[data.channelID] != undefined)  
            send(data.channelID, util.format(
                strings.commands.artwork.listA, 
                mention(data.userID)
            ), true);

        data.channelID = data.userID;
        sendLargeMessage(data, Object.keys(artwork).sort(), util.format(
            strings.commands.artwork.listB
        ), false);
    }
    else if (artwork[param] != undefined) {

        send(data.channelID, util.format(
            strings.commands.artwork.load,
            mention(data.userID)
        ), true);

        download(artwork[param], config.options.artimg, function() {
            console.log(strings.debug.download.stop);
            embed(data.channelID, strings.commands.artwork.message, config.options.artimg, param + ".png", true, true);
        });

    }
    else {
        send(data.channelID, util.format(
            strings.commands.artwork.errorA,
            mention(data.userID)
        ), true);
    }
};

// Command: !nptoggle
comm.nptoggle = function(data) {
    if (nptoggles[data.channelID] == undefined) {
        nptoggles[data.channelID] = true;
        send(data.channelID, util.format(
            strings.commands.nptoggle.messageA, 
            mention(data.userID)
        ), true);

        console.log(util.format(
            strings.debug.nptoggles.add,
            channelIDToName(data.channelID),
            data.channelID
        ));

        setTimeout(function() {
            if (np.nowplaying != undefined)
                send(data.channelID, util.format(
                    strings.announcements.nowplaying,
                    np.nowplaying
                ), true);
            else
                send(data.channelID, strings.announcements.nperror, true);
        }, 1000);       
    }
    else {
        delete nptoggles[data.channelID];
        send(data.channelID, util.format(
            strings.commands.nptoggle.messageB, 
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

// Command: !npoverride
comm.npoverride = function(data) {
    var track = data.message.replace(config.options.commandsymbol + data.command + " ", "");
    if (track == "" || track == config.options.commandsymbol + data.command) {
        send(data.channelID, util.format(
            strings.commands.npoverride.error,
            mention(data.userID)
        ),  false);
    }
    else {
        send(data.channelID, util.format(
            strings.commands.npoverride.message, 
            mention(data.userID),
            track
        ), false);

        np.nowplaying = track;

        Object.keys(nptoggles).forEach(function(n, i) {
            if (nptoggles[n])
                if (np.nowplaying != undefined)
                    send(n, util.format(
                        strings.announcements.nowplaying,
                        np.nowplaying
                    ), true);
                else
                    send(n, strings.announcements.nperror, true);
        });     
    }
};




// Command: !stop
comm.stop = function(data) {
	if (isLive) {
		isLive = false;
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
                        console.log(strings.debug.stopped);
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

// Command: !artworkadd
comm.artworkadd = function(data) {
    var lines = data.message.split("\n");

    var track = lines[0].replace(config.options.commandsymbol + data.command + " ", "");
    if (track == "" || track == config.options.commandsymbol + data.command) {
        send(data.channelID, strings.commands.artworkadd.errorA, false);
    }
    else {
        if (lines[1] != undefined) {
            var url = lines[1];

            if (artwork[track] == undefined) {              
                artwork[track] = url;
                fs.writeFileSync(config.options.artworkpath, JSON.stringify(artwork), "utf-8");
                send(data.channelID, util.format(
                    strings.commands.artworkadd.messageA, 
                    track
                ), false);
            }
            else {
                artwork[track] = url;
                fs.writeFileSync(config.options.artworkpath, JSON.stringify(artwork), "utf-8");
                send(data.channelID, util.format(
                    strings.commands.artworkadd.messageB, 
                    track
                ), false);
            }           
        }
        else {
            send(data.channelID, strings.commands.artworkadd.errorB, false);
        }
    }
};

// Command: !artworkdel
comm.artworkdel = function(data) {
    var track = data.message.replace(config.options.commandsymbol + data.command + " ", "");
    if (track == "" || track == config.options.commandsymbol + data.command) {
        send(data.channelID, strings.commands.artworkdel.errorA, false);
    }
    else {
        if (artwork[track] != undefined) {
            delete artwork[track];

            fs.writeFileSync(config.options.artworkpath, JSON.stringify(artwork), "utf-8");

            send(data.channelID, util.format(
                strings.commands.artworkdel.message, 
                track
            ), false);
        }
        else {
            send(data.channelID, strings.commands.artworkdel.errorB, false);
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
                devices.forEach(function(d) {
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
        devices.forEach(function(d) {
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
                devices.forEach(function(d) {
                    var on = d.on;
                    if (on == true)
                        on = "on";
                    else
                        on = "off";
                    message += util.format(
                        strings.commands.toggle.messageB, 
                        d.name,
                        on
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

        devices.forEach(function(d) {       
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

                var momentTime = moment.tz(e.date, config.options.mytimezone);
                message += util.format(
                    strings.commands.schedulestart.messageC, 
                    e.name,
                    e.toggle,
                    momentTime.format("ddd MMM DD, YYYY"),
                    momentTime.format("HH:mm (z)")
                );

                var job = new CronJob(e.date, function() {
                    refreshTradfriDevices(function(result) {
                        if (result) {
                            var message = "";
                            e.bulbs.forEach(function(b) {
                                devices.forEach(function(d) {
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
    var state = data.message.replace(config.options.commandsymbol + data.command + " ", "");
    if (state == "" || state == config.options.commandsymbol + data.command) {
        send(data.channelID, strings.commands.camera.error, true);
    }
    else {
        if (state == "on") {
            exec("sudo /home/luna/mjpg-streamer_norm.sh start");
            send(data.channelID, strings.commands.camera.messageA, true);
        }
        else if (state == "off") {
            exec("sudo /home/luna/mjpg-streamer_norm.sh stop");
            send(data.channelID, strings.commands.camera.messageB, true);
        }
        else
            send(data.channelID, strings.commands.camera.error, true);
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
        console.log(strings.debug.stopped);
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
    var archive = archiver("zip", {
        "zlib": { "level": config.backup.compression }
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
                    console.log(strings.debug.stopped);

                    exec("sudo /sbin/reboot");

                }, config.options.reboottime * 1000);
                break;
            case "wake":
            	if (parts[1] in mac) {
	                send(data.channelID, util.format(
	                	strings.commands.system.mwake,
	                	parts[1]
	                ), false);
	                exec("sudo etherwake " + mac[parts[1]]);
	            }
	            else {
	                send(data.channelID, strings.commands.system.ewake, false);
	            }
                break;

            default:
                send(data.channelID, strings.commands.system.errorB, false);
                break;
        }
    }
};

// Status Variables
var jobs      = [];
var phases    = [];
var started   = false;
var apifail   = false;
var filefail  = false;
var npstarted = false;
var isplushie = false;
var npradio   = {};
var np        = {};
var brains    = {};
var brainProg = 0;
var messages  = {};
var hTrack    = {};

var startTime;

var phaseTimeout;

var powerStatus = null;
var powerTime;

var eegValues;
var eegValuesEMA;
var eegValuesEMAPrev;

var eegTable;
var eegTableEMA;

var eegInitial = true;
var eegRecording = false;
var eegConfig;

var scheduleEntries = [];
var scheduleJobs    = [];

var rebooting = false;

var purgeReady = false;
var purgeBrain = "";
var purgeStart = "";
var purgeEnd   = "";

var doseWasWarned = false;
var vpTimeDose;
var vpTimePressure;

var isLive = false;

var lightningRange = blitzor.range;
var lightningNew   = blitzor.range;
var lightningLat = 0;
var lightningLng = 0;
var lightningExpire;
var lightningSpread;
var lightningReconnect;

var isChasing = false;
var chaseRange = blitzor.range;
var chaseNew   = blitzor.range;
var chaseLat = 0;
var chaseLng = 0;
var chaseExpire;
var chaseSpread;
var chaseReconnect;
var chaseThoriLat = 0.0;
var chaseThoriLng = 0.0;

var annStatus;
var waifuTimeout;

// Persistant Objects
var bot;
var hub;
var devices;
var lyrics;
var artwork;
var nptoggles;
var blacklist;
var ignore;
var server;
var blitzorws;
var chasews;

// Callback for downloading of files. 
var download = function(uri, filename, callback) {
        request.head(uri, function(err, res, body) {
            console.log(util.format(
                    strings.debug.download.start,
                    uri
                ));

            request({
                "method": "GET", 
                "rejectUnauthorized": false, 
                "url": uri,
                "headers" : {"Content-Type": "application/json"},
                function(err,data,body) {}
            }).pipe(fs.createWriteStream(filename)).on("close", callback);
        });
    };

/*
 * Formats a mention string.
 * @param  id  ID to mention.
 * @return     String usable by Discord as a mention.
 */
function mention(id) {
    return util.format(config.options.mention, id);
}

/*
 * Formats a role mention string.
 * @param  id  ID to mention.
 * @return     String usable by Discord as a mention.
 */
function mentionRole(id) {
    return util.format(config.options.mentionrole, id);
}

/*
 * Sends a large message to some chat using multiple messages. Used for lyrics.
 * @param  data     Data of the message.
 * @param  list     List to be sent.
 * @param  message  Initial message string.
 */
function sendLargeMessage(data, list, message, format) {

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
            send(data.channelID, m, true);
        }, i * 1000);           
    });
}

/*
 * Uses regex to clean up a message.
 * @param  message  Message text to clean up.
 */
function cleanMessage(message) {
    return message.replace(/<.*>/g, "").replace(/\|\|.*\|\|/g, "").replace(/http(|s):\/\/(\S+)*/g, "");
}

/*
 * Reloads the configuration.
 */
function reloadConfig() {  
    token    = JSON.parse(fs.readFileSync(config.options.configpath + "token.json", "utf8"));
    config   = JSON.parse(fs.readFileSync(config.options.configpath + "config.json", "utf8"));
    commands = JSON.parse(fs.readFileSync(config.options.configpath + "commands.json", "utf8"));
    custom   = JSON.parse(fs.readFileSync(config.options.configpath + "custom.json", "utf8"));
    strings  = JSON.parse(fs.readFileSync(config.options.configpath + "strings.json", "utf8"));
    gotn     = JSON.parse(fs.readFileSync(config.options.configpath + "gotn.json", "utf8"));
    mlp      = JSON.parse(fs.readFileSync(config.options.configpath + "mlp.json", "utf8"));
    channels = JSON.parse(fs.readFileSync(config.options.configpath + "channels.json", "utf8"));
    varipass = JSON.parse(fs.readFileSync(config.options.configpath + "varipass.json", "utf8"));
    printer  = JSON.parse(fs.readFileSync(config.options.configpath + "printer.json", "utf8"));
    dtls     = JSON.parse(fs.readFileSync(config.options.configpath + "dtls.json", "utf8"));
    tradfri  = JSON.parse(fs.readFileSync(config.options.configpath + "tradfri.json", "utf8"));
    schedule = JSON.parse(fs.readFileSync(config.options.configpath + "schedule.json", "utf8"));
    wow      = JSON.parse(fs.readFileSync(config.options.configpath + "wow.json", "utf8"));
    httpkey  = JSON.parse(fs.readFileSync(config.options.configpath + "httpkey.json", "utf8"));
    mac      = JSON.parse(fs.readFileSync(config.options.configpath + "mac.json", "utf8"));
    blitzor  = JSON.parse(fs.readFileSync(config.options.configpath + "blitzor.json", "utf8"));
    thori    = JSON.parse(fs.readFileSync(config.options.configpath + "thori.json", "utf8"));

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
};

/*
 * Checks if a message has usable contents.
 * @param  message  Message text analyze.
 */
function isMessageNotEmpty(message) {
    return message != "" && message != " " && message != "\n";
}

/*
 * Executes an interraction command on one person or more people.
 * @param  data  Data of the message.
 */
function doInterraction(data) {
    if (!isplushie) {
        if (data.data.d.mentions[0] != null) {
            if (isMentioned(bot.id, data.data) && data.data.d.mentions.length == 1) {
                if (data.command == "unplushie") {
                    send(data.channelID, strings.commands[data.command].error, true);
                }
                else {
                    if (data.command == "plushie")
                        isplushie = true;

                    send(data.channelID, strings.commands[data.command].self, true);
                }
            }
            else {
                for (i = 0; i < data.data.d.mentions.length; i++)
                    if (bot.id == data.data.d.mentions[i].id)
                        data.data.d.mentions.splice(i, 1);

                if (data.data.d.mentions.length <= 1) {
                    send(data.channelID, util.format(
                        strings.commands[data.command].single, 
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
                        strings.commands[data.command].multiple,
                        mentions
                    ), true);
                }
            }
        }
        else {
            send(data.channelID, util.format(
                strings.commands[data.command].single, 
                mention(data.userID)
            ), true);
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
}

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
}

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
}

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
}

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

    return util.format(
        strings.misc.left, 
        getTimeString(time),  
        momentTime.format("ddd MMM DD, YYYY"),
        momentTime.format("HH:mm (z)")
    );
}

/*
 * Parses the phase list to return a string compatible with Discord chat.
 * @param  name    Name of the Moon phse to look for.
 * @param  offset  Offset of the phase.
 * @return         String compatible with Discord chat.
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
 * Sends a message to a channel on Discord.
 * @param  id       ID of the channel to send to.
 * @param  message  String message to send.
 * @param  typing   Whether the typing delay should be added.
 */
function send(id, message, typing) {
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
            bot.sendMessage(msg);
        }, config.options.typetime * 1000); 
    }
    else {
        console.log(util.format(
            strings.debug.message,
            channel,
            message
        ));
        bot.sendMessage(msg);   
    }
}

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
}

/*
 * Parses whether a certain ID was mentioned.
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
}

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

function processBlacklist(userID) {
    var okay = true;
    if (blacklist[userID] != undefined) {
        okay = false;
    };
    return okay;
}

function processIgnore(userID) {
    var okay = true;
    if (ignore[userID] != undefined) {
        okay = false;
    };
    return okay;
}

function setMood(name, callback) {
    tradfri.moods.forEach(function(m) { 
        if (m.name == name) {
            refreshTradfriDevices(function(result) {
                if (result) {
                    m.devices.forEach(function(d1) {
                        devices.forEach(function(d2) {
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

function setBulb(bulb, id) {
    var newBulb = normalize(bulb);  

    hub.setDeviceState(id, newBulb).then((result) => {

    }).catch((error) => {
        console.log(strings.debug.tradfri.errorB);
        setBulb(bulb, id);
    });
}

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

function degToRad(deg) {
    return deg * (Math.PI/180);
}

function radToDeg(rad) {
    return rad * (180/Math.PI);
}

function earthDistance(lat1, lon1, lat2, lon2) {
	var R = 6371;
	var dLat = degToRad(lat2-lat1);
	var dLon = degToRad(lon2-lon1); 
	var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
			Math.cos(degToRad(lat1)) * Math.cos(degToRad(lat2)) * 
			Math.sin(dLon/2) * Math.sin(dLon/2); 
	var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
	var d = R * c;
	return d;
}

function earthBearing(lat1, lon1, lat2, lon2) {
    var dLon = degToRad(lon2-lon1);
    var y = Math.sin(dLon) * Math.cos(degToRad(lat2));
    var x = Math.cos(degToRad(lat1)) * Math.sin(degToRad(lat2)) -
    		Math.sin(degToRad(lat1)) * Math.cos(degToRad(lat2)) * 
    		Math.cos(dLon);
    var brng = radToDeg(Math.atan2(y, x));
    return ((brng + 360) % 360);
}

function connectBlitzortung(reconnect) {
	var from = {};
	from.latitude = blitzor.location.latitude + blitzor.expand;
	from.longitude = blitzor.location.longitude - blitzor.expand;
	var to = {};
	to.latitude = blitzor.location.latitude - blitzor.expand;
	to.longitude = blitzor.location.longitude + blitzor.expand;

	if (reconnect && blitzor.debug)
    	console.log(util.format(
    		strings.debug.blitzor.reconnect,
    		from.latitude,
    		to.latitude,
    		from.longitude,
    		to.longitude
    	));
	else if (!reconnect)
    	console.log(util.format(
    		strings.debug.blitzor.connect,
    		from.latitude,
    		to.latitude,
    		from.longitude,
    		to.longitude
    	));

	blitzorws = new blitzorapi.Client({
	    make(address) {
	        return new WebSocket(address);
	    }
	});

	blitzorws.connect();
	blitzorws.on("error", console.error);
	blitzorws.on("connect", () => {
	    blitzorws.setIncludeDetectors(false);
	    blitzorws.setArea(from, to);
	});
	blitzorws.on("data", strike => {
		var distance = earthDistance(blitzor.location.latitude, blitzor.location.longitude, strike.location.latitude, strike.location.longitude);

		if (distance < lightningNew) {
			lightningNew = distance;
			lightningLat = strike.location.latitude;
			lightningLng = strike.location.longitude;

			if (!blitzor.debug)
				console.log(util.format(
		            strings.debug.blitzor.strike,
		            distance,
		            strike.location.latitude,
		            strike.location.longitude                
		        ));
		}
		if (blitzor.debug)
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

	if (reconnect && blitzor.debug)
    	console.log(strings.debug.blitzor.done);
   	else if (!reconnect)
    	console.log(strings.debug.blitzor.done);
}

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

			var from = {};
			from.latitude = chaseThoriLat + blitzor.expand;
			from.longitude = chaseThoriLng - blitzor.expand;
			var to = {};
			to.latitude = chaseThoriLat - blitzor.expand;
			to.longitude = chaseThoriLng + blitzor.expand;

			if (reconnect && blitzor.debug)
		    	console.log(util.format(
		    		strings.debug.chase.reconnect,
		    		from.latitude,
		    		to.latitude,
		    		from.longitude,
		    		to.longitude
		    	));
			else if (!reconnect)
		    	console.log(util.format(
		    		strings.debug.chase.connect,
		    		from.latitude,
		    		to.latitude,
		    		from.longitude,
		    		to.longitude
		    	));

			chasews = new blitzorapi.Client({
			    make(address) {
			        return new WebSocket(address);
			    }
			});

			chasews.connect();
			chasews.on("error", console.error);
			chasews.on("connect", () => {
			    chasews.setIncludeDetectors(false);
			    chasews.setArea(from, to);
			});
			chasews.on("data", strike => {
				var distance = earthDistance(chaseThoriLat, chaseThoriLng, strike.location.latitude, strike.location.longitude);

				if (distance < chaseNew) {
					chaseNew = distance;
					chaseLat = strike.location.latitude;
					chaseLng = strike.location.longitude;

					if (!blitzor.debug)
						console.log(util.format(
				            strings.debug.chase.strike,
				            distance,
				            strike.location.latitude,
				            strike.location.longitude                
				        ));
				}
				if (blitzor.debug)
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

			if (reconnect && blitzor.debug)
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

    setTimeout(function() {
        fs.rename(path + ".new", path, function(e) {
        });
    }, 1000);       
}

/*
 * Saves all brain data.
 */
function saveAllBrains() {
    Object.keys(brains).forEach(function(b) {
        saveBrain(b);
    });
}

function startupProcedure() {
    startTime = new Date();
    console.log(strings.debug.started);
    console.log(util.format(
        strings.debug.startedtime,
        moment.tz(startTime, "UTC").format("YYYY-MM-DD, HH:mm")
    ));

    loadAnnouncements();
    loadLyrics();
    loadArtwork();
    loadNPToggles();
    loadANN();
    loadBlacklist();
    loadIgnore();
    loadEEG();
    loadTimezones();
    loadTradfri();
    loadServer();
    loadPhases();
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

                send(channelNameToID(config.options.channels.announceA), strings.announcements.gotn.nowA, true);
                send(channelNameToID(config.options.channels.announceB), util.format(
                    strings.announcements.gotn.nowB,
                    mentionRole(config.options.squadid)
                ), true);
                setMood("gotn", function(result) {
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

        jobs.push(jobLong);
        jobs.push(jobShort);
        jobs.push(jobNow);
    });

    console.log(strings.debug.announcements.done);
}

/*
 * Processes the phase data for announcements.
 */
function processPhases() {
    phases.forEach(function(p) {
        var date = new Date(p.date + " " + p.time);
        var message;
        console.log(util.format(
            strings.debug.phases.item,
            date,
            p.phase
        ));

        if (p.phase == config.options.fullmoon) {
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
        jobs.push(job);
    });
}

/*
 * Called if phases were successfully loaded.
 */
function phaseDone(done) {
	clearTimeout(phaseTimeout);

    if (done) {
        fs.writeFileSync(config.options.phasepath, JSON.stringify(phases), "utf-8");
        processPhases();
        console.log(strings.debug.phases.done);
    }
    else {
        apifail = true;

        if (fs.existsSync(config.options.phasepath)) {
            console.log(strings.debug.phases.file);     
            phases = JSON.parse(fs.readFileSync(config.options.phasepath, "utf8"));
            processPhases();
            console.log(strings.debug.phases.filed);
        }
        else {
            filefail = true;
            console.log(strings.debug.phases.no);
        }
    }

    loadBrain();
}

/*
 * Loads all moon phases from web.
 */
function loadPhases() {
    console.log(strings.debug.phases.load);

    var xhr = new XMLHttpRequest();
    xhr.open("GET", config.options.phaseurl, true);


    xhr.onreadystatechange = function () { 
        if (xhr.readyState == 4 && xhr.status == 200) {
            var response = JSON.parse(xhr.responseText);
            phases = response.phasedata;

            phaseDone(true);
        }
    }
    xhr.onerror = function(err) {
        console.log(util.format(
            strings.debug.phases.error,
            err.target.status
        ));

        xhr.abort();
        phaseDone(false);
    }
    xhr.ontimeout = function() {
        console.log(strings.debug.phases.timeout);

        xhr.abort();
        phaseDone(false);
    }

    xhr.send();

    phaseTimeout = setTimeout(function() {
        console.log(strings.debug.phases.timeout);

        xhr.abort();
        phaseDone(false);
    }, config.options.phasetimeout * 1000);
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
            b.loaded = true;

        }
    }); 

    loadBrainWait();
}

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
 * Loads the artwork data, or creates new.
 */
function loadArtwork() {
    artwork = {};

    if (fs.existsSync(config.options.artworkpath)) {
        console.log(strings.debug.artwork.old);
        artwork = JSON.parse(fs.readFileSync(config.options.artworkpath, "utf8"));
        console.log(strings.debug.artwork.done);
    }
    else {
        fs.writeFileSync(config.options.artworkpath, JSON.stringify(artwork), "utf-8");
        console.log(strings.debug.artwork.new);
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
 * Loads the blacklist toggle data, or creates new.
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
 * Loads the ignore toggle data, or creates new.
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
 * Loads the Tradfri client.
 */
function loadTradfri() {
    hub = tradfrilib.create({
        "coapClientPath": config.options.coappath,
        "identity":       dtls.identity,
        "preSharedKey":   dtls.preSharedKey,
        "hubIpAddress":   dtls.hubIpAddress
    });
}

function refreshTradfriDevices(callback) {
    console.log(strings.debug.tradfri.connect);

    hub.getDevices().then((result) => {

        devices = result.filter(function(d) {
            return d.color != undefined;
        });

        console.log(util.format(
            strings.debug.tradfri.done,
            devices.length
        ));

        if (config.options.debugtradfri)
            devices.forEach(function(d) {
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

        callback(true);

    }).catch((error) => {    	
        console.log(strings.debug.tradfri.errorA);
        callback(false);
    });
}

function processReqPower(query) {
    if (query.power == "on") {
        if (powerStatus != null && powerStatus != 0)            
            send(channelNameToID(config.options.channels.home), strings.announcements.power.on, false);
        powerStatus = 0;
        powerTime = new Date() / 1000;
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
        }
        powerTime = new Date() / 1000;
    }
}

function processReqMotion(query) {
    send(channelNameToID(config.options.channels.home), util.format(
            strings.announcements.motion,
            query.camera
        ), false);
    download(query.snapshot, config.options.motionimg, function() {
            console.log(strings.debug.download.stop);
            embed(channelNameToID(config.options.channels.home), "", config.options.motionimg, query.camera + " " + (new Date()) + ".jpg", false, true);
        });
}

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

function processReqEEG(query) {
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

function processReqCelly(query) {
	console.log("lel");

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

function processReqToggle(query) {
    if (query.bulbs != undefined) { 
        refreshTradfriDevices(function(result) {
            if (result) {
                var found = false;
                query.bulbs.split(",").forEach(function(b) {
                    devices.forEach(function(d) {       
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

function processReqState(query) {
    if (query.bulbs != undefined && query.state != undefined) {
        refreshTradfriDevices(function(result) {
        	if (result) {
                var found = false;
                query.bulbs.split(",").forEach(function(b) {
                    devices.forEach(function(d) {  
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
}

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
                console.log(strings.debug.stopped);
                process.exit();
            }, config.options.reboottime * 1000);

            rebooting = true;
        }
        else
            send(channelNameToID(config.options.channels.debug), strings.misc.voicetag + strings.voice.reboot.error, false);
    }
}

function processReqReload(query) {    
    reloadConfig();
    send(channelNameToID(config.options.channels.debug), strings.misc.voicetag + strings.commands.reload.message, false);
}

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
    else if (query.queue != undefined && query.channelid != undefined && query.userid != undefined) {
        send(query.channelid, util.format(
            strings.misc.ann.waifu.queue,
            mention(query.userid),
            query.queue
        ), true);
    }
}

var processRequest = function(req, res) {
    if (req.method == "GET") {
        var query = url.parse(req.url, true).query;
        if (query.key == httpkey.key)
            switch (query.action) {
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
            }       
    }

    //console.log("Connection! " + res.socket.remoteAddress + " " + req.url);

    res.writeHead(200, [
        ["Content-Type", "text/plain"], 
        ["Content-Length", 0]
            ]);
    if (query.key == httpkey.key)
    res.write("");
    res.end();
};

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
                strings.debug.varipass.error,
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
            strings.debug.varipass.error,
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
        console.log(strings.debug.stopped);
        process.exit();
    }, config.options.reboottime * 1000);
}

/*
 * Loads the discord bot.
 */
function loadBot() {
    bot = new Discord.Client({
        "token": token.value,
        "autorun": true
    });
     
    bot.on("ready", function() {
        bot.setPresence({
            "game": {
                "name": config.options.game
            }
        });
        console.log(util.format(
            strings.debug.join,
            bot.username,
            bot.id
        ));
        if (!started) {
            started = true;
            if (apifail && filefail)
                send(channelNameToID(config.options.channels.debug), util.format(
                    strings.misc.filefail,
                    package.version
                ), false);
            else if (apifail)
                send(channelNameToID(config.options.channels.debug), util.format(
                    strings.misc.apifail,
                    package.version
                ), false);
            else    
                send(channelNameToID(config.options.channels.debug), util.format(
                    strings.misc.load,
                    package.version
                ), false);

            Object.keys(nptoggles).forEach(function(n, i) {
                if (nptoggles[n])
                    send(n, strings.announcements.npback, true);
            });

            loadSeizure();
            connectBlitzortung(false);

            loopLightning();
            loopNowPlaying();
            loopVariPassPull();
            setTimeout(loopBrainSave, config.brain.saveloop * 1000);
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

        if (message[0] == config.options.commandsymbol) {

            var nocommand = true;
            var command = message.split("\n")[0];
            command = command.split(" ")[0];

            var packed = {};
            packed.user      = user;
            packed.userID    = userID;
            packed.channelID = channelID;
            packed.message   = message;
            packed.data      = data;
            packed.command   = command.replace(config.options.commandsymbol, "");

            commands.list.forEach(function(c) {
                if (command == config.options.commandsymbol + c.command && nocommand) {
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

                        if (
                            !roleFound &&
                            bot.channels[channelID] != undefined &&
                            bot.servers[bot.channels[channelID].guild_id] != undefined &&
                            bot.servers[bot.channels[channelID].guild_id].members[userID] != undefined
                            ) {

                            bot.servers[bot.channels[channelID].guild_id].members[userID].roles.forEach(function (r1, i) {
                                config.options.djroles.forEach(function (r2, j) {
                                    if (r1 == r2) {
                                        roleFound = true;
                                    }
                                });
                            });
                        }

                        if (
                            !roleFound &&
                            bot.channels[channelID] == undefined &&
                            bot.servers[config.options.ponyvillefmid] != undefined &&
                            bot.servers[config.options.ponyvillefmid].members[userID] != undefined
                            ) {

                            bot.servers[config.options.ponyvillefmid].members[userID].roles.forEach(function (r1, i) {
                                config.options.djroles.forEach(function (r2, j) {
                                    if (r1 == r2) {
                                        roleFound = true;
                                    }
                                });
                            });
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
                if (command == config.options.commandsymbol + c.command && nocommand) {
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

                send(channelID, mention(userID) + " " + brains[channelIDToBrain(channelID)].getReplyFromSentence(newMessage), true);

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

    bot.on("disconnect", function(erMsg, code) {
        console.error(strings.debug.disconnected);
        // Wait for reconnect to prevent spamming.
        setTimeout(function() {
            bot.connect();
        }, config.options.reconnecttime * 1000);        
    });
}

function loadServer() {
    server = http.createServer(processRequest).listen(config.options.serverport);
}

function toUpper(str) {
	return str.toLowerCase().replace(/^[a-zA-Z0-9À-ž]|[-\r\n\t\f\v ][a-zA-Z0-9À-ž]/g, function (letter) {
		return letter.toUpperCase();
	})
}

function spreadLightning() {
	var rangeSpread = blitzor.range / (blitzor.expire / blitzor.spread);
	if (blitzor.debug)
    	console.log(util.format(
    		strings.debug.blitzor.spread,
    		lightningRange,
    		lightningRange + rangeSpread
    	));

	lightningRange = lightningRange + rangeSpread;
	lightningNew   = lightningNew + rangeSpread;

	if (lightningRange > blitzor.range) {
		if (blitzor.debug)
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

function spreadChase() {
	var rangeSpread = blitzor.range / (blitzor.expire / blitzor.spread);
	if (blitzor.debug)
    	console.log(util.format(
    		strings.debug.chase.spread,
    		chaseRange,
    		chaseRange + rangeSpread
    	));

	chaseRange = chaseRange + rangeSpread;
	chaseNew   = chaseNew + rangeSpread;

	if (chaseRange > blitzor.range) {
		if (blitzor.debug)
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
 * Loops to continuously retrieve now playing data.
 */
function loopNowPlaying() {
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
            if (
                response != undefined && 
                response.icestats != undefined && 
                response.icestats.source != undefined
                ) {
                if (npradio == undefined || npradio.title != response.icestats.source.title || npradio.artist != response.icestats.source.artist) {             
                    npradio = JSON.parse(xhr.responseText).icestats.source;
                    if (npradio.artist != undefined)
                        npradio.nowplaying = npradio.artist + config.separators.track + npradio.title;
                    else
                        npradio.nowplaying = npradio.title;


                    np = JSON.parse(xhr.responseText).icestats.source;
                    if (np.artist != undefined)
                        np.nowplaying = np.artist + config.separators.track + np.title;
                    else
                        np.nowplaying = np.title;

                    if (npstarted)
                        Object.keys(nptoggles).forEach(function(n, i) {
                            if (nptoggles[n])
                                if (np.nowplaying != undefined)
                                    send(n, util.format(
                                        strings.announcements.nowplaying,
                                        np.nowplaying
                                    ), true);
                                else
                                    send(n, strings.announcements.nperror, true);
                        });
                    else
                    npstarted = true;
                }
            }
        }
    }

    xhr.send();
    setTimeout(loopNowPlaying, config.nowplaying.timeout * 1000);
}

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
            strings.debug.varipass.error,
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

function loopVariPassPull() {
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
            
            // Geiger Calculation
            var vpDose = findVariable(vpData, varipass.main.ids.dose).history;
            var vpDoseEMA = findVariable(vpData, varipass.main.ids.doseema).history;

            if (!(vpTimeDose != undefined && vpDose[0].time <= vpTimeDose)) {
            	vpTimeDose = vpDose[0].time;

		    	var alpha = parseFloat(1.0 / config.varipass.geiger.samples);
		    	var value = alpha * vpDose[0].value + (1.0 - alpha) * vpDoseEMA[0].value;
		    	sendDoseEMA(value);

			    if (value > config.varipass.geiger.warning) {
			    	if (!doseWasWarned) {
			    		doseWasWarned = true;
				    	send(channelNameToID(config.options.channels.home), util.format(
					        strings.announcements.varipass.dosehigh,
					        config.varipass.geiger.warning,
					        value.toFixed(4)
					    ), false);
				    }
			    }
			    else {
			    	if (doseWasWarned) {
			    		doseWasWarned = false;
				    	send(channelNameToID(config.options.channels.home), util.format(
					        strings.announcements.varipass.doselow,
					        value.toFixed(4),
					        config.varipass.geiger.warning
					    ), false);
			    	}
			    }
            }

            var vpPressure = findVariable(vpData, varipass.main.ids.pressure).history;

            // Weather Alerts
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

	    }
	}
    xhr.onerror = function(err) {
        console.log(util.format(
            strings.debug.varipass.error,
            err.target.status
        ));
        xhr.abort();
    }
    xhr.ontimeout = function() {
        console.log(strings.debug.varipass.timeout);
        xhr.abort();
    }

    xhr.send(JSON.stringify(payload));

    setTimeout(loopVariPassPull, config.varipass.timeout * 1000);
}

/*
 * Loops to continuously save brain data.
 */
function loopBrainSave() {
    if (!rebooting)
        saveAllBrains();

    setTimeout(loopBrainSave, config.brain.saveloop * 1000);
}



// Start the bot.
startupProcedure();