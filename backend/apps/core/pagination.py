from rest_framework.pagination import PageNumberPagination

class CustomPagination(PageNumberPagination):
    page_size = 10  
    page_query_param = 'page'           
    page_size_query_param = 'limit'
    max_page_size = 50 # tối đa lấy 50 items 1 lần thôi