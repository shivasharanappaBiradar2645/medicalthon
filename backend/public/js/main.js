// API Utility Functions
const API_URL = '/api';

async function apiRequest(method, path, data = null) {
    try {
        const options = {
            method: method,
            headers: {
                'Content-Type': 'application/json',
            },
        };
        if (data) {
            options.body = JSON.stringify(data);
        }
        const response = await fetch(`${API_URL}${path}`, options);
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `API request failed with status ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error(`Error during ${method} ${path}:`, error);
        throw error;
    }
}

const api = {
    get: (path) => apiRequest('GET', path),
    post: (path, data) => apiRequest('POST', path, data),
    put: (path, data) => apiRequest('PUT', path, data),
    del: (path) => apiRequest('DELETE', path),
};

// Specific API calls
const fetchPrescriptions = () => api.get('/prescriptions');
const createPrescription = (data) => api.post('/prescriptions', data);
const fetchInventory = (pharmacyId) => api.get(`/pharmacies/${pharmacyId}/inventory`);
const dispenseMedicine = (data) => api.post('/prescription-fills', data);
const fetchDistributors = () => api.get('/distributors');
const fetchRestockOrders = () => api.get('/restock-orders');
const updateRestockOrder = (id, data) => api.put(`/restock-orders/${id}`, data);
const fetchNotifications = () => api.get('/notifications');
const fetchMedicines = () => api.get('/medicines');
const fetchDoctors = () => api.get('/doctors');
const fetchPatients = () => api.get('/patients');
const fetchPharmacies = () => api.get('/pharmacies');
const logAdherence = (patientId, data) => api.post(`/patients/${patientId}/adherence-logs`, data);
const fetchAdherenceLogs = () => api.get('/adherence-logs');

// Helper Functions
const getAppRoot = () => document.getElementById('app-root');

const showAlert = (message, type = 'error') => {
    const alertBox = document.createElement('div');
    alertBox.className = `alert ${type}`;
    alertBox.textContent = message;
    getAppRoot().prepend(alertBox);
    setTimeout(() => alertBox.remove(), 5000);
};

const createHTMLElement = (tag, attributes = {}, children = []) => {
    const element = document.createElement(tag);
    for (const key in attributes) {
        if (key.startsWith('on') && typeof attributes[key] === 'function') {
            element.addEventListener(key.substring(2).toLowerCase(), attributes[key]);
        } else {
            element.setAttribute(key, attributes[key]);
        }
    }
    children.forEach(child => {
        if (typeof child === 'string') {
            element.appendChild(document.createTextNode(child));
        } else if (child) {
            element.appendChild(child);
        }
    });
    return element;
};

// Helper function to create status badge
const createStatusBadge = (status) => {
    const statusClass = status.toLowerCase().replace('_', '-');
    return createHTMLElement('span', { class: `status-badge status-${statusClass}` }, [status]);
};

// --- Rendering Functions ---

const renderDashboard = () => {
    const root = getAppRoot();
    root.innerHTML = ''; // Clear previous content

    const dashboardContent = createHTMLElement('div', { class: 'dashboard-welcome' }, [
        createHTMLElement('h2', {}, ['📊 Dashboard']),
        createHTMLElement('p', {}, ['Welcome to PalliaTrack!']),
        createHTMLElement('p', {}, ['Your comprehensive solution for managing prescriptions, inventory, and supply chain for palliative care medications.']),
        createHTMLElement('p', {}, ['Use the navigation buttons above to access different sections of the application.']),
    ]);
    root.appendChild(dashboardContent);
};

const renderPrescriptions = async () => {
    const root = getAppRoot();
    root.innerHTML = '<div class="loading-spinner"><h2>Loading Prescriptions...</h2></div>';

    try {
        const prescriptions = await fetchPrescriptions();
        const [doctors, patients, medicines] = await Promise.all([
            fetchDoctors(),
            fetchPatients(),
            fetchMedicines()
        ]);

        // Create lookup maps
        const doctorMap = new Map(doctors.map(d => [d.id, d]));
        const patientMap = new Map(patients.map(p => [p.id, p]));
        const medicineMap = new Map(medicines.map(m => [m.id, m]));

        root.innerHTML = '';
        const container = createHTMLElement('div', {}, [
            createHTMLElement('h2', {}, ['💊 Prescriptions']),
        ]);

        if (prescriptions.length === 0) {
            container.appendChild(createHTMLElement('div', { class: 'empty-state' }, [
                createHTMLElement('p', {}, ['No prescriptions found.'])
            ]));
        } else {
            const list = createHTMLElement('ul');
            prescriptions.forEach(p => {
                const doctor = doctorMap.get(p.doctorId);
                const patient = patientMap.get(p.patientId);

                const listItem = createHTMLElement('li', {}, [
                    createHTMLElement('h3', {}, [`Prescription #${p.id.substring(0, 8)}`]),
                    createHTMLElement('p', {}, [`Doctor: ${doctor ? `Dr. ${doctor.specialization}` : p.doctorId}`]),
                    createHTMLElement('p', {}, [`Patient: ${patient ? `Patient ${p.patientId.substring(0, 8)}` : p.patientId}`]),
                    createHTMLElement('p', {}, [
                        'Status: ',
                        createStatusBadge(p.status),
                        ` | Created: ${new Date(p.createdAt).toLocaleDateString()}`
                    ]),
                ]);

                if (p.notes) {
                    listItem.appendChild(createHTMLElement('p', {}, [`Notes: ${p.notes}`]));
                }

                if (p.prescriptionMedicines && p.prescriptionMedicines.length > 0) {
                    const medList = createHTMLElement('ul', {}, [
                        createHTMLElement('strong', {}, ['Prescribed Medicines:'])
                    ]);
                    p.prescriptionMedicines.forEach(med => {
                        const medicine = medicineMap.get(med.medicineId);
                        medList.appendChild(createHTMLElement('li', {}, [
                            `${medicine ? medicine.name : med.medicineId} - ${med.dosage}, ${med.frequency}, ${med.duration} days (Qty: ${med.quantityPrescribed})`
                        ]));
                    });
                    listItem.appendChild(medList);
                }
                list.appendChild(listItem);
            });
            container.appendChild(list);
        }
        root.appendChild(container);
    } catch (error) {
        root.innerHTML = '';
        showAlert(error.message, 'error');
    }
};

