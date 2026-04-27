"""HR views — all ViewSets company-scoped via CompanyQuerysetMixin."""
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet

from utils.mixins import CompanyQuerysetMixin
from utils.permissions import HasCompany, require_permission

from .models import Department, Employee, LeaveRequest, LeaveType
from .serializers import (
    DepartmentSerializer,
    EmployeeSerializer,
    LeaveRequestSerializer,
    LeaveTypeSerializer,
)


class DepartmentViewSet(CompanyQuerysetMixin, ModelViewSet):
    """Departments — company-scoped."""
    queryset = Department.objects.select_related('manager').all()
    serializer_class = DepartmentSerializer
    permission_classes = [require_permission('can_manage_employees'), HasCompany]
    search_fields = ['name', 'code']
    ordering_fields = ['name']


class EmployeeViewSet(CompanyQuerysetMixin, ModelViewSet):
    """Employees — all authenticated can view; HR Manager+ required to mutate."""
    queryset = Employee.objects.select_related('department', 'user').all()
    serializer_class = EmployeeSerializer
    permission_classes = [IsAuthenticated, HasCompany]
    search_fields = ['first_name', 'last_name', 'employee_id', 'email']
    filterset_fields = ['department', 'status', 'employment_type']
    ordering_fields = ['hire_date', 'last_name', 'created_at']

    def get_permissions(self):
        if self.request.method in ('GET', 'HEAD', 'OPTIONS'):
            return [IsAuthenticated(), HasCompany()]
        return [require_permission('can_manage_employees')(), HasCompany()]


class LeaveTypeViewSet(CompanyQuerysetMixin, ModelViewSet):
    """Leave type definitions — HR Manager+ access."""
    queryset = LeaveType.objects.all()
    serializer_class = LeaveTypeSerializer
    permission_classes = [require_permission('can_approve_leave'), HasCompany]


class LeaveRequestViewSet(CompanyQuerysetMixin, ModelViewSet):
    """Leave requests — staff can submit; HR Manager+ can approve/reject."""
    queryset = LeaveRequest.objects.select_related(
        'employee', 'leave_type', 'approved_by'
    ).all()
    serializer_class = LeaveRequestSerializer
    permission_classes = [IsAuthenticated, HasCompany]
    filterset_fields = ['employee', 'status', 'leave_type']
    ordering_fields = ['start_date', 'created_at']

    @action(detail=True, methods=['post'],
            permission_classes=[require_permission('can_approve_leave'), HasCompany])
    def approve(self, request, pk=None):
        leave = self.get_object()
        if leave.status != LeaveRequest.Status.PENDING:
            return Response({'error': f'Only PENDING requests can be approved. Current: "{leave.status}".'}, status=400)
        leave.status = LeaveRequest.Status.APPROVED
        leave.approved_by = request.user
        leave.save(update_fields=['status', 'approved_by'])
        return Response(LeaveRequestSerializer(leave).data)

    @action(detail=True, methods=['post'],
            permission_classes=[require_permission('can_approve_leave'), HasCompany])
    def reject(self, request, pk=None):
        leave = self.get_object()
        if leave.status != LeaveRequest.Status.PENDING:
            return Response({'error': f'Only PENDING requests can be rejected. Current: "{leave.status}".'}, status=400)
        leave.status = LeaveRequest.Status.REJECTED
        leave.approved_by = request.user
        leave.save(update_fields=['status', 'approved_by'])
        return Response(LeaveRequestSerializer(leave).data)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated, HasCompany])
    def cancel(self, request, pk=None):
        leave = self.get_object()
        is_own = hasattr(request.user, 'employee') and leave.employee == request.user.employee
        can_approve = request.user.has_erp_permission('can_approve_leave')
        if not (is_own or can_approve):
            return Response({'error': 'You can only cancel your own leave requests.'}, status=403)
        if leave.status != LeaveRequest.Status.PENDING:
            return Response({'error': 'Only PENDING requests can be cancelled.'}, status=400)
        leave.status = LeaveRequest.Status.CANCELLED
        leave.save(update_fields=['status'])
        return Response(LeaveRequestSerializer(leave).data)
