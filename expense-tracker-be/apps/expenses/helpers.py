"""
Helper functions and utilities for the expenses app.
Includes validation, formatting, and data processing utilities.
"""
import re
from datetime import date, timedelta
from decimal import Decimal, InvalidOperation
from typing import Tuple, Optional, Any, List, Dict

from rest_framework.response import Response
from rest_framework import status


# =============================================================================
# CONSTANTS
# =============================================================================

MAX_MONTHS_LOOKBACK = 12
MAX_WEEKS_LOOKBACK = 52
MAX_CATEGORIES = 10
MAX_RECORDS_PER_QUERY = 10000

# Year range for validation
MIN_YEAR = 2000
MAX_YEAR = 2100

# Default colors for charts
DEFAULT_COLORS = [
    "#3B82F6",  # Blue
    "#10B981",  # Green
    "#F59E0B",  # Amber
    "#EF4444",  # Red
    "#8B5CF6",  # Purple
    "#EC4899",  # Pink
    "#06B6D4",  # Cyan
    "#84CC16",  # Lime
    "#F97316",  # Orange
    "#6366F1",  # Indigo
]




# =============================================================================
# TYPE CONVERSION HELPERS
# =============================================================================

def safe_float(value: Any, default: float = 0.0) -> float:
    """
    Safely convert any value to float.
    
    Args:
        value: The value to convert (Decimal, int, str, None, etc.)
        default: Default value if conversion fails
        
    Returns:
        float: The converted value or default
    """
    if value is None:
        return default
    
    try:
        if isinstance(value, Decimal):
            return float(value)
        return float(value)
    except (ValueError, TypeError, InvalidOperation):
        return default


def safe_int(value: Any, default: int = 0) -> int:
    """
    Safely convert any value to integer.
    
    Args:
        value: The value to convert
        default: Default value if conversion fails
        
    Returns:
        int: The converted value or default
    """
    if value is None:
        return default
    
    try:
        return int(value)
    except (ValueError, TypeError):
        return default


def safe_round(value: Any, decimals: int = 2) -> float:
    """
    Safely round a value to specified decimal places.
    
    Args:
        value: The value to round
        decimals: Number of decimal places
        
    Returns:
        float: The rounded value
    """
    return round(safe_float(value), decimals)


# =============================================================================
# DATE VALIDATION & PARSING
# =============================================================================

def validate_month_string(month_str: str) -> bool:
    """
    Validate month string format (YYYY-MM).
    
    Args:
        month_str: String to validate
        
    Returns:
        bool: True if valid, False otherwise
    """
    if not month_str:
        return False
    
    pattern = r'^\d{4}-(0[1-9]|1[0-2])$'
    return bool(re.match(pattern, month_str))


def parse_month_string(month_str: Optional[str]) -> Tuple[Optional[date], Optional[date]]:
    """
    Parse month string and return (start_date, end_date).
    
    Args:
        month_str: Month string in YYYY-MM format, or None for current month
        
    Returns:
        Tuple of (start_date, end_date) or (None, None) if invalid
    """
    today = date.today()
    
    if not month_str:
        start_date = today.replace(day=1)
        end_date = today
        return start_date, end_date
    
    try:
        parts = month_str.split('-')
        if len(parts) != 2:
            return None, None
            
        year, month = int(parts[0]), int(parts[1])
        
        # Validate ranges
        if not (MIN_YEAR <= year <= MAX_YEAR):
            return None, None
        if not (1 <= month <= 12):
            return None, None
            
        start_date = date(year, month, 1)
        
        # Calculate end of month
        if month == 12:
            end_date = date(year + 1, 1, 1) - timedelta(days=1)
        else:
            end_date = date(year, month + 1, 1) - timedelta(days=1)
            
        return start_date, end_date
        
    except (ValueError, TypeError, AttributeError):
        return None, None


def get_week_date_range(week_offset: int = 0) -> Tuple[date, date]:
    """
    Get start and end dates for a week.
    
    Args:
        week_offset: 0 for current week, -1 for last week, etc.
        
    Returns:
        Tuple of (start_date, end_date) - Monday to Sunday
    """
    today = date.today()
    start_of_week = today - timedelta(days=today.weekday())  # Monday
    start_of_week = start_of_week + timedelta(weeks=week_offset)
    end_of_week = start_of_week + timedelta(days=6)  # Sunday
    
    return start_of_week, end_of_week