const renderCreatePrescription = async () => {
    const root = getAppRoot();
    root.innerHTML = '<div class="loading-spinner"><h2>Loading...</h2></div>';

    try {
        const [doctors, patients, medicines] = await Promise.all([
            fetchDoctors(),
            fetchPatients(),
            fetchMedicines()
        ]);

        root.innerHTML = '';
        const formContainer = createHTMLElement('div', {}, [
            createHTMLElement('h2', {}, ['✍️ Create New Prescription']),
        ]);

        const form = createHTMLElement('form', {
            onsubmit: async (event) => {
                event.preventDefault();
                const doctorId = document.getElementById('doctorId').value;
                const patientId = document.getElementById('patientId').value;
                const status = document.getElementById('status').value;
                const notes = document.getElementById('notes').value;

                const medicine = {
                    medicineId: document.getElementById('medicineId').value,
                    dosage: document.getElementById('dosage').value,
                    frequency: document.getElementById('frequency').value,
                    duration: parseInt(document.getElementById('duration').value),
                    quantityPrescribed: parseInt(document.getElementById('quantityPrescribed').value),
                };

                const prescriptionData = {
                    doctorId,
                    patientId,
                    status,
                    notes,
                    medicines: [medicine],
                };

                try {
                    await createPrescription(prescriptionData);
                    showAlert('Prescription created successfully!', 'success');
                    event.target.reset();
                    if (medicines.length > 0) {
                        document.getElementById('dosage').value = medicines[0].dosage;
                    }
                } catch (error) {
                    showAlert(error.message, 'error');
                }
            }
        });

        form.appendChild(createHTMLElement('div', { class: 'form-group' }, [
            createHTMLElement('label', { for: 'doctorId' }, ['Select Doctor']),
            createHTMLElement('select', { id: 'doctorId', required: true },
                doctors.map(d => createHTMLElement('option', { value: d.id }, [
                    `Dr. ${d.specialization} (ID: ${d.id.substring(0, 8)})`
                ]))
            ),
        ]));

        form.appendChild(createHTMLElement('div', { class: 'form-group' }, [
            createHTMLElement('label', { for: 'patientId' }, ['Select Patient']),
            createHTMLElement('select', { id: 'patientId', required: true },
                patients.map(p => createHTMLElement('option', { value: p.id }, [
                    `Patient ${p.id.substring(0, 8)} (User: ${p.userId})`
                ]))
            ),
        ]));

        form.appendChild(createHTMLElement('div', { class: 'form-group' }, [
            createHTMLElement('label', { for: 'status' }, ['Prescription Status']),
            createHTMLElement('select', { id: 'status' }, [
                createHTMLElement('option', { value: 'ACTIVE' }, ['Active']),
                createHTMLElement('option', { value: 'COMPLETED' }, ['Completed']),
                createHTMLElement('option', { value: 'CANCELLED' }, ['Cancelled']),
            ]),
        ]));

        form.appendChild(createHTMLElement('div', { class: 'form-group' }, [
            createHTMLElement('label', { for: 'notes' }, ['Additional Notes']),
            createHTMLElement('textarea', { id: 'notes', rows: '3', placeholder: 'Enter any special instructions or notes...' }),
        ]));

        form.appendChild(createHTMLElement('h4', {}, ['Medicine Details']));

        const medicineSelect = createHTMLElement('select', { id: 'medicineId', required: true },
            medicines.map(m => createHTMLElement('option', { value: m.id, 'data-dosage': m.dosage }, [
                `${m.name} (${m.dosage}) - ${m.manufacturer}`
            ]))
        );
        const dosageInput = createHTMLElement('input', { type: 'text', id: 'dosage', required: true, readonly: true });

        medicineSelect.addEventListener('change', (event) => {
            const selectedOption = event.target.options[event.target.selectedIndex];
            dosageInput.value = selectedOption.getAttribute('data-dosage');
        });

        form.appendChild(createHTMLElement('div', { class: 'form-group' }, [
            createHTMLElement('label', { for: 'medicineId' }, ['Select Medicine']),
            medicineSelect,
        ]));

        form.appendChild(createHTMLElement('div', { class: 'form-group' }, [
            createHTMLElement('label', { for: 'dosage' }, ['Dosage (auto-filled)']),
            dosageInput,
        ]));

        form.appendChild(createHTMLElement('div', { class: 'form-group' }, [
            createHTMLElement('label', { for: 'frequency' }, ['Frequency (e.g., "2 times daily")']),
            createHTMLElement('input', { type: 'text', id: 'frequency', required: true, placeholder: 'e.g., 2 times daily' }),
        ]));

        form.appendChild(createHTMLElement('div', { class: 'form-group' }, [
            createHTMLElement('label', { for: 'duration' }, ['Duration (days)']),
            createHTMLElement('input', { type: 'number', id: 'duration', required: true, min: '1', placeholder: 'e.g., 30' }),
        ]));

        form.appendChild(createHTMLElement('div', { class: 'form-group' }, [
            createHTMLElement('label', { for: 'quantityPrescribed' }, ['Quantity Prescribed']),
            createHTMLElement('input', { type: 'number', id: 'quantityPrescribed', required: true, min: '1', placeholder: 'e.g., 60' }),
        ]));

        form.appendChild(createHTMLElement('div', { class: 'form-group', style: 'margin-top: 20px;' }, [
            createHTMLElement('button', { type: 'submit' }, ['✅ Create Prescription']),
        ]));

        formContainer.appendChild(form);
        root.appendChild(formContainer);
        
        // Pre-fill dosage for the first medicine
        if (medicines.length > 0) {
            dosageInput.value = medicines[0].dosage;
        }

    } catch (error) {
        root.innerHTML = '';
        showAlert(error.message, 'error');
    }
};

