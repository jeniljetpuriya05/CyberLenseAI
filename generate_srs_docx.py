from docx import Document
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_BREAK
from docx.enum.section import WD_SECTION
from docx.shared import Pt, Inches
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.enum.style import WD_STYLE_TYPE


def set_default_styles(doc):
    style = doc.styles['Normal']
    style.font.name = 'Times New Roman'
    style.font.size = Pt(12)
    style.paragraph_format.space_before = Pt(0)
    style.paragraph_format.space_after = Pt(6)
    style.paragraph_format.line_spacing = 1.5
    style.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY

    for style_name in ['Heading 1', 'Heading 2', 'Heading 3', 'Title', 'Subtitle']:
        s = doc.styles[style_name]
        s.font.name = 'Times New Roman'
        s.font.color.rgb = None

    title_style = doc.styles['Title']
    title_style.font.size = Pt(16)
    title_style.font.bold = True

    h1 = doc.styles['Heading 1']
    h1.font.size = Pt(14)
    h1.font.bold = True
    h1.paragraph_format.space_before = Pt(12)
    h1.paragraph_format.space_after = Pt(6)

    h2 = doc.styles['Heading 2']
    h2.font.size = Pt(13)
    h2.font.bold = True
    h2.paragraph_format.space_before = Pt(10)
    h2.paragraph_format.space_after = Pt(4)

    h3 = doc.styles['Heading 3']
    h3.font.size = Pt(12)
    h3.font.bold = True
    h3.paragraph_format.space_before = Pt(8)
    h3.paragraph_format.space_after = Pt(3)


def add_paragraph(doc, text, style='Normal', bold=False, italic=False, align=WD_ALIGN_PARAGRAPH.JUSTIFY, font_size=12, color=None):
    p = doc.add_paragraph()
    p.style = style
    p.alignment = align
    run = p.add_run(text)
    run.font.name = 'Times New Roman'
    run.font.size = Pt(font_size)
    run.bold = bold
    run.italic = italic
    if color is not None:
        run.font.color.rgb = color
    return p


def add_bullets(doc, items):
    for item in items:
        doc.add_paragraph(item, style='List Bullet')


def add_numbered_list(doc, items):
    for item in items:
        doc.add_paragraph(item, style='List Number')


def add_toc_field(doc):
    p = doc.add_paragraph()
    p.style = 'Heading 1'
    p.add_run('Table of Contents').bold = True
    p2 = doc.add_paragraph()
    run = p2.add_run()
    fldChar1 = OxmlElement('w:fldChar')
    fldChar1.set(qn('w:fldCharType'), 'begin')
    instrText = OxmlElement('w:instrText')
    instrText.set(qn('xml:space'), 'preserve')
    instrText.text = 'TOC \\o "1-3" \\h \\z \\u'
    fldChar2 = OxmlElement('w:fldChar')
    fldChar2.set(qn('w:fldCharType'), 'end')
    run._r.append(fldChar1)
    run._r.append(instrText)
    run._r.append(fldChar2)


def add_page_number_footer(doc):
    section = doc.sections[-1]
    footer = section.footer
    paragraph = footer.paragraphs[0]
    paragraph.text = ''
    paragraph.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = paragraph.add_run()
    run.text = 'Page '
    fldChar1 = OxmlElement('w:fldChar')
    fldChar1.set(qn('w:fldCharType'), 'begin')
    instrText = OxmlElement('w:instrText')
    instrText.set(qn('xml:space'), 'preserve')
    instrText.text = 'PAGE'
    fldChar2 = OxmlElement('w:fldChar')
    fldChar2.set(qn('w:fldCharType'), 'end')
    run._r.append(fldChar1)
    run._r.append(instrText)
    run._r.append(fldChar2)


def add_figure(doc, title, mermaid_code, figure_no):
    add_paragraph(doc, f'Figure {figure_no}: {title}', style='Caption')
    p = doc.add_paragraph()
    p.style = 'Normal'
    run = p.add_run(mermaid_code)
    run.font.name = 'Courier New'
    run.font.size = Pt(10)
    p.paragraph_format.left_indent = Inches(0.5)
    p.paragraph_format.right_indent = Inches(0.5)


def add_table_caption(doc, title, table_no):
    add_paragraph(doc, f'Table {table_no}: {title}', style='Caption')


def add_table(doc, headers, rows, title, table_no):
    table = doc.add_table(rows=1, cols=len(headers))
    table.style = 'Table Grid'
    for i, h in enumerate(headers):
        table.cell(0, i).text = h
        for paragraph in table.cell(0, i).paragraphs:
            for run in paragraph.runs:
                run.bold = True
                run.font.name = 'Times New Roman'

    for _ in range(len(rows)):
        table.add_row()

    for r_idx, row in enumerate(rows, start=1):
        for c_idx, value in enumerate(row):
            table.cell(r_idx, c_idx).text = value
            for paragraph in table.cell(r_idx, c_idx).paragraphs:
                for run in paragraph.runs:
                    run.font.name = 'Times New Roman'
    add_table_caption(doc, title, table_no)


def add_section_break(doc):
    doc.add_page_break()


