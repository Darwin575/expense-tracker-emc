from django.contrib import admin
from .models import Expense, Category, Budget


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'user', 'color_code', 'description', 'created_at']
    list_filter = ['user', 'created_at']
    search_fields = ['name', 'description']


@admin.register(Expense)
class ExpenseAdmin(admin.ModelAdmin):
    list_display = ['title', 'user', 'category', 'amount', 'date', 'is_recurring']
    list_filter = ['category', 'date', 'is_recurring']
    search_fields = ['title', 'description', 'user__username', 'user__email']
    date_hierarchy = 'date'
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('user', 'title', 'description', 'amount', 'date')
        }),
        ('Categorization', {
            'fields': ('category',)
        }),
        ('Recurring Settings', {
            'fields': ('is_recurring', 'recurring_frequency')
        }),
    )

@admin.register(Budget)
class BudgetAdmin(admin.ModelAdmin):
    list_display = ['user', 'month', 'budget_amount']
    list_filter = ['month']
    search_fields = ['user__username', 'user__email']
