// Firebase 配置
// For Firebase JS SDK v7.20.0 and later, measurementld is optional
// ... (其他現有的 const 變數) ...

const navAbout = document.querySelector('a[href="#about"]');
const navContact = document.querySelector('a[href="#contact"]');
const backFromAboutBtn = document.getElementById('backFromAboutBtn');
const backFromContactBtn = document.getElementById('backFromContactBtn');


const firebaseConfig = {
    apiKey: "AIzaSyCIWSLwyUCEkKGz4bne2leVHIbm7EFpObg",
    authDomain: "yuuu-52269.firebaseapp.com",
    databaseURL: "https://yuuu-52269-default-rtdb.firebaseio.com",
    projectId: "yuuu-52269",
    // storageBucket: "yuuu-52269.appspot.com", // <-- 移除了 storageBucket 設定
    messagingSenderId: "208020331487",
    appId: "1:208020331487:web:dc207529c8378a5c9d826a",
    measurementId: "G-PDS03JGPRR"
};


// 初始化 Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
// const storage = firebase.storage(); // <-- 移除了 Firebase Storage 的初始化


// 頁面元素獲取
const homePage = document.getElementById('homePage');
const animalDetailPage = document.getElementById('animalDetailPage');
const applyFormPage = document.getElementById('applyFormPage');
const uploadAnimalPage = document.getElementById('uploadAnimalPage');

const homeLink = document.getElementById('homeLink');
const navHome = document.getElementById('navHome');
const navUploadAnimal = document.getElementById('navUploadAnimal');

const animalListElement = document.getElementById('animalList');
const searchInput = document.getElementById('searchInput');
const speciesFilter = document.getElementById('speciesFilter');
const ageFilter = document.getElementById('ageFilter');
const genderFilter = document.getElementById('genderFilter');
const searchButton = document.getElementById('searchButton');

const animalDetailContent = document.getElementById('animalDetailContent');
const adoptionForm = document.getElementById('adoptionForm');
const animalIdInput = document.getElementById('animalId');
const animalNameInput = document.getElementById('animalName');
const applyFormTitle = document.getElementById('applyFormTitle');
const backToDetailBtn = document.getElementById('backToDetailBtn');

// 上傳動物表單元素 (移除圖片相關元素)
const uploadAnimalForm = document.getElementById('uploadAnimalForm');
// const animalImagesInput = document.getElementById('animalImages'); // 移除
// const imagePreview = document.getElementById('imagePreview'); // 移除
// const progressBarContainer = document.getElementById('progressBarContainer'); // 移除
// const progressBar = document.getElementById('progressBar'); // 移除
const backFromUploadBtn = document.getElementById('backFromUploadBtn');


let currentAnimalId = null; // 用於儲存當前查看的動物ID
let currentAnimalName = null; // 用於儲存當前查看的動物名稱

// --- 頁面切換邏輯 ---
function showPage(pageId, data = null) {
    const sections = document.querySelectorAll('.page-section');
    sections.forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById(pageId).classList.add('active');

    if (pageId === 'animalDetailPage' && data) {
        displayAnimalDetail(data);
    } else if (pageId === 'applyFormPage' && data) {
        setupApplyForm(data.id, data.name);
    } else if (pageId === 'homePage') {
        fetchAnimals(); // 回到首頁時重新載入動物列表
    }
}

// --- 首頁 (動物列表) 邏輯 ---
async function fetchAnimals(searchTerm = '', species = '', ageGroup = '', gender = '') {
    animalListElement.innerHTML = '<p>載入中，請稍候...</p>';
    let query = db.collection('animals').where('isAdopted', '==', false); // 只顯示未被領養的

    if (species) {
        query = query.where('species', '==', species);
    }
    if (gender) {
        query = query.where('gender', '==', gender);
    }

    try {
        const snapshot = await query.get();
        let animals = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // 前端篩選年齡組 (因為Firestore不能直接進行OR查詢或複雜範圍查詢，這裡前端處理)
        if (ageGroup) {
            animals = animals.filter(animal => {
                if (ageGroup === 'young') return animal.age >= 0 && animal.age <= 1;
                if (ageGroup === 'adult') return animal.age > 1 && animal.age <= 7;
                if (ageGroup === 'senior') return animal.age > 7;
                return true;
            });
        }

        // 前端篩選關鍵字
        if (searchTerm) {
            const lowerCaseSearchTerm = searchTerm.toLowerCase();
            animals = animals.filter(animal =>
                animal.name.toLowerCase().includes(lowerCaseSearchTerm) ||
                (animal.description && animal.description.toLowerCase().includes(lowerCaseSearchTerm)) ||
                (animal.breed && animal.breed.toLowerCase().includes(lowerCaseSearchTerm)) ||
                (animal.personality && animal.personality.toLowerCase().includes(lowerCaseSearchTerm))
            );
        }

        displayAnimals(animals);
    } catch (error) {
        console.error("Error fetching animals: ", error);
        animalListElement.innerHTML = '<p>無法載入動物資料，請稍後再試。</p>';
    }
}

