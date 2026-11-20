import io
from datetime import datetime
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT

from app.schemas.analysis import FullAnalysisResponse

def generate_pdf_report(analysis: FullAnalysisResponse) -> bytes:
    """
    Generates a high-quality, publication-grade PDF report summarizing 
    the full ReviewGuard AI analysis using ReportLab.
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36
    )

    styles = getSampleStyleSheet()
    
    # Custom color palette matching the UI
    primary_color = colors.HexColor("#1e1b4b")   # Dark Navy
    accent_blue = colors.HexColor("#2563eb")     # Electric Blue
    accent_purple = colors.HexColor("#7c3aed")   # Purple
    light_bg = colors.HexColor("#f8fafc")        # Light Slate
    border_color = colors.HexColor("#cbd5e1")
    text_dark = colors.HexColor("#0f172a")

    title_style = ParagraphStyle(
        "DocTitle",
        parent=styles["Heading1"],
        fontName="Helvetica-Bold",
        fontSize=22,
        leading=26,
        textColor=primary_color,
        alignment=TA_LEFT
    )

    subtitle_style = ParagraphStyle(
        "DocSubtitle",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=10,
        leading=14,
        textColor=colors.HexColor("#64748b")
    )

    section_heading = ParagraphStyle(
        "SectionHeading",
        parent=styles["Heading2"],
        fontName="Helvetica-Bold",
        fontSize=13,
        leading=17,
        textColor=accent_blue,
        spaceBefore=12,
        spaceAfter=6
    )

    body_style = ParagraphStyle(
        "BodyTextCustom",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=8.5,
        leading=12,
        textColor=text_dark
    )

    body_bold = ParagraphStyle(
        "BodyBold",
        parent=body_style,
        fontName="Helvetica-Bold"
    )

    story = []

    # 1. Header
    story.append(Paragraph("ReviewGuard AI — Product Review Veracity & Quality Audit", title_style))
    story.append(Spacer(1, 4))
    header_meta = f"Product: <b>{analysis.product_name}</b> | Report ID: {analysis.analysis_id} | Date: {datetime.now().strftime('%Y-%m-%d %H:%M UTC')}"
    story.append(Paragraph(header_meta, subtitle_style))
    story.append(Spacer(1, 10))
    story.append(HRFlowable(width="100%", thickness=1.5, color=accent_blue, spaceBefore=2, spaceAfter=12))

    # 2. Tri-Axis Executive Scorecard
    story.append(Paragraph("1. Tri-Axis Executive Assessment", section_heading))
    summary = analysis.summary

    tri_axis_data = [
        [
            Paragraph("<b>Evaluation Dimension</b>", body_bold),
            Paragraph("<b>Assessment / Status</b>", body_bold),
            Paragraph("<b>Score / Scale</b>", body_bold),
            Paragraph("<b>Diagnostic Interpretation</b>", body_bold)
        ],
        [
            Paragraph("<b>Review Trustworthiness</b>", body_bold),
            Paragraph(summary.review_trust_category, body_style),
            Paragraph(f"<b>{summary.review_trust_score:.1f} / 100</b>", body_bold),
            Paragraph("Calibrated veracity based on machine learning, linguistic markers, and duplicate analysis.", body_style)
        ],
        [
            Paragraph("<b>Reported Product Quality</b>", body_bold),
            Paragraph(summary.reported_quality_category, body_style),
            Paragraph(f"<b>{summary.reported_product_quality_score:.1f} / 100</b>", body_bold),
            Paragraph("Customer-reported performance with suspicious review down-weighting.", body_style)
        ],
        [
            Paragraph("<b>Product Physical Authenticity</b>", body_bold),
            Paragraph(summary.product_authenticity_status, body_bold),
            Paragraph("Independent Evidence", body_style),
            Paragraph(summary.product_authenticity_notes, body_style)
        ]
    ]

    t_tri = Table(tri_axis_data, colWidths=[120, 140, 75, 205])
    t_tri.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#e2e8f0")),
        ("TEXTCOLOR", (0, 0), (-1, 0), text_dark),
        ("ALIGN", (0, 0), (-1, -1), "LEFT"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("GRID", (0, 0), (-1, -1), 0.5, border_color),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, light_bg]),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))
    story.append(t_tri)
    story.append(Spacer(1, 14))

    # 3. Aggregate Review Metrics Table
    story.append(Paragraph("2. Review Ingestion & Classification Metrics", section_heading))
    metrics_data = [
        [
            Paragraph("<b>Total Reviews</b>", body_bold),
            Paragraph("<b>Likely Genuine</b>", body_bold),
            Paragraph("<b>Suspicious (Manipulated)</b>", body_bold),
            Paragraph("<b>Uncertain Margin</b>", body_bold),
            Paragraph("<b>Misleading Positives</b>", body_bold)
        ],
        [
            Paragraph(str(summary.total_reviews), body_style),
            Paragraph(f"{summary.genuine_count} ({(summary.genuine_count/max(summary.total_reviews,1))*100:.1f}%)", body_style),
            Paragraph(f"{summary.suspicious_count} ({(summary.suspicious_count/max(summary.total_reviews,1))*100:.1f}%)", body_style),
            Paragraph(str(summary.uncertain_count), body_style),
            Paragraph(str(summary.suspicious_positives_count), body_bold)
        ]
    ]
    t_metrics = Table(metrics_data, colWidths=[108, 108, 114, 105, 105])
    t_metrics.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#f1f5f9")),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("GRID", (0, 0), (-1, -1), 0.5, border_color),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
    ]))
    story.append(t_metrics)
    story.append(Spacer(1, 14))

    # 4. Aspect Contradictions Table (if any)
    if analysis.contradictions:
        story.append(Paragraph("3. Confirmed Aspect Claim Contradictions", section_heading))
        contra_data = [
            [
                Paragraph("<b>Aspect</b>", body_bold),
                Paragraph("<b>Claim A (Review)</b>", body_bold),
                Paragraph("<b>Claim B (Conflicting)</b>", body_bold),
                Paragraph("<b>Severity</b>", body_bold),
                Paragraph("<b>Factual Discrepancy Analysis</b>", body_bold)
            ]
        ]
        for c in analysis.contradictions[:4]:
            contra_data.append([
                Paragraph(c.aspect, body_bold),
                Paragraph(f"<b>{c.review_id_a}:</b> {c.claim_a[:75]}...", body_style),
                Paragraph(f"<b>{c.review_id_b}:</b> {c.claim_b[:75]}...", body_style),
                Paragraph(c.severity, body_bold),
                Paragraph(c.explanation[:120] + "...", body_style)
            ])
        t_contra = Table(contra_data, colWidths=[65, 125, 125, 55, 170])
        t_contra.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#fee2e2")),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#fca5a5")),
            ("TOPPADDING", (0, 0), (-1, -1), 5),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ]))
        story.append(t_contra)
        story.append(Spacer(1, 14))

    # 5. Suspicious Positive Reviews (Misleading Positives)
    if analysis.suspicious_positives:
        story.append(Paragraph("4. Flagged Misleading Positive Reviews", section_heading))
        sus_pos_data = [
            [
                Paragraph("<b>Review ID</b>", body_bold),
                Paragraph("<b>Rating</b>", body_bold),
                Paragraph("<b>Excerpt</b>", body_bold),
                Paragraph("<b>Evidence & Identified Manipulation Triggers</b>", body_bold)
            ]
        ]
        for sp in analysis.suspicious_positives[:5]:
            sus_pos_data.append([
                Paragraph(sp.review_id, body_bold),
                Paragraph(f"{sp.rating or 'N/A'}★", body_style),
                Paragraph(f"\"{sp.review_text[:90]}...\"", body_style),
                Paragraph("; ".join(sp.suspicion_indicators), body_style)
            ])
        t_sus = Table(sus_pos_data, colWidths=[60, 45, 185, 250])
        t_sus.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#fef3c7")),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#fde68a")),
            ("TOPPADDING", (0, 0), (-1, -1), 5),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ]))
        story.append(t_sus)
        story.append(Spacer(1, 14))

    # 6. Detailed Individual Reviews (Sample of top 10)
    story.append(Paragraph("5. Individual Review Breakdown (Sample)", section_heading))
    rev_table_data = [
        [
            Paragraph("<b>ID</b>", body_bold),
            Paragraph("<b>Rating</b>", body_bold),
            Paragraph("<b>Review Excerpt</b>", body_bold),
            Paragraph("<b>Sentiment</b>", body_bold),
            Paragraph("<b>Authenticity</b>", body_bold),
            Paragraph("<b>Confidence</b>", body_bold),
            Paragraph("<b>Classification Reasoning</b>", body_bold)
        ]
    ]

    for r in analysis.reviews[:8]:
        auth_color = "#16a34a" if r.authenticity_label == "Likely Genuine" else ("#dc2626" if r.authenticity_label == "Suspicious" else "#d97706")
        rev_table_data.append([
            Paragraph(r.review_id, body_bold),
            Paragraph(f"{r.rating or '-'}★", body_style),
            Paragraph(f"\"{r.review_text[:65]}...\"", body_style),
            Paragraph(r.sentiment, body_style),
            Paragraph(f"<font color='{auth_color}'><b>{r.authenticity_label}</b></font>", body_style),
            Paragraph(f"{r.calibrated_confidence*100:.1f}%", body_style),
            Paragraph(r.explanation[:95] + "...", body_style)
        ])

    t_rev = Table(rev_table_data, colWidths=[40, 40, 130, 50, 75, 55, 150])
    t_rev.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#f1f5f9")),
        ("GRID", (0, 0), (-1, -1), 0.5, border_color),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, light_bg]),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ]))
    story.append(t_rev)
    story.append(Spacer(1, 14))

    # 7. Scientific Methodology Disclaimer
    disclaimer_text = (
        "<b>Scientific Evaluation & Assurance:</b> Predictions are generated using a machine-learning ensemble "
        "(Calibrated Logistic Regression, Random Forest, XGBoost, and Contextual Classifiers) validated against "
        "gold-standard benchmarks (Ott Deceptive Opinion Corpus & Amazon Fake Review Benchmark). An uncertainty margin "
        f"({summary.uncertain_count} cases) ensures ambiguous reviews are not falsely condemned. "
        "Product Physical Authenticity is evaluated strictly against independent manufacturer/distributor records "
        "and is never inferred from customer sentiment alone."
    )
    story.append(Paragraph(disclaimer_text, subtitle_style))

    doc.build(story)
    pdf_bytes = buffer.getvalue()
    buffer.close()
    return pdf_bytes
