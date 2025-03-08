from flask import Flask, jsonify
# from flask_socketio import SocketIO
import functions

app = Flask(__name__)

@app.route("/")
def home():
    return "hello, world"

@app.route("/start-simulation")
def start_simulation():
    functions.start_simulation()
    return jsonify({"Response": "Simulation started"})











if __name__=="__main__":
   app.run(host='0.0.0.0', port=8080, debug=True, threaded=True)