function displayAnimals(animals) {
    animalListElement.innerHTML = '';
    if (animals.length === 0) {
        animalListElement.innerHTML = '<p>目前沒有符合條件的動物。</p>';
        return;
    }

    animals.forEach(animal => {
        const card = document.createElement('div');
        card.classList.add('animal-card');

        // 因為不再上傳圖片，這裡統一使用一個預設圖片
        const imageUrl = './images/default-animal.jpg'; // 注意這裡的路徑

        card.innerHTML = `
            <img src="${imageUrl}" alt="${animal.name}">
            <div class="animal-card-content">
                <h3>${animal.name}</h3>
                <p><strong>年齡:</strong> ${animal.age} 歲</p>
                <p><strong>種類:</strong> ${animal.species}</p>
                <button class="btn-detail" data-animal-id="${animal.id}">查看詳情</button>
            </div>
        `;
        animalListElement.appendChild(card);
    });

    // 為所有新生成的 "查看詳情" 按鈕添加事件監聽器
    document.querySelectorAll('.btn-detail').forEach(button => {
        button.addEventListener('click', async (e) => {
            const id = e.target.dataset.animalId;
            try {
                const docRef = db.collection('animals').doc(id);
                const doc = await docRef.get();
                if (doc.exists) {
                    currentAnimalId = doc.id;
                    currentAnimalName = doc.data().name;
                    showPage('animalDetailPage', { id: doc.id, ...doc.data() });
                } else {
                    alert('查無此動物資訊。');
                }
            } catch (error) {
                console.error("Error fetching animal detail: ", error);
                alert('載入動物詳細資訊失敗，請稍後再試。');
            }
        });
    });
}

// 統一處理搜尋和篩選事件
const applyFilters = () => {
    const searchTerm = searchInput.value.trim();
    const selectedSpecies = speciesFilter.value;
    const selectedAgeGroup = ageFilter.value;
    const selectedGender = genderFilter.value;
    fetchAnimals(searchTerm, selectedSpecies, selectedAgeGroup, selectedGender);
};

searchButton.addEventListener('click', applyFilters);
speciesFilter.addEventListener('change', applyFilters);
ageFilter.addEventListener('change', applyFilters);
genderFilter.addEventListener('change', applyFilters);
searchInput.addEventListener('input', applyFilters);

// --- 動物詳細頁面邏輯 ---
function displayAnimalDetail(animal) {
    // 統一使用預設圖片，因為不再有實際圖片上傳
    let imageHtml = `<img src="./images/default-animal.jpg" alt="${animal.name}">`;


    const applyButtonHtml = animal.isAdopted
        ? `<button class="btn-apply adopted" disabled>已領養</button>`
        : `<button class="btn-apply" id="applyBtn" data-animal-id="${animal.id}" data-animal-name="${encodeURIComponent(animal.name)}">送出領養申請</button>`;

    animalDetailContent.innerHTML = `
        <h2>${animal.name}</h2>
        <div class="animal-detail-content">
            <div class="animal-detail-images">
                ${imageHtml}
            </div>
            <div class="animal-info">
                <p><strong>年齡:</strong> ${animal.age} 歲</p>
                <p><strong>種類:</strong> ${animal.species}</p>
                <p><strong>品種:</strong> ${animal.breed || '未提供'}</p>
                <p><strong>性別:</strong> ${animal.gender || '未提供'}</p>
                <p><strong>體型:</strong> ${animal.size || '未提供'}</p>
                <p><strong>健康狀況:</strong> ${animal.healthStatus || '良好'}</p>
                <p><strong>個性描述:</b> ${animal.personality || '溫馴可愛'}</p>
                <div class="description">
                    <h3>詳細介紹</h3>
                    <p>${animal.description || '暫無詳細介紹。'}</p>
                </div>
                ${applyButtonHtml}
            </div>
        </div>
    `;
document.addEventListener('DOMContentLoaded', () => {
    // ... (現有的 fetchAnimals() 和其他導航連結事件) ...

    // 新增 關於我們 和 聯絡我們 導航連結事件
    navAbout.addEventListener('click', (e) => {
        e.preventDefault();
        showPage('about'); // 顯示關於我們區塊
    });

    navContact.addEventListener('click', (e) => {
        e.preventDefault();
        showPage('contact'); // 顯示聯絡我們區塊
    });

    // 新增 返回首頁 按鈕事件 (針對關於我們頁面)
    backFromAboutBtn.addEventListener('click', () => {
        showPage('homePage');
    });

    // 新增 返回首頁 按鈕事件 (針對聯絡我們頁面)
    backFromContactBtn.addEventListener('click', () => {
        showPage('homePage');
    });

    // ... (其他現有的邏輯) ...
});

    // 圖片輪播功能已無必要，因為只有一張預設圖片
    // initImageCarousel();

    // 為領養按鈕添加事件監聽器
    const applyBtn = document.getElementById('applyBtn');
    if (applyBtn && !applyBtn.disabled) {
        applyBtn.addEventListener('click', (e) => {
            const id = e.target.dataset.animalId;
            const name = decodeURIComponent(e.target.dataset.animalName);
            showPage('applyFormPage', { id: id, name: name });
        });
    }
}

