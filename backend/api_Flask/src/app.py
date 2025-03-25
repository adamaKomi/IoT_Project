from flask import Flask, jsonify

from resources.run_simulation import run_simulation

app = Flask(__name__)

@app.route("/")
def home():
    return "hello, world"

@app.route("/start-simulation")
def start_simulation():
    run_simulation()
    return jsonify({"Response": "Simulation started"})


if __name__=="__main__":
   app.run(host='0.0.0.0', port=5000, debug=True, threaded=True)
