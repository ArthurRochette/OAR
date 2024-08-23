from django import template

register = template.Library()

@register.filter
def substract(value, arg):
    return value - arg

register.filter('substract', substract)

@register.filter
def zip_ (value, arg):
    return zip(value, arg)

register.filter('zip_', zip_)