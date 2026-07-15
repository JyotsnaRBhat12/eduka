import re
from django.db.models import Case, When, Value, IntegerField, Q
from .models import Course, Tag

SYNONYMS = {
    'js': 'javascript',
    'javascript': 'js',
    'py': 'python',
    'python': 'py',
    'db': 'database',
    'database': 'db',
    'reactjs': 'react',
    'react': 'reactjs',
}

def tokenize_and_expand(query_string):
    if not query_string:
        return []
    # Tokenize words, convert to lowercase
    raw_tokens = re.findall(r'\w+', query_string.lower())
    tokens = set()
    for t in raw_tokens:
        tokens.add(t)
        if t in SYNONYMS:
            tokens.add(SYNONYMS[t])
    return list(tokens)

def search_courses(queryset, query_string):
    tokens = tokenize_and_expand(query_string)
    if not tokens:
        return queryset

    # Build Q filtering: courses where any token matches title, description, tags, or mentor details
    filter_q = Q()
    for token in tokens:
        filter_q |= (
            Q(title__icontains=token) |
            Q(description__icontains=token) |
            Q(tags__name__icontains=token) |
            Q(mentor__username__icontains=token) |
            Q(mentor__first_name__icontains=token) |
            Q(mentor__last_name__icontains=token)
        )

    queryset = queryset.filter(filter_q).distinct()

    # Score each course based on the matches
    whens = []
    for token in tokens:
        whens.append(When(Q(title__icontains=token), then=Value(10)))
        whens.append(When(Q(tags__name__icontains=token), then=Value(5)))
        whens.append(When(Q(mentor__username__icontains=token) | Q(mentor__first_name__icontains=token) | Q(mentor__last_name__icontains=token), then=Value(3)))
        whens.append(When(Q(description__icontains=token), then=Value(1)))

    if whens:
        queryset = queryset.annotate(
            relevance_score=Case(
                *whens,
                default=Value(0),
                output_field=IntegerField()
            )
        ).order_by('-relevance_score', '-created_at')

    return queryset

def get_autocomplete_suggestions(query_string):
    if not query_string:
        return []

    query = query_string.strip().lower()
    suggestions = []

    # 1. Course Title prefix matching (up to 5 suggestions)
    title_matches = Course.objects.filter(title__icontains=query, is_approved=True).distinct()[:5]
    for course in title_matches:
        suggestions.append({
            'type': 'course',
            'id': course.id,
            'text': course.title,
            'label': f"Course: {course.title}"
        })

    # 2. Tag name prefix matching (up to 5 suggestions)
    tag_matches = Tag.objects.filter(name__icontains=query).distinct()[:5]
    for tag in tag_matches:
        suggestions.append({
            'type': 'tag',
            'id': tag.id,
            'text': tag.name,
            'label': f"Tag: {tag.name}"
        })

    # 3. Mentor name prefix matching (up to 5 suggestions)
    from django.contrib.auth import get_user_model
    User = get_user_model()
    mentor_matches = User.objects.filter(
        Q(role='MENTOR') & (
            Q(username__icontains=query) |
            Q(first_name__icontains=query) |
            Q(last_name__icontains=query)
        )
    ).distinct()[:5]
    for mentor in mentor_matches:
        name = f"{mentor.first_name} {mentor.last_name}".strip() or mentor.username
        suggestions.append({
            'type': 'mentor',
            'id': mentor.id,
            'text': name,
            'label': f"Mentor: {name}"
        })

    return suggestions
