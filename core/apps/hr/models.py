"""HR models: Department, Employee, LeaveType, LeaveRequest."""
from django.db import models
from django.utils.translation import gettext_lazy as _

from utils.models import BaseModel


class Department(BaseModel):
    name = models.CharField(max_length=255)
    code = models.CharField(max_length=20, unique=True)
    manager = models.ForeignKey(
        'Employee', null=True, blank=True,
        on_delete=models.SET_NULL, related_name='managed_departments'
    )

    class Meta:
        db_table = 'hr_departments'

    def __str__(self):
        return self.name


class Employee(BaseModel):
    class EmploymentType(models.TextChoices):
        FULL_TIME = 'full_time', _('Full Time')
        PART_TIME = 'part_time', _('Part Time')
        CONTRACT = 'contract', _('Contract')
        INTERN = 'intern', _('Intern')

    class Status(models.TextChoices):
        ACTIVE = 'active', _('Active')
        ON_LEAVE = 'on_leave', _('On Leave')
        TERMINATED = 'terminated', _('Terminated')

    user = models.OneToOneField('accounts.User', on_delete=models.SET_NULL, null=True, blank=True, related_name='employee')
    employee_id = models.CharField(max_length=20, unique=True)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    email = models.EmailField()
    phone = models.CharField(max_length=20, blank=True)
    department = models.ForeignKey(Department, on_delete=models.SET_NULL, null=True, related_name='employees')
    designation = models.CharField(max_length=255)
    employment_type = models.CharField(max_length=20, choices=EmploymentType.choices, default=EmploymentType.FULL_TIME)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.ACTIVE)
    hire_date = models.DateField()
    termination_date = models.DateField(null=True, blank=True)
    salary = models.DecimalField(max_digits=14, decimal_places=2, default=0)

    class Meta:
        db_table = 'hr_employees'
        ordering = ['last_name', 'first_name']

    @property
    def full_name(self):
        return f'{self.first_name} {self.last_name}'

    def __str__(self):
        return f'{self.employee_id} - {self.full_name}'


class LeaveType(BaseModel):
    name = models.CharField(max_length=100)
    days_allowed = models.PositiveIntegerField(default=0)
    is_paid = models.BooleanField(default=True)

    class Meta:
        db_table = 'hr_leave_types'

    def __str__(self):
        return self.name


class LeaveRequest(BaseModel):
    class Status(models.TextChoices):
        PENDING = 'pending', _('Pending')
        APPROVED = 'approved', _('Approved')
        REJECTED = 'rejected', _('Rejected')
        CANCELLED = 'cancelled', _('Cancelled')

    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='leave_requests')
    leave_type = models.ForeignKey(LeaveType, on_delete=models.PROTECT)
    start_date = models.DateField()
    end_date = models.DateField()
    reason = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    approved_by = models.ForeignKey(
        'accounts.User', null=True, blank=True,
        on_delete=models.SET_NULL, related_name='approved_leaves'
    )

    class Meta:
        db_table = 'hr_leave_requests'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.employee.full_name} - {self.leave_type.name}'
