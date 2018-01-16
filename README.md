# Princess Luna
Princess Luna is a Discord bot designed for Thorinair's official Glory of The Night Discord server. The bot features multiple different commands, automatic announcements, server role management, now playing information during Thorinair's show and a chatbot.

## Features
* Announces the upcoming show airtime and when the show ends.
* Promotes and greets new members.
* Announces the Full Moon phase.
* Sends info about tracks playing on PonyvilleFM during the show.
* Features a chatbot which learns from the messages sent in the server.
* Features a variety of commands:
    - `!gotn` Lists the time left until the next Glory of The Night episode. You may also specify the timezone after the command.
    - `!mlp` Lists the time left until the next My Little Pony: Friendship is Magic episode. You may also specify the timezone after the command.
    - `!np` Lists the currently playing track on PonyvilleFM.
    - `!lyrics` Lists lyrics of a specified track. Also functions similar like previous command to list lyrics of tracks on PonyvilleFM. Use "list" parameter to list all known lyrics.
    - `!artwork` Shows artwork for a specified track. Also functions similar like previous command to show artwork for tracks on PonyvilleFM. Use "list" parameter to list all known artworks.
    - `!phase` Lists info about the Moon phases. You may also specify the timezone after the command.
    - `!moon` Sends an image of the Moon as it is right now.
    - `!room` Lists the physical status of Thorinair's real life room. Powered using the [VariPass](https://varipass.org) website.
    - `!stats` Lists the bot's current statistics for a channel. You may also specify the timezone after the command.
    - `!stats` Lists information about the bot and links the source code.
    - `!help` Lists all available commands.
    - The bot can interract with people. Mention someone or multiple people after the command to interract with them. Supported commands: `!hug`, `!kiss`, `!boop`, `!glomp`, `!snuggle`.
* Private commands for the admin:
    - `!send` Sends a message to a channel. Specify the channel name after the command, and message in the lines below.
    - `!learn` Manually trains the bot using specified text. Specify the brain name in the same line as command, text in new lines. Retroactively teaching data from older chat logs? Use the following regex to remove usernames and timestamps: `([)([0-9]+:[0-9]+ [A-Z]+)(]) .*: `
    - `!nptoggle` Manually toggles the automatic listing of Now Playing info.
    - `!npoverride` Overrides the Now Playing info shown for PonyvilleFM One with a new value.
    - `!lyricsadd` Adds lyrics to the database. Specify a track name after the command, and lyrics in the lines below. If the lyrics are longer than 2000 characters, call the command multiple times for more parts.
    - `!lyricsdel` Removes lyrics from the database. Specify a track name after the command.
    - `!artworkadd` Adds an artwork to the database. Specify a track name after the command, and the artwork URL in the line below.
    - `!artworkdel` Removes an artwork from the database. Specify a track name after the command.
    - `!reboot` Reboots the bot.
    - `!backup` Created a backup of the data and config directories and sends it as a file through Discord.

## Privacy & Data Collection
This bot stores message history in plain text files and uses them as training data upon startup. The messages are stored indefinitely, or until they are manually deleted. Plain text storage allows for later editing in case the data needs to be modified. The messages are stored only in the channels where learning has been enabled. Please use the !stats command to verify whether any data collection will take place in the specific channel.