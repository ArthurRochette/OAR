
// js file for the objective modal gestion
document.addEventListener("DOMContentLoaded", function () {
    let unit_selector = document.querySelectorAll('[id*="-unit-"]');
    let button_add_objective = document.querySelectorAll('[id*="button_pos_objective-"]');
    let button_remove_objective = document.querySelectorAll('[id*="button_neg_objective-"]');
    let button_add_constraint = document.querySelectorAll('[id*="button_pos_constraint-"]');
    let button_remove_constraint = document.querySelectorAll('[id*="button_neg_constraint-"]');
    const button_remove_reference = document.querySelectorAll('[id*="button_neg_reference-"]');
    const file_delete = document.querySelectorAll('[id*="file_delete-"]');
    const button_add_toxicity = document.querySelectorAll('[id*="button_pos_toxicity-"]');
    const button_remove_toxicity = document.querySelectorAll('[id*="button_neg_toxicity-"]');
    const button_remove_loca_frac = document.querySelectorAll('[id*="button_neg_loca_frac-"]');
    const button_add_loca_frac = document.querySelectorAll('[id*="button_pos_loca_frac-"]');
    const loca_frac_container = document.getElementById("loca_frac_container");
    const comparison_sym_selectors = document.querySelectorAll('[id*="-comparison_sym-"]');

    const clear_node = ((node) => {
        let childs = node.getElementsByTagName('*');

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
            child.value = '';
            child.disabled = false;
        }
        return childs;
    });
    const add_objective = (() => {
        let newLine = document.getElementById("objective_dead-").cloneNode(true);
        let objectives_div = document.getElementById("objectives_div");
        newLine.hidden = false;
        newLine.disabled = false;
        clear_node(newLine);
        newLine.getElementsByTagName("select")[0].addEventListener("change", show_volume);
        objectives_div.appendChild(newLine, document.getElementById("objective_dead-").nextSibling);
    });
    const remove_objective = (() => {
        let objectives_div = document.getElementById("objectives_div");
        if (objectives_div.children.length === 1) return;
        if (objectives_div.lastChild.nodeName === "#text") objectives_div.lastChild.remove();
        objectives_div.lastChild.remove();
    });
    const add_constraint = (() => {
        let newLine = document.getElementById("constraint_dead-").cloneNode(true);
        let constraints_div = document.getElementById("constraints_div");
        newLine.hidden = false;
        newLine.disabled = false;
        newLine.id = 'constraint-' + (constraints_div.children.length - 1);
        clear_node(newLine);
        newLine.getElementsByTagName("select")[0].addEventListener("change", show_volume);
        constraints_div.appendChild(newLine, document.getElementById("constraint_dead-").nextSibling);

    });
    const remove_constraint = (() => {
        let constraints_div = document.getElementById("constraints_div");
        if (constraints_div.children.length === 1) return;
        if (constraints_div.lastChild.nodeName === "#text") constraints_div.lastChild.remove();
        constraints_div.lastChild.remove();
    });
    const add_toxicity = (() => {
        if (document.getElementById("constraints_div").childElementCount === 1) {
            console.log("Il ne peut y avoir de toxicité sans contrainte");
            alert("Il ne peut y avoir de toxicité sans contrainte");
            return;
        } else if (document.getElementById("toxicities_div").childElementCount - 1 === document.getElementById("constraints_div").childElementCount - 1) {
            console.log("Il ne peut y avoir plus de toxicité que de contrainte");
            alert("Il ne peut y avoir plus de toxicité que de contrainte");
            return;
        }

        let newLine = document.getElementById("toxicity_dead-").cloneNode(true);
        let toxicity_div = document.getElementById("toxicities_div");

        newLine.hidden = false;
        newLine.disabled = false;
        clear_node(newLine);
        toxicity_div.appendChild(newLine, document.getElementById("toxicity_dead-").nextSibling);
        let label_constraint = document.querySelectorAll(`[id*="toxicity-intro_constraint-"]`)[0];
        let label_objective = document.querySelectorAll(`[id*="toxicity-intro_objective-"]`)[0];


        let objective_unit = document.querySelectorAll(`[id*="objective-unit-"]`)
        objective_unit = objective_unit[objective_unit.length - 1].options[objective_unit[objective_unit.length - 1].selectedIndex].text;
        let objective_volume = document.querySelectorAll(`[id*="objective-volume-"]`)
        objective_volume = objective_volume[objective_volume.length - 1].value;
        let objective_comparison_sym = document.querySelectorAll(`[id*="objective-comparison_sym-"]`)
        objective_comparison_sym = objective_comparison_sym[objective_comparison_sym.length - 1].options[objective_comparison_sym[objective_comparison_sym.length - 1].selectedIndex].text;
        let objective_value = document.querySelectorAll(`[id*="objective-value-"]`)
        objective_value = objective_value[objective_value.length - 1].value;

        label_objective.innerText = "Objectif: " + "\t" + objective_unit + objective_volume + " " + objective_comparison_sym + " " + objective_value;

        //same for constraint7
        let constraint_unit = document.querySelectorAll(`[id*="constraint-unit-"]`)
        constraint_unit = constraint_unit[constraint_unit.length - 1].options[constraint_unit[constraint_unit.length - 1].selectedIndex].text;
        let constraint_volume = document.querySelectorAll(`[id*="constraint-volume-"]`)
        constraint_volume = constraint_volume[constraint_volume.length - 1].value;
        let constraint_comparison_sym = document.querySelectorAll(`[id*="constraint-comparison_sym-"]`)
        constraint_comparison_sym = constraint_comparison_sym[constraint_comparison_sym.length - 1].options[constraint_comparison_sym[constraint_comparison_sym.length - 1].selectedIndex].text;
        let constraint_value = document.querySelectorAll(`[id*="constraint-value-"]`)
        constraint_value = constraint_value[constraint_value.length - 1].value;


        label_constraint.innerText = "Contrainte: " + "\t" + constraint_unit + constraint_volume + " " + constraint_comparison_sym + " " + constraint_value;

    });
    const remove_toxicity = (() => {
        if (document.getElementById("toxicities_div").childElementCount === 1) return;
        let toxicity_div = document.getElementById("toxicities_div");
        if (toxicity_div.lastChild.nodeName === "#text") toxicity_div.lastChild.remove();
        toxicity_div.lastChild.remove();
    });
    const remove_reference = (async (e) => {
        let id = e.target.id.substring(e.target.id.lastIndexOf("-") + 1, e.target.id.length)
        //make a del request to remove the reference
        let csrfToken = document.getElementsByName("csrfmiddlewaretoken")[0].value;
        await fetch(window.location, {
            method: 'DELETE', headers: {
                'Content-type': 'application/json', 'X-CSRFToken': csrfToken
            }, body: JSON.stringify({
                "ACTION": "DELETE_REFERENCE", "ID": id
            })
        })
        window.location.reload()
    });
    const is_connected = (() => {
        return (!!document.getElementById("username"))
    });
    const show_volume = ((event) => {
        /**
         * Show the objective in function of the unit (style)
         */
        let volume = event.target.options[event.target.selectedIndex]

        let formater = volume.getAttribute("formater");

        let children = volume.parentElement.parentElement.children;


        // delete all label
        for (let i = 0; i < children.length; i++) {
            if (children[i].nodeName === "LABEL") {
                children[i].remove();
                i--;
            }
        }

        if (volume.getAttribute("hide_volume") === "true") {
            children[1].style.display = "none";
        } else {
            children[1].style.display = "inline-block";
        }

        // find the index of volume in children
        let index = Array.from(children).indexOf(volume.parentElement);
        let parentElement = volume.parentElement.parentElement;
        console.log(formater)
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
    const delete_file = (async (e) => {
        let type = e.target.id.split("-")[0];
        let id = e.target.id.split("-")[3];
        let file = document.getElementsByName(type + "-file-" + id)[0].value;
        let csrfToken = document.getElementsByName("csrfmiddlewaretoken")[0].value;
        await fetch(window.location, {
            method: 'DELETE',
            headers: {
                'Content-type': 'application/json',
                'X-CSRFToken': csrfToken
            },
            body: JSON.stringify({
                "ACTION": "DELETE_FILE",
                "TYPE": type,
                "FILE": file,
            })
        });
        window.location.reload()
    });
    const remove_loca_frac = (() => {
        // query select all id starting with loca_frac then any number 
        let loca_fracs = document.querySelectorAll('[id^="loca_frac-"]');
        if (loca_fracs.length === 0) return;
        loca_fracs[loca_fracs.length - 1].remove();
    });
    const add_loca_frac = (() => {
        let loca_fracs = document.querySelectorAll('[id^="loca_frac"]');
        let new_loca_frac = loca_fracs[loca_fracs.length - 1].cloneNode(true);
        new_loca_frac.id = "loca_frac-" + (loca_fracs.length - 1);
        // reset all selects 
        let selects = new_loca_frac.getElementsByTagName("select");
        for (let i = 0; i < selects.length; i++) {
            selects[i].selectedIndex = 0;
            selects[i].id = selects[i].id.split("-")[0] + "-" + (loca_fracs.length);
        }
        loca_frac_container.appendChild(new_loca_frac, document.getElementById("loca_frac").nextSibling);

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

    for (let i = 0; i < button_remove_reference.length; i++) {
        button_remove_reference[i].addEventListener("click", remove_reference);
    }

    if (is_connected()) {
        button_add_objective.forEach((button) => {
            button.addEventListener("click", add_objective);
        });
        button_remove_objective.forEach((button) => {
            button.addEventListener("click", remove_objective);
        });
        button_add_constraint.forEach((button) => {
            button.addEventListener("click", add_constraint);
        });
        button_remove_constraint.forEach((button) => {
            button.addEventListener("click", remove_constraint);
        });
        button_add_toxicity.forEach((button) => {
            button.addEventListener("click", add_toxicity);
        });
        button_remove_toxicity.forEach((button) => {
            button.addEventListener("click", remove_toxicity);
        });
        file_delete.forEach((button) => {
            button.addEventListener("click", delete_file);
        });
        button_add_toxicity.forEach((button) => {
            button.addEventListener("click", add_toxicity);
        });
        button_remove_loca_frac.forEach((button) => {
            button.addEventListener("click", remove_loca_frac);
        });
        button_add_loca_frac.forEach((button) => {
            button.addEventListener("click", add_loca_frac);
        });

        fetch_api("comparison%20symbols").then((data) => {
            data.results.forEach((item) => {
                comparison_sym_selectors.forEach((selector) => {
                    let option = document.createElement("option");
                    option.value = item.id;
                    option.text = item.name;
                    selector.appendChild(option);
                });
            });
        });
        fetch_api("unit").then((data) => {
            data.results.forEach((item) => {
                unit_selector.forEach((selector) => {
                    let option = document.createElement("option");
                    option.value = item.id;
                    option.text = item.name;
                    option.setAttribute("formater", item.volume_formater);
                    option.setAttribute("hide_volume", item.hide_volume);
                    selector.appendChild(option);
                    selector.addEventListener("change", show_volume);
                });
            });
        })
    }
});
