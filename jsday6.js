// GLOBAL VARS
let uploadedFileBase64 = null; // Menyimpan file yang diunggah dalam format Base64
let uploadedFileName = null;   // Menyimpan nama file yang diunggah
const STORAGE_KEY = "projectPortfolio"; // Kunci Local Storage untuk data di browser
const projectGrid = document.getElementById("project-grid"); // Elemen DOM utama untuk menampilkan daftar proyek

// UTIL: load/save
// Memuat data proyek dari Local Storage (Mengembalikan array kosong jika belum ada data)
function loadProjects() {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
}

// Menyimpan data proyek ke Local Storage setelah modifikasi
function saveProjects(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

// CALCULATE DURATION
// Menghitung durasi antara tanggal mulai dan tanggal akhir
function getDuration(start, end){
    if(!start || !end) return "Duration unknown";
    const s = new Date(start), e = new Date(end);
    const diff = e-s;
    if(diff<0) return "Invalid dates";
    const days = Math.floor(diff/1000/60/60/24);
    
    // Perhitungan durasi (bulan dan hari) yang lebih akurat
    const months = Math.floor(days/30.437); 
    const remainingDays = Math.floor(days - months * 30.437); 
    
    let durationString = "";
    if (months > 0) {
        durationString += `${months} month(s)`;
    }
    if (remainingDays > 0) {
        if (months > 0) durationString += " ";
        durationString += `${remainingDays} day(s)`;
    }
    
    return durationString.trim() || `${days} day(s)`;
}

/**
 * Merender daftar proyek ke DOM. Menggunakan Array.prototype.map() 
 * untuk menghasilkan string HTML dari setiap card, lalu InnerHTML.
 * @param {Array<Object>} projects - Array objek proyek yang akan ditampilkan.
 */
function renderProjects(projects){
    projectGrid.innerHTML=""; // Bersihkan grid sebelum render
    if(projects.length===0){
        projectGrid.innerHTML="<p style='text-align: center; margin-top: 20px;'>No projects yet. Add one using the form above!</p>";
        return;
    }
    
    // Gunakan map untuk menghasilkan array string HTML untuk setiap card
    const projectCardsHTML = projects.map((p, index) => {
        let fileHTML = "";
        // Tentukan tampilan preview file berdasarkan tipe (gambar/pdf/dokumen)
        if (p.fileBase64) {
            if (p.fileBase64.startsWith("data:image")) {
                fileHTML = `<img src="${p.fileBase64}" alt="Project Image">`;
            } else if (p.fileBase64.startsWith("data:application/pdf")) {
                fileHTML = `<div class="file-preview"><i class="fas fa-file-pdf"></i><p>${p.fileName}</p></div>`;
            } else {
                fileHTML = `<div class="file-preview"><i class="fas fa-file-alt"></i><p>${p.fileName}</p></div>`;
            }
        } else {
            // Placeholder jika tidak ada file
            fileHTML = `<img src="https://picsum.photos/250/150?random=${index + 10}" alt="Project Placeholder Image">`;
        }

        // Template string untuk card. data-project-index dan data-action 
        // digunakan untuk Event Delegation.
        return `
            <div class="project-card" data-project-index="${index}">
                ${fileHTML}
                <div class="project-content">
                    <h3 class="project-title-link" data-action="detail-link">${p.name}</h3>
                    <p>Duration: ${getDuration(p.startDate, p.endDate)}</p>
                    <p>${p.description.substring(0, 100)}...</p>
                    <div class="project-actions">
                        <button class="edit" data-action="edit">Edit</button>
                        <button class="delete" data-action="delete">Delete</button>
                        <button class="detail" data-action="popup-detail">Detail</button>
                    </div>
                </div>
            </div>
        `;
    }).join(''); // Gabungkan array string menjadi satu string HTML besar

    // Render semua card sekaligus
    projectGrid.innerHTML = projectCardsHTML;
}


/**
 * Callback function untuk menangani semua klik aksi pada daftar proyek (Event Delegation).
 * Aksi diidentifikasi melalui atribut data-action pada elemen yang diklik.
 * @param {Event} e - Objek event klik.
 */
function handleProjectActions(e) {
    e.preventDefault();
    const target = e.target;
    const card = target.closest(".project-card");

    const action = target.dataset.action;
    if (!card || !action) return; 

    const index = parseInt(card.dataset.projectIndex);
    const projects = loadProjects();
    const p = projects[index];
    if (!p) return;

    if (action === "detail-link") {
        // Aksi 1: Klik Judul (Redirect ke halaman detail)
        localStorage.setItem("currentProjectIndex", index);
        window.location.href = "detailday6.html";

    } else if (action === "edit") {
        // Aksi 2: Edit
        // Mengisi form
        document.getElementById("project-name").value=p.name;
        document.getElementById("start-date").value=p.startDate;
        document.getElementById("end-date").value=p.endDate;
        document.getElementById("description").value=p.description;
        // Menggunakan forEach sebagai callback untuk mengatur checkbox
        ["node-js","next-js","react-js","typescript"].forEach(id=>{
            document.getElementById(id).checked=p.technologies.includes(id);
        });
        uploadedFileBase64=p.fileBase64;
        uploadedFileName=p.fileName;
        document.getElementById("file-name").textContent=uploadedFileName || "No file chosen";
        projectGrid.dataset.editIndex=index; // Tandai proyek yang sedang diedit
        document.querySelector(".form-section").scrollIntoView({ behavior: 'smooth' });

    } else if (action === "delete") {
        // Aksi 3: Delete
        if(confirm(`Are you sure you want to delete project: ${p.name}?`)){
            let arr=loadProjects();
            arr.splice(index,1); // Hapus proyek
            saveProjects(arr);
            renderProjects(loadProjects()); // Render ulang
        }

    } else if (action === "popup-detail") {
        // Aksi 4: Detail (Menampilkan Popup)
        const popup=document.getElementById("popup-detail");
        // Mengisi detail popup
        document.getElementById("popup-title").textContent=p.name;
        document.getElementById("popup-duration").textContent="Duration: "+getDuration(p.startDate,p.endDate);
        // Menggunakan map() dan join() untuk menampilkan daftar teknologi dengan format yang baik
        document.getElementById("popup-tech").textContent="Technologies: "+p.technologies.map(t => t.replace('-', '.').toUpperCase()).join(", ");
        document.getElementById("popup-description").textContent=p.description;

        const popupFile=document.getElementById("popup-file");
        const download=document.getElementById("popup-download");
        popupFile.innerHTML="";
        download.style.display="none";

        if(p.fileBase64){
            // Tampilkan file preview di popup
            if(p.fileBase64.startsWith("data:image")){
                popupFile.innerHTML=`<img src="${p.fileBase64}" alt="${p.fileName}">`;
            } else if(p.fileBase64.startsWith("data:application/pdf")){
                popupFile.innerHTML=`<iframe src="${p.fileBase64}" style="width:100%;height:300px;"></iframe>`;
            } else {
                popupFile.innerHTML=`<div><i class="fas fa-file-alt" style="font-size: 50px;"></i><p>${p.fileName}</p></div>`;
            }
            download.href=p.fileBase64;
            download.download=p.fileName;
            download.style.display="inline-block";
        } else {
            popupFile.innerHTML=`<p>No file attached.</p>`;
        }
        popup.classList.remove("hidden");
    }
}


// FILE UPLOAD HANDLER
const fileInput=document.getElementById("file-input");
document.getElementById("choose-file").onclick=()=>fileInput.click();
fileInput.onchange=()=> {
    const file=fileInput.files[0];
    if(file){
        uploadedFileName=file.name;
        document.getElementById("file-name").textContent=file.name;
        const reader=new FileReader();
        // Callback saat file selesai dibaca
        reader.onload=(e)=>uploadedFileBase64=e.target.result;
        reader.readAsDataURL(file); // Konversi file ke Base64
    } else {
        uploadedFileName=null;
        uploadedFileBase64=null;
        document.getElementById("file-name").textContent="No file chosen";
    }
};

// FORM SUBMIT HANDLER
document.getElementById("project-form").onsubmit=(e)=>{
    e.preventDefault();
    // Ambil data form
    const name=document.getElementById("project-name").value.trim();
    if(!name){alert("Project name required"); return;}
    const start=document.getElementById("start-date").value;
    const end=document.getElementById("end-date").value;
    const desc=document.getElementById("description").value;
    // Menggunakan Array.from dan map sebagai callback untuk mendapatkan ID teknologi
    const techs=Array.from(document.querySelectorAll(".technologies-group input:checked")).map(cb=>cb.id);
    let arr=loadProjects();
    const editIndex=projectGrid.dataset.editIndex;
    
    // Objek Proyek Baru
    const newProj={
        name,
        startDate:start,
        endDate:end,
        description:desc,
        technologies:techs,
        fileBase64:uploadedFileBase64,
        fileName:uploadedFileName
    };
    
    // Logika Edit atau Add
    if(editIndex!==undefined && arr[editIndex]){
        arr[editIndex]=newProj; // Update proyek
        delete projectGrid.dataset.editIndex; // Hapus flag edit
    } else {
        arr.push(newProj); // Tambah proyek baru
    }
    
    saveProjects(arr);
    renderProjects(loadProjects());
    
    // Reset form dan state file upload
    e.target.reset();
    uploadedFileBase64=null;
    uploadedFileName=null;
    document.getElementById("file-name").textContent="No file chosen";
};

// POPUP CLOSE HANDLER
document.querySelector(".close-popup").onclick=()=>document.getElementById("popup-detail").classList.add("hidden");

// INITIAL LOAD & Event Delegation Setup
document.addEventListener("DOMContentLoaded",() => {
    // 1. Muat Proyek
    renderProjects(loadProjects());
    // 2. Setup Event Delegation untuk semua aksi proyek (klik pada card)
    projectGrid.addEventListener("click", handleProjectActions);
});

// DARK MODE TOGGLE
document.getElementById("toggle-dark").onclick=()=>document.body.classList.toggle("dark");

// SWITCH VIEW (Horizontal/Vertical)
document.getElementById("switch-view").onclick=()=>{
    projectGrid.classList.toggle("horizontal");
    projectGrid.classList.toggle("vertical");
};

// SORT HANDLER - Menggunakan callback Array.sort()
document.getElementById("sort-projects").onchange=()=>{
    let arr=loadProjects();
    const val=document.getElementById("sort-projects").value;
    
    // Logika Sorting (Menggunakan fungsi callback dalam sort())
    if(val==="newest") arr.sort((a,b)=>new Date(b.startDate||0)-new Date(a.startDate||0)); 
    else if(val==="oldest") arr.sort((a,b)=>new Date(a.startDate||0)-new Date(b.startDate||0));
    else if(val==="a-z") arr.sort((a,b)=>a.name.localeCompare(b.name));
    else if(val==="z-a") arr.sort((a,b)=>b.name.localeCompare(a.name));
    
    renderProjects(arr);
};

// FILTER HANDLER - Menggunakan callback Array.filter()
document.getElementById("filter-tech").onchange=()=>{
    const tech=document.getElementById("filter-tech").value;
    let arr=loadProjects();
    
    // Logika Filtering: Gunakan filter() untuk mendapatkan subset array
    if(tech!=="all") arr=arr.filter(p=>p.technologies && p.technologies.includes(tech));
    
    renderProjects(arr);
};