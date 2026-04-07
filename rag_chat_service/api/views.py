import time
import unicodedata

from rest_framework.response import Response
from rest_framework.views import APIView


PRODUCT_KNOWLEDGE = {
    "tai nghe sony wh-1000xm5": (
        "Tai nghe Sony WH-1000XM5 phù hợp với nhu cầu nghe nhạc, làm việc tập trung "
        "va di chuyen nhieu nho kha nang chong on chu dong. Knowledge base khuyen nghi "
        "nhom khach hang yeu cau audio premium co the ket hop them goi bao hanh va uu dai thanh vien."
    ),
    "ban phim co keychron q1": (
        "Ban phim co Keychron Q1 phu hop voi nguoi dung can trai nghiem go phim chat luong cao, "
        "co the tuy bien va dung tot cho setup lam viec hoac lap trinh. Knowledge base de xuat "
        "upsell cung chuot cong thai hoc hoac gia do laptop de tao combo phu kien."
    ),
    "chuot logitech mx master 3s": (
        "Logitech MX Master 3S la lua chon hop ly cho nhom nguoi dung van phong va sang tao noi dung "
        "nhan manh vao su thoai mai, da thiet bi va nang suat. Knowledge base uu tien goi y san pham nay "
        "trong cac combo lam viec tai nha."
    ),
    "man hinh lg ultragear 27": (
        "Man hinh LG UltraGear 27 phu hop voi khach hang muon nang cap goc lam viec hoac giai tri "
        "voi khong gian hien thi rong. Knowledge base de xuat ket hop voi laptop stand va chuot khong day."
    ),
}

CATEGORY_KNOWLEDGE = {
    "thiet bi am thanh": (
        "Nhom thiet bi am thanh phu hop voi khach hang uu tien trai nghiem nghe nhac, hop truc tuyen "
        "va khong gian lam viec yen tinh. He thong uu tien goi y cac san pham co chong on, microphone ro "
        "va goi bao hanh mo rong."
    ),
    "phu kien": (
        "Danh muc phu kien thuong phu hop voi chien luoc ban kem. Knowledge base de xuat tu van theo combo "
        "ban phim, chuot, gia do laptop va cac san pham nang cao hieu suat lam viec."
    ),
    "laptop": (
        "Danh muc laptop phu hop voi nhom khach hang co gia tri don hang cao. He thong thuong tu van kem "
        "bao ve thiet bi, phu kien ket noi va goi ho tro sau ban."
    ),
}

POLICY_KNOWLEDGE = [
    (
        ("khuyen mai", "uu dai", "giam gia", "km"),
        "Theo knowledge base khuyen mai, nhom khach hang moi va nhom co y dinh mua cao thuong duoc uu tien "
        "goi y voucher, combo phu kien va uu dai thanh vien."
    ),
    (
        ("combo", "setup", "lam viec tai nha", "workstation"),
        "Theo playbook upsell, combo lam viec tai nha thuong gom ban phim, chuot, tai nghe va gia do laptop "
        "de tang gia tri don hang va kha nang chuyen doi."
    ),
    (
        ("bao hanh", "doi tra", "chinh sach"),
        "Knowledge base chinh sach khuyen nghi tu van ro ve bao hanh, doi tra va dich vu sau ban "
        "de tang muc do tin cay cua khach hang."
    ),
]

DEFAULT_RESPONSE = (
    "Toi da tim thay thong tin trong knowledge base, nhung cau hoi nay chua match ro voi mot san pham cu the. "
    "Ban co the neu ten san pham, danh muc hoac muc tieu tu van de toi tra loi sat hon."
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
            return Response({"response": "Ban hay nhap noi dung can tu van."}, status=400)

        return Response({"response": build_response(query)})
