import os
import django
from django.db.models import Count, Max

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.expenses.models import Expense

def verify_recurring():
    qs = Expense.objects.filter(is_recurring=True)
    print(f"Total recurring expenses: {qs.count()}")
    
    data_raw = qs.values('title', 'recurring_frequency', 'category__name') \
             .annotate(
                 occurrences=Count('id'),
                 amount=Max('amount')
             ) \
             .order_by('-occurrences')

    print("\nAggregated Data (Top 5):")
    for item in data_raw[:5]:
        print(item)

if __name__ == '__main__':
    verify_recurring()
