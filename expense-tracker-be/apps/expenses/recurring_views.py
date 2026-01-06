from rest_framework import generics, serializers
from rest_framework.permissions import IsAuthenticatedOrReadOnly
from django.db.models import Case, When, Value, IntegerField
from .serializers import RecurringExpenseSerializer
from .models import Expense

from django.db.models import Count, Max, Q
from rest_framework.response import Response

class RecurringExpenseListView(generics.ListAPIView):
    """
    List recurring expenses grouped by frequency and sorted by occurrence count (popularity).
    Returns:
    {
        "daily": [{title, amount, occurrences...}, ...], # Sorted by occurrences desc
        ...
    }
    """
    serializer_class = RecurringExpenseSerializer # Used for metadata/schema, not directly for list response
    permission_classes = [IsAuthenticatedOrReadOnly]

    def list(self, request, *args, **kwargs):
        user = self.request.user
        
        # Base filter
        if user.is_authenticated:
            qs = Expense.objects.filter(is_recurring=True, user=user)
        else:
            qs = Expense.objects.none()
            
        # Aggregation: Group by Title and Frequency
        # We also grab the latest amount (or max) and category name
        data_raw = qs.values('title', 'recurring_frequency', 'category__name') \
                 .annotate(
                     occurrences=Count('id'),
                     amount=Max('amount'), # approximate 'current' amount
                     id=Max('id') # approximate representative ID
                 ) \
                 .order_by('-occurrences')
                 
        # Pre-process raw data to match serializer expectations
        for item in data_raw:
            # Map category__name to category_name
            item['category_name'] = item.pop('category__name', None)

        # Use Serializer for Validation and Transformation
        # Since we are passing a list of dicts (from values()), simpler Serializer works best vs ModelSerializer
        serializer = self.get_serializer(data=data_raw, many=True)
        serializer.is_valid(raise_exception=False) # Skip strict validation validation errors for partial data, or handle them
        # Note: values() returns dicts, not instances.
        
        # Validated data (orderedDicts)
        serialized_data = serializer.data 
        
        # Grouping
        grouped_data = {
            "daily": [],
            "weekly": [],
            "monthly": [],
            "yearly": []
        }
        
        # Iterate over ORIGINAL raw data or re-map? 
        # The serializer 'write_only' field recurring_frequency won't be in serializer.data
        # So we need to access it from initial_data or keep it read_only but remove later?
        # Correction: Make recurring_frequency read_only so it is in output, then pop it.
        
        # Let's adjust serializer above to be ReadOnly for freq, then we pop it.
        
        for i, item in enumerate(serialized_data):
            # We need the frequency to group. 
            # If we used write_only=True, it wouldn't be here.
            # If we use read_only=True, it is here.
            # Let's assume we change serializer to read_only or regular charfield.
            
            # Fallback: get freq from raw data if missing (but we will update serializer to include it)
            freq = data_raw[i].get('recurring_frequency', '').lower()
            
            if freq in grouped_data:
                grouped_data[freq].append(item)
            else:
                pass
                
        # The query is already ordered by -occurrences
        for key in grouped_data:
            grouped_data[key].sort(key=lambda x: x['occurrences'], reverse=True)
                
        return Response(grouped_data)