// 圖片輪播功能 (已移除，因為不再有圖片上傳)
// function initImageCarousel() {
//     const images = document.querySelectorAll('.carousel-image');
//     const prevBtn = document.querySelector('.carousel-control.prev');
//     const nextBtn = document.querySelector('.carousel-control.next');
//     let currentIndex = 0;

//     function showImage(index) {
//         images.forEach((img, i) => {
//             img.classList.remove('active');
//             if (i === index) {
//                 img.classList.add('active');
//             }
//         });
//     }

//     if (prevBtn) {
//         prevBtn.addEventListener('click', () => {
//             currentIndex = (currentIndex - 1 + images.length) % images.length;
//             showImage(currentIndex);
//         });
//     }

//     if (nextBtn) {
//         nextIndex = (currentIndex + 1) % images.length;
//         showImage(currentIndex);
//     });
// }

// --- 領養申請表單邏輯 ---
function setupApplyForm(animalId, animalName) {
    animalIdInput.value = animalId;
    animalNameInput.value = animalName;
    applyFormTitle.textContent = `領養申請表 - ${animalName}`;
}

adoptionForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const applicantName = document.getElementById('applicantName').value;
    const phone = document.getElementById('phone').value;
    const email = document.getElementById('email').value;
    const address = document.getElementById('address').value;
    const experience = document.getElementById('experience').value;
    const motivation = document.getElementById('motivation').value;
    const notes = document.getElementById('notes').value;

    if (!applicantName || !phone || !email || !address || !experience || !motivation) {
        alert('請填寫所有必填欄位。');
        return;
    }

    const phonePattern = /^[0-9]{10}$/;
    if (!phonePattern.test(phone)) {
        alert('請輸入有效的10位數字電話號碼。');
        return;
    }

    try {
        await db.collection('applications').add({
            animalId: animalIdInput.value,
            animalName: animalNameInput.value,
            applicantName: applicantName,
            phone: phone,
            email: email,
            address: address,
            experience: experience,
            motivation: motivation,
            notes: notes,
            status: 'pending',
            submittedAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        alert('領養申請已成功送出！我們將盡快與您聯繫。');
        adoptionForm.reset();
        showPage('homePage');
    } catch (error) {
        console.error("Error submitting application: ", error);
        alert('申請提交失敗，請稍後再試。');
    }
});

// 返回動物資訊按鈕 (領養表單)
backToDetailBtn.addEventListener('click', () => {
    if (currentAnimalId) {
        db.collection('animals').doc(currentAnimalId).get().then(doc => {
            if (doc.exists) {
                showPage('animalDetailPage', { id: doc.id, ...doc.data() });
            } else {
                alert('動物資料已不存在，返回首頁。');
                showPage('homePage');
            }
        }).catch(error => {
            console.error("Error fetching animal for back button: ", error);
            alert('載入動物資料失敗，返回首頁。');
            showPage('homePage');
        });
    } else {
        showPage('homePage');
    }
});


// --- 上傳動物資料邏輯 (圖片相關部分已移除) ---
// animalImagesInput.addEventListener('change', (event) => { // 移除此事件監聽器
//     imagePreview.innerHTML = '';
//     progressBarContainer.style.display = 'none';

//     const files = event.target.files;
//     if (files.length === 0) return;

