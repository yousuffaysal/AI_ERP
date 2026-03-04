"""Finance serializers."""
from rest_framework import serializers

from .models import Account, Budget, Expense, Transaction


class AccountSerializer(serializers.ModelSerializer):
    class Meta:
        model = Account
        fields = ['id', 'code', 'name', 'account_type', 'parent', 'is_active']


class TransactionSerializer(serializers.ModelSerializer):
    account_name = serializers.CharField(source='account.name', read_only=True)

    class Meta:
        model = Transaction
        fields = [
            'id', 'reference', 'account', 'account_name', 'transaction_type',
            'amount', 'date', 'description', 'related_invoice',
        ]


class BudgetSerializer(serializers.ModelSerializer):
    account_name = serializers.CharField(source='account.name', read_only=True)

    class Meta:
        model = Budget
        fields = ['id', 'account', 'account_name', 'period_start', 'period_end', 'amount', 'notes']


class ExpenseSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.full_name', read_only=True)
    balance = serializers.DecimalField(max_digits=14, decimal_places=2, read_only=True, source='amount')

    class Meta:
        model = Expense
        fields = [
            'id', 'title', 'account', 'employee', 'employee_name',
            'amount', 'date', 'receipt', 'status', 'approved_by',
        ]
        read_only_fields = ['status', 'approved_by']
