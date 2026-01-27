# services/ai-service/src/api.py
import os
import time
import requests
import google.generativeai as genai
from flask import Flask, jsonify, request
from google.generativeai.types import FunctionDeclaration, Tool

app = Flask(_name_)

# --- CẤU HÌNH ---
GOOGLE_API_KEY = "AIzaSyBPRBpeIfSLK_LpT-B8GY-Jpfbv6BcZflE" # Đảm bảo API Key chính xác
MENU_SERVICE_URL = "http://menu-service:8080/api/menu" 
ORDER_SERVICE_URL = "http://order-payment-service:8080/api/orders"

genai.configure(api_key=GOOGLE_API_KEY)

CHAT_SESSIONS = {}
MODEL_POOL = [
    'models/gemini-1.5-flash',
    'models/gemini-2.0-flash-lite',
    'models/gemini-1.5-pro'
]

# --- TỪ KHÓA ĐỒ UỐNG ---
DRINK_KEYWORDS = [
    "trà", "tea", "cà phê", "coffee", "cafe", "nước", "water", 
    "soda", "coke", "coca", "pepsi", "7up", "bia", "beer", 
    "rượu", "wine", "sinh tố", "juice", "latte", "mocha", "ép", "sữa", "milk"
]

def is_drink(item):
    text = (item.get('name', '') + " " + item.get('description', '')).lower()
    return any(k in text for k in DRINK_KEYWORDS)

# --- TOOLS ĐỊNH NGHĨA CHO AI ---
restaurant_tools = Tool(
    function_declarations=[
        FunctionDeclaration(
            name="get_menu_filtered",
            description="Lấy danh sách món ăn theo trạng thái hoặc loại cụ thể.",
            parameters={
                "type": "object", 
                "properties": {
                    "filter_type": {
                        "type": "string", 
                        "enum": [
                            "all",          # Tất cả
                            "available",    # Đang bán (Available + BestSeller + Promo)
                            "coming_soon",  # Sắp có mặt
                            "out_of_stock", # Hết hàng
                            "best_seller",  # Bán chạy
                            "promo",        # Khuyến mãi
                            "drink",        # Đồ uống
                            "food"          # Đồ ăn
                        ],
                        "description": "Loại bộ lọc cần dùng dựa trên câu hỏi của khách."
                    }
                },
                "required": ["filter_type"]
            }
        ),
        FunctionDeclaration(
            name="check_order_status",
            description="Kiểm tra trạng thái đơn hàng.",
            parameters={"type": "object", "properties": {"order_id": {"type": "integer"}}, "required": ["order_id"]}
        ),
        FunctionDeclaration(
            name="place_order_intent",
            description="Tìm thông tin món ăn để xác nhận đơn đặt hàng.",
            parameters={"type": "object", "properties": {"item_name": {"type": "string"}}, "required": ["item_name"]}
        )
    ]
)

# --- SYSTEM PROMPT (Cập nhật: Thêm phần xử lý thông tin quán) ---
SYSTEM_PROMPT = """
Bạn là nhân viên phục vụ S2O (Smart Restaurant). Phong cách: Nhanh nhẹn, thân thiện, dùng emoji 👨‍🍳.

QUY TRÌNH XỬ LÝ:
1. *Thông tin quán (Tên, Địa chỉ)*:
   - Trả lời dựa trên "THÔNG TIN BỐI CẢNH" được cung cấp. Nếu không có thông tin, hãy báo đang cập nhật.

2. **Phân loại câu hỏi để gọi tool get_menu_filtered**:
   - Hỏi "Sắp có mặt", "Sắp ra mắt", "Món mới sắp về" -> filter_type="coming_soon"
   - Hỏi "Hết hàng", "Hết món" -> filter_type="out_of_stock"
   - Hỏi "Đang bán", "Có những món nào ăn được", "Thực đơn hiện tại" -> filter_type="available"
   - Hỏi "Menu chung", "Xem thực đơn" -> filter_type="all"
   - Hỏi "Nước", "Uống" -> filter_type="drink"
   - Hỏi "Bán chạy", "Hot" -> filter_type="best_seller"
   - Hỏi "Khuyến mãi" -> filter_type="promo"

3. *Trả lời khách*:
   - Dựa vào kết quả trả về để liệt kê.
   - Nếu danh sách trống, hãy báo lịch sự (VD: "Dạ hiện chưa có món nào sắp ra mắt ạ").

4. *Đặt món & Kiểm tra đơn*:
   - Quy trình giữ nguyên: Gọi place_order_intent -> Hỏi xác nhận -> Chốt đơn.
"""

@app.route("/")
def index():
    return jsonify({"service": "AI Service (Added Address Support)", "status": "Ready"})