const renderInventory = async () => {
    const root = getAppRoot();
    root.innerHTML = '<div class="loading-spinner"><h2>Loading Inventory...</h2></div>';

    try {
        const [pharmacies, medicines] = await Promise.all([
            fetchPharmacies(),
            fetchMedicines()
        ]);

        if (pharmacies.length === 0) {
            root.innerHTML = '<div class="empty-state"><h2>No pharmacies found. Please seed the database.</h2></div>';
            return;
        }

        const pharmacy = pharmacies[0];
        const inventoryItems = await fetchInventory(pharmacy.id);
        const medicineMap = new Map(medicines.map(m => [m.id, m]));
        
        root.innerHTML = '';
        const container = createHTMLElement('div', {}, [
            createHTMLElement('h2', {}, ['📦 Pharmacy Inventory']),
        ]);

        const infoCard = createHTMLElement('div', { class: 'info-card' }, [
            createHTMLElement('p', {}, [`📍 Pharmacy: ${pharmacy.name}`]),
            createHTMLElement('p', {}, [`📌 Location: ${pharmacy.location}`]),
        ]);
        container.appendChild(infoCard);

        if (inventoryItems.length === 0) {
            container.appendChild(createHTMLElement('div', { class: 'empty-state' }, [
                createHTMLElement('p', {}, ['No inventory items found for this pharmacy.'])
            ]));
        } else {
            const tableContainer = createHTMLElement('div', { class: 'table-container' });
            const table = createHTMLElement('table', {}, [
                createHTMLElement('thead', {}, [
                    createHTMLElement('tr', {}, [
                        createHTMLElement('th', {}, ['Medicine Name']),
                        createHTMLElement('th', {}, ['Batch Number']),
                        createHTMLElement('th', {}, ['Quantity']),
                        createHTMLElement('th', {}, ['Expiry Date']),
                        createHTMLElement('th', {}, ['Low Stock Alert']),
                        createHTMLElement('th', {}, ['Last Updated']),
                    ]),
                ]),
                createHTMLElement('tbody', {}, inventoryItems.map(item => {
                    const medicine = medicineMap.get(item.medicineId);
                    const isLowStock = item.quantity <= item.lowStockThreshold;
                    
                    return createHTMLElement('tr', {}, [
                        createHTMLElement('td', {}, [medicine ? medicine.name : item.medicineId]),
                        createHTMLElement('td', {}, [item.batchNumber]),
                        createHTMLElement('td', {}, [
                            isLowStock ? `⚠️ ${item.quantity}` : item.quantity.toString()
                        ]),
                        createHTMLElement('td', {}, [new Date(item.expiryDate).toLocaleDateString()]),
                        createHTMLElement('td', {}, [item.lowStockThreshold.toString()]),
                        createHTMLElement('td', {}, [new Date(item.lastUpdated).toLocaleString()]),
                    ]);
                })),
            ]);
            tableContainer.appendChild(table);
            container.appendChild(tableContainer);
        }
        root.appendChild(container);
    } catch (error) {
        root.innerHTML = '';
        showAlert(error.message, 'error');
    }
};

