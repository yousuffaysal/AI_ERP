"""Finance views — all ViewSets company-scoped via CompanyQuerysetMixin."""
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet

from utils.mixins import CompanyQuerysetMixin
from utils.permissions import HasCompany, require_permission

from .models import Account, Budget, Expense, Transaction
from .serializers import AccountSerializer, BudgetSerializer, ExpenseSerializer, TransactionSerializer


class AccountViewSet(CompanyQuerysetMixin, ModelViewSet):
    """Chart of accounts — Manager+ can manage; all authenticated can view."""
    queryset = Account.objects.select_related('parent').all()
    serializer_class = AccountSerializer
    permission_classes = [require_permission('can_manage_accounts'), HasCompany]
    search_fields = ['code', 'name']
    filterset_fields = ['account_type', 'is_active', 'parent']
    ordering_fields = ['code', 'name']


class TransactionViewSet(CompanyQuerysetMixin, ModelViewSet):
    """Financial transactions — immutable ledger (no update/delete)."""
    queryset = Transaction.objects.select_related('account', 'related_invoice').all()
    serializer_class = TransactionSerializer
    permission_classes = [IsAuthenticated, HasCompany]
    filterset_fields = ['account', 'transaction_type']
    ordering_fields = ['date', 'created_at']
    search_fields = ['reference', 'description']
    http_method_names = ['get', 'post', 'head', 'options']


class BudgetViewSet(CompanyQuerysetMixin, ModelViewSet):
    """Budgets per account/period — company-scoped."""
    queryset = Budget.objects.select_related('account').all()
    serializer_class = BudgetSerializer
    permission_classes = [require_permission('can_manage_budgets'), HasCompany]
    filterset_fields = ['account']
    ordering_fields = ['period_start', 'amount']


class ExpenseViewSet(CompanyQuerysetMixin, ModelViewSet):
    """Expense claims — approval workflow: PENDING → APPROVED (finance) → PAID (finance)."""
    queryset = Expense.objects.select_related('account', 'employee', 'approved_by').all()
    serializer_class = ExpenseSerializer
    permission_classes = [IsAuthenticated, HasCompany]
    filterset_fields = ['status', 'employee', 'account']
    ordering_fields = ['date', 'amount', 'created_at']

    @action(detail=True, methods=['post'],
            permission_classes=[require_permission('can_approve_expenses'), HasCompany])
    def approve(self, request, pk=None):
        """PENDING → APPROVED."""
        expense = self.get_object()
        if expense.status != Expense.Status.PENDING:
            return Response({'error': f'Only PENDING expenses can be approved. Current: "{expense.status}".'}, status=400)
        expense.status = Expense.Status.APPROVED
        expense.approved_by = request.user
        expense.save(update_fields=['status', 'approved_by'])
        return Response(ExpenseSerializer(expense).data)

    @action(detail=True, methods=['post'],
            permission_classes=[require_permission('can_approve_expenses'), HasCompany])
    def reject(self, request, pk=None):
        """Reject a pending expense claim."""
        expense = self.get_object()
        if expense.status != Expense.Status.PENDING:
            return Response({'error': f'Only PENDING expenses can be rejected. Current: "{expense.status}".'}, status=400)
        expense.status = Expense.Status.REJECTED
        expense.approved_by = request.user
        expense.save(update_fields=['status', 'approved_by'])
        return Response(ExpenseSerializer(expense).data)

    @action(detail=True, methods=['post'],
            permission_classes=[require_permission('can_mark_expense_paid'), HasCompany])
    def mark_paid(self, request, pk=None):
        """APPROVED → PAID."""
        expense = self.get_object()
        if expense.status != Expense.Status.APPROVED:
            return Response({'error': 'Only APPROVED expenses can be marked as paid.'}, status=400)
        expense.status = Expense.Status.PAID
        expense.save(update_fields=['status'])
        return Response(ExpenseSerializer(expense).data)
