from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen

from django.http import HttpResponse, JsonResponse
from django.shortcuts import render
from django.views.decorators.csrf import csrf_exempt


UPSTREAMS = {
    "products": "http://product_service:8000/api/products/",
    "behavior": "http://behavior_service:8000/api/recommend/",
    "chat": "http://rag_chat_service:8000/api/chat/",
    "users": "http://user_service:8000/api/",
    "orders": "http://order_service:8000/api/",
    "carts": "http://cart_service:8000/api/",
    "payments": "http://payment_service:8000/api/",
    "shipments": "http://shipping_service:8000/api/",
}

PASS_THROUGH_RESPONSE_HEADERS = {
    "Content-Type",
    "Location",
}


def index(request):
    return render(request, "gateway/index.html")

def login_page(request):
    return render(request, "gateway/login.html")

def customer_portal(request):
    return render(request, "gateway/customer.html")

def staff_portal(request):
    return render(request, "gateway/staff.html")

def admin_portal(request):
    return render(request, "gateway/admin_portal.html")


def _build_upstream_url(base_url, upstream_path, query_params):
    upstream_url = base_url
    if upstream_path:
        upstream_url = f"{upstream_url.rstrip('/')}/{upstream_path.lstrip('/')}"
    if query_params:
        upstream_url = f"{upstream_url}?{urlencode(list(query_params.items()), doseq=True)}"
    return upstream_url


def _proxy_request(request, upstream_key, upstream_path=""):
    if request.method == "OPTIONS":
        return HttpResponse(status=204)

    upstream_url = _build_upstream_url(UPSTREAMS[upstream_key], upstream_path, request.GET)
    body = request.body if request.method in {"POST", "PUT", "PATCH", "DELETE"} else None

    headers = {}
    headers["Host"] = "localhost"
    if request.headers.get("Content-Type"):
        headers["Content-Type"] = request.headers["Content-Type"]
    if request.headers.get("Accept"):
        headers["Accept"] = request.headers["Accept"]

    proxied_request = Request(
        upstream_url,
        data=body,
        headers=headers,
        method=request.method,
    )

    try:
        with urlopen(proxied_request, timeout=20) as upstream_response:
            response_body = upstream_response.read()
            response = HttpResponse(response_body, status=upstream_response.status)
            for header_name, header_value in upstream_response.headers.items():
                if header_name in PASS_THROUGH_RESPONSE_HEADERS:
                    response[header_name] = header_value
            return response
    except HTTPError as exc:
        response_body = exc.read()
        content_type = exc.headers.get("Content-Type", "application/json")
        response = HttpResponse(response_body, status=exc.code, content_type=content_type)
        return response
    except URLError:
        return JsonResponse(
            {"detail": f"Gateway could not reach upstream service '{upstream_key}'."},
            status=502,
        )


@csrf_exempt
def product_proxy(request, upstream_path=""):
    return _proxy_request(request, "products", upstream_path)


@csrf_exempt
def behavior_proxy(request):
    return _proxy_request(request, "behavior")


@csrf_exempt
def chat_proxy(request, upstream_path=""):
    return _proxy_request(request, "chat", upstream_path)


@csrf_exempt
def user_proxy(request, upstream_path=""):
    return _proxy_request(request, "users", upstream_path)


@csrf_exempt
def order_proxy(request, upstream_path=""):
    return _proxy_request(request, "orders", upstream_path)


@csrf_exempt
def cart_proxy(request, upstream_path=""):
    return _proxy_request(request, "carts", upstream_path)


@csrf_exempt
def payment_proxy(request, upstream_path=""):
    return _proxy_request(request, "payments", upstream_path)


@csrf_exempt
def shipment_proxy(request, upstream_path=""):
    return _proxy_request(request, "shipments", upstream_path)


def _build_upstream_url(base_url, upstream_path, query_params):
    upstream_url = base_url
    if upstream_path:
        upstream_url = f"{upstream_url.rstrip('/')}/{upstream_path.lstrip('/')}"
    if query_params:
        upstream_url = f"{upstream_url}?{urlencode(list(query_params.items()), doseq=True)}"
    return upstream_url


def _proxy_request(request, upstream_key, upstream_path=""):
    if request.method == "OPTIONS":
        return HttpResponse(status=204)

    upstream_url = _build_upstream_url(UPSTREAMS[upstream_key], upstream_path, request.GET)
    body = request.body if request.method in {"POST", "PUT", "PATCH", "DELETE"} else None

    headers = {}
    headers["Host"] = "localhost"
    if request.headers.get("Content-Type"):
        headers["Content-Type"] = request.headers["Content-Type"]
    if request.headers.get("Accept"):
        headers["Accept"] = request.headers["Accept"]

    proxied_request = Request(
        upstream_url,
        data=body,
        headers=headers,
        method=request.method,
    )

    try:
        with urlopen(proxied_request, timeout=20) as upstream_response:
            response_body = upstream_response.read()
            response = HttpResponse(response_body, status=upstream_response.status)
            for header_name, header_value in upstream_response.headers.items():
                if header_name in PASS_THROUGH_RESPONSE_HEADERS:
                    response[header_name] = header_value
            return response
    except HTTPError as exc:
        response_body = exc.read()
        content_type = exc.headers.get("Content-Type", "application/json")
        response = HttpResponse(response_body, status=exc.code, content_type=content_type)
        return response
    except URLError:
        return JsonResponse(
            {"detail": f"Gateway could not reach upstream service '{upstream_key}'."},
            status=502,
        )


@csrf_exempt
def product_proxy(request, upstream_path=""):
    return _proxy_request(request, "products", upstream_path)


@csrf_exempt
def behavior_proxy(request):
    return _proxy_request(request, "behavior")


@csrf_exempt
def chat_proxy(request, upstream_path=""):
    return _proxy_request(request, "chat", upstream_path)


@csrf_exempt
def user_proxy(request, upstream_path=""):
    return _proxy_request(request, "users", upstream_path)


@csrf_exempt
def order_proxy(request, upstream_path=""):
    return _proxy_request(request, "orders", upstream_path)


@csrf_exempt
def cart_proxy(request, upstream_path=""):
    return _proxy_request(request, "carts", upstream_path)


@csrf_exempt
def payment_proxy(request, upstream_path=""):
    return _proxy_request(request, "payments", upstream_path)


@csrf_exempt
def shipment_proxy(request, upstream_path=""):
    return _proxy_request(request, "shipments", upstream_path)
