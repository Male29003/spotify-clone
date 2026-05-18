import os
import json, uuid, random
from django.db import transaction
from datetime import timedelta
from django.core.management.base import BaseCommand
from django.utils.dateparse import parse_datetime  # Dùng để ép kiểu chuỗi ISO ISO8601 sang Datetime
from django.contrib.auth import get_user_model
from django.contrib.auth.hashers import make_password  # Dùng để mã hóa (băm) mật khẩu
from django.core.management.color import no_style
from django.utils import timezone
from dateutil import parser

from apps.subscription.models import SubscriptionPlan, UserSubscription, Payment
from apps.artists.models import Artist, FavouriteArtist
from apps.genres.models import Genre
from apps.releases.models import Release, FavouriteRelease
from apps.music.models import Track, Video
from apps.playlists.models import Playlist, FavouritePlaylist
from apps.analytics.models import StreamHistory, DownloadHistory

User = get_user_model()

class Command(BaseCommand):
    help = 'Seed database'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS("Bắt đầu seeding ...."))

        try:
            with transaction.atomic():
                
                self.seed_genres()
                self.seed_subscription_plans()
                
                premium_users = self.seed_users()
                self.seed_artists()
                self.seed_user_subscriptions(premium_users_data=premium_users)
                
                self.seed_music()
                self.seed_playlist()
                
                # --- GỌI CÁC HÀM MỚI ---
                self.seed_favourites()
                self.seed_download_history(premium_users)
                self.seed_stream_history()
        
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Lỗi: {str(e)}"))
            # In ra traceback để dễ debug lỗi
            import traceback
            traceback.print_exc()


    # Seed thể loại và gói pre
    def seed_genres(self):
        """Bước 1: Seed Thể loại"""
        self.stdout.write('1. Đang seed thể loại...')
        with open('database/genres.json', 'r', encoding='utf-8') as f:
            genres_data = json.load(f)
            for g in genres_data:
                # Đường dẫn ảnh đã được quy hoạch: genres/{slug}/image/cover.jpg
                genre, created = Genre.objects.get_or_create(
                    id=g['id'],
                    defaults={
                        'name': g['name'],
                        'slug': g['slug'],
                        'description': g.get('description', ''),
                        'image': f"genres/{g['slug']}/image/cover.jpg"
                    }
                )
                if created:
                    Genre.objects.filter(id=genre.id).update(
                    created_at=parser.isoparse('2025-10-01T00:00:00.000Z')
                )

    def seed_subscription_plans(self):
        """Bước 2: Seed Gói Subscription"""
        self.stdout.write('2. Đang seed gói cước...')
        plans = [
            {'name': '1 month', 'price': 59000, 'duration_days': 30},
            {'name': '6 months', 'price': 299000, 'duration_days': 180},
            {'name': '1 year', 'price': 499000, 'duration_days': 365},
        ]
        for p in plans:
            sub, created = SubscriptionPlan.objects.get_or_create(name=p['name'], defaults=p)
            if created:
                SubscriptionPlan.objects.filter(id = sub.id).update(
                    created_at = parser.isoparse('2025-10-01T00:00:00.000Z')
                )

    # seed user
    def seed_users(self):
        self.stdout.write('3. Đang seed người dùng (Bulk mode)...')

        existing_emails = set(User.objects.values_list('email', flat=True))
        
        with open('database/master_users_seed.json', 'r', encoding='utf-8') as f:
            users_data = json.load(f)
        
        new_users_to_create = []
        password = make_password('Passw123!@')
        
        for u in users_data:
            if u['email'] not in existing_emails:
                profile_picture = 'admin.jpg' if u['is_superuser'] \
                                            else u['profile_picture']
                new_user = User(
                    id=u['id'],
                    username=u['username'],
                    email=u['email'],
                    phone=u['phone'] or None,
                    password=password,
                    profile_picture=profile_picture,
                    first_name=u['first_name'],
                    last_name=u['last_name'],
                    gender=u['gender'],
                    type=u['type'],
                    is_premium=u['is_premium'],
                    is_active=u['is_active'],
                    is_staff=u['is_staff'],
                    is_superuser=u['is_superuser'],
                    date_joined=parser.isoparse(u['date_joined']),
                    last_login=parser.isoparse(u['last_login'])
                )
                new_users_to_create.append(new_user)
        if new_users_to_create:
            User.objects.bulk_create(new_users_to_create)
            self.stdout.write(f"✅ Đã tạo mới {len(new_users_to_create)} người dùng.")

        premium_users = []
        all_users_dict = {user.email: user for user in User.objects.all()}
        
        for u in users_data:
            if u.get('is_premium') and u.get('type') == 'user' and not u.get('is_superuser'):
                user_obj = all_users_dict.get(u['email'])
                if user_obj:
                    premium_users.append({'user_obj': user_obj, 'data': u})

        return premium_users
    
    # seed gói 
    def seed_user_subscriptions(self, premium_users_data):
        """Bước 4: Gán gói Premium và tạo Payment"""
        self.stdout.write('4. Đang xử lý đăng ký Premium...')
        plan_1_year = SubscriptionPlan.objects.get(name='1 year')
        
        for item in premium_users_data:
            user = item['user_obj']
            # Ngày bắt đầu = Ngày tham gia + 1-3 ngày
            join_date_str = item['data'].get('date_joined')
            
            # Ép kiểu từ string sang datetime object
            if isinstance(join_date_str, str):
                join_date = parser.isoparse(join_date_str)
            else:
                join_date = join_date_str

            # Giờ thì cộng timedelta thoải mái không sợ lỗi str + timedelta
            start_date = join_date + timedelta(days=random.randint(1, 3))
            end_date = start_date + timedelta(days=365)

            # Tạo Subscription
            usub, _ = UserSubscription.objects.get_or_create(
                user=user,
                plan=plan_1_year,
                defaults={
                    'expired_at': end_date,
                    'is_active': True
                }
            )
            UserSubscription.objects.filter(id=usub.id).update(created_at=start_date)

           # thời gian thanh toán + 2-4 phút
            pay_time = start_date + timedelta(minutes=random.randint(2, 4))
            
            # Đổi .create thành .get_or_create để dùng được cú pháp "pay, _"
            pay, _ = Payment.objects.get_or_create(
                user=user,
                subscription_plan=plan_1_year,
                amount=plan_1_year.price,
                status='success',
                # Lưu ý: Nếu order_id dùng uuid.uuid4() thì get_or_create 
                # sẽ luôn tạo mới vì uuid không bao giờ trùng. 
                # Nhưng dùng cú pháp này để fix lỗi Unpack của ông trước đã.
                defaults={
                    'order_id': str(uuid.uuid4())
                }
            )
            
            # Giờ thì pay.id chạy ngon lành
            Payment.objects.filter(id=pay.id).update(created_at=pay_time)

    # seed nghệ sĩ
    def seed_artists(self):
        self.stdout.write('5. Đang seed nghệ sĩ...')
        artists_list = []
        with open('database/artists.json', 'r', encoding='utf-8') as f:
            artsits_data = json.load(f)

            for a in artsits_data:
                artist, created = Artist.objects.get_or_create(
                    id = a['id'],
                    defaults={
                        'stage_name': a['stage_name'],
                        'slug': a['slug'],
                        'image': a['image'],
                        'is_verify': a['is_verify'],
                        'user_id': a['user_id'],
                    }
                )

                if created:
                    Artist.objects.filter(id = artist.id).update(
                        created_at = parser.isoparse('2025-10-01T00:00:00.000Z')
                    )

                artists_list.append(artist)
        return artists_list

    # seed nhạc
    def seed_music(self):
        self.stdout.write('6. Đang seed nhạc và album...')
        with open('database/new_database_seed.json', 'r', encoding='utf-8') as f:
            music_data = json.load(f)

            for rel_data in music_data['releaseArray']:
                raw_date = rel_data.get('release_date')
                if isinstance(raw_date, str):
                    # Biến "2025-07-23T07:00:00Z" thành datetime object rồi lấy .date()
                    clean_release_date = parser.isoparse(raw_date).date()
                else:
                    clean_release_date = raw_date

                release, created = Release.objects.get_or_create(
                    id=rel_data['id'],
                    defaults={
                        'title': rel_data['title'],
                        'short_id': rel_data['short_id'],
                        'slug': rel_data['slug'],
                        'artist_id': rel_data['artist_id'],
                        'image': rel_data['image'],
                        'release_date': clean_release_date,
                        'release_type': rel_data['release_type'],
                        'is_published': True,
                        'is_active': True,
                        'is_pending': False,
                        'is_blocked': False,
                    }
                )
                if created:
                    Release.objects.filter(id = release.id).update(
                        created_at = parser.isoparse(rel_data['created_at'])
                    )

                # Seed Tracks thuộc Release này
                tracks_in_rel = [t for t in music_data['trackArray'] if t['release_id'] == release.id]
                for trk in tracks_in_rel:
                    track, created = Track.objects.get_or_create(
                        short_id = trk['short_id'],
                        defaults={
                            'id': trk['id'],
                            'title': trk['title'],
                            'slug': trk['slug'],
                            'release_id': trk['release_id'],
                            'artist_id': trk['artist_id'],
                            'genre_id': trk['genre_id'],
                            'is_premium_only': trk['is_premium_only'],
                            'listens': trk['listens'] + random.randint(50, 100),
                            'downloads': trk['downloads'],
                            'duration': timedelta(seconds=trk.get('duration', 0)),
                            'is_active': trk['is_active'],
                            'is_blocked': trk['is_blocked'],
                            'file_url': trk['file_url'],
                            'preview_file': trk['preview_file'],
                            'lyrics_file': trk['lyrics_file'],
                        }
                    )
                    if created:
                        Track.objects.filter(id = track.id).update(
                            created_at = parser.isoparse(trk['created_at'])
                        )
    

    def seed_playlist(self):
        self.stdout.write('7. Đang seed playlist...')
        with open('database/master_playlists_seed.json', 'r', encoding='utf-8') as f:
            playlist_data = json.load(f)
        
            for p in playlist_data:
                playlist, created = Playlist.objects.get_or_create(
                    id = p['id'],
                    defaults={
                        'user_id': p['user_id'],
                        'image': None,
                        'title': p['title'],
                        'slug': p['slug'],
                        'description': p['description'],
                        'is_private': True,
                        'created_at': p['created_at'],
                    }
                )

                if created:
                # Lấy danh sách track object dựa trên track_ids [34, 48, ...]
                    track_list = Track.objects.filter(id__in=p['track_ids'])
                    playlist.tracks.set(track_list)
                    Playlist.objects.filter(id = playlist.id).update(
                        created_at = parser.isoparse(p['created_at'])
                    )
    
    def seed_favourites(self):
        self.stdout.write('8. Đang seed FavouriteArtist và cập nhật followers...')
        # Lấy user thường, bỏ qua admin/artist cho sạch data
