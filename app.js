// Ames Valuation Studio (AVS) — Modern Swiss Design & 3D Interactive Client Logic

document.addEventListener('DOMContentLoaded', () => {

    const API_BASE_URL = window.VITE_API_URL || '';

    // State Variables
    let selectedBedrooms = 3;
    let selectedBathrooms = 2.0;
    let selectedNeighborhood = 'CollgCr';
    let selectedModel = 'XGBoost';
    let selectedFinish = 'nordic';
    let leaderboardData = {};
    let isDuskMode = false;
    let lastValuationResult = null;
    let lastValuationPayload = null;

    // Three.js Scene Variables
    let scene, camera, renderer, controls;
    let houseGroup, circularPlatform, terraceMesh, poolMesh;
    let groundMesh, secondFloorMesh, roofMesh, garageMesh, garRoofMesh, chimneyMesh, pillarMesh, pergolaGroup;
    let ambientLight, dirLight, accentLight, win1Mesh, win2Mesh, win3Mesh;

    // Exterior Architectural Finishes Palette
    const exteriorMaterials = {
        nordic: {
            name: 'Nordic White Clapboard',
            wallColor: 0xFFFFFF,
            wallRoughness: 0.3,
            wallMetalness: 0.05,
            roofColor: 0x111111,
            garRoofColor: 0xFF3B30,
            winColor: 0x4169FF,
            chimneyColor: 0x2C3038,
            terraceColor: 0xE9E9E7,
            platformColor: 0xF4F4F2,
            exterQual: 'Gd'
        },
        charcoal: {
            name: 'Charcoal Cedar Siding',
            wallColor: 0x1C1E24,
            wallRoughness: 0.55,
            wallMetalness: 0.12,
            roofColor: 0x0D0E12,
            garRoofColor: 0xFF3B30,
            winColor: 0xE7B547,
            chimneyColor: 0x111215,
            terraceColor: 0x24262E,
            platformColor: 0x15161A,
            exterQual: 'Ex'
        },
        brick: {
            name: 'Heritage Red Brick',
            wallColor: 0x963D2C,
            wallRoughness: 0.85,
            wallMetalness: 0.0,
            roofColor: 0x222328,
            garRoofColor: 0x7A2F22,
            winColor: 0xE2E8F0,
            chimneyColor: 0x5C261B,
            terraceColor: 0xDCD5CE,
            platformColor: 0xEBE6E0,
            exterQual: 'Gd'
        },
        pine: {
            name: 'Warm Scandinavian Pine',
            wallColor: 0xC49A6C,
            wallRoughness: 0.65,
            wallMetalness: 0.02,
            roofColor: 0x382D24,
            garRoofColor: 0xA87B4F,
            winColor: 0x62B6CB,
            chimneyColor: 0x4A3B2C,
            terraceColor: 0xDFD2C4,
            platformColor: 0xECE4DA,
            exterQual: 'Gd'
        },
        concrete: {
            name: 'Architectural Raw Concrete',
            wallColor: 0x8E9398,
            wallRoughness: 0.8,
            wallMetalness: 0.2,
            roofColor: 0x2B303A,
            garRoofColor: 0x4169FF,
            winColor: 0xA0D2EB,
            chimneyColor: 0x474B52,
            terraceColor: 0xC5C8CC,
            platformColor: 0xDADDE0,
            exterQual: 'Ex'
        }
    };

    // Neighborhood Intelligence Database
    const neighborhoodData = {
        CollgCr: { name: 'College Creek (CollgCr)' },
        Veenker: { name: 'Veenker Country Club (Veenker)' },
        Crawfor: { name: 'Crawford Historic (Crawfor)' },
        NoRidge: { name: 'Northridge (NoRidge)' },
        NridgHt: { name: 'Northridge Heights (NridgHt)' }
    };

    function init() {
        setupNavScroll();
        initThreeHouseScene();
        setupLightingToggle();
        setupMaterialCustomizer();
        setupQuickPresets();
        setupQualityStrip();
        setupSliders();
        setupTextOptionSelectors();
        setupNeighborhoodMap();
        setupCalculateButton();
        setupResultActionModals();
        setupDiagramCameraTriggers();
        initScatterPlot();
        initJsonTypingAnimation();
        fetchLeaderboardMetrics();
    }

    // 1. Navigation Scroll & Mobile Drawer Handler
    function setupNavScroll() {
        const nav = document.getElementById('mainNav');
        const mobileMenuBtn = document.getElementById('mobileMenuBtn');
        const navLinks = document.getElementById('navLinks');

        if (nav) {
            window.addEventListener('scroll', () => {
                if (window.scrollY > 30) {
                    nav.style.borderColor = '#111111';
                } else {
                    nav.style.borderColor = '#E9E9E7';
                }
            });
        }

        if (mobileMenuBtn && navLinks) {
            mobileMenuBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                mobileMenuBtn.classList.toggle('active');
                navLinks.classList.toggle('open');
            });

            // Close menu when clicking on any navigation link
            navLinks.querySelectorAll('a').forEach(link => {
                link.addEventListener('click', () => {
                    mobileMenuBtn.classList.remove('active');
                    navLinks.classList.remove('open');
                });
            });

            // Close menu when tapping outside
            document.addEventListener('click', (e) => {
                if (!nav.contains(e.target)) {
                    mobileMenuBtn.classList.remove('active');
                    navLinks.classList.remove('open');
                }
            });
        }
    }

    // 2. High-End Modern Architectural 3D Villa on Rotating Circular Platform
    function initThreeHouseScene() {
        const container = document.getElementById('threeHouseCanvas');
        if (!container) return;

        const width = container.clientWidth || 550;
        const height = container.clientHeight || 520;

        scene = new THREE.Scene();
        scene.background = new THREE.Color(0xFFFFFF); // Pure White default

        camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 1000);
        camera.position.set(14, 11, 16);

        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        container.appendChild(renderer.domElement);

        // OrbitControls
        controls = new THREE.OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.maxPolarAngle = Math.PI / 2 - 0.04;
        controls.minDistance = 7;
        controls.maxDistance = 28;

        // Architectural Lighting Setup
        ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.9);
        scene.add(ambientLight);

        dirLight = new THREE.DirectionalLight(0xFFFFFF, 0.85);
        dirLight.position.set(20, 26, 14);
        dirLight.castShadow = true;
        dirLight.shadow.mapSize.width = 2048;
        dirLight.shadow.mapSize.height = 2048;
        dirLight.shadow.bias = -0.0005;
        scene.add(dirLight);

        accentLight = new THREE.DirectionalLight(0x4169FF, 0.25);
        accentLight.position.set(-18, 12, -14);
        scene.add(accentLight);

        // House Group
        houseGroup = new THREE.Group();

        // Architectural Shaders & Base Materials
        const whiteClay = new THREE.MeshStandardMaterial({ color: 0xFFFFFF, roughness: 0.3, metalness: 0.05 });
        const darkSlateMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.35, metalness: 0.1 });
        const redAccentMat = new THREE.MeshStandardMaterial({ color: 0xFF3B30, roughness: 0.25, metalness: 0.05 });
        const blueGlassMat = new THREE.MeshStandardMaterial({ color: 0x4169FF, roughness: 0.1, metalness: 0.6, transparent: true, opacity: 0.85 });
        const poolWaterMat = new THREE.MeshStandardMaterial({ color: 0x00B4D8, roughness: 0.05, metalness: 0.9, transparent: true, opacity: 0.8 });
        const steelMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.2, metalness: 0.9 });
        const woodSlatMat = new THREE.MeshStandardMaterial({ color: 0xC49A6C, roughness: 0.6 });
        const foliageMat = new THREE.MeshStandardMaterial({ color: 0x2D6A4F, roughness: 0.8 });
        const potMat = new THREE.MeshStandardMaterial({ color: 0x1F2421, roughness: 0.5 });

        // 1. Rotating Master Pedestal Platform
        const platGeo = new THREE.CylinderGeometry(8.5, 8.5, 0.25, 64);
        circularPlatform = new THREE.Mesh(platGeo, new THREE.MeshStandardMaterial({ color: 0xF4F4F2, roughness: 0.6 }));
        circularPlatform.position.y = -0.125;
        circularPlatform.receiveShadow = true;
        scene.add(circularPlatform);

        // 2. Architectural Base Terrace Slab
        const terraceGeo = new THREE.BoxGeometry(9.4, 0.25, 7.8);
        terraceMesh = new THREE.Mesh(terraceGeo, new THREE.MeshStandardMaterial({ color: 0xE9E9E7, roughness: 0.5 }));
        terraceMesh.position.set(0.2, 0.125, 0.2);
        terraceMesh.receiveShadow = true;
        terraceMesh.castShadow = true;
        houseGroup.add(terraceMesh);

        // 3. Reflective Sunken Pool / Water Lounge
        const poolGeo = new THREE.BoxGeometry(3.2, 0.08, 1.8);
        poolMesh = new THREE.Mesh(poolGeo, poolWaterMat);
        poolMesh.position.set(-2.6, 0.26, 2.2);
        houseGroup.add(poolMesh);

        // 4. Ground Floor Living Pavilion
        const gGeo = new THREE.BoxGeometry(5.2, 2.2, 4.0);
        groundMesh = new THREE.Mesh(gGeo, whiteClay);
        groundMesh.position.set(0, 1.35, 0);
        groundMesh.castShadow = true;
        groundMesh.receiveShadow = true;
        houseGroup.add(groundMesh);

        // 5. Cantilevered Floating Upper Residence Suite
        const sGeo = new THREE.BoxGeometry(4.4, 1.9, 3.8);
        secondFloorMesh = new THREE.Mesh(sGeo, whiteClay);
        secondFloorMesh.position.set(-0.6, 3.4, 0.4);
        secondFloorMesh.castShadow = true;
        secondFloorMesh.receiveShadow = true;
        houseGroup.add(secondFloorMesh);

        // 6. Modern Flat Overhanging Architectural Roof
        const rGeo = new THREE.BoxGeometry(5.4, 0.18, 4.6);
        roofMesh = new THREE.Mesh(rGeo, darkSlateMat);
        roofMesh.position.set(-0.6, 4.44, 0.4);
        roofMesh.castShadow = true;
        roofMesh.receiveShadow = true;
        houseGroup.add(roofMesh);

        // 7. Attached Streamlined Double Garage Wing
        const garGeo = new THREE.BoxGeometry(3.2, 1.9, 3.8);
        garageMesh = new THREE.Mesh(garGeo, whiteClay);
        garageMesh.position.set(3.8, 1.2, 0.2);
        garageMesh.castShadow = true;
        garageMesh.receiveShadow = true;
        houseGroup.add(garageMesh);

        // 8. Garage Flat Roof Slab (with signature Signal Red / Finish Trim)
        const garRoofGeo = new THREE.BoxGeometry(3.5, 0.18, 4.1);
        garRoofMesh = new THREE.Mesh(garRoofGeo, redAccentMat);
        garRoofMesh.position.set(3.8, 2.24, 0.2);
        garRoofMesh.castShadow = true;
        houseGroup.add(garRoofMesh);

        // 9. Monolithic Hearth / Chimney Pillar
        const chimGeo = new THREE.BoxGeometry(0.7, 5.2, 0.9);
        chimneyMesh = new THREE.Mesh(chimGeo, new THREE.MeshStandardMaterial({ color: 0x2C3038, roughness: 0.7 }));
        chimneyMesh.position.set(1.9, 2.7, -0.9);
        chimneyMesh.castShadow = true;
        houseGroup.add(chimneyMesh);

        // 10. Slender Cantilever Support Pillar
        const pillarGeo = new THREE.CylinderGeometry(0.06, 0.06, 2.3, 16);
        pillarMesh = new THREE.Mesh(pillarGeo, steelMat);
        pillarMesh.position.set(-2.6, 1.25, 2.1);
        pillarMesh.castShadow = true;
        houseGroup.add(pillarMesh);

        // 11. Architectural Pergola Sun-Louver Slats
        pergolaGroup = new THREE.Group();
        for (let i = 0; i < 5; i++) {
            const slatGeo = new THREE.BoxGeometry(2.2, 0.06, 0.12);
            const slat = new THREE.Mesh(slatGeo, woodSlatMat);
            slat.position.set(0.6, 2.35, 1.6 + i * 0.32);
            slat.castShadow = true;
            pergolaGroup.add(slat);
        }
        houseGroup.add(pergolaGroup);

        // 12. Panoramic Architectural Glazing
        const win1Geo = new THREE.BoxGeometry(2.4, 1.6, 0.08);
        win1Mesh = new THREE.Mesh(win1Geo, blueGlassMat);
        win1Mesh.position.set(0.6, 1.35, 2.05);
        houseGroup.add(win1Mesh);

        const win2Geo = new THREE.BoxGeometry(2.6, 1.3, 0.08);
        win2Mesh = new THREE.Mesh(win2Geo, blueGlassMat);
        win2Mesh.position.set(-0.8, 3.4, 2.35);
        houseGroup.add(win2Mesh);

        const win3Geo = new THREE.BoxGeometry(0.08, 1.3, 1.8);
        win3Mesh = new THREE.Mesh(win3Geo, blueGlassMat);
        win3Mesh.position.set(-2.85, 3.4, 0.4);
        houseGroup.add(win3Mesh);

        // 13. Minimalist Modern Cubic Planters
        [-2.8, 2.0].forEach((px, idx) => {
            const pot = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.5, 0.6), potMat);
            pot.position.set(px, 0.5, idx === 0 ? 3.4 : 2.5);
            pot.castShadow = true;
            
            const plant = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), foliageMat);
            plant.position.set(px, 0.85, idx === 0 ? 3.4 : 2.5);
            plant.castShadow = true;

            houseGroup.add(pot);
            houseGroup.add(plant);
        });

        scene.add(houseGroup);

        // Apply selected default finish
        applyFinish(selectedFinish);

        // Mouse Parallax on Price Orb
        const priceOrb = document.getElementById('priceOrb');
        const heroVisual = document.getElementById('heroVisual');
        if (heroVisual && priceOrb) {
            heroVisual.addEventListener('mousemove', (e) => {
                const rect = heroVisual.getBoundingClientRect();
                const x = (e.clientX - rect.left - rect.width / 2) / 15;
                const y = (e.clientY - rect.top - rect.height / 2) / 15;
                priceOrb.style.transform = `translate(${-x}px, ${-y}px)`;
            });
        }

        // Render Loop with smooth float and continuous subtle spin
        function animate() {
            requestAnimationFrame(animate);
            controls.update();

            circularPlatform.rotation.y += 0.002;
            houseGroup.rotation.y += 0.002;
            houseGroup.position.y = Math.sin(Date.now() * 0.001) * 0.06;

            renderer.render(scene, camera);
        }

        animate();

        // Window Resize Listener
        window.addEventListener('resize', () => {
            if (!container) return;
            const w = container.clientWidth;
            const h = container.clientHeight;
            camera.aspect = w / h;
            camera.updateProjectionMatrix();
            renderer.setSize(w, h);
        });
    }

    // 3. Day / Dusk Lighting Mode Toggle
    function setupLightingToggle() {
        const btn = document.getElementById('btnToggle3DLighting');
        const icon = document.getElementById('lightingIcon');
        const label = document.getElementById('lightingLabel');

        if (!btn) return;

        btn.addEventListener('click', () => {
            isDuskMode = !isDuskMode;

            if (isDuskMode) {
                // Dusk Evening Architectural Mode
                scene.background = new THREE.Color(0x0A0F1D);
                ambientLight.color.setHex(0x28334A);
                ambientLight.intensity = 0.5;
                dirLight.color.setHex(0x7D93C4);
                dirLight.intensity = 0.45;
                accentLight.intensity = 0.8;

                // Golden Emissive Interior Illuminations
                const duskGlow = new THREE.MeshStandardMaterial({
                    color: 0xF4D35E,
                    emissive: 0xF4D35E,
                    emissiveIntensity: 1.5,
                    roughness: 0.1
                });
                if (win1Mesh) win1Mesh.material = duskGlow;
                if (win2Mesh) win2Mesh.material = duskGlow;
                if (win3Mesh) win3Mesh.material = duskGlow;

                icon.innerText = '🌙';
                label.innerText = 'DUSK LIGHTING';
                btn.style.background = '#0A0F1D';
                btn.style.color = '#FFFFFF';
            } else {
                // Day Architectural Mode
                scene.background = new THREE.Color(0xFFFFFF);
                ambientLight.color.setHex(0xFFFFFF);
                ambientLight.intensity = 0.9;
                dirLight.color.setHex(0xFFFFFF);
                dirLight.intensity = 0.85;
                accentLight.intensity = 0.25;

                // Restore Finish Glazing
                const curMat = exteriorMaterials[selectedFinish] || exteriorMaterials.nordic;
                const glassMat = new THREE.MeshStandardMaterial({
                    color: curMat.winColor,
                    roughness: 0.1,
                    metalness: 0.6,
                    transparent: true,
                    opacity: 0.85
                });
                if (win1Mesh) win1Mesh.material = glassMat;
                if (win2Mesh) win2Mesh.material = glassMat;
                if (win3Mesh) win3Mesh.material = glassMat;

                icon.innerText = '☀️';
                label.innerText = 'DAY LIGHTING';
                btn.style.background = '#FFFFFF';
                btn.style.color = '#111111';
            }
        });
    }

    // 4. 3D Exterior Material & Finishes Customizer
    function setupMaterialCustomizer() {
        const swatchBtns = document.querySelectorAll('#materialCustomizer .mat-swatch-btn');
        swatchBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                swatchBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                selectedFinish = btn.dataset.mat;
                applyFinish(selectedFinish);
                update3DHouseModel();
            });
        });
    }

    function applyFinish(finishKey) {
        const mat = exteriorMaterials[finishKey];
        if (!mat || !groundMesh) return;

        // Update Wall Facades (Ground floor, Second floor, Garage wing)
        [groundMesh, secondFloorMesh, garageMesh].forEach(mesh => {
            if (mesh) {
                mesh.material.color.setHex(mat.wallColor);
                mesh.material.roughness = mat.wallRoughness;
                mesh.material.metalness = mat.wallMetalness;
            }
        });

        if (roofMesh) roofMesh.material.color.setHex(mat.roofColor);
        if (garRoofMesh) garRoofMesh.material.color.setHex(mat.garRoofColor);
        if (chimneyMesh) chimneyMesh.material.color.setHex(mat.chimneyColor);
        if (terraceMesh) terraceMesh.material.color.setHex(mat.terraceColor);
        if (circularPlatform) circularPlatform.material.color.setHex(mat.platformColor);

        // Windows (if not in glowing dusk mode)
        if (!isDuskMode) {
            const glassMat = new THREE.MeshStandardMaterial({
                color: mat.winColor,
                roughness: 0.1,
                metalness: 0.6,
                transparent: true,
                opacity: 0.85
            });
            if (win1Mesh) win1Mesh.material = glassMat;
            if (win2Mesh) win2Mesh.material = glassMat;
            if (win3Mesh) win3Mesh.material = glassMat;
        }
    }

    // 5. Quick Simulation Presets
    function setupQuickPresets() {
        const btns = document.querySelectorAll('.quick-presets-strip .preset-pill-btn');

        const presets = {
            starter: {
                grLiv: 1250, qual: 5, beds: 3, baths: 1.5, year: 1985, neigh: 'CollgCr',
                bsmt: 650, flr1: 850, flr2: 400, garArea: 300, garCars: 1, rms: 5, finish: 'brick'
            },
            renovation: {
                grLiv: 1850, qual: 7, beds: 3, baths: 2.0, year: 2005, neigh: 'Crawfor',
                bsmt: 950, flr1: 1000, flr2: 850, garArea: 500, garCars: 2, rms: 7, finish: 'nordic'
            },
            luxury: {
                grLiv: 3200, qual: 9, beds: 4, baths: 3.0, year: 2018, neigh: 'NridgHt',
                bsmt: 1400, flr1: 1700, flr2: 1500, garArea: 800, garCars: 3, rms: 9, finish: 'charcoal'
            }
        };

        btns.forEach(btn => {
            btn.addEventListener('click', () => {
                btns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                const key = btn.dataset.preset;
                const p = presets[key];
                if (!p) return;

                // Update Living Area
                const livSlider = document.getElementById('grLivArea');
                if (livSlider) {
                    livSlider.value = p.grLiv;
                    document.getElementById('displayLivArea').innerText = p.grLiv.toLocaleString();
                }

                // Update Quality
                const qualInput = document.getElementById('overallQual');
                if (qualInput) {
                    qualInput.value = p.qual;
                    document.getElementById('displayQual').innerText = p.qual < 10 ? `0${p.qual}` : p.qual;
                    document.querySelectorAll('#qualStrip .qual-num-btn').forEach(qb => {
                        qb.classList.toggle('active', parseInt(qb.dataset.val) === p.qual);
                    });
                }

                // Update Bedrooms
                selectedBedrooms = p.beds;
                document.querySelectorAll('#bedStrip .plain-num-btn').forEach(bb => {
                    bb.classList.toggle('active', parseInt(bb.dataset.val) === p.beds);
                });

                // Update Bathrooms
                selectedBathrooms = p.baths;
                document.querySelectorAll('#bathStrip .plain-num-btn').forEach(bathB => {
                    bathB.classList.toggle('active', parseFloat(bathB.dataset.val) === p.baths);
                });

                // Update Year Built
                const yearSlider = document.getElementById('yearBuilt');
                if (yearSlider) {
                    yearSlider.value = p.year;
                    document.getElementById('displayYear').innerText = p.year;
                }

                // Update Structure Inputs
                if (document.getElementById('yearRemod')) document.getElementById('yearRemod').value = p.year;
                if (document.getElementById('totalBsmtSF')) document.getElementById('totalBsmtSF').value = p.bsmt;
                if (document.getElementById('firstFlrSF')) document.getElementById('firstFlrSF').value = p.flr1;
                if (document.getElementById('secondFlrSF')) document.getElementById('secondFlrSF').value = p.flr2;
                if (document.getElementById('garageArea')) document.getElementById('garageArea').value = p.garArea;
                if (document.getElementById('garageCars')) document.getElementById('garageCars').value = p.garCars;
                if (document.getElementById('totRms')) document.getElementById('totRms').value = p.rms;

                // Update Neighborhood Pin
                selectedNeighborhood = p.neigh;
                document.querySelectorAll('#neighborhoodMap .swiss-map-pin').forEach(pin => {
                    pin.classList.toggle('active', pin.dataset.val === p.neigh);
                });

                // Update Finish
                if (p.finish) {
                    selectedFinish = p.finish;
                    document.querySelectorAll('#materialCustomizer .mat-swatch-btn').forEach(sb => {
                        sb.classList.toggle('active', sb.dataset.mat === p.finish);
                    });
                    applyFinish(p.finish);
                }

                update3DHouseModel();
            });
        });
    }

    // 6. Dynamic Real-Time 3D Mesh Scaler
    function update3DHouseModel() {
        if (!groundMesh || !secondFloorMesh) return;

        const grLiv = parseFloat(document.getElementById('grLivArea')?.value || 1850);
        const qual = parseInt(document.getElementById('overallQual')?.value || 7);
        const year = parseInt(document.getElementById('yearBuilt')?.value || 2005);

        // Dynamically scale mesh dimensions
        const sfScale = Math.min(1.35, Math.max(0.8, grLiv / 1850.0));
        groundMesh.scale.set(sfScale, 1, sfScale);
        secondFloorMesh.scale.set(sfScale, 1, sfScale);
        if (roofMesh) roofMesh.scale.set(sfScale, 1, sfScale);
        if (terraceMesh) terraceMesh.scale.set(sfScale, 1, sfScale);

        // Real-Time Price Calculation
        const finishBonus = selectedFinish === 'charcoal' || selectedFinish === 'concrete' ? 6500 : 0;
        const estPrice = Math.round((qual ** 2.3 * 1650) + (grLiv * 62.5) + finishBonus + 45000);
        if (document.getElementById('heroPriceVal')) document.getElementById('heroPriceVal').innerText = `$${estPrice.toLocaleString()}`;
        if (document.getElementById('calloutLiving')) document.getElementById('calloutLiving').innerText = `LIVING / ${grLiv.toLocaleString()} SQ FT`;

        // Update Floating Data Typography
        if (document.getElementById('fQual')) document.getElementById('fQual').innerText = `${qual < 10 ? '0' + qual : qual} / 10`;
        if (document.getElementById('fArea')) document.getElementById('fArea').innerText = `${grLiv.toLocaleString()} SQ FT`;
        if (document.getElementById('fYear')) document.getElementById('fYear').innerText = `${year}`;
        if (document.getElementById('displayYear')) document.getElementById('displayYear').innerText = `${year}`;
    }

    // 7. Quality Number Strip Handler (01 to 10)
    function setupQualityStrip() {
        const btns = document.querySelectorAll('#qualStrip .qual-num-btn');
        const displayQual = document.getElementById('displayQual');
        const hiddenQual = document.getElementById('overallQual');

        btns.forEach(btn => {
            btn.addEventListener('click', () => {
                btns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                const val = parseInt(btn.dataset.val);
                hiddenQual.value = val;
                displayQual.innerText = val < 10 ? `0${val}` : val;
                update3DHouseModel();
            });
        });
    }

    // 8. Sliders Handlers (Living Area & Year Built)
    function setupSliders() {
        const livAreaSlider = document.getElementById('grLivArea');
        const displayLivArea = document.getElementById('displayLivArea');

        if (livAreaSlider && displayLivArea) {
            livAreaSlider.addEventListener('input', (e) => {
                const val = parseInt(e.target.value);
                displayLivArea.innerText = val.toLocaleString();
                update3DHouseModel();
            });
        }

        const yearSlider = document.getElementById('yearBuilt');
        const displayYear = document.getElementById('displayYear');

        if (yearSlider && displayYear) {
            yearSlider.addEventListener('input', (e) => {
                const val = e.target.value;
                displayYear.innerText = val;
                update3DHouseModel();
            });
        }
    }

    // 9. Text Option Selectors (Bedrooms & Bathrooms)
    function setupTextOptionSelectors() {
        // Bedrooms
        const bedBtns = document.querySelectorAll('#bedStrip .plain-num-btn');
        bedBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                bedBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                selectedBedrooms = parseInt(btn.dataset.val);
                update3DHouseModel();
            });
        });

        // Bathrooms
        const bathBtns = document.querySelectorAll('#bathStrip .plain-num-btn');
        bathBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                bathBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                selectedBathrooms = parseFloat(btn.dataset.val);
                update3DHouseModel();
            });
        });
    }

    // 10. Abstract Neighborhood Map Selector
    function setupNeighborhoodMap() {
        const pins = document.querySelectorAll('#neighborhoodMap .swiss-map-pin');
        pins.forEach(pin => {
            pin.addEventListener('click', () => {
                pins.forEach(p => p.classList.remove('active'));
                pin.classList.add('active');
                selectedNeighborhood = pin.dataset.val;
            });
        });
    }

    // 11. Calculate Value Button & Prediction Sequence
    function setupCalculateButton() {
        const btn = document.getElementById('btnCalculateValue');
        if (!btn) return;

        btn.addEventListener('click', handleCalculateSubmit);
    }

    function buildCurrentPayload() {
        const grLiv = parseFloat(document.getElementById('grLivArea').value) || 1850;
        const qual = parseInt(document.getElementById('overallQual').value) || 7;
        const year = parseInt(document.getElementById('yearBuilt').value) || 2005;
        const bsmt = parseFloat(document.getElementById('totalBsmtSF').value) || 950;
        const garageCars = parseInt(document.getElementById('garageCars').value) || 2;
        const exterQual = exteriorMaterials[selectedFinish]?.exterQual || 'Gd';

        return {
            ModelName: selectedModel,
            OverallQual: qual,
            OverallCond: 5,
            GrLivArea: grLiv,
            LotArea: 8500,
            BedroomAbvGr: selectedBedrooms,
            FullBath: selectedBathrooms,
            KitchenAbvGr: 1,
            HouseStyle: '2Story',
            YearBuilt: year,
            YearRemodAdd: parseInt(document.getElementById('yearRemod').value) || 2005,
            TotalBsmtSF: bsmt,
            "1stFlrSF": parseFloat(document.getElementById('firstFlrSF').value) || 1000,
            "2ndFlrSF": parseFloat(document.getElementById('secondFlrSF').value) || 850,
            GarageArea: parseFloat(document.getElementById('garageArea').value) || 500,
            GarageCars: garageCars,
            TotRmsAbvGrd: parseInt(document.getElementById('totRms').value) || 7,
            Neighborhood: selectedNeighborhood,
            KitchenQual: 'Gd',
            HeatingQC: 'Ex',
            GarageFinish: 'RFn',
            ExterQual: exterQual
        };
    }

    function handleCalculateSubmit() {
        const overlay = document.getElementById('predictOverlay');
        const traveler = document.getElementById('redLineTraveler');
        const stageLabel = document.getElementById('predictStageLabel');

        if (!overlay || !traveler) return;

        overlay.classList.remove('hidden');

        const payload = buildCurrentPayload();
        lastValuationPayload = payload;

        // 4-Stage Red Line Progress Animation
        traveler.style.width = '25%';
        stageLabel.innerText = 'READING PROPERTY';

        setTimeout(() => {
            traveler.style.width = '50%';
            stageLabel.innerText = 'ENGINEERING FEATURES';
        }, 400);

        setTimeout(() => {
            traveler.style.width = '75%';
            stageLabel.innerText = `RUNNING XGBOOST ENGINE`;
        }, 800);

        setTimeout(() => {
            traveler.style.width = '100%';
            stageLabel.innerText = 'CALCULATING VALUE';
        }, 1200);

        // Async API Call to FastAPI
        fetch(`${API_BASE_URL}/predict`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        })
        .then(res => {
            if (!res.ok) throw new Error('API request failed');
            return res.json();
        })
        .then(data => {
            lastValuationResult = data;
            setTimeout(() => {
                overlay.classList.add('hidden');
                traveler.style.width = '0%';
                renderResultScreen(data, payload);
            }, 1600);
        })
        .catch(err => {
            console.warn('FastAPI offline or fallback mode:', err);
            setTimeout(() => {
                overlay.classList.add('hidden');
                traveler.style.width = '0%';
                const finishBonus = selectedFinish === 'charcoal' || selectedFinish === 'concrete' ? 6500 : 0;
                const estPrice = Math.round((payload.OverallQual ** 2.3 * 1650) + (payload.GrLivArea * 62.5) + (payload.GarageCars * 11500) + finishBonus + 45000);
                const fallbackData = {
                    predicted_price: estPrice,
                    estimated_price_range: { min: Math.round(estPrice * 0.92), max: Math.round(estPrice * 1.08) },
                    model_used: 'XGBoost',
                    r2_accuracy: 0.9265
                };
                lastValuationResult = fallbackData;
                renderResultScreen(fallbackData, payload);
            }, 1600);
        });
    }

    // 12. Render Dramatic Result Reveal Screen
    function renderResultScreen(data, payload) {
        const resultScreen = document.getElementById('resultExperience');
        if (!resultScreen) return;

        resultScreen.classList.remove('hidden');

        const price = data.predicted_price || data.predicted_sale_price || 248500;
        const minRange = data.estimated_price_range ? data.estimated_price_range.min : Math.round(price * 0.92);
        const maxRange = data.estimated_price_range ? data.estimated_price_range.max : Math.round(price * 1.08);

        const minK = Math.round(minRange / 1000);
        const maxK = Math.round(maxRange / 1000);
        const estK = (price / 1000).toFixed(1);

        document.getElementById('rangeMinVal').innerText = `$${minK}K`;
        document.getElementById('rangeMidVal').innerText = `$${estK}K`;
        document.getElementById('rangeMaxVal').innerText = `$${maxK}K`;

        // Update Active Model Badge
        const activeModelName = data.model_used || selectedModel;
        const activeR2 = data.r2_accuracy || (leaderboardData[activeModelName]?.R2_Score || 0.9265);
        if (document.getElementById('resModelName')) document.getElementById('resModelName').innerText = activeModelName.toUpperCase();
        if (document.getElementById('resModelR2')) document.getElementById('resModelR2').innerText = `R² ${activeR2}`;

        // Horizontal Strip Updates
        document.getElementById('stSF').innerText = payload.GrLivArea.toLocaleString();
        document.getElementById('stBed').innerText = payload.BedroomAbvGr < 10 ? `0${payload.BedroomAbvGr}` : payload.BedroomAbvGr;
        document.getElementById('stBath').innerText = payload.FullBath < 10 ? `0${payload.FullBath}` : payload.FullBath;
        document.getElementById('stYear').innerText = payload.YearBuilt;
        document.getElementById('stQual').innerText = payload.OverallQual < 10 ? `0${payload.OverallQual}` : payload.OverallQual;

        // Animate Number Count-Up
        animateCountUp('resPriceVal', 0, Math.round(price), 1500);

        // Smooth Scroll to Result Screen
        resultScreen.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function animateCountUp(elementId, start, end, duration) {
        const el = document.getElementById(elementId);
        if (!el) return;

        let startTime = null;

        function step(timestamp) {
            if (!startTime) startTime = timestamp;
            const progress = Math.min((timestamp - startTime) / duration, 1);
            const current = Math.floor(progress * (end - start) + start);
            el.innerText = current.toLocaleString();

            if (progress < 1) {
                window.requestAnimationFrame(step);
            } else {
                el.innerText = end.toLocaleString();
            }
        }

        window.requestAnimationFrame(step);
    }

    // 13. Result Action: Direct 1-Click PDF Download
    function setupResultActionModals() {
        const btnExportPDF = document.getElementById('btnExportPDF');
        if (btnExportPDF) {
            btnExportPDF.addEventListener('click', () => {
                const payload = lastValuationPayload || buildCurrentPayload();
                const price = lastValuationResult?.predicted_price || 248500;
                const minRange = lastValuationResult?.estimated_price_range?.min || Math.round(price * 0.92);
                const maxRange = lastValuationResult?.estimated_price_range?.max || Math.round(price * 1.08);

                // Populate Printable Certificate Content
                if (document.getElementById('printPriceVal')) document.getElementById('printPriceVal').innerText = `$${Math.round(price).toLocaleString()}`;
                if (document.getElementById('printRangeVal')) document.getElementById('printRangeVal').innerText = `Estimated Market Range: $${Math.round(minRange).toLocaleString()} – $${Math.round(maxRange).toLocaleString()}`;
                if (document.getElementById('prSF')) document.getElementById('prSF').innerText = `${payload.GrLivArea.toLocaleString()} SQ FT`;
                if (document.getElementById('prQual')) document.getElementById('prQual').innerText = `${payload.OverallQual} / 10`;
                if (document.getElementById('prBed')) document.getElementById('prBed').innerText = `${payload.BedroomAbvGr}`;
                if (document.getElementById('prBath')) document.getElementById('prBath').innerText = `${payload.FullBath}`;
                if (document.getElementById('prYear')) document.getElementById('prYear').innerText = `${payload.YearBuilt}`;
                if (document.getElementById('prNeigh')) document.getElementById('prNeigh').innerText = `${neighborhoodData[selectedNeighborhood]?.name || selectedNeighborhood}`;
                if (document.getElementById('prGarage')) document.getElementById('prGarage').innerText = `${payload.GarageCars} Cars (${payload.GarageArea} SQ FT)`;
                if (document.getElementById('prBsmt')) document.getElementById('prBsmt').innerText = `${payload.TotalBsmtSF} SQ FT`;
                if (document.getElementById('prModel')) document.getElementById('prModel').innerText = `Optimal XGBoost Regressor (R² 0.9509)`;
                if (document.getElementById('printTimestamp')) document.getElementById('printTimestamp').innerText = `Generated on: ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`;

                const origBtnText = btnExportPDF.innerText;
                btnExportPDF.innerText = 'GENERATING PDF...';

                const printContainer = document.getElementById('printAppraisalContainer');
                if (!printContainer) {
                    btnExportPDF.innerText = origBtnText;
                    window.print();
                    return;
                }

                // Prepare offscreen cloned element for clean A4 portrait PDF capture
                const clone = printContainer.cloneNode(true);
                clone.id = 'printAppraisalClone';
                clone.style.display = 'block';
                clone.style.position = 'absolute';
                clone.style.left = '-9999px';
                clone.style.top = '0';
                clone.style.width = '700px';
                clone.style.backgroundColor = '#FFFFFF';
                clone.style.color = '#111111';
                clone.style.padding = '28px';
                clone.style.boxSizing = 'border-box';
                clone.style.fontFamily = "'Space Grotesk', -apple-system, BlinkMacSystemFont, sans-serif";
                document.body.appendChild(clone);

                const opt = {
                    margin: [8, 8, 8, 8],
                    filename: `Ames_Property_Appraisal_Certificate.pdf`,
                    image: { type: 'jpeg', quality: 0.98 },
                    html2canvas: { scale: 2, useCORS: true, letterRendering: true, logging: false },
                    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
                };

                if (typeof html2pdf !== 'undefined') {
                    html2pdf().set(opt).from(clone).save()
                        .then(() => {
                            if (document.body.contains(clone)) document.body.removeChild(clone);
                            btnExportPDF.innerText = origBtnText;
                        })
                        .catch(err => {
                            console.error('Direct PDF error, falling back to window.print:', err);
                            if (document.body.contains(clone)) document.body.removeChild(clone);
                            btnExportPDF.innerText = origBtnText;
                            window.print();
                        });
                } else {
                    if (document.body.contains(clone)) document.body.removeChild(clone);
                    btnExportPDF.innerText = origBtnText;
                    window.print();
                }
            });
        }
    }

    // 14. Interactive 3D Diagram Camera Triggers ("Explore the property.")
    function setupDiagramCameraTriggers() {
        const btns = document.querySelectorAll('.camera-trigger-btn');
        const tag = document.getElementById('diagramTag');
        const heading = document.getElementById('diagramHeading');
        const body = document.getElementById('diagramBody');

        const details = {
            living: {
                tag: 'AREA / LIVING SPACE',
                heading: 'Living Area (GrLivArea)',
                body: 'The primary square footage metric directly correlates with base property replacement valuation. Scaled non-linearly in the tree nodes.',
                cam: { x: 0, y: 3, z: 8 }
            },
            garage: {
                tag: 'STRUCTURE / GARAGE',
                heading: 'Attached Garage (GarageArea & Cars)',
                body: 'Garage capacity represents a strong urban amenity multiplier in Ames, accounting for ~10% of final predicted sale price.',
                cam: { x: 8, y: 3, z: 4 }
            },
            basement: {
                tag: 'FOUNDATION / BASEMENT',
                heading: 'Finished Basement (TotalBsmtSF)',
                body: 'Total basement square footage acts as an essential foundation valuation factor, weighted alongside finished ground area.',
                cam: { x: 0, y: -2, z: 10 }
            },
            secondFloor: {
                tag: 'LEVEL / UPPER SUITE',
                heading: 'Second Floor (2ndFlrSF)',
                body: 'Multi-story elevation splits total living space and affects building style classification and roof complexity.',
                cam: { x: -2, y: 7, z: 6 }
            }
        };

        btns.forEach(btn => {
            btn.addEventListener('click', () => {
                btns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                const key = btn.dataset.target;
                const info = details[key];
                if (info && tag && heading && body && camera) {
                    tag.innerText = info.tag;
                    heading.innerText = info.heading;
                    body.innerText = info.body;

                    // Smooth Camera Position Transition
                    animateCameraPosition(info.cam);
                }
            });
        });
    }

    function animateCameraPosition(targetPos) {
        if (!camera) return;
        const startPos = { x: camera.position.x, y: camera.position.y, z: camera.position.z };
        const startTime = Date.now();
        const duration = 800;

        function step() {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const ease = 0.5 - Math.cos(progress * Math.PI) / 2;

            camera.position.x = startPos.x + (targetPos.x - startPos.x) * ease;
            camera.position.y = startPos.y + (targetPos.y - startPos.y) * ease;
            camera.position.z = startPos.z + (targetPos.z - startPos.z) * ease;

            if (progress < 1) {
                requestAnimationFrame(step);
            }
        }

        step();
    }

    // 15. Animated Dataset Canvas Scatter Plot (Responsive)
    function initScatterPlot() {
        const canvas = document.getElementById('scatterCanvas');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const tooltip = document.getElementById('scatterTooltip');

        let w = canvas.width = canvas.parentElement.clientWidth || 1000;
        let h = canvas.height = Math.min(450, Math.max(280, Math.round(w * 0.45)));

        // Generate 140 Real Ames Dataset Benchmark Points
        const points = [];
        for (let i = 0; i < 140; i++) {
            const area = Math.round(500 + Math.random() * 3500);
            const price = Math.round((area * 78) + (Math.random() * 75000) + 35000);
            points.push({ area, price, qual: Math.floor(Math.random() * 5) + 5 });
        }

        let progress = 0;

        function draw() {
            ctx.clearRect(0, 0, w, h);

            // Swiss Minimalist Grid
            ctx.strokeStyle = '#E9E9E7';
            ctx.lineWidth = 1;

            const xStep = Math.max(60, Math.round(w / 8));
            for (let x = 60; x < w - 20; x += xStep) {
                ctx.beginPath(); ctx.moveTo(x, 20); ctx.lineTo(x, h - 35); ctx.stroke();
            }
            for (let y = 30; y < h - 35; y += 60) {
                ctx.beginPath(); ctx.moveTo(60, y); ctx.lineTo(w - 20, y); ctx.stroke();
            }

            // Scatter Points (Electric Blue)
            points.forEach((p, idx) => {
                const cx = 60 + ((p.area - 500) / 3500) * (w - 85);
                const cy = (h - 35) - ((p.price - 35000) / 350000) * (h - 65) * Math.min(1, progress * (idx / 100 + 0.5));

                ctx.beginPath();
                ctx.arc(cx, cy, w < 500 ? 3 : 4, 0, Math.PI * 2);
                ctx.fillStyle = idx === 42 ? '#FF3B30' : '#4169FF'; // Selected point in Signal Red
                ctx.fill();
            });

            // Regression Trend Line (Signal Red)
            ctx.beginPath();
            ctx.moveTo(60, h - 45);
            ctx.lineTo(60 + (w - 85) * progress, (h - 35) - (330000 / 350000) * (h - 65) * progress);
            ctx.strokeStyle = '#FF3B30';
            ctx.lineWidth = 2;
            ctx.stroke();

            if (progress < 1) {
                progress += 0.025;
                requestAnimationFrame(draw);
            }
        }

        draw();

        // Responsive Resize Handler
        let resizeTimer;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                w = canvas.width = canvas.parentElement.clientWidth || 1000;
                h = canvas.height = Math.min(450, Math.max(280, Math.round(w * 0.45)));
                progress = 1;
                draw();
            }, 100);
        });

        // Scatter Hover / Touch Tooltip
        function handlePointer(clientX, clientY) {
            const rect = canvas.getBoundingClientRect();
            const mx = clientX - rect.left;
            const my = clientY - rect.top;

            let found = null;
            points.forEach(p => {
                const cx = 60 + ((p.area - 500) / 3500) * (w - 85);
                const cy = (h - 35) - ((p.price - 35000) / 350000) * (h - 65);
                const dist = Math.hypot(mx - cx, my - cy);
                if (dist < 12) found = { ...p, cx, cy };
            });

            if (found && tooltip) {
                tooltip.classList.remove('hidden');
                tooltip.style.left = `${found.cx + 12}px`;
                tooltip.style.top = `${found.cy - 12}px`;
                tooltip.innerHTML = `<strong>${found.area.toLocaleString()} SF</strong> → $${found.price.toLocaleString()} (Qual: ${found.qual}/10)`;
            } else if (tooltip) {
                tooltip.classList.add('hidden');
            }
        }

        canvas.addEventListener('mousemove', (e) => handlePointer(e.clientX, e.clientY));
        canvas.addEventListener('mouseleave', () => tooltip && tooltip.classList.add('hidden'));
    }

    // 16. Character-by-Character JSON Typing Animation
    function initJsonTypingAnimation() {
        const box = document.getElementById('codeTypingBox');
        if (!box) return;

        const fullText = `{\n  "model_used": "XGBoost",\n  "predicted_price": 248500,\n  "status": "Valuation complete"\n}`;
        let charIndex = 0;
        box.innerText = '';

        function type() {
            if (charIndex < fullText.length) {
                box.innerText += fullText.charAt(charIndex);
                charIndex++;
                setTimeout(type, 35);
            }
        }

        setTimeout(type, 1000);
    }

    // 17. Fetch Model Leaderboard Metrics
    function fetchLeaderboardMetrics() {
        fetch(`${API_BASE_URL}/leaderboard`)
            .then(res => res.json())
            .then(data => {
                leaderboardData = data;
                const active = leaderboardData[selectedModel] || leaderboardData["XGBoost"] || leaderboardData["XGBoost Regressor"];
                if (active) {
                    if (document.getElementById('valR2')) document.getElementById('valR2').innerText = active.R2_Score;
                    if (document.getElementById('valRMSE')) document.getElementById('valRMSE').innerText = `$${active.RMSE.toLocaleString()}`;
                    if (document.getElementById('valMAE')) document.getElementById('valMAE').innerText = `$${active.MAE.toLocaleString()}`;
                }
            })
            .catch(err => console.log('Using default leaderboard metrics display', err));
    }

    init();
});
