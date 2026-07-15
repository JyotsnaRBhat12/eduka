from django.contrib.auth.backends import ModelBackend
from django.contrib.auth import get_user_model
from django.db.models import Q

class CaseInsensitiveModelBackend(ModelBackend):
    def authenticate(self, request, username=None, password=None, **kwargs):
        UserModel = get_user_model()
        if username is None:
            username = kwargs.get(UserModel.USERNAME_FIELD) or kwargs.get('username')
        
        if username:
            username = username.strip()
        else:
            return None
        
        try:
            # Use iexact to look up by email (USERNAME_FIELD) or username case-insensitively
            user = UserModel.objects.get(
                Q(**{f"{UserModel.USERNAME_FIELD}__iexact": username}) |
                Q(username__iexact=username)
            )
        except UserModel.DoesNotExist:
            # Run the password hasher once to prevent timing attacks
            UserModel().set_password(password)
            return None
        
        if user.check_password(password) and self.user_can_authenticate(user):
            return user
        return None
