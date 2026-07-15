import django_filters
from django.db.models import Avg, Q
from .models import Course

class CourseFilter(django_filters.FilterSet):
    min_price = django_filters.NumberFilter(field_name="price", lookup_expr="gte")
    max_price = django_filters.NumberFilter(field_name="price", lookup_expr="lte")
    
    level = django_filters.ChoiceFilter(choices=Course.LEVEL_CHOICES)
    language = django_filters.CharFilter(field_name="language", lookup_expr="icontains")
    
    min_duration = django_filters.NumberFilter(field_name="duration_hours", lookup_expr="gte")
    max_duration = django_filters.NumberFilter(field_name="duration_hours", lookup_expr="lte")
    
    min_rating = django_filters.NumberFilter(method="filter_by_rating")
    price_type = django_filters.CharFilter(method="filter_price_type")

    class Meta:
        model = Course
        fields = ['level', 'language', 'price', 'duration_hours']

    def filter_price_type(self, queryset, name, value):
        if value == 'free':
            return queryset.filter(price=0.00)
        elif value == 'paid':
            return queryset.filter(price__gt=0.00)
        return queryset

    def filter_by_rating(self, queryset, name, value):
        if value:
            # Filter courses with average rating >= value
            queryset = queryset.annotate(
                avg_r=Avg('reviews__rating', filter=Q(reviews__is_moderated=False))
            ).filter(avg_r__gte=value)
        return queryset
