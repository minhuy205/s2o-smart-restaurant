from flask import Flask, jsonify, request
app = Flask(__name__)
@app.route("/")
def index():
    return jsonify({"service": "AI Service - S2O", "status": "ok"})
@app.route("/infer", methods=["POST"])
def infer():
    # placeholder for inference endpoint
    data = request.json or {}
    return jsonify({"result": "no-model", "input": data})
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
