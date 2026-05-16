import { DEFAULT_PLAYLIST_ICON } from '../../constants/constants';


const PlaylistCover = ({ playlist }: { playlist: any }) => {
  // có ảnh
  if (playlist.image) {
    return <img src={playlist.image} alt={playlist.title} className="w-full h-full object-cover" />;
  }

  // Không có ảnh -> xử lý theo bài hát
  const tracks = playlist.tracks || [];

  // Nếu playlist rỗng (chưa có bài nào) -> Hiện icon mặc định
  if (tracks.length === 0) {
    return (
      <div className="w-full h-full bg-hover flex items-center justify-center">
        <img src={DEFAULT_PLAYLIST_ICON} alt="Empty Playlist" className="w-1/3 h-1/3 opacity-50" />
      </div>
    );
  }

  // chỉ có 1 bài
  if (tracks.length === 1) {
    return <img src={tracks[0].image} alt="Track cover" className="w-full h-full object-cover" />;
  }

  // Nếu có từ 2 bài trở lên -> Tạo Grid 2x2. 
  // slice(0, 4) sẽ tự động lấy 2, 3 hoặc tối đa là 4 ảnh để nhét vào Grid.
  return (
    <div className="grid grid-cols-2 grid-rows-2 w-full h-full bg-hover">
      {tracks.slice(0, 4).map((track: any, idx: number) => (
        <img 
          key={idx} 
          src={track.image} 
          alt="Track cover" 
          className="w-full h-full object-cover" 
        />
      ))}
    </div>
  );
};

export default PlaylistCover;