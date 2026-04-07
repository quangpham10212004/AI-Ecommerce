import time
import unicodedata

from rest_framework.response import Response
from rest_framework.views import APIView


PRODUCT_KNOWLEDGE = {
    "tai nghe sony wh-1000xm5": (
        "Sony WH-1000XM5 is a strong fit for customers who value premium audio, focused work, "
        "and frequent travel thanks to its active noise cancellation. The knowledge base recommends "
        "pairing it with extended warranty coverage and membership benefits for premium shoppers."
    ),
    "sony wh-1000xm5 headphones": (
        "Sony WH-1000XM5 is a strong fit for customers who value premium audio, focused work, "
        "and frequent travel thanks to its active noise cancellation. The knowledge base recommends "
        "pairing it with extended warranty coverage and membership benefits for premium shoppers."
    ),
    "ban phim co keychron q1": (
        "Keychron Q1 suits customers who want a premium typing experience, flexible customization, "
        "and a reliable desk setup for work or development. The knowledge base recommends upselling "
        "it together with an ergonomic mouse or a laptop stand."
    ),
    "keychron q1 mechanical keyboard": (
        "Keychron Q1 suits customers who want a premium typing experience, flexible customization, "
        "and a reliable desk setup for work or development. The knowledge base recommends upselling "
        "it together with an ergonomic mouse or a laptop stand."
    ),
    "chuot logitech mx master 3s": (
        "Logitech MX Master 3S is a strong choice for office users and content creators who care about "
        "comfort, multi-device workflows, and productivity. The knowledge base prioritizes this item "
        "for work-from-home bundles."
    ),
    "logitech mx master 3s mouse": (
        "Logitech MX Master 3S is a strong choice for office users and content creators who care about "
        "comfort, multi-device workflows, and productivity. The knowledge base prioritizes this item "
        "for work-from-home bundles."
    ),
    "man hinh lg ultragear 27": (
        "LG UltraGear 27 fits customers who want to upgrade their work or entertainment setup with more screen space. "
        "The knowledge base suggests pairing it with a laptop stand and a wireless mouse."
    ),
    "lg ultragear 27 monitor": (
        "LG UltraGear 27 fits customers who want to upgrade their work or entertainment setup with more screen space. "
        "The knowledge base suggests pairing it with a laptop stand and a wireless mouse."
    ),
}

CATEGORY_KNOWLEDGE = {
    "thiet bi am thanh": (
        "The audio category fits customers who prioritize music, online meetings, and a quiet workspace. "
        "The system favors products with noise cancellation, clear microphones, and extended protection plans."
    ),
    "audio": (
        "The audio category fits customers who prioritize music, online meetings, and a quiet workspace. "
        "The system favors products with noise cancellation, clear microphones, and extended protection plans."
    ),
    "phu kien": (
        "The accessories category works well for cross-sell strategy. The knowledge base recommends bundles "
        "around keyboards, mice, laptop stands, and productivity accessories."
    ),
    "accessories": (
        "The accessories category works well for cross-sell strategy. The knowledge base recommends bundles "
        "around keyboards, mice, laptop stands, and productivity accessories."
    ),
    "laptop": (
        "The laptop category usually targets higher-value shoppers. The system often recommends device protection, "
        "connectivity accessories, and after-sales support packages."
    ),
}

POLICY_KNOWLEDGE = [
    (
        ("khuyen mai", "uu dai", "giam gia", "km"),
        "According to the promotions knowledge base, new shoppers and high-intent buyers are strong candidates "
        "for vouchers, accessory bundles, and membership incentives."
    ),
    (
        ("combo", "setup", "lam viec tai nha", "workstation", "bundle", "work-from-home"),
        "According to the upsell playbook, a work-from-home bundle usually includes a keyboard, mouse, headphones, "
        "and a laptop stand to increase cart value and conversion."
    ),
    (
        ("bao hanh", "doi tra", "chinh sach"),
        "The policy knowledge base recommends explaining warranty, returns, and after-sales service clearly "
        "to increase customer trust."
    ),
    (
        ("promotion", "discount", "deal", "voucher"),
        "According to the promotions knowledge base, new shoppers and high-intent buyers are strong candidates "
        "for vouchers, accessory bundles, and membership incentives."
    ),
    (
        ("warranty", "returns", "policy"),
        "The policy knowledge base recommends explaining warranty, returns, and after-sales service clearly "
        "to increase customer trust."
    ),
]

DEFAULT_RESPONSE = (
    "I found relevant information in the knowledge base, but the request does not map clearly to a single product yet. "
    "You can mention a product name, category, or advisory goal for a more targeted answer."
)


def build_response(query):
    normalized_query = normalize_text(query)

    for product_name, answer in PRODUCT_KNOWLEDGE.items():
        if product_name in normalized_query:
            return answer

    for category_name, answer in CATEGORY_KNOWLEDGE.items():
        if category_name in normalized_query:
            return answer

    for keywords, answer in POLICY_KNOWLEDGE:
        if any(keyword in normalized_query for keyword in keywords):
            return answer

    return f"{DEFAULT_RESPONSE} Truy van hien tai: {query}"


def normalize_text(value):
    normalized = unicodedata.normalize("NFD", str(value).lower())
    without_accents = "".join(char for char in normalized if unicodedata.category(char) != "Mn")
    return " ".join(without_accents.replace("đ", "d").split())


class ChatAPIView(APIView):
    def post(self, request):
        query = request.data.get("query", "").strip()
        time.sleep(0.3)

        if not query:
            return Response({"response": "Please enter a question or advisory request."}, status=400)

        return Response({"response": build_response(query)})