<<<<<<< HEAD
        users = User.objects.filter(type='user', is_superuser=False, is_staff=False, is_active=True)
=======
        users = User.objects.filter(type='user', is_superuser=False)
>>>>>>> d0d092557be3048ad089e799de52192222719817
        artists = list(Artist.objects.all())

        for user in users:
            # Random thích 2-5 artist
            fav_artists = random.sample(artists, random.randint(2, 5))
            for artist in fav_artists:
                a, created = FavouriteArtist.objects.get_or_create(user=user, artist=artist)
                if created:
                    # user là Object, lấy trực tiếp field
                    join_date = user.date_joined 
                    if isinstance(join_date, str):
                        join_date = parser.isoparse(join_date)

                    fav_date = join_date + timedelta(days=random.randint(7, 10))
                    
                    # Thêm .objects vào đây
                    FavouriteArtist.objects.filter(id=a.id).update(created_at=fav_date)

                if artist.user:
                    artist.user.follow(user)

    def seed_download_history(self, premium_users_list):
        self.stdout.write('9. Đang seed DownloadHistory cho Premium...')
        tracks = list(Track.objects.all())
        
        for item in premium_users_list:
            user = item['user_obj']
            # Parse thời gian để lấy khoảng [date_joined, last_login]
            start = parser.isoparse(item['data']['date_joined'])
            end = parser.isoparse(item['data']['last_login'])
            
            # Mỗi user tải 5-10 bài random
            selected_tracks = random.sample(tracks, random.randint(5, 10))
            for track in selected_tracks:
                # Random thời gian trong khoảng hoạt động của user
                random_ts = random.randint(0, int((end - start).total_seconds()))
                dt_download = start + timedelta(seconds=random_ts)
                
                d, created = DownloadHistory.objects.get_or_create(
                    user=user,
                    track=track,
                )
                if created:
                    DownloadHistory.objects.filter(id = d.id).update(
                        created_at = dt_download
                    )


    def seed_stream_history(self):
        self.stdout.write('10. Đang seed StreamHistory (Phân bổ theo tháng)...')
        tracks = Track.objects.all()
