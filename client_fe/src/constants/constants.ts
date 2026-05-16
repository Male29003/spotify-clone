import defaultAvatarImg from '../assets/profile.jpeg'
import defaultReleaseImg from '../assets/album.jpg'
import defaulTrackImg from '../assets/track.jpg'
import defaultGenreImg from '../assets/genre.jpg'

export const DEFAULT_USER_AVATAR = defaultAvatarImg;
export const DEFAULT_RELEASE_IMAGE = defaultReleaseImg;
export const DEFAULT_TRACK_IMAGE = defaulTrackImg;
export const DEFAULT_GENRE_IMAGE = defaultGenreImg;
export const DEFAULT_PLAYLIST_ICON = "https://cdn-icons-png.flaticon.com/512/651/651717.png"; 

export const LIEKD_SONGS_ICON = 'https://misc.scdn.co/liked-songs/liked-songs-64.png'
export const LIKED_SONGS_BASE = {
    id: 'liked-songs',
    title: 'Liked Songs',
    short_id: 'collection-tracks',
    slug: 'collection-tracks',
    type: 'playlist',
    description: 'Favourtie songs playlist',
    image: 'https://misc.scdn.co/liked-songs/liked-songs-64.png',
};

export const  REJECTED_REASON= [
    { id: 1,    label: 'Incomplete or unclear information' },
    { id: 2,    label: 'Low quality profile or document image' },
    { id: 3,    label: 'Social link is invalid or not owned' },
    { id: 4,    label: 'Stage name or content copyright issue' },
    { id: 5,    label: 'Other'}
]