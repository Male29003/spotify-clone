from rest_framework import generics, permissions, status, filters, views, serializers
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.response import Response
from rest_framework.views import APIView
from django.contrib.auth import get_user_model
from django.db import transaction
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from . import serializers 
from apps.core.permissions import AdminPermission
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
import random
from ..users.models import Notification
from django.core.cache import cache
from django.shortcuts import get_object_or_404
from django.core.mail import send_mail
from django.contrib.auth.hashers import make_password
from ..core.notification import send_system_notification, send_system_event

User = get_user_model()

# ==========================================================================================
# -------------------------------- Chức năng xác thực - Dky/ Dnhap/ Sửa mật khẩu --------------------------------
# ==========================================================================================
class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = serializers.CustomTokenObtainPairSerializer

    # 🔥 ĐỘ LẠI HÀM POST: Chặn response lại để nhét Cookie
    def post(self, request, *args, **kwargs):
        # 1. Cứ để nó xử lý login bình thường (Nó sẽ tạo ra token JSON)
        response = super().post(request, *args, **kwargs)

        if response.status_code == 200:
            access_token = response.data.get('access')
            refresh_token = response.data.get('refresh')

            # 2. Bắt đầu đóng gói vào Cookie
            # Lưu ý: secure=False để test localhost, khi deploy production đổi thành True (chạy HTTPS)
            response.set_cookie(
                key='access', # 🔥 ĐÂY! TÊN COOKIE ĐƯỢC ĐỊNH NGHĨA Ở ĐÂY NÀY!
                value=access_token,
                httponly=True,
                secure=False,
                samesite='Lax'
            )
            
            response.set_cookie(
                key='refresh',
                value=refresh_token,
                httponly=True,
                secure=False, 
                samesite='Lax'
            )
            
            response.data['detail'] = "Successfully logged in."

        return response
class CustomTokenRefreshView(TokenRefreshView):
    def post(self, request, *args, **kwargs):
        # 1. Thọc tay vào Cookie lấy cái refresh token ra
        refresh_cookie = request.COOKIES.get('refresh')
        
        # 2. Nhét giả vào data để thằng simplejwt nó tưởng FE gửi lên (lừa nó xíu)
        if refresh_cookie:
            request.data['refresh'] = refresh_cookie

        # 3. Cho nó xử lý tạo Access token mới bình thường
        response = super().post(request, *args, **kwargs)

        # 4. Có Access token mới rồi thì lại đóng gói vào Cookie gửi về
        if response.status_code == 200:
            access_token = response.data.get('access')
            response.set_cookie(
                key='access',
                value=access_token,
                httponly=True,
                secure=False,
                samesite='Lax'
            )
            # del response.data['access'] # Ẩn đi cho ngầu
            response.data['detail'] = "Successfully refreshed token."

        return response
# log out
class LogoutView(APIView):
    def post(self, request):
        response = Response({"detail": "Successfully logged out."}, status=status.HTTP_200_OK)
        
        # 🔥 QUAN TRỌNG: Tên cookie ở đây phải GHI ĐÚNG Y CHANG tên sếp đã cấu hình lúc Login
        # Xóa Access Token
        response.delete_cookie('access') # (Hoặc 'ezbuy-access-token' tùy sếp đặt)
        
        # Xóa Refresh Token
        response.delete_cookie('refresh') 
        
        return response
# dky tk mới
class UserRegistrationView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = serializers.RegisterSerializer
    permission_classes = [permissions.AllowAny]

    def perform_create(self, serializer):
        # Lưu user vào DB (Lát bên serializer mình sẽ set is_active=False)
        user = serializer.save()
        
        # Tạo OTP đăng ký & Lưu Cache 5 phút (Nhớ đổi key để không trùng với Forgot Pass)
        otp = f"{random.randint(100000, 999999)}"
        cache.set(f"reg_otp_{user.email}", otp, timeout=300) 
        
        # Gửi mail
        try:
            send_mail(
                subject='[NK Tech] Verify Your Registration',
                message=f"Hi {user.username},\n\nWelcome to NK Tech! Please enter this OTP code to verify your account: {otp}\n\nThis code is valid for 5 minutes.",
                from_email='noreply@yourdomain.com',
                recipient_list=[user.email],
                fail_silently=False,
            )
        except Exception as e:
            # Ghi log lỗi email nếu cần
            print(f"Error sending email: {e}")
