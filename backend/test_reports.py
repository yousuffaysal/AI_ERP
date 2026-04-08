import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')
django.setup()

from apps.accounts.models import Company, User
from apps.inventory.models import Product
from apps.sales.models import Invoice, InvoiceItem
from apps.reports.services.query import QueryBuilder
from apps.reports.services.excel import SpreadsheetGenerator
from apps.reports.services.pdf import DocumentGenerator
from apps.reports.tasks import send_scheduled_report
import uuid

def main():
    print("--- Testing Smart Reporting Engine ---")
    
    # 1. Grab a test company/user
    company = Company.objects.first()
    if not company:
        print("Creating mock company for test...")
        company = Company.objects.create(name="Reporting Test Corp")
        product = Product.objects.create(company=company, name="Test Item", sku="TST-1", unit_price=10.0, current_stock=100)
        Invoice.objects.create(company=company, invoice_number="INV-001", status="PAID", subtotal=100.0)
        Invoice.objects.create(company=company, invoice_number="INV-002", status="DRAFT", subtotal=50.0)
        
    print(f"Using Company: {company.name}")
    
    # 2. Test Dynamic Query Builder
    payload = {
        "model": "sales_invoice",
        "filters": {"status": "PAID"},
        "order_by": "-created_at",
        "select_fields": ["invoice_number", "status", "subtotal", "created_at"]
    }
    
    print("\n1. Testing QueryBuilder...")
    qs = QueryBuilder.build(company, payload)
    data = list(qs)
    print(f"Found {len(data)} paid invoices.")
    print("Sample:", data[0] if len(data) > 0 else "None")
    
    # 3. Test PDF Generator
    print("\n2. Testing PDF Generator...")
    pdf_bytes = DocumentGenerator.generate_pdf(data, "Paid Invoices Report")
    with open("/tmp/test_report.pdf", "wb") as f:
        f.write(pdf_bytes)
    print(f"Saved PDF to /tmp/test_report.pdf ({len(pdf_bytes)} bytes)")
    
    # 4. Test Excel Generator
    print("\n3. Testing Excel Generator...")
    excel_bytes = SpreadsheetGenerator.generate_excel(data, "Paid Invoices Report")
    with open("/tmp/test_report.xlsx", "wb") as f:
        f.write(excel_bytes)
    print(f"Saved Excel to /tmp/test_report.xlsx ({len(excel_bytes)} bytes)")
    
    # 5. Test Celery Task directly (simulating worker execution)
    print("\n4. Testing Celery Email Task...")
    payload['format'] = 'pdf'
    # We call it synchronously instead of .delay() to ensure it traces out here rather than needing a worker running
    send_scheduled_report(str(company.id), "admin@example.com", payload, "Executive Paid Invoices Report")

if __name__ == "__main__":
    main()
