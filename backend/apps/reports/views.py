from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from utils.permissions import require_permission, HasCompany
from django.http import HttpResponse
from .services.query import QueryBuilder
from .services.excel import SpreadsheetGenerator
from .services.pdf import DocumentGenerator
from django.core.exceptions import ValidationError
import logging

logger = logging.getLogger(__name__)

class GenerateReportView(APIView):
    """
    POST /api/v1/reports/generate
    Accepts JSON containing 'model', 'filters', 'order_by', 'select_fields', and 'format' ("pdf" or "excel").
    Returns raw file bytes or an error JSON.
    """
    permission_classes = [require_permission('can_generate_reports'), HasCompany]
    
    def post(self, request, *args, **kwargs):
        payload = request.data
        
        # 1. Validate Input
        export_format = payload.get('format', 'excel').lower()
        if export_format not in ['excel', 'pdf']:
            raise ValidationError("Format must be 'excel' or 'pdf'.")
            
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
    permission_classes = [require_permission('can_generate_reports'), HasCompany]
    
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

class DashboardStatsOverviewView(APIView):
    """
    GET /api/v1/reports/dashboard-stats/
    Aggregates high-level metrics across Sales, Inventory, and Accounts for the UI.
    """
    permission_classes = [IsAuthenticated, HasCompany]

    def get(self, request, *args, **kwargs):
        company = request.user.company
        if not company:
            return Response({"error": "No company assigned"}, status=status.HTTP_403_FORBIDDEN)

        from django.db.models import Sum
        from apps.sales.models import Invoice, SalesOrder, Customer
        from apps.inventory.models import Product, Stock

        # 1. Total Revenue (Paid Invoices)
        total_revenue = Invoice.objects.filter(
            company=company, 
            status=Invoice.Status.PAID
        ).aggregate(total=Sum('amount_paid'))['total'] or 0.0

        # 2. Total Outstanding (Confirmed or Partial)
        total_outstanding = Invoice.objects.filter(
            company=company,
            status__in=[Invoice.Status.CONFIRMED, Invoice.Status.PARTIAL, Invoice.Status.OVERDUE]
        ).aggregate(total=Sum('amount_due'))['total'] or 0.0

        total_paid_in_outstanding = Invoice.objects.filter(
             company=company,
             status__in=[Invoice.Status.CONFIRMED, Invoice.Status.PARTIAL, Invoice.Status.OVERDUE]
        ).aggregate(total=Sum('amount_paid'))['total'] or 0.0
        
        net_outstanding = float(total_outstanding) - float(total_paid_in_outstanding)

        # 3. Total Orders & Customers
        total_orders = SalesOrder.objects.filter(company=company).count()
        total_customers = Customer.objects.filter(company=company, is_active=True).count()

        # 4. Inventory Metrics
        total_products = Product.objects.filter(company=company, status='active').count()
        
        # Calculate low stock count in Python because it compares aggregate (quantity) to field (reorder_level).
        products = Product.objects.filter(company=company, status='active').prefetch_related('stock_entries')
        low_stock_count = sum(1 for p in products if p.is_low_stock)

        # 5. Recent Activity (Latest 5 Sales Orders)
        recent_orders = SalesOrder.objects.filter(company=company).order_by('-created_at')[:5]
        recent_activities = []
        for o in recent_orders:
            recent_activities.append({
                "id": str(o.id),
                "type": "order_created",
                "message": f"New Order {o.order_number} created",
                "timestamp": o.created_at.isoformat()
            })

        return Response({
            "total_revenue": float(total_revenue),
            "accounts_receivable": net_outstanding,
            "total_orders": total_orders,
            "total_customers": total_customers,
            "total_products": total_products,
            "low_stock_items": low_stock_count,
            "total_employees": 12, # Placeholder as per review warning
            "recent_activities": recent_activities
        })

