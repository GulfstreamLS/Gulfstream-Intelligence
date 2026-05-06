import io
from typing import Any

from docx import Document as DocxDocument
from pptx import Presentation
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer

from app.services.storage_service import storage_service


class ExportService:
    async def generate_pdf(self, analysis_data: dict[str, Any], filename: str) -> str:
        """Generate a professional PDF report from analysis data."""
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter)
        styles = getSampleStyleSheet()

        # Custom styles
        title_style = ParagraphStyle(
            "TitleStyle", parent=styles["Heading1"], fontSize=18, spaceAfter=20, textColor=colors.HexColor("#8b5cf6")
        )
        auth_style = ParagraphStyle(
            "AuthStyle",
            parent=styles["Heading2"],
            fontSize=14,
            spaceBefore=15,
            spaceAfter=10,
            textColor=colors.HexColor("#4f46e5"),
        )

        elements = []
        elements.append(Paragraph(f"Regulatory Analysis Report: {filename}", title_style))
        elements.append(Spacer(1, 12))

        for auth, data in analysis_data.items():
            elements.append(Paragraph(f"Authority Context: {auth}", auth_style))

            # Executive Summary
            elements.append(Paragraph("Executive Summary", styles["Heading3"]))
            elements.append(Paragraph(data.get("summary", "N/A"), styles["Normal"]))
            elements.append(Spacer(1, 12))

            # Detailed Findings
            if data.get("gaps"):
                elements.append(Paragraph("Detailed Findings & Regulatory Risks", styles["Heading3"]))
                for gap in data["gaps"]:
                    # Gap Detail Block
                    elements.append(Paragraph(f"<b>• {gap.get('title')}</b> [{gap.get('severity')}]", styles["Normal"]))
                    elements.append(Paragraph(f"<i>Observation:</i> {gap.get('description')}", styles["Italic"]))
                    elements.append(
                        Paragraph(f"<i>Strategic Action:</i> {gap.get('recommended_action')}", styles["Normal"])
                    )
                    elements.append(Spacer(1, 8))

            # Strategic Outlook
            elements.append(Spacer(1, 10))
            elements.append(Paragraph("Strategic Recommendations & Next Steps", styles["Heading3"]))
            outlook_text = (
                "Based on the analysis, it is recommended to prioritize the 'Critical' "
                "gaps before the next submission milestone. Ensure that all manufacturing "
                "process validation data is synchronized with the clinical study protocol. "
                "Regular audits of the stability data should be conducted to support the "
                "proposed shelf-life."
            )
            elements.append(Paragraph(outlook_text, styles["Normal"]))
            elements.append(Spacer(1, 20))

        doc.build(elements)
        content = buffer.getvalue()
        url = await storage_service.upload_file(content, f"Report_{filename}.pdf", "application/pdf")
        return url

    async def generate_docx(self, analysis_data: dict[str, Any], filename: str) -> str:
        """Generate a professional Word document report."""
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
            doc.add_paragraph(
                "Incorporate the missing criteria, specify precise storage temperatures, "
                "and ensure detailed stability data is added to improve the submission's "
                "readiness for regulatory review."
            )

        buffer = io.BytesIO()
        doc.save(buffer)
        content = buffer.getvalue()
        url = await storage_service.upload_file(
            content,
            f"Report_{filename}.docx",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        )
        return url

    async def generate_pptx(self, analysis_data: dict[str, Any], filename: str) -> str:
        """Generate a PowerPoint presentation of the findings."""
        prs = Presentation()

        # Title Slide
        slide = prs.slides.add_slide(prs.slide_layouts[0])
        title = slide.shapes.title
        subtitle = slide.placeholders[1]
        title.text = "Regulatory Analysis"
        subtitle.text = f"Project: {filename}"

        for auth, data in analysis_data.items():
            # Authority Overview Slide
            slide = prs.slides.add_slide(prs.slide_layouts[1])
            title = slide.shapes.title
            title.text = f"{auth} Overview"
            content = slide.placeholders[1]
            content.text = data.get("summary", "No summary available.")

            # Gaps Slide
            if data.get("gaps"):
                slide = prs.slides.add_slide(prs.slide_layouts[1])
                title = slide.shapes.title
                title.text = f"{auth} Critical Gaps"
                content = slide.placeholders[1]
                content_text = ""
                for gap in data["gaps"][:5]:  # Limit to top 5 gaps
                    content_text += f"• [{gap['severity']}] {gap['title']}\n"
                content.text = content_text

        buffer = io.BytesIO()
        prs.save(buffer)
        content = buffer.getvalue()
        url = await storage_service.upload_file(
            content,
            f"Report_{filename}.pptx",
            "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        )
        return url


export_service = ExportService()
