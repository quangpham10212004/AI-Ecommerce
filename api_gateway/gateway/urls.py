from django.urls import path

from . import views


urlpatterns = [
    path("", views.index, name="index"),
    path("login/", views.login_page, name="login"),
    path("customer/", views.customer_portal, name="customer-portal"),
    path("staff/", views.staff_portal, name="staff-portal"),
    path("admin-portal/", views.admin_portal, name="admin-portal"),
    path("api/products/", views.product_proxy, name="product-proxy"),
    path("api/products/<path:upstream_path>", views.product_proxy, name="product-proxy-path"),
    path("api/behavior/recommend/", views.behavior_proxy, name="behavior-proxy"),
    path("api/chat/", views.chat_proxy, name="chat-proxy"),
    path("api/chat/<path:upstream_path>", views.chat_proxy, name="chat-proxy-path"),
    path("api/users/", views.user_proxy, name="user-proxy"),
    path("api/users/<path:upstream_path>", views.user_proxy, name="user-proxy-path"),
    path("api/orders/", views.order_proxy, name="order-proxy"),
    path("api/orders/<path:upstream_path>", views.order_proxy, name="order-proxy-path"),
    path("api/carts/", views.cart_proxy, name="cart-proxy"),
    path("api/carts/<path:upstream_path>", views.cart_proxy, name="cart-proxy-path"),
    path("api/payments/", views.payment_proxy, name="payment-proxy"),
    path("api/payments/<path:upstream_path>", views.payment_proxy, name="payment-proxy-path"),
    path("api/shipments/", views.shipment_proxy, name="shipment-proxy"),
    path("api/shipments/<path:upstream_path>", views.shipment_proxy, name="shipment-proxy-path"),
]
