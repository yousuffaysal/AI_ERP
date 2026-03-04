"""Sales views — all ViewSets company-scoped via CompanyQuerysetMixin."""
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet

from utils.mixins import CompanyQuerysetMixin
from utils.permissions import HasCompany, IsManager

from .models import Customer, Invoice, SalesOrder
from .serializers import CustomerSerializer, InvoiceSerializer, SalesOrderSerializer


class CustomerViewSet(CompanyQuerysetMixin, ModelViewSet):
    """Customers — company-scoped."""
    queryset = Customer.objects.all()
    serializer_class = CustomerSerializer
    permission_classes = [IsAuthenticated, HasCompany]
    search_fields = ['name', 'email', 'phone']
    filterset_fields = ['is_active']
    ordering_fields = ['name', 'created_at']


class SalesOrderViewSet(CompanyQuerysetMixin, ModelViewSet):
    """
    Sales orders — company-scoped with lifecycle actions.
    State transitions: DRAFT → CONFIRMED → PROCESSING → SHIPPED → DELIVERED
                              ↘ CANCELLED (from any non-terminal state)
    """
    queryset = SalesOrder.objects.select_related('customer').prefetch_related('items').all()
    serializer_class = SalesOrderSerializer
    permission_classes = [IsAuthenticated, HasCompany]
    search_fields = ['order_number', 'customer__name']
    filterset_fields = ['status', 'customer']
    ordering_fields = ['order_date', 'created_at']

    @action(detail=True, methods=['post'], permission_classes=[IsManager, HasCompany])
    def confirm(self, request, pk=None):
        """Transition: DRAFT → CONFIRMED."""
        order = self.get_object()
        if order.status != SalesOrder.Status.DRAFT:
            return Response(
                {'error': f'Cannot confirm an order with status "{order.status}". Only DRAFT orders can be confirmed.'},
                status=400,
            )
        order.status = SalesOrder.Status.CONFIRMED
        order.updated_by = request.user
        order.save(update_fields=['status', 'updated_by'])
        return Response(SalesOrderSerializer(order).data)

    @action(detail=True, methods=['post'], permission_classes=[IsManager, HasCompany])
    def process(self, request, pk=None):
        """Transition: CONFIRMED → PROCESSING."""
        order = self.get_object()
        if order.status != SalesOrder.Status.CONFIRMED:
            return Response(
                {'error': 'Only CONFIRMED orders can be marked as processing.'},
                status=400,
            )
        order.status = SalesOrder.Status.PROCESSING
        order.updated_by = request.user
        order.save(update_fields=['status', 'updated_by'])
        return Response(SalesOrderSerializer(order).data)

    @action(detail=True, methods=['post'], permission_classes=[IsManager, HasCompany])
    def ship(self, request, pk=None):
        """Transition: PROCESSING → SHIPPED."""
        order = self.get_object()
        if order.status != SalesOrder.Status.PROCESSING:
            return Response(
                {'error': 'Only PROCESSING orders can be shipped.'},
                status=400,
            )
        order.status = SalesOrder.Status.SHIPPED
        order.updated_by = request.user
        order.save(update_fields=['status', 'updated_by'])
        return Response(SalesOrderSerializer(order).data)

    @action(detail=True, methods=['post'], permission_classes=[IsManager, HasCompany])
    def deliver(self, request, pk=None):
        """Transition: SHIPPED → DELIVERED."""
        order = self.get_object()
        if order.status != SalesOrder.Status.SHIPPED:
            return Response(
                {'error': 'Only SHIPPED orders can be marked as delivered.'},
                status=400,
            )
        order.status = SalesOrder.Status.DELIVERED
        order.updated_by = request.user
        order.save(update_fields=['status', 'updated_by'])
        return Response(SalesOrderSerializer(order).data)

    @action(detail=True, methods=['post'], permission_classes=[IsManager, HasCompany])
    def cancel(self, request, pk=None):
        """Cancel an order — not allowed once DELIVERED."""
        order = self.get_object()
        terminal_states = {SalesOrder.Status.DELIVERED, SalesOrder.Status.CANCELLED}
        if order.status in terminal_states:
            return Response(
                {'error': f'Cannot cancel an order with status "{order.status}".'},
                status=400,
            )
        order.status = SalesOrder.Status.CANCELLED
        order.updated_by = request.user
        order.save(update_fields=['status', 'updated_by'])
        return Response(SalesOrderSerializer(order).data)


class InvoiceViewSet(CompanyQuerysetMixin, ModelViewSet):
    """Invoices — company-scoped."""
    queryset = Invoice.objects.select_related('order', 'order__customer').all()
    serializer_class = InvoiceSerializer
    permission_classes = [IsAuthenticated, HasCompany]
    filterset_fields = ['status']
    ordering_fields = ['due_date', 'created_at']
    http_method_names = ['get', 'post', 'patch', 'head', 'options']