//     Array.from(files).forEach(file => {
//         if (file.type.startsWith('image/')) {
//             const reader = new FileReader();
//             reader.onload = (e) => {
//                 const img = document.createElement('img');
//                 img.src = e.target.result;
//                 imagePreview.appendChild(img);
//             };
//             reader.readAsDataURL(file);
//         }
//     });
// });

uploadAnimalForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('uploadAnimalName').value;
    const age = parseFloat(document.getElementById('uploadAnimalAge').value);
    const species = document.getElementById('uploadAnimalSpecies').value;
    const breed = document.getElementById('uploadAnimalBreed').value;
    const gender = document.getElementById('uploadAnimalGender').value;
    const size = document.getElementById('uploadAnimalSize').value;
    const healthStatus = document.getElementById('uploadAnimalHealthStatus').value;
    const personality = document.getElementById('uploadAnimalPersonality').value;
    const description = document.getElementById('uploadAnimalDescription').value;
    // const files = animalImagesInput.files; // 移除

    if (!name || isNaN(age) || !species || !gender || !personality) {
        alert('請填寫所有必填欄位 (名稱、年齡、種類、性別、個性描述)。');
        return;
    }

    // 移除了對 files.length 的檢查，因為不再上傳圖片
    // if (files.length === 0) {
    //     alert('請至少上傳一張動物圖片。');
    //     return;
    // }

    // const imageUrls = []; // 移除了 imageUrls 陣列
    // progressBarContainer.style.display = 'block'; // 移除了進度條顯示
    // progressBar.style.width = '0%'; // 移除了進度條設定
    // progressBar.textContent = '0%'; // 移除了進度條設定

    try {
        // 移除了圖片上傳的迴圈和邏輯
        // for (let i = 0; i < files.length; i++) {
        //     ... 圖片上傳邏輯 ...
        // }

        // 所有圖片上傳完成後，儲存動物資料到 Firestore
        await db.collection('animals').add({
            name: name,
            age: age,
            species: species,
            breed: breed || '未提供',
            gender: gender,
            size: size || '未提供',
            healthStatus: healthStatus || '良好',
            personality: personality,
            description: description || '暫無詳細介紹。',
            imageUrls: [], // 將 imageUrls 設為空陣列，因為不再上傳圖片
            isAdopted: false, // 預設為未領養
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        alert('動物資料已成功上傳！');
        uploadAnimalForm.reset();
        // imagePreview.innerHTML = ''; // 移除了清空預覽
        // progressBarContainer.style.display = 'none'; // 移除了隱藏進度條
        showPage('homePage'); // 導回首頁
    } catch (error) {
        console.error("提交動物資料失敗: ", error);
        alert('提交動物資料失敗，請檢查網路或稍後再試。');
        // progressBarContainer.style.display = 'none'; // 移除了隱度條
    }
});

// 返回首頁按鈕 (上傳表單)
backFromUploadBtn.addEventListener('click', () => {
    showPage('homePage');
    uploadAnimalForm.reset(); // 清空表單
    // imagePreview.innerHTML = ''; // 移除了清空預覽
    // progressBarContainer.style.display = 'none'; // 移除了隱藏進度條
});


// --- 初始載入與導航事件 ---
document.addEventListener('DOMContentLoaded', () => {
    // 初始載入首頁內容
    fetchAnimals();

    // 導航連結事件
    homeLink.addEventListener('click', (e) => {
        e.preventDefault();
        showPage('homePage');
    });
    navHome.addEventListener('click', (e) => {
        e.preventDefault();
        showPage('homePage');
    });
    navUploadAnimal.addEventListener('click', (e) => { // 新增上傳動物連結事件
        e.preventDefault();
        showPage('uploadAnimalPage');
    });

    // 如果頁面是從URL帶參數直接開啟，則處理
    const urlParams = new URLSearchParams(window.location.search);
    const initialAnimalId = urlParams.get('id');

    if (initialAnimalId) {
        db.collection('animals').doc(initialAnimalId).get().then(doc => {
            if (doc.exists) {
                currentAnimalId = doc.id;
                currentAnimalName = doc.data().name;
                showPage('animalDetailPage', { id: doc.id, ...doc.data() });
            } else {
                alert('URL中指定的動物不存在，返回首頁。');
                showPage('homePage');
            }
        }).catch(error => {
            console.error("Error loading animal from URL: ", error);
            alert('載入動物資料失敗，返回首頁。');
            showPage('homePage');
        });
    } else {
        showPage('homePage'); // 預設顯示首頁
    }
});
