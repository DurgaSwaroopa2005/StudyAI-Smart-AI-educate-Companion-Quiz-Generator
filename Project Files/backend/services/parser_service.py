import io
import PyPDF2
import docx

def extract_text_from_pdf(file_bytes):
    """Extracts text from PDF file bytes."""
    try:
        pdf_reader = PyPDF2.PdfReader(io.BytesIO(file_bytes))
        text = ""
        for page in pdf_reader.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\n"
        return text.strip()
    except Exception as e:
        print(f"Error parsing PDF: {e}")
        raise ValueError(f"Failed to extract text from PDF: {str(e)}")

def extract_text_from_docx(file_bytes):
    """Extracts text from DOCX file bytes."""
    try:
        doc = docx.Document(io.BytesIO(file_bytes))
        text = []
        for paragraph in doc.paragraphs:
            text.append(paragraph.text)
        return "\n".join(text).strip()
    except Exception as e:
        print(f"Error parsing DOCX: {e}")
        raise ValueError(f"Failed to extract text from DOCX: {str(e)}")

def extract_text_from_txt(file_bytes):
    """Extracts text from plain text file bytes."""
    try:
        try:
            return file_bytes.decode('utf-8').strip()
        except UnicodeDecodeError:
            return file_bytes.decode('latin-1').strip()
    except Exception as e:
        print(f"Error parsing TXT: {e}")
        raise ValueError(f"Failed to extract text from TXT file: {str(e)}")

def extract_text(file_bytes, file_name):
    """Determines extension and extracts text accordingly."""
    ext = file_name.split('.')[-1].lower() if '.' in file_name else ''
    if ext == 'pdf':
        return extract_text_from_pdf(file_bytes)
    elif ext in ['docx', 'doc']:
        return extract_text_from_docx(file_bytes)
    elif ext in ['txt', 'md']:
        return extract_text_from_txt(file_bytes)
    else:
        raise ValueError(f"Unsupported file format: '.{ext}'")
