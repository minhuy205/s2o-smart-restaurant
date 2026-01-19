import os
import time
import requests
import google.generativeai as genai
from flask import Flask, jsonify, request
from google.generativeai.types import FunctionDeclaration, Tool

app = Flask(__name__)

# --- CẤU HÌNH ---
GOOGLE_API_KEY = "AIzaSyBPRBpeIfSLK_LpT-B8GY-Jpfbv6BcZflE"
MENU_SERVICE_URL = "http://menu-service:8080/api/menu" 
ORDER_SERVICE_URL = "http://order-payment-service:8080/api/orders"

genai.configure(api_key=GOOGLE_API_KEY)

# Bộ nhớ phiên chat
CHAT_SESSIONS = {}

MODEL_POOL = [
    'models/gemini-1.5-flash',
    'models/gemini-2.0-flash-lite',
    'models/gemini-1.5-pro'
]

# --- TOOLS ---
restaurant_tools = Tool(
    function_declarations=[
        FunctionDeclaration(
            name="get_menu",
            description="Lấy danh sách món ăn và giá tiền.",
            parameters={"type": "object", "properties": {"category": {"type": "string"}}}
        ),
        FunctionDeclaration(
            name="check_order_status",
            description="Kiểm tra trạng thái đơn hàng.",
            parameters={"type": "object", "properties": {"order_id": {"type": "integer"}}, "required": ["order_id"]}
        ),
        FunctionDeclaration(
            name="place_order_intent",
            description="Tìm thông tin món ăn để xác nhận đơn đặt hàng cho khách.",
            parameters={"type": "object", "properties": {"item_name": {"type": "string"}}, "required": ["item_name"]}
        )
    ]
)

# --- SYSTEM PROMPT (QUAN TRỌNG: Đã cập nhật kịch bản chốt đơn) ---
SYSTEM_PROMPT = """
Bạn là nhân viên phục vụ S2O. Phong cách: Nhanh nhẹn, thân thiện, dùng emoji 👨‍🍳.

QUY TRÌNH XỬ LÝ:
1. Nếu khách hỏi Menu/Giá: Gọi 'get_menu' -> Trả lời danh sách món kèm giá.
2. Nếu khách muốn ĐẶT MÓN (VD: "cho 1 cơm tấm", "lấy trà đào"):
   - Bước 1: Gọi 'place_order_intent' để lấy thông tin món.
   - Bước 2: Sau khi có thông tin món, HỎI XÁC NHẬN: "Bạn chốt [Tên món] giá [Giá tiền] đúng không ạ?".
3. Nếu khách đồng ý ("ok", "chốt", "đúng rồi"):
   - Trả lời: "Dạ, mình đã lên đơn [Tên món] cho bạn rồi ạ! Vui lòng đợi chút nhé 👨‍🍳".
   - (Lưu ý: Không cần gọi tool nữa, chỉ cần xác nhận bằng lời).
4. Khách hỏi tình trạng đơn: Gọi 'check_order_status'.
"""

@app.route("/")
def index():
    return jsonify({"service": "AI Service (Order Logic Fixed)", "status": "Ready"})

@app.route("/chat", methods=["POST"])
def chat():
    data = request.json or {}
    user_message = data.get("message", "")
    context = data.get("context", {})
    tenant_id = context.get("tenant_id", 1)
    
    user_id = data.get("user_id") or request.remote_addr
    session_key = f"{tenant_id}_{user_id}"

    print(f"🔹 [{session_key}] Khách: {user_message}", flush=True)

    # 1. Gọi AI
    ai_response = try_use_ai_robust(user_message, tenant_id, session_key)
    if ai_response:
        return jsonify({"type": "text", "reply": ai_response})
    
    # 2. Fallback
    print("⚠️ Fallback activated", flush=True)
    return jsonify({"type": "text", "reply": manual_fallback_logic(user_message, tenant_id)})

# --- AI ENGINE ---
def try_use_ai_robust(user_message, tenant_id, session_key):
    global CHAT_SESSIONS
    
    for attempt in range(2):
        try:
            # Nếu attempt > 0 (tức là lần 1 lỗi), ép tạo session mới
            chat_session = get_or_create_session(session_key, force_new=(attempt > 0))
            if not chat_session: continue

            response = chat_session.send_message(f"{SYSTEM_PROMPT}\nKhách: {user_message}")
            if not response.candidates: continue

            part = response.candidates[0].content.parts[0]

            # Xử lý Tool Call
            if hasattr(part, 'function_call') and part.function_call:
                fc = part.function_call
                fn_name = fc.name
                fn_args = fc.args
                
                print(f"🛠️ Tool: {fn_name} | Args: {fn_args}", flush=True)
                
                api_result = None
                if fn_name == "get_menu":
                    api_result = {"menu": fetch_menu(tenant_id)}
                
                elif fn_name == "check_order_status":
                    api_result = fetch_order_status(int(fn_args.get("order_id", 0)))
                
                elif fn_name == "place_order_intent":
                    # Tìm món ăn để trả về cho AI xác nhận giá
                    item_name = fn_args.get("item_name", "")
                    item = find_item(tenant_id, item_name)
                    if item:
                        api_result = {
                            "status": "found", 
                            "item_details": item, 
                            "instruction": "Hãy hỏi khách xác nhận đặt món này với giá trên."
                        }
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

# --- API HELPERS ---
def safe_text(resp):
    try: return resp.text.strip()
    except: return None

def fetch_menu(tid):
    try:
        r = requests.get(f"{MENU_SERVICE_URL}?tenantId={tid}", timeout=2)
        return [{"name": m['name'], "price": m['price']} for m in r.json() if m.get('isAvailable')] if r.ok else []
    except: return []

def find_item(tid, query_name):
    items = fetch_menu(tid)
    query_name = query_name.lower()
    for item in items:
        if query_name in item['name'].lower(): return item
    return None

def fetch_order_status(order_id):
    try:
        r = requests.get(f"{ORDER_SERVICE_URL}/{order_id}", timeout=2)
        return r.json() if r.ok else {"status": "not_found"}
    except: return {"error": "connection_error"}

# --- FALLBACK LOGIC ---
def manual_fallback_logic(msg, tid):
    msg = msg.lower()
    
    # Logic đặt món (Fallback)
    if "đặt" in msg or "lấy" in msg or "gọi" in msg:
        items = fetch_menu(tid)
        # Tìm món trong câu nói của khách
        found = [i for i in items if i['name'].lower() in msg]
        if found:
            item = found[0]
            # Giả lập xác nhận
            return f"👨‍🍳 Bạn chốt gọi món {item['name']} ({item['price']}đ) đúng không ạ?"
        return "👨‍🍳 Bạn muốn gọi món gì ạ? Nhắn tên món cụ thể nhé!"
        
    if "đúng" in msg or "ok" in msg or "chốt" in msg:
        return "👨‍🍳 Dạ đã lên đơn thành công! Cảm ơn quý khách."

    if "menu" in msg:
        items = fetch_menu(tid)
        if not items: return "👨‍🍳 Menu đang cập nhật ạ."
        return "📜 Menu:\n" + "\n".join([f"- {i['name']}: {i['price']}đ" for i in items])

    return "👨‍🍳 Bạn cần giúp gì ạ? (Xem menu, Gọi món...)"

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)