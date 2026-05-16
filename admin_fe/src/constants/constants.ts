import defaultStaffImg from '../assets/staff.png'
import defaultAvatarImg from '../assets/profile.jpeg'
import defaultReleaseImg from '../assets/album.jpg'
import defaulTrackImg from '../assets/track.jpg'
import defaultGenreImg from '../assets/genre.jpg'

export const DEFAULT_STAFF_IMAGE = defaultStaffImg
export const DEFAULT_USER_AVATAR = defaultAvatarImg;
export const DEFAULT_RELEASE_IMAGE = defaultReleaseImg;
export const DEFAULT_TRACK_IMAGE = defaulTrackImg;
export const DEFAULT_GENRE_IMAGE = defaultGenreImg;
export const DEFAULT_PLAYLIST_ICON = "https://placehold.co/600x400/orange/white"

export const BLOCKED_REASON = [
    { id: 1,    label: 'Copyright Infringement' },
    { id: 2,    label: 'Sensitive Content' },
    { id: 3,    label: 'Fraud / Spam' },
    { id: 4,    label: 'Other' },
]

export const  REJECTED_REASON= [
    { id: 1,    label: 'Incomplete or unclear information' },
    { id: 2,    label: 'Low quality profile or document image' },
    { id: 3,    label: 'Social link is invalid or not owned' },
    { id: 4,    label: 'Stage name or content copyright issue' },
    { id: 5,    label: 'Other'}
]

export const RELEASE_REJECTED_REASON = [
    { id: 1,    label: 'Audio or Lyrics copyright infringement'  },
    { id: 2,    label: 'Poor audio quality or technical issues'  },
    { id: 3,    label: 'Cover art is inappropriate or low quality'  },
    { id: 4,    label: 'Metadata does not match the audio content'  },
    { id: 5,    label: 'Contains explicit content but not marked as Explicit'  },
    { id: 6,    label: 'Other'  }
];

export const RELEASE_LIMITS = {
    single:     { min: 1,   max: 3  },
    ep:         { min: 4,   max: 7  },
    album:      { min: 8,   max: 999  }
};