# xác thực otp để dky
class VerifyRegistrationOTPView(generics.GenericAPIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        email = request.data.get('email')
        otp = request.data.get('otp')

        if not email or not otp:
            return Response({"error": "Vui lòng cung cấp email và OTP."}, status=status.HTTP_400_BAD_REQUEST)

        cached_otp = cache.get(f"reg_otp_{email}")
        if not cached_otp:
            return Response({"error": "Mã OTP đã hết hạn hoặc không tồn tại."}, status=status.HTTP_400_BAD_REQUEST)
        
        if cached_otp != otp:
            return Response({"error": "Mã OTP không chính xác."}, status=status.HTTP_400_BAD_REQUEST)

        # OTP chuẩn -> Kích hoạt User
        try:
            user = User.objects.get(email=email)
            user.is_active = True
            user.save()
            # Xóa OTP khỏi cache
            cache.delete(f"reg_otp_{email}")
            return Response({"detail": "Xác thực thành công. Bạn có thể đăng nhập!"}, status=status.HTTP_200_OK)
        except User.DoesNotExist:
            return Response({"error": "Không tìm thấy tài khoản."}, status=status.HTTP_404_NOT_FOUND)

# đổi mk
class ChangePasswordView(generics.UpdateAPIView):
    serializer_class = serializers.ChangePasswordSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self): return self.request.user
    
    def put(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({
            "detail": "Successfullly update password!"
        }, status=status.HTTP_200_OK)
# quên mk
class ForgotPasswordView(generics.GenericAPIView):
    permission_classes = [permissions.AllowAny] # Cho phép người lạ (chưa đăng nhập) gọi API này
    serializer_class = serializers.ForgotPasswordSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True) # Nếu email sai, văng lỗi ngay đây!
        email = serializer.validated_data['email']
        # Tạo OTP và lưu Cache
        otp = f"{random.randint(100000, 999999)}"
        cache.set(f"otp_{email}", otp, timeout=300) # 300s = 5 phút
        # Gửi mail
        try:
            send_mail(
                subject='[NK Tech] Reset Password',
                message=f"Hi,You have recently required to reset he password for your NKM's account.\n\n \
                    Please enter this OTP code: {otp}\n\n \
                    This code is available in 5 minutes. Please do not share this code to anyone else.",
                from_email='noreply@yourdomain.com', # Có thể bỏ trống nếu dùng default trong settings
                recipient_list=[email],
                fail_silently=False,
            )
        except Exception as e:
            return Response({"error": "Lỗi hệ thống khi gửi mail. Vui lòng thử lại sau."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response({"detail": "Mã OTP đã được gửi vào email của bạn."}, status=status.HTTP_200_OK)

class ResendOTPView(generics.GenericAPIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = serializers.ResendOTPSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data['email']
        
        user = User.objects.get(email=email)
        
        # Quyết định dùng key cache nào và tiêu đề mail dựa vào trạng thái user
        otp = f"{random.randint(100000, 999999)}"
        if not user.is_active:
            cache.set(f"reg_otp_{email}", otp, timeout=300)
            subject = '[NK Tech] Resend: Verify Your Registration'
            msg = f"Your new registration verification code is: {otp}. Valid for 5 minutes."
        else:
            cache.set(f"otp_{email}", otp, timeout=300)
            subject = '[NK Tech] Resend: Reset Password'
            msg = f"Your new password reset code is: {otp}. Valid for 5 minutes."

        try:
            send_mail(
                subject=subject,
                message=msg,
                from_email='noreply@yourdomain.com',
                recipient_list=[email],
                fail_silently=False,
            )
            return Response({"detail": "Mã OTP mới đã được gửi lại thành công."}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": "Lỗi gửi mail, vui lòng thử lại sau."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# xác thực otp
class VerifyOTPView(generics.GenericAPIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = serializers.VerifyOTPSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True) 
        # is_valid nó chạy qua hàm validate ở trên, nếu sai OTP nó văng lỗi luôn.
        # Nếu code chạy xuống được đây tức là OTP chuẩn 100%
        return Response({"detail": "Mã OTP hợp lệ."}, status=status.HTTP_200_OK)
# reset lại mk
class ResetPasswordView(generics.GenericAPIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = serializers.ResetPasswordSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        # Check Pass, Check OTP xong hết mới chạy xuống dòng dưới
        email = serializer.validated_data['email']
        new_password = serializer.validated_data['new_password']
        # Cập nhật pass
        user = User.objects.get(email=email)
        user.set_password(new_password)
        user.save()
        
        # Dùng xong phải vứt OTP đi để tránh bị xài lại (Replay Attack)
        cache.delete(f"otp_{email}")
        
        return Response({"detail": "Mật khẩu đã được thiết lập lại thành công. Bạn có thể đăng nhập ngay."}, status=status.HTTP_200_OK)

# ==========================================================================================
# -------------------------------- Chức năng chung - chỉnh sửa profile + follow ng khác --------------------------------
# ==========================================================================================
class UserOwnerView(generics.RetrieveUpdateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = (MultiPartParser, FormParser, JSONParser)

    def get_object(self): return self.request.user
    
    def get_serializer_class(self):
        if self.request.method == 'GET':
            return serializers.UserDetailSerializer
        return serializers.UserUpdateSerializer

    def patch(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)

        result_serializer = serializers.UserDetailSerializer(instance, context={'request': request})
        return Response(result_serializer.data)

class ToggleFollowUserView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, username):
        # Tìm cái user mà mình muốn follow
        target_user = get_object_or_404(User, username=username, is_active=True)
        
        # Chặn trường hợp tự kỷ: Tự follow chính mình
        if request.user == target_user:
            return Response({"error": "Bạn không thể tự follow chính mình."}, status=status.HTTP_400_BAD_REQUEST)

        # check_following() là hàm sếp đã viết sẵn trong models.py
        if request.user.check_following(target_user.id):
            request.user.unfollow(target_user)
            return Response({"detail": f"Đã bỏ theo dõi user {target_user.username}."}, status=status.HTTP_200_OK)
        else:
            request.user.follow(target_user)
            return Response({"detail": f"Đã theo dõi user {target_user.username}."}, status=status.HTTP_200_OK)
        
# ==========================================================================================
# -------------------------------- Chức năng cho listener --------------------------------
# ==========================================================================================
class UserPublicProfileView(generics.RetrieveAPIView):
    queryset = User.objects.filter(is_active=True)
    serializer_class = serializers.UserDetailSerializer
    permission_classes = [permissions.AllowAny]
    lookup_field = 'username'

# ==========================================================================================
# -------------------------------- Chức năng cho admin --------------------------------
# ==========================================================================================
# QL user thường
class AdminUserListView(generics.ListAPIView):
    queryset = User.objects.filter(
        is_staff=False,
        type='user'
    ).order_by('-date_joined')
    serializer_class = serializers.AdminUserSerializer
    permission_classes = [AdminPermission]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    search_fields = ['email', 'username', 'first_name', 'last_name']
    filterset_fields = ['is_active', 'is_premium', 'type']

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['is_admin_view'] = True
        return context
    
# Xem chi tiết tài khoản
class AdminDetailUserView(generics.RetrieveAPIView):
    queryset = User.objects.all()
    serializer_class = serializers.AdminDetailUserSerializer
    permission_classes = [AdminPermission]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['is_active', 'type']
    lookup_field = 'pk'

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['is_admin_view'] = True
        return context

class AdminToggleUserStatusView(generics.UpdateAPIView):
    queryset = User.objects.all()
    serializer_class = serializers.AdminToggleStatusSerializer
    permission_classes = [AdminPermission]
    lookup_field = 'pk'

    def perform_update(self, serializer):
        user = self.get_object()
        with transaction.atomic():
            is_active = serializer.validated_data.get('is_active', True)
            # Gỡ Block thì ép reason và note về None luôn trước khi lưu
            if is_active:
                serializer.validated_data['block_reason'] = None
                serializer.validated_data['block_note'] = None

            # Lưu User
            updated_user = serializer.save()

            # Xử lý thông báo sau khi có dữ liệu mới
            if not is_active:
                reason_id = updated_user.block_reason
                note = updated_user.block_note
                reason_text = dict(BlockReason.choices).get(reason_id, "a serious violation of our terms") if reason_id else "a serious violation of our terms"
                note_text = f" Note: {note}" if note else ""
                
                send_system_notification(
                    user=updated_user,
                    title='Your account is not available anymore.',
                    message=f"Hi {updated_user.username}, your account is suspended due to {reason_text}.{note_text}",
                    use_email=True,
                    use_app=False
                )
            
            # user bị block thì đồng nghĩa artist sẽ bị block luôn
            if hasattr(user, 'artist_profile'):
                artist = user.artist_profile
                artist.is_active = user.is_active
                
                if not is_active:
                    artist.block_reason = user.block_reason
                    artist.block_note = user.block_note
                    send_system_event('ARTIST_BLOCKED', {
                        'short_id': artist.short_id, 
                        'type': 'artist'
                    })
                else:
                    artist.block_reason = None
                    artist.block_note = None
                    send_system_event('ARTIST_UNBLOCKED', {
                        'short_id': artist.short_id, 
                        'type': 'artist'
                    })
                
                artist.save()

# ==================================== QL staff ====================================
class AdminStaffListView(generics.ListAPIView):
    queryset = User.objects.filter(is_staff=True).order_by('-date_joined')
    serializer_class = serializers.AdminStaffSerializer
    permission_classes = [AdminPermission]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['is_active', 'type']

class AdminStaffDetailView(views.APIView):
    permission_classes = [permissions.IsAdminUser]

    def patch(self, request, pk):
        user = get_object_or_404(User, id=pk, is_staff=True)
        data = request.data
        
        # Cập nhật thông tin cơ bản
        if 'username' in data: user.username = data['username']
        if 'email' in data: user.email = data['email']
        
        # 🔥 Cập nhật Role (Chức danh) và Permissions (Giao diện)
        if 'role_permissions' in data: user.role_permissions = data['role_permissions']
        
        # 🔥 Khóa / Mở khóa tài khoản (Active/Deactive)
        if 'is_active' in data: user.is_active = data['is_active']
        
        # Đổi mật khẩu
        new_password = data.get('new_password')
        if new_password and str(new_password).strip():
            user.password = make_password(new_password)
            
        user.save()
        return Response({"detail": "Cập nhật nhân viên thành công!"}, status=status.HTTP_200_OK)
    
    def delete(self, request, pk):
        user = get_object_or_404(User, id=pk, is_staff=True)
        if request.user.id == user.id:
            return Response({"detail": "Không thể tự xóa tài khoản của chính mình!"}, status=status.HTTP_400_BAD_REQUEST)
            
        username = user.username
        user.delete() # Xóa vĩnh viễn
        return Response({"detail": f"Đã xóa nhân viên {username}."}, status=status.HTTP_200_OK)

class AdminCreateStaffView(generics.CreateAPIView):
    permission_classes = [permissions.IsAdminUser] 
    serializer_class = serializers.AdminStaffSerializer

    def perform_create(self, serializer):
        data = self.request.data
        password = data.get('password')
        role_permissions = data.get('role_permissions', [])
        
        serializer.save(
            password=make_password(password), 
            is_staff=True,
            profile_picture=None,
            type='user',
            role_permissions=role_permissions
        )

# ==========================================================================================
# -------------------------------- Chức năng cho thông báo --------------------------------
# ==========================================================================================
# người nhận mở xem list thông báo
class MyNotificationListView(generics.ListAPIView):
    serializer_class = serializers.NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Lấy theo user và ĐẢM BẢO có .order_by() để tin mới nổi lên đầu
        return Notification.objects.filter(user=self.request.user).order_by('is_read', '-created_at')

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())

        total_unread = queryset.filter(is_read=False).count()

        # Xử lý phân trang mặc định của DRF
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            response = self.get_paginated_response(serializer.data)
            # Nhét thêm cục đếm vào response
            response.data['total_unread'] = total_unread
            return response

        # Nếu sếp không bật phân trang trong settings
        serializer = self.get_serializer(queryset, many=True)
        return Response({
            'total_unread': total_unread,
            'results': serializer.data
        })
# đọc thông báo
class MarkNotificationReadView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def patch(self, request, pk):
        try:
            noti = Notification.objects.get(
                pk=pk, 
                user=request.user
            )
            noti.is_read = True
            noti.save()
            return Response({"detail": "Đã đọc"}, status=status.HTTP_200_OK)
        except Notification.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)
    
    def delete(self, request, pk):
        try:
            noti = Notification.objects.get(
                pk=pk, 
                user=request.user
            )
            noti.delete()
            return Response({"detail": "Đã xóa thông báo"}, status=status.HTTP_204_NO_CONTENT)
        except Notification.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)