const renderDispenseMedicine = async () => {
    const root = getAppRoot();
    root.innerHTML = '<div class="loading-spinner"><h2>Loading...</h2></div>';

    try {
        const [pharmacies, prescriptions, medicines] = await Promise.all([
            fetchPharmacies(),
            fetchPrescriptions(),
            fetchMedicines()
        ]);

        const medicineMap = new Map(medicines.map(m => [m.id, m]));

        root.innerHTML = '';
        const formContainer = createHTMLElement('div', {}, [
            createHTMLElement('h2', {}, ['💉 Dispense Medicine']),
        ]);

        const form = createHTMLElement('form', {
            onsubmit: async (event) => {
                event.preventDefault();
                const pharmacyId = document.getElementById('dispensePharmacyId').value;
                const prescriptionMedicineId = document.getElementById('dispensePrescriptionMedicineId').value;
                const quantityDispensed = parseInt(document.getElementById('dispenseQuantityDispensed').value);

                const dispenseData = {
                    pharmacyId,
                    prescriptionMedicineId,
                    quantityDispensed,
                };

                try {
                    await dispenseMedicine(dispenseData);
                    showAlert('Medicine dispensed successfully!', 'success');
                    event.target.reset();
                } catch (error) {
                    showAlert(error.message, 'error');
                }
            }
        });

        form.appendChild(createHTMLElement('div', { class: 'form-group' }, [
            createHTMLElement('label', { for: 'dispensePharmacyId' }, ['Select Pharmacy']),
            createHTMLElement('select', { id: 'dispensePharmacyId', required: true },
                pharmacies.map(p => createHTMLElement('option', { value: p.id }, [`${p.name} (${p.location})`]))
            ),
        ]));

        const prescriptionMedicines = [];
        if (prescriptions && Array.isArray(prescriptions)) {
            for (const p of prescriptions) {
                if (p.prescriptionMedicines && Array.isArray(p.prescriptionMedicines)) {
                    for (const pm of p.prescriptionMedicines) {
                        prescriptionMedicines.push({ ...pm, prescriptionId: p.id });
                    }
                }
            }
        }

        const selectEl = createHTMLElement('select', { id: 'dispensePrescriptionMedicineId', required: true });
        if (prescriptionMedicines.length === 0) {
            selectEl.appendChild(createHTMLElement('option', { value: '' }, ['No prescription medicines available']));
        } else {
            prescriptionMedicines.forEach(pm => {
                const medicine = medicineMap.get(pm.medicineId);
                selectEl.appendChild(createHTMLElement('option', { value: pm.id }, [
                    `Rx #${pm.prescriptionId.substring(0, 8)} - ${medicine ? medicine.name : pm.medicineId} (${pm.dosage})`
                ]));
            });
        }

        form.appendChild(createHTMLElement('div', { class: 'form-group' }, [
            createHTMLElement('label', { for: 'dispensePrescriptionMedicineId' }, ['Select Prescription Medicine']),
            selectEl,
        ]));

        form.appendChild(createHTMLElement('div', { class: 'form-group' }, [
            createHTMLElement('label', { for: 'dispenseQuantityDispensed' }, ['Quantity to Dispense']),
            createHTMLElement('input', { 
                type: 'number', 
                id: 'dispenseQuantityDispensed', 
                required: true, 
                min: '1',
                placeholder: 'Enter quantity'
            }),
        ]));

        form.appendChild(createHTMLElement('div', { class: 'form-group', style: 'margin-top: 20px;' }, [
            createHTMLElement('button', { type: 'submit' }, ['✅ Dispense Medicine']),
        ]));

        formContainer.appendChild(form);
        root.appendChild(formContainer);

    } catch (error) {
        root.innerHTML = '';
        showAlert(error.message, 'error');
    }
};

const renderDistributors = async () => {
    const root = getAppRoot();
    root.innerHTML = '<div class="loading-spinner"><h2>Loading Distributors...</h2></div>';

    try {
        const distributors = await fetchDistributors();
        root.innerHTML = '';
        const container = createHTMLElement('div', {}, [
            createHTMLElement('h2', {}, ['🚚 Distributors']),
        ]);

        if (distributors.length === 0) {
            container.appendChild(createHTMLElement('div', { class: 'empty-state' }, [
                createHTMLElement('p', {}, ['No distributors found.'])
            ]));
        } else {
            const tableContainer = createHTMLElement('div', { class: 'table-container' });
            const table = createHTMLElement('table', {}, [
                createHTMLElement('thead', {}, [
                    createHTMLElement('tr', {}, [
                        createHTMLElement('th', {}, ['Distributor Name']),
                        createHTMLElement('th', {}, ['Email']),
                        createHTMLElement('th', {}, ['Contact Number']),
                    ]),
                ]),
                createHTMLElement('tbody', {}, distributors.map(d =>
                    createHTMLElement('tr', {}, [
                        createHTMLElement('td', {}, [d.name]),
                        createHTMLElement('td', {}, [d.email]),
                        createHTMLElement('td', {}, [d.contactNumber]),
                    ])
                )),
            ]);
            tableContainer.appendChild(table);
            container.appendChild(tableContainer);
        }
        root.appendChild(container);
    } catch (error) {
        root.innerHTML = '';
        showAlert(error.message, 'error');
    }
};

