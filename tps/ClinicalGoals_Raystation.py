# # Use this for test purposes only
# import os, sys
# pid_file_path = os.path.join(os.environ.get('userprofile'), 'AppData', 'Local', 'Temp', 'raystation.pid')

# with open(pid_file_path) as f:
#     os.environ['RAYSTATION_PID'] = f.read()

# script_client_path = r'C:\Program Files\RaySearch Laboratories\RayStation 12A-SP1\ScriptClient'
# sys.path.append(script_client_path)

from connect import *
from tkinter import ttk
import tkinter as tk
from tkinter import *
import sys
import requests
import urllib.parse

URL = "" ## URL de l'API (ex: http://mon_serveur/api ou http://mon_serveur:8000/api)

def formater(func):
    def wrapper(*args, **kwargs):
        args = [urllib.parse.quote(arg) for arg in args]
        kwargs = {k: urllib.parse.quote(v) for k, v in kwargs.items()}
        return func(*args, **kwargs)
    return wrapper

def check_url(url):
    """
    Verifie si l'url passe en parametre retourne un http 200
    """
    try:
        r = requests.get(url)
        return r.status_code == 200
    except:
        return False

@formater
def get_indication(location=None, organ=None, fraction=None, patient=None, etude=None):
    """
    Retourne les indications correspondantes aux filtres donnes
    """    
    url = URL + 'indication?'

    if location:
        url += 'location=' + location
    if organ:
        url += '&organ=' + organ
    if fraction:
        url += '&fraction=' + str(fraction)
    if patient:
        url += '&patient=' + patient
    if etude:
        url += '&clinical_name=' + etude
    if check_url(url):
        r = requests.get(url)
        return r.json()["results"]
    else:
        return {}

def get_locations():
    """
    Retourne la liste des locations
    """
    url = URL + 'location'
    if check_url(url):
        r = requests.get(url)
        return r.json()["results"]
    else:
        return {}
    
def get_patients():
    """
    Retourne la liste des types de patients (enfant adulte)
    """
    url = URL + 'patient'
    if check_url(url):
        r = requests.get(url)["results"]
        return r.json()
    else:
        return {}

@formater
def get_organs(location="", patient="", fraction=""):
    """
    Retourne la liste des organes (peuvent etre filtres en fonction d'une localisation, du type de patient (adulte/enfant) et du nombre de fractions)
    """
    url = URL + 'organ/?'
    if location:
        url += 'location=' + location
    if patient:
        url += '&patient=' + patient
    if fraction:
        url += '&fraction=' + str(fraction)
    if check_url(url):
        r = requests.get(url)
        return r.json()["results"]
    else:
        return {}
    
def get_fractions():
    """
    Retourne la liste des fractions
    """
    url = URL + 'fraction'
    if check_url(url):
        r = requests.get(url)
        return r.json()["results"]
    else:
        return {}


