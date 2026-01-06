from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import get_user_model
from typing import Any, Optional, Dict, List

User = get_user_model()

def success_response(
    data: Any = None, 
    message: str = "Success", 
    status_code: int = status.HTTP_200_OK
) -> Response:
    """
    Returns a standardized success response.
    
    Structure:
    {
        "status": "success",
        "message": "Success",
        "data": ...
    }
    """
    return Response({
        "status": "success",
        "message": message,
        "data": data
    }, status=status_code)

def error_response(
    message: str = "Error", 
    errors: Any = None, 
    status_code: int = status.HTTP_400_BAD_REQUEST
) -> Response:
    """
    Returns a standardized error response.
    
    Structure:
    {
        "status": "error",
        "message": "Error",
        "errors": ...
    }
    """
    return Response({
        "status": "error",
        "message": message,
        "errors": errors
    }, status=status_code)