const renderRestockOrders = async () => {
    const root = getAppRoot();
    root.innerHTML = '<div class="loading-spinner"><h2>Loading Restock Orders...</h2></div>';

    try {
        const [restockOrders, pharmacies, distributors, medicines] = await Promise.all([
            fetchRestockOrders(),
            fetchPharmacies(),
            fetchDistributors(),
            fetchMedicines()
        ]);

        const pharmacyMap = new Map(pharmacies.map(p => [p.id, p]));
        const distributorMap = new Map(distributors.map(d => [d.id, d]));
        const medicineMap = new Map(medicines.map(m => [m.id, m]));

        root.innerHTML = '';
        const container = createHTMLElement('div', {}, [
            createHTMLElement('h2', {}, ['📋 Restock Orders']),
        ]);

        if (restockOrders.length === 0) {
            container.appendChild(createHTMLElement('div', { class: 'empty-state' }, [
                createHTMLElement('p', {}, ['No restock orders found.'])
            ]));
        } else {
            const tableContainer = createHTMLElement('div', { class: 'table-container' });
            const table = createHTMLElement('table', {}, [
                createHTMLElement('thead', {}, [
                    createHTMLElement('tr', {}, [
                        createHTMLElement('th', {}, ['Order ID']),
                        createHTMLElement('th', {}, ['Pharmacy']),
                        createHTMLElement('th', {}, ['Distributor']),
                        createHTMLElement('th', {}, ['Medicine']),
                        createHTMLElement('th', {}, ['Quantity']),
                        createHTMLElement('th', {}, ['Status']),
                        createHTMLElement('th', {}, ['Created At']),
                    ]),
                ]),
                createHTMLElement('tbody', {}, restockOrders.map(order => {
                    const pharmacy = pharmacyMap.get(order.pharmacyId);
                    const distributor = distributorMap.get(order.distributorId);
                    const medicine = medicineMap.get(order.medicineId);

                    return createHTMLElement('tr', {}, [
                        createHTMLElement('td', {}, [`#${order.id.substring(0, 8)}`]),
                        createHTMLElement('td', {}, [pharmacy ? pharmacy.name : order.pharmacyId.substring(0, 8)]),
                        createHTMLElement('td', {}, [distributor ? distributor.name : order.distributorId.substring(0, 8)]),
                        createHTMLElement('td', {}, [medicine ? medicine.name : order.medicineId.substring(0, 8)]),
                        createHTMLElement('td', {}, [order.quantityOrdered.toString()]),
                        createHTMLElement('td', {}, [createStatusBadge(order.status)]),
                        createHTMLElement('td', {}, [new Date(order.createdAt).toLocaleDateString()]),
                    ]);
                })),
            ]);
            tableContainer.appendChild(table);
            container.appendChild(tableContainer);
        }
        root.appendChild(container);
    } catch (error) {
        root.innerHTML = '';
        showAlert(error.message, 'error');
    }
};

const renderNotifications = async () => {
    const root = getAppRoot();
    root.innerHTML = '<div class="loading-spinner"><h2>Loading Notifications...</h2></div>';

    try {
        const notifications = await fetchNotifications();
        root.innerHTML = '';
        const container = createHTMLElement('div', {}, [
            createHTMLElement('h2', {}, ['🔔 Notifications']),
        ]);

        if (notifications.length === 0) {
            container.appendChild(createHTMLElement('div', { class: 'empty-state' }, [
                createHTMLElement('p', {}, ['No notifications found.'])
            ]));
        } else {
            const list = createHTMLElement('ul');
            notifications.forEach(n => {
                const icon = n.isRead ? '✓' : '🔴';
                list.appendChild(createHTMLElement('li', {}, [
                    createHTMLElement('h3', {}, [`${icon} ${n.type}`]),
                    createHTMLElement('p', {}, [n.message]),
                    createHTMLElement('p', {}, [`Created: ${new Date(n.createdAt).toLocaleString()} | Status: ${n.isRead ? 'Read' : 'Unread'}`]),
                ]));
            });
            container.appendChild(list);
        }
        root.appendChild(container);
    } catch (error) {
        root.innerHTML = '';
        showAlert(error.message, 'error');
    }
};

