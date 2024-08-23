from django.shortcuts import redirect, render
from django.http import HttpResponse, HttpResponseRedirect
from django.contrib.auth import logout as logout_dj
from django.contrib.auth import authenticate, login as login_dj

WRONG_CREDENTIALS = "Verifiez votre login/mot de passe"


def logout(request):
    """
    logout the request's user
    :param request: the request
    :return: redirect to /
    """
    logout_dj(request)
    return redirect('/')


def login(request):
    """
    Login the request's user
    :param request: username and password in post
    :return: if successful to / or in contrary /login, error contained in context.error
    """
    error = "None"
    if hasattr(request, "POST"):
        if 'username' in request.POST and 'password' in request.POST:
            username = request.POST['username']
            password = request.POST['password']

            user = authenticate(request, username=username, password=password)
            if user is not None:
                login_dj(request, user)
                return redirect('/')
            else:
                error = WRONG_CREDENTIALS
    context = {
        'title': 'login',
        'error': error
    }
    return render(request, 'accounts/login.html', context)
