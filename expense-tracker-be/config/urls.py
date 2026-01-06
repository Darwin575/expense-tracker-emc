from django.contrib import admin
from django.urls import path, include
from rest_framework import routers
from apps.expenses.views import ExpenseViewSet
from apps.authentication.views import AdminUserViewSet

from apps.expenses.views import ExpenseViewSet, CategoryViewSet, BudgetViewSet, StubExpenseView
from apps.expenses.dashboard_views import (
    DashboardSummaryView,
    CategoryBreakdownView,
    WeeklySpendingView,
    MonthlyTrendView,
)
from apps.expenses.export_views import ExportExpensesView
from apps.expenses.budget_alerts_view import BudgetAlertsView
from apps.expenses.recurring_views import RecurringExpenseListView

router = routers.DefaultRouter()
router.register(r'expenses', ExpenseViewSet, basename='expense')
router.register(r'auth/admin/users', AdminUserViewSet, basename='admin-users')
router.register(r'categories', CategoryViewSet, basename='category')
router.register(r'budgets', BudgetViewSet, basename='budget')

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('apps.authentication.urls')),  # non-router views
    path('api/expenses/recurring/', RecurringExpenseListView.as_view(), name='recurring-expenses'),
    path('api/', include(router.urls)),
    path('api/stub/expenses/', StubExpenseView.as_view(), name='stub-expenses'),
    
    # Dashboard
    path('api/dashboard/summary/', DashboardSummaryView.as_view(), name='dashboard-summary'),
    
    # Analytics (Charts)
    path('api/analytics/category-breakdown/', CategoryBreakdownView.as_view(), name='analytics-category-breakdown'),
    path('api/analytics/weekly-spending/', WeeklySpendingView.as_view(), name='analytics-weekly-spending'),
    path('api/analytics/monthly-trend/', MonthlyTrendView.as_view(), name='analytics-monthly-trend'),

    
    # Export
    path('api/export/', ExportExpensesView.as_view(), name='export-expenses'),

    # Alerts
    path('api/alerts/budget/', BudgetAlertsView.as_view(), name='budget-alerts'),
    
    path('api-auth/', include('rest_framework.urls', namespace='rest_framework')),
]
