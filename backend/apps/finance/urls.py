"""Finance URLs."""
from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import AccountViewSet, BudgetViewSet, ExpenseViewSet, TransactionViewSet

router = DefaultRouter()
router.register('accounts', AccountViewSet, basename='finance-account')
router.register('transactions', TransactionViewSet, basename='transaction')
router.register('budgets', BudgetViewSet, basename='budget')
router.register('expenses', ExpenseViewSet, basename='expense')

urlpatterns = [path('', include(router.urls))]
