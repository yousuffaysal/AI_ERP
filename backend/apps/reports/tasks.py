from celery import shared_task
import logging
from django.core.mail import EmailMessage
from django.conf import settings
from apps.accounts.models import Company, User
from apps.reports.services.query import QueryBuilder
from apps.reports.services.excel import SpreadsheetGenerator
from apps.reports.services.pdf import DocumentGenerator

logger = logging.getLogger(__name__)

@shared_task
def send_scheduled_report(company_id: str, email_to: str, payload: dict, report_title: str):
    """
    Background job triggered by django-celery-beat to generate and email a report.
    """
    logger.info(f"Generating Scheduled Report '{report_title}' for Company {company_id}")
    
    try:
        company = Company.objects.get(id=company_id)
    except Company.DoesNotExist:
        logger.error(f"Cannot run report. Company {company_id} does not exist.")
        return
        
    export_format = payload.get('format', 'excel').lower()
    
    try:
        queryset = QueryBuilder.build(company, payload)
        data = list(queryset)
    except Exception as e:
        logger.error(f"Scheduled Report Query Failed: {e}")
        return
        
    try:
        if export_format == 'pdf':
            file_bytes = DocumentGenerator.generate_pdf(data, report_title)
            filename = f"Report_{report_title.replace(' ', '_')}.pdf"
            mime_type = 'application/pdf'
        else:
            file_bytes = SpreadsheetGenerator.generate_excel(data, report_title)
            filename = f"Report_{report_title.replace(' ', '_')}.xlsx"
            mime_type = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            
        # Send Email
        email = EmailMessage(
            subject=f"Scheduled Report: {report_title}",
            body=f"Please find attached the scheduled report: {report_title}.",
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[email_to],
        )
        email.attach(filename, file_bytes, mime_type)
        email.send()
        
        logger.info(f"Successfully emailed scheduled report to {email_to}")
        
    except Exception as e:
        logger.error(f"Failed to generate/email scheduled report: {e}")
