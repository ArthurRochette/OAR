var current_page = 1;

document.addEventListener("DOMContentLoaded", async () => {
    const csrfToken = document.getElementsByName("csrfmiddlewaretoken")[0].value;
    const location_selectors = document.getElementsByName("location");
    const organ_selectors = document.getElementsByName("organ");
    const fraction_selectors = document.getElementsByName("fraction");
    const patient_selectors = document.getElementsByName("patient");
    const overlay = document.getElementById("overlay")
    const modal_vues = document.getElementById("modal_vues");
    const modal_indication = document.getElementById("modal_indication")
    const modal_location = document.getElementById("modal_location")
    const modal_fraction = document.getElementById("modal_fraction")
    const modal_patient = document.getElementById("modal_patient")
    const modal_key = document.getElementById("modal_key")
    const modal_organs_selector = document.getElementById("modal_organs_selector")
    const key_name = document.getElementById("key_name")
    const modal_key_input = document.getElementById("modal_key_input")
    const add_keys = document.querySelectorAll('[id^="add_key-"]')
    const modal_key_type = document.getElementById("modal_key_type");
    const add_indication = document.getElementById("add_indication");
    const cancel_indication = document.getElementById("button_neg_submit-");
    const cancel_key = document.getElementById("button_neg_key-");
    const modal_key_input_alpha_beta = document.getElementById("modal_key_input_alpha_beta");
    const reset_filter = document.getElementById("reset_filter");
    const need_help = document.getElementById("need_help");
    const modal_info = document.getElementById("modal_info");
    const modal_info_close = document.getElementById("modal_info_close");
    const button_pos_key = document.getElementById("button_pos_key-");
    const button_pos_submit = document.getElementById("button_pos_submit-");
    const objectives_div = document.getElementById("objectives_div");
    const constraints_div = document.getElementById("constraints_div");
    const toxicities_div = document.getElementById("toxicities_div");
    const modal_key_input_alias = document.getElementById("modal_key_input_alias");
    const mainTable = document.getElementById("mainTable");

    var timer = null;

    // use to detect when user is at the bottom, and we need to fetch more indications
    var options = {
        root: document.documentElement,
    };
    var observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.intersectionRatio > 0) {
                var patient_value = patient_selectors[0].value === "" ? "null" : patient_selectors[0].value;
                var location_value = location_selectors[0].value === "Localisation" ? "null" : location_selectors[0].value;
                var organ_value = organ_selectors[0].value === "Organe" ? "null" : organ_selectors[0].value;
                var fraction_value = fraction_selectors[0].value === "Fraction" ? "null" : fraction_selectors[0].value;
                fetch_api("indication/", `patient=${patient_value}&location=${location_value}&organ=${organ_value}&fraction=${fraction_value}&page=${current_page + 1}`).then((indications) => {
                    if (indications) {
                        fill_indications(indications.results);
                        current_page++;
                    }
                });

            }
        });
    }, options);
    observer.observe(document.getElementsByTagName("footer")[0]);

    const submit = ((e) => {
        /**
         * Send the indication form to the server
         */
        e.preventDefault();
        let files = []
        let modal_location_selectors = document.querySelectorAll('[id^="modal_location"]')
        let locations = []
        for (let i = 0; i < modal_location_selectors.length; i++) {
            locations.push(modal_location_selectors[i].value)
        }
        let modal_fraction_selectors = document.querySelectorAll('[id^="modal_fraction"]')
        let fractions = []
        for (let i = 0; i < modal_fraction_selectors.length; i++) {
            fractions.push(modal_fraction_selectors[i].value)
        }
        let modal_patient_selectors = document.querySelectorAll('[id^="modal_patient"]')
        let patients = []
        for (let i = 0; i < modal_patient_selectors.length; i++) {
            patients.push(modal_patient_selectors[i].value)
        }
        let organ = modal_organs_selector.value

        let objectives = []
        for (let i = 1; i < objectives_div.childElementCount; i++) {
            let objective = {}
            let objective_lines = [...objectives_div.children[i].getElementsByTagName("input"), ...objectives_div.children[i].getElementsByTagName("select")];
            for (let j = 0; j < objective_lines.length; j++) {
                let line = objective_lines[j]
                let key = line.id.split("-")[1]
                let value = line.value
                if (line.type === "file") {
                    if (line.files.length > 0) {
                        value = line.files[0].name
                        files.push([`objective-${i}`, line.files[0]])
                    }
                }
                objective[key] = value
            }
            objectives.push(objective)
        }
        let constraints = []
        for (let i = 1; i < constraints_div.childElementCount; i++) {
            let constraint = {}
            let constraint_lines = [...constraints_div.children[i].getElementsByTagName("input"), ...constraints_div.children[i].getElementsByTagName("select")];
            for (let j = 0; j < constraint_lines.length; j++) {
                let line = constraint_lines[j]
                let key = line.id.split("-")[1]
                let value = line.value
                if (line.type === "file") {
                    if (line.files.length > 0) {
                        value = line.files[0].name
                        files.push([`constraint-${i}`, line.files[0]])
                    }
                }
                constraint[key] = value
            }
            constraints.push(constraint)
        }
        let toxicities = []
        for (let i = 1; i < toxicities_div.childElementCount; i++) {
            let toxicity = {}
            let toxicity_lines = [...toxicities_div.children[i].getElementsByTagName("input"), ...toxicities_div.children[i].getElementsByTagName("select")];
            for (let j = 0; j < toxicity_lines.length; j++) {
                let line = toxicity_lines[j]
                let key = line.id.split("-")[0]
                let value = line.value
                toxicity[key] = value
            }
            toxicities.push(toxicity)
        }
        let reference_file_input = document.getElementById("main_reference-file-")
        if (reference_file_input.files.length > 0) {
            files.push([`main`, reference_file_input.files[0]])
        }

        let reference = {}
        reference["file"] = reference_file_input.value
        reference["file"] = reference["file"].split("\\").pop()


        reference["url"] = document.getElementById("main_reference-url-").value
        reference["desc"] = document.getElementById("main_reference-desc-").value

        let post = {
            "locations": locations.map((location) => { return { "name": location } }),
            "fractions": fractions.map((fraction) => { return { "number": fraction } }),
            "patients": patients.map((patient) => { return { "name": patient } }),
            "is_clinical": document.getElementById("is_clinical").checked,
            "organs": [
                {
                    "organ": { "name": organ },
                    "constraints": [

                    ],
                    "objectives": [

                    ],
                    "toxicities": [

                    ],
                },
            ],
            "reference": reference,
        }

        constraints.forEach((constraint) => {
            post["organs"][0]["constraints"].push(constraint)
        })
        objectives.forEach((objective) => {
            post["organs"][0]["objectives"].push(objective)
        })
        toxicities.forEach((toxicity) => {
            post["organs"][0]["toxicities"].push(toxicity)
        })

        const formData = new FormData();
        formData.append('data', JSON.stringify(post));

        files.forEach((name_file) => {
            formData.append(name_file[0], name_file[1]);
        })

        // post to the server axios
        axios.post('/api/indication/', formData, { headers: { 'Content-type': 'multipart/form-data', 'X-CSRFToken': csrfToken } }).then(() => {
            hide_modal()
            window.location.reload();
        }).catch((error) => {
            console.log(error)
            // modal user
            window.alert(`Erreur lors de l'envoi de la requête: \n ${error.response.data.error}`)

        })

    });
    const filter_ = (() => {
        /**
         * Filter the indications based on the current filters
         */
        clearTimeout(timer);
        update_filter();
        timer = setTimeout(() => {
            save_filter(); // when connected save the filter as user preference

            // Query the API with the new filters
            var patient_value = patient_selectors[0].value === "" ? "null" : patient_selectors[0].value;
            var location_value = location_selectors[0].value === "Localisation" ? "null" : location_selectors[0].value;
            var organ_value = organ_selectors[0].value === "Organe" ? "null" : organ_selectors[0].value;
            var fraction_value = fraction_selectors[0].value === "Fraction" ? "null" : fraction_selectors[0].value;
            // keep the first child only
            while (mainTable.children.length > 1) {
                mainTable.removeChild(mainTable.lastChild);
            }
            current_page = 1;
            fetch_api("indication", `patient=${patient_value}&location=${location_value}&organ=${organ_value}&fraction=${fraction_value}`).then((indications) => {
                fill_indications(indications.results);
            });
        }, 1000);
    });
    const is_connected = (() => {
        /**
         * Check if the user is connected
         */
        return (!!document.getElementById("username"))
    })
    const is_admin = (() => {
        /**
         * Check if the user is an admin
            */
        return document.getElementById("is_admin").value == "True"
    })
    const save_filter = (async () => {
        /**
         * Save the current filter as user preference
         */
        if (!is_connected()) return;

        axios.post(`/api/preference/`, {
            'location': location_selectors[0].value != "Localisation" ? location_selectors[0].value : "",
            'organ': organ_selectors[0].value != "Organe" ? organ_selectors[0].value : "",
            'fraction': fraction_selectors[0].value != "Fraction" ? fraction_selectors[0].value : "",
            'patient': patient_selectors[0].value
        }, {
            headers: {
                'Content-type': 'application/json',
                'X-CSRFToken': csrfToken
            }
        }).then((response) => {
            console.log(response)
        })

    });
    const hide_modal = (() => {
        /**
         * Hide modals
         */
        document.getElementsByTagName("body")[0].classList.remove("overflow-hidden");

        overlay.classList.add("invisible");
        modal_info.classList.add('invisible');
        if (is_connected()) {
            modal_vues.classList.add('translate-x-full');
            if(is_admin()){
                modal_indication.classList.add('invisible');
                modal_key.classList.add('invisible');
            }
        }
    });
    const show_modal = ((modal) => {
        /**
         * Show modals
         */
        overlay.classList.remove("invisible");
        document.getElementsByTagName("body")[0].classList.add("overflow-hidden");
        modal.classList.remove('invisible');
        modal_organs_selector.innerHTML = "";
        fetch_api("organ").then((organs) => {
            organs.results.forEach((organ) => {
                modal_organs_selector.innerHTML += `<option value="${organ.name}">${organ.name}</option>`;
            });
        });
    });
    const create_indication = (() => {
        /**
         * Show the modal to create an indication
         */
        modal_location.value = location_selectors[0].value;
        modal_fraction.value = fraction_selectors[0].value;
        modal_patient.value = patient_selectors[0].value;
        show_modal(modal_indication);
    });
    const create_key = (async (event) => {
        /**
         * Create a key (fraction, organ, patient, location)
         */
        event.preventDefault();
        if (modal_key_input.value === "") {
            return;
        }
        var post = ""
        switch (modal_key_type.value) {
            case "Fraction":
                post = { 'number': modal_key_input.value, 'special': null };
                break;
            case "Organ":
                post = { 'name': modal_key_input.value, 'alpha_beta': modal_key_input_alpha_beta.value, 'alias': modal_key_input_alias.value };
                break;
            case "Patient":
                post = { 'name': modal_key_input.value }
                break;
            case "Location":
                post = { 'name': modal_key_input.value }
                break;
        }
        axios.post(`/api/${modal_key_type.value.toLowerCase()}/`, post, {
            headers: {
                'Content-type': 'application/json',
                'X-CSRFToken': csrfToken
            }
        }).then((response) => {
            console.log(response)
        })
        update_filter();
        hide_modal();

    });
    const show_modal_key = ((event) => {
        /**
         * Show the modal to create a key (fraction, organ, patient, location)
         */
        let key = event.target.id.substring(8)
        overlay.classList.remove("invisible");
        modal_key.classList.remove('invisible');
        modal_key_input.value = "";
        if (key === "Fraction") {
            modal_key_input.type = "number"
        } else {
            modal_key_input.type = "text"
        }
        modal_key_input_alpha_beta.hidden = key !== "Organ";
        modal_key_input_alpha_beta.value = "";
        modal_key_input_alias.hidden = key !== "Organ";
        modal_key_input_alias.value = "";
        key_name.innerHTML = key;
        modal_key_type.value = key;
    });
    const reset_filter_ = (() => {
        /**
         * Set the filters to their default values
         */
        location_selectors[0].value = "Localisation";
        organ_selectors[0].value = "Organe";
        fraction_selectors[0].value = "Fraction";
        filter_();
    });
    const fill_indications = ((indications) => {
        /**
         * Fill the indications table with the given indications
         */
        // Lets generate rows
        indications.forEach(function (indication) {
            var row = document.createElement('tr');
            row.classList.add('cursor-pointer', 'hover:bg-slate-100', 'w-full', 'overflow-hidden');
            row.id = 'row-' + indication.id;
            row.draggable = true;

            row.addEventListener('click', () => {
                window.location.href = '/indication/' + indication.id;
            });

            var isClinicalCell = document.createElement('td');
            isClinicalCell.classList.add('border-y', 'border-slate-300', 'py-5');

            row.appendChild(isClinicalCell);

            var locationCell = createTableCell('border-y border-slate-300 p-2.5 text-center', indication.location);
            var fractionCell = createTableCell('border-y border-slate-300 p-2.5 text-center', indication.fraction);
            var patientCell = createTableCell('border-y border-slate-300 p-2.5 text-center', indication.patient);

            row.appendChild(locationCell);
            row.appendChild(fractionCell);
            row.appendChild(patientCell);

            var organsCell = document.createElement('td');
            organsCell.classList.add('border-y', 'border-slate-300', 'p-2.5', 'text-center');
            organsCell.colSpan = 5;

            indication.organs.forEach(function (organ) {
                var organDiv = document.createElement('div');
                organDiv.classList.add('flex', 'flex-column', 'w-full', 'py-2.5', 'border-slate-300');
                organDiv.dataset.alias = organ.organ.alias;

                var organNameDiv = document.createElement('div');
                organNameDiv.classList.add('whitespace-normal', 'm-auto', 'w-full', 'text-center');
                organNameDiv.textContent = organ.organ.name;
                organDiv.appendChild(organNameDiv);

                var objectivesDiv = document.createElement('div');
                objectivesDiv.classList.add('m-auto', 'w-full', 'text-center', '600');
                objectivesDiv.id = 'a obj';

                organ.objectives.forEach(function (obj) {
                    var objectiveDiv = document.createElement('div');
                    var volume = obj.volume ? obj.volume : '';
                    var value = obj.value ? obj.value : '';
                    var comparison = obj.comparison_sym ? obj.comparison_sym.name : '';
                    var unit = obj.unit ? obj.unit.symbol : '';
                    objectiveDiv.textContent = obj.unit.volume_formater.replace("{}", volume).replace("{}", comparison).replace("{}", value).replace("{}", unit);
                    objectivesDiv.appendChild(objectiveDiv);
                });

                // Ajoutez des éléments vides pour aligner les contraintes s'il y en a moins que les objectifs
                var diff = organ.objectives.length - organ.constraints.length;
                if (diff > 0) {
                    for (var i = 0; i < diff; i++) {
                        var emptyDiv = document.createElement('div');
                        objectivesDiv.appendChild(emptyDiv);
                    }
                }

                organDiv.appendChild(objectivesDiv);

                var constraintsDiv = document.createElement('div');
                constraintsDiv.classList.add('m-auto', 'w-full', 'text-center', 'text-red-600');
                constraintsDiv.id = 'a constraint';

                organ.constraints.forEach(function (cons) {
                    var constraintDiv = document.createElement('div');
                    constraintDiv.textContent = cons.unit.volume_formater.replace("{}", cons.volume == null ? "" : cons.volume)
                        .replace("{}", cons.comparison_sym.name == null ? "" : cons.comparison_sym.name)
                        .replace("{}", cons.value == null ? "" : cons.value)
                        .replace("{}", cons.unit.symbol == null ? "" : cons.unit.symbol);
                    constraintsDiv.appendChild(constraintDiv);
                });

                // Ajoutez des éléments vides pour aligner les objectifs s'il y en a moins que les contraintes
                diff = organ.constraints.length - organ.objectives.length;
                if (diff > 0) {
                    for (let i = 0; i < diff; i++) {
                        let emptyDiv = document.createElement('div');
                        constraintsDiv.appendChild(emptyDiv);
                    }
                }

                organDiv.appendChild(constraintsDiv);

                var toxicityDiv = document.createElement('div');
                toxicityDiv.classList.add('m-auto', 'w-full', 'text-center');
                toxicityDiv.id = 'a_tox';

                organ.constraints.forEach(function (cons) {
                    var toxicityValue = cons.toxicity ? cons.toxicity.value : '';
                    var toxicityDescription = cons.toxicity ? cons.toxicity.description : '';
                    var toxicityDivChild = document.createElement('div');
                    if (toxicityValue && toxicityDescription) {
                        toxicityDivChild.textContent = toxicityValue + '% de ' + toxicityDescription;
                    }

                    toxicityDiv.appendChild(toxicityDivChild);
                });

                organDiv.appendChild(toxicityDiv);

                var alphaBetaDiv = document.createElement('div');
                alphaBetaDiv.classList.add('m-auto', 'w-2/6');
                if (organ.organ.alpha_beta) {
                    alphaBetaDiv.textContent = organ.organ.alpha_beta + ' Gy';
                }
                organDiv.appendChild(alphaBetaDiv);

                organsCell.appendChild(organDiv);
            });

            row.appendChild(organsCell);

            mainTable.appendChild(row);
        });

        // Fonction utilitaire pour créer une cellule de tableau avec la classe et le contenu donnés
        function createTableCell(className, content) {
            var cell = document.createElement('td');
            cell.classList.add(...className.split(" "));
            cell.textContent = content;
            return cell;
        }
        mainTable.dispatchEvent(new CustomEvent('updated'));
    });
    const update_filter = (async () => {
        /**
         * Update the filters based on the current values
         */
        // update the filters
        var location_value = location_selectors[0].value === "Localisation" ? "null" : location_selectors[0].value;
        var fraction_value = fraction_selectors[0].value === "Fraction" ? "null" : fraction_selectors[0].value;
        var patient_value =  patient_selectors[0].value;
        var organ_value = organ_selectors[0].value === "Organe" ? "null" : organ_selectors[0].value;

        var new_locations = await fetch_api("location", `patient=${patient_value}&organ=${organ_value}&fraction=${fraction_value}`);
        var new_organs = await fetch_api("organ", `patient=${patient_value}&location=${location_value}&fraction=${fraction_value}`);
        var new_fractions = await fetch_api("fraction", `patient=${patient_value}&location=${location_value}&organ=${organ_value}`);
        var new_patients = await fetch_api("patient", `location=${location_value}&organ=${organ_value}&fraction=${fraction_value}`);


        if (location_selectors[0].value === "Localisation") {
            location_selectors[0].innerHTML = "";
            location_selectors[0].innerHTML += `<option selected >Localisation</option>`;
            new_locations.results.forEach((location) => {
                location_selectors[0].innerHTML += `<option value="${location.name}">${location.name}</option>`;
            });
        }
        if (organ_selectors[0].value === "Organe") {
            organ_selectors[0].innerHTML = "";
            organ_selectors[0].innerHTML += `<option selected >Organe</option>`;
            new_organs.results.forEach((organ) => {
                organ_selectors[0].innerHTML += `<option value="${organ.name}">${organ.name}</option>`;
                if (organ.alias) {
                    organ_selectors[0].innerHTML += `<option value="${organ.name}">${organ.alias}</option>`;
                }
            });

        }
        if (fraction_selectors[0].value === "Fraction") {
            fraction_selectors[0].innerHTML = "";
            fraction_selectors[0].innerHTML += `<option selected >Fraction</option>`;
            new_fractions.results.forEach((fraction) => {
                var value = null;
                if (fraction.number) {
                    value = fraction.number;
                } else {
                    value = fraction.special;
                }
                fraction_selectors[0].innerHTML += `<option value="${value}">${value}</option>`;
            });
        }
        

        var last_patient_selected = patient_selectors[0].value;
        patient_selectors[0].innerHTML = "";
        new_patients.results.forEach((patient) => {
            if (patient.name == last_patient_selected) {
                patient_selectors[0].innerHTML += `<option selected value="${patient.name}">${patient.name}</option>`;
            } else {
                patient_selectors[0].innerHTML += `<option value="${patient.name}">${patient.name}</option>`;
            }
        });

    });
    const fetch_api = (async (what, conditions) => {
        /**
         * Fetch the API with the given conditions
         */
        if (!conditions) {
            conditions = ""
        }
        // remove if null in condition
        conditions = conditions.split("&").filter((item) => {
            return item.split("=")[1] !== "null"
        }).join("&");

        conditions = conditions.replace("+", "%2B")
        let response = null;
        try {
            response = await axios.get(`/api/${what}?${conditions}`);
        }
        catch (error) {
            console.log(error)
            return null;
        }
        return response.data;
    });


    need_help.addEventListener("click", () => {
        show_modal(modal_info)
    });
    modal_info_close.addEventListener("click", hide_modal);

    if (is_admin()) {
        button_pos_key.addEventListener('click', create_key);
        button_pos_submit.addEventListener('click', submit);
        add_indication.addEventListener("click", create_indication);

        for (let i = 0; i < add_keys.length; i++) {
            add_keys[i].addEventListener("click", show_modal_key);
        }

        cancel_indication.addEventListener("click", hide_modal);
        cancel_key.addEventListener("click", hide_modal);
    }

    Promise.all([
        fetch_api("organ"),
        fetch_api("location"),
        fetch_api("fraction"),
        fetch_api("patient")
    ]).then(async ([organs, localisations, fractions, patients]) => {
        var organ_selected = null;
        var location_selected = null;
        var fraction_selected = null;
        var patient_selected = null;

        organs = organs.results;
        localisations = localisations.results;
        fractions = fractions.results;
        patients = patients.results;

        var preference = await fetch_api("preference")

        if (preference.results.length > 0) {
            preference = preference.results[0]
        }


        // Ajout des options pour les organes
        for (const organ in organs) {
            organ_selectors.forEach((organ_selector) => {
                if (preference) {
                    if (organs[organ].name == preference.organ) {
                        organ_selector.innerHTML += `<option selected value="${organs[organ].name}">${organs[organ].name}</option>`;
                        organ_selected = organs[organ].name;

                    } else {
                        organ_selector.innerHTML += `<option value="${organs[organ].name}">${organs[organ].name}</option>`;
                        if (organs[organ].alias) {
                            organ_selector.innerHTML += `<option value="${organs[organ].name}">${organs[organ].alias}</option>`;

                        }
                    }
                } else {
                    organ_selector.innerHTML += `<option value="${organs[organ].name}">${organs[organ].name}</option>`;
                    if (organs[organ].alias) {
                        organ_selector.innerHTML += `<option value="${organs[organ].name}">${organs[organ].alias}</option>`;
                    }
                }
            });

        }

        // Ajout des options pour les localisations
        for (const localisation in localisations) {
            location_selectors.forEach((location_selector) => {
                if (preference) {
                    if (localisations[localisation].name == preference.location) {
                        location_selector.innerHTML += `<option selected value="${localisations[localisation].name}">${localisations[localisation].name}</option>`;
                        location_selected = localisations[localisation].name;

                    } else {
                        location_selector.innerHTML += `<option value="${localisations[localisation].name}">${localisations[localisation].name}</option>`;
                    }
                } else {
                    location_selector.innerHTML += `<option value="${localisations[localisation].name}">${localisations[localisation].name}</option>`;
                }
            });

        }

        // Ajout des options pour les fractions
        fraction_selectors.forEach((fraction_selector) => {
            for (const fraction in fractions) {
                var value = null;
                if (fractions[fraction].number) {
                    value = fractions[fraction].number;
                } else {
                    value = fractions[fraction].special;
                }
                if (preference) {
                    if (preference) {
                        if (value == preference.fraction) {
                            fraction_selector.innerHTML += `<option selected value="${value}">${value}</option>`;
                            fraction_selected = value;
                        } else {
                            fraction_selector.innerHTML += `<option value="${value}">${value}</option>`;
                        }
                    } else {
                        fraction_selector.innerHTML += `<option value="${value}">${value}</option>`;
                    }
                }

            }
        });

        // Ajout des options pour les patients
        for (const patient in patients) {
            patient_selectors.forEach((patient_selector) => {
                if (preference) {
                    if (patients[patient].name == preference.patient) {
                        patient_selector.innerHTML += `<option selected value="${patients[patient].name}">${patients[patient].name}</option>`;
                        patient_selected = patients[patient].name;

                    } else {
                        patient_selector.innerHTML += `<option value="${patients[patient].name}">${patients[patient].name}</option>`;
                    }
                } else {
                    patient_selector.innerHTML += `<option value="${patients[patient].name}">${patients[patient].name}</option>`;

                }
            });

        }

        update_filter();

        // Fetch des indications une fois que les options sont chargées et preselectionnées
        fetch_api("indication", `patient=${patient_selected}&location=${location_selected}&organ=${organ_selected}&fraction=${fraction_selected}`).then((indications) => {
            fill_indications(indications.results);
        });


    });

    mainTable.addEventListener("need_filter", filter_); // used to trigger filter when needed
    location_selectors[0].addEventListener('change', filter_);
    organ_selectors[0].addEventListener('change', filter_);
    fraction_selectors[0].addEventListener('change', filter_);
    patient_selectors[0].addEventListener('change', filter_);
    reset_filter.addEventListener('click', reset_filter_);
    overlay.addEventListener("click", hide_modal);
    
    console.log("Index script loaded");
})

