import { NextResponse } from 'next/server';

const LASTFM_API_KEY = process.env.LASTFM_API_KEY;
const LASTFM_USERNAME = process.env.LASTFM_USERNAME;
const LASTFM_ENDPOINT = `http://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=${LASTFM_USERNAME}&api_key=${LASTFM_API_KEY}&format=json&limit=1`;

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  if (!LASTFM_API_KEY || !LASTFM_USERNAME) {
    return NextResponse.json({ isPlaying: false, message: "Last.fm credentials missing" }, { status: 500 });
  }

  try {
    const response = await fetch(LASTFM_ENDPOINT, {
      cache: 'no-store',
    });

    if (response.status !== 200) {
      const errorText = await response.text();
      console.error("Last.fm API error response:", errorText);
      return NextResponse.json({ isPlaying: false }, { status: 200 });
    }

    const data = await response.json();
    const track = data.recenttracks.track[0];

    if (!track) {
      return NextResponse.json({ isPlaying: false });
    }

    const isPlaying = track['@attr']?.nowplaying === 'true';
    const title = track.name;
    const artist = track.artist['#text'];
    const album = track.album['#text'];
    // Last.fm gives 4 image sizes, index 3 is usually the largest (extralarge)
    const albumImageUrl = track.image[3]['#text'] || track.image[2]['#text'];
    const songUrl = track.url;

    return new NextResponse(JSON.stringify({
      album,
      albumImageUrl,
      artist,
      isPlaying,
      songUrl,
      title,
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  } catch (err) {
    console.error("Last.fm API Exception:", err);
    return NextResponse.json({ isPlaying: false }, { status: 500 });
  }
}
