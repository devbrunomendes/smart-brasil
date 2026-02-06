// ============================================
// FORM STEP MANAGEMENT
// ============================================

let currentStep = 1;
const totalSteps = 5;
const form = document.getElementById('eventForm');
const steps = document.querySelectorAll('.form-step');
const stepItems = document.querySelectorAll('.step-item');
const progressFill = document.getElementById('progressFill');
const btnPrev = document.getElementById('btnPrev');
const btnNext = document.getElementById('btnNext');
const btnSubmit = document.getElementById('btnSubmit');

// Initialize
updateStepDisplay();

// Navigation
btnNext.addEventListener('click', () => {
    if (validateCurrentStep()) {
        if (currentStep < totalSteps) {
            currentStep++;
            updateStepDisplay();
            animateStepTransition('next');
        }
    }
});

btnPrev.addEventListener('click', () => {
    if (currentStep > 1) {
        currentStep--;
        updateStepDisplay();
        animateStepTransition('prev');
    }
});

function updateStepDisplay() {
    // Update steps visibility
    steps.forEach((step, index) => {
        if (index + 1 === currentStep) {
            step.classList.add('active');
        } else {
            step.classList.remove('active');
        }
    });

    // Update step indicators
    stepItems.forEach((item, index) => {
        if (index + 1 <= currentStep) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });

    // Update progress bar
    const progress = (currentStep / totalSteps) * 100;
    progressFill.style.width = `${progress}%`;

    // Update buttons
    btnPrev.style.display = currentStep === 1 ? 'none' : 'flex';
    btnNext.style.display = currentStep === totalSteps ? 'none' : 'flex';
    btnSubmit.style.display = currentStep === totalSteps ? 'flex' : 'none';

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function animateStepTransition(direction) {
    const currentStepEl = document.querySelector(`.form-step[data-step="${currentStep}"]`);
    if (currentStepEl) {
        currentStepEl.style.animation = 'none';
        setTimeout(() => {
            currentStepEl.style.animation = direction === 'next' 
                ? 'fadeIn 0.4s ease-out' 
                : 'fadeInReverse 0.4s ease-out';
        }, 10);
    }
}

// ============================================
// VALIDATION
// ============================================

function validateCurrentStep() {
    const currentStepEl = document.querySelector(`.form-step[data-step="${currentStep}"]`);
    let isValid = true;

    // Validate radio groups separately
    const radioGroups = currentStepEl.querySelectorAll('input[type="radio"][required]');
    const radioGroupNames = new Set();
    radioGroups.forEach(radio => {
        if (radio.name) {
            radioGroupNames.add(radio.name);
        }
    });

    // Validate each radio group
    radioGroupNames.forEach(groupName => {
        const radios = currentStepEl.querySelectorAll(`input[type="radio"][name="${groupName}"]`);
        const isChecked = Array.from(radios).some(radio => radio.checked);
        const errorId = `error-${groupName}`;
        const errorEl = document.getElementById(errorId);
        
        if (!isChecked) {
            isValid = false;
            if (errorEl) {
                errorEl.textContent = 'Esse campo é obrigatório.';
                errorEl.style.display = 'block';
            }
            // Highlight first radio in group
            if (radios.length > 0) {
                radios[0].closest('.radio-option')?.style.setProperty('border-color', 'var(--color-error)');
            }
        } else {
            if (errorEl) {
                errorEl.textContent = '';
                errorEl.style.display = 'none';
            }
            // Remove error styling from all radios in group
            radios.forEach(radio => {
                radio.closest('.radio-option')?.style.removeProperty('border-color');
            });
        }
    });

    // Validate other required fields (excluding radios, as they're handled above)
    const requiredFields = currentStepEl.querySelectorAll('[required]:not(input[type="radio"])');
    requiredFields.forEach(field => {
        // Skip if field is hidden (like document fields)
        if (field.closest('.document-field') && field.closest('.document-field').style.display === 'none') {
            return;
        }

        const errorId = `error-${field.name || field.id}`;
        const errorEl = document.getElementById(errorId);
        
        if (!validateField(field)) {
            isValid = false;
            showError(field, errorEl);
        } else {
            hideError(field, errorEl);
        }
    });

    return isValid;
}

function validateField(field) {
    const value = field.value.trim();
    const type = field.type;
    const name = field.name || field.id;

    // Required check
    if (field.hasAttribute('required') && !value) {
        return false;
    }

    // Type-specific validation
    switch (type) {
        case 'email':
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return emailRegex.test(value);
        
        case 'tel':
            const phoneRegex = /^\(\d{2}\)\s?\d{4,5}-?\d{4}$/;
            return phoneRegex.test(value) || value.length >= 10;
        
        case 'date':
            return value !== '';
        
        case 'checkbox':
        case 'radio':
            return field.checked;
        
        default:
            // Document validation
            if (name === 'cpf') {
                const cpfDigits = value.replace(/\D/g, '');
                return cpfDigits.length === 11;
            }
            if (name === 'cnpj') {
                const cnpjDigits = value.replace(/\D/g, '');
                return cnpjDigits.length === 14;
            }
            if (name === 'rg') {
                const rgDigits = value.replace(/\D/g, '');
                return rgDigits.length >= 7;
            }
            return value.length > 0;
    }
}

function showError(field, errorEl) {
    // Don't show error if field is already filled (for non-radio fields)
    if (field.type !== 'radio' && field.type !== 'checkbox') {
        const value = field.value.trim();
        if (value.length > 0) {
            return; // Field has value, don't show error
        }
    }
    
    if (field.type !== 'radio') {
        field.style.borderColor = 'var(--color-error)';
    }
    
    if (errorEl) {
        errorEl.textContent = 'Esse campo é obrigatório.';
        errorEl.style.display = 'block';
    }
    
    if (field.type !== 'radio') {
        field.classList.add('error-shake');
        setTimeout(() => {
            field.classList.remove('error-shake');
        }, 300);
    }
}

function hideError(field, errorEl) {
    if (field.type !== 'radio') {
        field.style.borderColor = '';
    }
    if (errorEl) {
        errorEl.textContent = '';
        errorEl.style.display = 'none';
    }
}

// Real-time validation for radio buttons
document.querySelectorAll('input[type="radio"]').forEach(radio => {
    radio.addEventListener('change', () => {
        const groupName = radio.name;
        const radios = document.querySelectorAll(`input[type="radio"][name="${groupName}"]`);
        const isChecked = Array.from(radios).some(r => r.checked);
        const errorId = `error-${groupName}`;
        const errorEl = document.getElementById(errorId);
        
        if (isChecked) {
            if (errorEl) {
                errorEl.textContent = '';
                errorEl.style.display = 'none';
            }
            // Remove error styling from all radios in group
            radios.forEach(r => {
                r.closest('.radio-option')?.style.removeProperty('border-color');
            });
        }
    });
});

// Real-time validation for other fields
document.querySelectorAll('input:not([type="radio"]), select, textarea').forEach(field => {
    field.addEventListener('blur', () => {
        // Skip if field is hidden
        if (field.closest('.document-field') && field.closest('.document-field').style.display === 'none') {
            return;
        }

        const errorId = `error-${field.name || field.id}`;
        const errorEl = document.getElementById(errorId);
        if (validateField(field)) {
            hideError(field, errorEl);
        } else if (field.hasAttribute('required')) {
            showError(field, errorEl);
        }
    });

    field.addEventListener('input', () => {
        // Skip if field is hidden
        if (field.closest('.document-field') && field.closest('.document-field').style.display === 'none') {
            return;
        }

        const errorId = `error-${field.name || field.id}`;
        const errorEl = document.getElementById(errorId);
        if (validateField(field)) {
            hideError(field, errorEl);
        }
    });
});

// ============================================
// PHONE INPUT MASK
// ============================================

const phoneInput = document.getElementById('telefone');
if (phoneInput) {
    phoneInput.addEventListener('input', (e) => {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length <= 11) {
            if (value.length <= 2) {
                value = value;
            } else if (value.length <= 6) {
                value = `(${value.slice(0, 2)}) ${value.slice(2)}`;
            } else if (value.length <= 10) {
                value = `(${value.slice(0, 2)}) ${value.slice(2, 6)}-${value.slice(6)}`;
            } else {
                value = `(${value.slice(0, 2)}) ${value.slice(2, 7)}-${value.slice(7, 11)}`;
            }
            e.target.value = value;
        }
    });
}

