import stripe
from django.conf import settings
from django.http import HttpResponse
from django.views.decorators.csrf import csrf_exempt
from rest_framework.decorators import api_view, permission_classes
from rest_framework import permissions, status, generics
from rest_framework.views import APIView
from rest_framework.response import Response
from django.utils import timezone
from datetime import timedelta
from .models import SubscriptionPlan, Payment, UserSubscription
from django.contrib.auth import get_user_model
from .serializers import SubscriptionPlanSerializer

User = get_user_model()

# Cấu hình API Key của Stripe
stripe.api_key = settings.STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET = getattr(settings, 'STRIPE_WEBHOOK_SECRET', 'whsec_...')

class SubscriptionPlanListView(generics.ListAPIView):
    queryset = SubscriptionPlan.objects.filter(
        is_active=True
        ).order_by('price')
    serializer_class = SubscriptionPlanSerializer
    permission_classes = [permissions.AllowAny]

# 1. API TẠO PHIÊN GIAO DỊCH (Giữ nguyên, chỉ đảm bảo có truyền metadata)
class CreateStripePaymentIntentView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        plan_id = request.data.get('plan_id')
        try:
            plan = SubscriptionPlan.objects.get(id=plan_id, is_active=True)
            amount = int(plan.price)

            intent = stripe.PaymentIntent.create(
                amount=amount,
                currency='vnd',
                # 🚨 CỰC KỲ QUAN TRỌNG: Nhét ID của user và plan vào đây để lát Webhook biết đường mà cộng VIP
                metadata={'user_id': request.user.id, 'plan_id': plan.id}
            )

            return Response({'clientSecret': intent.client_secret}, status=status.HTTP_200_OK)
        except SubscriptionPlan.DoesNotExist:
            return Response({"error": "Gói không tồn tại!"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

# 2. WEBHOOK: LẮNG NGHE STRIPE BÁO CÁO (Thay thế cho StripePaymentSuccessView cũ)
@csrf_exempt  # CHỈ GIỮ LẠI ĐÚNG CÁI NÀY
def stripe_webhook_view(request):
    payload = request.body
    sig_header = request.META.get('HTTP_STRIPE_SIGNATURE')

    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, STRIPE_WEBHOOK_SECRET
        )
    except ValueError as e:
        print("⚠️ LỖI PAYLOAD:", e)
        return HttpResponse(status=400)
    except stripe.error.SignatureVerificationError as e:
        print("⚠️ LỖI CHỮ KÝ (Khúc này thường do sai Key):", e)
        return HttpResponse(status=400)

    # NẾU THANH TOÁN THÀNH CÔNG -> CỘNG VIP
    if event['type'] == 'payment_intent.succeeded':
        payment_intent = event['data']['object']
        
        user_id = payment_intent['metadata'].get('user_id')
        plan_id = payment_intent['metadata'].get('plan_id')
        payment_intent_id = payment_intent['id']

        try:
            user = User.objects.get(id=user_id)
            plan = SubscriptionPlan.objects.get(id=plan_id, is_active=True)
            
            # --- Code cộng VIP của sếp giữ nguyên ---
            if not Payment.objects.filter(order_id=payment_intent_id, status='success').exists():
                Payment.objects.create(
                    user=user, subscription_plan=plan, amount=plan.price,
                    order_id=payment_intent_id, status='success'
                )
                
                now = timezone.now()
                current_sub = UserSubscription.objects.filter(user=user, is_active=True, expired_at__gt=now).first()
                start_date = current_sub.expired_at if current_sub else now
                expired_date = start_date + timedelta(days=plan.duration_days)
                
                UserSubscription.objects.filter(user=user, is_active=True).update(is_active=False)
                UserSubscription.objects.create(
                    user=user, plan=plan, expired_at=expired_date, is_active=True
                )
                
                user.is_premium = True
                user.save(update_fields=['is_premium'])
                print(f"✅ HOÀN TẤT: Đã cộng VIP cho User ID {user.id}")
                # ----------------------------------------
                
        except Exception as e:
            print(f"❌ LỖI LOGIC DB: {e}")
            return HttpResponse(status=500)

    return HttpResponse(status=200)