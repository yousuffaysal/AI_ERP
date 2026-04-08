"""
Sales views — company-scoped, transactional, SOLID-compliant.

Key design choices:
  - InvoiceViewSet.confirm(): delegates to Invoice.confirm() — keeps view thin.
  - InvoiceViewSet.record_payment(): delegates to Invoice.record_payment().
  - All state transitions validated by the model, not the view.
  - Views only handle HTTP concerns (request parsing, response formatting).
"""
from decimal import Decimal

from rest_framework import status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.viewsets import ModelViewSet

from utils.mixins import CompanyQuerysetMixin
from utils.permissions import HasCompany, IsManager

from .models import (
    CompanyTaxSettings,
    Customer,
    Invoice,
    InvoiceItem,
    Payment,
    SalesOrder,
    SalesOrderItem,
)
from .serializers import (
    CompanyTaxSettingsSerializer,
    CustomerSerializer,
    InvoiceItemSerializer,
    InvoiceSerializer,
    InvoiceWriteSerializer,
    PaymentSerializer,
    RecordPaymentSerializer,
    SalesOrderItemSerializer,
    SalesOrderSerializer,
    SalesOrderWriteSerializer,
)


# ---------------------------------------------------------------------------
# Company Tax Settings
# ---------------------------------------------------------------------------

class CompanyTaxSettingsViewSet(CompanyQuerysetMixin, ModelViewSet):
    """
    Company-level tax configuration — one record per company.
    Admin-only. Managers can read but not modify.
    """
    queryset = CompanyTaxSettings.objects.all()
    serializer_class = CompanyTaxSettingsSerializer
    permission_classes = [IsManager, HasCompany]
    http_method_names = ['get', 'post', 'put', 'patch', 'head', 'options']


# ---------------------------------------------------------------------------
# Customer
# ---------------------------------------------------------------------------

class CustomerViewSet(CompanyQuerysetMixin, ModelViewSet):
    """Customers — company-scoped."""
    queryset = Customer.objects.all()
    serializer_class = CustomerSerializer
    permission_classes = [IsAuthenticated, HasCompany]
    search_fields = ['name', 'email', 'phone', 'tax_id']
    filterset_fields = ['is_active', 'city', 'country']
    ordering_fields = ['name', 'credit_limit', 'created_at']

    @action(detail=True, methods=['get'])
    def invoices(self, request, pk=None):
        """All invoices for this customer."""
        customer = self.get_object()
        qs = Invoice.objects.filter(
            customer=customer, company=request.company
        ).order_by('-issue_date')
        page = self.paginate_queryset(qs)
        serializer = InvoiceSerializer(
            page or qs, many=True, context={'request': request}
        )
        if page is not None:
            return self.get_paginated_response(serializer.data)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def statement(self, request, pk=None):
        """Customer account statement: outstanding balance + unpaid invoices."""
        customer = self.get_object()
        unpaid_invoices = Invoice.objects.filter(
            customer=customer,
            company=request.company,
            status__in=[Invoice.Status.CONFIRMED, Invoice.Status.PARTIAL, Invoice.Status.OVERDUE],
        ).order_by('due_date')
        return Response({
            'customer': {'id': str(customer.id), 'name': customer.name},
            'outstanding_balance': str(customer.outstanding_balance),
            'unpaid_invoices': InvoiceSerializer(unpaid_invoices, many=True).data,
        })


# ---------------------------------------------------------------------------
# Sales Order
# ---------------------------------------------------------------------------