// ============================================
// PLACA INPUT MASK
// ============================================

const placaInput = document.getElementById('placa');
if (placaInput) {
    placaInput.addEventListener('input', (e) => {
        let value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
        if (value.length <= 7) {
            if (value.length <= 3) {
                value = value;
            } else {
                value = `${value.slice(0, 3)}-${value.slice(3)}`;
            }
            e.target.value = value;
        }
    });
}

// ============================================
// DOCUMENT TYPE FIELDS MANAGEMENT
// ============================================

const tipoDocumentoSelect = document.getElementById('tipoDocumento');
const cpfField = document.getElementById('cpf-field');
const cnpjField = document.getElementById('cnpj-field');
const rgField = document.getElementById('rg-field');
const cpfInput = document.getElementById('cpf');
const cnpjInput = document.getElementById('cnpj');
const rgInput = document.getElementById('rg');

function toggleDocumentFields() {
    const selectedType = tipoDocumentoSelect.value;
    
    // Hide all fields with animation
    [cpfField, cnpjField, rgField].forEach(field => {
        if (field && field.style.display !== 'none') {
            field.style.opacity = '0';
            field.style.transform = 'translateY(-10px)';
            setTimeout(() => {
                field.style.display = 'none';
            }, 300);
        }
    });
    
    // Remove required attribute from all
    if (cpfInput) cpfInput.removeAttribute('required');
    if (cnpjInput) cnpjInput.removeAttribute('required');
    if (rgInput) rgInput.removeAttribute('required');
    
    // Clear values and errors
    if (cpfInput) {
        cpfInput.value = '';
        const errorEl = document.getElementById('error-cpf');
        if (errorEl) errorEl.textContent = '';
    }
    if (cnpjInput) {
        cnpjInput.value = '';
        const errorEl = document.getElementById('error-cnpj');
        if (errorEl) errorEl.textContent = '';
    }
    if (rgInput) {
        rgInput.value = '';
        const errorEl = document.getElementById('error-rg');
        if (errorEl) errorEl.textContent = '';
    }
    
    // Show and set required for selected type
    setTimeout(() => {
        if (selectedType === 'cpf' && cpfField) {
            cpfField.style.display = 'block';
            if (cpfInput) cpfInput.setAttribute('required', 'required');
            setTimeout(() => {
                cpfField.style.opacity = '1';
                cpfField.style.transform = 'translateY(0)';
                if (cpfInput) cpfInput.focus();
            }, 10);
        } else if (selectedType === 'cnpj' && cnpjField) {
            cnpjField.style.display = 'block';
            if (cnpjInput) cnpjInput.setAttribute('required', 'required');
            setTimeout(() => {
                cnpjField.style.opacity = '1';
                cnpjField.style.transform = 'translateY(0)';
                if (cnpjInput) cnpjInput.focus();
            }, 10);
        } else if (selectedType === 'rg' && rgField) {
            rgField.style.display = 'block';
            if (rgInput) rgInput.setAttribute('required', 'required');
            setTimeout(() => {
                rgField.style.opacity = '1';
                rgField.style.transform = 'translateY(0)';
                if (rgInput) rgInput.focus();
            }, 10);
        }
    }, 300);
}

