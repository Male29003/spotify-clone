import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { CloudUpload, Add, Delete, Image as ImageIcon, MusicNote, Save, CloseOutlined, CropOutlined, FormatListBulletedOutlined } from '@mui/icons-material';
import Cropper from 'react-easy-crop';
import { CustomToast } from '../../components/shared/feedback/CustomToast';
import { useGetAllGenresForArtists } from '../../hooks/genre/useGenre';
import { useCreateRelease } from '../../hooks/release/useReleases';
import { useConfirmModalStore } from '../../stores/useConfirmModalStore';
import type { FeaturedArtistItem } from '../../sections/upload_release/FeaturedArtistInput';
import FeaturedArtistInput from '../../sections/upload_release/FeaturedArtistInput';
import { getCroppedImg } from '../../utils/cropImage';
import { RELEASE_LIMITS } from '../../constants/constants';
import { useGetUnassignedTracks } from '../../hooks/track/useTracks';

interface ReleaseUpload {
    id: number;
    existing_short_id?: string;
    title: string;
    file: File | null;
    genre_id: string;
    featured_artists: FeaturedArtistItem[];
    lyrics_file: File | null;
    existing_lyrics_file: string;
}

const UploadPage = () => {
    const navigate = useNavigate();
    // Quản lý form data
    const [releaseTitle, setReleaseTitle] = useState('');
    const [releaseType, setReleaseType] = useState('Single');
    const [coverImage, setCoverImage] = useState<File | null>(null);
    const [coverPreview, setCoverPreview] = useState<string | null>(null);
    const [showUnassignedMenu, setShowUnassignedMenu] = useState(false);
    const [releases, setReleases] = useState<ReleaseUpload[]>([
        { 
            id: Date.now(), 
            title: '', 
            file: null, 
            genre_id: '', 
            featured_artists: [],
            lyrics_file: null,
            existing_lyrics_file: ''
        }
    ]);

    const coverInputRef = useRef<HTMLInputElement>(null);

    // States cho cắt ảnh
    const [rawCoverUrl, setRawCoverUrl] = useState<string | null>(null);
    const [isCroppingCover, setIsCroppingCover] = useState(false);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

    // lấy data - thể loại & nhạc lẻ
    const { data: genresData } = useGetAllGenresForArtists(); 
    const genres = genresData?.data || (genresData as any)?.results || genresData || [];

    const { data: unassignedData } = useGetUnassignedTracks();
    const unassignedTracks = (unassignedData as any)?.results || unassignedData || [];
    
    const availableUnassigned = unassignedTracks.filter(
        (track: any) => !releases.some(r => r.existing_short_id === track.short_id)
    );

    // cảnh báo thoát trang
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (releaseTitle || coverImage || releases[0].file || releases[0].existing_short_id) {
                e.preventDefault();
                e.returnValue = '';
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [releaseTitle, coverImage, releases]);

    //  ========================= xử lý ảnh ========================= 
    const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate Format
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
            CustomToast.error('Accepted types: JPG, PNG, WEBP!');
            e.target.value = '';
            return;
        }

        // Validate Size (Tối đa 5MB)
        if (file.size > 5 * 1024 * 1024) {
            CustomToast.error('Maximum size is 5MB!');
            e.target.value = '';
            return;
        }

        // Đẩy vào bộ cắt ảnh
        setRawCoverUrl(URL.createObjectURL(file));
        setIsCroppingCover(true);
        e.target.value = '';
    };

    const onCropComplete = useCallback((_: any, pixels: any) => setCroppedAreaPixels(pixels), []);

    const showCroppedImage = async () => {
        try {
            if (!rawCoverUrl || !croppedAreaPixels) return;
            const croppedFile = await getCroppedImg(rawCoverUrl, croppedAreaPixels);
            
            setCoverImage(croppedFile);
            setCoverPreview(URL.createObjectURL(croppedFile));
            setIsCroppingCover(false);
        } catch (e) {
            CustomToast.error(`Error! Cannot crop image! ${e}`);
        }
    };

    //  ========================= xử lý nhạc ========================= 
        // upload 1 bài hát mới
    const updateTrackFile = (id: number, file: File) => {
        // Validate Format
        if (!['audio/mpeg', 'audio/wav', 'audio/x-wav'].includes(file.type)) {
            return CustomToast.error('Please upload MP3 or WAV file!');
        }

        // Validate Size (Tối đa 20MB)
        if (file.size > 20 * 1024 * 1024) {
            return CustomToast.error("Audio file's size is too large! Maximum is 20MB/song.");
        }

        const defaultTitle = file.name.replace(/\.[^/.]+$/, ""); 
        setReleases(releases.map(t => t.id === id ? { ...t, file, title: t.title || defaultTitle } : t));
    };
        // chọn 1 bài hát có sẵn của artist
    const handleAddExistingTrack = async (track: any) => {
        const fileName = track.lyrics_file ? track.lyrics_file.split('/').pop() : '';
        setReleases([...releases, { 
            id: Date.now(), 
            title: track.title, 
            file: null,
            genre_id: track.genre?.id?.toString() || '', 
            featured_artists: track.featured_artists || [],
            lyrics_file: null,
            existing_lyrics_file: fileName,
            existing_short_id: track.short_id
        }]);
        CustomToast.success(`Added "${track.title}" to tracklist!`);
        setShowUnassignedMenu(false);
    };

    // Quản lý chức năng
    const { showConfirm, closeModal, setLoading } = useConfirmModalStore();
    const { mutate: createRelease, isPending } = useCreateRelease();

    // Hàm submit nhận vào action 'draft' hoặc 'pending'
    const handleSubmit = async (actionType: 'draft' | 'pending') => {
        // validate data
        if (!releaseTitle.trim()) 
            return CustomToast.error('Please enter a release title!');
        if (!coverImage) 
            return CustomToast.error('Please upload a cover image!');
        if (releases.length === 0) 
            return CustomToast.error('You must add at least one track!');
        
        const invalidTrack = releases.find(t => !t.title.trim() || (!t.file && !t.existing_short_id));
        if (invalidTrack) return CustomToast.error('All tracks must have a title and an audio file!');
        
        const invalidGenre = releases.find(t => !t.genre_id);
        if (invalidGenre) return CustomToast.error('Please select a genre for all tracks!');
        
        if (releaseType === 'EP' && releases.length < RELEASE_LIMITS.ep.min) 
            return CustomToast.error(`An EP must have at least ${RELEASE_LIMITS.ep.min} songs!`);
        if (releaseType === 'Album' && releases.length < RELEASE_LIMITS.album.max) 
            return CustomToast.error(`An Album must have at least ${RELEASE_LIMITS.album.max} songs!`);

        const formData = new FormData();
        formData.append('action', actionType); 
        formData.append('title', releaseTitle);
        formData.append('type', releaseType);
        formData.append('image', coverImage as Blob);
        
        releases.forEach((track, index) => {
            formData.append(`releases[${index}][title]`, track.title);
            
            if (track.genre_id) {
                formData.append(`releases[${index}][genre]`, track.genre_id);
            }

            if (track.lyrics_file) {
                formData.append(`releases[${index}][lyrics_file]`, track.lyrics_file as Blob);
            }

            // Gửi file mới hoặc ID của bài cũ
            if (track.existing_short_id) {
                formData.append(`releases[${index}][existing_short_id]`, track.existing_short_id);
            } else if (track.file) {
                formData.append(`releases[${index}][file]`, track.file as Blob);
            }

            if (track.featured_artists && track.featured_artists.length > 0) {
                track.featured_artists.forEach(artist => {
                    const valueToSend = artist.id ? artist.id.toString() : artist.name;
                    formData.append(`releases[${index}][featured_artists][]`, valueToSend);
                });
            }
        });

        const confirmMsg = actionType === 'draft' 
        ? "Save this release as a draft?\n\nYou can always come back to add more tracks or edit details later."
        : "Submit this release for review?\n\nOur team will check your content to ensure it meets platform standards before going live.";

        showConfirm('save', () => {
            setLoading(true);
            createRelease(formData, {
                onSuccess: () => {
                    CustomToast.success(actionType === 'draft' ? 'Draft saved!' : 'Release submitted for review!');
                    navigate(actionType === 'draft' ? '/studio/content-management?status=draft' : '/studio/content-management?status=pending');
                },
                onError: (error) => CustomToast.error(`Upload failed: ${error}`),
                onSettled: () => {
                    setLoading(false);
                    closeModal();
                }
            });
        }, {
            title: actionType === 'draft' ? 'Save Draft' : 'Submit Release',
            message: confirmMsg
        });
    };

    const max_songs = releaseType === 'Single' ? RELEASE_LIMITS.single.max : releaseType === 'EP' ? RELEASE_LIMITS.ep.max : RELEASE_LIMITS.album.max;
    const canAddSong = releases.length < max_songs;

    return (
        <div className="min-h-full flex flex-col relative">
            <div className="max-w-6xl mx-auto pb-20 pt-6 px-4 h-full flex flex-col gap-8 animate-fadeIn relative">
                
                <div className="flex items-center justify-between border-b border-border pb-4">
                    <h1 className="text-3xl font-bold text-text-main">Create New Release</h1>
                    <button onClick={() => navigate('/studio')} className="text-text-sub hover:text-text-main font-semibold">
                        Cancel
                    </button>
                </div>

                {/* Artwork & basic info */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Ảnh bìa */}
                    <div className="col-span-1 flex flex-col gap-2">
                        <label className="text-sm font-bold text-text-sub flex justify-between">
                            <span>Artwork <span className="text-error">*</span></span>
                            {coverPreview && rawCoverUrl && (
                                <button 
                                    type="button" 
                                    onClick={() => setIsCroppingCover(true)} 
                                    className="text-highlight hover:underline flex items-center gap-1"
                                >
                                    <CropOutlined fontSize="small" /> Crop
                                </button>
                            )}
                        </label>
                        <div 
                            className="w-full max-w-[200px] sm:max-w-[250px] md:max-w-none mx-auto md:mx-0 aspect-square bg-search rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-hover transition-colors border-2 border-dashed border-border overflow-hidden relative group shadow-md"
                            onClick={() => coverInputRef.current?.click()}
                        >
                            {coverPreview ? (
                                <>
                                    <img 
                                        src={coverPreview} 
                                        alt="Cover" 
                                        className="w-full h-full object-cover" 
                                    />
                                    <div className="absolute inset-0 bg-base/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <span className="text-text-main font-bold">Change Image</span>
                                    </div>
                                </>
                            ) : (
                                <div className="flex flex-col items-center text-text-sub group-hover:text-text-main">
                                    <ImageIcon style={{ fontSize: 48 }} />
                                    <span className="mt-2 font-semibold text-sm">3000x3000px (1:1)</span>
                                </div>
                            )}
                            <input 
                                type="file" 
                                ref={coverInputRef} 
                                className="hidden" 
                                accept="image/jpeg, image/png, image/webp" 
                                onChange={handleCoverChange} 
                            />
                        </div>
                    </div>

                    {/* Thông tin cơ bản */}
                    <div className="col-span-1 md:col-span-2 flex flex-col gap-6">
                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-bold text-text-sub">Release Title <span className="text-error">*</span></label>
                            <input 
                                type="text" autoFocus
                                value={releaseTitle} 
                                onChange={e => setReleaseTitle(e.target.value)}
                                placeholder="e.g. Midnight Memories"
                                className="bg-search p-4 rounded-lg text-text-main text-xl font-bold outline-none focus:ring-2 ring-highlight border border-transparent"
                            />
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-bold text-text-sub">Release Type</label>
                            <select 
                                value={releaseType} 
                                onChange={e => setReleaseType(e.target.value)}
                                className="bg-search p-4 rounded-lg text-text-main text-lg outline-none focus:ring-2 ring-highlight cursor-pointer border border-transparent"
                            >
                                <option value="Single">Single (1-3 songs)</option>
                                <option value="EP">EP (4-7 songs)</option>
                                <option value="Album">Album (8+ songs)</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Tracklist */}
                <div className="flex flex-col gap-4 mt-4">
                    <div className="flex items-center justify-between border-b border-border pb-2">
                        <h2 className="text-2xl font-bold text-text-main">Tracklist</h2>
                        <div className="flex gap-2">
                            {/* Nút chọn nhạc có sẵn */}
                            <button 
                                onClick={() => setShowUnassignedMenu(!showUnassignedMenu)}
                                disabled={!canAddSong}
                                className={`flex items-center gap-1 text-sm font-bold px-4 py-2 rounded-full transition-transform 
                                    ${canAddSong ? (showUnassignedMenu ? 'bg-panel text-text-main border border-border' : 'bg-highlight/10 text-highlight hover:bg-highlight hover:text-panel') : 'bg-search text-text-sub opacity-50 cursor-not-allowed' }`}
                            >
                                {showUnassignedMenu ? 
                                    <CloseOutlined fontSize="small" /> 
                                : 
                                    <FormatListBulletedOutlined fontSize="small" />
                                } 
                                {showUnassignedMenu ? 'Cancel' : 'Choose Existing'}
                            </button>
                            
                            <button 
                                onClick={() => setReleases([...releases, { id: Date.now(), title: '', file: null, genre_id: '', featured_artists: [], lyrics_file: null, existing_lyrics_file: '' }])}
                                disabled={!canAddSong}
                                className={`flex items-center gap-1 text-sm font-bold px-4 py-2 rounded-full transition-transform 
                                    ${canAddSong ? 'text-text-dark bg-text-main hover:scale-105' : 'bg-search text-text-sub opacity-50 cursor-not-allowed' }`}
                            >
                                <Add fontSize="small" /> Add song
                            </button>
                        </div>
                    </div>
                    
                    {!canAddSong && 
                        <p className='text-sm text-error text-right'>Maximum songs reached for {releaseType}.</p>
                    }

                    {/* Menu chọn nhạc có sẵn */}
                    {showUnassignedMenu && (
                        <div className="bg-panel border border-border p-5 rounded-xl flex flex-col mb-2 animate-slideDown shadow-sm">
                            <h4 className="font-bold text-text-main text-lg border-b border-border pb-2 mb-4">
                                Unassigned Tracks
                            </h4>
                            <div className="flex-1 overflow-y-auto custom-scrollbar bg-base rounded-lg border border-border/50 p-2 max-h-[250px]">
                                {availableUnassigned.length === 0 ? (
                                    <p className="text-xs text-center text-text-sub mt-4 py-4">No unassigned tracks available.</p>
                                ) : (
                                    <div className="space-y-1">
                                        {availableUnassigned.map((t: any) => (
                                            <div key={t.short_id} className="flex justify-between items-center p-3 hover:bg-panel rounded-lg group border border-transparent hover:border-border transition-colors">
                                                <div className="flex flex-col truncate pr-2">
                                                    <span className="text-sm font-bold text-text-main truncate">{t.title}</span>
                                                    <span className="text-xs text-text-sub">{t.genre?.name || 'No genre'}</span>
                                                </div>
                                                <button 
                                                    onClick={() => handleAddExistingTrack(t)}
                                                    className="text-xs bg-highlight/10 text-highlight px-3 py-1.5 rounded-full font-bold opacity-0 group-hover:opacity-100 transition-opacity hover:bg-highlight hover:text-panel"
                                                >
                                                    + Add
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="flex flex-col gap-4">
                        {releases.map((track, index) => (
                            <div key={track.id} className="bg-search p-5 rounded-xl flex flex-col gap-4 group border border-border shadow-sm hover:border-text-sub transition-colors">
                                
                                <div className="flex gap-4 items-start w-full">
                                    <span className="text-text-sub font-bold w-6 text-center mt-2 text-lg">{index + 1}</span>
                                    
                                    <div className="flex-1 flex flex-col gap-4">
                                        <input 
                                            type="text" 
                                            value={track.title}
                                            onChange={e => setReleases(releases.map(t => t.id === track.id ? { ...t, title: e.target.value } : t))}
                                            placeholder={`Track ${index + 1} Title`}
                                            className="bg-transparent text-text-main font-bold text-xl outline-none border-b border-border focus:border-highlight pb-1"
                                        />
                                        
                                        <div className="flex items-center gap-4">
                                            {/* Nếu là bài có sẵn thì khóa upload, hiện thông báo */}
                                            {track.existing_short_id ? (
                                                <div className="flex items-center gap-2 bg-panel px-4 py-2 rounded-lg border border-highlight shadow-sm text-highlight">
                                                    <MusicNote fontSize="small" />
                                                    <span className="text-sm font-semibold">Existing Audio Linked</span>
                                                </div>
                                            ) : (
                                                <label className="cursor-pointer hover:text-text-main flex items-center gap-2 bg-panel px-4 py-2 rounded-lg border border-border hover:border-highlight transition-colors shadow-sm">
                                                    <MusicNote fontSize="small" className={track.file ? "text-highlight" : "text-text-sub"} /> 
                                                    <span className="text-sm font-semibold">
                                                        {track.file ? "Change Audio" : "Upload Audio *"}
                                                    </span>
                                                    <input 
                                                        type="file" 
                                                        className="hidden" 
                                                        accept="audio/mpeg, audio/wav, audio/x-wav"
                                                        onChange={e => e.target.files?.[0] && updateTrackFile(track.id, e.target.files[0])}
                                                    />
                                                </label>
                                            )}
                                            
                                            <span className={`text-sm truncate max-w-[250px] ${track.file || track.existing_short_id ? 'text-text-main font-medium' : 'text-text-sub italic'}`}>
                                                {track.existing_short_id ? "Audio is safely stored on server" : (track.file?.name || "No file selected (Max 20MB)")}
                                            </span>
                                        </div>

                                        <FeaturedArtistInput 
                                            selectedArtists={track.featured_artists || []}
                                            onChange={(newArtists) => setReleases(releases.map(t => t.id === track.id ? { ...t, featured_artists: newArtists } : t))}
                                        />
                                    </div>

                                    <div className="flex flex-col gap-4 items-end ml-2">
                                        <select 
                                            value={track.genre_id}
                                            onChange={e => setReleases(releases.map(t => t.id === track.id ? {...t, genre_id: e.target.value } : t))}
                                            className="bg-panel text-text-main font-medium text-sm outline-none border border-border rounded-lg px-3 py-2.5 cursor-pointer focus:border-highlight transition-colors w-40"
                                        >
                                            <option value="" disabled>Select Genre *</option>
                                            {genres.map((genre: any) => (
                                                <option key={genre.id} value={genre.id}>{genre.name}</option>
                                            ))}
                                        </select>
                                        
                                        <button 
                                            onClick={() => setReleases(releases.filter(t => t.id !== track.id))}
                                            className="text-text-sub hover:text-error w-10 h-10 flex items-center justify-center rounded-full hover:bg-panel transition-colors"
                                            title="Delete Track"
                                        >
                                            <Delete />
                                        </button>
                                    </div>
                                </div>

                                {/* Phần nhập Lyrics */}
                                <div className="ml-10">
                                    <div className="flex items-center gap-4">
                                        <label className="cursor-pointer hover:text-text-main flex items-center gap-2 bg-panel px-4 py-2 rounded-lg border border-border hover:border-highlight transition-colors shadow-sm">
                                            <span className="text-sm font-semibold">
                                                {track.lyrics_file ? "Change Lyrics File" : "Upload Lyrics (.lrc)"}
                                            </span>
                                            <input 
                                                type="file" 
                                                className="hidden" 
                                                accept=".lrc"
                                                onChange={e => {
                                                    const file = e.target.files?.[0];
                                                    if (file) setReleases(releases.map(t => t.id === track.id ? { ...t, lyrics_file: file } : t));
                                                    e.target.value = '';
                                                }}
                                            />
                                        </label>
                                        <span className={`text-sm truncate max-w-[250px] ${track.lyrics_file || track.existing_lyrics_file ? 'text-highlight font-medium' : 'text-text-sub italic'}`}>
                                            {track.lyrics_file 
                                                ? track.lyrics_file.name 
                                                : (track.existing_lyrics_file || "No lyrics file uploaded")}
                                        </span>
                                        <div className="flex flex-col">
                                            
                                            {track.lyrics_file && (
                                                <button 
                                                    onClick={() => setReleases(releases.map(t => t.id === track.id ? { ...t, lyrics_file: null } : t))}
                                                    className="text-sm md:text-md text-error hover:font-bold text-left mt-0.5 rounded-lg hover:bg-error/20 px-3 py-2 transition-all duration-200"
                                                >
                                                    Remove file
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* nút */}
                <div className="sticky -bottom-8 -mx-8 px-8 py-4 bg-base/90 backdrop-blur-md border-t border-border mt-4 flex justify-end gap-4 z-10">
                    <button 
                        title='Save as Draft'
                        onClick={() => handleSubmit('draft')}
                        disabled={isPending}
                        className="flex items-center gap-2 bg-panel text-text-main px-6 py-3 rounded-full font-bold hover:bg-search transition-colors border border-border"
                    >
                        <Save fontSize="small" /> Save
                    </button>
                    <button 
                        title='Submit to admin for Review'
                        onClick={() => handleSubmit('pending')}
                        disabled={isPending}
                        className={`flex items-center gap-2 bg-highlight text-text-dark px-8 py-3 rounded-full font-bold transition-transform shadow-lg shadow-highlight/20
                            ${isPending ? 'opacity-70 cursor-not-allowed' : 'hover:scale-105'}`}
                    >
                        <CloudUpload /> {isPending ? 'Processing...' : 'Submit for Review'}
                    </button>
                </div>

                {/* modal cắt ảnh */}
                {isCroppingCover && rawCoverUrl && (
                    <div className="fixed inset-0 z-100 bg-base/90 backdrop-blur-md flex flex-col items-center justify-center p-4">
                        <div className="bg-panel w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl flex flex-col border border-border">
                            <div className="p-4 border-b border-border flex justify-between items-center">
                                <h3 className="font-bold text-lg text-text-main">Crop Cover Art (1:1)</h3>
                                <button onClick={() => setIsCroppingCover(false)} className="text-text-sub hover:text-text-main"><CloseOutlined /></button>
                            </div>
                            
                            <div className="relative w-full h-80 bg-dark">
                                <Cropper
                                    image={rawCoverUrl}
                                    crop={crop}
                                    zoom={zoom}
                                    aspect={1} // Ép tỉ lệ 1:1
                                    cropShape="rect" // Ép cắt hình vuông (mặc định là rect)
                                    showGrid={true}
                                    onCropChange={setCrop}
                                    onCropComplete={onCropComplete}
                                    onZoomChange={setZoom}
                                />
                            </div>
                            
                            <div className="p-4 bg-panel flex flex-col gap-4">
                                <div className="flex items-center gap-4 text-text-main">
                                    <span className="text-sm font-semibold text-text-sub">Zoom</span>
                                    <input 
                                        type="range" 
                                        min={1} 
                                        max={3} 
                                        step={0.1} 
                                        value={zoom} 
                                        onChange={(e) => setZoom(Number(e.target.value))} 
                                        className="flex-1 accent-highlight" 
                                    />
                                </div>
                                <button onClick={showCroppedImage} className="w-full py-3 bg-highlight text-text-dark font-bold rounded-full hover:scale-105 transition-transform">
                                    Done
                                </button>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};

export default UploadPage;