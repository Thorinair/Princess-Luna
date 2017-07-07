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
    - `!np` Lists the currently playing track on a PonyvilleFM station. Use "one", "two" or "free". Defaults to "one".
    - `!lyrics` Lists lyrics of a specified track. Also functions similar like previous command to list lyrics of tracks on PonyvilleFM. Use "list" parameter to list all known lyrics.
    - `!phase` Lists info about the Moon phases. You may also specify the timezone after the command.
    - `!moon` Sends an image of the Moon as it is right now.
    - `!hug` Hug the user. Mentioning someone will hug them instead. You can mention multiple people.
    - `!kiss` Kiss the user. Mentioning someone will kiss them instead. You can mention multiple people.
    - `!boop` Boop the user. Mentioning someone will boop them instead. You can mention multiple people.
    - `!stats` Lists the bot's current statistics for a channel. You may also specify the timezone after the command.
    - `!help` Lists all available commands.
* Private commands for the admin:
    - `!learn` Manually trains the bot using specified text. Specify the brain name in the same line as command, text in new lines.
    - `!togglenp` Manually toggles the automatic listing of now playing info.
    - `!addlyrics` Adds lyrics to the database. Specify a track name after the command, and lyrics in the lines below. If the lyrics are longer than 2000 characters, call the command multiple times for more parts.
    - `!dellyrics` Removes lyrics from the database. Specify a track name after the command.
    - `!reboot` Reboots the bot.
    - `!backup` Created a backup of the data and config directories and sends it as a file through Discord.