@app.route("/chat", methods=["POST"])
def chat():
    data = request.json or {}
    user_message = data.get("message", "")
    context = data.get("context", {}) # Lấy context (Tên, Địa chỉ) từ App
    tenant_id = context.get("tenant_id", 1)
    
    user_id = data.get("user_id") or request.remote_addr
    session_key = f"{tenant_id}_{user_id}"

    print(f"🔹 [{session_key}] Khách: {user_message}", flush=True)

    # 1. AI Logic (Truyền thêm context)
    ai_response = try_use_ai_robust(user_message, tenant_id, session_key, context)
    if ai_response:
        return jsonify({"type": "text", "reply": ai_response})
    
    # 2. Fallback Logic (Truyền thêm context)
    print("⚠️ Fallback activated", flush=True)
    return jsonify({"type": "text", "reply": manual_fallback_logic(user_message, tenant_id, context)})

# --- AI ENGINE ---
def try_use_ai_robust(user_message, tenant_id, session_key, context):
    global CHAT_SESSIONS
    
    # Bơm thông tin quán vào Prompt
    restaurant_info = f"""
    --- THÔNG TIN BỐI CẢNH ---
    Tên nhà hàng: {context.get('restaurant_name', 'S2O Restaurant')}
    Địa chỉ: {context.get('address', 'Đang cập nhật')}
    --------------------------
    """
    
    for attempt in range(2):
        try:
            chat_session = get_or_create_session(session_key, force_new=(attempt > 0))
            if not chat_session: continue

            # Gửi Prompt kèm thông tin quán
            response = chat_session.send_message(f"{SYSTEM_PROMPT}\n{restaurant_info}\nKhách: {user_message}")
            if not response.candidates: continue

            part = response.candidates[0].content.parts[0]

            if hasattr(part, 'function_call') and part.function_call:
                fc = part.function_call
                fn_name = fc.name
                fn_args = fc.args
                
                print(f"🛠️ Tool: {fn_name} | Args: {fn_args}", flush=True)
                
                api_result = None
                
                if fn_name == "get_menu_filtered":
                    f_type = fn_args.get("filter_type", "all")
                    items = fetch_menu_with_filter(tenant_id, f_type)
                    
                    if not items:
                        api_result = {"status": "empty", "message": f"Không có món nào thuộc nhóm '{f_type}'."}
                    else:
                        api_result = {"status": "success", "filter": f_type, "items": items}
                
                elif fn_name == "check_order_status":
                    api_result = fetch_order_status(int(fn_args.get("order_id", 0)))
                
                elif fn_name == "place_order_intent":
                    item_name = fn_args.get("item_name", "")
                    item = find_item(tenant_id, item_name)
                    if item:
                        status = item.get('status', 'Available')
                        if status in ['OutOfStock', 'ComingSoon']:
                            api_result = {
                                "status": "unavailable", 
                                "message": f"Món {item['name']} hiện đang {status} (Hết hàng/Sắp có), không thể đặt."
                            }
                        else:
                            api_result = {"status": "found", "item_details": item}
                    else:
                        api_result = {"status": "not_found", "message": f"Không tìm thấy món {item_name}"}

                if api_result:
                    res2 = chat_session.send_message(
                        {"parts": [{"function_response": {"name": fn_name, "response": api_result}}]}
                    )
                    return safe_text(res2)

            return safe_text(response)

        except Exception as e:
            print(f"❌ Error attempt {attempt}: {e}", flush=True)
            pass

    return None

def get_or_create_session(session_key, force_new=False):
    global CHAT_SESSIONS
    if not force_new and session_key in CHAT_SESSIONS:
        return CHAT_SESSIONS[session_key]
    
    for model_name in MODEL_POOL:
        try:
            model = genai.GenerativeModel(model_name=model_name, tools=[restaurant_tools])
            chat = model.start_chat(enable_automatic_function_calling=False)
            CHAT_SESSIONS[session_key] = chat
            return chat
        except: continue
    return None

# --- API HELPERS & FILTER LOGIC ---
def safe_text(resp):
    try: return resp.text.strip()
    except: return None

def fetch_menu_raw(tid):
    try:
        r = requests.get(f"{MENU_SERVICE_URL}?tenantId={tid}", timeout=2)
        if r.ok:
            return [{
                "name": m['name'], 
                "price": m['price'],
                "status": m.get('status', 'Available'), # Available, ComingSoon, OutOfStock, BestSeller, Promo
                "description": m.get('description', ''),
                "categoryId": m.get('categoryId')
            } for m in r.json()] 
        return []
    except: return []

