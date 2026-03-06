from .views import GenerateReportView, ScheduleReportView

app_name = 'reports'

urlpatterns = [
    path('generate/', GenerateReportView.as_view(), name='report-generate'),
    path('schedule/', ScheduleReportView.as_view(), name='report-schedule'),
]
