import hashlib
from django.db import models, transaction
from django.contrib.auth.models import User

def calculate_file_hash(self):
    hasher = hashlib.sha256()
    for chunk in self.file.chunks():
        hasher.update(chunk)
    return hasher.hexdigest()

class Fraction(models.Model):
    """
    Store a fraction.
    """

    number = models.PositiveIntegerField(null=True, blank=True, unique=True)
    special = models.CharField(max_length=32, null=True, blank=True, unique=True)

    def __str__(self):
        return str(self.number) if self.number else str(self.special)


class Location(models.Model):
    """
    Store a Location.
    """

    name = models.CharField(max_length=50, unique=True, blank=False, null=False)
    description = models.CharField(max_length=255, blank=True, null=True)

    class Meta:
        verbose_name = "Localisation"

    def __str__(self):
        return self.name


class Unit(models.Model):
    """
    Store a constraint unit.
    """

    name = models.CharField(max_length=16, unique=True, blank=True, null=False)

    symbol = models.CharField(max_length=8)

    volume_formater = models.CharField(max_length=32, null=True, blank=True)

    hide_volume = models.BooleanField(default=False)

    def __str__(self):
        return "{}".format(self.name)

    def volume_decorator(self):
        return self.volume_formater.split("{}")[:2]


class ComparisonSym(models.Model):
    """
    Symbol de comparaison.
    """

    name = models.CharField(max_length=2, unique=True)

    def __str__(self):
        return "{}".format(self.name)

    class Meta:
        verbose_name = "Comparison Symbol"


class Patient(models.Model):
    """
    Store a type of patient (child or adult).
    """

    name = models.CharField(max_length=16, unique=True)

    def __str__(self):
        return self.name


class Reference(models.Model):
    url = models.CharField(max_length=255, blank=True, null=False)

    file = models.FileField(upload_to="references", null=True, blank=True, max_length=255)
    file_hash = models.CharField(max_length=64, blank=True, null=True) # hash to check if the file already exists

    desc = models.CharField(max_length=255, blank=True, null=False)
    
    def delete(self, *args, **kwargs):
        
        if self.file.name != "":
            md5 = calculate_file_hash(self.file)
            if Reference.objects.filter(file_hash=md5).count() == 1:
                self.file.delete()

        super(Reference, self).delete(*args, **kwargs)

    def save(self, *args, **kwargs):
        if self.url is not None and self.url !=  "":
            self.url = self.url.replace(" ", "")
            if self.url[:4] != "http":
                self.url = "http://" + self.url

        if self.file.name != "" and self.file.name is not None:
            md5 = calculate_file_hash(self.file)
            if Reference.objects.filter(file_hash=md5).count() > 0:
                # set the existing file to self.file
                self.file = Reference.objects.filter(file_hash=md5).first().file

            self.file_hash = md5
        # check if file is not empty
        if self.file.name is not None or self.file.name != "":
            if self.pk is not None: # if there is a pk, we are updating the object
                old = Reference.objects.get(pk=self.pk)
                if old.file.name != "":
                    md5 = calculate_file_hash(old.file)
                    if Reference.objects.filter(file_hash=md5).count() == 1:
                        old.file.delete()
                
        else:
            if self.pk is not None: # keep the old file if no new one is uploaded
                old = Reference.objects.get(pk=self.pk)
                self.file = old.file
                
        super(Reference, self).save(*args, **kwargs)
        

    def __str__(self):
        return "  url: {} file: {} desc: {}".format(
             self.url, self.file, self.desc
        )


class Organ(models.Model):
    """
    Store an organ unrelated to the location
    """

    name = models.CharField(max_length=50, unique=True)
    alpha_beta = models.IntegerField(default=0, null=True, blank=True)
    alias = models.CharField(max_length=250, null=True, blank=True)
    # remove space from alias

    def alias_to_list(self):
        if self.alias is None:
            return []
        return self.alias.split(",")

    def save(self, *args, **kwargs):
        if self.alias is not None:
            self.alias = self.alias.replace(", ", ",").replace(" ,", ",")
        super(Organ, self).save(*args, **kwargs)

    class Meta:
        verbose_name = "Organe"

    def __str__(self):
        return self.name + ((" alias: " + self.alias) if self.alias is not None else "")


class Toxicity(models.Model):
    """
    Store a toxicity.
    """

    value = models.FloatField(null=False, blank=False)
    description = models.CharField(max_length=50)

    def __str__(self):
        return "{} with probability {}".format(self.description, self.value)


