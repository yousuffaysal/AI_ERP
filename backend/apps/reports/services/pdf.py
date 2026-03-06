import io
import datetime
from reportlab.lib.pagesizes import letter, landscape
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet

class DocumentGenerator:
    """
    Generates .pdf byte streams from dynamically created Django QuerySets.
    """
    
    @classmethod
    def generate_pdf(cls, queryset_iterable: list, report_title: str) -> bytes:
        output = io.BytesIO()
        # Use landscape because ERP tables tend to be wide
        doc = SimpleDocTemplate(output, pagesize=landscape(letter), topMargin=30)
        
        elements = []
        styles = getSampleStyleSheet()
        
        # 1. Title
        title_style = styles['Title']
        elements.append(Paragraph(report_title, title_style))
        elements.append(Spacer(1, 12))
        
        date_style = styles['Normal']
        elements.append(Paragraph(f"Generated: {datetime.date.today().isoformat()}", date_style))
        elements.append(Spacer(1, 24))
        
        if not queryset_iterable:
            elements.append(Paragraph("No records found matching criteria.", styles['Normal']))
            doc.build(elements)
            return output.getvalue()
            
        # 2. Table Headers
        headers = list(queryset_iterable[0].keys())
        table_data = [[h.replace('_', ' ').title() for h in headers]]
        
        # 3. Table Rows
        for row_dict in queryset_iterable:
            row_vals = []
            for h in headers:
                raw_val = row_dict[h]
                if isinstance(raw_val, (datetime.datetime, datetime.date)):
                    val = raw_val.isoformat()
                elif hasattr(raw_val, 'hex'): 
                    val = str(raw_val)[:8] # Abbreviate UUIDs in PDFs
                else:
                    val = str(raw_val)
                    
                row_vals.append(val)
                
            table_data.append(row_vals)
            
        # 4. Draw Table
        # We don't specify strict colWidths so ReportLab attempts to fit automatically
        t = Table(table_data, repeatRows=1)
        
        # Add basic spreadsheet aesthetic
        t.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#1F4E78")),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 11),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor("#F9F9F9")),
            ('GRID', (0,0), (-1,-1), 1, colors.silver),
            ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 1), (-1, -1), 9),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ]))
        
        elements.append(t)
        doc.build(elements)
        
        return output.getvalue()
