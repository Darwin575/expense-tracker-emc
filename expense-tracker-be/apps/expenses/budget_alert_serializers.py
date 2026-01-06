from rest_framework import serializers

class BudgetUsageSerializer(serializers.Serializer):
    """
    Serializer for budget usage details of a specific period.
    """
    period = serializers.CharField()
    expense = serializers.FloatField()
    budget = serializers.FloatField()
    percentage_consumed = serializers.FloatField()
    status = serializers.ChoiceField(choices=["over_budget", "within_budget"])

class BudgetAlertResponseSerializer(serializers.Serializer):
    """
    Serializer for the budget alerts response structure.
    """
    day = BudgetUsageSerializer()
    week = BudgetUsageSerializer()
    month = BudgetUsageSerializer()
    year = BudgetUsageSerializer()