if (tipoDocumentoSelect) {
    tipoDocumentoSelect.addEventListener('change', toggleDocumentFields);
}

// ============================================
// CPF MASK
// ============================================

if (cpfInput) {
    cpfInput.addEventListener('input', (e) => {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length <= 11) {
            if (value.length <= 3) {
                value = value;
            } else if (value.length <= 6) {
                value = `${value.slice(0, 3)}.${value.slice(3)}`;
            } else if (value.length <= 9) {
                value = `${value.slice(0, 3)}.${value.slice(3, 6)}.${value.slice(6)}`;
            } else {
                value = `${value.slice(0, 3)}.${value.slice(3, 6)}.${value.slice(6, 9)}-${value.slice(9, 11)}`;
            }
            e.target.value = value;
        }
    });
    
    cpfInput.addEventListener('blur', () => {
        const value = cpfInput.value.replace(/\D/g, '');
        if (value.length > 0 && value.length !== 11) {
            const errorEl = document.getElementById('error-cpf');
            if (errorEl) {
                errorEl.textContent = 'CPF deve ter 11 dígitos';
                errorEl.style.display = 'block';
            }
        }
    });
}

// ============================================
// CNPJ MASK
// ============================================

if (cnpjInput) {
    cnpjInput.addEventListener('input', (e) => {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length <= 14) {
            if (value.length <= 2) {
                value = value;
            } else if (value.length <= 5) {
                value = `${value.slice(0, 2)}.${value.slice(2)}`;
            } else if (value.length <= 8) {
                value = `${value.slice(0, 2)}.${value.slice(2, 5)}.${value.slice(5)}`;
            } else if (value.length <= 12) {
                value = `${value.slice(0, 2)}.${value.slice(2, 5)}.${value.slice(5, 8)}/${value.slice(8)}`;
            } else {
                value = `${value.slice(0, 2)}.${value.slice(2, 5)}.${value.slice(5, 8)}/${value.slice(8, 12)}-${value.slice(12, 14)}`;
            }
            e.target.value = value;
        }
    });
    
    cnpjInput.addEventListener('blur', () => {
        const value = cnpjInput.value.replace(/\D/g, '');
        if (value.length > 0 && value.length !== 14) {
            const errorEl = document.getElementById('error-cnpj');
            if (errorEl) {
                errorEl.textContent = 'CNPJ deve ter 14 dígitos';
                errorEl.style.display = 'block';
            }
        }
    });
}

