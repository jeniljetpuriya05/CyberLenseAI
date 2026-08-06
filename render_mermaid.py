import os
import subprocess
import sys
from pathlib import Path
from docx import Document
from docx.shared import Inches, Pt
from docx.enum.text import WD_ALIGN_PARAGRAPH

WORKDIR = Path(r'c:\Users\jenil\OneDrive\Documents\Desktop\CyberLenseAI')
INPUT_DOCX = WORKDIR / 'CyberLens_AI_SRS.docx'
OUTPUT_DOCX = WORKDIR / 'CyberLens_AI_SRS_with_images.docx'
MERMAID_BIN = WORKDIR / 'node_modules' / '.bin' / 'mmdc.cmd' if os.name == 'nt' else WORKDIR / 'node_modules' / '.bin' / 'mmdc'

if not MERMAID_BIN.exists():
    raise SystemExit('Mermaid CLI binary not found. Please install mermaid-cli first.')

# A list of diagram snippets that were previously embedded as text in the document.
# We will replace them with actual image placeholders in the generated Word document.

diagrams = [
    ("Figure 5.1: Use Case Diagram", "graph TD\nA[Investigator] --> B[Login]\nA --> C[Create Investigation]\nA --> D[Upload PCAP]\nA --> E[Analyze Packets]\nA --> F[Manage Evidence]\nA --> G[Generate Report]\nB --> H[Authentication Service]\nC --> I[Case Management]\nD --> J[Packet Parsing]\nE --> K[Threat Detection]\nF --> L[Evidence Repository]\nG --> M[Reporting Module]"),
    ("Figure 5.2: Activity Diagram", "flowchart TD\nA[Start] --> B[Login]\nB --> C{Valid User?}\nC -- Yes --> D[Create/Select Case]\nC -- No --> E[Show Error]\nD --> F[Upload PCAP]\nF --> G[Parse Packets]\nG --> H[Analyze Traffic]\nH --> I[Detect Threats]\nI --> J[Record Evidence]\nJ --> K[Generate Report]\nK --> L[End]"),
    ("Figure 5.3: Sequence Diagram", "sequenceDiagram\nParticipant Investigator\nParticipant UI\nParticipant API\nParticipant AnalysisEngine\nParticipant Database\nInvestigator->>UI: Upload PCAP\nUI->>API: Send file\nAPI->>AnalysisEngine: Parse packets\nAnalysisEngine->>Database: Store metadata\nAnalysisEngine-->>API: Return results\nAPI-->>UI: Display summary\nUI-->>Investigator: Show analysis"),
    ("Figure 5.4: Class Diagram", "classDiagram\nclass User {+id +username +passwordHash +role}\nclass Case {+id +title +description +priority +status}\nclass Evidence {+id +caseId +type +description +timestamp}\nclass Threat {+id +caseId +severity +riskScore +details}\nclass Report {+id +caseId +generatedAt +path}\nclass Analysis {+id +caseId +packetCount +protocolSummary +riskScore}\nUser --> Case\nCase --> Evidence\nCase --> Threat\nCase --> Report\nCase --> Analysis"),
    ("Figure 5.5: State Diagram", "stateDiagram-v2\n[*] --> New\nNew --> InProgress : Upload PCAP\nInProgress --> Reviewed : Analyze packets\nReviewed --> Closed : Generate report\nReviewed --> InProgress : Add evidence\nClosed --> [*]"),
    ("Figure 5.6: Component Diagram", "graph LR\nA[React UI] --> B[Flask API]\nB --> C[Auth Module]\nB --> D[Case Module]\nB --> E[Packet Analysis Module]\nB --> F[Threat Detection Module]\nB --> G[Reporting Module]\nD --> H[SQLite DB]\nE --> H\nF --> H\nG --> H"),
    ("Figure 5.7: Deployment Diagram", "graph TD\nClient[Web Browser] --> Server[Flask Application Server]\nServer --> DB[SQLite Database]\nServer --> Parser[Scapy/PyShark Engine]\nServer --> ML[Scikit-learn Module]\nServer --> Report[Report Generator]"),
    ("Figure 6.1: ER Diagram", "erDiagram\nUSER ||--o{ CASE : creates\nCASE ||--o{ EVIDENCE : contains\nCASE ||--o{ THREAT : has\nCASE ||--o{ REPORT : generates\nCASE ||--o{ ANALYSIS : receives\nCASE ||--o{ TIMELINE : includes\nUSER { int id string username string role }\nCASE { int id int userId string title string status }\nEVIDENCE { int id int caseId string type string description }\nTHREAT { int id int caseId string severity float riskScore }\nREPORT { int id int caseId string reportPath datetime generatedAt }\nANALYSIS { int id int caseId int packetCount string protocolSummary float riskScore }\nTIMELINE { int id int caseId datetime timestamp string event }"),
    ("Figure 7.1: Context Diagram", "flowchart LR\nA[Investigator] --> B[CyberLens AI System]\nB --> C[Report Export]\nB --> D[Case Data Storage]"),
    ("Figure 7.2: DFD Level 0", "flowchart TD\nA[Investigator] --> B[1.0 Login and Case Management]\nA --> C[2.0 Upload and Parse Packets]\nA --> D[3.0 Analyze Threats]\nA --> E[4.0 Generate Reports]\nB --> F[User and Case Database]\nC --> F\nD --> F\nE --> F"),
    ("Figure 7.3: DFD Level 1", "flowchart TD\nA[2.0 Upload and Parse Packets] --> B[2.1 Validate File]\nA --> C[2.2 Parse Packets]\nA --> D[2.3 Extract Metadata]\nB --> E[Storage]\nC --> E\nD --> E"),
    ("Figure 7.4: DFD Level 2", "flowchart TD\nA[3.0 Analyze Threats] --> B[3.1 Detect Protocol Anomalies]\nA --> C[3.2 Score Risk]\nA --> D[3.3 Update Timeline]\nB --> E[Threat Repository]\nC --> E\nD --> E"),
    ("Figure 8.1: Overall System Architecture", "flowchart TB\nA[React Frontend] --> B[Flask Backend]\nB --> C[Packet Processing]\nB --> D[AI Analysis]\nB --> E[Database]\nB --> F[Report Generation]"),
    ("Figure 8.2: Network Analysis Workflow", "flowchart TD\nA[Upload PCAP] --> B[Parse Packets]\nB --> C[Extract Metadata]\nC --> D[Identify Protocols]\nD --> E[Find Suspicious Patterns]\nE --> F[Store Findings]"),
    ("Figure 8.3: Case Investigation Workflow", "flowchart TD\nA[Open Case] --> B[Review Packet Summary]\nB --> C[Inspect Evidence]\nC --> D[Update Timeline]\nD --> E[Generate Report]"),
    ("Figure 8.4: Packet Processing Workflow", "flowchart TD\nA[Read File] --> B[Validate Format]\nB --> C[Parse Packet Stream]\nC --> D[Convert to Records]\nD --> E[Store in Database]"),
    ("Figure 8.5: Threat Detection Workflow", "flowchart TD\nA[Packet Metadata] --> B[Apply Heuristics]\nB --> C[Compute Risk Score]\nC --> D[Flag Threat]\nD --> E[Store Threat Record]"),
    ("Figure 8.6: Report Generation Workflow", "flowchart TD\nA[Case Data] --> B[Compile Evidence]\nB --> C[Summarize Findings]\nC --> D[Generate PDF/CSV]\nD --> E[Archive Report]"),
    ("Figure 8.7: React ↔ Flask Architecture", "flowchart LR\nA[React Components] --> B[REST API]\nB --> C[Flask Routes]\nC --> D[Business Logic]\nD --> E[SQLite Database]"),
]

