# CyberLenseAI — Project Progress Report
**Date:** September 2026  
**Project Type:** Final Year Engineering Project (S.G.P - 2026)  
**University:** Charusat University  

---

## What is CyberLenseAI?

CyberLenseAI is a full-stack AI-powered network forensics and threat detection platform. It allows cybersecurity investigators to upload PCAP (network capture) files, analyze network traffic, detect threats using both heuristic rules and a trained Machine Learning model, and generate PDF investigation reports — all through a modern web interface.

---

## Project Structure

The project is divided into 3 completely separate folders:

```
CyberLenseAI/
├── frontend/       → React + Vite web application (UI)
├── backend/        → Flask REST API (Python)
└── ml/             → Machine Learning pipeline (Python)
```

---

## 1. FRONTEND (React + Vite + TailwindCSS)

### Tech Stack
- React 19, React Router DOM v7
- Vite 8 (build tool)
- TailwindCSS 3 (styling)
- Recharts (data visualization)
- Lucide React (icons)
- React Dropzone (file upload)

### Pages Completed
| Page | Description |
|------|-------------|
| Login | JWT-based login with token stored in localStorage |
| Signup | User registration |
| Dashboard | Stats overview — total cases, active cases, total PCAPs, recent investigations |
| Investigations | List all investigations/cases with status badges |
| Create Investigation | Form to create a new investigation case |
| Case Details | View individual case with PCAP files and analysis summary |
| Upload PCAP | Drag & drop PCAP file uploader linked to a case, shows previously uploaded files |
| Packet Analysis | Visual analysis — packet timeline chart, protocol pie chart, ML flow results table, top IPs |
| Threat Detection | ML + heuristic threat table with severity filters, confidence bars, pagination |
| Reports | Generate and download PDF investigation reports |
| Investigation Timeline | Timeline view of case events |
| Evidence | Evidence management page |
| Settings | User settings page |

### UI Components Built
- Button, Badge, Card, Modal, Pagination, StatCard
- Layout with Sidebar and Topbar
- Fully responsive design

### API Integration
- All pages connected to the Flask backend via a centralized `api.js` service
- JWT token automatically attached to every request
- Auto session clear on 401 Unauthorized

---

## 2. BACKEND (Flask REST API)

### Tech Stack
- Flask 3, Flask-SQLAlchemy, Flask-JWT-Extended
- Flask-CORS, Flask-Bcrypt
- SQLite database (via SQLAlchemy ORM)
- Scapy (PCAP parsing)
- ReportLab (PDF generation)
- Python-dotenv

### Database Models
| Model | Purpose |
|-------|---------|
| User | Stores registered users with hashed passwords |
| Case | Investigation cases created by users |
| PCAPFile | Uploaded PCAP files linked to cases |
| AnalysisReport | Full analysis results including ML fields |
| FinalReport | Generated PDF report metadata |
| APIKey | API key management |
| Admin | Admin user model |

### API Endpoints Completed
| Route | Method | Description |
|-------|--------|-------------|
| /api/v1/auth/register | POST | User registration |
| /api/v1/auth/login | POST | Login, returns JWT token |
| /api/v1/cases/ | GET | List all cases for logged-in user |
| /api/v1/cases/ | POST | Create new investigation case |
| /api/v1/cases/:id | GET | Get case details with PCAP files |
| /api/v1/cases/:id | PATCH | Update case title/status |
| /api/v1/cases/:id | DELETE | Delete a case |
| /api/v1/cases/stats/dashboard | GET | Dashboard statistics |
| /api/v1/cases/:id/analysis | GET | Full analysis report for a case |
| /api/v1/cases/:id/stats | GET | Summary stats for a case |
| /api/v1/pcap/upload | POST | Upload a PCAP file to a case |
| /api/v1/pcap/:id/status | GET | Check PCAP parse status |
| /api/v1/cases/:id/report/generate | POST | Generate PDF report |
| /api/v1/health | GET | Health check |

### Services Completed
- **pcap_parser.py** — Parses uploaded PCAP files using Scapy in a background thread. Extracts packet counts, protocols, source/destination IPs, packet sizes, timeline, and runs both heuristic and ML threat detection.
- **threat_engine.py** — Heuristic-based threat detection (port scans, SYN floods, DNS anomalies, etc.)
- **report_generator.py** — Generates PDF investigation reports using ReportLab

### Background Processing
- PCAP files are parsed asynchronously in a background thread so the upload API returns immediately
- Parse status tracked as: `pending → processing → done / failed`

