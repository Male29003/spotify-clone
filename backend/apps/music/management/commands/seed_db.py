import json
import random
from datetime import datetime, timedelta
from dateutil import parser

def generate_playlists():
    with open('database/master_users_seed.json', 'r', encoding='utf-8') as f:
        users = json.load(f)
    
    playlists = []
    playlist_id_counter = 1
    
    # Chỉ tạo playlist cho User thường (role user), bỏ qua admin/artist nếu muốn
    normal_users = [u for u in users if u.get('type') == 'user' and u.get('is_superuser') == False]

    def parse_iso(date_str):
        if not date_str: return datetime.now()
        # Loại bỏ chữ Z ở cuối để tránh lỗi format trên một số bản Python cũ
        clean_date = date_str.replace('Z', '')
        try:
            # Thử format có phần nghìn giây
            return datetime.strptime(clean_date, '%Y-%m-%dT%H:%M:%S.%f')
        except ValueError:
            # Nếu không có phần nghìn giây thì dùng format cũ
            return datetime.strptime(clean_date, '%Y-%m-%dT%H:%M:%S')

    for u in normal_users:
        # Mỗi user random tạo từ 1-3 playlist
        num_playlists = random.randint(1, 3)
        
        for _ in range(num_playlists):
            # Logic thời gian: (created_at, last_login]
            fmt = '%Y-%m-%dT%H:%M:%SZ'
            start = parse_iso(u['date_joined'])
            end = parse_iso(u['last_login'])
            
            # Tính khoảng cách giây giữa 2 mốc
            delta_seconds = int((end - start).total_seconds())
            if delta_seconds <= 0: delta_seconds = 3600 # Fallback 1h nếu lỗi logic
            
            random_offset = random.randint(1, delta_seconds)
            playlist_date = start + timedelta(seconds=random_offset)

            playlists.append({
                "id": str(playlist_id_counter),
                "title": f"Playlist Tuyển Tập {playlist_id_counter}",
                "slug": f"playlist-tuyen-tap-{playlist_id_counter}-{u['id']}",
                "description": f"Danh sách phát yêu thích tạo bởi user #{u['username']}",
                "is_private": random.choice([True, False]),
                "track_ids": random.sample(range(1, 236), random.randint(4, 12)), # 5-15 bài random
                "user_id": u['id'],
                "created_at": playlist_date.strftime(fmt)
            })
            playlist_id_counter += 1

    with open('database/master_playlists_seed.json', 'w', encoding='utf-8') as f:
        json.dump(playlists, f, indent=4, ensure_ascii=False)
    print(f"✅ Đã tạo {len(playlists)} playlists mẫu.")

if __name__ == "__main__":
    generate_playlists()