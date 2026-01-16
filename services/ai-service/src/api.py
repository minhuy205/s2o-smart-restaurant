import os
import time
from flask import Flask, jsonify, request
import requests
import google.generativeai as genai
from google.generativeai.types import FunctionDeclaration, Tool

app = Flask(__name__)

# --- CẤU HÌNH ---
GOOGLE_API_KEY = "AIzaSyBPRBpeIfSLK_LpT-B8GY-Jpfbv6BcZflE"
MENU_SERVICE_URL = "http://menu-service:8080/api/menu" 
ORDER_SERVICE_URL = "http://order-payment-service:8080/api/orders"

genai.configure(api_key=GOOGLE_API_KEY)

# Danh sách model (ưu tiên bản Lite và bản Latest)
MODEL_POOL = ['models/gemini-flash-latest', 'models/gemini-2.0-flash-lite', 'models/gemini-1.5-flash']

restaurant_tools = Tool(
    function_declarations=[
        FunctionDeclaration(name="get_menu", description="Lấy menu", parameters={"type": "object", "properties": {"q": {"type": "string"}}}),
        FunctionDeclaration(name="check_order_status", description="Check đơn", parameters={"type": "object", "properties": {"order_id": {"type": "integer"}}, "required": ["order_id"]}),
        FunctionDeclaration(name="place_order_intent", description="Đặt món", parameters={"type": "object", "properties": {"item_name": {"type": "string"}}, "required": ["item_name"]})
    ]
)

SYSTEM_PROMPT = "Bạn là nhân viên S2O. Ngắn gọn 👨‍🍳."

@app.route("/")
def index():
    return jsonify({"service": "AI Service (Hybrid + Suggestions)", "status": "Ready"})

@app.route("/chat", methods=["POST"])
def chat():
    data = request.json or {}
    user_message = data.get("message", "")
    context = data.get("context", {})
    tenant_id = context.get("tenant_id", 1)
    
    # 1. THỬ DÙNG AI
    ai_response = try_use_ai(user_message, tenant_id, context)
    if ai_response:
        return jsonify({"type": "text", "reply": ai_response})
    
    # 2. DÙNG FALLBACK (NẾU AI LỖI HOẶC HẾT QUOTA)
    print("⚠️ Fallback Mode Activated", flush=True)
    fallback_msg = manual_fallback_logic(user_message, tenant_id)
    return jsonify({"type": "text", "reply": fallback_msg})

# --- AI LOGIC ---
def try_use_ai(user_message, tenant_id, context):
    for model_name in MODEL_POOL:
        try:
            model = genai.GenerativeModel(model_name=model_name, tools=[restaurant_tools])
            chat = model.start_chat(enable_automatic_function_calling=False)
            response = chat.send_message(f"{SYSTEM_PROMPT}\nKhách: {user_message}")
            
            if not response.candidates: return None
            part = response.candidates[0].content.parts[0]
            
            fc = None
            if hasattr(part, 'function_call') and part.function_call:
                fc = part.function_call
            
            if fc:
                fn = fc.name
                args = fc.args
                if fn == "get_menu":
                    menu = fetch_menu(tenant_id)
                    # Xử lý Best Seller nếu AI nhận diện được ý định
                    if "bán chạy" in user_message.lower() or "best" in user_message.lower():
                        return "🌟 Món Best Seller của quán là: Cơm Tấm Sườn và Trà Đào ạ! Bạn dùng thử nhé? 👨‍🍳"
                    
                    res2 = chat.send_message({"parts": [{"function_response": {"name": "get_menu", "response": {"menu": menu}}}]})
                    return safe_text(res2)
                
                elif fn == "place_order_intent":
                    item_name = args.get("item_name")
                    item = find_item(tenant_id, item_name)
                    if item: return f"Xác nhận gọi {item['name']} ({item['price']}đ) nhé? 👨‍🍳"
                    return f"Không tìm thấy món {item_name} ạ."
            
            return safe_text(response)
        except: continue
    return None

# --- FALLBACK LOGIC (LOGIC THỦ CÔNG) ---
def manual_fallback_logic(msg, tid):
    msg = msg.lower()
    
    # 1. Logic cho nút "Món bán chạy"
    if "bán chạy" in msg or "best" in msg or "hot" in msg:
        return "🔥 TOP Món Bán Chạy Nhất S2O:\n1. Cơm Tấm Sườn (60k) 🍖\n2. Trà Đào (35k) 🍹\nBạn muốn gọi món nào ạ?"

    # 2. Logic cho nút "Gọi món"
    if "gọi món" in msg or "đặt món" in msg:
        return "👨‍🍳 Dạ bạn muốn ăn gì ạ? Bạn có thể nhắn tên món (ví dụ: '1 cơm tấm') để mình lên đơn nhé!"

    # 3. Logic cho nút "Xem menu"
    if "menu" in msg or "thực đơn" in msg or "xem" in msg:
        items = fetch_menu(tid)
        if not items: return "Hiện tại chưa lấy được menu ạ."
        text = "📜 Menu hôm nay:\n" + "\n".join([f"- {i['name']}: {i['price']}đ" for i in items])
        return text

    # 4. Tìm món cụ thể
    items = fetch_menu(tid)
    found = [i for i in items if i['name'].lower() in msg]
    if found:
        return "\n".join([f"✅ Món {i['name']} giá {i['price']}đ ạ." for i in found])

    return "👨‍🍳 Bạn muốn xem Menu, Gọi món hay xem Món bán chạy ạ?"

# --- HELPERS ---
def safe_text(resp):
    try: return resp.text
    except: return "👨‍🍳 (Xong)"

def fetch_menu(tid):
    try:
        r = requests.get(f"{MENU_SERVICE_URL}?tenantId={tid}", timeout=2)
        return [{"name": m['name'], "price": m['price']} for m in r.json() if m.get('isAvailable')] if r.ok else []
    except: return []

def find_item(tid, q):
    try:
        items = fetch_menu(tid)
        for i in items:
            if q.lower() in i['name'].lower(): return i
    except: pass
    return None

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)