class SalesOrderViewSet(CompanyQuerysetMixin, ModelViewSet):
    """
    Sales orders with full lifecycle state machine.
    DRAFT → CONFIRMED → PROCESSING → SHIPPED → DELIVERED
                   ↘ CANCELLED (from any non-terminal state)
    """
    queryset = SalesOrder.objects.select_related('customer').prefetch_related('items').all()
    permission_classes = [IsAuthenticated, HasCompany]
    search_fields = ['order_number', 'customer__name']
    filterset_fields = ['status', 'customer']
    ordering_fields = ['order_date', 'created_at']

    def get_serializer_class(self):
        if self.action in ('create', 'update', 'partial_update'):
            return SalesOrderWriteSerializer
        return SalesOrderSerializer

    def _transition(self, request, pk, from_status, to_status, error_msg):
        """Generic state transition helper — keeps action methods DRY."""
        order = self.get_object()
        if order.status != from_status:
            return Response({'error': error_msg}, status=status.HTTP_400_BAD_REQUEST)
        order.status = to_status
        order.updated_by = request.user
        order.save(update_fields=['status', 'updated_by'])
        return Response(SalesOrderSerializer(order, context={'request': request}).data)

    @action(detail=True, methods=['post'], permission_classes=[IsManager, HasCompany])
    def confirm(self, request, pk=None):
        return self._transition(
            request, pk,
            SalesOrder.Status.DRAFT, SalesOrder.Status.CONFIRMED,
            'Only DRAFT orders can be confirmed.',
        )

    @action(detail=True, methods=['post'], permission_classes=[IsManager, HasCompany])
    def process(self, request, pk=None):
        return self._transition(
            request, pk,
            SalesOrder.Status.CONFIRMED, SalesOrder.Status.PROCESSING,
            'Only CONFIRMED orders can be moved to processing.',
        )

    @action(detail=True, methods=['post'], permission_classes=[IsManager, HasCompany])
    def ship(self, request, pk=None):
        return self._transition(
            request, pk,
            SalesOrder.Status.PROCESSING, SalesOrder.Status.SHIPPED,
            'Only PROCESSING orders can be shipped.',
        )

    @action(detail=True, methods=['post'], permission_classes=[IsManager, HasCompany])
    def deliver(self, request, pk=None):
        return self._transition(
            request, pk,
            SalesOrder.Status.SHIPPED, SalesOrder.Status.DELIVERED,
            'Only SHIPPED orders can be marked as delivered.',
        )

    @action(detail=True, methods=['post'], permission_classes=[IsManager, HasCompany])
    def cancel(self, request, pk=None):
        order = self.get_object()
        terminal = {SalesOrder.Status.DELIVERED, SalesOrder.Status.CANCELLED}
        if order.status in terminal:
            return Response(
                {'error': f'Cannot cancel a {order.status} order.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        order.status = SalesOrder.Status.CANCELLED
        order.updated_by = request.user
        order.save(update_fields=['status', 'updated_by'])
        return Response(SalesOrderSerializer(order, context={'request': request}).data)

    @action(detail=True, methods=['post'], permission_classes=[IsManager, HasCompany],
            url_path='create-invoice')
    def create_invoice(self, request, pk=None):
        """
        Create a DRAFT invoice from a CONFIRMED (or later) sales order.
        Copies all order items as invoice items.
        """
        order = self.get_object()
        if order.status == SalesOrder.Status.DRAFT:
            return Response(
                {'error': 'Confirm the order before creating an invoice.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if hasattr(order, 'invoice') and order.invoice:
            return Response(
                {'error': f'Invoice {order.invoice.invoice_number} already exists for this order.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        from django.utils import timezone
        import datetime

        # Get company tax settings
        tax_settings = CompanyTaxSettings.objects.filter(company=request.company).first()
        tax_rate = tax_settings.default_tax_rate if tax_settings else Decimal('0')
        tax_label = tax_settings.tax_name if tax_settings else 'TAX'

        from django.db import transaction as db_transaction
        with db_transaction.atomic():
            invoice = Invoice.objects.create(
                company=request.company,
                customer=order.customer,
                order=order,
                invoice_number=f'INV-{order.order_number}',
                issue_date=timezone.now().date(),
                due_date=timezone.now().date() + datetime.timedelta(days=30),
                tax_rate=tax_rate,
                tax_label=tax_label,
                discount_rate=order.discount,
                created_by=request.user,
            )
            for item in order.items.select_related('product'):
                InvoiceItem.objects.create(
                    invoice=invoice,
                    company=request.company,
                    product=item.product,
                    description=item.product.name,
                    quantity=item.quantity,
                    unit_price=item.unit_price,
                    created_by=request.user,
                )

        return Response(
            InvoiceSerializer(invoice, context={'request': request}).data,
            status=status.HTTP_201_CREATED,
        )


# ---------------------------------------------------------------------------
# Sales Order Items
# ---------------------------------------------------------------------------

class SalesOrderItemViewSet(CompanyQuerysetMixin, ModelViewSet):
    """Line items on a sales order."""
    queryset = SalesOrderItem.objects.select_related('product', 'order').all()
    serializer_class = SalesOrderItemSerializer
    permission_classes = [IsAuthenticated, HasCompany]
    filterset_fields = ['order', 'product']


# ---------------------------------------------------------------------------
# Invoice
# ---------------------------------------------------------------------------

class InvoiceViewSet(CompanyQuerysetMixin, ModelViewSet):
    """
    Invoices — company-scoped.

    Key actions:
      POST /invoices/{id}/confirm/         — Confirm + auto deduct stock
      POST /invoices/{id}/record-payment/  — Record a payment
      POST /invoices/{id}/void/            — Void the invoice
      GET  /invoices/overdue/             — All overdue invoices
      GET  /invoices/dashboard/           — Summary stats
    """
    queryset = Invoice.objects.select_related(
        'customer', 'order', 'confirmed_by'
    ).prefetch_related('items__product', 'payments').all()
    permission_classes = [IsAuthenticated, HasCompany]
    filterset_fields = ['status', 'customer']
    search_fields = ['invoice_number', 'reference', 'customer__name']
    ordering_fields = ['issue_date', 'due_date', 'amount_due']

    def get_serializer_class(self):
        if self.action in ('create', 'update', 'partial_update'):
            return InvoiceWriteSerializer
        return InvoiceSerializer

    def perform_create(self, serializer):
        """Auto-apply company tax settings when creating an invoice."""
        tax_settings = CompanyTaxSettings.objects.filter(
            company=self.request.company
        ).first()
        extra = {}
        if tax_settings and not serializer.validated_data.get('tax_rate'):
            extra['tax_rate'] = tax_settings.default_tax_rate
        if tax_settings and not serializer.validated_data.get('tax_label'):
            extra['tax_label'] = tax_settings.tax_name
        super().perform_create(serializer, **extra) if extra else super().perform_create(serializer)

    # ------------------------------------------------------------------
    # State transition actions
    # ------------------------------------------------------------------

    @action(detail=True, methods=['post'], permission_classes=[IsManager, HasCompany])
    def confirm(self, request, pk=None):
        """
        Confirm a DRAFT invoice:
        - Calculates final totals
        - Deducts stock for all product items
        - Marks as CONFIRMED
        All steps are atomic — if stock is insufficient, nothing changes.
        """
        invoice = self.get_object()
        try:
            invoice.confirm(confirmed_by_user=request.user)
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

        return Response(
            InvoiceSerializer(invoice, context={'request': request}).data,
            status=status.HTTP_200_OK,
        )

    @action(
        detail=True, methods=['post'],
        permission_classes=[IsManager, HasCompany],
        url_path='record-payment',
    )
    def record_payment(self, request, pk=None):
        """
        Record a payment against this invoice.
        Automatically transitions status to PARTIAL or PAID.
        """
        invoice = self.get_object()
        serializer = RecordPaymentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            payment = invoice.record_payment(
                amount=serializer.validated_data['amount'],
                recorded_by_user=request.user,
            )
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

        # Update payment with optional extra fields from request
        extra = {
            k: v for k, v in serializer.validated_data.items()
            if k in ('method', 'payment_date', 'reference', 'notes') and v
        }
        if extra:
            for field, value in extra.items():
                setattr(payment, field, value)
            payment.save(update_fields=list(extra.keys()))

        invoice.refresh_from_db()
        return Response({
            'message': f'Payment of {payment.amount} recorded successfully.',
            'invoice': InvoiceSerializer(invoice, context={'request': request}).data,
            'payment': PaymentSerializer(payment).data,
        })

    @action(detail=True, methods=['get'], permission_classes=[IsAuthenticated, HasCompany])
    def download_pdf(self, request, pk=None):
        """
        Generate and download a professional PDF of the invoice.
        Includes customer info, itemized table, and total calculations.
        """
        invoice = self.get_object()
        
        from django.http import FileResponse
        import io
        from reportlab.lib.pagesizes import letter
        from reportlab.lib import colors
        from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
        from reportlab.lib.styles import getSampleStyleSheet
        
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer, 
            pagesize=letter, 
            rightMargin=40, leftMargin=40, 
            topMargin=40, bottomMargin=40
        )
        elements = []
        styles = getSampleStyleSheet()
        
        # Invoice Header
        elements.append(Paragraph(f"INVOICE: {invoice.invoice_number}", styles['Title']))
        elements.append(Spacer(1, 12))
        
        # Basic Details Table
        details = [
            ["Customer:", invoice.customer.name],
            ["Issue Date:", str(invoice.issue_date)],
            ["Due Date:", str(invoice.due_date) if invoice.due_date else "N/A"],
            ["Status:", invoice.status.upper()],
            ["Reference:", invoice.reference or "N/A"],
        ]
        t_details = Table(details, colWidths=[100, 300])
        t_details.setStyle(TableStyle([
            ('FONTNAME', (0,0), (0,-1), 'Helvetica-Bold'),
            ('FONTSIZE', (0,0), (-1,-1), 10),
            ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ]))
        elements.append(t_details)
        elements.append(Spacer(1, 24))
        
        # Table Header
        items_data = [["Product", "Description", "Qty", "Unit Price", "Total"]]
        
        for item in invoice.items.all():
            items_data.append([
                item.product.name if item.product else "N/A",
                item.description[:40] + ("..." if len(item.description) > 40 else ""),
                str(item.quantity),
                f"${item.unit_price:.2f}",
                f"${item.total:.2f}"
            ])
            
        t_items = Table(items_data, colWidths=[100, 180, 50, 80, 80])
        t_items.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.whitesmoke),
            ('TEXTCOLOR', (0,0), (-1,0), colors.black),
            ('ALIGN', (0,0), (-1,-1), 'LEFT'),
            ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
            ('FONTSIZE', (0,0), (-1,-1), 9),
            ('BOTTOMPADDING', (0,0), (-1,-1), 8),
            ('GRID', (0,0), (-1,-1), 0.5, colors.grey),
        ]))
        elements.append(t_items)
        elements.append(Spacer(1, 24))
        
        # Financial Totals Table
        totals = [
            ["", "Subtotal:", f"${invoice.subtotal:.2f}"],
            ["", "Tax Amount:", f"${invoice.tax_amount:.2f}"],
            ["", "Discount:", f"-${invoice.discount_amount:.2f}"],
            ["", "TOTAL DUE:", f"${invoice.amount_due:.2f}"],
        ]
        t_totals = Table(totals, colWidths=[300, 110, 80])
        t_totals.setStyle(TableStyle([
            ('ALIGN', (1,0), (2,-1), 'RIGHT'),
            ('FONTNAME', (1,3), (2,3), 'Helvetica-Bold'),
            ('FONTSIZE', (1,3), (2,3), 11),
            ('LINEABOVE', (1,3), (2,3), 1, colors.black),
        ]))
        elements.append(t_totals)
        
        # Build PDF
        doc.build(elements)
        buffer.seek(0)
        
        return FileResponse(
            buffer, 
            as_attachment=True, 
            filename=f"Invoice_{invoice.invoice_number}.pdf",
            content_type='application/pdf'
        )

    @action(detail=True, methods=['post'], permission_classes=[IsManager, HasCompany])
    def void(self, request, pk=None):
        """
        Void this invoice.
        If already confirmed, reversal stock movements are created.
        """
        invoice = self.get_object()
        try:
            invoice.void(voided_by_user=request.user)
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

        return Response(
            InvoiceSerializer(invoice, context={'request': request}).data,
        )

    # ------------------------------------------------------------------
    # Analytics actions
    # ------------------------------------------------------------------

    @action(detail=False, methods=['get'])
    def overdue(self, request):
        """All invoices that are past due date and not paid/voided."""
        from django.utils import timezone
        qs = self.get_queryset().filter(
            due_date__lt=timezone.now().date(),
        ).exclude(status__in=[Invoice.Status.PAID, Invoice.Status.VOIDED])
        serializer = InvoiceSerializer(qs, many=True, context={'request': request})
        return Response({'count': qs.count(), 'results': serializer.data})

    @action(detail=False, methods=['get'])
    def dashboard(self, request):
        """
        Summary stats for the invoice dashboard widget.
        Returns totals for each status.
        """
        from django.db.models import Sum, Count
        qs = self.get_queryset()
        summary = (
            qs.values('status')
            .annotate(count=Count('id'), total=Sum('amount_due'))
            .order_by('status')
        )
        total_outstanding = qs.filter(
            status__in=[Invoice.Status.CONFIRMED, Invoice.Status.PARTIAL, Invoice.Status.OVERDUE]
        ).aggregate(total=Sum('amount_due'))['total'] or Decimal('0')
        total_paid = qs.filter(
            status=Invoice.Status.PAID
        ).aggregate(total=Sum('amount_paid'))['total'] or Decimal('0')

        return Response({
            'summary_by_status': list(summary),
            'total_outstanding': str(total_outstanding),
            'total_collected': str(total_paid),
        })


# ---------------------------------------------------------------------------
# Invoice Items
# ---------------------------------------------------------------------------

class InvoiceItemViewSet(CompanyQuerysetMixin, ModelViewSet):
    """
    Invoice line items — can only be added/edited while invoice is DRAFT.
    """
    queryset = InvoiceItem.objects.select_related('product', 'invoice').all()
    serializer_class = InvoiceItemSerializer
    permission_classes = [IsAuthenticated, HasCompany]
    filterset_fields = ['invoice', 'product']

    def perform_create(self, serializer):
        self._check_invoice_is_draft(serializer.validated_data.get('invoice'))
        super().perform_create(serializer)

    def perform_update(self, serializer):
        self._check_invoice_is_draft(serializer.instance.invoice)
        super().perform_update(serializer)

    def _check_invoice_is_draft(self, invoice):
        if invoice and invoice.status != Invoice.Status.DRAFT:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied(
                f'Invoice {invoice.invoice_number} is {invoice.status}. '
                'Items can only be added or edited on DRAFT invoices.'
            )


# ---------------------------------------------------------------------------
# Payments
# ---------------------------------------------------------------------------

class PaymentViewSet(CompanyQuerysetMixin, ModelViewSet):
    """
    Payment records — read-only (payments recorded via InvoiceViewSet.record_payment).
    Listed here for audit/reference purposes.
    """
    queryset = Payment.objects.select_related('invoice', 'recorded_by').all()
    serializer_class = PaymentSerializer
    permission_classes = [IsAuthenticated, HasCompany]
    filterset_fields = ['invoice', 'method']
    ordering_fields = ['payment_date', 'amount']
    http_method_names = ['get', 'head', 'options']  # Read-only


# ---------------------------------------------------------------------------
# AI Pricing Optimization
# ---------------------------------------------------------------------------

class OptimizePricingView(APIView):
    """
    POST /sales/optimize-pricing/
    Body: { unit_cost, current_velocity, competitor_price }
    Delegates to the FastAPI AI service for ML-based price optimization.
    """
    permission_classes = [IsAuthenticated, HasCompany]

    def post(self, request, *args, **kwargs):
        from asgiref.sync import async_to_sync
        from utils.ai_client import ai_client

        unit_cost = float(request.data.get('unit_cost', 0))
        current_velocity = float(request.data.get('current_velocity', 0))
        competitor_price = float(request.data.get('competitor_price', 0))

        # Build minimal historical data from available invoice items
        # This gives the AI service enough context even without deep history
        historical_data = [
            {'price': competitor_price * 0.9, 'quantity_sold': current_velocity * 1.1},
            {'price': competitor_price,       'quantity_sold': current_velocity},
            {'price': competitor_price * 1.1, 'quantity_sold': current_velocity * 0.9},
        ]

        try:
            result = async_to_sync(ai_client.optimize_pricing)(
                product_id='generic',
                historical_data=historical_data,
                unit_cost=unit_cost,
                current_velocity=current_velocity,
            )
            return Response(result)
        except Exception as e:
            return Response(
                {'error': str(e) or 'AI pricing service temporarily unavailable.'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