# Make output directory
img_dir = WORKDIR / 'diagram_images'
img_dir.mkdir(exist_ok=True)

# Load source doc
if not INPUT_DOCX.exists():
    raise SystemExit(f'Input document not found: {INPUT_DOCX}')

doc = Document(INPUT_DOCX)

for idx, (label, mermaid_text) in enumerate(diagrams, start=1):
    # Save a temp .mmd file
    mmd_path = WORKDIR / f'diagram_{idx}.mmd'
    mmd_path.write_text(mermaid_text, encoding='utf-8')
    out_path = img_dir / f'diagram_{idx}.png'
    cmd = [str(MERMAID_BIN), '-i', str(mmd_path), '-o', str(out_path), '-w', '1200', '-H', '700']
    result = subprocess.run(cmd, capture_output=True, text=True, cwd=str(WORKDIR))
    if result.returncode != 0:
        print('Mermaid render failed for', label)
        print(result.stderr)
        continue
    if out_path.exists():
        # Find the paragraph containing the label and replace the following text block with an image
        for para in doc.paragraphs:
            if label in para.text:
                # Clear paragraph text and insert image after it
                para.clear()
                para.add_run(label)
                # Add image paragraph
                img_paragraph = doc.add_paragraph()
                img_paragraph.alignment = WD_ALIGN_PARAGRAPH.CENTER
                run = img_paragraph.add_run()
                run.add_picture(str(out_path), width=Inches(6.2))
                break

# Save updated doc
if OUTPUT_DOCX.exists():
    OUTPUT_DOCX.unlink()
doc.save(OUTPUT_DOCX)
print(f'Created {OUTPUT_DOCX}')