// ============================================
// RG MASK
// ============================================

if (rgInput) {
    rgInput.addEventListener('input', (e) => {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length <= 9) {
            if (value.length <= 2) {
                value = value;
            } else if (value.length <= 5) {
                value = `${value.slice(0, 2)}.${value.slice(2)}`;
            } else if (value.length <= 8) {
                value = `${value.slice(0, 2)}.${value.slice(2, 5)}.${value.slice(5)}`;
            } else {
                value = `${value.slice(0, 2)}.${value.slice(2, 5)}.${value.slice(5, 8)}-${value.slice(8)}`;
            }
            e.target.value = value;
        }
    });
    
    rgInput.addEventListener('blur', () => {
        const value = rgInput.value.replace(/\D/g, '');
        if (value.length > 0 && value.length < 7) {
            const errorEl = document.getElementById('error-rg');
            if (errorEl) {
                errorEl.textContent = 'RG deve ter pelo menos 7 dígitos';
                errorEl.style.display = 'block';
            }
        }
    });
}

// ============================================
// FILE UPLOAD
// ============================================

function setupFileUpload(inputId, previewId) {
    const input = document.getElementById(inputId);
    const preview = document.getElementById(previewId);
    const area = input?.closest('.file-upload-area');
    const content = area?.querySelector('.file-upload-content');

    if (!input || !preview) return;

    input.addEventListener('change', (e) => {
        const files = Array.from(e.target.files);
        preview.innerHTML = '';
        
        files.forEach((file, index) => {
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    const item = document.createElement('div');
                    item.className = 'file-preview-item';
                    item.innerHTML = `
                        <img src="${event.target.result}" alt="${file.name}">
                        <button type="button" class="remove-file" data-index="${index}">×</button>
                    `;
                    preview.appendChild(item);

                    item.querySelector('.remove-file').addEventListener('click', () => {
                        removeFile(input, index);
                        item.remove();
                    });
                };
                reader.readAsDataURL(file);
            } else {
                const item = document.createElement('div');
                item.className = 'file-preview-item';
                item.style.background = 'rgba(255, 255, 255, 0.1)';
                item.style.display = 'flex';
                item.style.alignItems = 'center';
                item.style.justifyContent = 'center';
                item.style.flexDirection = 'column';
                item.style.padding = '10px';
                item.innerHTML = `
                    <span style="font-size: 2rem;">📄</span>
                    <span style="font-size: 0.7rem; margin-top: 5px; text-align: center;">${file.name}</span>
                    <button type="button" class="remove-file" data-index="${index}">×</button>
                `;
                preview.appendChild(item);

                item.querySelector('.remove-file').addEventListener('click', () => {
                    removeFile(input, index);
                    item.remove();
                });
            }
        });

        if (files.length > 0 && content) {
            content.style.display = 'none';
        }
    });

    // Drag and drop
    if (area) {
        area.addEventListener('dragover', (e) => {
            e.preventDefault();
            area.style.borderColor = 'var(--color-accent)';
            area.style.background = 'rgba(255, 255, 255, 0.15)';
        });

        area.addEventListener('dragleave', () => {
            area.style.borderColor = '';
            area.style.background = '';
        });

        area.addEventListener('drop', (e) => {
            e.preventDefault();
            area.style.borderColor = '';
            area.style.background = '';
            input.files = e.dataTransfer.files;
            input.dispatchEvent(new Event('change'));
        });
    }
}

