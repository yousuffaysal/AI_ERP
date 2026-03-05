"""Finance models: Account, Transaction, Budget, Expense."""
from django.db import models
from django.utils.translation import gettext_lazy as _

from utils.models import BaseModel


class Account(BaseModel):
    """Chart of accounts."""

    class AccountType(models.TextChoices):
        ASSET = 'asset', _('Asset')
        LIABILITY = 'liability', _('Liability')
        EQUITY = 'equity', _('Equity')
        REVENUE = 'revenue', _('Revenue')
        EXPENSE = 'expense', _('Expense')

    code = models.CharField(max_length=20, unique=True)
    name = models.CharField(max_length=255)
    account_type = models.CharField(max_length=20, choices=AccountType.choices)
    parent = models.ForeignKey('self', null=True, blank=True, on_delete=models.SET_NULL, related_name='children')
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = 'finance_accounts'
        ordering = ['code']

    def __str__(self):
        return f'{self.code} - {self.name}'


class Transaction(BaseModel):
    """Double-entry bookkeeping transaction."""

    class TransactionType(models.TextChoices):
        DEBIT = 'debit', _('Debit')
        CREDIT = 'credit', _('Credit')

    reference = models.CharField(max_length=100, unique=True)
    account = models.ForeignKey(Account, on_delete=models.PROTECT, related_name='transactions')
    transaction_type = models.CharField(max_length=10, choices=TransactionType.choices)
    amount = models.DecimalField(max_digits=14, decimal_places=2)
    date = models.DateField()
    description = models.TextField(blank=True)
    related_invoice = models.ForeignKey(
        'sales.Invoice', null=True, blank=True, on_delete=models.SET_NULL, related_name='transactions'
    )

    class Meta:
        db_table = 'finance_transactions'
        ordering = ['-date']

    def __str__(self):
        return f'{self.reference} - {self.transaction_type} {self.amount}'


class Budget(BaseModel):
    """Annual/monthly budget per account."""
    account = models.ForeignKey(Account, on_delete=models.CASCADE, related_name='budgets')
    period_start = models.DateField()
    period_end = models.DateField()
    amount = models.DecimalField(max_digits=14, decimal_places=2)
    notes = models.TextField(blank=True)

    class Meta:
        db_table = 'finance_budgets'

    def __str__(self):
        return f'{self.account.name} ({self.period_start} – {self.period_end})'


class Expense(BaseModel):
    """Employee-submitted expense claim."""

    class Status(models.TextChoices):
        PENDING = 'pending', _('Pending')
        APPROVED = 'approved', _('Approved')
        REJECTED = 'rejected', _('Rejected')
        PAID = 'paid', _('Paid')

    title = models.CharField(max_length=255)
    account = models.ForeignKey(Account, on_delete=models.PROTECT)
    employee = models.ForeignKey('hr.Employee', on_delete=models.PROTECT, related_name='expenses')
    amount = models.DecimalField(max_digits=14, decimal_places=2)
    date = models.DateField()
    receipt = models.FileField(upload_to='receipts/', blank=True, null=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    approved_by = models.ForeignKey(
        'accounts.User', null=True, blank=True, on_delete=models.SET_NULL, related_name='approved_expenses'
    )

    class Meta:
        db_table = 'finance_expenses'
        ordering = ['-date']

    def __str__(self):
        return f'{self.title} - {self.amount}'
