"""
Views for the expenses app.
"""
from datetime import date

from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import viewsets, filters
from rest_framework.permissions import IsAuthenticatedOrReadOnly
from rest_framework.views import APIView
from rest_framework.response import Response

from .models import Expense, Category, Budget
from .serializers import ExpenseSerializer, CategorySerializer, BudgetSerializer


class CategoryViewSet(viewsets.ModelViewSet):
    """ViewSet for Category model"""
    def get_queryset(self):
        """Return categories for the current user"""
        if self.request.user.is_authenticated:
            return Category.objects.filter(user=self.request.user)
        return Category.objects.none()
    serializer_class = CategorySerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    pagination_class = None
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'created_at']

    def perform_create(self, serializer):
        """Save the category with the current user"""
        if self.request.user.is_authenticated:
            serializer.save(user=self.request.user)


class ExpenseViewSet(viewsets.ModelViewSet):
    """ViewSet for Expense model"""
    serializer_class = ExpenseSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    pagination_class = None
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['category', 'date']
    search_fields = ['title', 'description']
    ordering_fields = ['date', 'amount', 'created_at']

    def get_queryset(self):
        """Return expenses for the current user"""
        if self.request.user.is_authenticated:
            return Expense.objects.filter(user=self.request.user)
        return Expense.objects.none()

    def perform_create(self, serializer):
        """Save the expense with the current user and auto-detect recurring pattern"""
        # For demo purposes, we'll use the first user if not authenticated
        if self.request.user.is_authenticated:
            user = self.request.user
            
            # Auto-Detection Logic
            try:
                from .detection_logic import analyze_expense
                # Extract validated data from serializer to check
                # We use serializer.validated_data because it's already cleaned
                title = serializer.validated_data.get('title')
                amount = serializer.validated_data.get('amount')
                date_val = serializer.validated_data.get('date')
                
                is_recurring, frequency = analyze_expense(user, title, amount, date_val)
                
                # If detected, override the input (or set if missing)
                # Note: If user manually set is_recurring=False, this might override it.
                # But user requirement was "User is not to be trusted", so auto-detection takes precedence?
                # Or should we only set if not set? 
                # Given "User is not to be trusted", we enforce the system's intelligence.
                
                extra_data = {'user': user}
                if is_recurring:
                    extra_data['is_recurring'] = True
                    extra_data['recurring_frequency'] = frequency
                    
                serializer.save(**extra_data)
                
            except Exception as e:
                # Fallback to normal save if detection fails safely
                print(f"Auto-detection failed: {e}")
                serializer.save(user=user)


class BudgetViewSet(viewsets.ModelViewSet):
    """ViewSet for Budget model"""
    serializer_class = BudgetSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['month']
    ordering_fields = ['month', 'budget_amount']

    def get_queryset(self):
        """Return budgets for the current user"""
        if self.request.user.is_authenticated:
            return Budget.objects.filter(user=self.request.user)
        return Budget.objects.none()


class StubExpenseView(APIView):
    """
    Stub API view to return static expense data without DB interaction.
    """
    permission_classes = []  # Public access for stub

    def get(self, request):
        stub_data = [
            {
                "id": 1,
                "user": 1,
                "user_username": "demo",
                "category": 1,
                "category_name": "Food",
                "title": "Grocery Shopping",
                "description": "Weekly groceries",
                "amount": "150.50",
                "date": str(date.today()),
                "created_at": str(date.today()),
                "updated_at": str(date.today())
            },
            {
                "id": 2,
                "user": 1,
                "user_username": "demo",
                "category": 2,
                "category_name": "Transport",
                "title": "Uber Ride",
                "description": "Ride to office",
                "amount": "25.00",
                "date": str(date.today()),
                "created_at": str(date.today()),
                "updated_at": str(date.today())
            },
            {
                "id": 3,
                "user": 1,
                "user_username": "demo",
                "category": 3,
                "category_name": "Entertainment",
                "title": "Netflix Subscription",
                "description": "Monthly subscription",
                "amount": "15.99",
                "date": str(date.today()),
                "created_at": str(date.today()),
                "updated_at": str(date.today())
            }
        ]
        
        from apps.common.utils import success_response
        return success_response(data=stub_data, message="Fetched stub expenses successfully")
