"""HR views — all ViewSets company-scoped via CompanyQuerysetMixin."""
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet

from utils.mixins import CompanyQuerysetMixin
from utils.permissions import HasCompany, IsManager

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
    permission_classes = [IsManager, HasCompany]
    search_fields = ['name', 'code']
    ordering_fields = ['name']


class EmployeeViewSet(CompanyQuerysetMixin, ModelViewSet):
    """
    Employees — company-scoped.
    All authenticated users can view; Manager+ required to mutate.
    """
    queryset = Employee.objects.select_related('department', 'user').all()
    serializer_class = EmployeeSerializer
    permission_classes = [IsAuthenticated, HasCompany]
    search_fields = ['first_name', 'last_name', 'employee_id', 'email']
    filterset_fields = ['department', 'status', 'employment_type']
    ordering_fields = ['hire_date', 'last_name', 'created_at']

    def get_permissions(self):
        if self.request.method in ('GET', 'HEAD', 'OPTIONS'):
            return [IsAuthenticated(), HasCompany()]
        return [IsManager(), HasCompany()]


class LeaveTypeViewSet(CompanyQuerysetMixin, ModelViewSet):
    """Leave type definitions — company-scoped, Manager+ access."""
    queryset = LeaveType.objects.all()
    serializer_class = LeaveTypeSerializer
    permission_classes = [IsManager, HasCompany]


class LeaveRequestViewSet(CompanyQuerysetMixin, ModelViewSet):
    """
    Leave requests — company-scoped with approval workflow.
    Staff can submit; Manager+ can approve or reject.
    """
    queryset = LeaveRequest.objects.select_related(
        'employee', 'leave_type', 'approved_by'
    ).all()
    serializer_class = LeaveRequestSerializer
    permission_classes = [IsAuthenticated, HasCompany]
    filterset_fields = ['employee', 'status', 'leave_type']
    ordering_fields = ['start_date', 'created_at']

    @action(detail=True, methods=['post'], permission_classes=[IsManager, HasCompany])
    def approve(self, request, pk=None):
        """Approve a pending leave request."""
        leave = self.get_object()
        if leave.status != LeaveRequest.Status.PENDING:
            return Response(
                {'error': f'Only PENDING leave requests can be approved. Current status: "{leave.status}".'},
                status=400,
            )
        leave.status = LeaveRequest.Status.APPROVED
        leave.approved_by = request.user
        leave.save(update_fields=['status', 'approved_by'])
        return Response(LeaveRequestSerializer(leave).data)

    @action(detail=True, methods=['post'], permission_classes=[IsManager, HasCompany])
    def reject(self, request, pk=None):
        """Reject a pending leave request."""
        leave = self.get_object()
        if leave.status != LeaveRequest.Status.PENDING:
            return Response(
                {'error': f'Only PENDING leave requests can be rejected. Current status: "{leave.status}".'},
                status=400,
            )
        leave.status = LeaveRequest.Status.REJECTED
        leave.approved_by = request.user
        leave.save(update_fields=['status', 'approved_by'])
        return Response(LeaveRequestSerializer(leave).data)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated, HasCompany])
    def cancel(self, request, pk=None):
        """Cancel your own pending leave request."""
        leave = self.get_object()
        # Only the employee or a manager can cancel
        is_own_request = (
            hasattr(request.user, 'employee') and
            leave.employee == request.user.employee
        )
        is_manager = request.user.role in ('admin', 'manager')
        if not (is_own_request or is_manager):
            return Response({'error': 'You can only cancel your own leave requests.'}, status=403)
        if leave.status != LeaveRequest.Status.PENDING:
            return Response({'error': 'Only PENDING leave requests can be cancelled.'}, status=400)
        leave.status = LeaveRequest.Status.CANCELLED
        leave.save(update_fields=['status'])
        return Response(LeaveRequestSerializer(leave).data)
