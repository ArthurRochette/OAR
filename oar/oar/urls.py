"""oar URL Configuration

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/2.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import path, include
from django.conf.urls import *
from rest_framework import routers
from accounts import views as viewsAccount

from . import views, settings


router = routers.DefaultRouter()
router.register(r'indication', views.IndicationViewSet)
router.register(r'organ', views.OrganViewSet)
router.register(r'fraction', views.FractionViewSet)
router.register(r'location', views.LocationViewSet)
router.register(r'patient', views.PatientViewSet)
router.register(r'preference', views.PreferenceViewSet)
router.register(r'vue', views.VueViewSet)
router.register(r'unit', views.UnitViewSet)
router.register(r'comparison symbols', views.ComparisonSymViewSet)
router.register(r'comment', views.CommentViewSet)
router.register(r'reference', views.ReferenceViewSet)

urlpatterns = [
    path('admin/doc/', include('django.contrib.admindocs.urls')),
    path('admin/', admin.site.urls),
    path('', views.index, name="index"),
    path("__reload__/", include("django_browser_reload.urls")),
    path('indication/<int:ID>', views.indication, name="indication"),
    path('logout/', viewsAccount.logout, name="logout"),
    path('login/', viewsAccount.login, name="login"),
    path('api/', include(router.urls)),
]

urlpatterns.extend(static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT))
handler404 = "oar.views.page_not_found"
handler500 = "oar.views.server_error"