def validate_week_offset(offset: Any) -> int:
    """
    Validate and normalize week offset.
    
    Args:
        offset: Week offset value (string or int)
        
    Returns:
        int: Validated week offset (0 to -MAX_WEEKS_LOOKBACK)
    """
    offset = safe_int(offset, 0)
    
    if offset > 0:
        return 0
    if offset < -MAX_WEEKS_LOOKBACK:
        return -MAX_WEEKS_LOOKBACK
    
    return offset


def validate_months_count(months: Any) -> int:
    """
    Validate and normalize months count.
    
    Args:
        months: Number of months (string or int)
        
    Returns:
        int: Validated months count (1 to MAX_MONTHS_LOOKBACK)
    """
    months = safe_int(months, 6)
    
    if months < 1:
        return 6
    if months > MAX_MONTHS_LOOKBACK:
        return MAX_MONTHS_LOOKBACK
    
    return months


# =============================================================================
# RESPONSE HELPERS
# =============================================================================

def error_response(
    message: str,
    detail: Optional[str] = None,
    status_code: int = status.HTTP_400_BAD_REQUEST
) -> Response:
    """
    Create a standardized error response.
    
    Args:
        message: User-friendly error message
        detail: Technical detail (only shown in DEBUG mode)
        status_code: HTTP status code
        
    Returns:
        Response: DRF Response object
    """
    from django.conf import settings
    
    response_data = {
        "success": False,
        "error": message
    }
    
    if detail and settings.DEBUG:
        response_data["detail"] = detail
    
    return Response(response_data, status=status_code)


def success_response(
    data: Any,
    meta: Optional[Dict] = None,
    summary: Optional[Dict] = None
) -> Response:
    """
    Create a standardized success response.
    
    Args:
        data: The response data
        meta: Metadata about the response
        summary: Summary statistics
        
    Returns:
        Response: DRF Response object
    """
    response_data = {
        "success": True,
    }
    
    if meta:
        response_data["meta"] = meta
    
    if summary:
        response_data["summary"] = summary
    
    response_data["data"] = data
    
    return Response(response_data)


# =============================================================================
# CALCULATION HELPERS
# =============================================================================

def calculate_percentage(value: float, total: float) -> float:
    """
    Calculate percentage safely.
    
    Args:
        value: The numerator
        total: The denominator
        
    Returns:
        float: Percentage (0-100), or 0 if total is 0
    """
    if total <= 0:
        return 0.0
    return round((value / total) * 100, 1)


def calculate_trend(current: float, previous: float, threshold: float = 5.0) -> str:
    """
    Calculate trend direction based on percentage change.
    
    Args:
        current: Current value
        previous: Previous value
        threshold: Percentage threshold for up/down classification
        
    Returns:
        str: "up", "down", or "stable"
    """
    if previous <= 0:
        return "up" if current > 0 else "stable"
    
    change_percent = ((current - previous) / previous) * 100
    
    if change_percent > threshold:
        return "up"
    elif change_percent < -threshold:
        return "down"
    return "stable"


def calculate_change(current: float, previous: float) -> Tuple[float, float]:
    """
    Calculate change amount and percentage.
    
    Args:
        current: Current value
        previous: Previous value
        
    Returns:
        Tuple of (change_amount, change_percent)
    """
    change_amount = current - previous
    
    if previous > 0:
        change_percent = round(((current - previous) / previous) * 100, 1)
    else:
        change_percent = 100.0 if current > 0 else 0.0
    
    return round(change_amount, 2), change_percent


def find_highest_lowest(items: List[Dict], key: str) -> Tuple[Optional[Dict], Optional[Dict]]:
    """
    Find the highest and lowest items in a list by a given key.
    
    Args:
        items: List of dictionaries
        key: Key to compare
        
    Returns:
        Tuple of (highest_item, lowest_item)
    """
    if not items:
        return None, None
    
    highest = max(items, key=lambda x: safe_float(x.get(key)))
    lowest = min(items, key=lambda x: safe_float(x.get(key)))
    
    return highest, lowest


# =============================================================================
# COLOR HELPERS
# =============================================================================

def get_color_for_index(index: int) -> str:
    """
    Get a color from the default palette by index.
    
    Args:
        index: Index position
        
    Returns:
        str: Hex color code
    """
    return DEFAULT_COLORS[index % len(DEFAULT_COLORS)]



