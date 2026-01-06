from rest_framework import serializers
from .models import Expense, Category, Budget


class CategorySerializer(serializers.ModelSerializer):
    """Serializer for Category model"""
    user_username = serializers.CharField(source='user.username', read_only=True)
    
    class Meta:
        model = Category
        fields = ['id', 'user', 'user_username', 'name', 'description', 'color_code', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at', 'user']


class ExpenseSerializer(serializers.ModelSerializer):
    """Serializer for Expense model"""
    category_name = serializers.CharField(source='category.name', read_only=True)
    user_username = serializers.CharField(source='user.username', read_only=True)
    
    class Meta:
        model = Expense
        fields = [
            'id', 'user', 'user_username', 'category', 'category_name',
            'title', 'description', 'amount', 'date',
            'is_recurring', 'recurring_frequency', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at', 'user']


class BudgetSerializer(serializers.ModelSerializer):
    """Serializer for Budget model"""
    user_username = serializers.CharField(source='user.username', read_only=True)
    # Use HiddenField to include user in validation logic (specifically UniqueTogetherValidator)
    # without requiring it in the request body.
    user = serializers.HiddenField(default=serializers.CurrentUserDefault())
    
    class Meta:
        model = Budget
        fields = ['id', 'user', 'user_username', 'month', 'budget_amount']


class RecurringExpenseSerializer(serializers.Serializer):
    """
    Serializer for aggregated recurring expense data.
    """
    id = serializers.IntegerField()
    title = serializers.CharField()
    amount = serializers.DecimalField(max_digits=10, decimal_places=2)
    occurrences = serializers.IntegerField()
    category_name = serializers.CharField(required=False, allow_null=True)
    # Input only, used for grouping logic in view
    recurring_frequency = serializers.CharField(write_only=True)
