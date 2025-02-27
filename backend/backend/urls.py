from django.contrib import admin
from django.urls import path, include
from core.views import PopularPinsView, GoogleLoginView, PinsByCategoryView, SearchView, PinDetailView
from core.views import (
    get_user_profile,
    update_user_profile,
    create_or_update_pin,
    create_or_update_board,
    add_pin_to_board,
    get_username_profile
)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('dj_rest_auth.urls')), 
    path('api/auth/registration/', include('dj_rest_auth.registration.urls')),  
    path('api/auth/google/', include('allauth.socialaccount.urls')),
    path('api/popular-pins/', PopularPinsView.as_view(), name='popular-pins'),
    path('api/auth/custom-user/', GoogleLoginView.as_view(), name='custom-user'),
    path('api/users/<int:user_id>/', get_user_profile, name='get_user_profile'),
    path('api/users/<int:user_id>/update/', update_user_profile, name='update_user_profile'),
    path('api/pins/', create_or_update_pin, name='create_pin'),
    path('api/pins/category/', PinsByCategoryView.as_view(), name='pins-by-category'),
    path('api/pins/<int:pin_id>/', create_or_update_pin, name='update_or_delete_pin'),
    path('api/pin/<int:pin_id>/', PinDetailView.as_view(), name='update_or_delete_pin'),
    path('api/boards/', create_or_update_board, name='create_board'),
    path('api/boards/<int:board_id>/', create_or_update_board, name='update_or_delete_board'),
    path('api/boards/<int:board_id>/add-pin/', add_pin_to_board, name='add_pin_to_board'),
    path('api/search/', SearchView.as_view(), name='search'),
]