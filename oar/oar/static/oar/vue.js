document.addEventListener("DOMContentLoaded", function () {
    const csrfToken = document.getElementsByName("csrfmiddlewaretoken")[0].value;
    const modal_vues = document.getElementById("modal_vues");
    const add_vue = document.getElementById("add_vue");
    const vues_table = document.getElementById('vues_table');
    const location_selectors = document.getElementsByName("location");
    const organ_selectors = document.getElementsByName("organ");
    const fraction_selectors = document.getElementsByName("fraction");
    const patient_selectors = document.getElementsByName("patient");
    const my_vues = document.getElementById("my_vues");
    const overlay = document.getElementById("overlay")


    const fetch_api = (async (what, conditions) => {
        /**
         * Fetch the api with the given conditions
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
    const update_vues = (() => {
        /**
         * Update the vues table
         */
        fetch_api("vue").then((vues) => {
            if (vues.results.length > 0) {
                vues_table.innerHTML = "";
            }
            vues.results.forEach((vue) => {
                let row = document.createElement("tr");
                row.classList.add("cursor-pointer", "hover:bg-slate-100", "w-full", "overflow-hidden");
                row.addEventListener("click", () => {
                    location_selectors[0].value = vue.location == null ? "Localisation" : vue.location;
                    organ_selectors[0].value = vue.organ == null ? "Organe" : vue.organ;
                    fraction_selectors[0].value = vue.fraction == null ? "Fraction" : (vue.fraction.number == null ? vue.fraction.special : vue.fraction.number);
                    patient_selectors[0].value = vue.patient;
                    toggle_vues();
                    document.getElementById("mainTable").dispatchEvent(new CustomEvent("need_filter"))
                });

                let location = vue.location;
                let organ = vue.organ;
                let fraction = vue.fraction ? (vue.fraction.number == "" ? vue.fraction.special : vue.fraction.number) : "";
                let patient = vue.patient;

                if (vue.location === null) location = "";
                if (vue.organ === null) organ = "";
                if (vue.fraction === null) fraction = "";
                if (vue.patient === null) patient = "";

                row.innerHTML = `<td class="border-y border-slate-300 p-2.5 text-center">${location}</td>
                <td class="border-y border-slate-300 p-2.5 text-center">${organ}</td>
                <td class="border-y border-slate-300 p-2.5 text-center">${fraction}</td>
                <td class="border-y border-slate-300 p-2.5 text-center">${patient}</td>
                <td> 
                    <img src="/static/logo/delete.png" class="w-4 h-4 m-auto" id="delete_vue-${vue.id}">
                </td>
                `;

                vues_table.appendChild(row);

                document.getElementById(`delete_vue-${vue.id}`).addEventListener("click", (event) => {
                    event.preventDefault();
                    axios.delete(`/api/vue/${vue.id}/`, {
                        headers: {
                            'X-CSRFToken': csrfToken
                        }
                    }).then(() => {
                        update_vues();
                    });

                });

            });
        });

    })
    const add_vue_ = (async (e) => {
        /**
         * Add a vue to user vue
         */
        e.preventDefault();
        axios.post(`/api/vue/`, {
            'location': location_selectors[0].value != "Localisation" ? location_selectors[0].value : "",
            'organ': organ_selectors[0].value != "Organe" ? organ_selectors[0].value : "",
            'fraction': fraction_selectors[0].value != "Fraction" ? fraction_selectors[0].value : "",
            'patient': patient_selectors[0].value
        }, {
            headers: {
                'Content-type': 'application/json',
                'X-CSRFToken': csrfToken
            }
        }).then(() => {
            update_vues();
        })
    });
    const toggle_vues = (() => {
        /**
         * Toggle the vues modal
         */
        overlay.classList.toggle("invisible");
        modal_vues.classList.toggle("translate-x-full");
    });


    add_vue.addEventListener('click', add_vue_);
    my_vues.addEventListener('click', toggle_vues)
    update_vues();
});
