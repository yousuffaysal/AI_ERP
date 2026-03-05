from uuid import UUID
from datetime import datetime, timedelta
from typing import Dict, Any, List
from decimal import Decimal

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text

class BusinessHealthService:
    """
    Core Business Intelligence (BI) engine for AI_ERP.
    Calculates a real-time Health Score by synthesizing data
    across Sales, Finance, Inventory, and HR modules.
    """

    def __init__(self, db: AsyncSession, company_id: UUID):
        self.db = db
        self.company_id = company_id
        
    async def get_health_score(self) -> Dict[str, Any]:
        """Calculate and return the overall business health score."""
        revenue_score, rev_growth = await self._calc_revenue_growth()
        cash_score, cash_ratio = await self._calc_cash_stability()
        inventory_score, inv_turnover = await self._calc_inventory_turnover()
        hr_score, rev_per_employee = await self._calc_employee_productivity()

        # Weighted calculation
        total_score = (
            (revenue_score * 0.3) +
            (cash_score * 0.3) +
            (inventory_score * 0.2) +
            (hr_score * 0.2)
        )
        total_score = round(total_score, 1)

        # Determine status and explanation
        if total_score >= 80:
            status = "Green"
            explanation = "Business is highly healthy. Strong cash flow and revenue growth."
        elif total_score >= 50:
            status = "Yellow"
            explanation = "Moderate health. Monitor cash flow stability or inventory turnover."
        else:
            status = "Red"
            explanation = "Critical health warning. Immediate action required to boost revenue or cut costs."

        return {
            "score": total_score,
            "status": status,
            "explanation": explanation,
            "metrics": {
                "revenue_growth_pct": round(rev_growth * 100, 1),
                "revenue_score": round(revenue_score, 1),
                "operating_cash_ratio": round(cash_ratio, 2),
                "cash_score": round(cash_score, 1),
                "inventory_turnover_rate": round(inv_turnover, 2),
                "inventory_score": round(inventory_score, 1),
                "revenue_per_employee": round(rev_per_employee, 2),
                "employee_productivity_score": round(hr_score, 1),
            }
        }

    async def _calc_revenue_growth(self) -> tuple[float, float]:
        """
        Revenue of last 30 days vs previous 30 days.
        Source: sales_invoices (status in PAID, PARTIAL)
        Weight: 30%
        """
        query = text("""
            SELECT 
                SUM(CASE WHEN issue_date >= current_date - interval '30 days' THEN amount_paid ELSE 0 END) as recent_revenue,
                SUM(CASE WHEN issue_date >= current_date - interval '60 days' AND issue_date < current_date - interval '30 days' THEN amount_paid ELSE 0 END) as previous_revenue
            FROM sales_invoices
            WHERE company_id = :company_id
              AND status IN ('paid', 'partial')
              AND issue_date >= current_date - interval '60 days'
        """)
        
        result = await self.db.execute(query, {"company_id": self.company_id})
        row = result.fetchone()
        
        recent = float(row[0] or 0)
        previous = float(row[1] or 0)
        
        if previous == 0:
            growth = 1.0 if recent > 0 else 0.0 # 100% growth if we went from 0 to something
        else:
            growth = (recent - previous) / previous

        # Score mapping: >= 20% growth = 100 score. 0% = 50 score.
        score = min(max((growth * 250) + 50, 0), 100)
        return score, growth

    async def _calc_cash_stability(self) -> tuple[float, float]:
        """
        Inflows vs Outflows over last 90 days.
        Source: finance_transactions
        Weight: 30%
        """
        query = text("""
            SELECT transaction_type, SUM(amount)
            FROM finance_transactions
            WHERE company_id = :company_id
              AND date >= current_date - interval '90 days'
            GROUP BY transaction_type
        """)
        
        result = await self.db.execute(query, {"company_id": self.company_id})
        
        inflow = 0.0
        outflow = 0.0
        
        for row in result:
            t_type = row[0]
            amount = float(row[1])
            # Assuming credits to asset/revenue accounts are generally inflows, debits are outflows.
            # Simplified for AI_ERP: CREDIT = Inflow, DEBIT = Outflow
            if t_type == 'credit':
                inflow += amount
            elif t_type == 'debit':
                outflow += amount
                
        if outflow == 0:
            ratio = 2.0 if inflow > 0 else 1.0
        else:
            ratio = inflow / outflow
            
        # Score mapping: Ratio >= 1.2 = 100 score. Ratio 1.0 = 50 score.
        score = min(max((ratio - 1.0) * 250 + 50, 0), 100)
        return score, ratio

    async def _calc_inventory_turnover(self) -> tuple[float, float]:
        """
        Average inventory turnover rate (COGS / Avg Stock Value) over 90 days.
        Source: inventory_stock_movements, inventory_products
        Weight: 20%
        """
        # Calculate strict COGS and average value for the company
        query = text("""
            WITH movement_sums AS (
                SELECT product_id,
                       SUM(CASE WHEN movement_type IN ('out', 'sale') THEN quantity ELSE 0 END) as qty_sold
                FROM inventory_stock_movements
                WHERE company_id = :company_id
                  AND created_at >= current_date - interval '90 days'
                GROUP BY product_id
            )
            SELECT 
                SUM(ms.qty_sold * p.cost_price) as total_cogs,
                SUM(s.quantity * p.cost_price) as current_inventory_value
            FROM movement_sums ms
            JOIN inventory_products p ON p.id = ms.product_id
            JOIN inventory_stock s ON s.product_id = p.id
            WHERE s.company_id = :company_id
        """)
        
        result = await self.db.execute(query, {"company_id": self.company_id})
        row = result.fetchone()
        
        cogs = float(row[0] or 0)
        inv_val = float(row[1] or 0)
        
        if inv_val == 0:
            turnover = 4.0 if cogs > 0 else 0.0
        else:
            turnover = cogs / inv_val

        # Score mapping: >= 4 turnover = 100 score
        score = min(max((turnover / 4.0) * 100, 0), 100)
        return score, turnover

    async def _calc_employee_productivity(self) -> tuple[float, float]:
        """
        Total Revenue / Active Employees (last 30 days)
        Source: hr_employees, sales_invoices
        Weight: 20%
        """
        # 1. Get active employee count
        emp_query = text("""
            SELECT COUNT(id) FROM hr_employees
            WHERE company_id = :company_id AND status = 'active'
        """)
        emp_res = await self.db.execute(emp_query, {"company_id": self.company_id})
        emp_count = int(emp_res.scalar() or 0)

        # 2. Get 30-day revenue
        rev_query = text("""
            SELECT SUM(amount_paid) FROM sales_invoices
            WHERE company_id = :company_id
              AND status IN ('paid', 'partial')
              AND issue_date >= current_date - interval '30 days'
        """)
        rev_res = await self.db.execute(rev_query, {"company_id": self.company_id})
        revenue = float(rev_res.scalar() or 0)
        
        if emp_count == 0:
            rev_per_emp = revenue if revenue > 0 else 0.0
        else:
            rev_per_emp = revenue / emp_count

        # Score mapping: Benchmark is $10,000 revenue per employee per month
        benchmark = 10000.0
        score = min(max((rev_per_emp / benchmark) * 100, 0), 100)
        return score, rev_per_emp
