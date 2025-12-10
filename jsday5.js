// GLOBAL VARS
let uploadedFileBase64 = null;
let uploadedFileName = null;
const STORAGE_KEY = "projectPortfolio";
const projectGrid = document.getElementById("project-grid");

// UTIL: load/save
function loadProjects() {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
}

function saveProjects(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

// CALCULATE DURATION
function getDuration(start, end){
    if(!start || !end) return "Duration unknown";
    const s = new Date(start), e = new Date(end);
    const diff = e-s;
    if(diff<0) return "Invalid dates";
    const days = Math.floor(diff/1000/60/60/24);
    
    // Menghitung bulan dengan pembagian, kemudian sisa hari
    const months = Math.floor(days/30.437); // Rata-rata hari per bulan
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

// RENDER PROJECTS
function renderProjects(projects){
    projectGrid.innerHTML="";
    if(projects.length===0){
        projectGrid.innerHTML="<p style='text-align: center; margin-top: 20px;'>No projects yet. Add one using the form above!</p>";
        return;
    }
    
    // Simpan proyek ke Local Storage sebelum render (untuk sorting/filtering)
    saveProjects(projects); 

    projects.forEach((p,index)=>{
        let fileHTML="";
        // ... (File HTML generation remains the same)
        if(p.fileBase64){
            if(p.fileBase64.startsWith("data:image")){
                fileHTML=`<img src="${p.fileBase64}">`;
            } else if(p.fileBase64.startsWith("data:application/pdf")){
                fileHTML=`<div class="file-preview"><i class="fas fa-file-pdf"></i><p>${p.fileName}</p></div>`;
            } else {
                fileHTML=`<div class="file-preview"><i class="fas fa-file-alt"></i><p>${p.fileName}</p></div>`; // Mengganti word icon
            }
        } else {
            fileHTML=`<img src="https://picsum.photos/250/150?random=${index+10}" alt="Project Placeholder Image">`;
        }

        const card = document.createElement("div");
        card.classList.add("project-card");
        
        // Simpan index project di data attribute
        card.dataset.projectIndex = index; 

        card.innerHTML=`
            ${fileHTML}
            <div class="project-content">
                <h3 class="project-title-link">${p.name}</h3>
                <p>Duration: ${getDuration(p.startDate,p.endDate)}</p>
                <p>${p.description.substring(0,100)}...</p>
                <div class="project-actions">
                    <button class="edit">Edit</button>
                    <button class="delete">Delete</button>
                    <button class="detail">Detail</button>
                </div>
            </div>
        `;
        
        // **Fungsi Edit, Delete, dan Detail tetap sama**
        // EDIT
        card.querySelector(".edit").onclick=()=>{
            document.getElementById("project-name").value=p.name;
            document.getElementById("start-date").value=p.startDate;
            document.getElementById("end-date").value=p.endDate;
            document.getElementById("description").value=p.description;
            ["node-js","next-js","react-js","typescript"].forEach(id=>{
                document.getElementById(id).checked=p.technologies.includes(id);
            });
            uploadedFileBase64=p.fileBase64;
            uploadedFileName=p.fileName;
            document.getElementById("file-name").textContent=uploadedFileName || "No file chosen";
            projectGrid.dataset.editIndex=index;
            // Scroll ke form setelah edit diklik
            document.querySelector(".form-section").scrollIntoView({ behavior: 'smooth' });
        };
        // DELETE
        card.querySelector(".delete").onclick=()=>{
            if(confirm(`Are you sure you want to delete project: ${p.name}?`)){
                let arr=loadProjects();
                arr.splice(index,1);
                saveProjects(arr);
                renderProjects(loadProjects()); // Muat ulang dari storage
            }
        };
        // DETAIL POPUP (Aksi tombol 'Detail' tetap menggunakan popup)
        card.querySelector(".detail").onclick=()=>{
            const popup=document.getElementById("popup-detail");
            document.getElementById("popup-title").textContent=p.name;
            document.getElementById("popup-duration").textContent="Duration: "+getDuration(p.startDate,p.endDate);
            document.getElementById("popup-description").textContent=p.description;
            document.getElementById("popup-tech").textContent="Technologies: "+p.technologies.map(t => t.replace('-', '.').toUpperCase()).join(", ");

            const popupFile=document.getElementById("popup-file");
            const download=document.getElementById("popup-download");
            popupFile.innerHTML="";
            download.style.display="none";

            if(p.fileBase64){
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
        };
        
        // **Aksi Klik Judul Proyek (New Requirement)**
        card.querySelector(".project-title-link").onclick = () => {
            // Simpan index proyek yang diklik ke Local Storage agar bisa diambil di halaman detail
            localStorage.setItem("currentProjectIndex", index);
            window.location.href="detailday5.html";
        };

        projectGrid.appendChild(card);
    });
}

// FILE UPLOAD
const fileInput=document.getElementById("file-input");
document.getElementById("choose-file").onclick=()=>fileInput.click();
fileInput.onchange=()=> {
    const file=fileInput.files[0];
    if(file){
        uploadedFileName=file.name;
        document.getElementById("file-name").textContent=file.name;
        const reader=new FileReader();
        reader.onload=(e)=>uploadedFileBase64=e.target.result;
        reader.readAsDataURL(file);
    } else {
        uploadedFileName=null;
        uploadedFileBase64=null;
        document.getElementById("file-name").textContent="No file chosen";
    }
};

// FORM SUBMIT
document.getElementById("project-form").onsubmit=(e)=>{
    e.preventDefault();
    const name=document.getElementById("project-name").value.trim();
    if(!name){alert("Project name required"); return;}
    const start=document.getElementById("start-date").value;
    const end=document.getElementById("end-date").value;
    const desc=document.getElementById("description").value;
    const techs=Array.from(document.querySelectorAll(".technologies-group input:checked")).map(cb=>cb.id);
    let arr=loadProjects();
    const editIndex=projectGrid.dataset.editIndex;
    
    // Tambahkan file info
    const newProj={
        name,
        startDate:start,
        endDate:end,
        description:desc,
        technologies:techs,
        fileBase64:uploadedFileBase64,
        fileName:uploadedFileName
    };
    
    if(editIndex!==undefined && arr[editIndex]){
        // Mode Edit
        arr[editIndex]=newProj;
        delete projectGrid.dataset.editIndex;
    } else {
        // Mode Add
        arr.push(newProj);
    }
    
    saveProjects(arr);
    renderProjects(loadProjects()); // Render ulang dari data yang tersimpan
    
    // Reset form dan state
    e.target.reset();
    uploadedFileBase64=null;
    uploadedFileName=null;
    document.getElementById("file-name").textContent="No file chosen";
};

// POPUP CLOSE
document.querySelector(".close-popup").onclick=()=>document.getElementById("popup-detail").classList.add("hidden");

// INITIAL LOAD
document.addEventListener("DOMContentLoaded",()=>renderProjects(loadProjects()));

// DARK MODE TOGGLE
document.getElementById("toggle-dark").onclick=()=>document.body.classList.toggle("dark");

// SWITCH VIEW
document.getElementById("switch-view").onclick=()=>{
    projectGrid.classList.toggle("horizontal");
    projectGrid.classList.toggle("vertical");
    document.getElementById("switch-view").textContent = projectGrid.classList.contains("horizontal") ? "Switch View" : "Switch View"; // Bisa diubah teksnya jika perlu
};

// SORT
document.getElementById("sort-projects").onchange=()=>{
    let arr=loadProjects();
    const val=document.getElementById("sort-projects").value;
    
    if(val==="newest") arr.sort((a,b)=>new Date(b.startDate||0)-new Date(a.startDate||0)); 
    else if(val==="oldest") arr.sort((a,b)=>new Date(a.startDate||0)-new Date(b.startDate||0));
    else if(val==="a-z") arr.sort((a,b)=>a.name.localeCompare(b.name));
    else if(val==="z-a") arr.sort((a,b)=>b.name.localeCompare(a.name));
    
    renderProjects(arr);
};

// FILTER
document.getElementById("filter-tech").onchange=()=>{
    const tech=document.getElementById("filter-tech").value;
    let arr=loadProjects();
    
    if(tech!=="all") arr=arr.filter(p=>p.technologies && p.technologies.includes(tech));
    
    renderProjects(arr);
};

// **Bagian jQuery yang sudah tidak diperlukan karena sudah dipindahkan ke event listener di fungsi renderProjects**
/*
$(".project-content").on("click", "#direct", function(){
    const projectName=$(this).text();
    window.location.href="detailday5.html";
})
*/