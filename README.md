# MusicBot

A Discord music bot that plays music from YouTube and SoundCloud. It features basic music playback controls such as play, stop, and skip, as well as a simple queue system.

## Features

- Play music from YouTube and SoundCloud
- Stop music playback
- Skip to the next song in the queue
- Add songs to the queue

## Installation

1. Clone this repository:

   `git clone https://github.com/joonanykanen/MusicBot.git`

2. Install dependencies:

   `npm install`

3. Create a `.env` file in the project's root directory and add your bot token:

   `BOT_TOKEN=your_bot_token_here`

4. Run the bot:

   `node index.js`

## Usage

Replace `!` with your desired command prefix on `index.js`.

- `!play [YouTube or SoundCloud URL]` - Play a song or add it to the queue
- `!stop` - Stop music playback and clear the queue
- `!skip` - Skip the currently playing song

## License

[MIT License](LICENSE.md)