<<<<<<< HEAD
        all_active_users = list(User.objects.filter(is_active=True, is_staff=False, is_superuser=False, type='user'))
=======
        all_active_users = list(User.objects.filter(is_active=True))
>>>>>>> d0d092557be3048ad089e799de52192222719817
        premium_users = [u for u in all_active_users if u.is_premium]

        if not premium_users:
            self.stdout.write('⚠️ Cảnh báo: Không tìm thấy user Premium. Nhạc Premium sẽ không có lượt nghe!')
        
        now = timezone.now()
        temp_day = 17

        for track in tracks:
            total = track.listens
            if total <= 0: continue

            target_users = premium_users if track.is_premium_only else all_active_users
            
            # Nếu là bài Premium mà không có user Premium nào thì bỏ qua để tránh lỗi random.choice
            if not target_users: continue
            
            # Tách phần dư (hàng chục) để dồn vào tháng cuối như ông muốn
            base_total = (total // 100) * 100
            remainder = total % 100
            
            # Tỷ lệ phân bổ: T1-2 (10% mỗi), T3-4 (15% mỗi), T5-6 (20% mỗi), T7 (10% + dư)
            distribution = [
                (10, 31), (10, 30), # T1, T2 (lùi 180 ngày)
                (15, 31), (15, 31), # T3, T4
                (20, 28), (20, 31), # T5, T6
            ]
            
            start_offset = 182 # Bắt đầu từ 6 tháng trước
            for percent, days in distribution:
                count = (base_total * percent) // 100
                self._bulk_stream(track, target_users, count, now - timedelta(days=start_offset), days)
                start_offset -= days
            
            # Nửa tháng 7 cuối cùng: 10% base + toàn bộ phần dư
            last_month_count = ((base_total * 10) // 100) + remainder
            self._bulk_stream(track, target_users, last_month_count, now - timedelta(days=temp_day), temp_day)

    def _bulk_stream(self, track, users, amount, start_dt, days_range):
        logs = []
        for _ in range(amount):
            offset = random.randint(0, days_range * 24 * 3600)
            logs.append(StreamHistory(
                track=track,
                user=random.choice(users),
                created_at=start_dt + timedelta(seconds=offset),
                country='VN'
            ))
            if len(logs) >= 2000:
                StreamHistory.objects.bulk_create(logs)
                logs = []
        if logs:
            StreamHistory.objects.bulk_create(logs)
                