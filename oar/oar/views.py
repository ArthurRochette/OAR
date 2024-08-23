import datetime
import json

from django.shortcuts import render
from rest_framework import viewsets, status, permissions, pagination

from .serializers import *
from .models import *
from accounts.models import Comment

from rest_framework.response import Response
from django.db import transaction


def index(request):
    """
    Get all objects and call the renderer
    :param request: the request
    :return: the rendered page
    """
    return render(request, "oar/index.html", {"title": "OAR"})


def indication(request, ID):
    """
    Get the indication and call the renderer, by post a comment can be created
    :param request: the request
    :param ID:indication's ID
    :return: the rendered page of the indication
    """
    return render(
        request,
        "oar/indication.html",
        {
            "title": "indication",
        },
    )


def page_not_found(request, exception):
    """404 error handler

    Args:
        request (request): Client request
        exception (exception): Raised exception

    Returns:
        404.html page with status 404
    """
    return render(request, "error/404.html", status=404)


def server_error(request):
    """500 error handler

    Args:
        request (request):  Client request

    Returns:
        500.html page with status 500
    """
    return render(request, "error/500.html", status=500)


# REST API


def create_constraints(constraints_data):
    """Create constraints (Or objetives)

    Args:
        data (json): request.data["organs"][X]["constraints" or "objectives"]

    Returns:
        List: created constraints, WARNING constraints are not saved, you have to do it yourself. Toxicities has to be created.
    """

    constraints = []
    for constaint_data in constraints_data:
        volume = (
            float(constaint_data.get("volume"))
            if constaint_data.get("volume")
            else None
        )
        value = float(constaint_data.get("value"))
        unit = Unit.objects.filter(pk=constaint_data.get("unit")).first()
        if unit is None:
            return Response(
                {"error": "Unit not found"}, status=status.HTTP_404_NOT_FOUND
            )

        comparison_sym = ComparisonSym.objects.filter(
            pk=constaint_data.get("comparison_sym")
        ).first()
        if comparison_sym is None:
            return Response(
                {"error": "ComparisonSym not found"}, status=status.HTTP_404_NOT_FOUND
            )
        reference = Reference(
            url=constaint_data.get("url"),
            desc=constaint_data.get("desc"),
        )
        reference.file = constaint_data.get("file")
        reference.save()

        constraint = Objective(
            volume=volume,
            value=value,
            unit=unit,
            comparison_sym=comparison_sym,
            reference=reference,
        )

        constraints.append(constraint)

    return constraints


class CustomPagination(pagination.PageNumberPagination):
    """
    Custom pagination class
    """

    page_size = 25
    page_size_query_param = "page_size"
    max_page_size = 1000


class IndicationViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows indications to be viewed or edited.
    """

    queryset = Indication.objects.all().order_by("location")
    serializer_class = IndicationSerializer
    search_fields = ["id", "fraction", "organ", "patient", "location", "is_clinical"]
    pagination_class = CustomPagination

    def get_permissions(self):
        if self.request.method in ["PUT", "DELETE", "POST"]:
            return [permissions.IsAdminUser()]
        return []

    def get_queryset(self):
        indications = Indication.objects.all()
        if "fraction" in self.request.GET:
            fraction = self.request.GET["fraction"]
            if fraction.isnumeric():
                fraction = int(fraction)
                fraction = Fraction.objects.get(number=fraction)
                indications = indications.filter(fraction=fraction)
            else:
                fraction = Fraction.objects.get(special=fraction)
                indications = indications.filter(fraction=fraction)
        if "organ" in self.request.GET:
            # if match with name or in alias
            # si alias__contains=self.request.GET["organ"] existe
            query = "," + self.request.GET["organ"] + ","
            query_EOF = "," + self.request.GET["organ"]
            query_BOF = self.request.GET["organ"] + ","
            if (
                Organ.objects.filter(alias__contains=query).exists()
                or Organ.objects.filter(alias__endswith=query_EOF).exists()
                or Organ.objects.filter(alias__startswith=query_BOF).exists()
            ):
                organ = Organ.objects.get(alias__contains=self.request.GET["organ"])
                indications = indications.filter(organs__organ=organ)

            elif Organ.objects.filter(name__iexact=self.request.GET["organ"]).exists():
                organ = Organ.objects.get(name__iexact=self.request.GET["organ"])
                indications = indications.filter(organs__organ=organ)
            else:
                indications = []
        if "patient" in self.request.GET:
            patient = Patient.objects.get(name__iexact=self.request.GET["patient"])
            indications = indications.filter(patient=patient)
        if "location" in self.request.GET:
            try:
                location = Location.objects.get(
                    name__iexact=self.request.GET["location"]
                )
            except Location.DoesNotExist:
                indications = []
            else:
                indications = indications.filter(location=location)
        if "id" in self.request.GET:
            id = self.request.GET["id"]
            indications = indications.filter(id=id)
        if "is_clinical" in self.request.GET:
            param = self.request.GET["is_clinical"].capitalize()
            if param == "True":
                indications = indications.filter(is_clinical=True)
            elif param == "False":
                indications = indications.filter(is_clinical=False)
            else:
                return []
        return indications

    def create(self, request):
        with transaction.atomic():
            data = dict(request.data.dict()).get("data", {})
            data = json.loads(data)
            locations_data = data.get("locations", [])
            if len(locations_data) == 0:
                return Response(
                    {"error": "Locations seems empty"},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            locations = []  # db objects
            for location_data in locations_data:
                location = Location.objects.filter(name=location_data["name"]).first()
                if location is None:
                    return Response(
                        {"error": "Location not found"},
                        status=status.HTTP_404_NOT_FOUND,
                    )
                locations.append(location)

            fractions_data = data.get("fractions", [])
            if len(fractions_data) == 0:
                return Response(
                    {"error": "Fractions seems empty"},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            fractions = []
            for fraction_data in fractions_data:
                fraction = Fraction.objects.filter(
                    number=fraction_data["number"]
                ).first()
                if fraction is None:
                    return Response(
                        {"error": "Fraction not found"},
                        status=status.HTTP_404_NOT_FOUND,
                    )
                fractions.append(fraction)

            patients_data = data.get("patients", [])
            if len(patients_data) == 0:
                return Response(
                    {"error": "Patients seems empty"},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            patients = []
            for patient_data in patients_data:
                patient = Patient.objects.filter(name=patient_data["name"]).first()
                if patient is None:
                    return Response(
                        {"error": "Patient not found"}, status=status.HTTP_404_NOT_FOUND
                    )
                patients.append(patient)

            is_clinical = data.get("is_clinical", "false") == "true"

            ## here we look for organ/constraints/objectives ( class IndicationOrg )
            indication_organs_data = data.get("organs", [])
            indication_organs = []
            for indication_organ_data in indication_organs_data:
                # creer indication organ
                indication_organ = IndicationOrg()

                # organ
                organ_data = indication_organ_data.get("organ")
                if organ_data is None:
                    return Response(
                        {"error": "Organ seems empty"}, status=status.HTTP_404_NOT_FOUND
                    )
                organ = Organ.objects.filter(name=organ_data["name"]).first()
                if organ is None:
                    return Response(
                        {"error": "Organ not found"}, status=status.HTTP_404_NOT_FOUND
                    )

                # constraints
                constraints_data = indication_organ_data.get("constraints")
                constraints = create_constraints(constraints_data)

                # objectives
                objectives_data = indication_organ_data.get("objectives")
                objectives = create_constraints(objectives_data)

                for file in request.FILES:
                    if "objective" in file:
                        idx = int(file.split("-")[1])
                        objectives[idx - 1].reference.file = request.FILES.get(file)
                        objectives[idx - 1].reference.save()
                    elif "constraint" in file:
                        idx = int(file.split("-")[1])
                        constraints[idx - 1].reference.file = request.FILES.get(file)
                        constraints[idx - 1].reference.save()

                # toxicities
                toxicities_data = indication_organ_data.get("toxicities")
                for tox, con, obj in zip(toxicities_data, constraints, objectives):

                    toxicity = Toxicity.objects.create(
                        value=tox["value"], description=tox["description"]
                    )
                    con.toxicity = toxicity
                    obj.toxicity = toxicity

                indication_organ.organ = organ

                indication_organ.save()  # mandatory  due to many to many many relation ship

                for constraint in constraints:
                    constraint.save()
                    indication_organ.constraints.add(constraint)

                for objective in objectives:
                    objective.save()
                    indication_organ.objectives.add(objective)

                indication_organ.save()

                indication_organs.append(indication_organ)

            reference_global_data = data.get("reference")
            if reference_global_data is not None:
                url = reference_global_data.get("url")
                desc = reference_global_data.get("desc")
                file = request.FILES.get("main")
                if not url and not desc and not file:
                    reference = None
                else:
                    reference = Reference.objects.create(url=url, desc=desc)
                    if file:
                        reference.file = file
                        reference.save()
                    
            else:
                reference = None
            indications = []
            for location, fraction, patient in zip(locations, fractions, patients):
                indication = Indication.objects.create(
                    location=location,
                    fraction=fraction,
                    patient=patient,
                    is_clinical=is_clinical,
                    reference=reference,
                )
                indication.organs.add(*indication_organs)
                indication.save()
                indications.append(indication)

            if len(indications) > 1:
                for indication_main in indications:
                    for indication_to_lnk in indications:
                        if indication_main == indication_to_lnk:
                            continue
                        indication_main.linked_with.add(indication_to_lnk)

            return Response(
                {"message": "Indication created"}, status=status.HTTP_201_CREATED
            )

    def update(self, request, *args, **kwargs):
        with transaction.atomic():

            data = dict(request.data.dict()).get("data", {})
            data = json.loads(data)
            locations_data = data.get("locations", [])  # json objects
            if len(locations_data) == 0:
                return Response(
                    {"error": "Locations seems empty"},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            locations = []  # db objects
            for location_data in locations_data:
                location = Location.objects.filter(name=location_data["name"]).first()
                if location is None:
                    return Response(
                        {"error": "Location not found"},
                        status=status.HTTP_404_NOT_FOUND,
                    )
                locations.append(location)

            fractions_data = data.get("fractions", [])
            if len(fractions_data) == 0:
                return Response(
                    {"error": "Fractions seems empty"},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            fractions = []
            for fraction_data in fractions_data:
                fraction = None
                if fraction_data["number"].isnumeric():
                    fraction = Fraction.objects.filter(
                        number=fraction_data["number"] 
                    ).first()
                else:
                    fraction = Fraction.objects.filter(
                        special=fraction_data["number"]
                    ).first()
                
                if fraction is None:
                    return Response(
                        {"error": "Fraction not found"},
                        status=status.HTTP_404_NOT_FOUND,
                    )
                fractions.append(fraction)

            patients_data = data.get("patients", [])
            if len(patients_data) == 0:
                return Response(
                    {"error": "Patients seems empty"},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            patients = []
            for patient_data in patients_data:
                patient = Patient.objects.filter(name=patient_data["name"]).first()
                if patient is None:
                    return Response(
                        {"error": "Patient not found"}, status=status.HTTP_404_NOT_FOUND
                    )
                patients.append(patient)

            indication_organs_data = data.get("organs", [])

            main_indication = Indication.objects.get(id=kwargs["pk"])
            main_indication.location = Location.objects.get(
                name=locations_data[0]["name"]
            )
            if fractions_data[0]["number"].isnumeric():
                main_indication.fraction = Fraction.objects.get(
                    number=fractions_data[0]["number"]
                )
            else:
                main_indication.fraction = Fraction.objects.get(
                    special=fractions_data[0]["number"]
                )
            main_indication.patient = Patient.objects.get(name=patients_data[0]["name"])
            indcation_organs = main_indication.organs.all()
            for indication_organ_data, indication_organ in zip(
                indication_organs_data, indcation_organs
            ):

                organ_data = indication_organ_data.get("organ")
                if organ_data is None:
                    return Response(
                        {"error": "Organ seems empty"}, status=status.HTTP_404_NOT_FOUND
                    )
                organ = Organ.objects.filter(name=organ_data["name"]).first()
                if organ is None:
                    return Response(
                        {"error": "Organ not found"}, status=status.HTTP_404_NOT_FOUND
                    )

                indication_organ.organ = organ

                # constraints
                constraints_data = indication_organ_data.get("constraints")

                if len(constraints_data) < len(indication_organ.constraints.all()):
                    for constraint in indication_organ.constraints.all()[
                        len(constraints_data) :
                    ]:
                        constraint.delete()

                for constraint, constraint_data in zip(
                    indication_organ.constraints.all(), constraints_data
                ):
                    constraint.volume = (
                        float(constraint_data.get("volume"))
                        if constraint_data.get("volume")
                        else None
                    )
                    constraint.value = float(constraint_data.get("value"))
                    constraint.unit = Unit.objects.get(pk=constraint_data.get("unit"))
                    constraint.comparison_sym = ComparisonSym.objects.get(
                        pk=constraint_data.get("comparison_sym")
                    )
                    constraint.reference.desc = constraint_data.get("desc")
                    constraint.reference.url = constraint_data.get("url")
                    constraint.reference.file = constraint_data.get("file")
                    constraint.reference.save()
                    constraint.save()

                if len(constraints_data) > len(indication_organ.constraints.all()):
                    constraints = create_constraints(
                        constraints_data[len(indication_organ.constraints.all()) :]
                    )
                    for constraint in constraints:
                        constraint.save()
                        indication_organ.constraints.add(constraint)

                # objectives
                objectives_data = indication_organ_data.get("objectives")

                if len(objectives_data) < len(indication_organ.objectives.all()):
                    for objective in indication_organ.objectives.all()[
                        len(objectives_data) :
                    ]:
                        objective.delete()

                file_index = 1
                for objective, objective_data in zip(
                    indication_organ.objectives.all(), objectives_data
                ):
                    objective.volume = (
                        float(objective_data.get("volume"))
                        if objective_data.get("volume")
                        else None
                    )
                    objective.value = float(objective_data.get("value"))
                    objective.unit = Unit.objects.get(pk=objective_data.get("unit"))
                    objective.comparison_sym = ComparisonSym.objects.get(
                        pk=objective_data.get("comparison_sym")
                    )
                    objective.reference.desc = objective_data.get("desc")
                    objective.reference.url = objective_data.get("url")
                    objective.reference.file = request.FILES.get(
                        f"objective-{file_index}"
                    )
                    objective.reference.save()
                    objective.save()
                    file_index += 1

                if len(objectives_data) > len(indication_organ.objectives.all()):
                    objectives = create_constraints(
                        objectives_data[len(indication_organ.objectives.all()) :]
                    )
                    for objective in objectives:
                        objective.save()
                        indication_organ.objectives.add(objective)

                toxicities_data = indication_organ_data.get("toxicities")

                toxicities = Toxicity.objects.filter(
                    objective__in=indication_organ.constraints.all()
                )
                for toxicity, toxcity_data in zip(toxicities, toxicities_data):
                    toxicity.value = toxcity_data.get("value")
                    toxicity.description = toxcity_data.get("description")
                    toxicity.save()

                if len(toxicities_data) > len(toxicities):
                    for tox in toxicities_data[len(toxicities) :]:
                        toxicity = Toxicity.objects.create(
                            value=tox["value"], description=tox["description"]
                        )
                        for constraint in indication_organ.constraints.all():
                            constraint.toxicity = toxicity
                            constraint.save()

                indication_organ.save()

            reference_global_data = data.get("reference")
            if reference_global_data is not None:
                if main_indication.reference:
                    main_indication.reference.url = reference_global_data.get("url")
                    main_indication.reference.desc = reference_global_data.get("desc")
                    main_indication.reference.file = request.FILES.get("main")
                else:
                    main_indication.reference = Reference()
                    main_indication.reference.url = reference_global_data.get("url")
                    main_indication.reference.desc = reference_global_data.get("desc")
                    main_indication.reference.file = request.FILES.get("main")
                main_indication.reference.save()
            main_indication.save()

            return Response(
                {"message": "Indication created"}, status=status.HTTP_201_CREATED
            )


class UnitViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows units to be viewed or edited.
    """

    queryset = Unit.objects.all()
    serializer_class = UnitSerializer
    search_fields = ["name"]

    def get_permissions(self):
        if self.request.method in ["PUT", "DELETE", "POST"]:
            return [permissions.IsAdminUser()]
        return []


class OrganViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows organs to be viewed. Passing a location parameter will filter the organs by location.
    """

    queryset = Organ.objects.all()
    serializer_class = OrganSerializer
    search_fields = ["name"]
    lookup_url_kwarg = "organ"

    def post(self, request, *args, **kwargs):
        organ_data = request.date.get("organ", {})
        # si existe deja
        if Organ.objects.filter(name__iexact=organ_data.get("name")).exists():
            # ignore
            return Response(
                {"message": "Organ already exists"}, status=status.HTTP_200_OK
            )
        else:
            organ = Organ.objects.create(**organ_data)
            return Response(
                {"message": "Organ created"}, status=status.HTTP_201_CREATED
            )

    def get_permissions(self):
        if self.request.method in ["PUT", "DELETE", "POST"]:
            return [permissions.IsAdminUser()]
        return []

    def get_queryset(self):
        # filter by location, patient or fraction
        if (
            "location" in self.request.query_params
            or "patient" in self.request.query_params
            or "fraction" in self.request.query_params
        ):
            location = self.request.query_params.get("location")
            patient = self.request.query_params.get("patient")
            fraction = self.request.query_params.get("fraction")
            indications = Indication.objects.all()
            if location:
                indications = indications.filter(location__name__iexact=location)
            if patient:
                indications = indications.filter(patient__name__iexact=patient)
            if fraction:
                if fraction.isnumeric():
                    indications = indications.filter(fraction__number=fraction)
                else:
                    indications = indications.filter(fraction__special__iexact=fraction)

            organs = [
                o.organ for indication in indications for o in indication.organs.all()
            ]
            # remove duplicates
            organs = list(dict.fromkeys(organs))
        else:
            organs = Organ.objects.all()

        organs = sorted(organs, key=lambda x: x.name)

        return organs


class LocationViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows locations to be viewed .
    """

    queryset = Location.objects.all()
    serializer_class = LocationSerializer
    search_fields = ["name"]

    def get_permissions(self):
        if self.request.method in ["PUT", "DELETE", "POST"]:
            return [permissions.IsAdminUser()]
        return []

    def get_queryset(self):
        if (
            "fraction" in self.request.query_params
            or "patient" in self.request.query_params
            or "organ" in self.request.query_params
        ):
            fraction = self.request.query_params.get("fraction")
            patient = self.request.query_params.get("patient")
            organ = self.request.query_params.get("organ")
            indications = Indication.objects.all()
            if fraction:
                if fraction.isnumeric():
                    indications = indications.filter(fraction__number=fraction)
                else:
                    indications = indications.filter(fraction__special__iexact=fraction)
            if patient:
                indications = indications.filter(patient__name__iexact=patient)
            if organ:
                indications = indications.filter(organs__organ__name__iexact=organ)

            locations = [indication.location for indication in indications]
            # remove duplicates
            locations = list(dict.fromkeys(locations))
        else:
            locations = Location.objects.all()

        locations = sorted(locations, key=lambda x: x.name)

        return locations


class FractionViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows fractions to be viewed .
    """

    queryset = Fraction.objects.all()
    serializer_class = FractionSerializer
    search_fields = ["number", "special"]

    def get_permissions(self):
        if self.request.method in ["PUT", "DELETE", "POST"]:
            return [permissions.IsAdminUser()]
        return []

    def get_queryset(self):
        if (
            "location" in self.request.query_params
            or "patient" in self.request.query_params
            or "organ" in self.request.query_params
        ):
            location = self.request.query_params.get("location")
            patient = self.request.query_params.get("patient")
            organ = self.request.query_params.get("organ")

            indications = Indication.objects.all()
            if location:
                indications = indications.filter(location__name__iexact=location)
            if patient:
                indications = indications.filter(patient__name__iexact=patient)
            if organ:
                indications = indications.filter(organs__organ__name__iexact=organ)

            fractions = [indication.fraction for indication in indications]
            # remove duplicates
            fractions = list(dict.fromkeys(fractions))
        else:
            fractions = Fraction.objects.all()

        def sort(fraction):
            if fraction.number is None:
                return float("inf")
            else:
                return fraction.number

        fractions = sorted(fractions, key=sort)

        return fractions


class PatientViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows patients to be viewed .
    """

    queryset = Patient.objects.all()
    serializer_class = PatientSerializer
    search_fields = ["name"]

    def get_permissions(self):
        if self.request.method in ["PUT", "DELETE", "POST"]:
            return [permissions.IsAdminUser()]
        return []
    
    def get_queryset(self):
        if (
            "location" in self.request.query_params
            or "fraction" in self.request.query_params
            or "organ" in self.request.query_params
        ):
            location = self.request.query_params.get("location")
            fraction = self.request.query_params.get("fraction")
            organ = self.request.query_params.get("organ")

            indications = Indication.objects.all()
            if location:
                indications = indications.filter(location__name__iexact=location)
            if fraction:
                if fraction.isnumeric():
                    indications = indications.filter(fraction__number=fraction)
                else:
                    indications = indications.filter(fraction__special__iexact=fraction)
            if organ:
                indications = indications.filter(organs__organ__name__iexact=organ)

            patients = [indication.patient for indication in indications]
            # remove duplicates
            patients = list(dict.fromkeys(patients))
        else:
            patients = Patient.objects.all()
            
        patients = sorted(patients, key=lambda x: x.name)
        
        return patients


class PreferenceViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows preferences to be viewed or edited.
    """

    queryset = Preference.objects.all()
    serializer_class = PreferenceSerializer
    search_fields = ["user"]

    def get_permissions(self):
        if self.request.method in ["PUT", "DELETE", "POST"]:
            return [permissions.IsAdminUser()]
        return []

    def get_queryset(self):
        # is authenticated ?
        if self.request.user.is_authenticated:
            return Preference.objects.filter(
                user=User.objects.get(id=self.request.user.id)
            )
        return []

    def create(self, request):
        user = User.objects.get(id=request.user.id)
        last_preference = Preference.objects.filter(user=user)
        if last_preference:
            last_preference.delete()
        preference = Preference(user=user)
        location = (
            Location.objects.get(name=request.data["location"])
            if request.data["location"] != ""
            else None
        )
        organ = (
            Organ.objects.get(name=request.data["organ"])
            if request.data["organ"] != ""
            else None
        )
        patient = (
            Patient.objects.get(name=request.data["patient"])
            if request.data["patient"] != ""
            else None
        )
        fraction = None
        if request.data.get("fraction", "") != "":
            if request.data["fraction"].isnumeric():
                fraction = Fraction.objects.get(number=request.data["fraction"])
            else:
                fraction = Fraction.objects.get(special=request.data["fraction"])

        preference = Preference(
            user=user,
            location=location,
            organ=organ,
            patient=patient,
            fraction=fraction,
        )
        preference.save()
        return Response(status=status.HTTP_201_CREATED)


class VueViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows vues to be viewed or edited.
    """

    queryset = Vue.objects.all()
    serializer_class = VueSerializer
    search_fields = ["user"]

    def get_permissions(self):
        if self.request.method in ["PUT", "DELETE", "POST"]:
            return [permissions.IsAdminUser()]
        return []

    def get_queryset(self):
        # is authenticated ?
        if self.request.user.is_authenticated:
            return Vue.objects.filter(user=User.objects.get(id=self.request.user.id))
        return []

    def create(self, request):
        user = User.objects.get(id=request.user.id)
        vue = Vue(user=user)
        print(request.data)
        location = (
            Location.objects.get(name=request.data["location"])
            if request.data["location"] != ""
            else None
        )
        organ = (
            Organ.objects.get(name=request.data["organ"])
            if request.data["organ"] != ""
            else None
        )
        patient = (
            Patient.objects.get(name=request.data["patient"])
            if request.data["patient"] != ""
            else None
        )
        fraction = None
        if request.data.get("fraction"):
            fraction = (
                (Fraction.objects.get(number=request.data["fraction"]))
                if request.data["fraction"].isnumeric()
                else Fraction.objects.get(special=request.data["fraction"])
            )

        vue = Vue(
            user=user,
            location=location,
            organ=organ,
            patient=patient,
            fraction=fraction,
        )
        vue.save()
        return Response(status=status.HTTP_201_CREATED)

    def destroy(self, request, pk):
        vue = Vue.objects.get(id=pk)
        if request.user.id != vue.user.id or not request.user.is_superuser:
            return Response(
                {"message": "You can't delete this vue"},
                status=status.HTTP_403_FORBIDDEN,
            )
        vue.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class ComparisonSymViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows comparison symbols to be viewed or edited.
    """

    queryset = ComparisonSym.objects.all()
    serializer_class = ComparisonSymbolSerializer
    search_fields = ["name", "id"]

    def get_permissions(self):
        if self.request.method in ["PUT", "DELETE", "POST"]:
            return [permissions.IsAdminUser()]
        return []


class CommentViewSet(viewsets.ModelViewSet):
    queryset = Comment.objects.all()
    serializer_class = CommentSerializer
    search_fields = ["id", "indication", "user", "body", "reply_to", "created_on"]

    def get_queryset(self):
        if "indication" in self.request.GET:
            indication = self.request.GET["indication"]
            return Comment.objects.filter(indication=indication)
        return Comment.objects.all()

    def get_permissions(self):
        if self.request.method in ["PUT"]:
            return [permissions.IsAdminUser()]
        return []

    def destroy(self, request, pk):
        comment = Comment.objects.get(id=pk)
        if request.user.id != comment.user.id and not request.user.is_superuser:
            return Response(
                {"message": "You can't delete this comment"},
                status=status.HTTP_403_FORBIDDEN,
            )
        if Comment.objects.filter(reply_to=pk):
            return Response(
                {"message": "This comment has replies, only an admin can delete it"},
                status=status.HTTP_403_FORBIDDEN,
            )
        comment.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    def create(self, request):
        if request.user.is_anonymous:
            return Response(
                {"message": "You must be logged in to comment"},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        # if same body and same idnication don't save
        if Comment.objects.filter(
            indication=request.data["indication"], body=request.data["body"]
        ).exists():
            return Response(
                {"message": "Comment already exists"}, status=status.HTTP_200_OK
            )
        else:
            Comment.objects.create(
                indication=Indication.objects.get(id=request.data["indication"]),
                user=User.objects.get(id=request.user.id),
                body=request.data["body"],
                reply_to=(
                    Comment.objects.get(id=request.data["reply_to"])
                    if request.data.get("reply_to")
                    else None
                ),
                created_on=datetime.datetime.now(),
            )

            return Response(
                {"message": "Comment created"}, status=status.HTTP_201_CREATED
            )

class ReferenceViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows references to be viewed or edited.
    """

    queryset = Reference.objects.all()
    serializer_class = ReferenceSerializer
    search_fields = ["url", "desc", "file"]

    def get_permissions(self):
        if self.request.method in ["PUT", "DELETE", "POST"]:
            return [permissions.IsAdminUser()]
        return []
    

def error500():
    raise Exception("500")