class Objective(models.Model):
    """
    Store an Objective. (constraint and objective are the same thing in base)
    """

    comparison_sym = models.ForeignKey(
        ComparisonSym,
        on_delete=models.CASCADE,
        null=False,
        related_name="comparison_sym",
    )

    unit = models.ForeignKey(
        Unit, on_delete=models.CASCADE, null=False, related_name="unit"
    )

    value = models.FloatField()

    volume = models.FloatField(null=True, blank=True)

    toxicity = models.ForeignKey(Toxicity, on_delete=models.SET_NULL, null=True)

    reference = models.ForeignKey(
        Reference, on_delete=models.SET_NULL, null=True, blank=True
    )
    
    def delete(self, *args, **kwargs):
        with transaction.atomic():
            if self.reference is not None:
                self.reference.delete()
            if self.toxicity is not None:
                self.toxicity.delete()
                
            super(Objective, self).delete(*args, **kwargs)

    def __str__(self):
        return self.unit.volume_formater.format(
            "" if self.unit.hide_volume else self.volume,
            self.comparison_sym,
            self.value,
            self.unit.symbol,
        )


class IndicationOrg(models.Model):
    organ = models.ForeignKey(
        Organ, on_delete=models.CASCADE, null=False, related_name="indicationOrg_org"
    )
    constraints = models.ManyToManyField(Objective, related_name="indicationOrg_cons")
    objectives = models.ManyToManyField(Objective, related_name="indicationOrg_obj")

    def delete(self, *args, **kwargs):
        with transaction.atomic():
            for constraint in self.constraints.all():
                constraint.delete()
            for objective in self.objectives.all():
                objective.delete()
            super(IndicationOrg, self).delete(*args, **kwargs)

    def __str__(self):
        return self.organ.name


class Indication(models.Model):
    """
    Store an Indication about a set of organ , fraction, and patient type
    """

    location = models.ForeignKey(
        Location,
        on_delete=models.CASCADE,
        null=False,
        related_query_name="location indication",
    )

    patient = models.ForeignKey(
        Patient,
        on_delete=models.CASCADE,
        null=False,
        related_query_name="patient indication",
    )

    fraction = models.ForeignKey(
        Fraction,
        on_delete=models.CASCADE,
        null=False,
        related_query_name="fraction indication",
    )

    is_clinical = models.BooleanField()
    organs = models.ManyToManyField(IndicationOrg, related_name="indication_org")
    reference = models.ForeignKey(
        Reference, on_delete=models.SET_NULL, null=True, blank=True
    )
    linked_with = models.ManyToManyField(
        "self",  blank=True
    )
    
    def delete(self, *args, **kwargs):
        with transaction.atomic():
            if self.linked_with.count() == 0:
                for organ in self.organs.all():
                    organ.delete()
            if self.reference is not None:
                self.reference.delete()
            super(Indication, self).delete(*args, **kwargs)

    def __str__(self):
        return "Indication location: {} patient: {} fraction: {}".format(
            self.location, self.patient, self.fraction
        )


class Preference(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=False)
    location = models.ForeignKey(
        Location, on_delete=models.CASCADE, null=True, blank=True
    )
    organ = models.ForeignKey(Organ, on_delete=models.CASCADE, null=True, blank=True)
    fraction = models.ForeignKey(
        Fraction, on_delete=models.CASCADE, null=True, blank=True
    )
    patient = models.ForeignKey(
        Patient, on_delete=models.CASCADE, null=True, blank=True
    )


class Vue(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=False)
    location = models.ForeignKey(
        Location, on_delete=models.CASCADE, null=True, blank=True
    )
    organ = models.ForeignKey(Organ, on_delete=models.CASCADE, null=True, blank=True)
    fraction = models.ForeignKey(
        Fraction, on_delete=models.CASCADE, null=True, blank=True
    )
    patient = models.ForeignKey(
        Patient, on_delete=models.CASCADE, null=True, blank=True
    )

    def __str__(self):
        return " {}  fraction{}  {}  {}".format(
            self.location, self.organ, self.fraction, self.patient
        ).replace("None", " ")

    def data(self):
        return {
            "location": self.location.name if self.location is not None else "",
            "organ": self.organ.name if self.organ is not None else "",
            "fraction": self.fraction.number if self.fraction is not None else "",
            "patient": self.patient.name if self.patient is not None else "",
        }


class Info(models.Model):
    content = models.TextField()

