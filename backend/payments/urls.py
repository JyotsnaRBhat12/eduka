from django.urls import path
from .views import (
    CreateStripeCheckoutSessionView, StripeWebhookView, 
    VerifyPayPalOrderView, RefundPaymentView, AdminPaymentListView,
    AdminSystemReportView, ExportPaymentsCSVView
)

urlpatterns = [
    path('stripe/create-checkout-session/', CreateStripeCheckoutSessionView.as_view(), name='stripe_create_session'),
    path('stripe/webhook/', StripeWebhookView.as_view(), name='stripe_webhook'),
    path('paypal/verify-order/', VerifyPayPalOrderView.as_view(), name='paypal_verify_order'),
    
    # Admin tools
    path('admin/all/', AdminPaymentListView.as_view(), name='admin_payments_list'),
    path('admin/refund/<int:payment_id>/', RefundPaymentView.as_view(), name='admin_refund_payment'),
    path('admin/reports/system/', AdminSystemReportView.as_view(), name='admin_system_reports'),
    path('admin/reports/export/', ExportPaymentsCSVView.as_view(), name='admin_export_csv'),
]