const renderMedicines = async () => {
    const root = getAppRoot();
    root.innerHTML = '<div class="loading-spinner"><h2>Loading Medicines...</h2></div>';

    try {
        const medicines = await fetchMedicines();
        root.innerHTML = '';
        const container = createHTMLElement('div', {}, [
            createHTMLElement('h2', {}, ['💊 Medicines Catalog']),
        ]);

        if (medicines.length === 0) {
            container.appendChild(createHTMLElement('div', { class: 'empty-state' }, [
                createHTMLElement('p', {}, ['No medicines found.'])
            ]));
        } else {
            const tableContainer = createHTMLElement('div', { class: 'table-container' });
            const table = createHTMLElement('table', {}, [
                createHTMLElement('thead', {}, [
                    createHTMLElement('tr', {}, [
                        createHTMLElement('th', {}, ['Medicine Name']),
                        createHTMLElement('th', {}, ['Manufacturer']),
                        createHTMLElement('th', {}, ['Type']),
                        createHTMLElement('th', {}, ['Dosage']),
                    ]),
                ]),
                createHTMLElement('tbody', {}, medicines.map(m =>
                    createHTMLElement('tr', {}, [
                        createHTMLElement('td', {}, [m.name]),
                        createHTMLElement('td', {}, [m.manufacturer]),
                        createHTMLElement('td', {}, [m.type]),
                        createHTMLElement('td', {}, [m.dosage]),
                    ])
                )),
            ]);
            tableContainer.appendChild(table);
            container.appendChild(tableContainer);
        }
        root.appendChild(container);
    } catch (error) {
        root.innerHTML = '';
        showAlert(error.message, 'error');
    }
};

const renderDoctors = async () => {
    const root = getAppRoot();
    root.innerHTML = '<div class="loading-spinner"><h2>Loading Doctors...</h2></div>';

    try {
        const doctors = await fetchDoctors();
        root.innerHTML = '';
        const container = createHTMLElement('div', {}, [
            createHTMLElement('h2', {}, ['👨‍⚕️ Doctors']),
        ]);

        if (doctors.length === 0) {
            container.appendChild(createHTMLElement('div', { class: 'empty-state' }, [
                createHTMLElement('p', {}, ['No doctors found.'])
            ]));
        } else {
            const tableContainer = createHTMLElement('div', { class: 'table-container' });
            const table = createHTMLElement('table', {}, [
                createHTMLElement('thead', {}, [
                    createHTMLElement('tr', {}, [
                        createHTMLElement('th', {}, ['Doctor ID']),
                        createHTMLElement('th', {}, ['Specialization']),
                        createHTMLElement('th', {}, ['User ID']),
                    ]),
                ]),
                createHTMLElement('tbody', {}, doctors.map(d =>
                    createHTMLElement('tr', {}, [
                        createHTMLElement('td', {}, [`Dr. ${d.id.substring(0, 8)}`]),
                        createHTMLElement('td', {}, [d.specialization]),
                        createHTMLElement('td', {}, [d.userId]),
                    ])
                )),
            ]);
            tableContainer.appendChild(table);
            container.appendChild(tableContainer);
        }
        root.appendChild(container);
    } catch (error) {
        root.innerHTML = '';
        showAlert(error.message, 'error');
    }
};

const renderPatients = async () => {
    const root = getAppRoot();
    root.innerHTML = '<div class="loading-spinner"><h2>Loading Patients...</h2></div>';

    try {
        const patients = await fetchPatients();
        root.innerHTML = '';
        const container = createHTMLElement('div', {}, [
            createHTMLElement('h2', {}, ['👥 Patients']),
        ]);

        if (patients.length === 0) {
            container.appendChild(createHTMLElement('div', { class: 'empty-state' }, [
                createHTMLElement('p', {}, ['No patients found.'])
            ]));
        } else {
            const tableContainer = createHTMLElement('div', { class: 'table-container' });
            const table = createHTMLElement('table', {}, [
                createHTMLElement('thead', {}, [
                    createHTMLElement('tr', {}, [
                        createHTMLElement('th', {}, ['Patient ID']),
                        createHTMLElement('th', {}, ['User ID']),
                        createHTMLElement('th', {}, ['Contact Number']),
                        createHTMLElement('th', {}, ['Address']),
                    ]),
                ]),
                createHTMLElement('tbody', {}, patients.map(p =>
                    createHTMLElement('tr', {}, [
                        createHTMLElement('td', {}, [`Patient ${p.id.substring(0, 8)}`]),
                        createHTMLElement('td', {}, [p.userId]),
                        createHTMLElement('td', {}, [p.contactNumber]),
                        createHTMLElement('td', {}, [p.address]),
                    ])
                )),
            ]);
            tableContainer.appendChild(table);
            container.appendChild(tableContainer);
        }
        root.appendChild(container);
    } catch (error) {
        root.innerHTML = '';
        showAlert(error.message, 'error');
    }
};

