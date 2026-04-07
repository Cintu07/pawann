const LASTFM_API_KEY = "d7a747a671b37ed70f9418053ddd26fb";
const LASTFM_USERNAME = "pawannn";
const LASTFM_ENDPOINT = `http://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=${LASTFM_USERNAME}&api_key=${LASTFM_API_KEY}&format=json&limit=1`;

async function diagnostic() {
  try {
    const response = await fetch(LASTFM_ENDPOINT);
    console.log("LASTFM_STATUS:", response.status);
    const data = await response.json();
    console.log("FULL_RESPONSE:", JSON.stringify(data));
    
    if (data.recenttracks && data.recenttracks.track) {
        const track = data.recenttracks.track[0];
        console.log("TRACK_NAME:", track.name);
        console.log("ARTIST:", track.artist['#text']);
        console.log("NOW_PLAYING:", track['@attr']?.nowplaying);
    } else {
        console.log("FULL_RESPONSE:", JSON.stringify(data));
    }

  } catch (err) {
    console.error("DIAGNOSTIC ERROR:", err);
  }
}

diagnostic();