function removeFile(input, index) {
    const dt = new DataTransfer();
    const files = Array.from(input.files);
    files.splice(index, 1);
    files.forEach(file => dt.items.add(file));
    input.files = dt.files;
    
    if (input.files.length === 0) {
        const content = input.closest('.file-upload-area')?.querySelector('.file-upload-content');
        if (content) content.style.display = 'block';
    }
}

setupFileUpload('fotoVeiculo', 'fotoVeiculoPreview');
setupFileUpload('documentos', 'documentosPreview');

// ============================================
// FORM SUBMISSION
// ============================================

form.addEventListener('submit', (e) => {
    e.preventDefault();

    if (!validateCurrentStep()) {
        return;
    }

    // Show loading state
    btnSubmit.innerHTML = '<span class="loading"></span> Processando...';
    btnSubmit.disabled = true;

    // Collect form data
    const formData = new FormData(form);
    
    // Get document value based on selected type
    const tipoDocumento = formData.get('tipoDocumento');
    let documentoValue = '';
    if (tipoDocumento === 'cpf') {
        documentoValue = formData.get('cpf') || '';
    } else if (tipoDocumento === 'cnpj') {
        documentoValue = formData.get('cnpj') || '';
    } else if (tipoDocumento === 'rg') {
        documentoValue = formData.get('rg') || '';
    }
    
    // Simulate processing time
    setTimeout(() => {
        // Log form data to console (for testing purposes)
        console.log('Dados do formulário:', {
            // Dados Pessoais
            tipo_evento: formData.get('eventType'),
            reparo_para: formData.get('reparoPara'),
            nome_associado: formData.get('nomeAssociado'),
            data_nascimento: formData.get('dataNascimento'),
            condutor: formData.get('condutor'),
            tipo_documento: tipoDocumento,
            documento: documentoValue,
            endereco: formData.get('endereco'),
            telefone: formData.get('telefone'),
            email: formData.get('email'),
            
            // Dados do Veículo
            placa: formData.get('placa'),
            marca: formData.get('marca'),
            modelo: formData.get('modelo'),
            ano: formData.get('ano'),
            cor: formData.get('cor'),
            chassi: formData.get('chassi'),
            
            // Relato dos Fatos
            data_evento: formData.get('dataEvento'),
            local_evento: formData.get('localEvento'),
            relato: formData.get('relato'),
            testemunhas: formData.get('testemunhas'),
        });

        // Success
        btnSubmit.disabled = false;
        btnSubmit.innerHTML = '<span>✓</span> Enviar Comunicado';
        
        // Show success modal
        const modal = document.getElementById('successModal');
        modal.classList.add('active');
    }, 1500);
});

// ============================================
// SMOOTH SCROLLING
// ============================================

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// ============================================
// ANIMATIONS ON SCROLL
// ============================================

const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

document.querySelectorAll('.form-group').forEach(group => {
    group.style.opacity = '0';
    group.style.transform = 'translateY(20px)';
    group.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
    observer.observe(group);
});

// ============================================
// KEYBOARD NAVIGATION
// ============================================

document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') {
        e.preventDefault();
        if (currentStep < totalSteps) {
            btnNext.click();
        } else {
            form.dispatchEvent(new Event('submit'));
        }
    }
});

// ============================================
// INITIAL ANIMATIONS
// ============================================

window.addEventListener('load', () => {
    document.body.style.opacity = '0';
    setTimeout(() => {
        document.body.style.transition = 'opacity 0.5s ease';
        document.body.style.opacity = '1';
    }, 100);
    
    // Clear errors for pre-filled fields
    document.querySelectorAll('input, select, textarea').forEach(field => {
        if (field.type === 'radio') {
            const groupName = field.name;
            const radios = document.querySelectorAll(`input[type="radio"][name="${groupName}"]`);
            const isChecked = Array.from(radios).some(r => r.checked);
            if (isChecked) {
                const errorId = `error-${groupName}`;
                const errorEl = document.getElementById(errorId);
                if (errorEl) {
                    errorEl.textContent = '';
                    errorEl.style.display = 'none';
                }
            }
        } else {
            const value = field.value.trim();
            if (value.length > 0 && validateField(field)) {
                const errorId = `error-${field.name || field.id}`;
                const errorEl = document.getElementById(errorId);
                hideError(field, errorEl);
            }
        }
    });
});
