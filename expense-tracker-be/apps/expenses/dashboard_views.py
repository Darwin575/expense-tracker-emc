"""
Dashboard and Analytics API views.
All dashboard page endpoints: summary, charts, and graphs.
"""
import logging
from datetime import date, timedelta

from django.db.models import Sum, Count, Avg, Max, Min
from django.db.models.functions import TruncMonth
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticatedOrReadOnly
from rest_framework.throttling import AnonRateThrottle, UserRateThrottle
from rest_framework import status

from .models import Expense, Budget
from .helpers import (
    # Constants
    MAX_MONTHS_LOOKBACK,
    MAX_CATEGORIES,
    # Type conversion
    safe_float,
    safe_round,
    # Date validation
    parse_month_string,
    get_week_date_range,
    validate_week_offset,
    validate_months_count,
    # Response helpers
    error_response,
    success_response,
    # Calculation helpers
    calculate_percentage,
    calculate_trend,
    calculate_change,
    # Config helpers
)

logger = logging.getLogger(__name__)


# =============================================================================
# DASHBOARD SUMMARY
# =============================================================================

class DashboardSummaryView(APIView):
    """
    Dashboard summary statistics.
    Returns grouped data for frontend dashboard components.
    """
    permission_classes = [IsAuthenticatedOrReadOnly]
    throttle_classes = [AnonRateThrottle, UserRateThrottle]

    def get(self, request):
        try:
            today = date.today()
            start_of_month = today.replace(day=1)
            start_of_week = today - timedelta(days=today.weekday())
            
            # Calculate days in current month
            if today.month == 12:
                next_month = today.replace(year=today.year + 1, month=1, day=1)
            else:
                next_month = today.replace(month=today.month + 1, day=1)
            days_in_month = (next_month - start_of_month).days
            days_passed = today.day

            expenses = Expense.objects.filter(user=request.user) if request.user.is_authenticated else Expense.objects.none()
            expenses_this_month = expenses.filter(date__gte=start_of_month)

            # === PERIOD INFO ===
            period = {
                "current_month": today.strftime('%Y-%m'),
                "month_name": today.strftime('%B %Y'),
                "start_date": str(start_of_month),
                "end_date": str(today),
                "days_in_month": days_in_month,
                "days_passed": days_passed
            }

            # === SPENDING SUMMARY ===
            total_this_month = expenses_this_month.aggregate(total=Sum('amount'))['total'] or 0
            total_this_week = expenses.filter(date__gte=start_of_week).aggregate(total=Sum('amount'))['total'] or 0
            total_today = expenses.filter(date=today).aggregate(total=Sum('amount'))['total'] or 0
            expense_count_this_month = expenses_this_month.count()
            
            daily_avg = safe_float(total_this_month) / days_passed if days_passed > 0 else 0

            spending = {
                "total_this_month": safe_round(total_this_month),
                "total_this_week": safe_round(total_this_week),
                "total_today": safe_round(total_today),
                "transaction_count": expense_count_this_month,
                "daily_average": safe_round(daily_avg)
            }

            # === BUDGET INFO ===
            budget_data = Budget.objects.filter(month=start_of_month, user=request.user).first() if request.user.is_authenticated else None
            if budget_data:
                budget_amount = safe_float(budget_data.budget_amount)
                spent = safe_float(total_this_month)
                remaining = budget_amount - spent
                utilization = calculate_percentage(spent, budget_amount)
                
                days_remaining = days_in_month - days_passed
                daily_budget_remaining = remaining / days_remaining if days_remaining > 0 else 0
                
                budget = {
                    "amount": budget_amount,
                    "spent": spent,
                    "remaining": safe_round(remaining),
                    "utilization_percent": utilization,
                    "daily_recommended": safe_round(daily_budget_remaining),
                    "status": "over_budget" if remaining < 0 else "on_track" if utilization <= 80 else "warning"
                }
            else:
                budget = {
                    "amount": None,
                    "spent": safe_round(total_this_month),
                    "remaining": None,
                    "utilization_percent": None,
                    "daily_recommended": None,
                    "status": "no_budget_set"
                }

            # === TOP SPENDING CATEGORY ===
            top_category_data = expenses_this_month.values(
                'category__id', 'category__name', 'category__color_code'
            ).annotate(
                total=Sum('amount'),
                count=Count('id')
            ).order_by('-total').first()

            if top_category_data and top_category_data['category__name']:
                cat_total = safe_float(top_category_data['total'])
                top_category = {
                    "id": top_category_data['category__id'],
                    "name": top_category_data['category__name'],
                    "color_code": top_category_data['category__color_code'],
                    "amount": safe_round(cat_total),
                    "transaction_count": top_category_data['count'],
                    "percentage": calculate_percentage(cat_total, safe_float(total_this_month))
                }
            else:
                top_category = None

            # === CATEGORY BREAKDOWN (Top 5) ===
            categories_breakdown = expenses_this_month.values(
                'category__id', 'category__name', 'category__color_code'
            ).annotate(
                total=Sum('amount'),
                count=Count('id')
            ).order_by('-total')[:5]

            categories = []
            for cat in categories_breakdown:
                if cat['category__name']:
                    cat_total = safe_float(cat['total'])
                    categories.append({
                        "id": cat['category__id'],
                        "name": cat['category__name'],
                        "color_code": cat['category__color_code'],
                        "amount": safe_round(cat_total),
                        "count": cat['count'],
                        "percentage": calculate_percentage(cat_total, safe_float(total_this_month))
                    })

            # === TOP EXPENSES ===
            top_expenses_qs = expenses_this_month.select_related('category').order_by('-amount')[:5]
            top_expenses = []
            for exp in top_expenses_qs:
                top_expenses.append({
                    "id": exp.id,
                    "title": exp.title,
                    "amount": safe_round(exp.amount),
                    "category": exp.category.name if exp.category else None,
                    "date": str(exp.date),
                })

            # === RECENT EXPENSES ===
            recent_expenses_qs = expenses.select_related('category').order_by('-date', '-created_at')[:5]
            recent_expenses = []
            for exp in recent_expenses_qs:
                recent_expenses.append({
                    "id": exp.id,
                    "title": exp.title,
                    "amount": safe_round(exp.amount),
                    "category": exp.category.name if exp.category else None,
                    "date": str(exp.date),
                })


            # === COMPARISON (vs last month) ===
            last_month_start = (start_of_month - timedelta(days=1)).replace(day=1)
            last_month_end = start_of_month - timedelta(days=1)
            
            total_last_month = expenses.filter(
                date__gte=last_month_start,
                date__lte=last_month_end
            ).aggregate(total=Sum('amount'))['total'] or 0

            current = safe_float(total_this_month)
            previous = safe_float(total_last_month)
            trend = calculate_trend(current, previous)
            change_amount, change_percent = calculate_change(current, previous)

            comparison = {
                "last_month_total": safe_round(total_last_month),
                "change_amount": change_amount,
                "change_percent": change_percent,
                "trend": trend
            }

            # === BUILD RESPONSE ===
            return Response({
                "success": True,
                "period": period,
                "spending": spending,
                "budget": budget,
                "top_category": top_category,
                "categories": categories,
                "top_expenses": top_expenses,
                "recent_expenses": recent_expenses,
                "comparison": comparison
            })

        except Exception as e:
            logger.error(f"Dashboard summary error: {str(e)}", exc_info=True)
            return error_response(
                message="Unable to load dashboard data",
                detail=str(e),
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


# =============================================================================
# ANALYTICS - CATEGORY BREAKDOWN (Pie/Donut Chart)
# =============================================================================

class CategoryBreakdownView(APIView):
    """
    Pie/Donut chart data - expenses grouped by category.
    
    Query params: 
        ?month=2025-12 (optional, defaults to current month)
    
    Returns top 10 categories.
    """
    permission_classes = [IsAuthenticatedOrReadOnly]
    throttle_classes = [AnonRateThrottle, UserRateThrottle]

    def get(self, request):
        try:
            month = request.query_params.get('month')
            start_date, end_date = parse_month_string(month)
            
            if start_date is None and month:
                return error_response(
                    message="Invalid month format. Use YYYY-MM (e.g., 2025-12)",
                    status_code=status.HTTP_400_BAD_REQUEST
                )
            
            expenses = Expense.objects.filter(
                date__gte=start_date,
                date__lte=end_date,
                user=request.user if request.user.is_authenticated else None
            ).select_related('category')
            
            data = expenses.values(
                'category__id', 'category__name', 'category__color_code'
            ).annotate(
                value=Sum('amount'),
                count=Count('id'),
                avg_amount=Avg('amount'),
                max_amount=Max('amount')
            ).order_by('-value')[:MAX_CATEGORIES]

            total = sum(safe_float(item['value']) for item in data)
            total_transactions = sum(item['count'] for item in data)

            result = []
            for item in data:
                value = safe_float(item['value'])
                result.append({
                    "id": item['category__id'],
                    "name": item['category__name'] or "Uncategorized",
                    "value": safe_round(value),
                    "color": item['category__color_code'] or "#6B7280",
                    "count": item['count'],
                    "percentage": calculate_percentage(value, total),
                    "average": safe_round(item['avg_amount']),
                    "largest": safe_round(item['max_amount'])
                })

            return success_response(
                data=result,
                meta={
                    "period": month or start_date.strftime('%Y-%m'),
                    "period_label": start_date.strftime('%B %Y'),
                    "start_date": str(start_date),
                    "end_date": str(end_date),
                    "total_categories": len(result),
                    "max_categories": MAX_CATEGORIES
                },
                summary={
                    "total": safe_round(total),
                    "transaction_count": total_transactions,
                    "average_per_transaction": safe_round(total / total_transactions) if total_transactions > 0 else 0
                }
            )

        except Exception as e:
            logger.error(f"Category breakdown error: {str(e)}", exc_info=True)
            return error_response(
                message="Unable to load category breakdown data",
                detail=str(e),
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


# =============================================================================
# ANALYTICS - WEEKLY SPENDING (Bar Chart)
# =============================================================================

class WeeklySpendingView(APIView):
    """
    Bar chart data - daily spending for the week.
    
    Query params:
        ?week_offset=0 (0 = current week, -1 = last week, etc. Max: -52)
    
    Returns 7 days (Mon-Sun).
    """
    permission_classes = [IsAuthenticatedOrReadOnly]
    throttle_classes = [AnonRateThrottle, UserRateThrottle]

    def get(self, request):
        try:
            week_offset = validate_week_offset(
                request.query_params.get('week_offset', '0')
            )
            
            start_of_week, end_of_week = get_week_date_range(week_offset)
            today = date.today()
            
            # Group by date field directly (SQLite compatible)
            expenses = Expense.objects.filter(
                date__gte=start_of_week,
                date__lte=end_of_week,
                user=request.user if request.user.is_authenticated else None
            ).values('date').annotate(
                total=Sum('amount'),
                count=Count('id'),
                avg=Avg('amount')
            ).order_by('date')

            expenses_dict = {item['date']: item for item in expenses}

            result = []
            week_total = 0
            highest_day = {"day": None, "total": 0}
            
            for i in range(7):
                current_day = start_of_week + timedelta(days=i)
                day_data = expenses_dict.get(current_day, {'total': 0, 'count': 0, 'avg': 0})
                day_total = safe_float(day_data['total'])
                week_total += day_total
                
                if day_total > highest_day['total']:
                    highest_day = {"day": current_day.strftime('%A'), "total": day_total}
                
                result.append({
                    "date": str(current_day),
                    "day": current_day.strftime('%a'),
                    "day_full": current_day.strftime('%A'),
                    "day_number": current_day.strftime('%d'),
                    "total": safe_round(day_total),
                    "count": day_data['count'],
                    "is_today": current_day == today
                })

            days_with_spending = sum(1 for item in result if item['total'] > 0)

            return success_response(
                data=result,
                meta={
                    "week_offset": week_offset,
                    "start_date": str(start_of_week),
                    "end_date": str(end_of_week),
                    "week_label": f"{start_of_week.strftime('%b %d')} - {end_of_week.strftime('%b %d, %Y')}",
                    "is_current_week": week_offset == 0
                },
                summary={
                    "total": safe_round(week_total),
                    "daily_average": safe_round(week_total / 7),
                    "transaction_count": sum(item['count'] for item in result),
                    "days_with_spending": days_with_spending,
                    "highest_spending_day": highest_day['day'],
                    "highest_spending_amount": safe_round(highest_day['total'])
                }
            )

        except Exception as e:
            logger.error(f"Weekly spending error: {str(e)}", exc_info=True)
            return error_response(
                message="Unable to load weekly spending data",
                detail=str(e),
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


# =============================================================================
# ANALYTICS - MONTHLY TREND (Line Chart)
# =============================================================================

class MonthlyTrendView(APIView):
    """
    Line chart data - monthly spending trend.
    
    Query params:
        ?months=6 (default: 6, max: 12)
    """
    permission_classes = [IsAuthenticatedOrReadOnly]
    throttle_classes = [AnonRateThrottle, UserRateThrottle]

    def get(self, request):
        try:
            months = validate_months_count(
                request.query_params.get('months', '6')
            )

            today = date.today()
            start_date = today - timedelta(days=months * 31)
            
            data = Expense.objects.filter(
                date__gte=start_date,
                user=request.user if request.user.is_authenticated else None
            ).annotate(
                month=TruncMonth('date')
            ).values('month').annotate(
                total=Sum('amount'),
                count=Count('id'),
                avg=Avg('amount'),
                max_expense=Max('amount'),
                min_expense=Min('amount')
            ).order_by('month')

            result = []
            grand_total = 0
            highest_month = {"month": None, "total": 0}
            lowest_month = {"month": None, "total": float('inf')}
            
            for item in list(data)[-months:]:
                total = safe_float(item['total'])
                grand_total += total
                
                month_name = item['month'].strftime('%B %Y')
                
                if total > highest_month['total']:
                    highest_month = {"month": month_name, "total": total}
                if total < lowest_month['total']:
                    lowest_month = {"month": month_name, "total": total}
                
                result.append({
                    "month": item['month'].strftime('%Y-%m'),
                    "month_short": item['month'].strftime('%b'),
                    "month_name": month_name,
                    "total": safe_round(total),
                    "count": item['count'],
                    "average_per_expense": safe_round(item['avg']),
                    "largest_expense": safe_round(item['max_expense']),
                    "smallest_expense": safe_round(item['min_expense'])
                })

            # Calculate trend
            trend = "stable"
            change_amount = 0
            change_percent = 0
            
            if len(result) >= 2:
                current = result[-1]['total']
                previous = result[-2]['total']
                trend = calculate_trend(current, previous)
                change_amount, change_percent = calculate_change(current, previous)

            if lowest_month['total'] == float('inf'):
                lowest_month = {"month": None, "total": 0}

            return success_response(
                data=result,
                meta={
                    "months_requested": months,
                    "months_returned": len(result),
                    "max_months_allowed": MAX_MONTHS_LOOKBACK,
                    "start_month": result[0]['month'] if result else None,
                    "end_month": result[-1]['month'] if result else None
                },
                summary={
                    "grand_total": safe_round(grand_total),
                    "monthly_average": safe_round(grand_total / len(result)) if result else 0,
                    "trend": trend,
                    "change_amount": change_amount,
                    "change_percent": change_percent,
                    "highest_month": highest_month['month'],
                    "highest_amount": safe_round(highest_month['total']),
                    "lowest_month": lowest_month['month'],
                    "lowest_amount": safe_round(lowest_month['total'])
                }
            )

        except Exception as e:
            logger.error(f"Monthly trend error: {str(e)}", exc_info=True)
            return error_response(
                message="Unable to load monthly trend data",
                detail=str(e),
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )



