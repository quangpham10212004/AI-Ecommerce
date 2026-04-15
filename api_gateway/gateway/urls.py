from django.urls import path

from . import views


urlpatterns = [
    path("", views.index, name="index"),
    path("api/products/", views.product_proxy, name="product-proxy"),
    path("api/products/<path:upstream_path>", views.product_proxy, name="product-proxy-path"),
    path("api/behavior/recommend/", views.behavior_proxy, name="behavior-proxy"),
    path("api/chat/", views.chat_proxy, name="chat-proxy"),
    path("api/chat/<path:upstream_path>", views.chat_proxy, name="chat-proxy-path"),
    path("api/users/", views.user_proxy, name="user-proxy"),
    path("api/users/<path:upstream_path>", views.user_proxy, name="user-proxy-path"),
    path("api/orders/", views.order_proxy, name="order-proxy"),
    path("api/orders/<path:upstream_path>", views.order_proxy, name="order-proxy-path"),
]
