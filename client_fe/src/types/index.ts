export type ItemType = 'track' | 'release' | 'artist' | 'playlist' | 'genre' | 'mixed';

// Tracks - Về nhạc & Video
export interface ITrack {
    id: number;
    short_id: string;
    title: string;
    slug: string;
    image: string;
    duration: number;
    file_url: string;
    preview_file: string;
    release_short_id?: string;
    lyrics_file: string;
    listens: number;
    downloads: number;
    release_date: string;
    is_premium_only: boolean;
    release: IRelease;
    artist: IArtist;
    genre: IGenre;
    is_favourite?: boolean;
    is_active: boolean;
    is_blocked: boolean
}
  
export interface IVideo {
    id: number;
    file_url: string;
    slug: string;
    thumbnail: string;
    track: ITrack
}

export interface IGenre {
    id: number;
    name: string;
    description: string;
    slug: string;
    is_active: boolean;
    image: string
}

// Releases - Về Release
export interface IRelease {
    id: number;
    short_id: string;
    title: string;
    description: string;
    slug: string;
    image: string;
    release_date: string;
    artist: IArtist
    is_favourite?: boolean;
    is_active: boolean;
    is_blocked: boolean
}

// Playlists - Về Playlist
export interface IPlaylist {
    id: number;
    title: string;
    description: string;
    slug: string;
    image: string;
    is_private: boolean;
    user: IUser;
    tracks?: ITrack[]
    is_favourite?: boolean;
}

// Artists - Về Nghệ Sĩ
export interface IArtist{
    id: number;
    short_id: string;
    stage_name: string;
    slug: string;
    image: string;
    banner?: string;
    is_verify: boolean;
    user: IUser
    is_blocked: boolean
    is_favourite?: boolean;
}

// Users - Về Người Dùng
export interface IUser {
    id: number;
    last_login: string | null;
    is_superuser: boolean;
    email: string;
    username: string;
    phone: string;
    profile_picture: string;
    first_name: string;
    last_name: string;
    country: string;
    gender: string;
    type: string;
    is_premium: boolean;
    is_active: boolean;
    date_joined: string;
    is_blocked: boolean
    is_staff: boolean
    rejected?: number;
}

export interface ISubscription {
    id: number;
    name: string;
    price: number;
    duration_days: number;
}

export interface IPayment {
    id: number;
    amount: number;
    transaction_id: string;
    status: string;
    subscription_plan?: ISubscription;
    user?: IUser
}

/* ======================== Dành cho  library ======================== */

export interface LibraryTrack{
    type: 'track';
    data: ITrack[]
}

export interface LibraryRelease{
    type: 'release';
    data: IRelease[]
}

export interface LibraryArtist{
    type: 'artist',
    data: IArtist[]
}

export interface LibraryPlaylist{
    type: 'playlist';
    data: IPlaylist[]
}

export type LibraryItems = LibraryTrack | LibraryRelease | LibraryArtist | LibraryPlaylist