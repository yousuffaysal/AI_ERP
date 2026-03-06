from django.apps import apps
from django.db.models import QuerySet
import logging

logger = logging.getLogger(__name__)

class QueryBuilder:
    """
    Dynamically builds Django ORM QuerySets from JSON parameters.
    Includes hardcoded tenant security to ensure data boundaries.
    """
    
    # Restrict which models can be queried to prevent exposing
    # internal models like Users, ContentTypes, or Sessions.
    ALLOWED_MODELS = {
        'sales_invoice': ('sales', 'Invoice'),
        'inventory_product': ('inventory', 'Product'),
        'finance_transaction': ('finance', 'Transaction'),
        'hr_employee': ('hr', 'Employee')
    }
    
    @classmethod
    def build(cls, company, request_payload: dict) -> QuerySet:
        """
        Parses JSON request_payload and returns a Django QuerySet.
        Example:
        {
            "model": "sales_invoice",
            "filters": {
                "status": "PAID",
                "total_amount__gte": 1000
            },
            "order_by": "-created_at",
            "select_fields": ["invoice_number", "total_amount", "status", "created_at"]
        }
        """
        model_alias = request_payload.get('model')
        if model_alias not in cls.ALLOWED_MODELS:
            raise ValueError(f"Model '{model_alias}' is not allowed for dynamic reporting.")
            
        app_label, model_name = cls.ALLOWED_MODELS[model_alias]
        
        try:
            ModelClass = apps.get_model(app_label, model_name)
        except LookupError:
            raise ValueError(f"Could not load model {app_label}.{model_name}")
            
        # 1. Start with Tenant boundaries ALWAYS enforced
        # Assume all target models have a `company` ForeignKey
        qs = ModelClass.objects.filter(company=company)
        
        # 2. Apply dynamic filters safely
        filters = request_payload.get('filters', {})
        if filters:
            # We trust Django's ORM to sanitize SQL injections in kwargs
            # However, we should stringify/cast where possible, or just pass kwargs
            try:
                qs = qs.filter(**filters)
            except Exception as e:
                logger.warning(f"Invalid filter parameters provided to reporting engine: {filters}. Error: {e}")
                raise ValueError("One or more filter parameters are invalid for this dataset.")
                
        # 3. Apply ordering
        order_by = request_payload.get('order_by')
        if order_by:
            # Basic mitigation against sorting via related un-owed records
            if isinstance(order_by, str) and not order_by.startswith('__'):
                try:
                    qs = qs.order_by(order_by)
                except Exception:
                    pass
        
        # 4. Filter Specific Fields if requested
        select_fields = request_payload.get('select_fields', [])
        if select_fields and isinstance(select_fields, list):
            # values() returns an iterable of dictionaries instead of model instances,
            # which is much faster for massive report generation.
            try:
                qs = qs.values(*select_fields)
            except Exception:
                raise ValueError("Invalid fields requested in select_fields.")
            
        return qs
