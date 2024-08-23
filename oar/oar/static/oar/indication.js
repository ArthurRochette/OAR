document.addEventListener("DOMContentLoaded", () => {
    const isreply_form = document.getElementById("isreply");
    const replying = document.getElementById("replying");
    const commentarea = document.getElementById("commentarea");
    const modif_pen = document.getElementById("modif_indication_button");
    const overlay = document.getElementById("overlay");
    const modal_indication = document.getElementById("modal_indication");
    const modif_delete = document.getElementById("delete_indication_button");
    const cancel_update = document.getElementById("button_neg_submit-");
    const stop_replying = document.getElementById("stop_replying");
    const delete_comment_buttons = document.querySelectorAll('[id^="delete_comment-"]');
    const button_neg = document.querySelectorAll('[id^="button_neg_submit"], [id^="button_neg_delete"]');
    const button_pos_delete_indication = document.getElementById("button_pos_delete_indication-");
    const button_pos_delete_comment = document.getElementById("button_pos_delete_comment-");
    const button_pos_submit = document.getElementById("button_pos_submit-");
    const submit = document.getElementById("submitcomment");
    const delete_modal = document.getElementById("delete_indication_modal")
    const csrfToken = document.getElementsByName("csrfmiddlewaretoken")[0].value;
    const modal_organs_selector = document.getElementById("modal_organs_selector")
    const objectives_div = document.getElementById("objectives_div");
    const constraints_div = document.getElementById("constraints_div");
    const toxicities_div = document.getElementById("toxicities_div");
    const IS_ADMIN = document.getElementById("is_admin").value === "True";


    const show_volume = ((event) => {
        /**
         * Show the objective in function of the unit (style)
         */
        
        let volume = event.target.options[event.target.selectedIndex]
        let type = event.target.id.split("-")[0];
        let id = event.target.id.split("-")[3];
        let organ = event.target.id.split("-")[2];

        if (volume.getAttribute("hide_volume") === "true") {
            let volume_group = document.getElementById(type + "-volume-" + organ + "-" + id);
            volume_group.style.display = "none";
        } else {
            let volume_group = document.getElementById(type + "-volume-" + organ + "-" + id);
            volume_group.style.display = "inline-block";
        }


        let formater = volume.getAttribute("formater");

        let children = volume.parentElement.parentElement.children;
        // // delete all label
        // for (let i = 0; i < children.length; i++) {
        //     if (children[i].nodeName === "LABEL") {
        //         children[i].remove();
        //         i--;
        //     }
        // }
        // find the index of volume in children
        let index = Array.from(children).indexOf(volume.parentElement);
        let parentElement = volume.parentElement.parentElement;
        formater.split("{}").forEach((item) => {
            if (item.includes("{}")) {
                let parts = item.split("{}");
                parts.forEach((part) => {
                    if (part) {
                        let label = document.createElement("label");
                        label.innerText = part;
                        label.classList.add("m-1");
                        parentElement.insertBefore(label, children[index + 1]);
                        index += 2;
                    }

                });
            } else if (item) {
                // Sinon, créer un label avec l'élément
                let label = document.createElement("label");
                label.innerText = item;
                label.classList.add("m-1");
                parentElement.insertBefore(label, children[index + 1]);
                index += 2;
            }
            if (index >= children.length) {
                index = children.length - 1;
            }

        });

    });
    const clear_node = ((node, organ_id) => {
        let childs = node.getElementsByTagName('*');
        let container = null;
        if (childs[0].id.includes("constraint")) {
            container = document.getElementById("constraints_div");
        } else if (childs[0].id.includes("objective")) {
            container = document.getElementById("objectives_div");
        } else {
            container = document.getElementById("toxicities_div");
        }
        for (let i = 0; i < childs.length; i++) {
            let child = childs[i];
            if (child.nodeName === "OPTION") continue;
            if (child.id !== undefined) {
                if (child.id.includes("label_unit-")) {
                    child.innerText = "";
                }
            }
            if (child.data !== undefined) continue; //mean space or newline marker
            if (child.id.includes("_dead")) {
                child.id = child.id.replace("_dead", "");
            }
            child.id = child.id + organ_id + "-" + (container.childElementCount - 1);
            child.value = '';
            child.disabled = false;
        }
        return childs;
    });
    const add_constraint = (() => {
        let newLine = document.getElementById("constraint_dead-").cloneNode(true);
        let constraints_div = document.getElementById("constraints_div");
        newLine.hidden = false;
        newLine.disabled = false;
        newLine.id = 'constraint-' + '-' + (constraints_div.children.length - 1);
        clear_node(newLine, "");
        newLine.getElementsByTagName("select")[0].addEventListener("change", show_volume);
        constraints_div.appendChild(newLine, document.getElementById("constraint_dead-").nextSibling);
        return newLine;

    });
    const add_objective = ((e) => {
        let organ_id = e.target.id.split("-")[1];
        let newLine = document.getElementById("objective_dead-").cloneNode(true);
        let objectives_div = document.getElementById("objectives_div");
        newLine.hidden = false;
        newLine.disabled = false;
        newLine.id = 'objective-' + organ_id + '-' + (objectives_div.children.length - 1);
        clear_node(newLine, organ_id);
        newLine.getElementsByTagName("select")[0].addEventListener("change", show_volume);
        objectives_div.appendChild(newLine, document.getElementById("objective_dead-").nextSibling);
        return newLine;
    });
    const add_toxicity = (() => {
        let newLine = document.getElementById("toxicity_dead").cloneNode(true);
        let toxicities_div = document.getElementById("toxicities_div");
        newLine.hidden = false;
        newLine.disabled = false;
        newLine.id = 'toxicity-' + (toxicities_div.children.length - 1);
        clear_node(newLine, "");
        toxicities_div.appendChild(newLine, document.getElementById("toxicity_dead").nextSibling);
        return newLine;
    });
    const modif = (() => {
        /**
         * Show the modif modal and load presets into inputs
         */
        overlay.classList.remove("invisible");
        modal_indication.classList.remove("invisible")
    });
    const is_connected = (() => {
        return (!!document.getElementById("username"))
    })
    const hide_modif = (() => {
        /**
         * Hide the modify modal
         */
        overlay.classList.add("invisible");
        modal_indication.classList.add("invisible");

    });
    const hide_delete = (() => {
        delete_modal.classList.add("invisible");
        overlay.classList.add("invisible");

    });
    const show_modal = ((event) => {
        let action = event.target.id.split("_")[0]
        let what = event.target.id.split("_")[1].split("-")[0]
        let modal = document.getElementById(action + "_" + what + "_modal");
        modal.classList.remove("invisible");
        modal.hidden = false;
        overlay.classList.remove("invisible");
    });
    const hide_modal = (() => {
        document.getElementsByTagName("body")[0].classList.remove("overflow-hidden");

        overlay.classList.add("invisible");
        if (is_connected()) {
            modal_indication.classList.add("invisible");
            delete_modal.classList.add("invisible");
        }
    });
    const delete_indication = (async () => {
        let id = window.location.href.split("/")[4];
        axios.delete(`/api/indication/${id}`, {
            headers: {
                'Content-type': 'application/json',
                'X-CSRFToken': csrfToken
            }
        }).then(() => {
            window.location.replace("/");
        });

    });
    const delete_comment = (async (event) => {
        let id = event.target.id.split("-")[1];
        axios.delete(`/api/comment/${id}/`, {
            headers: {
                'Content-type': 'application/json',
                'X-CSRFToken': csrfToken
            }
        }).then(() => {
            document.getElementById("com-" + id).remove();
            hide_modal();

        });
    });
    const toggle_send_comment = (() => {
        if (commentarea.value === "") {
            submit.disabled = true;
            submit.classList.add("cursor-default")
            submit.classList.remove("cursor-pointer")
            submit.classList.add("text-gray-500")
            submit.classList.remove("hover:bg-slate-100")
        } else {
            submit.disabled = false;
            submit.classList.remove("cursor-default")
            submit.classList.add("cursor-pointer")
            submit.classList.remove("text-gray-500")
            submit.classList.add("hover:bg-slate-100")
        }
    });
    async function fetch_api(what, conditions) {
        if (!conditions) {
            conditions = ""
        }
        // remove if null in condition
        conditions = conditions.split("&").filter((item) => {
            return item.split("=")[1] !== "null"
        }).join("&");
        const response = await axios.get(`/api/${what}?${conditions}`);
        return response.data;
    }
    const create_comment = ((user, content, date, reply, id) => {
        let comment_element = document.createElement("div");
        comment_element.classList.add("p-4");
        comment_element.classList.add("bg-white");
        comment_element.classList.add("shadow");
        comment_element.classList.add("rounded-lg");
        comment_element.classList.add("mb-8");
        comment_element.classList.add("relative");
        // add a reply button
        let reply_button = document.createElement("button");
        reply_button.classList.add("absolute");
        reply_button.classList.add("top-0");
        reply_button.classList.add("right-0");
        reply_button.classList.add("text-xs");
        reply_button.classList.add("text-gray-500");
        reply_button.classList.add("hover:text-gray-700");
        reply_button.classList.add("focus:outline-none");
        reply_button.classList.add("focus:text-gray-700");
        reply_button.classList.add("m-1");
        reply_button.innerText = "Répondre";

        reply_button.id = "reply-" + id;
        comment_element.appendChild(reply_button);

        let remove_comment = document.createElement("button");
        remove_comment.classList.add("absolute");
        remove_comment.classList.add("top-0");
        remove_comment.classList.add("right-16");
        remove_comment.classList.add("text-xs");
        remove_comment.classList.add("text-gray-500");
        remove_comment.classList.add("hover:text-gray-700");
        remove_comment.classList.add("focus:outline-none");
        remove_comment.classList.add("focus:text-gray-700");
        remove_comment.classList.add("m-1");
        remove_comment.innerText = "Supprimer";
        remove_comment.id = "delete_comment-" + id;
        remove_comment.addEventListener("click", delete_comment);
        comment_element.appendChild(remove_comment);

        comment_element.id = "com-" + id;

        let header = document.createElement("div");
        header.classList.add("flex");
        header.classList.add("justify-between");
        header.classList.add("items-center");

        let user_element = document.createElement("span");
        user_element.classList.add("font-semibold");
        user_element.classList.add("text-lg");
        user_element.id = "user-" + id;

        let date_element = document.createElement("span");
        date_element.classList.add("text-xs");
        date_element.classList.add("text-gray-500");
        date_element.id = "date-" + id;

        user_element.innerText = user;

        // format date
        date = new Date(date);
        date = date.toLocaleDateString() + " " + date.toLocaleTimeString();
        date_element.innerText = date;

        header.appendChild(user_element);
        header.appendChild(date_element);

        let content_element = document.createElement("p");
        content_element.classList.add("text-lg");
        content_element.classList.add("m-4");
        content_element.innerText = content;

        comment_element.appendChild(header);
        comment_element.appendChild(content_element);

        if (reply) {
            // placer le commentaire dans le bon parent
            let parent = document.getElementById("com-" + reply);
            parent.appendChild(comment_element);
        }
        else {
            document.getElementById("form_anchor").appendChild(comment_element);
        }
    });
    const submit_comment = (async () => {
        let body = commentarea.value;
        let indication = window.location.href.split("/")[4];
        let reply_to = isreply_form.value;
        let data = {
            "body": body,
            "indication": indication,
            "reply_to": reply_to
        }
        axios.post("/api/comment/", data, {
            headers: {
                'Content-type': 'application/json',
                'X-CSRFToken': csrfToken
            }
        }).then(() => {
            // refresh
            window.location.reload();
        });
    });
    const submit_indication = ((e) => {
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
                // check if input file
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
        });


        // post to the server axios
        axios.put(`/api/indication/${window.location.href.split("/")[4]}/`
            , formData, { headers: { 'Content-type': 'multipart/form-data', 'X-CSRFToken': csrfToken } }).then(() => {
                hide_modal()
                window.location.reload();
            }).catch((error) => {
                console.log(error)
                // modal user
                window.alert(`Erreur lors de l'envoi de la requête: \n ${error.response.data.error}`)

            });
    });

    overlay.addEventListener("click", hide_modif);
    overlay.addEventListener("click", hide_delete);
    cancel_update.addEventListener("click", hide_modif);

    if (is_connected()) {
        submit.addEventListener("click", submit_comment);
        commentarea.addEventListener("input", toggle_send_comment);
        stop_replying.addEventListener("click", () => {
            isreply_form.value = "";
            replying.hidden = true;
        });

        button_pos_delete_comment.addEventListener("click", delete_comment);



        try{
            modif_pen.addEventListener("click", modif);
            modif_delete.addEventListener("click", show_modal);
            button_neg.forEach((element) => {
                element.addEventListener("click", hide_modal);
            });
            button_pos_delete_indication.addEventListener("click", delete_indication);
            button_pos_submit.addEventListener("click", submit_indication);
            delete_comment_buttons.forEach((element) => {
                element.addEventListener("click", show_modal);
            });
        }
        catch{
            // not admin
        }
        toggle_send_comment();
    }

    fetch_api("indication", `id=${window.location.href.split("/")[4]}`).then(indication => {
        if (indication["results"].length == 0) {
            throw "Indication not found, api returns empty"
        }
        indication = indication["results"][0];

        let fraction = indication["fraction"];
        document.getElementById("fraction_value").innerText = fraction;

        let location = indication["location"];
        document.getElementById("location_value").innerText = location;

        let description = indication["patient"];
        document.getElementById("patient_value").innerText = description;

        let linked_with = indication["linked_with"];
        if (linked_with.length > 0) {
            document.getElementsByName("warning_linked_with").forEach((element) => {
                element.classList.remove("hidden");
            });
            let li = document.createElement("a");
            li.innerText = linked_with;
            li.href = "/indication/" + linked_with;
            fetch_api("indication", `id=${linked_with}`).then(indication => {
                if (indication["results"].length == 0) {
                    throw "Indication not found, api returns empty"
                }
                let data = indication["results"][0];
                li.innerText = data["fraction"] + " fraction(s), " + data["location"] + " " + data["patient"];
            }).then(() => {
                document.getElementById("linked_with_indication_list").appendChild(li);

            });
        }

        let organs = indication["organs"];
        organs.forEach((organ) => {
            document.getElementById("organ_value").innerText += organ["organ"]["name"];
            organ["constraints"].forEach((constraint) => {
                let format = constraint["unit"]["volume_formater"];
                format = format.replace("{}", constraint["volume"] == null ? "" : constraint["volume"]);
                format = format.replace("{}", constraint["comparison_sym"]["name"] == null ? "" : constraint["comparison_sym"]["name"]);
                format = format.replace("{}", constraint["value"] == null ? "" : constraint["value"]);
                format = format.replace("{}", constraint["unit"]["symbol"] == null ? "" : constraint["unit"]["symbol"]);
                let div = document.createElement("div");
                div.innerText = format;
                document.getElementById("constraint_value").appendChild(div);
                if (constraint["reference"]) {
                    if (constraint["reference"]["url"]) {
                        var link = document.createElement("a");
                        link.href = constraint["reference"]["url"];
                        link.innerText = constraint["reference"]["url"].split("/").pop();
                        link.target = "_blank";
                        link.classList.add("text-xs")
                        document.getElementById("constraint_value").appendChild(link);
                        let br = document.createElement("br");
                        document.getElementById("constraint_value").appendChild(br);
                    }
                    if (constraint["reference"]["file"]) {
                        let link = document.createElement("a");
                        link.href = constraint["reference"]["file"];
                        link.innerText = constraint["reference"]["file"].length < 30 ? constraint["reference"]["file"] : constraint["reference"]["file"].substring(0, 30) + "...";
                        link.classList.add("text-xs")
                        document.getElementById("constraint_value").appendChild(link);
                        let br = document.createElement("br");
                        document.getElementById("constraint_value").appendChild(br);
                    }
                    if (constraint["reference"]["desc"]) {
                        let link = document.createElement("a");
                        link.innerText = constraint["reference"]["desc"];
                        link.classList.add("text-xs")
                        document.getElementById("constraint_value").appendChild(link);
                    }
                }
                if (constraint["toxicity"]) {
                    document.getElementById("toxicity_value").innerText += constraint["toxicity"]["value"] + " de " + constraint["toxicity"]["description"] + "\n";
                }
            });
            organ["objectives"].forEach((objective) => {
                let format = objective["unit"]["volume_formater"];
                format = format.replace("{}", objective["volume"] == null ? "" : objective["volume"]);
                format = format.replace("{}", objective["comparison_sym"]["name"] == null ? "" : objective["comparison_sym"]["name"]);
                format = format.replace("{}", objective["value"] == null ? "" : objective["value"]);
                format = format.replace("{}", objective["unit"]["symbol"] == null ? "" : objective["unit"]["symbol"]);
                let div = document.createElement("div");
                div.innerText = format;
                document.getElementById("objective_value").appendChild(div);
                if (objective["reference"]) {
                    if (objective["reference"]["url"]) {
                        let link = document.createElement("a");
                        link.href = objective["reference"]["url"];
                        link.innerText = objective["reference"]["url"].length < 30 ? objective["reference"]["url"] : objective["reference"]["url"].substring(0, 30) + "..."
                        link.title = objective["reference"]["url"];
                        link.classList.add("text-xs")
                        link.target = "_blank";
                        document.getElementById("objective_value").appendChild(link);
                        let br = document.createElement("br");
                        document.getElementById("objective_value").appendChild(br);
                    }
                    if (objective["reference"]["file"]) {
                        let link = document.createElement("a");
                        link.href = objective["reference"]["file"];
                        link.innerText = objective["reference"]["file"].split("/").pop();
                        link.classList.add("text-xs")
                        document.getElementById("objective_value").appendChild(link);
                        let br = document.createElement("br");
                        document.getElementById("objective_value").appendChild(br);

                    }
                    if (objective["reference"]["desc"]) {
                        let link = document.createElement("a");
                        link.innerText = objective["reference"]["desc"];
                        link.classList.add("text-xs")
                        document.getElementById("objective_value").appendChild(link);
                    }
                }
            });

        });

        return indication;
    }).then((indication) => {
        if (is_connected()) {
            Promise.all([
                fetch_api("organ"),
                fetch_api("location"),
                fetch_api("fraction"),
                fetch_api("patient"),
                indication
            ]).then(([organs, localisations, fractions, patients]) => {
                organs = organs.results;
                localisations = localisations.results;
                fractions = fractions.results;
                patients = patients.results;

                localisations.forEach((localisation) => {
                    let option = document.createElement("option");
                    option.value = localisation.name;
                    option.innerText = localisation.name;
                    document.getElementById("modal_location").appendChild(option);
                });
                document.getElementById("modal_location").value = indication["location"];

                fractions.forEach((fraction) => {
                    let option = document.createElement("option");
                    option.value = fraction.number ? fraction.number : fraction.special;
                    option.innerText = option.value;
                    document.getElementById("modal_fraction").appendChild(option);
                });
                document.getElementById("modal_fraction").value = indication["fraction"];

                patients.forEach((patient) => {
                    let option = document.createElement("option");
                    option.value = patient.name;
                    option.innerText = option.value;
                    document.getElementById("modal_patient").appendChild(option);
                });
                document.getElementById("modal_patient").value = indication["patient"];

                organs.forEach((organ) => {
                    let option = document.createElement("option");
                    option.value = organ.name;
                    option.innerText = option.value;
                    document.getElementById("modal_organs_selector").appendChild(option);
                });
                document.getElementById("modal_organs_selector").value = indication["organs"][0]['organ'].name;

                let organ = indication["organs"][0];

                organ["constraints"].forEach((constraint) => {
                    let new_line = add_constraint();
                    new_line.getElementsByTagName("select")[0].value = constraint["unit"]["id"];
                    if (IS_ADMIN) {
                        new_line.getElementsByTagName("select")[0].dispatchEvent(new Event("change")); // display volume labels

                    }

                    new_line.getElementsByTagName("input")[0].value = constraint["volume"];
                    new_line.getElementsByTagName("select")[1].value = constraint["comparison_sym"]["id"];
                    new_line.getElementsByTagName("input")[1].value = constraint["value"];

                    new_line.getElementsByTagName("input")[3].value = constraint["reference"]["url"];
                    new_line.getElementsByTagName("input")[4].value = constraint["reference"]["desc"];
                    if (constraint["reference"]["file"]) {
                        // add a child <a> to the input
                        let link = document.createElement("a");
                        link.target = "_blank";
                        link.href = constraint["reference"]["file"];
                        constraint["reference"]["file"] = constraint["reference"]["file"].split("//").pop();
                        link.innerText = "Fichier actuel:" + (constraint["reference"]["file"].length < 30 ? constraint["reference"]["file"] : constraint["reference"]["file"].substring(0, 30) + "...");
                        link.classList.add("text-xs");
                        let br = document.createElement("br");
                        new_line.getElementsByTagName("input")[2].parentNode.appendChild(br);
                        new_line.getElementsByTagName("input")[2].parentNode.appendChild(link);

                        let link_delete = document.createElement("a");
                        link_delete.innerText = "Supprimer";
                        link_delete.href = "#";
                        link_delete.classList.add("text-xs");
                        link_delete.classList.add("text-red-500");
                        link_delete.addEventListener("click", () => {
                            link.remove();
                            link_delete.remove();
                            new_line.getElementsByTagName("input")[2].value = "";
                        });
                        new_line.getElementsByTagName("input")[2].parentNode.appendChild(link_delete);

                    }
                    if (constraint["toxicity"]) {
                        let new_tox = add_toxicity();
                        new_tox.getElementsByTagName("input")[0].value = constraint["toxicity"]["value"];
                        new_tox.getElementsByTagName("input")[1].value = constraint["toxicity"]["description"];
                    }


                });

                organ["objectives"].forEach((objective) => {
                    let new_line = add_objective({ target: { id: "objective-" + organ["organ"]["id"] } });
                    new_line.getElementsByTagName("select")[0].value = objective["unit"]["id"];
                    new_line.getElementsByTagName("select")[0].dispatchEvent(new Event("change")); // display volume labels

                    new_line.getElementsByTagName("input")[0].value = objective["volume"];
                    new_line.getElementsByTagName("select")[1].value = objective["comparison_sym"]["id"];
                    new_line.getElementsByTagName("input")[1].value = objective["value"];

                    new_line.getElementsByTagName("input")[3].value = objective["reference"]["url"];
                    new_line.getElementsByTagName("input")[4].value = objective["reference"]["desc"];

                    if (objective["reference"]["file"]) {
                        // add a child <a> to the input
                        let link = document.createElement("a");
                        link.target = "_blank";
                        link.href = objective["reference"]["file"];
                        objective["reference"]["file"] = objective["reference"]["file"].split("/").pop();
                        link.innerText = "Fichier actuel:" + objective["reference"]["file"].split("/").pop();
                        link.classList.add("text-xs");
                        let br = document.createElement("br");
                        new_line.getElementsByTagName("input")[2].parentNode.appendChild(br);
                        new_line.getElementsByTagName("input")[2].parentNode.appendChild(link);

                    }
                });
                if (indication["reference"] != null) {
                    
                    let file = indication["reference"]["file"];
                    file ? file = file.split("/").pop() : file = "";

                    document.getElementById("main_reference_url").innerHTML = indication["reference"]["url"];
                    document.getElementById("main_reference_url").href = indication["reference"]["url"];
                    document.getElementById("main_reference_description").innerHTML = indication["reference"]["desc"];
                    document.getElementById("main_reference_file").innerHTML = file;
                    document.getElementById("main_reference_file").href = indication["reference"]["file"];

                    document.getElementById("main_reference-url-").value = indication["reference"]["url"];
                    document.getElementById("main_reference-desc-").value = indication["reference"]["desc"];
                    if (file) {
                        let link = document.createElement("a");
                        link.target = "_blank";
                        link.href = indication["reference"]["file"];
                        link.innerText = "Fichier actuel:" + file;
                        link.classList.add("text-xs");
                        let br = document.createElement("br");
                        document.getElementById("main_reference-ref-").appendChild(br);
                        document.getElementById("main_reference-ref-").appendChild(link);

                        let link_delete = document.createElement("a");
                        link_delete.innerText = "Supprimer";
                        link_delete.classList.add("text-xs");
                        link_delete.classList.add("m-2");
                        link_delete.classList.add("cursor-pointer");
                        link_delete.classList.add("text-red-500");
                        link_delete.addEventListener("click", () => {
                            link.remove();
                            link_delete.remove();

                        });
                        document.getElementById("main_reference-ref-").appendChild(link_delete);
                    }
                }
            });
        }

    });

    fetch_api("comment", `indication=${window.location.href.split("/")[4]}`).then(comments => {
        comments = comments["results"];
        comments.forEach(comment => {
            create_comment(comment["user"], comment["body"], comment["created_on"], comment["reply_to"], comment["id"]);
        })
    }).then(() => {
        const replies = document.querySelectorAll('[id^="reply-"]');

        for (let i = 0; i < replies.length; i++) {
            replies[i].addEventListener("click", () => {
                commentarea.scrollIntoView({ block: 'center' })
                commentarea.focus();
                commentarea.select();
                isreply_form.value = replies[i].id.split("-")[1];
                replying.hidden = false;
                let user = document.getElementById("user-" + replies[i].id.split("-")[1]);
                let date = document.getElementById("date-" + replies[i].id.split("-")[1]);
                replying.children[0].innerText = "Répondre à '" + user.innerText + " du " + date.innerText + "'";
            })
        }
    });

});
