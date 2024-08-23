from rest_framework import serializers
from .models import *
from accounts.models import Comment


class OrganSerializer(serializers.ModelSerializer):
    class Meta:
        model = Organ
        fields = ["name", "alpha_beta", "alias"]

class ToxicitySerializer(serializers.ModelSerializer):
    class Meta:
        model = Toxicity
        fields = ("value", "description")

class ComparisonSymbolSerializer(serializers.ModelSerializer):
    class Meta:
        model = ComparisonSym
        fields = ["name","id"]

class UnitSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(read_only=True)
    name = serializers.CharField(max_length=16)
    symbol = serializers.CharField(max_length=8)
    volume_formater = serializers.CharField(max_length=32)
    hide_volume = serializers.BooleanField()

    class Meta:
        model = Unit
        fields = ("id","name", "symbol", "volume_formater", "hide_volume")

class ReferenceSerializer(serializers.ModelSerializer):
    file = serializers.FileField(allow_empty_file=True)
    class Meta:
        model = Reference
        fields = ( "url", "file", "desc")

class ObjectiveSerializer(serializers.ModelSerializer):
    unit = UnitSerializer()
    value = serializers.FloatField()
    volume = serializers.FloatField()
    comparison_sym = ComparisonSymbolSerializer()
    toxicity = ToxicitySerializer()
    reference = ReferenceSerializer()

    class Meta:
        model = Objective
        fields = ("unit", "value", "volume", "comparison_sym", "toxicity", "reference")

class IndicationOrganSerializer(serializers.ModelSerializer):
    organ = OrganSerializer()
    constraints = ObjectiveSerializer(read_only=True, many=True)
    objectives = ObjectiveSerializer(read_only=True, many=True)

    class Meta:
        model = IndicationOrg
        fields = ("organ", "constraints", "objectives")

class IndicationSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(read_only=True)
    location = serializers.StringRelatedField()
    patient = serializers.StringRelatedField()
    organs = IndicationOrganSerializer( many=True)
    fraction = serializers.StringRelatedField()
    reference = ReferenceSerializer()
    is_clinical = serializers.BooleanField()
    linked_with = serializers.PrimaryKeyRelatedField(queryset=Indication.objects.all(), many=True)
    
    class Meta:
        model = Indication
        fields = ("id","location", "fraction", "patient", "is_clinical", "organs","reference", "linked_with")

class CommentSerializer(serializers.ModelSerializer):
    user = serializers.StringRelatedField()
    class Meta:
        model = Comment
        fields = ("id","indication", "reply_to", "user", "body", "created_on")        

class LocationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Location
        fields = ("name",)

class FractionSerializer(serializers.ModelSerializer):
    number = serializers.IntegerField(allow_null=True)
    special = serializers.CharField(allow_null=True)
    
    class Meta:
        model = Fraction
        fields = ("number", "special")

class PatientSerializer(serializers.ModelSerializer):
    class Meta:
        model = Patient
        fields = ("name",)

class OrganSerializer(serializers.ModelSerializer):
    class Meta:
        model = Organ
        fields = ("name", "alias")

class PreferenceSerializer(serializers.ModelSerializer):
    location = serializers.StringRelatedField()
    organ = serializers.StringRelatedField()
    fraction = serializers.StringRelatedField()
    patient = serializers.StringRelatedField()

    class Meta:
        model = Preference
        fields = ("user", "location", "organ", "fraction", "patient")

class VueSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(read_only=True)
    location = serializers.CharField(source='location.name', allow_null=True)
    organ = serializers.CharField(source='organ.name', allow_null=True)
    fraction = FractionSerializer()
    patient = serializers.CharField(source='patient.name', allow_null=True)
    
    class Meta:
        model = Vue
        fields = ("id","location", "organ", "fraction", "patient")
        
class ReferenceSerializer(serializers.ModelSerializer):
    file = serializers.FileField(allow_empty_file=True)
    class Meta:
        model = Reference
        fields = ( "url", "file", "desc")