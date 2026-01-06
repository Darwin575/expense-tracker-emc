from datetime import date, timedelta
from django.db.models import QuerySet
from .models import Expense

# "Golden List" of keywords that strongly suggest recurring expenses
RECURRING_KEYWORDS = [
    'netflix', 'spotify', 'adobe', 'aws', 'gym', 'rent', 
    'internet', 'electricity', 'water bill', 'phone bill',
    'insurance', 'subscription', 'membership'
]

def check_keyword_recurring(title: str) -> bool:
    """Check if title contains any keyword from the golden list."""
    title_lower = title.lower()
    return any(keyword in title_lower for keyword in RECURRING_KEYWORDS)

def calculate_interval(date1: date, date2: date) -> int:
    """Calculate absolute days difference between two dates."""
    return abs((date1 - date2).days)

def determine_frequency(days_diff: int) -> str:
    """Determine frequency based on days difference with tolerance."""
    if days_diff == 1:
        return 'daily'
    elif 6 <= days_diff <= 8:
        return 'weekly'
    elif 26 <= days_diff <= 34: # 28-31 days +/- tolerance
        return 'monthly'
    elif 362 <= days_diff <= 369: # 365 +/- tolerance
        return 'yearly'
    return None

def analyze_expense(user, title: str, amount, current_date: date) -> tuple[bool, str]:
    """
    Analyze if an expense is recurring based on history and keywords.
    Returns: (is_recurring, frequency)
    """
    
    # 1. Fetch recent expenses with same title (case-insensitive)
    # We look for up to 3 previous entries to establish a pattern
    recent_expenses = Expense.objects.filter(
        user=user,
        title__iexact=title
    ).order_by('-date')[:3]

    if not recent_expenses.exists():
        return False, None

    last_expense = recent_expenses[0]
    
    # 2. Variable Amount Check
    # If amount is different but title matches, we still check date pattern
    # The user wanted "robust" handling, so we don't strictly require amount equality
    # providing the title is specific enough or matches a keyword.
    
    is_keyword_match = check_keyword_recurring(title)
    
    days_diff = calculate_interval(current_date, last_expense.date)
    frequency = determine_frequency(days_diff)

    if frequency:
        # If we found a clear time pattern
        
        # If amount matches exactly OR it's a known keyword service
        # (e.g. Electricity might vary, but Netflix usually doesn't. 
        # Actually electricity definitely varies. So if pattern matches, we likely accept it.)
        
        # Stricter check: If not a keyword match, require amount to be "close"? 
        # Or just trust the time pattern?
        # User asked for "Almost accurate". 
        # Let's trust the Time Pattern primarily if Title matches.
        return True, frequency

    # 3. Fallback: If 1 previous isn't enough, maybe check the one before that?
    # (e.g. User missed a month entry?)
    # For V1, simple 1-step lookback with tolerance is usually sufficient for "Auto".
    
    return False, None
