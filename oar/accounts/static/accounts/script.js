document.addEventListener("DOMContentLoaded", () => {

    // lets gather form elements
    let submit = document.getElementById("submit");
    let password = document.getElementById("password");
    let login = document.getElementById("login");
    let form_loggin = document.getElementById("form_loggin");

    //set default form state
    submit.disabled = true;
    submit.classList.add("text-gray-500")

    //function to switch between invalid credentials and valid credentials
    let changeState = () => {
        if (password.value !== "" && login.value !== "") {
            submit.disabled = false;
            submit.classList.remove("text-gray-500")
            submit.classList.add("hover:bg-green-400")
            submit.classList.add("cursor-pointer")
        } else {
            submit.disabled = true;
            submit.classList.add("text-gray-500")
            submit.classList.remove("hover:bg-green-400")
            submit.classList.remove("cursor-pointer")
        }
    }

    //add listener for password and login field
    password.addEventListener("keyup", () => {
        changeState()
    })
    login.addEventListener("keyup", () => {
        changeState()
    })
        //for auto completors web browser
    password.addEventListener("change", () => {
        changeState()
    })
    login.addEventListener("change", () => {
        changeState()
    })

    form_loggin.addEventListener("submit", (e) => {
        submit.disabled = true;
        submit.classList.add("text-gray-500")
        submit.classList.remove("hover:bg-green-400")
        submit.classList.remove("cursor-pointer")
    }) 
     


})
