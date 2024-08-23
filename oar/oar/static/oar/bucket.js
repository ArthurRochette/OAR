document.addEventListener('DOMContentLoaded', function() {
    const close_bucket = document.getElementById("close_bucket");
    const bucket = document.getElementById("bucket");
    const my_bucket = document.getElementById("my_bucket");
    let bucket_array_header = document.getElementById("bucket_array_header");
    const remove_all = document.getElementById("remove_all");
    const dropzone = document.getElementById("dropzone");
    const mainTable = document.getElementById("mainTable");

    const toggle_bucket = (() => {
        bucket.classList.toggle("translate-x-full")
    });
    const show_bucket = (() => {
        bucket.classList.remove("translate-x-full")
    });
    function handleDragStart(e) {
        console.log("satart")
        e.dataTransfer.setData('text', e.target.id);
        show_bucket();
        this.style.opacity = '0.4';
    }

    function handleDragEnd() {
        this.style.opacity = '1';
    }

    function handleDrop(e) {
        e.preventDefault();
        let id = e.dataTransfer.getData('text');
        let draggableElement = document.getElementById(id).cloneNode(true);
        if (draggableElement.style.opacity === '0.4') {
            draggableElement.children[0].remove();
            let dump = draggableElement.children[draggableElement.children.length - 1].children[0];
            dump.children[dump.children.length - 1].remove();
            dump.children[dump.children.length - 1].remove();
            draggableElement.style.opacity = '1';
        }

        dropzone.appendChild(draggableElement);

        const no_indication = document.getElementById("no_indication");
        if (no_indication) {
            no_indication.remove();
        }
        if (bucket_array_header.classList.contains("hidden")) {
            bucket_array_header.classList.remove("hidden");
        }
    }

    function handleDragOver(e) {
        e.preventDefault(); // Necessary. Allows us to drop.
        return false;
    }

    function handleDragLeave() {
        dropzone.style = 'border: 1px solid #f3f4f6';
    }

    function add_event_listener_to_rows(){
        let rows = mainTable.getElementsByTagName("tr");
        for (let i = 1; i < rows.length; i++) {
            rows[i].addEventListener('dragstart', handleDragStart);
            rows[i].addEventListener('dragend', handleDragEnd);
        }
    }

    close_bucket.addEventListener("click", toggle_bucket);
    my_bucket.addEventListener("click", toggle_bucket);
    remove_all.addEventListener("click", () => {
        if (!bucket_array_header.classList.contains("hidden")) {
            bucket_array_header.classList.add("hidden");
        }
        let child_count = dropzone.children.length;
        for (let i = 1; i < child_count; i++) {
            dropzone.lastChild.remove();
        }
        dropzone.innerHTML += "<p id='no_indication' class='text-center text-gray-500'>Glissez et déposez vos indications ici</p>";
        bucket_array_header = document.getElementById("bucket_array_header");
    });
    bucket.addEventListener('drop', handleDrop);
    bucket.addEventListener('dragover', handleDragOver);
    bucket.addEventListener('dragleave', handleDragLeave);
    mainTable.addEventListener('updated', add_event_listener_to_rows);
});