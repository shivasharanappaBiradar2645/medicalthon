// API Utility Functions
const API_URL = 'http://localhost:3000/api';

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
        } else {
            element.appendChild(child);
        }
    });
    return element;
};

// --- Rendering Functions ---

const renderDashboard = () => {
    const root = getAppRoot();
    root.innerHTML = ''; // Clear previous content

    const dashboardContent = createHTMLElement('div', {}, [
        createHTMLElement('h2', {}, ['Dashboard']),
        createHTMLElement('p', {}, ['Welcome to the Medicalthon App!']),
        createHTMLElement('p', {}, ['This is your central hub for managing prescriptions, inventory, and supply chain for palliative care drugs.']),
        createHTMLElement('p', {}, ['Use the navigation buttons to access different sections of the application.']),
    ]);
    root.appendChild(dashboardContent);
};

const renderPrescriptions = async () => {
    const root = getAppRoot();
    root.innerHTML = '<h2>Loading Prescriptions...</h2>';

    try {
        const prescriptions = await fetchPrescriptions();
        root.innerHTML = '';
        const container = createHTMLElement('div', {}, [
            createHTMLElement('h2', {}, ['Prescriptions']),
        ]);

        if (prescriptions.length === 0) {
            container.appendChild(createHTMLElement('p', {}, ['No prescriptions found.']));
        } else {
            const list = createHTMLElement('ul');
            prescriptions.forEach(p => {
                const listItem = createHTMLElement('li', {}, [
                    createHTMLElement('h3', {}, [`Prescription ID: ${p.id}`]),
                    createHTMLElement('p', {}, [`Doctor ID: ${p.doctorId}`]),
                    createHTMLElement('p', {}, [`Patient ID: ${p.patientId}`]),
                    createHTMLElement('p', {}, [`Status: ${p.status} | Created: ${new Date(p.createdAt).toLocaleDateString()}`]),
                    p.notes ? createHTMLElement('p', {}, [`Notes: ${p.notes}`]) : '',
                ]);

                if (p.prescriptionMedicines && p.prescriptionMedicines.length > 0) {
                    const medList = createHTMLElement('ul', {}, [createHTMLElement('strong', {}, ['Medicines:'])]);
                    p.prescriptionMedicines.forEach(med => {
                        medList.appendChild(createHTMLElement('li', {}, [
                            `Prescription Medicine ID: ${med.id}, Medicine ID: ${med.medicineId}, Dosage: ${med.dosage}, Freq: ${med.frequency}, Dur: ${med.duration} days, Qty: ${med.quantityPrescribed}`
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
    root.innerHTML = '<h2>Loading...</h2>';

    try {
        const doctors = await fetchDoctors();
        const patients = await fetchPatients();
        const medicines = await fetchMedicines();

        root.innerHTML = '';
        const formContainer = createHTMLElement('div', {}, [
            createHTMLElement('h2', {}, ['Create New Prescription']),
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
                } catch (error) {
                    showAlert(error.message, 'error');
                }
            }
        });

        form.appendChild(createHTMLElement('div', { class: 'form-group' }, [
            createHTMLElement('label', { for: 'doctorId' }, ['Doctor']),
            createHTMLElement('select', { id: 'doctorId', required: true },
                doctors.map(d => createHTMLElement('option', { value: d.id }, [`${d.id} (User: ${d.userId})`]))
            ),
        ]));
        form.appendChild(createHTMLElement('div', { class: 'form-group' }, [
            createHTMLElement('label', { for: 'patientId' }, ['Patient']),
            createHTMLElement('select', { id: 'patientId', required: true },
                patients.map(p => createHTMLElement('option', { value: p.id }, [`${p.id} (User: ${p.userId})`]))
            ),
        ]));
        form.appendChild(createHTMLElement('div', { class: 'form-group' }, [
            createHTMLElement('label', { for: 'status' }, ['Status']),
            createHTMLElement('select', { id: 'status' }, [
                createHTMLElement('option', { value: 'ACTIVE' }, ['Active']),
                createHTMLElement('option', { value: 'COMPLETED' }, ['Completed']),
                createHTMLElement('option', { value: 'CANCELLED' }, ['Cancelled']),
            ]),
        ]));
        form.appendChild(createHTMLElement('div', { class: 'form-group' }, [
            createHTMLElement('label', { for: 'notes' }, ['Notes']),
            createHTMLElement('textarea', { id: 'notes', rows: '3' }),
        ]));

        form.appendChild(createHTMLElement('h4', {}, ['Medicine']));
        const medicineSelect = createHTMLElement('select', { id: 'medicineId', required: true },
            medicines.map(m => createHTMLElement('option', { value: m.id, 'data-dosage': m.dosage }, [`${m.name} (${m.dosage})`]))
        );
        const dosageInput = createHTMLElement('input', { type: 'text', id: 'dosage', required: true, readonly: true });

        medicineSelect.addEventListener('change', (event) => {
            const selectedOption = event.target.options[event.target.selectedIndex];
            dosageInput.value = selectedOption.getAttribute('data-dosage');
        });

        form.appendChild(createHTMLElement('div', { class: 'form-group' }, [
            createHTMLElement('label', { for: 'medicineId' }, ['Medicine']),
            medicineSelect,
        ]));
        form.appendChild(createHTMLElement('div', { class: 'form-group' }, [
            createHTMLElement('label', { for: 'dosage' }, ['Dosage']),
            dosageInput,
        ]));
        form.appendChild(createHTMLElement('div', { class: 'form-group' }, [
            createHTMLElement('label', { for: 'frequency' }, ['Frequency']),
            createHTMLElement('input', { type: 'text', id: 'frequency', required: true }),
        ]));
        form.appendChild(createHTMLElement('div', { class: 'form-group' }, [
            createHTMLElement('label', { for: 'duration' }, ['Duration (days)']),
            createHTMLElement('input', { type: 'number', id: 'duration', required: true }),
        ]));
        form.appendChild(createHTMLElement('div', { class: 'form-group' }, [
            createHTMLElement('label', { for: 'quantityPrescribed' }, ['Quantity Prescribed']),
            createHTMLElement('input', { type: 'number', id: 'quantityPrescribed', required: true }),
        ]));

        form.appendChild(createHTMLElement('div', { class: 'form-group', style: 'margin-top: 20px;' }, [
            createHTMLElement('button', { type: 'submit' }, ['Create Prescription']),
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
    root.innerHTML = '<h2>Loading Inventory...</h2>';

    try {
        const pharmacies = await fetchPharmacies();
        if (pharmacies.length === 0) {
            root.innerHTML = '<h2>No pharmacies found. Please seed the database.</h2>';
            return;
        }
        const pharmacy = pharmacies[0]; // Use the first pharmacy for this demo
        const PHARMACY_ID = pharmacy.id;

        const inventoryItems = await fetchInventory(PHARMACY_ID);
        
        root.innerHTML = '';
        const container = createHTMLElement('div', {}, [
            createHTMLElement('h2', {}, ['Pharmacy Inventory']),
            createHTMLElement('p', {}, [`Displaying inventory for: ${pharmacy.name} (ID: ${PHARMACY_ID})`]),
        ]);

        if (inventoryItems.length === 0) {
            container.appendChild(createHTMLElement('p', {}, ['No inventory items found for this pharmacy.']));
        } else {
            const table = createHTMLElement('table', {}, [
                createHTMLElement('thead', {}, [
                    createHTMLElement('tr', {}, [
                        createHTMLElement('th', {}, ['Inventory ID']),
                        createHTMLElement('th', {}, ['Medicine ID']),
                        createHTMLElement('th', {}, ['Batch Number']),
                        createHTMLElement('th', {}, ['Quantity']),
                        createHTMLElement('th', {}, ['Expiry Date']),
                        createHTMLElement('th', {}, ['Low Stock Threshold']),
                        createHTMLElement('th', {}, ['Last Updated']),
                    ]),
                ]),
                createHTMLElement('tbody', {}, inventoryItems.map(item =>
                    createHTMLElement('tr', {}, [
                        createHTMLElement('td', {}, [item.id]),
                        createHTMLElement('td', {}, [item.medicineId]),
                        createHTMLElement('td', {}, [item.batchNumber]),
                        createHTMLElement('td', {}, [item.quantity.toString()]),
                        createHTMLElement('td', {}, [new Date(item.expiryDate).toLocaleDateString()]),
                        createHTMLElement('td', {}, [item.lowStockThreshold.toString()]),
                        createHTMLElement('td', {}, [new Date(item.lastUpdated).toLocaleString()]),
                    ])
                )),
            ]);
            container.appendChild(table);
        }
        root.appendChild(container);
    } catch (error) {
        root.innerHTML = '';
        showAlert(error.message, 'error');
    }
};

const renderDispenseMedicine = async () => {
    const root = getAppRoot();
    root.innerHTML = '<h2>Loading...</h2>';

    try {
        const pharmacies = await fetchPharmacies();
        const prescriptions = await fetchPrescriptions();

        console.log('--- Step 2: Data fetched ---');
        console.log('Pharmacies:', pharmacies);
        console.log('Prescriptions:', prescriptions);

        root.innerHTML = '';
        const formContainer = createHTMLElement('div', {}, [
            createHTMLElement('h2', {}, ['Dispense Medicine']),
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
            createHTMLElement('label', { for: 'dispensePharmacyId' }, ['Pharmacy']),
            createHTMLElement('select', { id: 'dispensePharmacyId', required: true },
                pharmacies.map(p => createHTMLElement('option', { value: p.id }, [`${p.name} (ID: ${p.id})`]))
            ),
        ]));

        console.log('--- Step 3: Processing prescriptions ---');
        const prescriptionMedicines = [];
        if (prescriptions && Array.isArray(prescriptions)) {
            for (const p of prescriptions) {
                console.log(`Processing prescription ID: ${p.id}`);
                if (p.prescriptionMedicines && Array.isArray(p.prescriptionMedicines)) {
                    console.log(`Found ${p.prescriptionMedicines.length} medicines for prescription ${p.id}`);
                    for (const pm of p.prescriptionMedicines) {
                        console.log('Adding medicine to dropdown list:', pm);
                        prescriptionMedicines.push({ ...pm, prescriptionId: p.id });
                    }
                } else {
                    console.log(`No medicines found for prescription ${p.id}`);
                }
            }
        } else {
            console.log('Prescriptions array is empty or not an array.');
        }
        console.log('--- Step 4: Final list of prescription medicines ---');
        console.log(prescriptionMedicines);

        const selectEl = createHTMLElement('select', { id: 'dispensePrescriptionMedicineId', required: true });
        if (prescriptionMedicines.length === 0) {
            selectEl.appendChild(createHTMLElement('option', { value: '' }, ['No prescription medicines available']));
        } else {
            prescriptionMedicines.forEach(pm => {
                selectEl.appendChild(createHTMLElement('option', { value: pm.id }, [`Prescription: ${pm.prescriptionId}, Medicine: ${pm.medicineId}`]));
            });
        }

        form.appendChild(createHTMLElement('div', { class: 'form-group' }, [
            createHTMLElement('label', { for: 'dispensePrescriptionMedicineId' }, ['Prescription Medicine']),
            selectEl,
        ]));

        form.appendChild(createHTMLElement('div', { class: 'form-group' }, [
            createHTMLElement('label', { for: 'dispenseQuantityDispensed' }, ['Quantity Dispensed']),
            createHTMLElement('input', { type: 'number', id: 'dispenseQuantityDispensed', required: true }),
        ]));
        form.appendChild(createHTMLElement('div', { class: 'form-group', style: 'margin-top: 20px;' }, [
            createHTMLElement('button', { type: 'submit' }, ['Dispense Medicine']),
        ]));

        formContainer.appendChild(form);
        root.appendChild(formContainer);

    } catch (error) {
        root.innerHTML = '';
        showAlert(error.message, 'error');
        console.error('Error in renderDispenseMedicine:', error);
    }
};

const renderDistributors = async () => {
    const root = getAppRoot();
    root.innerHTML = '<h2>Loading Distributors...</h2>';

    try {
        const distributors = await fetchDistributors();
        root.innerHTML = '';
        const container = createHTMLElement('div', {}, [
            createHTMLElement('h2', {}, ['Distributors']),
        ]);

        if (distributors.length === 0) {
            container.appendChild(createHTMLElement('p', {}, ['No distributors found.']));
        } else {
            const table = createHTMLElement('table', {}, [
                createHTMLElement('thead', {}, [
                    createHTMLElement('tr', {}, [
                        createHTMLElement('th', {}, ['Distributor ID']),
                        createHTMLElement('th', {}, ['Name']),
                        createHTMLElement('th', {}, ['Email']),
                        createHTMLElement('th', {}, ['Contact Number']),
                    ]),
                ]),
                createHTMLElement('tbody', {}, distributors.map(d =>
                    createHTMLElement('tr', {}, [
                        createHTMLElement('td', {}, [d.id]),
                        createHTMLElement('td', {}, [d.name]),
                        createHTMLElement('td', {}, [d.email]),
                        createHTMLElement('td', {}, [d.contactNumber]),
                    ])
                )),
            ]);
            container.appendChild(table);
        }
        root.appendChild(container);
    } catch (error) {
        root.innerHTML = '';
        showAlert(error.message, 'error');
    }
};

const renderRestockOrders = async () => {
    const root = getAppRoot();
    root.innerHTML = '<h2>Loading Restock Orders...</h2>';

    try {
        const restockOrders = await fetchRestockOrders();
        root.innerHTML = '';
        const container = createHTMLElement('div', {}, [
            createHTMLElement('h2', {}, ['Restock Orders']),
        ]);

        if (restockOrders.length === 0) {
            container.appendChild(createHTMLElement('p', {}, ['No restock orders found.']));
        } else {
            const table = createHTMLElement('table', {}, [
                createHTMLElement('thead', {}, [
                    createHTMLElement('tr', {}, [
                        createHTMLElement('th', {}, ['Order ID']),
                        createHTMLElement('th', {}, ['Pharmacy ID']),
                        createHTMLElement('th', {}, ['Distributor ID']),
                        createHTMLElement('th', {}, ['Medicine ID']),
                        createHTMLElement('th', {}, ['Quantity Ordered']),
                        createHTMLElement('th', {}, ['Status']),
                        createHTMLElement('th', {}, ['Created At']),
                    ]),
                ]),
                createHTMLElement('tbody', {}, restockOrders.map(order =>
                    createHTMLElement('tr', {}, [
                        createHTMLElement('td', {}, [order.id]),
                        createHTMLElement('td', {}, [order.pharmacyId]),
                        createHTMLElement('td', {}, [order.distributorId]),
                        createHTMLElement('td', {}, [order.medicineId]),
                        createHTMLElement('td', {}, [order.quantityOrdered.toString()]),
                        createHTMLElement('td', {}, [order.status]),
                        createHTMLElement('td', {}, [new Date(order.createdAt).toLocaleDateString()]),
                    ])
                )),
            ]);
            container.appendChild(table);
        }
        root.appendChild(container);
    } catch (error) {
        root.innerHTML = '';
        showAlert(error.message, 'error');
    }
};

const renderNotifications = async () => {
    const root = getAppRoot();
    root.innerHTML = '<h2>Loading Notifications...</h2>';

    try {
        const notifications = await fetchNotifications();
        root.innerHTML = '';
        const container = createHTMLElement('div', {}, [
            createHTMLElement('h2', {}, ['Notifications']),
        ]);

        if (notifications.length === 0) {
            container.appendChild(createHTMLElement('p', {}, ['No notifications found.']));
        } else {
            const list = createHTMLElement('ul');
            notifications.forEach(n => {
                list.appendChild(createHTMLElement('li', {}, [
                    `ID: ${n.id}, Type: ${n.type} - ${n.message} (Created: ${new Date(n.createdAt).toLocaleString()}, Read: ${n.isRead ? 'Yes' : 'No'})`
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
    root.innerHTML = '<h2>Loading Medicines...</h2>';

    try {
        const medicines = await fetchMedicines();
        root.innerHTML = '';
        const container = createHTMLElement('div', {}, [
            createHTMLElement('h2', {}, ['Medicines']),
        ]);

        if (medicines.length === 0) {
            container.appendChild(createHTMLElement('p', {}, ['No medicines found.']));
        } else {
            const table = createHTMLElement('table', {}, [
                createHTMLElement('thead', {}, [
                    createHTMLElement('tr', {}, [
                        createHTMLElement('th', {}, ['Medicine ID']),
                        createHTMLElement('th', {}, ['Name']),
                        createHTMLElement('th', {}, ['Manufacturer']),
                        createHTMLElement('th', {}, ['Type']),
                        createHTMLElement('th', {}, ['Dosage']),
                    ]),
                ]),
                createHTMLElement('tbody', {}, medicines.map(m =>
                    createHTMLElement('tr', {}, [
                        createHTMLElement('td', {}, [m.id]),
                        createHTMLElement('td', {}, [m.name]),
                        createHTMLElement('td', {}, [m.manufacturer]),
                        createHTMLElement('td', {}, [m.type]),
                        createHTMLElement('td', {}, [m.dosage]),
                    ])
                )),
            ]);
            container.appendChild(table);
        }
        root.appendChild(container);
    } catch (error) {
        root.innerHTML = '';
        showAlert(error.message, 'error');
    }
};

const renderDoctors = async () => {
    const root = getAppRoot();
    root.innerHTML = '<h2>Loading Doctors...</h2>';

    try {
        const doctors = await fetchDoctors();
        root.innerHTML = '';
        const container = createHTMLElement('div', {}, [
            createHTMLElement('h2', {}, ['Doctors']),
        ]);

        if (doctors.length === 0) {
            container.appendChild(createHTMLElement('p', {}, ['No doctors found.']));
        } else {
            const table = createHTMLElement('table', {}, [
                createHTMLElement('thead', {}, [
                    createHTMLElement('tr', {}, [
                        createHTMLElement('th', {}, ['Doctor ID']),
                        createHTMLElement('th', {}, ['User ID']),
                        createHTMLElement('th', {}, ['Specialization']),
                    ]),
                ]),
                createHTMLElement('tbody', {}, doctors.map(d =>
                    createHTMLElement('tr', {}, [
                        createHTMLElement('td', {}, [d.id]),
                        createHTMLElement('td', {}, [d.userId]),
                        createHTMLElement('td', {}, [d.specialization]),
                    ])
                )),
            ]);
            container.appendChild(table);
        }
        root.appendChild(container);
    } catch (error) {
        root.innerHTML = '';
        showAlert(error.message, 'error');
    }
};

const renderPatients = async () => {
    const root = getAppRoot();
    root.innerHTML = '<h2>Loading Patients...</h2>';

    try {
        const patients = await fetchPatients();
        root.innerHTML = '';
        const container = createHTMLElement('div', {}, [
            createHTMLElement('h2', {}, ['Patients']),
        ]);

        if (patients.length === 0) {
            container.appendChild(createHTMLElement('p', {}, ['No patients found.']));
        } else {
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
                        createHTMLElement('td', {}, [p.id]),
                        createHTMLElement('td', {}, [p.userId]),
                        createHTMLElement('td', {}, [p.contactNumber]),
                        createHTMLElement('td', {}, [p.address]),
                    ])
                )),
            ]);
            container.appendChild(table);
        }
        root.appendChild(container);
    } catch (error) {
        root.innerHTML = '';
        showAlert(error.message, 'error');
    }
};

const renderPharmacies = async () => {
    const root = getAppRoot();
    root.innerHTML = '<h2>Loading Pharmacies...</h2>';

    try {
        const pharmacies = await fetchPharmacies();
        root.innerHTML = '';
        const container = createHTMLElement('div', {}, [
            createHTMLElement('h2', {}, ['Pharmacies']),
        ]);

        if (pharmacies.length === 0) {
            container.appendChild(createHTMLElement('p', {}, ['No pharmacies found.']));
        } else {
            const table = createHTMLElement('table', {}, [
                createHTMLElement('thead', {}, [
                    createHTMLElement('tr', {}, [
                        createHTMLElement('th', {}, ['Pharmacy ID']),
                        createHTMLElement('th', {}, ['Name']),
                        createHTMLElement('th', {}, ['Location']),
                        createHTMLElement('th', {}, ['Contact']),
                        createHTMLElement('th', {}, ['User ID']),
                    ]),
                ]),
                createHTMLElement('tbody', {}, pharmacies.map(p =>
                    createHTMLElement('tr', {}, [
                        createHTMLElement('td', {}, [p.id]),
                        createHTMLElement('td', {}, [p.name]),
                        createHTMLElement('td', {}, [p.location]),
                        createHTMLElement('td', {}, [p.contact]),
                        createHTMLElement('td', {}, [p.userId]),
                    ])
                )),
            ]);
            container.appendChild(table);
        }
        root.appendChild(container);
    } catch (error) {
        root.innerHTML = '';
        showAlert(error.message, 'error');
    }
};

const renderPatientAdherence = async () => {
    const root = getAppRoot();
    root.innerHTML = '<h2>Loading...</h2>';

    try {
        const patients = await fetchPatients();
        const prescriptions = await fetchPrescriptions();

        root.innerHTML = '';
        const container = createHTMLElement('div', {}, [
            createHTMLElement('h2', {}, ['Patient Adherence Log']),
        ]);

        const patientSelect = createHTMLElement('select', { id: 'adherencePatientId' });
        patients.forEach(p => {
            patientSelect.appendChild(createHTMLElement('option', { value: p.id }, [`${p.id} (User: ${p.userId})`]));
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
                medicinesContainer.appendChild(createHTMLElement('p', {}, ['No prescribed medicines found for this patient.']));
                return;
            }

            const table = createHTMLElement('table', {}, [
                createHTMLElement('thead', {}, [
                    createHTMLElement('tr', {}, [
                        createHTMLElement('th', {}, ['Prescription ID']),
                        createHTMLElement('th', {}, ['Medicine ID']),
                        createHTMLElement('th', {}, ['Action']),
                    ]),
                ]),
                createHTMLElement('tbody', {}, patientMedicines.map(pm =>
                    createHTMLElement('tr', {}, [
                        createHTMLElement('td', {}, [pm.prescriptionId]),
                        createHTMLElement('td', {}, [pm.medicineId]),
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
                            }, ['Log Dose Taken']),
                        ]),
                    ])
                )),
            ]);
            medicinesContainer.appendChild(table);
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
    root.innerHTML = '<h2>Loading Adherence Logs...</h2>';

    try {
        const adherenceLogs = await fetchAdherenceLogs();
        root.innerHTML = '';
        const container = createHTMLElement('div', {}, [
            createHTMLElement('h2', {}, ['Adherence Logs']),
        ]);

        if (adherenceLogs.length === 0) {
            container.appendChild(createHTMLElement('p', {}, ['No adherence logs found.']));
        } else {
            const table = createHTMLElement('table', {}, [
                createHTMLElement('thead', {}, [
                    createHTMLElement('tr', {}, [
                        createHTMLElement('th', {}, ['Log ID']),
                        createHTMLElement('th', {}, ['Patient']),
                        createHTMLElement('th', {}, ['Medicine']),
                        createHTMLElement('th', {}, ['Taken At']),
                        createHTMLElement('th', {}, ['Missed']),
                        createHTMLElement('th', {}, ['Remarks']),
                    ]),
                ]),
                createHTMLElement('tbody', {}, adherenceLogs.map(log =>
                    createHTMLElement('tr', {}, [
                        createHTMLElement('td', {}, [log.id]),
                        createHTMLElement('td', {}, [log.patient.user.name]),
                        createHTMLElement('td', {}, [log.medicine.name]),
                        createHTMLElement('td', {}, [new Date(log.takenAt).toLocaleString()]),
                        createHTMLElement('td', {}, [log.missed ? 'Yes' : 'No']),
                        createHTMLElement('td', {}, [log.remarks || '']),
                    ])
                )),
            ]);
            container.appendChild(table);
        }
        root.appendChild(container);
    } catch (error) {
        root.innerHTML = '';
        showAlert(error.message, 'error');
    }
};

const renderDistributorDashboard = async () => {
    const root = getAppRoot();
    root.innerHTML = '<h2>Loading Distributor Dashboard...</h2>';

    try {
        const restockOrders = await fetchRestockOrders();
        root.innerHTML = '';
        const container = createHTMLElement('div', {}, [
            createHTMLElement('h2', {}, ['Distributor Dashboard']),
        ]);

        if (restockOrders.length === 0) {
            container.appendChild(createHTMLElement('p', {}, ['No restock orders found.']));
        } else {
            const table = createHTMLElement('table', {}, [
                createHTMLElement('thead', {}, [
                    createHTMLElement('tr', {}, [
                        createHTMLElement('th', {}, ['Order ID']),
                        createHTMLElement('th', {}, ['Pharmacy ID']),
                        createHTMLElement('th', {}, ['Medicine ID']),
                        createHTMLElement('th', {}, ['Quantity Ordered']),
                        createHTMLElement('th', {}, ['Status']),
                        createHTMLElement('th', {}, ['Actions']),
                    ]),
                ]),
                createHTMLElement('tbody', {}, restockOrders.map(order =>
                    createHTMLElement('tr', {}, [
                        createHTMLElement('td', {}, [order.id]),
                        createHTMLElement('td', {}, [order.pharmacyId]),
                        createHTMLElement('td', {}, [order.medicineId]),
                        createHTMLElement('td', {}, [order.quantityOrdered.toString()]),
                        createHTMLElement('td', {}, [order.status]),
                        createHTMLElement('td', {}, [
                            createHTMLElement('button', {
                                onclick: async () => {
                                    try {
                                        await updateRestockOrder(order.id, { status: 'SHIPPED' });
                                        showAlert('Order status updated to SHIPPED!', 'success');
                                        renderDistributorDashboard(); // Refresh the dashboard
                                    } catch (error) {
                                        showAlert(error.message, 'error');
                                    }
                                }
                            }, ['Mark as Shipped']),
                            createHTMLElement('button', {
                                onclick: async () => {
                                    try {
                                        await updateRestockOrder(order.id, { status: 'COMPLETED' });
                                        showAlert('Order status updated to COMPLETED!', 'success');
                                        renderDistributorDashboard(); // Refresh the dashboard
                                    } catch (error) {
                                        showAlert(error.message, 'error');
                                    }
                                }
                            }, ['Mark as Completed']),
                        ]),
                    ])
                )),
            ]);
            container.appendChild(table);
        }
        root.appendChild(container);
    } catch (error) {
        root.innerHTML = '';
        showAlert(error.message, 'error');
    }
};

// Initial render
document.addEventListener('DOMContentLoaded', renderDashboard);
