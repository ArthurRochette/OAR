from django.contrib import admin
from .models import *


class IndicationIndorgAdmin(admin.TabularInline):
    model = Indication.organs.through

admin.site.register(Reference)


class IndicationAdmin(admin.ModelAdmin):
    inlines = (IndicationIndorgAdmin,)
    list_display = ('location', 'fraction', 'patient', 'is_clinical')
    list_filter = ('location', 'fraction', 'patient', 'is_clinical')
    search_fields = ('location', 'fraction', 'patient', 'is_clinical')
    exclude = ('indication_org',)


admin.site.register(Indication, IndicationAdmin)
admin.site.register(IndicationOrg)
admin.site.register(Organ)
admin.site.register(Location)
admin.site.register(Patient)
admin.site.register(Fraction)
admin.site.register(ComparisonSym)
admin.site.register(Unit)
admin.site.register(Objective)
admin.site.register(Preference)
admin.site.register(Vue)