class Application(tk.Tk):
    def __init__(self):
        tk.Tk.__init__(self)
        self.listeOAR = []
        locations = get_locations() 
        
        self.examination = get_current("Examination")
        self.case = get_current("Case")
        self.beamset = get_current("BeamSet")
        self.plan = get_current("Plan")
        
        ### définition des frames
        self.frameComboboxLocation = Frame(self, highlightbackground="gray", highlightthickness=1)
        self.frameComboboxLocation.grid(row=0, column=0)

        self.frameOarEnDoublon = Frame(self, highlightbackground="gray", highlightthickness=1)
        self.frameOarEnDoublon.grid(row=0, column=2, sticky='n', padx = 10)

        self.comboboxLocalisations = ttk.Combobox(self.frameComboboxLocation, values='')
        self.locationsName = [locations[i]['name'] for i,j in enumerate(locations)]

        self.lblLocalisation = tk.Label(self.frameComboboxLocation, text='Sélectionner la localisation',
                                        font=("Arial", 13))
        self.lblLocalisation.grid(row=1, column=0)

        self.lblEnfantOuAdulte = tk.Label(self.frameComboboxLocation, text='Sélectionner la catégorie',
                                          font=("Arial", 13))
        self.lblEnfantOuAdulte.grid(row=0, column=0)

        self.radioValueAdulteEnfant=tk.StringVar(value = ' ')
        self.radioValueAdulte = tk.Radiobutton(self.frameComboboxLocation,
                                               text='Adulte',
                                               font=("Arial", 13),
                                               variable = self.radioValueAdulteEnfant,
                                               value='Adulte')
        self.radioValueAdulte.grid(row=0, column=1)


        self.radioValueEnfant = tk.Radiobutton(self.frameComboboxLocation,
                                               text='Enfant',
                                               font=("Arial", 13),
                                               variable = self.radioValueAdulteEnfant,
                                               value='Enfant')
        self.radioValueEnfant.grid(row=0, column=2)


        self.numberOfFractions = self.getNumberOfFractions()
        prescriptionValue = self.getDosePrescription()
        self.fractionationValue = (prescriptionValue / self.numberOfFractions)/100
        self.oarList = self.getOarList()

        self.fractionation = self.setFractionation(self.fractionationValue)

        self.creationWidgets()
        
    def getOarList(self):
        return [i.Name for i in self.case.PatientModel.RegionsOfInterest if i.Type == 'Organ']


    def getNumberOfFractions(self):
        return self.beamset.FractionationPattern.NumberOfFractions

    def getDosePrescription(self):
        return self.beamset.Prescription.PrimaryPrescriptionDoseReference.DoseValue

    def addClinicalGoal(self, roiName, goalCriteria, goalType, acceptanceLevel, isComparativeGoal,
                        priority,parameterValue=0):
        self.plan.TreatmentCourse.EvaluationSetup.AddClinicalGoal(RoiName=roiName,
                                                                  GoalCriteria=goalCriteria,
                                                                  GoalType=goalType,
                                                                  AcceptanceLevel=acceptanceLevel,
                                                                  ParameterValue=parameterValue,
                                                                  IsComparativeGoal=isComparativeGoal,
                                                                  Priority=priority)


    def creationWidgets(self):
        self.comboboxLocalisations = ttk.Combobox(self.frameComboboxLocation,
                                                  values=self.locationsName,
                                                  state='readonly',
                                                  width=25)
        self.comboboxLocalisations.grid(row=1, column=1, columnspan=2, padx=10)
        self.comboboxLocalisations.bind('<<ComboboxSelected>>', self.getOARsFromLocalisation)

    def setFractionation(self, fractionation):
        if fractionation < 2.2:
            return 'dose séance < 2.2 Gy'
        else:
            return self.numberOfFractions

    def getIdemOar(self, organs):
        listeOarEnDoublon = []
        organs.sort()
        for i in range(len(organs) - 1):
            if organs[i + 1].startswith(organs[i]):
                listeOarEnDoublon.append(organs[i])
            if organs[i].startswith(organs[i + 1]):
                listeOarEnDoublon.append(organs[i + 1])


        if len(listeOarEnDoublon) !=0:
            ### Définition des labels pour afficher quels fichiers ont été ouverts
            self.lblOarEnDoublon = ttk.Label(self.frameOarEnDoublon, text='OAR en doublon : ',
                                             font=("Arial", 13))
            self.lblOarEnDoublon.grid(row=0, column=0)

            ### Définition du champs qui affiche le chemin du rtplan
            self.afficherOarEnDoublon = tk.Label(self.frameOarEnDoublon, text=listeOarEnDoublon[0],
                                                 font=("Arial", 13))
            self.afficherOarEnDoublon.grid(row=0, column=1)

            self.listeOarEnDoublonLast = []
            for i in organs:
                if listeOarEnDoublon[0] in i:
                    self.listeOarEnDoublonLast.append(i)


            ### Définition de la combobox pour selection du doublon
            self.lblOarEnDoublon = ttk.Label(self.frameOarEnDoublon, text='Selectionner l\'organe à inclure: ',
                                             font=("Arial", 13))
            self.lblOarEnDoublon.grid(row=1, column=0)

            self.comboboxLocalisationsEnDoublon = ttk.Combobox(self.frameOarEnDoublon,
                                                      values= self.listeOarEnDoublonLast,
                                                      state='readonly',
                                                      width=25,
                                                               font=("Arial", 13))
            self.comboboxLocalisationsEnDoublon.grid(row=1, column=1)
            self.comboboxLocalisationsEnDoublon.bind('<<ComboboxSelected>>', lambda event: self.remove_doublons(organs, self.listeOarEnDoublonLast, event))

        else:
            self.getConstraintsAndObjectives(organs)

    def remove_doublons(self, organs, organsDoublon, event):
        listeTemp = [i for i in organsDoublon if i != self.comboboxLocalisationsEnDoublon.get()]
        for i in listeTemp:
            organs.remove(i)
        self.getConstraintsAndObjectives(organs)

    def getOARsFromLocalisation(self, event):
        organs = get_organs(location=self.comboboxLocalisations.get(), patient=self.radioValueAdulteEnfant.get(), fraction=self.fractionation)
        organs = [organs[i]['name'] for i, j in enumerate(organs)]
        self.getIdemOar(organs)

    def setGoalCriteria(self, comparison):
        if comparison == '<':
            return "AtMost"
        else:
            return "AtLeast"

    def setGoalType(self, volumeValue):
        if volumeValue == "Dose (Gy)":
            return "AverageDose"
        elif volumeValue == 'Volume (%)':
            return "VolumeAtDose"
        else:
            return "DoseAtAbsoluteVolume"

    def getConstraintsAndObjectives(self, organs):
        plan = get_current("Plan")
        case = get_current("Case")
        vari = self.comboboxLocalisations.get()
        for organ in organs:
            for oar in self.oarList:
                if organ in oar or oar in organ:
                    doseOrgan = get_indication(location=vari,
                                               organ=organ,
                                               fraction=self.fractionation,
                                               patient=self.radioValueAdulteEnfant.get())

                    if len(doseOrgan[0]['organs'][0]['constraints'])!=0:
                        for i in range(len(doseOrgan[0]['organs'][0]['constraints'])):
                            comparisonSign = self.setGoalCriteria(doseOrgan[0]['organs'][0]['constraints'][i]['comparison_sym'])
                            volumeValue = self.setGoalType(doseOrgan[0]['organs'][0]['constraints'][i]['unit'])
                            if volumeValue == "AverageDose":
                                try:
                                    self.addClinicalGoal(roiName=oar,
                                                             goalCriteria=comparisonSign,
                                                             goalType=volumeValue,
                                                             acceptanceLevel=doseOrgan[0]['organs'][0]['constraints'][i]['value']*100,
                                                             isComparativeGoal=False,
                                                             priority=1,
                                                             parameterValue=0
                                                             )
                                except:
                                    print('No ROI or POI named ', oar , ' exists')
                            elif volumeValue == "VolumeAtDose":
                                try:
                                    self.addClinicalGoal(roiName=oar,
                                                             goalCriteria=comparisonSign,
                                                             goalType=volumeValue,
                                                             acceptanceLevel=doseOrgan[0]['organs'][0]['constraints'][i]['value']/100,
                                                             isComparativeGoal=False,
                                                             priority=1,
                                                             parameterValue=doseOrgan[0]['organs'][0]['constraints'][i]['volume']*100
                                                             )
                                except:
                                    print('No ROI or POI named ', organ, ' exists')
                            else:
                                try:
                                    self.addClinicalGoal(roiName=oar,
                                                             goalCriteria=comparisonSign,
                                                             goalType=volumeValue,
                                                             acceptanceLevel=doseOrgan[0]['organs'][0]['constraints'][i]['volume']*100,
                                                             isComparativeGoal=False,
                                                             priority=1,
                                                             parameterValue=doseOrgan[0]['organs'][0]['constraints'][i]['value']
                                                             )
                                except:
                                    print('No ROI or POI named ', organ, ' exists')

                    if len(doseOrgan[0]['organs'][0]['objectives'])!=0:
                        for j in range(len(doseOrgan[0]['organs'][0]['objectives'])):
                            comparisonSign = self.setGoalCriteria(doseOrgan[0]['organs'][0]['objectives'][j]['comparison_sym'])
                            volumeValue = self.setGoalType(doseOrgan[0]['organs'][0]['objectives'][j]['unit'])
                            if volumeValue == "AverageDose":
                                try:
                                    self.addClinicalGoal(roiName=oar,
                                                             goalCriteria=comparisonSign,
                                                             goalType=volumeValue,
                                                             acceptanceLevel=doseOrgan[0]['organs'][0]['objectives'][j]['value']*100,
                                                             isComparativeGoal=False,
                                                             priority=2147483647,
                                                             parameterValue=0
                                                             )
                                except:
                                    print('No ROI or POI named ', organ, ' exists')
                            elif volumeValue == "VolumeAtDose":
                                try:
                                    self.addClinicalGoal(roiName=oar,
                                                             goalCriteria=comparisonSign,
                                                             goalType=volumeValue,
                                                             acceptanceLevel=doseOrgan[0]['organs'][0]['objectives'][j]['value']/100,
                                                             isComparativeGoal=False,
                                                             priority=2147483647,
                                                             parameterValue=doseOrgan[0]['organs'][0]['objectives'][j]['volume']*100
                                                             )
                                except:
                                    print('No ROI or POI named ', organ, ' exists')
                            else:
                                try:
                                    self.addClinicalGoal(roiName=oar,
                                                             goalCriteria=comparisonSign,
                                                             goalType=volumeValue,
                                                             acceptanceLevel=doseOrgan[0]['organs'][0]['objectives'][j]['volume']*100,
                                                             isComparativeGoal=False,
                                                             priority=2147483647,
                                                             parameterValue=doseOrgan[0]['organs'][0]['objectives'][j]['value']
                                                             )
                                except:
                                    print('No ROI or POI named ', organ, ' exists')

        try:
            for i in range(len(plan.TreatmentCourse.EvaluationSetup.EvaluationFunctions)):
                roiName = plan.TreatmentCourse.EvaluationSetup.EvaluationFunctions[i].ForRegionOfInterest.Name
                if not case.PatientModel.RegionsOfInterest[roiName].Type == 'Ptv':
                    while ('ptv' in plan.TreatmentCourse.EvaluationSetup.EvaluationFunctions[
                        i].ForRegionOfInterest.Name.lower()) or ('-opt' in plan.TreatmentCourse.EvaluationSetup.EvaluationFunctions[
                        i].ForRegionOfInterest.Name.lower()):
                        plan.TreatmentCourse.EvaluationSetup.DeleteClinicalGoal(
                            FunctionToRemove=plan.TreatmentCourse.EvaluationSetup.EvaluationFunctions[i])
        except:
            print('tous les clinical goals sont supprimés')

        sys.exit()


app = Application()
app.mainloop()
