import json
import os
from flask import Flask, jsonify, render_template, abort

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_PATH = os.path.join(BASE_DIR, "data", "regulations.json")
PG_DATA_PATH = os.path.join(BASE_DIR, "data", "pg_regulations.json")

app = Flask(__name__)


@app.context_processor
def static_version():
    """Adds ?v=<file time> to CSS/JS links so browsers always load the latest
    version after an update instead of an old cached copy."""
    def asset(filename):
        path = os.path.join(BASE_DIR, "static", filename)
        try:
            v = int(os.path.getmtime(path))
        except OSError:
            v = 0
        return f"/static/{filename}?v={v}"
    return {"asset": asset}


def load_data():
    with open(DATA_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


@app.route("/")
def index():
    data = load_data()
    years = sorted(data["years"].keys(), reverse=True)
    return render_template("index.html", years=years, source_document=data.get("source_document", ""))


@app.route("/api/years")
def api_years():
    data = load_data()
    years = sorted(data["years"].keys(), reverse=True)
    return jsonify({"years": years})


@app.route("/api/regulations/<year>")
def api_regulations(year):
    data = load_data()
    record = data["years"].get(year)
    if record is None:
        abort(404, description=f"No regulation data found for admission year {year}")
    return jsonify(record)


@app.route("/api/general")
def api_general():
    data = load_data()
    record = data.get("general_regulations")
    if record is None:
        abort(404, description="No general (cross-batch) regulation data found")
    return jsonify(record)


@app.route("/api/pg/general")
def api_pg_general():
    if not os.path.exists(PG_DATA_PATH):
        abort(404, description="No PG regulation data found")
    with open(PG_DATA_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)
    record = data.get("general_regulations")
    if record is None:
        abort(404, description="No PG general regulation data found")
    return jsonify(record)


@app.errorhandler(404)
def not_found(e):
    return jsonify({"error": str(e)}), 404


if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)
