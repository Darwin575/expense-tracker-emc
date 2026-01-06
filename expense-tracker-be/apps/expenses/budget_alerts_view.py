from datetime import date, timedelta
from calendar import monthrange

from django.db.models import Sum
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticatedOrReadOnly
from rest_framework import status

from .models import Expense, Budget
from .helpers import success_response, error_response, safe_float, safe_round, calculate_percentage
from .budget_alert_serializers import BudgetAlertResponseSerializer


class BudgetAlertsView(APIView):
    """
    Budget Alerts & Usage View
    Returns expense vs budget analysis for Day, Week, Month, and Year.
    """
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get(self, request):
        try:
            today = date.today()
            user = request.user if request.user.is_authenticated else None

            # === DATE RANGES ===
            # Month
            start_of_month = today.replace(day=1)
            days_in_month = monthrange(today.year, today.month)[1]
            
            # Week (Start Monday)
            start_of_week = today - timedelta(days=today.weekday())
            
            # Year
            start_of_year = today.replace(month=1, day=1)

            # === FETCH EXPENSES ===
            # We fetch all expenses for the year to filter in memory or DB
            # Use filter(user=user) if you want to restrict to logged-in user only
            # but per current pattern in views.py, we might show all for demo unless auth
            
            if user:
                base_qs = Expense.objects.filter(user=user)
            else:
                base_qs = Expense.objects.none()

            # Aggregates
            # 1. Today
            exp_today = base_qs.filter(date=today).aggregate(t=Sum('amount'))['t'] or 0
            
            # 2. This Week
            exp_week = base_qs.filter(date__gte=start_of_week).aggregate(t=Sum('amount'))['t'] or 0
            
            # 3. This Month
            exp_month = base_qs.filter(date__gte=start_of_month).aggregate(t=Sum('amount'))['t'] or 0
            
            # 4. This Year
            exp_year = base_qs.filter(date__gte=start_of_year).aggregate(t=Sum('amount'))['t'] or 0

            # === FETCH BUDGET ===
            # We get the budget for the CURRENT month to derive others
            if user:
                budget_qs = Budget.objects.filter(month=start_of_month, user=user)
            else:
                budget_qs = Budget.objects.none()
            
            # If multiple budgets exist (e.g. multiple users), for demo we just sum them 
            # or take the first if specific user. 
            # Assuming one budget per user per month.
            total_monthly_budget = budget_qs.aggregate(t=Sum('budget_amount'))['t'] or 0
            monthly_budget_val = safe_float(total_monthly_budget)

            # === CALCULATE BUDGETS ===
            # Daily: Month / Days in month
            daily_budget = monthly_budget_val / days_in_month if days_in_month else 0
            
            # Weekly: Month / 4.3 (approx weeks in month)
            weekly_budget = monthly_budget_val / 4.3
            
            # Yearly: We can either try to sum all monthly budgets for the year 
            # OR project the current one * 12. 
            # Let's try to fetch actual budgets for the year for accuracy.
            year_budgets_qs = Budget.objects.filter(month__year=today.year)
            if user:
                year_budgets_qs = year_budgets_qs.filter(user=user)
            total_yearly_budget = year_budgets_qs.aggregate(t=Sum('budget_amount'))['t'] or 0
            
            # If no yearly budget found yet (maybe only current month set), project it?
            # User asked for "percentage consumed response". 
            # If yearly budget is 0, we can't calc percentage. 
            # Fallback: if total_yearly_budget is 0 but we have monthly, project it? 
            # Let's stick to actual data first.
            yearly_budget_val = safe_float(total_yearly_budget)


            # === CONSTRUCT RESPONSE DATA ===
            def build_period_data(label, expense, budget):
                exp_val = safe_float(expense)
                bud_val = safe_float(budget)
                return {
                    "period": label,
                    "expense": safe_round(exp_val),
                    "budget": safe_round(bud_val),
                    "percentage_consumed": calculate_percentage(exp_val, bud_val),
                    "status": "over_budget" if exp_val > bud_val else "within_budget"
                }

            data = {
                "day": build_period_data("Today", exp_today, daily_budget),
                "week": build_period_data("This Week", exp_week, weekly_budget),
                "month": build_period_data("This Month", exp_month, monthly_budget_val),
                "year": build_period_data("This Year", exp_year, yearly_budget_val)
            }

            # Use Serializer to validate/format the response structure
            serializer = BudgetAlertResponseSerializer(data=data)
            serializer.is_valid(raise_exception=True)
            
            return success_response(
                data=serializer.data
            )

        except Exception as e:
            return error_response(
                message="Failed to calculate budget alerts",
                detail=str(e),
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