const renderPharmacies = async () => {
    const root = getAppRoot();
    root.innerHTML = '<div class="loading-spinner"><h2>Loading Pharmacies...</h2></div>';

    try {
        const pharmacies = await fetchPharmacies();
        root.innerHTML = '';
        const container = createHTMLElement('div', {}, [
            createHTMLElement('h2', {}, ['🏥 Pharmacies']),
        ]);

        if (pharmacies.length === 0) {
            container.appendChild(createHTMLElement('div', { class: 'empty-state' }, [
                createHTMLElement('p', {}, ['No pharmacies found.'])
            ]));
        } else {
            const tableContainer = createHTMLElement('div', { class: 'table-container' });
            const table = createHTMLElement('table', {}, [
                createHTMLElement('thead', {}, [
                    createHTMLElement('tr', {}, [
                        createHTMLElement('th', {}, ['Pharmacy Name']),
                        createHTMLElement('th', {}, ['Location']),
                        createHTMLElement('th', {}, ['Contact']),
                        createHTMLElement('th', {}, ['Manager ID']),
                    ]),
                ]),
                createHTMLElement('tbody', {}, pharmacies.map(p =>
                    createHTMLElement('tr', {}, [
                        createHTMLElement('td', {}, [p.name]),
                        createHTMLElement('td', {}, [p.location]),
                        createHTMLElement('td', {}, [p.contact]),
                        createHTMLElement('td', {}, [p.userId]),
                    ])
                )),
            ]);
            tableContainer.appendChild(table);
            container.appendChild(tableContainer);
        }
        root.appendChild(container);
    } catch (error) {
        root.innerHTML = '';
        showAlert(error.message, 'error');
    }
};

const renderPatientAdherence = async () => {
    const root = getAppRoot();
    root.innerHTML = '<div class="loading-spinner"><h2>Loading...</h2></div>';

    try {
        const [patients, prescriptions, medicines] = await Promise.all([
            fetchPatients(),
            fetchPrescriptions(),
            fetchMedicines()
        ]);

        const medicineMap = new Map(medicines.map(m => [m.id, m]));

        root.innerHTML = '';
        const container = createHTMLElement('div', {}, [
            createHTMLElement('h2', {}, ['📊 Patient Adherence Log']),
        ]);

        const patientSelect = createHTMLElement('select', { id: 'adherencePatientId' });
        patients.forEach(p => {
            patientSelect.appendChild(createHTMLElement('option', { value: p.id }, [
                `Patient ${p.id.substring(0, 8)} (User: ${p.userId})`
            ]));
        });
        
        container.appendChild(createHTMLElement('div', { class: 'form-group' }, [
            createHTMLElement('label', { for: 'adherencePatientId' }, ['Select Patient']),
            patientSelect,
        ]));

        const medicinesContainer = createHTMLElement('div', { id: 'adherenceMedicinesContainer' });
        container.appendChild(medicinesContainer);

        const renderPatientMedicines = () => {
            medicinesContainer.innerHTML = '';
            const selectedPatientId = patientSelect.value;
            const patientPrescriptions = prescriptions.filter(p => p.patientId === selectedPatientId);
            const patientMedicines = patientPrescriptions.flatMap(p => p.prescriptionMedicines || []);

            if (patientMedicines.length === 0) {
                medicinesContainer.appendChild(createHTMLElement('div', { class: 'empty-state' }, [
                    createHTMLElement('p', {}, ['No prescribed medicines found for this patient.'])
                ]));
                return;
            }

            const tableContainer = createHTMLElement('div', { class: 'table-container' });
            const table = createHTMLElement('table', {}, [
                createHTMLElement('thead', {}, [
                    createHTMLElement('tr', {}, [
                        createHTMLElement('th', {}, ['Prescription']),
                        createHTMLElement('th', {}, ['Medicine']),
                        createHTMLElement('th', {}, ['Dosage']),
                        createHTMLElement('th', {}, ['Action']),
                    ]),
                ]),
                createHTMLElement('tbody', {}, patientMedicines.map(pm => {
                    const medicine = medicineMap.get(pm.medicineId);
                    return createHTMLElement('tr', {}, [
                        createHTMLElement('td', {}, [`Rx #${pm.prescriptionId.substring(0, 8)}`]),
                        createHTMLElement('td', {}, [medicine ? medicine.name : pm.medicineId]),
                        createHTMLElement('td', {}, [pm.dosage]),
                        createHTMLElement('td', {}, [
                            createHTMLElement('button', {
                                onclick: async () => {
                                    const adherenceData = {
                                        medicineId: pm.medicineId,
                                        takenAt: new Date(),
                                        missed: false,
                                    };
                                    try {
                                        await logAdherence(selectedPatientId, adherenceData);
                                        showAlert('Adherence logged successfully!', 'success');
                                    } catch (error) {
                                        showAlert(error.message, 'error');
                                    }
                                }
                            }, ['✅ Log Dose Taken']),
                        ]),
                    ]);
                })),
            ]);
            tableContainer.appendChild(table);
            medicinesContainer.appendChild(tableContainer);
        };

        patientSelect.addEventListener('change', renderPatientMedicines);
        root.appendChild(container);
        renderPatientMedicines(); // Initial render

    } catch (error) {
        root.innerHTML = '';
        showAlert(error.message, 'error');
    }
};

