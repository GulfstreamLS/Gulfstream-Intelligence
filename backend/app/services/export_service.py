import io
from typing import Any

from docx import Document as DocxDocument
from pptx import Presentation
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN
from pptx.util import Inches, Pt
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import (
    HRFlowable,
    KeepTogether,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

from app.services.storage_service import storage_service

# ── PDF colour palette (light theme) ──────────────────────────────────────────
_P_INDIGO       = colors.HexColor("#6366F1")
_P_INDIGO_DARK  = colors.HexColor("#4338CA")
_P_INDIGO_LIGHT = colors.HexColor("#EEF2FF")
_P_SLATE_800    = colors.HexColor("#1E293B")
_P_SLATE_600    = colors.HexColor("#475569")
_P_SLATE_400    = colors.HexColor("#94A3B8")
_P_SLATE_50     = colors.HexColor("#F8FAFC")
_P_BORDER       = colors.HexColor("#E2E8F0")
_P_WHITE        = colors.white

_P_SEV = {
    "Critical": colors.HexColor("#EF4444"),
    "High":     colors.HexColor("#F97316"),
    "Medium":   colors.HexColor("#D97706"),
    "Low":      colors.HexColor("#059669"),
}
_P_SEV_BG = {
    "Critical": colors.HexColor("#FEF2F2"),
    "High":     colors.HexColor("#FFF7ED"),
    "Medium":   colors.HexColor("#FFFBEB"),
    "Low":      colors.HexColor("#F0FDF4"),
}

# ── PPT colour palette (light theme) ──────────────────────────────────────────
_INDIGO       = RGBColor(0x63, 0x66, 0xF1)   # #6366f1
_INDIGO_LIGHT = RGBColor(0xEE, 0xF2, 0xFF)   # #eef2ff
_INDIGO_DARK  = RGBColor(0x43, 0x38, 0xCA)   # #4338ca
_SLATE_800    = RGBColor(0x1E, 0x29, 0x3B)
_SLATE_600    = RGBColor(0x47, 0x55, 0x69)
_SLATE_400    = RGBColor(0x94, 0xA3, 0xB8)
_WHITE        = RGBColor(0xFF, 0xFF, 0xFF)
_BG           = RGBColor(0xFA, 0xFB, 0xFF)   # near-white slide background
_RED          = RGBColor(0xEF, 0x44, 0x44)
_RED_LIGHT    = RGBColor(0xFE, 0xF2, 0xF2)
_ORANGE       = RGBColor(0xF9, 0x73, 0x16)
_ORANGE_LIGHT = RGBColor(0xFF, 0xF7, 0xED)
_YELLOW       = RGBColor(0xD9, 0x77, 0x06)
_YELLOW_LIGHT = RGBColor(0xFF, 0xFB, 0xEB)
_GREEN        = RGBColor(0x05, 0x96, 0x69)
_GREEN_LIGHT  = RGBColor(0xF0, 0xFD, 0xF4)

_SEV_COLOR    = {"Critical": _RED,    "High": _ORANGE,    "Medium": _YELLOW,    "Low": _GREEN}
_SEV_BG_COLOR = {"Critical": _RED_LIGHT, "High": _ORANGE_LIGHT, "Medium": _YELLOW_LIGHT, "Low": _GREEN_LIGHT}

# Slide: 13.33" × 7.5"
_SW = Inches(13.33)
_SH = Inches(7.5)


# ── PPT helpers ────────────────────────────────────────────────────────────────

def _solid_bg(slide: Any, rgb: RGBColor) -> None:
    fill = slide.background.fill
    fill.solid()
    fill.fore_color.rgb = rgb


def _add_rect(slide: Any, left: float, top: float, w: float, h: float,
              fill: RGBColor, line: RGBColor | None = None) -> Any:
    shape = slide.shapes.add_shape(1, int(left), int(top), int(w), int(h))
    shape.fill.solid()
    shape.fill.fore_color.rgb = fill
    if line:
        shape.line.color.rgb = line
        shape.line.width = Pt(0.5)
    else:
        shape.line.fill.background()
    return shape


def _add_text(slide: Any, text: str,
              left: float, top: float, w: float, h: float,
              size: int, bold: bool = False,
              color: RGBColor = _SLATE_800,
              align: PP_ALIGN = PP_ALIGN.LEFT) -> Any:
    txb = slide.shapes.add_textbox(int(left), int(top), int(w), int(h))
    tf = txb.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.alignment = align
    run = p.add_run()
    run.text = text
    run.font.size = Pt(size)
    run.font.bold = bold
    run.font.color.rgb = color
    return txb


def _blank(prs: Presentation) -> Any:
    return prs.slides.add_slide(prs.slide_layouts[6])


# ── PDF helpers ────────────────────────────────────────────────────────────────

def _make_styles() -> dict[str, ParagraphStyle]:
    base = getSampleStyleSheet()
    return {
        "doc_title": ParagraphStyle(
            "DocTitle", parent=base["Normal"],
            fontSize=22, fontName="Helvetica-Bold",
            textColor=_P_INDIGO_DARK, leading=28,
        ),
        "doc_sub": ParagraphStyle(
            "DocSub", parent=base["Normal"],
            fontSize=12, fontName="Helvetica",
            textColor=_P_SLATE_600, leading=16, spaceAfter=4,
        ),
        "auth_label": ParagraphStyle(
            "AuthLabel", parent=base["Normal"],
            fontSize=10, fontName="Helvetica-Bold",
            textColor=_P_INDIGO, leading=14,
        ),
        "section_title": ParagraphStyle(
            "SectionTitle", parent=base["Normal"],
            fontSize=13, fontName="Helvetica-Bold",
            textColor=_P_SLATE_800, leading=18, spaceBefore=6,
        ),
        "summary_body": ParagraphStyle(
            "SummaryBody", parent=base["Normal"],
            fontSize=10, fontName="Helvetica",
            textColor=_P_SLATE_600, leading=16,
        ),
        "gap_title": ParagraphStyle(
            "GapTitle", parent=base["Normal"],
            fontSize=11, fontName="Helvetica-Bold",
            textColor=_P_SLATE_800, leading=15,
        ),
        "gap_label": ParagraphStyle(
            "GapLabel", parent=base["Normal"],
            fontSize=8, fontName="Helvetica-Bold",
            textColor=_P_INDIGO, leading=11,
        ),
        "gap_body": ParagraphStyle(
            "GapBody", parent=base["Normal"],
            fontSize=9, fontName="Helvetica",
            textColor=_P_SLATE_600, leading=14,
        ),
        "action_title": ParagraphStyle(
            "ActionTitle", parent=base["Normal"],
            fontSize=10, fontName="Helvetica-Bold",
            textColor=_P_SLATE_800, leading=14,
        ),
        "action_body": ParagraphStyle(
            "ActionBody", parent=base["Normal"],
            fontSize=9, fontName="Helvetica",
            textColor=_P_SLATE_600, leading=13,
        ),
        "footer": ParagraphStyle(
            "Footer", parent=base["Normal"],
            fontSize=8, fontName="Helvetica",
            textColor=_P_SLATE_400, alignment=TA_CENTER, leading=12,
        ),
    }


def _header_banner(filename: str, page_w: float, st: dict) -> list:
    """Full-width cover banner for the PDF."""
    title_para = Paragraph("Regulatory Analysis Report", st["doc_title"])
    file_para  = Paragraph(filename, st["doc_sub"])
    data = [[title_para], [file_para]]
    t = Table(data, colWidths=[page_w])
    t.setStyle(TableStyle([
        ("BACKGROUND",    (0, 0), (-1, -1), _P_INDIGO_LIGHT),
        ("TOPPADDING",    (0, 0), (-1, -1), 18),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("LEFTPADDING",   (0, 0), (-1, -1), 20),
        ("RIGHTPADDING",  (0, 0), (-1, -1), 20),
        ("LINEBELOW",     (0, -1), (-1, -1), 2.5, _P_INDIGO),
    ]))
    return [t, Spacer(1, 16)]


def _auth_header(auth: str, page_w: float, st: dict) -> list:
    data = [[Paragraph(f"Authority Context: {auth}", st["auth_label"])]]
    t = Table(data, colWidths=[page_w])
    t.setStyle(TableStyle([
        ("BACKGROUND",    (0, 0), (-1, -1), _P_INDIGO_LIGHT),
        ("TOPPADDING",    (0, 0), (-1, -1), 10),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
        ("LEFTPADDING",   (0, 0), (-1, -1), 14),
        ("RIGHTPADDING",  (0, 0), (-1, -1), 14),
        ("LINEAFTER",     (0, 0), (0, -1),  3, _P_INDIGO),
    ]))
    return [t, Spacer(1, 10)]


def _summary_card(summary: str, page_w: float, st: dict) -> list:
    label = Paragraph("EXECUTIVE SUMMARY", st["gap_label"])
    body  = Paragraph(summary, st["summary_body"])
    data  = [[label], [body]]
    t = Table(data, colWidths=[page_w - 10])
    t.setStyle(TableStyle([
        ("BACKGROUND",    (0, 0), (-1, -1), _P_SLATE_50),
        ("TOPPADDING",    (0, 0), (-1, -1), 10),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
        ("LEFTPADDING",   (0, 0), (-1, -1), 14),
        ("RIGHTPADDING",  (0, 0), (-1, -1), 14),
        ("BOX",           (0, 0), (-1, -1), 0.5, _P_BORDER),
        ("LINEAFTER",     (0, 0), (0, -1),  3, _P_INDIGO),
    ]))
    return [t, Spacer(1, 14)]


def _gap_card(gap: dict, page_w: float, st: dict) -> Any:
    sev      = gap.get("severity", "Low")
    sev_c    = _P_SEV.get(sev, _P_SEV["Low"])
    sev_bg   = _P_SEV_BG.get(sev, _P_SEV_BG["Low"])
    bar_w    = 5
    cont_w   = page_w - bar_w - 10
    sev_tag  = Paragraph(
        f'<font color="{sev_c.hexval() if hasattr(sev_c,"hexval") else "#059669"}"><b>{sev.upper()}</b></font>',
        st["gap_label"],
    )
    title_p  = Paragraph(gap.get("title", ""), st["gap_title"])
    desc_p   = Paragraph(
        f'<i>Observation:</i> {gap.get("description", "")}', st["gap_body"]
    )
    action_p = Paragraph(
        f'<font color="#4338CA">→ Strategic Action:</font> {gap.get("recommended_action", "")}',
        st["gap_body"],
    )
    # Title row: title left, severity tag right
    title_row = Table(
        [[title_p, sev_tag]],
        colWidths=[cont_w - 70, 70],
    )
    title_row.setStyle(TableStyle([
        ("VALIGN",        (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING",    (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
        ("LEFTPADDING",   (0, 0), (-1, -1), 0),
        ("RIGHTPADDING",  (0, 0), (-1, -1), 0),
        ("BACKGROUND",    (1, 0), (1, 0), sev_bg),
        ("BOX",           (1, 0), (1, 0), 0.5, sev_c),
        ("ALIGN",         (1, 0), (1, 0), "CENTER"),
    ]))

    content = [title_row, Spacer(1, 5), desc_p, Spacer(1, 4), action_p]
    data = [["", content]]
    t = Table(data, colWidths=[bar_w, cont_w])
    t.setStyle(TableStyle([
        ("BACKGROUND",    (0, 0), (0, -1), sev_c),
        ("BACKGROUND",    (1, 0), (1, -1), _P_WHITE),
        ("BOX",           (1, 0), (1, -1), 0.5, _P_BORDER),
        ("TOPPADDING",    (0, 0), (-1, -1), 10),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
        ("LEFTPADDING",   (1, 0), (1, -1),  12),
        ("RIGHTPADDING",  (1, 0), (1, -1),  12),
        ("LEFTPADDING",   (0, 0), (0, -1),  0),
        ("RIGHTPADDING",  (0, 0), (0, -1),  0),
        ("VALIGN",        (0, 0), (-1, -1), "TOP"),
    ]))
    return KeepTogether([t, Spacer(1, 7)])


def _action_card(action: dict, idx: int, page_w: float, st: dict) -> Any:
    pri_map  = {"High": _P_SEV["Critical"], "Medium": _P_SEV["Medium"], "Low": _P_SEV["Low"]}
    pri      = action.get("priority", "Medium")
    pri_c    = pri_map.get(pri, _P_SEV["Low"])
    num_para = Paragraph(f"<b>{idx + 1}</b>", ParagraphStyle(
        "Num", parent=st["action_title"],
        textColor=pri_c, alignment=TA_CENTER, fontSize=13,
    ))
    title_p  = Paragraph(action.get("title", ""), st["action_title"])
    desc_p   = Paragraph(action.get("description", ""), st["action_body"])
    pri_para = Paragraph(
        f'<font color="{pri_c.hexval() if hasattr(pri_c,"hexval") else "#EF4444"}"><b>{pri} Priority</b></font>',
        st["gap_label"],
    )
    data = [[num_para, [pri_para, Spacer(1, 3), title_p, Spacer(1, 3), desc_p]]]
    t = Table(data, colWidths=[30, page_w - 40])
    t.setStyle(TableStyle([
        ("BACKGROUND",    (0, 0), (-1, -1), _P_SLATE_50),
        ("BOX",           (0, 0), (-1, -1), 0.5, _P_BORDER),
        ("TOPPADDING",    (0, 0), (-1, -1), 10),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
        ("LEFTPADDING",   (0, 0), (-1, -1), 10),
        ("RIGHTPADDING",  (0, 0), (-1, -1), 10),
        ("VALIGN",        (0, 0), (-1, -1), "TOP"),
        ("LINEAFTER",     (0, 0), (0, -1), 1, _P_BORDER),
    ]))
    return KeepTogether([t, Spacer(1, 6)])


def _section_header(label: str, page_w: float, st: dict) -> list:
    data = [[Paragraph(label, st["section_title"])]]
    t = Table(data, colWidths=[page_w])
    t.setStyle(TableStyle([
        ("LINEBELOW",     (0, 0), (-1, -1), 1.5, _P_INDIGO),
        ("TOPPADDING",    (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("LEFTPADDING",   (0, 0), (-1, -1), 0),
        ("RIGHTPADDING",  (0, 0), (-1, -1), 0),
    ]))
    return [t, Spacer(1, 8)]


class ExportService:
    # ── PDF ───────────────────────────────────────────────────────────────────
    async def generate_pdf(self, analysis_data: dict[str, Any], filename: str) -> str:
        buffer = io.BytesIO()
        margin = 0.75 * inch
        doc    = SimpleDocTemplate(
            buffer, pagesize=letter,
            leftMargin=margin, rightMargin=margin,
            topMargin=0.75 * inch, bottomMargin=0.75 * inch,
        )
        page_w = letter[0] - 2 * margin
        st     = _make_styles()
        elems: list = []

        elems += _header_banner(filename, page_w, st)

        for auth, data in analysis_data.items():
            elems += _auth_header(auth, page_w, st)
            elems += _summary_card(data.get("summary", "N/A"), page_w, st)

            gaps    = data.get("gaps", [])
            actions = data.get("actions", [])

            if gaps:
                elems += _section_header("Detailed Findings & Regulatory Risks", page_w, st)
                for gap in gaps:
                    elems.append(_gap_card(gap, page_w, st))
                elems.append(Spacer(1, 8))

            if actions:
                elems += _section_header("Strategic Recommendations & Next Steps", page_w, st)
                for i, act in enumerate(actions):
                    elems.append(_action_card(act, i, page_w, st))
            else:
                elems += _section_header("Strategic Recommendations & Next Steps", page_w, st)
                elems.append(Paragraph(
                    "Based on the analysis, it is recommended to prioritize 'Critical' gaps "
                    "before the next submission milestone. Ensure all manufacturing process "
                    "validation data is synchronized with the clinical study protocol.",
                    st["summary_body"],
                ))

            elems.append(Spacer(1, 20))
            elems.append(HRFlowable(width=page_w, thickness=0.5, color=_P_BORDER))
            elems.append(Spacer(1, 20))

        elems.append(Paragraph(
            "This report is AI-generated and for preparation purposes only. "
            "Gulfstream Intelligence · Confidential",
            st["footer"],
        ))

        doc.build(elems)
        url = await storage_service.upload_file(
            buffer.getvalue(), f"Report_{filename}.pdf", "application/pdf"
        )
        return url

    # ── DOCX ──────────────────────────────────────────────────────────────────
    async def generate_docx(self, analysis_data: dict[str, Any], filename: str) -> str:
        doc = DocxDocument()
        doc.add_heading(f"Regulatory Strategic Report: {filename}", 0)

        for auth, data in analysis_data.items():
            doc.add_heading(f"Authority Context: {auth}", level=1)
            doc.add_heading("Executive Summary", level=2)
            doc.add_paragraph(data.get("summary", "N/A"))

            if data.get("gaps"):
                doc.add_heading("Detailed Findings", level=2)
                for gap in data["gaps"]:
                    p = doc.add_paragraph(style="List Bullet")
                    p.add_run(f"{gap.get('title')} ").bold = True
                    p.add_run(f"[{gap.get('severity')}]").italic = True
                    doc.add_paragraph(f"Observation: {gap.get('description')}")
                    doc.add_paragraph(f"Recommendation: {gap.get('recommended_action')}")

            doc.add_heading("Strategic Recommendations", level=2)
            if data.get("actions"):
                for action in data["actions"]:
                    p = doc.add_paragraph(style="List Bullet")
                    p.add_run(f"[{action.get('priority', 'Medium')}] {action.get('title', '')}").bold = True
                    doc.add_paragraph(action.get("description", ""))
            else:
                doc.add_paragraph(
                    "Incorporate the missing criteria, specify precise storage temperatures, "
                    "and ensure detailed stability data is added to improve submission readiness."
                )

        buf = io.BytesIO()
        doc.save(buf)
        url = await storage_service.upload_file(
            buf.getvalue(),
            f"Report_{filename}.docx",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        )
        return url

    # ── PPTX ─────────────────────────────────────────────────────────────────
    async def generate_pptx(self, analysis_data: dict[str, Any], filename: str) -> str:
        prs = Presentation()
        prs.slide_width  = _SW
        prs.slide_height = _SH

        # ── Cover slide ───────────────────────────────────────────────────────
        slide = _blank(prs)
        _solid_bg(slide, _WHITE)

        # Left accent stripe
        _add_rect(slide, 0, 0, Inches(0.3), _SH, _INDIGO)
        # Light header band
        _add_rect(slide, Inches(0.3), 0, _SW - Inches(0.3), Inches(2.4), _INDIGO_LIGHT)

        _add_text(slide, "Regulatory Analysis Report",
                  Inches(0.7), Inches(0.5), Inches(10), Inches(1.0),
                  size=30, bold=True, color=_INDIGO_DARK)
        _add_text(slide, filename,
                  Inches(0.7), Inches(1.55), Inches(10), Inches(0.5),
                  size=14, color=_SLATE_600)
        _add_text(slide, "Prepared by Gulfstream Intelligence",
                  Inches(0.7), Inches(2.8), Inches(9), Inches(0.5),
                  size=12, color=_SLATE_400)
        _add_text(slide, "Confidential — For preparation purposes only.",
                  Inches(0.7), Inches(6.8), Inches(9), Inches(0.4),
                  size=9, color=_SLATE_400)

        for auth, data in analysis_data.items():
            summary  = data.get("summary", "")
            gaps     = data.get("gaps", [])
            actions  = data.get("actions", [])
            risks    = data.get("risks", [])

            # ── Executive Summary ─────────────────────────────────────────────
            slide = _blank(prs)
            _solid_bg(slide, _WHITE)
            _add_rect(slide, 0, 0, _SW, Inches(1.05), _INDIGO_LIGHT)
            _add_rect(slide, 0, 0, Inches(0.3), Inches(1.05), _INDIGO)
            _add_text(slide, f"{auth}  ·  Executive Summary",
                      Inches(0.55), Inches(0.22), Inches(11), Inches(0.6),
                      size=20, bold=True, color=_INDIGO_DARK)

            # Summary card
            _add_rect(slide, Inches(0.4), Inches(1.2), _SW - Inches(0.8), Inches(5.7),
                      RGBColor(0xF8, 0xFA, 0xFF), line=RGBColor(0xE2, 0xE8, 0xF0))
            _add_rect(slide, Inches(0.4), Inches(1.2), Inches(0.18), Inches(5.7), _INDIGO)
            _add_text(slide, summary,
                      Inches(0.75), Inches(1.35), Inches(12.1), Inches(5.4),
                      size=12, color=_SLATE_600)

            # ── Gaps slides ───────────────────────────────────────────────────
            GAPS_PER = 3
            for si in range(0, len(gaps), GAPS_PER):
                batch = gaps[si: si + GAPS_PER]
                slide = _blank(prs)
                _solid_bg(slide, _WHITE)
                _add_rect(slide, 0, 0, _SW, Inches(1.05), _INDIGO_LIGHT)
                _add_rect(slide, 0, 0, Inches(0.3), Inches(1.05), _INDIGO)
                pg = si // GAPS_PER + 1
                pages = (len(gaps) + GAPS_PER - 1) // GAPS_PER
                _add_text(slide, f"{auth}  ·  Regulatory Gaps  ({pg}/{pages})",
                          Inches(0.55), Inches(0.22), Inches(10), Inches(0.6),
                          size=20, bold=True, color=_INDIGO_DARK)

                row_h   = Inches(2.1)
                row_top = Inches(1.15)

                for i, gap in enumerate(batch):
                    top   = row_top + i * row_h
                    sev   = gap.get("severity", "Low")
                    sc    = _SEV_COLOR.get(sev, _GREEN)
                    sbg   = _SEV_BG_COLOR.get(sev, _GREEN_LIGHT)

                    # Card bg
                    _add_rect(slide, Inches(0.4), top, _SW - Inches(0.8), row_h - Inches(0.12),
                              RGBColor(0xF8, 0xFA, 0xFF), line=RGBColor(0xE2, 0xE8, 0xF0))
                    # Left sev strip
                    _add_rect(slide, Inches(0.4), top, Inches(0.18), row_h - Inches(0.12), sc)

                    # Severity pill
                    _add_rect(slide, Inches(0.75), top + Inches(0.18), Inches(1.0), Inches(0.32), sbg,
                              line=sc)
                    _add_text(slide, sev.upper(),
                              Inches(0.77), top + Inches(0.19), Inches(0.96), Inches(0.28),
                              size=8, bold=True, color=sc, align=PP_ALIGN.CENTER)

                    # Title
                    _add_text(slide, gap.get("title", ""),
                              Inches(1.9), top + Inches(0.12), Inches(11.0), Inches(0.42),
                              size=13, bold=True, color=_SLATE_800)

                    # Description
                    desc = gap.get("description", "")
                    _add_text(slide, desc[:190] + ("…" if len(desc) > 190 else ""),
                              Inches(0.75), top + Inches(0.62), Inches(12.2), Inches(0.55),
                              size=10, color=_SLATE_600)

                    # Action
                    act_txt = gap.get("recommended_action", "")
                    _add_text(slide,
                              "→  " + (act_txt[:165] + ("…" if len(act_txt) > 165 else "")),
                              Inches(0.75), top + Inches(1.22), Inches(12.2), Inches(0.55),
                              size=10, color=_INDIGO_DARK)

            # ── Risks slide ───────────────────────────────────────────────────
            if risks:
                slide = _blank(prs)
                _solid_bg(slide, _WHITE)
                _add_rect(slide, 0, 0, _SW, Inches(1.05), _INDIGO_LIGHT)
                _add_rect(slide, 0, 0, Inches(0.3), Inches(1.05), _INDIGO)
                _add_text(slide, f"{auth}  ·  Key Risks",
                          Inches(0.55), Inches(0.22), Inches(10), Inches(0.6),
                          size=20, bold=True, color=_INDIGO_DARK)
                for idx, risk in enumerate(risks[:7]):
                    top = Inches(1.2) + idx * Inches(0.84)
                    _add_rect(slide, Inches(0.4), top + Inches(0.18),
                              Inches(0.1), Inches(0.36), _RED)
                    _add_text(slide, risk[:220],
                              Inches(0.65), top, Inches(12.3), Inches(0.75),
                              size=11, color=_SLATE_600)

            # ── Recommendations slide ─────────────────────────────────────────
            if actions:
                slide = _blank(prs)
                _solid_bg(slide, _WHITE)
                _add_rect(slide, 0, 0, _SW, Inches(1.05), _INDIGO_LIGHT)
                _add_rect(slide, 0, 0, Inches(0.3), Inches(1.05), _INDIGO)
                _add_text(slide, f"{auth}  ·  Strategic Recommendations",
                          Inches(0.55), Inches(0.22), Inches(11), Inches(0.6),
                          size=20, bold=True, color=_INDIGO_DARK)

                pri_c_map = {"High": _RED, "Medium": _YELLOW, "Low": _GREEN}
                pri_bg_map = {"High": _RED_LIGHT, "Medium": _YELLOW_LIGHT, "Low": _GREEN_LIGHT}
                for idx, act in enumerate(actions[:5]):
                    top = Inches(1.18) + idx * Inches(1.2)
                    p   = act.get("priority", "Medium")
                    pc  = pri_c_map.get(p, _GREEN)
                    pbg = pri_bg_map.get(p, _GREEN_LIGHT)
                    # Card
                    _add_rect(slide, Inches(0.4), top, _SW - Inches(0.8), Inches(1.08),
                              RGBColor(0xF8, 0xFA, 0xFF), line=RGBColor(0xE2, 0xE8, 0xF0))
                    # Priority pill
                    _add_rect(slide, Inches(0.55), top + Inches(0.15), Inches(1.0), Inches(0.3), pbg,
                              line=pc)
                    _add_text(slide, p.upper(),
                              Inches(0.57), top + Inches(0.16), Inches(0.96), Inches(0.26),
                              size=8, bold=True, color=pc, align=PP_ALIGN.CENTER)
                    _add_text(slide, act.get("title", ""),
                              Inches(1.7), top + Inches(0.1), Inches(11.0), Inches(0.38),
                              size=12, bold=True, color=_SLATE_800)
                    desc = act.get("description", "")
                    _add_text(slide, desc[:190] + ("…" if len(desc) > 190 else ""),
                              Inches(1.7), top + Inches(0.52), Inches(11.0), Inches(0.48),
                              size=10, color=_SLATE_600)

        # ── Closing slide ─────────────────────────────────────────────────────
        slide = _blank(prs)
        _solid_bg(slide, _WHITE)
        _add_rect(slide, 0, 0, Inches(0.3), _SH, _INDIGO)
        _add_rect(slide, Inches(0.3), 0, _SW - Inches(0.3), Inches(2.4), _INDIGO_LIGHT)
        _add_text(slide, "Thank You",
                  Inches(0.7), Inches(0.55), Inches(9), Inches(1.0),
                  size=34, bold=True, color=_INDIGO_DARK)
        _add_text(slide, "Gulfstream Intelligence · Regulatory Analysis",
                  Inches(0.7), Inches(1.6), Inches(9), Inches(0.5),
                  size=13, color=_SLATE_600)
        _add_text(slide, "This presentation is confidential and for preparation purposes only.",
                  Inches(0.7), Inches(6.9), Inches(9), Inches(0.4),
                  size=9, color=_SLATE_400)

        buf = io.BytesIO()
        prs.save(buf)
        url = await storage_service.upload_file(
            buf.getvalue(),
            f"Report_{filename}.pptx",
            "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        )
        return url


export_service = ExportService()