---

## 3. ML (Machine Learning Pipeline)

### Tech Stack
- scikit-learn (Random Forest Classifier)
- Pandas, NumPy
- Scapy (live packet feature extraction)
- Joblib (model serialization)
- Matplotlib + Seaborn (evaluation plots)

### Dataset
- **CIC-IDS2017** (Canadian Institute for Cybersecurity Intrusion Detection System 2017)
- 8 CSV files covering Monday–Friday working hours traffic
- Contains both BENIGN and attack traffic (DDoS, PortScan, Web Attacks, Infiltration, etc.)
- Total training samples: ~2.8 million rows

### ML Pipeline Components
| File | Purpose |
|------|---------|
| dataset/loader.py | Loads and combines CIC-IDS2017 CSV files, maps labels to binary |
| preprocessing/preprocessing.py | Cleans data, verifies feature schema, handles NaN/Inf, stratified split |
| packet_features/feature_extractor.py | Extracts bidirectional flow features from live Scapy packets |
| train_model.py | Full training pipeline — load → preprocess → train → evaluate → save |
| evaluate_model.py | Standalone evaluation with confusion matrix plot and JSON metrics |
| predict.py | ThreatPredictor singleton class used by backend at runtime |

### Feature Schema (10 Features)
```
Destination Port, Flow Duration, Total Fwd Packets, Total Backward Packets,
Total Length of Fwd Packets, Total Length of Bwd Packets,
Flow Bytes/s, Flow Packets/s, Packet Length Mean, Packet Length Std
```

### Model Performance (Trained & Evaluated with Time-Based Split)
| Metric | Score | Notes |
|--------|-------|-------|
| Accuracy | 96.61% | Realistic temporal generalization |
| Balanced Accuracy | 79.62% | More honest score for imbalanced normal-vs-attack traffic |
| Precision | 98.63% | High fidelity alert precision (very low false alarms) |
| Recall | 59.31% | Realistic detection of complex zero-days / infiltration |
| F1-Score | 74.08% | Balanced real-world operational F1 |
| Total Test Samples | 79,938 | Held-out contiguous temporal partition |
| True Negatives | 73,349 | Correctly classified normal flows |
| True Positives | 3,876 | Correctly detected attack flows |
| False Positives | 54 | Minimal false alarms (0.07% FP rate) |
| False Negatives | 2,659 | Sophisticated evasion attempts |

Confusion matrix used for the updated evaluation:

| Actual \ Predicted | Normal | Malicious |
|--------------------|--------|-----------|
| Normal | 73,349 | 54 |
| Malicious | 2,659 | 3,876 |

### Model Artifacts Saved
- `ml/models/random_forest.pkl` — Trained Random Forest model
- `ml/models/feature_columns.pkl` — Feature schema for inference validation
- `ml/results/model_metrics.json` — Evaluation metrics
- `ml/results/confusion_matrix.png` — Confusion matrix heatmap

### How ML Integrates with Backend
1. User uploads a PCAP file via the frontend
2. Backend saves the file and starts a background thread
3. Scapy reads the PCAP and groups packets into bidirectional 5-tuple network flows
4. `feature_extractor.py` computes 10 statistical features per flow
5. `ThreatPredictor` loads the trained Random Forest model and runs predictions
6. Each flow is classified as Normal (0) or Malicious (1) with a confidence score
7. Results are stored in the `AnalysisReport` database table
8. Frontend displays results in Packet Analysis and Threat Detection pages

---

## Testing
- pytest test suite in `backend/tests/`
- Tests cover: auth, cases, PCAP upload, ML pipeline, end-to-end pipeline

---

## What is NOT Done Yet (Pending)
- Evidence page (UI exists but not fully connected to backend)
- Investigation Timeline (UI exists, backend integration pending)
- Settings page (UI exists, password change / profile update not implemented)
- Admin panel (model exists, no admin routes/UI)
- API Key management (model exists, no routes/UI)
- Real-time WebSocket notifications for PCAP parse completion
- Deployment (currently runs only locally)

---

## How to Run

### Backend
```cmd
cd backend
python run.py
```
Runs at: http://127.0.0.1:5000

### Frontend
```cmd
cd frontend
npm install
npm run dev
```
Runs at: http://localhost:5173

### ML Training (one-time)
```cmd
cd CyberLenseAI  (project root)
python -m ml.train_model --dataset-dir ml/dataset/
```