const renderAdherenceLogs = async () => {
    const root = getAppRoot();
    root.innerHTML = '<div class="loading-spinner"><h2>Loading Adherence Logs...</h2></div>';

    try {
        const adherenceLogs = await fetchAdherenceLogs();
        root.innerHTML = '';
        const container = createHTMLElement('div', {}, [
            createHTMLElement('h2', {}, ['📈 Adherence Logs']),
        ]);

        if (adherenceLogs.length === 0) {
            container.appendChild(createHTMLElement('div', { class: 'empty-state' }, [
                createHTMLElement('p', {}, ['No adherence logs found.'])
            ]));
        } else {
            const tableContainer = createHTMLElement('div', { class: 'table-container' });
            const table = createHTMLElement('table', {}, [
                createHTMLElement('thead', {}, [
                    createHTMLElement('tr', {}, [
                        createHTMLElement('th', {}, ['Patient Name']),
                        createHTMLElement('th', {}, ['Medicine']),
                        createHTMLElement('th', {}, ['Taken At']),
                        createHTMLElement('th', {}, ['Status']),
                        createHTMLElement('th', {}, ['Remarks']),
                    ]),
                ]),
                createHTMLElement('tbody', {}, adherenceLogs.map(log =>
                    createHTMLElement('tr', {}, [
                        createHTMLElement('td', {}, [log.patient.user.name]),
                        createHTMLElement('td', {}, [log.medicine.name]),
                        createHTMLElement('td', {}, [new Date(log.takenAt).toLocaleString()]),
                        createHTMLElement('td', {}, [log.missed ? '❌ Missed' : '✅ Taken']),
                        createHTMLElement('td', {}, [log.remarks || '-']),
                    ])
                )),
            ]);
            tableContainer.appendChild(table);
            container.appendChild(tableContainer);
        }
        root.appendChild(container);
    } catch (error) {
        root.innerHTML = '';
        showAlert(error.message, 'error');
    }
};

const renderDistributorDashboard = async () => {
    const root = getAppRoot();
    root.innerHTML = '<div class="loading-spinner"><h2>Loading Distributor Dashboard...</h2></div>';

    try {
        const [restockOrders, pharmacies, medicines] = await Promise.all([
            fetchRestockOrders(),
            fetchPharmacies(),
            fetchMedicines()
        ]);

        const pharmacyMap = new Map(pharmacies.map(p => [p.id, p]));
        const medicineMap = new Map(medicines.map(m => [m.id, m]));

        root.innerHTML = '';
        const container = createHTMLElement('div', {}, [
            createHTMLElement('h2', {}, ['🚛 Distributor Dashboard']),
        ]);

        if (restockOrders.length === 0) {
            container.appendChild(createHTMLElement('div', { class: 'empty-state' }, [
                createHTMLElement('p', {}, ['No restock orders found.'])
            ]));
        } else {
            const tableContainer = createHTMLElement('div', { class: 'table-container' });
            const table = createHTMLElement('table', {}, [
                createHTMLElement('thead', {}, [
                    createHTMLElement('tr', {}, [
                        createHTMLElement('th', {}, ['Order ID']),
                        createHTMLElement('th', {}, ['Pharmacy']),
                        createHTMLElement('th', {}, ['Medicine']),
                        createHTMLElement('th', {}, ['Quantity']),
                        createHTMLElement('th', {}, ['Status']),
                        createHTMLElement('th', {}, ['Actions']),
                    ]),
                ]),
                createHTMLElement('tbody', {}, restockOrders.map(order => {
                    const pharmacy = pharmacyMap.get(order.pharmacyId);
                    const medicine = medicineMap.get(order.medicineId);

                    return createHTMLElement('tr', {}, [
                        createHTMLElement('td', {}, [`#${order.id.substring(0, 8)}`]),
                        createHTMLElement('td', {}, [pharmacy ? pharmacy.name : order.pharmacyId.substring(0, 8)]),
                        createHTMLElement('td', {}, [medicine ? medicine.name : order.medicineId.substring(0, 8)]),
                        createHTMLElement('td', {}, [order.quantityOrdered.toString()]),
                        createHTMLElement('td', {}, [createStatusBadge(order.status)]),
                        createHTMLElement('td', {}, [
                            createHTMLElement('button', {
                                onclick: async () => {
                                    try {
                                        await updateRestockOrder(order.id, { status: 'SHIPPED' });
                                        showAlert('Order marked as SHIPPED!', 'success');
                                        renderDistributorDashboard();
                                    } catch (error) {
                                        showAlert(error.message, 'error');
                                    }
                                }
                            }, ['📦 Mark Shipped']),
                            createHTMLElement('button', {
                                onclick: async () => {
                                    try {
                                        await updateRestockOrder(order.id, { status: 'COMPLETED' });
                                        showAlert('Order marked as COMPLETED!', 'success');
                                        renderDistributorDashboard();
                                    } catch (error) {
                                        showAlert(error.message, 'error');
                                    }
                                }
                            }, ['✅ Mark Completed']),
                        ]),
                    ]);
                })),
            ]);
            tableContainer.appendChild(table);
            container.appendChild(tableContainer);
        }
        root.appendChild(container);
    } catch (error) {
        root.innerHTML = '';
        showAlert(error.message, 'error');
    }
};

// Initial render
document.addEventListener('DOMContentLoaded', renderDashboard);