from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from django.http import HttpResponse
from .services.query import QueryBuilder
from .services.excel import SpreadsheetGenerator
from .services.pdf import DocumentGenerator
from utils.exceptions import CustomValidationError
import logging

logger = logging.getLogger(__name__)

class GenerateReportView(APIView):
    """
    POST /api/v1/reports/generate
    Accepts JSON containing 'model', 'filters', 'order_by', 'select_fields', and 'format' ("pdf" or "excel").
    Returns raw file bytes or an error JSON.
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request, *args, **kwargs):
        payload = request.data
        
        # 1. Validate Input
        export_format = payload.get('format', 'excel').lower()
        if export_format not in ['excel', 'pdf']:
            raise CustomValidationError("Format must be 'excel' or 'pdf'.")
            
        report_title = payload.get('title', 'System Export')
        
        # 2. Build Query
        try:
            # Important: Limit query to the user's tenant company
            company = request.user.company
            queryset = QueryBuilder.build(company, payload)
        except ValueError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f"Unexpected error building report query: {e}")
            return Response({"error": "Failed to compile report parameters."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
        # 3. Convert QuerySet to List of Dicts (to safely pass to generators)
        # Using list() forces evaluation of the QuerySet
        try:
            data = list(queryset)
        except Exception as e:
            logger.error(f"Error executing report query: {e}")
            return Response({"error": "Failed to apply requested filters."}, status=status.HTTP_400_BAD_REQUEST)
            
        # 4. Generate Byte Stream
        if export_format == 'excel':
            file_bytes = SpreadsheetGenerator.generate_excel(data, report_title)
            content_type = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            filename = f"export_{request.user.id}.xlsx"
        else:
            file_bytes = DocumentGenerator.generate_pdf(data, report_title)
            content_type = 'application/pdf'
            filename = f"export_{request.user.id}.pdf"
            
        # 5. Return native FileResponse
        response = HttpResponse(file_bytes, content_type=content_type)
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        return response

class ScheduleReportView(APIView):
    """
    POST /api/v1/reports/schedule
    Accepts standard query JSON + 'email_to' and 'schedule_mode' ('daily', 'weekly').
    Schedules the celery beat task.
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request, *args, **kwargs):
        payload = request.data
        email_to = payload.get('email_to')
        report_title = payload.get('title', 'Scheduled System Export')
        
        if not email_to:
            return Response({"error": "email_to is required for scheduled reports."}, status=status.HTTP_400_BAD_REQUEST)
            
        # In a full deployment, this would create a PeriodicTask entry in django-celery-beat DB.
        # For this prototype/Phase 4 demonstration, we will dispatch the task to run immediately asynchronously,
        # verifying the Celery pipeline works end-to-end without waiting for a cron interval.
        from .tasks import send_scheduled_report
        
        try:
            # Dispatch to Celery Background Worker
            send_scheduled_report.delay(
                company_id=str(request.user.company.id),
                email_to=email_to,
                payload=payload,
                report_title=report_title
            )
            return Response({
                "message": f"Report '{report_title}' scheduled and queued for delivery to {email_to}."
            }, status=status.HTTP_202_ACCEPTED)
            
        except Exception as e:
            logger.error(f"Failed to schedule report: {e}")
            return Response({"error": "Failed to schedule background job."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