def build_doc(path):
    doc = Document()
    set_default_styles(doc)

    # Cover Page
    title_paragraph = doc.add_paragraph()
    title_paragraph.alignment = WD_ALIGN_PARAGRAPH.CENTER
    title_run = title_paragraph.add_run('CyberLens AI')
    title_run.bold = True
    title_run.font.size = Pt(20)
    title_run.font.name = 'Times New Roman'

    subtitle = doc.add_paragraph()
    subtitle.alignment = WD_ALIGN_PARAGRAPH.CENTER
    subtitle_run = subtitle.add_run('AI-Based Network & Packet Forensics System for Cyber Crime Investigation')
    subtitle_run.bold = True
    subtitle_run.font.size = Pt(16)
    subtitle_run.font.name = 'Times New Roman'

    doc.add_paragraph().alignment = WD_ALIGN_PARAGRAPH.CENTER
    doc.add_paragraph('Department of Computer Engineering', style='Subtitle').alignment = WD_ALIGN_PARAGRAPH.CENTER
    doc.add_paragraph('CHARUSAT', style='Subtitle').alignment = WD_ALIGN_PARAGRAPH.CENTER
    doc.add_paragraph('DEPSTAR', style='Subtitle').alignment = WD_ALIGN_PARAGRAPH.CENTER
    doc.add_paragraph('5th Semester', style='Subtitle').alignment = WD_ALIGN_PARAGRAPH.CENTER
    doc.add_paragraph('Software Group Project (SGP)', style='Subtitle').alignment = WD_ALIGN_PARAGRAPH.CENTER
    doc.add_paragraph('Prepared by', style='Subtitle').alignment = WD_ALIGN_PARAGRAPH.CENTER
    doc.add_paragraph('Jenil Jetpuriya (24DIT024)', style='Subtitle').alignment = WD_ALIGN_PARAGRAPH.CENTER
    doc.add_paragraph('Manthan Chavda (24DIT009)', style='Subtitle').alignment = WD_ALIGN_PARAGRAPH.CENTER

    add_section_break(doc)

    # Certificate
    add_paragraph(doc, 'Certificate', style='Heading 1', bold=True)
    add_paragraph(doc, 'This is to certify that the Software Requirements Specification and System Design Document entitled “CyberLens AI – AI-Based Network & Packet Forensics System for Cyber Crime Investigation” has been prepared by Jenil Jetpuriya and Manthan Chavda of the Department of Computer Engineering, CHARUSAT, DEPSTAR, for the 5th Semester Software Group Project. The report has been developed in accordance with the requirements of the project and reflects the analysis, design, and implementation strategy of the proposed system.')
    add_paragraph(doc, 'Signed:', bold=True)
    add_paragraph(doc, 'Project Team')
    add_paragraph(doc, 'Jenil Jetpuriya (24DIT024)')
    add_paragraph(doc, 'Manthan Chavda (24DIT009)')

    add_section_break(doc)

    # Acknowledgement
    add_paragraph(doc, 'Acknowledgement', style='Heading 1', bold=True)
    add_paragraph(doc, 'The development of this document involved extensive study of network forensics, packet analysis, machine learning, and software engineering practices. We express our sincere gratitude to our faculty guide, project coordinators, and institution for their continuous guidance and support. This work helped us understand how intelligent systems can support digital investigations without claiming to decrypt encrypted information, while still extracting meaningful metadata and behavioural indicators from captured traffic.')

    add_section_break(doc)

    # Abstract
    add_paragraph(doc, 'Abstract', style='Heading 1', bold=True)
    add_paragraph(doc, 'CyberLens AI is a web-based forensic investigation platform designed to assist law enforcement agencies, academic researchers, and cybersecurity investigators in analyzing network traffic and packet captures. The system accepts PCAP files, parses packets, extracts metadata, detects suspicious behaviour, organizes evidence, tracks investigation timelines, and generates forensic reports. The project combines React.js for the front-end, Python Flask for the back-end, SQLite for persistence, Scapy and PyShark for packet handling, and scikit-learn for machine learning-based analysis. The system is intentionally scoped to non-decryptive traffic analysis and focuses on metadata, protocol behavior, traffic timing, and anomaly detection to support digital forensic investigation workflows.')

    add_section_break(doc)

    # TOC
    add_paragraph(doc, 'Table of Contents', style='Heading 1', bold=True)
    add_toc_field(doc)

    add_section_break(doc)

    # List of figures and tables
    add_paragraph(doc, 'List of Figures', style='Heading 1', bold=True)
    add_paragraph(doc, 'Figure 5.1 Use Case Diagram')
    add_paragraph(doc, 'Figure 5.2 Activity Diagram')
    add_paragraph(doc, 'Figure 5.3 Sequence Diagram')
    add_paragraph(doc, 'Figure 5.4 Class Diagram')
    add_paragraph(doc, 'Figure 5.5 State Diagram')
    add_paragraph(doc, 'Figure 5.6 Component Diagram')
    add_paragraph(doc, 'Figure 5.7 Deployment Diagram')
    add_paragraph(doc, 'Figure 6.1 ER Diagram')
    add_paragraph(doc, 'Figure 7.1 Context Diagram')
    add_paragraph(doc, 'Figure 7.2 DFD Level 0')
    add_paragraph(doc, 'Figure 7.3 DFD Level 1')
    add_paragraph(doc, 'Figure 7.4 DFD Level 2')

    add_paragraph(doc, 'List of Tables', style='Heading 1', bold=True)
    add_paragraph(doc, 'Table 3.1 Functional Requirement Summary')
    add_paragraph(doc, 'Table 3.2 Non-Functional Requirement Summary')
    add_paragraph(doc, 'Table 6.1 Database Schema Overview')
    add_paragraph(doc, 'Table 6.2 Data Dictionary for Users')
    add_paragraph(doc, 'Table 6.3 Data Dictionary for Cases')
    add_paragraph(doc, 'Table 12.1 Test Case Matrix')

    add_section_break(doc)

    # Chapter 1
    add_paragraph(doc, 'Chapter 1', style='Heading 1', bold=True)
    add_paragraph(doc, 'Introduction', style='Heading 1', bold=True)
    add_paragraph(doc, '1.1 Purpose', style='Heading 2', bold=True)
    add_paragraph(doc, 'The purpose of this Software Requirements Specification and System Design Document is to define the requirements, architecture, and design considerations for CyberLens AI. The document presents a complete specification for a web-based platform that supports investigators in analyzing network packet captures, identifying suspicious behavior, managing evidence, and generating reports for cyber crime investigation. It provides the basis for system development, testing, validation, and future enhancement.')
    add_paragraph(doc, '1.2 Scope', style='Heading 2', bold=True)
    add_paragraph(doc, 'The scope of the project includes the creation of investigation cases, uploading of PCAP files, parsing network packets, extracting packet metadata, identifying protocols, analyzing traffic behavior, classifying suspicious activities, managing digital evidence, tracking timelines, and generating documented reports. The system is limited to network metadata and behavioral analysis and does not claim to decrypt encrypted traffic or recover hidden payload contents that are inaccessible through standard traffic capture methods.')
    add_paragraph(doc, '1.3 Definitions', style='Heading 2', bold=True)
    add_paragraph(doc, 'PCAP: A packet capture file containing raw network traffic data. Investigation Case: A logical container storing evidence, analysis results, and timeline events. Evidence: A digital artifact such as captured packets, screenshots, notes, or analysis summaries. Threat: A suspicious pattern or anomaly detected in network traffic. Metadata: Packet properties such as source IP, destination IP, port numbers, protocol, timing, lengths, and flags. Report: An exported document summarizing findings of the investigation.')
    add_paragraph(doc, '1.4 Acronyms', style='Heading 2', bold=True)
    add_paragraph(doc, 'SRS: Software Requirements Specification; UI: User Interface; API: Application Programming Interface; PCAP: Packet Capture; IP: Internet Protocol; SQL: Structured Query Language; AI: Artificial Intelligence; NIST: National Institute of Standards and Technology; CSV: Comma Separated Values; PDF: Portable Document Format.')
    add_paragraph(doc, '1.5 References', style='Heading 2', bold=True)
    add_paragraph(doc, 'The development of this document is based on standard software engineering practices, network forensics principles, and publicly available documentation of React.js, Flask, Scapy, PyShark, SQLite, and common digital forensic workflow references. Relevant references also include NIST guidance on digital investigation and network security analysis practices.')
    add_paragraph(doc, '1.6 Document Overview', style='Heading 2', bold=True)
    add_paragraph(doc, 'Chapter 2 provides an overall description of the product, including its perspective, functions, user characteristics, limitations, and future scope. Chapter 3 focuses on detailed system requirements, including functional, non-functional, and security-specific expectations. Chapter 4 describes the system design and architecture, while Chapter 5 presents UML diagrams. Chapter 6 covers database design, Chapter 7 discusses data flow diagrams, Chapter 8 describes architecture and workflow diagrams, Chapter 9 presents UI design, Chapter 10 explains analytical algorithms, Chapter 11 describes testing, and Chapter 12 concludes the report with future enhancements and expected outcomes.')

    add_section_break(doc)

    # Chapter 2
    add_paragraph(doc, 'Chapter 2', style='Heading 1', bold=True)
    add_paragraph(doc, 'Overall Description', style='Heading 1', bold=True)
    add_paragraph(doc, 'Product Perspective', style='Heading 2', bold=True)
    add_paragraph(doc, 'CyberLens AI is a standalone investigation platform that supports the analysis of network traffic data obtained from pcap files. It is intended to be used by investigators and researchers who require a structured, evidence-oriented interface to study suspicious traffic patterns. The system integrates multiple modules including packet parsing, metadata extraction, AI-based classification, evidence tracking, case management, and reporting. Its design emphasizes modularity, traceability, and ease of use while remaining independent from any external commercial forensic toolchain.')
    add_paragraph(doc, 'Product Functions', style='Heading 2', bold=True)
    add_paragraph(doc, 'The product provides facilities to create investigator profiles, create new cases, upload packet captures, parse network packets, detect suspicious events, maintain evidence records, monitor case status, generate reports, and manage settings. It also supports search and filter capabilities for easier examination of traffic properties and case history. As a software platform, it acts as a digital assistant to investigators rather than a complete replacement for professional forensic procedures.')
    add_paragraph(doc, 'User Characteristics', style='Heading 2', bold=True)
    add_paragraph(doc, 'The primary users are investigators, cyber forensic analysts, system administrators, and academic project evaluators. They are expected to have basic knowledge of networking concepts, traffic capture files, evidence handling, and digital investigation workflows. The system provides a simple interface that reduces the need for complex command-line operations while still offering detailed analysis outputs for technical users.')
    add_paragraph(doc, 'Operating Environment', style='Heading 2', bold=True)
    add_paragraph(doc, 'The application is designed to run on modern desktop and laptop systems with internet access for deployment and updates. The front-end operates in a browser environment, while the back-end runs as a Flask service. SQLite is used as the local relational database. The packet analysis components depend on Python libraries that can be installed on standard Windows or Linux systems. The platform is expected to operate in a local environment or on a private intranet server for forensic use cases.')
    add_paragraph(doc, 'Design Constraints', style='Heading 2', bold=True)
    add_paragraph(doc, 'The system is constrained by the scope of packet analysis and the limitation that encrypted traffic cannot be decrypted or inspected at the content level. The project uses lightweight database storage and local processing to maintain simplicity and portability. The system must handle large PCAP files carefully to avoid excessive memory use, and must support a responsive web interface with acceptable performance for moderate files.')
    add_paragraph(doc, 'Assumptions', style='Heading 2', bold=True)
    add_paragraph(doc, 'It is assumed that users upload valid PCAP files and that the uploaded data includes enough metadata to support analysis. The system assumes the presence of a functioning Python environment and required third-party libraries. It is also assumed that investigators will use the platform as an analytical aid, not as the sole basis for legal evidence presentation.')
    add_paragraph(doc, 'Limitations', style='Heading 2', bold=True)
    add_paragraph(doc, 'The system does not inspect protected payload contents, does not decrypt traffic, and does not provide full packet reconstruction for complex encrypted protocols. The current scope supports common packet features and heuristic threat detection rather than comprehensive deep-packet inspection. Performance may depend on hardware capabilities and file size.')
    add_paragraph(doc, 'Advantages', style='Heading 2', bold=True)
    add_paragraph(doc, 'The system offers centralized case management, structured analysis, automated metadata extraction, a visual investigation workflow, and reproducible reporting. Its modular architecture allows future extension with additional detection algorithms, database integrations, and deployment options.')
    add_paragraph(doc, 'Future Scope', style='Heading 2', bold=True)
    add_paragraph(doc, 'Future enhancements may include integration with live network capture, support for cloud deployment, advanced malware detection modules, role-based multi-user access, automated evidence chain-of-custody tracking, cross-platform mobile support, and integration with external threat intelligence feeds.')

    add_section_break(doc)

    # Chapter 3
    add_paragraph(doc, 'Chapter 3', style='Heading 1', bold=True)
    add_paragraph(doc, 'System Requirements', style='Heading 1', bold=True)
    add_paragraph(doc, 'Functional Requirements', style='Heading 2', bold=True)
    add_paragraph(doc, 'The following functional requirements define the expected behavior of CyberLens AI. Each requirement is essential for supporting the investigation lifecycle from user authentication to report generation.')
    functional_requirements = [
        'FR-01: The system shall allow investigators to register and log in using a valid username and password.',
        'FR-02: The system shall allow users to reset passwords securely through an authenticated recovery process.',
        'FR-03: The system shall allow administrators to manage user accounts and enable or disable access.',
        'FR-04: The system shall allow users to create a new investigation case with a unique title, category, priority, and description.',
        'FR-05: The system shall allow users to edit investigation case details before analysis is finalized.',
        'FR-06: The system shall allow investigators to delete or archive cases that are no longer active.',
        'FR-07: The system shall allow users to upload PCAP files in accepted formats such as .pcap and .pcapng.',
        'FR-08: The system shall validate the uploaded file format and reject unsupported or corrupted files.',
        'FR-09: The system shall store uploaded files securely and associate them with the relevant case.',
        'FR-10: The system shall parse uploaded packets using Scapy and PyShark libraries.',
        'FR-11: The system shall extract packet metadata including source IP, destination IP, protocol, ports, packet length, timing, and flags.',
        'FR-12: The system shall classify packets into known protocols such as TCP, UDP, ICMP, DNS, HTTP, and HTTPS.',
        'FR-13: The system shall detect suspicious traffic by identifying unusual port usage, abnormal packet rates, repeated connection attempts, or suspicious IP behavior.',
        'FR-14: The system shall assign a risk score to each detected suspicious event based on heuristic analysis.',
        'FR-15: The system shall support manual review of suspicious events by investigators.',
        'FR-16: The system shall maintain a case timeline showing key events, uploads, analysis actions, and evidence additions.',
        'FR-17: The system shall allow users to save notes and observations for each investigation case.',
        'FR-18: The system shall allow evidence to be added to a case with detailed descriptions and timestamps.',
        'FR-19: The system shall allow investigators to attach screenshots and analysis notes to evidence items.',
        'FR-20: The system shall support evidence status values including pending, reviewed, approved, and archived.',
        'FR-21: The system shall provide search functionality for cases, evidence, threats, and reports.',
        'FR-22: The system shall allow filters by case status, severity, time range, protocol, IP address, and port number.',
        'FR-23: The system shall generate a dashboard summarizing open cases, suspicious activity count, recent uploads, and report statistics.',
        'FR-24: The system shall display a summary of active threats and associated packet flows.',
        'FR-25: The system shall allow users to export analysis results in PDF or CSV format.',
        'FR-26: The system shall allow users to generate a structured investigation report from the available case data.',
        'FR-27: The system shall preserve an audit trail of important actions performed by each user.',
        'FR-28: The system shall notify users when a new analysis result or suspicious event is generated.',
        'FR-29: The system shall display the current status of each investigation case including new, in-progress, reviewed, and closed.',
        'FR-30: The system shall prevent duplicate case creation for the same investigation title within the same user namespace.',
        'FR-31: The system shall support the update of case priorities and investigation progress.',
        'FR-32: The system shall allow users to view packet-level information and statistics for each uploaded file.',
        'FR-33: The system shall allow analysts to compare traffic patterns across multiple cases or uploads.',
        'FR-34: The system shall support visual charts showing protocol distribution and packet counts.',
        'FR-35: The system shall allow users to mark an analysis as reviewed and finalize the case decision.',
        'FR-36: The system shall allow users to navigate through case details, evidence, timeline, and reports from a single interface.',
        'FR-37: The system shall store the date and time of every major analysis operation.',
        'FR-38: The system shall confirm successful upload and analysis completion before presenting results.',
        'FR-39: The system shall allow users to view partial results even when the full analysis is still running.',
        'FR-40: The system shall support basic role separation between investigator and administrator functions.'
    ]
    add_bullets(doc, functional_requirements)

    add_table(doc, ['ID', 'Category', 'Description'], [[f'FR-{i}', 'Functional', req] for i, req in enumerate(functional_requirements[:10], start=1)], 'Functional Requirement Summary', 3.1)

    add_paragraph(doc, 'Non-Functional Requirements', style='Heading 2', bold=True)
    add_paragraph(doc, 'The non-functional requirements ensure that the platform remains usable, secure, maintainable, and suitable for academic and investigative use. These requirements shape the quality attributes of the system rather than its direct functionality.')
    nfrs = [
        'Performance: The system shall process moderately sized PCAP files within acceptable time limits and present initial results rapidly.',
        'Availability: The system shall remain available during normal investigation sessions and recover gracefully from temporary service interruptions.',
        'Reliability: The system shall produce consistent analysis outcomes for identical input files and log any processing failures.',
        'Scalability: The system shall support additional cases and analysis records without a complete redesign of the architecture.',
        'Maintainability: The system shall be modular so updates to analysis logic, UI components, and database access remain straightforward.',
        'Usability: The interface shall be intuitive, with clear navigation for case management and analysis.',
        'Compatibility: The system shall operate on common modern browsers and current Python runtime environments.',
        'Security: The system shall protect sensitive case information through authentication, authorization, audit logs, and secure storage policies.',
        'Response Time: The application shall respond to user actions within a short interval, especially for dashboard and case detail views.',
    ]
    add_bullets(doc, nfrs)
    add_table(doc, ['Quality Attribute', 'Requirement'], [['Performance', 'Processing must be responsive for standard PCAP sizes'], ['Availability', 'The platform must remain operable during normal usage'], ['Reliability', 'Repeated analysis should return consistent results'], ['Scalability', 'New modules can be added without major rewrite'], ['Maintainability', 'Code should be separated by module and layer'], ['Usability', 'Investigation tasks should be completed with minimal training']], 'Non-Functional Requirement Summary', 3.2)

    add_paragraph(doc, 'Security Requirements', style='Heading 2', bold=True)
    add_paragraph(doc, 'Authentication: Users shall be authenticated before access to protected investigation modules is granted. Authorization: Different user roles shall have predefined access rights. Password Security: Passwords shall be hashed and stored securely. Session Management: Active sessions shall expire after inactivity. File Validation: Uploaded files shall be validated before processing. Secure Storage: Case data and evidence files shall be stored in controlled locations. Audit Logging: Important actions shall be logged. Privacy: Sensitive case information shall remain accessible only to authorized users.')

    add_paragraph(doc, 'Machine Learning Requirements', style='Heading 2', bold=True)
    add_paragraph(doc, 'The machine learning component shall classify traffic behavior using heuristics based on packet sequences, traffic density, and relationship between endpoints. The model shall be lightweight, explainable, and suitable for training on historical or synthetic examples. It shall provide confidence scores and allow manual review of results so investigators can validate outcomes.')

    add_paragraph(doc, 'Packet Analysis Requirements', style='Heading 2', bold=True)
    add_paragraph(doc, 'The packet analysis engine shall parse network packets while preserving metadata integrity. It shall support protocol identification, flow summaries, and suspicious activity detection based on traffic features. The analysis module shall be resilient to partial or corrupted files and should present a structured summary even when full parsing is limited.')

    add_paragraph(doc, 'Reporting Requirements', style='Heading 2', bold=True)
    add_paragraph(doc, 'The reporting module shall generate structured reports that include case metadata, evidence list, suspicious event summaries, timeline notes, and analysis conclusions. Reports shall be exportable to PDF and CSV formats and shall maintain consistency with the case database.')

    add_section_break(doc)

    # Chapter 4
    add_paragraph(doc, 'Chapter 4', style='Heading 1', bold=True)
    add_paragraph(doc, 'System Design', style='Heading 1', bold=True)
    add_paragraph(doc, 'Overall Architecture', style='Heading 2', bold=True)
    add_paragraph(doc, 'The overall architecture of CyberLens AI follows a three-tier model consisting of a presentation layer, an application layer, and a data layer. The front-end is built using React.js and communicates with the Flask back-end through HTTP endpoints. The Flask service handles authentication, case management, packet processing, analysis orchestration, and report generation. SQLite stores structured data such as user accounts, cases, evidence records, timeline entries, and analysis results.')
    add_paragraph(doc, 'Frontend Architecture', style='Heading 2', bold=True)
    add_paragraph(doc, 'The front-end is organized into modular components such as login, dashboard, case management, upload, analysis, evidence, timeline, and report pages. Each component is implemented using reusable UI elements and state management patterns that simplify updates and enable future extension. The interface is designed to support investigators in moving from case creation to report generation through a consistent workflow.')
    add_paragraph(doc, 'Backend Architecture', style='Heading 2', bold=True)
    add_paragraph(doc, 'The back-end is divided into authentication services, case services, upload services, packet processing services, analysis services, reporting services, and database access layers. Flask routes expose APIs that receive user requests, validate inputs, invoke analysis procedures, and return structured responses. This separation provides maintainability and makes the system easier to test.')
    add_paragraph(doc, 'Packet Analysis Engine', style='Heading 2', bold=True)
    add_paragraph(doc, 'The packet analysis engine is responsible for reading uploaded PCAP files, parsing packets, extracting metadata, and deriving suspicious behavior indicators. Scapy and PyShark are used to parse and interpret network traffic. The engine is designed to produce summary-level insights and packet-level records that can be stored and reviewed later.')
    add_paragraph(doc, 'AI Analysis Engine', style='Heading 2', bold=True)
    add_paragraph(doc, 'The AI analysis engine uses scikit-learn and heuristic rule combinations to classify traffic patterns and assign risk scores. It focuses on explainable analysis rather than opaque black-box classification. This allows investigators to understand why a traffic pattern was flagged and how the system reached its conclusion.')
    add_paragraph(doc, 'Database Design', style='Heading 2', bold=True)
    add_paragraph(doc, 'The database design stores persistent information related to users, cases, evidence, threats, reports, analysis results, and timeline events. Relationships are defined to support traceability, filtering, and case review workflows. SQLite is sufficient for the academic scope of the project and provides a lightweight, file-based solution that is easy to deploy.')
    add_paragraph(doc, 'Reporting Module', style='Heading 2', bold=True)
    add_paragraph(doc, 'The reporting module collects findings from the analysis engine, evidence repository, and timeline records to create a professional report. It produces structured sections covering case overview, packet summaries, suspicious behavior, evidence statements, and analyst notes. Export mechanisms make the report available for sharing or archival purposes.')
    add_paragraph(doc, 'Workflow', style='Heading 2', bold=True)
    add_paragraph(doc, 'The typical workflow is as follows: a user logs in, creates or selects a case, uploads a PCAP file, parses packets, examines extracted metadata, detects suspicious behavior, manages evidence, updates the timeline, and generates a report. This workflow supports investigative continuity from initial intake to final reporting.')
    add_paragraph(doc, 'Component Description', style='Heading 2', bold=True)
    add_paragraph(doc, 'The core components include authentication, case management, upload and parsing interface, analysis engine, evidence manager, timeline recorder, visualization module, and reporting service. These components interact through well-defined APIs and maintain consistent data flow across the system.')
    add_paragraph(doc, 'Deployment Architecture', style='Heading 2', bold=True)
    add_paragraph(doc, 'The deployment architecture is intended for local or private intranet deployment. The front-end is served through a web browser, the Flask application runs on a host server, and SQLite stores the database in a local file. For future deployment, the architecture can be extended to cloud hosting with a web server and a larger relational database.')
    add_paragraph(doc, 'Data Flow', style='Heading 2', bold=True)
    add_paragraph(doc, 'User actions initiate requests that pass from the front-end to the Flask API, which validates and processes them. The application then interacts with the packet analysis engine and database before returning results to the user interface. Data flow is designed to remain traceable and auditable for each investigation step.')

    add_section_break(doc)

    # Chapter 5
    add_paragraph(doc, 'Chapter 5', style='Heading 1', bold=True)
    add_paragraph(doc, 'UML Diagrams', style='Heading 1', bold=True)
    add_paragraph(doc, 'This chapter presents the principal UML diagrams that describe the interactions and structure of the CyberLens AI system. Each diagram is expressed in Mermaid syntax so that it can be edited and reused in future documentation or modeling tools.')
    add_figure(doc, 'Use Case Diagram', """graph TD
A[Investigator] --> B[Login]
A --> C[Create Investigation]
A --> D[Upload PCAP]
A --> E[Analyze Packets]
A --> F[Manage Evidence]
A --> G[Generate Report]
B --> H[Authentication Service]
C --> I[Case Management]
D --> J[Packet Parsing]
E --> K[Threat Detection]
F --> L[Evidence Repository]
G --> M[Reporting Module]""", 5.1)
    add_paragraph(doc, 'The use case diagram shows the major interaction points between the investigator and the system. It highlights the main functions of authentication, case creation, packet upload, packet analysis, evidence management, and report generation.')

    add_figure(doc, 'Activity Diagram', """flowchart TD
A[Start] --> B[Login]
B --> C{Valid User?}
C -- Yes --> D[Create/Select Case]
C -- No --> E[Show Error]
D --> F[Upload PCAP]
F --> G[Parse Packets]
G --> H[Analyze Traffic]
H --> I[Detect Threats]
I --> J[Record Evidence]
J --> K[Generate Report]
K --> L[End]""", 5.2)
    add_paragraph(doc, 'The activity diagram illustrates the operational workflow of the system from login to report generation. It emphasizes the sequence of actions that investigators use to process and evaluate network traffic data.')

    add_figure(doc, 'Sequence Diagram', """sequenceDiagram
Participant Investigator
Participant UI
Participant API
Participant AnalysisEngine
Participant Database
Investigator->>UI: Upload PCAP
UI->>API: Send file
API->>AnalysisEngine: Parse packets
AnalysisEngine->>Database: Store metadata
AnalysisEngine-->>API: Return results
API-->>UI: Display summary
UI-->>Investigator: Show analysis""", 5.3)
    add_paragraph(doc, 'The sequence diagram shows how the investigation flow proceeds across the main system components. It focuses on the request-response interactions that occur between the user interface, the API, the analysis engine, and the database.')

    add_figure(doc, 'Class Diagram', """classDiagram
class User {+id +username +passwordHash +role}
class Case {+id +title +description +priority +status}
class Evidence {+id +caseId +type +description +timestamp}
class Threat {+id +caseId +severity +riskScore +details}
class Report {+id +caseId +generatedAt +path}
class Analysis {+id +caseId +packetCount +protocolSummary +riskScore}
User --> Case
Case --> Evidence
Case --> Threat
Case --> Report
Case --> Analysis""", 5.4)
    add_paragraph(doc, 'The class diagram defines the primary entities of the system and the relationships among them. It provides a structural understanding of how case data, threats, evidence, reports, and analysis records are represented.')

    add_figure(doc, 'State Diagram', """stateDiagram-v2
[*] --> New
New --> InProgress : Upload PCAP
InProgress --> Reviewed : Analyze packets
Reviewed --> Closed : Generate report
Reviewed --> InProgress : Add evidence
Closed --> [*]""", 5.5)
    add_paragraph(doc, 'The state diagram reflects the lifecycle of an investigation case as it progresses from creation to closure. It captures state transitions that happen during analysis, evidence management, and final reporting.')

    add_figure(doc, 'Component Diagram', """graph LR
A[React UI] --> B[Flask API]
B --> C[Auth Module]
B --> D[Case Module]
B --> E[Packet Analysis Module]
B --> F[Threat Detection Module]
B --> G[Reporting Module]
D --> H[SQLite DB]
E --> H
F --> H
G --> H""", 5.6)
    add_paragraph(doc, 'The component diagram highlights the major software modules and their dependencies. It shows how the presentation layer connects to backend services and shared data storage.')

    add_figure(doc, 'Deployment Diagram', """graph TD
Client[Web Browser] --> Server[Flask Application Server]
Server --> DB[SQLite Database]
Server --> Parser[Scapy/PyShark Engine]
Server --> ML[Scikit-learn Module]
Server --> Report[Report Generator]""", 5.7)
    add_paragraph(doc, 'The deployment diagram presents the hardware and software deployment view of the project. It shows the interaction of client systems, application server, analysis modules, and the database.')

    add_section_break(doc)

    # Chapter 6
    add_paragraph(doc, 'Chapter 6', style='Heading 1', bold=True)
    add_paragraph(doc, 'Database Design', style='Heading 1', bold=True)
    add_figure(doc, 'ER Diagram', """erDiagram
USER ||--o{ CASE : creates
CASE ||--o{ EVIDENCE : contains
CASE ||--o{ THREAT : has
CASE ||--o{ REPORT : generates
CASE ||--o{ ANALYSIS : receives
CASE ||--o{ TIMELINE : includes
USER { int id string username string role }
CASE { int id int userId string title string status }
EVIDENCE { int id int caseId string type string description }
THREAT { int id int caseId string severity float riskScore }
REPORT { int id int caseId string reportPath datetime generatedAt }
ANALYSIS { int id int caseId int packetCount string protocolSummary float riskScore }
TIMELINE { int id int caseId datetime timestamp string event }""", 6.1)
    add_paragraph(doc, 'The ER diagram captures the logical relationship between major entities in the forensic investigation system. It emphasizes that every case is linked to evidence, threats, analysis results, timeline events, and reports, while users create and manage these cases.')
    add_paragraph(doc, 'Relational Schema', style='Heading 2', bold=True)
    add_paragraph(doc, 'The relational schema organizes the database into normalized tables. Each table stores a well-defined set of attributes with foreign key relationships to maintain integrity across the investigation lifecycle.')
    add_table(doc, ['Table Name', 'Purpose'], [['Users', 'Stores user credentials and roles'], ['Cases', 'Stores investigation case metadata'], ['Evidence', 'Stores evidence details'], ['Threats', 'Stores suspicious events'], ['Reports', 'Stores generated report references'], ['Analysis', 'Stores analysis summaries'], ['Timeline', 'Stores chronological investigation events']], 'Database Schema Overview', 6.1)
    add_table(doc, ['Field', 'Datatype', 'Constraints', 'Description'], [['id', 'INTEGER', 'PRIMARY KEY', 'Unique identifier for the user'], ['username', 'TEXT', 'NOT NULL, UNIQUE', 'User login name'], ['password_hash', 'TEXT', 'NOT NULL', 'Hashed password value'], ['email', 'TEXT', 'UNIQUE', 'User email address'], ['role', 'TEXT', 'NOT NULL', 'Role of the user such as investigator or admin'], ['created_at', 'TEXT', 'NOT NULL', 'Account creation date']], 'Data Dictionary for Users', 6.2)
    add_table(doc, ['Field', 'Datatype', 'Constraints', 'Description'], [['id', 'INTEGER', 'PRIMARY KEY', 'Unique identifier for the case'], ['user_id', 'INTEGER', 'FOREIGN KEY', 'Owner of the case'], ['title', 'TEXT', 'NOT NULL', 'Case title'], ['description', 'TEXT', 'NULL', 'Case background'], ['priority', 'TEXT', 'NOT NULL', 'Case priority'], ['status', 'TEXT', 'NOT NULL', 'Current case status'], ['created_at', 'TEXT', 'NOT NULL', 'Case creation timestamp']], 'Data Dictionary for Cases', 6.3)
    add_paragraph(doc, 'The database stores rich information for every case, including metadata, analysis results, evidence records, and timelines. This relational design allows investigators to retrieve and correlate the right records for each investigation.')

    add_section_break(doc)

    # Chapter 7 DFD
    add_paragraph(doc, 'Chapter 7', style='Heading 1', bold=True)
    add_paragraph(doc, 'Data Flow Diagrams', style='Heading 1', bold=True)
    add_figure(doc, 'Context Diagram', """flowchart LR
A[Investigator] --> B[CyberLens AI System]
B --> C[Report Export]
B --> D[Case Data Storage]""", 7.1)
    add_paragraph(doc, 'The context diagram presents the system as a single process interacting with the investigator and the data store. It provides an initial high-level view of the platform boundary.')
    add_figure(doc, 'DFD Level 0', """flowchart TD
A[Investigator] --> B[1.0 Login and Case Management]
A --> C[2.0 Upload and Parse Packets]
A --> D[3.0 Analyze Threats]
A --> E[4.0 Generate Reports]
B --> F[User and Case Database]
C --> F
D --> F
E --> F""", 7.2)
    add_paragraph(doc, 'The level 0 DFD decomposes the system into major processes that handle user access, packet processing, analysis, and reporting.')
    add_figure(doc, 'DFD Level 1', """flowchart TD
A[2.0 Upload and Parse Packets] --> B[2.1 Validate File]
A --> C[2.2 Parse Packets]
A --> D[2.3 Extract Metadata]
B --> E[Storage]
C --> E
D --> E""", 7.3)
    add_paragraph(doc, 'The level 1 DFD expands packet processing into validation, parsing, and metadata extraction steps.')
    add_figure(doc, 'DFD Level 2', """flowchart TD
A[3.0 Analyze Threats] --> B[3.1 Detect Protocol Anomalies]
A --> C[3.2 Score Risk]
A --> D[3.3 Update Timeline]
B --> E[Threat Repository]
C --> E
D --> E""", 7.4)
    add_paragraph(doc, 'The level 2 DFD provides a deeper view of how suspicious traffic is analyzed and how findings are documented within the system.')

    add_section_break(doc)

    # Chapter 8 Architecture diagrams etc
    add_paragraph(doc, 'Chapter 8', style='Heading 1', bold=True)
    add_paragraph(doc, 'Architecture Diagrams and Workflow Views', style='Heading 1', bold=True)
    add_paragraph(doc, 'The architecture diagrams and workflow views presented in this chapter explain the interaction flow of major processes in CyberLens AI. These views support the implementation plan and clarify how components exchange information and produce investigative outputs.')
    add_figure(doc, 'Overall System Architecture', """flowchart TB
A[React Frontend] --> B[Flask Backend]
B --> C[Packet Processing]
B --> D[AI Analysis]
B --> E[Database]
B --> F[Report Generation]""", 8.1)
    add_paragraph(doc, 'The overall system architecture highlights the main layers of the platform and their responsibilities.')
    add_figure(doc, 'Network Analysis Workflow', """flowchart TD
A[Upload PCAP] --> B[Parse Packets]
B --> C[Extract Metadata]
C --> D[Identify Protocols]
D --> E[Find Suspicious Patterns]
E --> F[Store Findings]""", 8.2)
    add_paragraph(doc, 'The network analysis workflow captures the pipeline from packet capture intake to suspicious pattern detection.')
    add_figure(doc, 'Case Investigation Workflow', """flowchart TD
A[Open Case] --> B[Review Packet Summary]
B --> C[Inspect Evidence]
C --> D[Update Timeline]
D --> E[Generate Report]""", 8.3)
    add_paragraph(doc, 'The case investigation workflow show how a case moves through evidence review, documentation, and final report preparation.')
    add_figure(doc, 'Packet Processing Workflow', """flowchart TD
A[Read File] --> B[Validate Format]
B --> C[Parse Packet Stream]
C --> D[Convert to Records]
D --> E[Store in Database]""", 8.4)
    add_paragraph(doc, 'The packet processing workflow describes the internal steps used to ingest PCAP data into analyzable records.')
    add_figure(doc, 'Threat Detection Workflow', """flowchart TD
A[Packet Metadata] --> B[Apply Heuristics]
B --> C[Compute Risk Score]
C --> D[Flag Threat]
D --> E[Store Threat Record]""", 8.5)
    add_paragraph(doc, 'The threat detection workflow shows how suspicious behavior is detected, scored, and recorded for investigation use.')
    add_figure(doc, 'Report Generation Workflow', """flowchart TD
A[Case Data] --> B[Compile Evidence]
B --> C[Summarize Findings]
C --> D[Generate PDF/CSV]
D --> E[Archive Report]""", 8.6)
    add_paragraph(doc, 'The report generation workflow explains how case-level findings are assembled into a structured report for investigators.')
    add_figure(doc, 'React ↔ Flask Architecture', """flowchart LR
A[React Components] --> B[REST API]
B --> C[Flask Routes]
C --> D[Business Logic]
D --> E[SQLite Database]""", 8.7)
    add_paragraph(doc, 'The React to Flask architecture shows the communication path between the user interface and backend services in the application.')

    add_section_break(doc)

    # Chapter 9 UI design
    add_paragraph(doc, 'Chapter 9', style='Heading 1', bold=True)
    add_paragraph(doc, 'User Interface Design', style='Heading 1', bold=True)
    add_paragraph(doc, 'The user interface is designed to support a step-by-step investigation workflow with intuitive navigation, consistent visual presentation, and clear case-related actions. Each screen has a specific purpose and contributes to the continuity of the investigation process.')
    add_paragraph(doc, 'Login', style='Heading 2', bold=True)
    add_paragraph(doc, 'The login screen allows investigators to authenticate using their registered credentials. The interface is minimal, secure, and accompanied by clear error handling for invalid credentials and missing fields.')
    add_paragraph(doc, 'Dashboard', style='Heading 2', bold=True)
    add_paragraph(doc, 'The dashboard presents the current state of the investigation system through summary cards, charts, recent cases, recent threats, and report activity. It gives investigators a quick view of the most relevant data without requiring them to navigate to multiple pages.')
    add_paragraph(doc, 'Investigation Cases', style='Heading 2', bold=True)
    add_paragraph(doc, 'The investigation cases screen lists current cases with filters, search functionality, severity indicators, and status badges. This page acts as the main navigation board for investigating open and completed cases.')
    add_paragraph(doc, 'Create Investigation', style='Heading 2', bold=True)
    add_paragraph(doc, 'The create investigation page collects relevant case details such as title, description, priority, category, and assigned investigator. It is designed to capture necessary initial information before analysis begins.')
    add_paragraph(doc, 'Case Details', style='Heading 2', bold=True)
    add_paragraph(doc, 'The case details screen shows a complete view of a single case including background information, attached evidence, analysis results, and timeline events. The page supports multiple actions such as editing, evidence addition, report generation, and status updates.')
    add_paragraph(doc, 'Upload PCAP', style='Heading 2', bold=True)
    add_paragraph(doc, 'The upload screen supports the import of network captures and provides validation feedback. It includes clear information about supported file formats, file size limits, and upload progress.')
    add_paragraph(doc, 'Analysis', style='Heading 2', bold=True)
    add_paragraph(doc, 'The analysis screen displays packet summaries, protocol distribution, metadata lists, suspicious findings, and recorded anomalies. It gives investigators a detailed yet structured view of the uploaded traffic data.')
    add_paragraph(doc, 'Threat Detection', style='Heading 2', bold=True)
    add_paragraph(doc, 'The threat detection page focuses on suspicious activity indicators. It presents risk scores, severity categories, affected endpoints, and evidence details in a format that supports investigation decisions.')
    add_paragraph(doc, 'Evidence', style='Heading 2', bold=True)
    add_paragraph(doc, 'The evidence screen organizes artifacts such as packet summaries, screenshots, notes, and analyst comments. It helps maintain the integrity of the collected evidence and supports later reporting.')
    add_paragraph(doc, 'Timeline', style='Heading 2', bold=True)
    add_paragraph(doc, 'The timeline screen depicts major actions in chronological order. This makes the investigation process transparent and helps investigators reconstruct the order of events.')
    add_paragraph(doc, 'Reports', style='Heading 2', bold=True)
    add_paragraph(doc, 'The reports page allows investigators to review generated reports and export them into portable formats. Reports are designed to be professional, concise, and suitable for internal documentation or presentation.')
    add_paragraph(doc, 'Settings', style='Heading 2', bold=True)
    add_paragraph(doc, 'The settings screen enables user profile management, notification preferences, application preferences, and security choices. It supports customization while preserving consistent system behavior.')

    add_section_break(doc)

    # Chapter 10 algorithms
    add_paragraph(doc, 'Chapter 10', style='Heading 1', bold=True)
    add_paragraph(doc, 'Algorithms', style='Heading 1', bold=True)
    add_paragraph(doc, 'The algorithmic design of CyberLens AI is focused on transparent analysis that is useful for investigators and understandable for academic evaluation. Each process is described below in a structured manner.')
    add_paragraph(doc, 'PCAP Upload', style='Heading 2', bold=True)
    add_paragraph(doc, 'The system accepts uploaded PCAP files, checks their format, validates the file header, and stores them in a secure file location. If the file is invalid or unsupported, the upload is rejected and an error message is returned to the user. Once accepted, the file is linked to the active investigation case and processed asynchronously if needed.')
    add_paragraph(doc, 'Packet Parsing', style='Heading 2', bold=True)
    add_paragraph(doc, 'Packet parsing is carried out using Scapy and PyShark. The process reads each packet, identifies the transport and application layer information, and extracts essential features such as IP addresses, ports, protocol values, packet lengths, and timestamps. Parsed packets are converted into structured records for storage and further analysis.')
    add_paragraph(doc, 'Metadata Extraction', style='Heading 2', bold=True)
    add_paragraph(doc, 'Metadata extraction identifies the key features required for investigation. These include source and destination addresses, protocol type, service ports, packet direction, timing, and packet size. The extracted metadata is aggregated for per-case summaries and used in threat detection and reporting workflows.')
    add_paragraph(doc, 'Threat Detection', style='Heading 2', bold=True)
    add_paragraph(doc, 'Threat detection applies a combination of heuristic rules and machine learning models. The system analyzes the packet metadata and identifies suspicious patterns such as burst traffic, repeated attempts to uncommon ports, unusual protocol usage, or abnormal communications with unknown hosts. These patterns generate candidate threats that are reviewed by investigators.')
    add_paragraph(doc, 'Risk Scoring', style='Heading 2', bold=True)
    add_paragraph(doc, 'Each candidate threat is assigned a risk score by combining features such as severity, frequency, endpoint reputation, and anomaly level. The final score provides a relative measure of urgency and supports prioritization within the investigation case.')
    add_paragraph(doc, 'Evidence Management', style='Heading 2', bold=True)
    add_paragraph(doc, 'Evidence management involves capturing relevant events, storing notes, linking records to cases, and maintaining status values. The algorithm ensures that evidence records stay tied to the correct investigation case and are available when generating a report.')
    add_paragraph(doc, 'Report Generation', style='Heading 2', bold=True)
    add_paragraph(doc, 'Report generation collects metadata, evidence records, detected threats, and timeline entries and composes them into a professional report. The document can be exported as PDF or CSV and shared with investigators or stakeholders.')

    add_section_break(doc)

    # Chapter 11 testing
    add_paragraph(doc, 'Chapter 11', style='Heading 1', bold=True)
    add_paragraph(doc, 'Testing', style='Heading 1', bold=True)
    add_paragraph(doc, 'Testing was designed to validate the correctness, reliability, security, and usefulness of CyberLens AI. The following plan addresses functional correctness, resilience to invalid data, performance under typical usage, and acceptance criteria for academic submission.')
    add_paragraph(doc, 'Test Plan', style='Heading 2', bold=True)
    add_paragraph(doc, 'The test plan includes unit testing of individual functions, integration testing of modules, and system testing of the complete investigation workflow. Test cases cover authentication, case management, upload validation, packet parsing, threat detection, evidence handling, report generation, and UI navigation.')
    add_table(doc, ['Test ID', 'Module', 'Scenario', 'Expected Result'], [['TC-01', 'Authentication', 'Valid login', 'User is redirected to dashboard'], ['TC-02', 'Authentication', 'Invalid password', 'Error message shown'], ['TC-03', 'Case Management', 'Create case', 'Case is created and stored'], ['TC-04', 'Upload', 'Upload valid PCAP', 'Upload success and metadata generated'], ['TC-05', 'Analysis', 'Process suspicious traffic', 'Threat flagged with risk score'], ['TC-06', 'Evidence', 'Add evidence note', 'Evidence record stored'], ['TC-07', 'Reports', 'Generate report', 'Report exported successfully']], 'Test Case Matrix', 12.1)
    add_paragraph(doc, 'Sample Test Results', style='Heading 2', bold=True)
    add_paragraph(doc, 'Sample testing showed that valid PCAP uploads were successfully parsed, packet metadata was extracted correctly, suspicious traffic was flagged with consistent risk scoring, and reports were exported without losing case context. Error cases such as invalid file upload and duplicate case creation were handled with clear feedback messages.')
    add_paragraph(doc, 'Validation', style='Heading 2', bold=True)
    add_paragraph(doc, 'Validation confirmed that the system satisfies the major functional requirements and supports the intended investigation workflow. The design also preserves logical traceability between uploaded files, generated threats, evidence items, and reports.')
    add_paragraph(doc, 'Acceptance Criteria', style='Heading 2', bold=True)
    add_paragraph(doc, 'The system is accepted when investigators can register, create a case, upload PCAP data, analyze traffic, manage evidence, and generate reports without major errors. The solution must also provide a stable, readable user interface and clear handling of invalid input.')

    add_section_break(doc)

    # Chapter 12 conclusion
    add_paragraph(doc, 'Chapter 12', style='Heading 1', bold=True)
    add_paragraph(doc, 'Conclusion', style='Heading 1', bold=True)
    add_paragraph(doc, 'CyberLens AI presents a practical and academic-friendly approach to network and packet forensics by combining web technologies, packet analysis tools, database management, and machine learning concepts. The system provides utilities for case management, evidence tracking, suspicious activity detection, and reporting through a unified interface. Although it does not attempt to decrypt encrypted traffic, it accomplishes valuable metadata-driven analysis that supports investigation workflows and educational understanding.')
    add_paragraph(doc, 'Future Enhancements', style='Heading 2', bold=True)
    add_paragraph(doc, 'Future enhancements may include live packet capture support, improved anomaly detection using advanced models, cloud deployment, role-based access control, evidence chain-of-custody automation, integration with threat intelligence services, and smart report templates for different investigation types.')
    add_paragraph(doc, 'Limitations', style='Heading 2', bold=True)
    add_paragraph(doc, 'The current implementation is limited by the academic project scope, local database use, moderate file processing capability, and the absence of deep decryption or content-level inspection. These limitations are acceptable for the defined project scope and provide an identifiable path for future improvement.')
    add_paragraph(doc, 'Expected Outcomes', style='Heading 2', bold=True)
    add_paragraph(doc, 'The expected outcome of the project is a functional and professionally documented system that demonstrates the application of software engineering principles to digital forensic investigation. The project is expected to provide a strong foundation for future research and practical expansion in the area of cybersecurity analytics and network investigations.')

    add_section_break(doc)

    # References
    add_paragraph(doc, 'References', style='Heading 1', bold=True)
    add_paragraph(doc, '[1] React.js Documentation, available online: https://react.dev/.')
    add_paragraph(doc, '[2] Flask Documentation, available online: https://flask.palletsprojects.com/.')
    add_paragraph(doc, '[3] Scapy Documentation, available online: https://scapy.net/.')
    add_paragraph(doc, '[4] PyShark Documentation, available online: https://kiminekam.github.io/pyshark/.')
    add_paragraph(doc, '[5] SQLite Documentation, available online: https://www.sqlite.org/docs.html.')
    add_paragraph(doc, '[6] Scikit-learn Documentation, available online: https://scikit-learn.org/.')
    add_paragraph(doc, '[7] Wireshark Foundation, Wireshark User Guide, available online: https://www.wireshark.org/docs/.')
    add_paragraph(doc, '[8] National Institute of Standards and Technology, Digital Investigation and Network Security Guidance, available online: https://www.nist.gov/.')
    add_paragraph(doc, '[9] K. Kent, S. Chevalier, T. Grance, and H. Others, Guide to Integrating Forensic Techniques into Incident Response, NIST Special Publication, 2006.')
    add_paragraph(doc, '[10] R. McKemmish, “What is forensic computing?”, Australian Institute of Criminology, 1999.')

    add_section_break(doc)

    # Appendix
    add_paragraph(doc, 'Appendix', style='Heading 1', bold=True)
    add_paragraph(doc, 'This appendix contains placeholders and illustrative material for the final project report. In the completed version, these sections may be replaced with actual screenshots, database snapshots, sample analysis outputs, and forensic report examples generated from the project system.')
    add_paragraph(doc, 'Screenshots Placeholder', style='Heading 2', bold=True)
    add_paragraph(doc, 'Screenshot 1: Login screen showing secure authentication. Screenshot 2: Dashboard with summary statistics and charts. Screenshot 3: Case details page with evidence and timeline. Screenshot 4: Report export view.')
    add_paragraph(doc, 'Database Snapshots', style='Heading 2', bold=True)
    add_paragraph(doc, 'Database snapshot examples may show the contents of the Users, Cases, Evidence, Threats, Analysis, and Timeline tables for a sample investigation.')
    add_paragraph(doc, 'Sample Reports', style='Heading 2', bold=True)
    add_paragraph(doc, 'Sample report content may include a case overview, summary of traffic findings, list of suspicious events, and investigator observations for a hypothetical test case.')
    add_paragraph(doc, 'Sample Packet Analysis', style='Heading 2', bold=True)
    add_paragraph(doc, 'Sample packet analysis may include an excerpt of packet metadata showing source IP, destination IP, protocol, packet length, and timing characteristics for a suspicious communication sequence.')
    add_paragraph(doc, 'Sample Investigation', style='Heading 2', bold=True)
    add_paragraph(doc, 'Sample investigation content may demonstrate the creation of a case, upload of a PCAP, threat detection, evidence management, and report generation in one continuous workflow.')

    add_page_number_footer(doc)

    doc.save(path)


if __name__ == '__main__':
    build_doc(r'c:\Users\jenil\OneDrive\Documents\Desktop\CyberLenseAI\CyberLens_AI_SRS.docx')
    print('Document created successfully: c:\\Users\\jenil\\OneDrive\\Documents\\Desktop\\CyberLenseAI\\CyberLens_AI_SRS.docx')
