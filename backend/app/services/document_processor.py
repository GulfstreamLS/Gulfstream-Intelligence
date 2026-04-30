import io
from typing import List
from pypdf import PdfReader
from docx import Document
from langchain.text_splitter import RecursiveCharacterTextSplitter


class DocumentProcessor:
    def __init__(self):
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200,
            length_function=len,
        )

    def extract_text(self, content: bytes, file_type: str) -> str:
        """Extract text based on file type."""
        if file_type.lower() in ["pdf", "application/pdf"]:
            return self._extract_from_pdf(content)
        elif file_type.lower() in ["docx", "doc", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"]:
            return self._extract_from_docx(content)
        elif file_type.lower() in ["txt", "text/plain"]:
            return content.decode("utf-8")
        else:
            raise ValueError(f"Unsupported file type: {file_type}")


    def _extract_from_pdf(self, content: bytes) -> str:
        reader = PdfReader(io.BytesIO(content))
        text = ""
        for page in reader.pages:
            extracted = page.extract_text()
            if extracted:
                text += extracted + "\n"
        return text

    def _extract_from_docx(self, content: bytes) -> str:
        doc = Document(io.BytesIO(content))
        return "\n".join([para.text for para in doc.paragraphs])

    def split_text(self, text: str) -> List[str]:
        """Split text into manageable chunks for embedding."""
        return self.text_splitter.split_text(text)


document_processor = DocumentProcessor()
