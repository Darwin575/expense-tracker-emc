import os
import django
import random
from datetime import datetime, timedelta
from django.utils import timezone

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model
from apps.expenses.models import Category, Expense

User = get_user_model()

def populate_data():
    # 1. Get or Create User
    # We'll try to get a user, or create 'testuser'
    user = User.objects.first()
    if not user:
        print("No user found. Creating 'testuser'...")
        user = User.objects.create_user(username='testuser', email='test@example.com', password='password123')
    else:
        print(f"Using existing user: {user.username}")

    # 2. Get or Create Categories
    categories_data = [
        {'name': 'Food', 'color': '#FF5733'},
        {'name': 'Transport', 'color': '#33FF57'},
        {'name': 'Utilities', 'color': '#3357FF'},
        {'name': 'Entertainment', 'color': '#F333FF'},
        {'name': 'Rent', 'color': '#FF33A8'},
    ]
    
    categories = {}
    for cat_data in categories_data:
        category, created = Category.objects.get_or_create(
            user=user, 
            name=cat_data['name'],
            defaults={'color_code': cat_data['color']}
        )
        categories[cat_data['name']] = category
        if created:
            print(f"Created category: {category.name}")

    # 3. Define Recurring Expenses Patterns
    # (title, amount, frequency, category_name)
    recurring_patterns = [
        ("Netflix Subscription", 15.00, 'monthly', 'Entertainment'),
        ("Spotify Premium", 10.00, 'monthly', 'Entertainment'),
        ("Gym Membership", 50.00, 'monthly', 'Entertainment'),
        ("Rent", 1200.00, 'monthly', 'Rent'),
        ("Electricity Bill", 80.00, 'monthly', 'Utilities'),
        ("Internet Bill", 60.00, 'monthly', 'Utilities'),
        ("Weekly Groceries", 150.00, 'weekly', 'Food'),
        ("Daily Coffee", 5.00, 'daily', 'Food'),
        ("Bus Fare", 3.00, 'daily', 'Transport'),
        ("Annual Insurance", 500.00, 'yearly', 'Utilities'),
    ]

    # 4. Generate Expenses
    # We will generate expenses going back 6 months
    end_date = timezone.now().date()
    start_date = end_date - timedelta(days=180)

    count = 0
    for title, amount, freq, cat_name in recurring_patterns:
        category = categories.get(cat_name)
        
        current_date = start_date
        
        while current_date <= end_date:
            # Check if this date matches the frequency
            should_create = False
            
            if freq == 'daily':
                should_create = True
                next_date = current_date + timedelta(days=1)
                
            elif freq == 'weekly':
                # Create if it's the same weekday as start_date? or just every 7 days
                # Let's just do every 7 days from start_date
                should_create = True
                next_date = current_date + timedelta(days=7)
                
            elif freq == 'monthly':
                # Create roughly every 30 days or same day of month
                # Simply validation: same day number? 
                # Let's just create 1st of month or similar. 
                # Simplest loop: increment by 1 day, if day matches, create.
                # BUT here we are iterating. Let's just jump dates.
                
                # We will create one for this month if it hasn't passed
                should_create = True
                
                # Advance one month roughly
                # Logic: month += 1
                y, m, d = current_date.year, current_date.month, current_date.day
                m += 1
                if m > 12:
                    m = 1
                    y += 1
                
                # Handle end of month days (e.g. jan 31 -> feb 28)
                try:
                    next_date = current_date.replace(year=y, month=m)
                except ValueError:
                    # simplistic fallback for day 31 etc
                    next_date = current_date.replace(year=y, month=m, day=28) 

            elif freq == 'yearly':
                 should_create = True
                 next_date = current_date.replace(year=current_date.year + 1)

            
            if should_create:
                # Add some variance to dates for realism? No, strict recurring usually same day.
                # Maybe random payment method
                payment_method = random.choice(['CASH', 'CARD'])
                
                Expense.objects.get_or_create(
                    user=user,
                    title=title,
                    amount=amount,
                    date=current_date,
                    defaults={
                        'category': category,
                        'description': f"Recurring {freq} payment for {title}",
                        'payment_method': payment_method,
                        'is_recurring': True,
                        'recurring_frequency': freq
                    }
                )
                count += 1
                
            current_date = next_date

    print(f"Successfully populated {count} recurring expenses.")

if __name__ == '__main__':
    populate_data()
