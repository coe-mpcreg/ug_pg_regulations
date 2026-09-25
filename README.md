# Batch Regulation Ledger

A small local web app to look up UG batch-wise academic regulations by admission year (2019–2026).

Covers, per admission year:
1. Total Credits (Regular / Lateral Entry)
2. Last Permitted Examination Attempt
3. Grading Scale + Other/Special Grades
4. Class Declaration (CGPA bands, formula, min CGPA for degree)
5. Provision After Even Semester
6. Minimum CIE / SEE requirements

Plus a **General Regulations** panel (applicable across *all* batches, expand/collapse toggle above the year picker):
1. GMR — Grace Marks Rule (effective October 2024)
2. Activity Points (mandatory for degree, by student category)
3. CGPA to Percentage Conversion (by scheme group)

## PG (M.Tech / MCA)

The home page also has a **PG — M.Tech / MCA** option, which opens the
**PG General Regulations**: Total Credits, Last Attempt, CIE/SEE Passing Minimum
with GMR, Grades (2023 onwards) with other grades, and Class Declaration.

- Data: `data/pg_regulations.json` (from `PG_Regulations_Reference_Tables.docx`)
- API: `GET /api/pg/general`

Edit `data/pg_regulations.json` to update PG values, e.g. to add a new admission
year row to the credits or last-attempt table. No restart needed.

## Run locally

```bash
pip install -r requirements.txt
python app.py
```

Then open **http://127.0.0.1:5000** in your browser.

## Project structure

```
regapp/
├── app.py                  # Flask backend + API routes
├── data/
│   └── regulations.json    # Structured regulation data, keyed by admission year
├── templates/
│   └── index.html          # Main page
├── static/
│   ├── style.css
│   └── app.js               # Fetches data from /api/regulations/<year> and renders it
└── requirements.txt
```

## API

- `GET /api/years` → list of available admission years
- `GET /api/regulations/<year>` → full regulation record for that year
- `GET /api/general` → general regulations applicable across all batches (GMR, Activity Points, CGPA→Percentage conversion)

## Updating the data

Edit `data/regulations.json`. Each year is a top-level key ("2019".."2026") under `years`, with fields:
`admission_year`, `scheme`, `total_credits`, `last_attempt`, `grades`, `class_declaration`,
`provision_after_even_sem`, `min_cie_see`, `notes`.

The top-level `general_regulations` key holds the cross-batch data (`gmr`, `activity_points`,
`cgpa_to_percentage_conversion`) shown in the General Regulations panel.

No restart needed — the JSON file is re-read on every request.

## Data source & accuracy note

Extracted from `UG_Batch_Regulations_Consolidated_2018_Onwards.docx`. A few entries
(marked in `notes`) were inferred where the source document didn't give a fully
dedicated section for that batch (e.g. 2024 grading scale, 2026 as a whole — both
noted as "same as" the nearest fully-specified batch). Please cross-check these
against the original circulars before treating them as final.

## Turning this into a full web app later

This is already structured for that:
- Swap `data/regulations.json` for a real database (SQLite/Postgres) behind the same
  `/api/regulations/<year>` contract — the frontend doesn't need to change.
- Deploy `app.py` behind gunicorn + nginx, or on any platform that runs Flask apps.
