document.addEventListener("DOMContentLoaded", function() {

    const modal_vues = document.getElementById("modal_vues");
    const fetch_api = (async (what, conditions) => {
        if (!conditions) {
            conditions = ""
        }
        // remove if null in condition
        conditions = conditions.split("&").filter((item) => {
            return item.split("=")[1] !== "null"
        }).join("&");

        conditions = conditions.replace("+", "%2B")
        let response = null;
        try{
            response = await axios.get(`/api/${what}?${conditions}`);
        }
        catch (error) {
            console.log(error)
            return null;
        }
        return response.data;
    });

});