def fetch_menu_with_filter(tid, filter_type):
    """Bộ lọc thông minh theo Status"""
    all_items = fetch_menu_raw(tid)
    
    ORDERABLE_STATUSES = ['Available', 'BestSeller', 'Promo']

    if filter_type == "all":
        return all_items
    
    if filter_type == "coming_soon":
        return [i for i in all_items if i.get('status') == 'ComingSoon']
    
    if filter_type == "out_of_stock":
        return [i for i in all_items if i.get('status') == 'OutOfStock']
    
    if filter_type == "available":
        return [i for i in all_items if i.get('status') in ORDERABLE_STATUSES]
    
    if filter_type == "best_seller":
        return [i for i in all_items if i.get('status') == 'BestSeller']
    
    if filter_type == "promo":
        return [i for i in all_items if i.get('status') == 'Promo']
    
    if filter_type == "drink":
        return [i for i in all_items if is_drink(i)]
    
    if filter_type == "food":
        return [i for i in all_items if not is_drink(i)]
        
    return all_items

def find_item(tid, query_name):
    items = fetch_menu_raw(tid)
    query_name = query_name.lower()
    for item in items:
        if query_name in item['name'].lower(): return item
    return None

def fetch_order_status(order_id):
    try:
        r = requests.get(f"{ORDER_SERVICE_URL}/{order_id}", timeout=2)
        return r.json() if r.ok else {"status": "not_found"}
    except: return {"error": "connection_error"}

# --- FALLBACK LOGIC (Thủ công) ---
def manual_fallback_logic(msg, tid, context):
    msg = msg.lower()
    
    # 0. [MỚI] Xử lý câu hỏi Địa chỉ/Tên quán
    if "địa chỉ" in msg or "ở đâu" in msg:
        addr = context.get('address', 'Đang cập nhật')
        return f"📍 Địa chỉ quán mình là: {addr} ạ."
    
    if "tên quán" in msg or "nhà hàng nào" in msg:
        name = context.get('restaurant_name', 'S2O Restaurant')
        return f"🏠 Dạ đây là nhà hàng {name} ạ."

    # 1. Hỏi món Sắp có
    if "sắp có" in msg or "sắp ra" in msg or "coming soon" in msg:
        items = fetch_menu_with_filter(tid, "coming_soon")
        if items:
            return "🔜 Các món sắp ra mắt:\n" + "\n".join([f"- {i['name']}" for i in items])
        return "👨‍🍳 Hiện chưa có thông tin món mới sắp ra mắt ạ."

    # 2. Hỏi món Hết hàng
    if "hết hàng" in msg or "hết món" in msg:
        items = fetch_menu_with_filter(tid, "out_of_stock")
        if items:
            return "🚫 Các món tạm hết hàng:\n" + "\n".join([f"- {i['name']}" for i in items])
        return "👨‍🍳 Tuyệt vời! Hiện tại quán đang đầy đủ nguyên liệu cho tất cả các món ạ."

    # 3. Hỏi món Đang bán
    if "đang bán" in msg or "còn món gì" in msg or "menu hiện tại" in msg:
        items = fetch_menu_with_filter(tid, "available")
        if items:
            return "✅ Thực đơn đang phục vụ:\n" + "\n".join([f"- {i['name']}: {i['price']}đ" for i in items])

    # 4. Các trường hợp cũ
    if any(k in msg for k in DRINK_KEYWORDS) or "uống" in msg:
        if "đặt" not in msg:
            items = fetch_menu_with_filter(tid, "drink")
            return "🍹 Menu đồ uống:\n" + "\n".join([f"- {i['name']}: {i['price']}đ" for i in items]) if items else "Chưa có đồ uống."

    if "best" in msg or "bán chạy" in msg:
        items = fetch_menu_with_filter(tid, "best_seller")
        return "🔥 Best Seller:\n" + "\n".join([f"- {i['name']}: {i['price']}đ" for i in items]) if items else "Chưa có món Best Seller."

    if "khuyến mãi" in msg or "giảm giá" in msg:
        items = fetch_menu_with_filter(tid, "promo")
        return "🎉 Khuyến mãi:\n" + "\n".join([f"- {i['name']}: {i['price']}đ" for i in items]) if items else "Chưa có khuyến mãi."

    if "menu" in msg:
        items = fetch_menu_with_filter(tid, "all")
        return "📜 Tất cả món ăn:\n" + "\n".join([f"- {i['name']} ({i['status']}): {i['price']}đ" for i in items])

    return "👨‍🍳 Bạn cần giúp gì ạ? (Menu, Sắp ra mắt, Hết hàng, Gọi món, Địa chỉ...)"

if _name_ == "_main_":
    app.run(host="0.0.0.0", port=5000)
