import React from 'react';
import { DeleteOutlined, EditOutlined, Verified } from '@mui/icons-material';
import PlaylistCover from '../../sections/library/PLaylistCover';

// dành cho playlist
interface EditConfig {
    isEditing: boolean;
    data: { title: string; description: string };
    imagePreview: string | null;
    onChange: (field: string, value: string) => void;
    onImageClick: () => void;
    onImageRemove: (e: React.MouseEvent) => void
}

interface DetailBannerProps {
    item: any;
    totalTracks: number;
    type: 'Playlist' | 'Release' | 'Artist' | 'Genre' | 'Track';
    editConfig?: EditConfig;
}

const DetailBanner: React.FC<DetailBannerProps> = ({ item, totalTracks, type, editConfig }) => {
    const isArtist = type === 'Artist';
    const isPlaylists = type === 'Playlist';
    const currentImage = editConfig?.isEditing ? editConfig.imagePreview : item?.image;

    // dành cho nghệ sĩ
    if(isArtist){
        const banner = item?.banner || item?.image || ''
        const isFallback = !item?.banner

        return (
            <div className="relative h-[40vh] md:h-[50vh] min-h-[300px] w-full flex items-center p-6 md:p-10 z-0 overflow-hidden">
                <div 
                    className={`absolute inset-0 bg-cover bg-[center_20%] bg-no-repeat -z-20 transition-all duration-700 opacity-100
                                ${isFallback ? 'blur-xs scale-105' : ''}`}
                    style={{ backgroundImage: `url(${banner})` }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-base via-base/60 to-transparent -z-10" />

                <div className="relative z-10 flex flex-col gap-2 text-text-main">
                    <span className="flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-text-main drop-shadow-md">
                        <Verified className="text-info/85" fontSize="small" /> Verified Artist
                    </span>
                    <h1 className="text-5xl md:text-8xl font-bold tracking-tighter drop-shadow-xl line-clamp-2">
                        {item?.stage_name}
                    </h1>
                    <span className="text-sm font-medium mt-2 drop-shadow-md">
                        {item?.listens?.toLocaleString() || 0} monthly listeners
                    </span>
                </div>
            </div>
        )
    }

    // dành cho các loại còn lại
    return (
        <div className="relative flex flex-col sm:flex-row items-center gap-6 md:gap-8 p-6 md:p-10 pt-24 md:pt-32 z-0 border-b border-text-main/5 overflow-hidden">
            <div 
                className="absolute inset-0 opacity-40 blur-[100px] -z-20 pointer-events-none scale-150"
                style={{ backgroundImage: `url(${item?.image})`, backgroundSize: 'cover' }}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-base -z-10 pointer-events-none" />

            {/* ảnh bìa */}
            <div 
                className={`relative w-48 h-48 md:w-60 md:h-60 shrink-0 rounded-xl shadow-2xl z-10 overflow-hidden bg-hover
                    ${editConfig?.isEditing ? 'cursor-pointer group border-4 border-panel' : ''}`}
                onClick={() => editConfig?.isEditing && editConfig?.onImageClick()}
            >
                {/* Dùng PlaylistCover nếu là Playlist */}
                {isPlaylists && !currentImage ? (
                    <PlaylistCover playlist={{...item, image: null}} />
                ) : (
                    <img 
                        src={currentImage} 
                        alt={item?.title} 
                        className={`w-full h-full object-cover ${editConfig?.isEditing ? 'group-hover:brightness-50 transition-all' : ''}`} 
                    />
                )}

                {editConfig?.isEditing && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-all pointer-events-none">
                        <EditOutlined className="text-text-main text-4xl drop-shadow-md mb-2" />
                        <span className="text-text-main font-bold text-sm drop-shadow-md bg-base/40 px-3 py-1 rounded-full">Choose Photo</span>
                    </div>
                )}

                {editConfig?.isEditing && currentImage && (
                    <button
                        onClick={editConfig.onImageRemove}
                        className="absolute top-2 right-2 bg-base/60 hover:bg-base hover:scale-110 text-text-main p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all z-20 shadow-md"
                        title="Remove photo"
                    >
                        <DeleteOutlined fontSize="small" />
                    </button>
                )}
            </div>
            
            <div className="relative z-10 flex flex-col justify-center gap-3 text-text-main flex-1 min-w-0 w-full">
                <span className="text-sm font-bold uppercase tracking-widest">{type}</span>
                {editConfig?.isEditing ? (
                    <input 
                        type="text"
                        value={editConfig?.data.title}
                        onChange={(e) => editConfig?.onChange('title', e.target.value)}
                        className="text-3xl md:text-5xl font-bold tracking-tighter drop-shadow-lg bg-panel/70 border-b-2 border-highlight outline-none focus:bg-hover px-2 py-1 rounded-t-md w-full max-w-3xl transition-colors"
                        placeholder="Playlist name..."
                        autoFocus
                    />
                ) : (
                    <h1 className="text-3xl md:text-5xl font-bold tracking-tighter line-clamp-2 drop-shadow-lg">{item?.title}</h1>
                )}
                
                {editConfig?.isEditing ? (
                    <textarea 
                        value={editConfig?.data.description}
                        onChange={(e) => editConfig?.onChange('description', e.target.value)}
                        className="text-sm text-text-main mt-2 max-w-3xl bg-panel/70 border-b-2 border-highlight outline-none focus:bg-hover p-2 rounded-t-md resize-none w-full transition-colors"
                        placeholder="Add an optional description..."
                        rows={2}
                    />
                ) : (
                    item?.description && 
                        <p className="text-sm text-text-main mt-2 line-clamp-2 max-w-3xl">{item.description}</p>
                )}
                <div className="flex flex-wrap items-center gap-2 text-sm text-text-main font-semibold mt-2 drop-shadow-md">
                    <span className="hover:underline cursor-pointer">
                        {item?.owner || item?.artist?.stage_name || item?.artist_name || 'Spotify'}
                    </span>
                    {item?.release_date && 
                        <>
                            <span>•</span>
                            <span className="text-text-sub">{item.release_date.substring(0, 4)}</span>
                        </>
                    }
                    {totalTracks != null && totalTracks > 0 && 
                        <>
                            <span>•</span>
                            <span className="text-text-sub">{totalTracks} song{totalTracks > 1 ? 's' : ''}</span>
                        </>
                    }
                    {item?.total_listens && 
                        <>
                            <span>•</span>
                            <span className="text-text-sub">{item.total_listens.toLocaleString()} listens</span>
                        </>
                    }
                </div>
            </div>
        </div>
    )
}

export default DetailBanner;