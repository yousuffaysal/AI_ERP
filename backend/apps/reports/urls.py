from django.urls import path
from .views import GenerateReportView, ScheduleReportView, DashboardStatsOverviewView

app_name = 'reports'

urlpatterns = [
    path('generate/', GenerateReportView.as_view(), name='report-generate'),
    path('schedule/', ScheduleReportView.as_view(), name='report-schedule'),
    path('dashboard-stats/', DashboardStatsOverviewView.as_view(), name='dashboard-stats'),
]
