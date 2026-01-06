from django.core.management.base import BaseCommand
from django.utils import timezone
from django.contrib.auth import get_user_model
from apps.expenses.models import Category, Expense, Budget
import random
from datetime import datetime, timedelta
from decimal import Decimal

User = get_user_model()

class Command(BaseCommand):
    help = 'Populates the database with demo data for presentation'

    def add_arguments(self, parser):
        parser.add_argument(
            '--clean',
            action='store_true',
            help='Delete existing demo data before populating',
        )

    def handle(self, *args, **options):
        # Create or retrieve user
        email = 'demo@example.com'
        password = 'password123'
        
        if options['clean']:
            try:
                user = User.objects.get(email=email)
                self.stdout.write(f'Cleaning up user {email}...')
                user.delete()
            except User.DoesNotExist:
                pass

        user, created = User.objects.get_or_create(
            email=email,
            defaults={
                'username': 'demo',
                'first_name': 'Demo',
                'last_name': 'User',
                'is_active': True
            }
        )
        
        if created:
            user.set_password(password)
            user.save()
            self.stdout.write(self.style.SUCCESS(f'Created user: {email} / {password}'))
        else:
            self.stdout.write(f'Using existing user: {email}')

        # Create Categories
        categories_data = [
            ('Housing', '#FF6B6B'),
            ('Transportation', '#4ECDC4'),
            ('Food', '#45B7D1'),
            ('Utilities', '#96CEB4'),
            ('Insurance', '#FFEEAD'),
            ('Healthcare', '#D4A5A5'),
            ('Savings', '#9B59B6'),
            ('Personal', '#3498DB'),
            ('Entertainment', '#E74C3C'),
            ('Miscellaneous', '#95A5A6')
        ]
        
        categories = {}
        for name, color in categories_data:
            category, _ = Category.objects.get_or_create(
                user=user,
                name=name,
                defaults={'color_code': color}
            )
            categories[name] = category
            
        self.stdout.write(self.style.SUCCESS(f'Created/Verified {len(categories)} categories'))

        # Create Budgets (Last 6 months)
        today = timezone.now().date()
        current_month = today.replace(day=1)
        
        for i in range(6):
            month_date = (current_month - timedelta(days=32 * i)).replace(day=1)
            # Vary budget slightly
            amount = 5000 + random.randint(-500, 500)
            
            Budget.objects.get_or_create(
                user=user,
                month=month_date,
                defaults={'budget_amount': amount}
            )
            
        self.stdout.write(self.style.SUCCESS('Created budgets for last 6 months'))

        # Create Expenses
        # 1. Recurring Expenses
        recurring_expenses = [
            ('Rent', 1500, 'Housing', 1, 'monthly'),
            ('Internet', 60, 'Utilities', 5, 'monthly'),
            ('Netflix', 15.99, 'Entertainment', 10, 'monthly'),
            ('Car Insurance', 120, 'Insurance', 15, 'monthly'),
            ('Gym', 50, 'Healthcare', 1, 'monthly'),
        ]

        # Generate recurring expenses for last 6 months
        for name, amount, cat_name, day, frequency in recurring_expenses:
            # Create the "Recurring" definition expense (usually the first one or a marked one)
            # For simplicity, we'll just create individual expenses for past months
            # and mark the latest one as recurring if needed, or just create them as normal expenses
            # to show history.
            
            # Let's create actual expense records for history
            for i in range(6):
                month_date = (current_month - timedelta(days=32 * i)).replace(day=1)
                try:
                    expense_date = month_date.replace(day=day)
                except ValueError:
                    expense_date = month_date.replace(day=28) # Fallback for shorter months
                
                Expense.objects.get_or_create(
                    user=user,
                    title=name,
                    date=expense_date,
                    defaults={
                        'amount': amount,
                        'category': categories[cat_name],
                        'description': f'Monthly {name} payment',
                        'is_recurring': True if i == 0 else False, # Only mark latest as recurring template
                        'recurring_frequency': frequency if i == 0 else None
                    }
                )

        # 2. Variable Expenses
        # Generate random expenses
        variable_expenses_data = [
            ('Grocery Run', (50, 200), 'Food'),
            ('Coffee', (4, 8), 'Food'),
            ('Gas', (30, 60), 'Transportation'),
            ('Dinner out', (30, 100), 'Food'),
            ('Movie', (15, 30), 'Entertainment'),
            ('Uber', (15, 40), 'Transportation'),
            ('Online Shopping', (20, 100), 'Personal'),
            ('Pharmacy', (10, 50), 'Healthcare'),
        ]

        start_date = today - timedelta(days=180)
        days_range = (today - start_date).days
        
        count = 0
        for _ in range(150): # Generate ~150 random transactions over 6 months
            random_days = random.randint(0, days_range)
            expense_date = start_date + timedelta(days=random_days)
            
            item_name, (min_amt, max_amt), cat_name = random.choice(variable_expenses_data)
            amount = round(random.uniform(min_amt, max_amt), 2)
            
            # Don't duplicate exact same timestamp/details too much, though DB allows it
            Expense.objects.create(
                user=user,
                title=item_name,
                amount=amount,
                date=expense_date,
                category=categories[cat_name],
                description=f'Random {item_name} purchase'
            )
            count += 1
            
        self.stdout.write(self.style.SUCCESS(f'Created {count} variable expenses'))
        self.stdout.write(self.style.SUCCESS('Data population complete!'))
