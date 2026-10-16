// document.addEventListener('DOMContentLoaded', function () {
//     let currentStep = 1;

//     function updateStepVisibility() {
//         document.querySelectorAll('.form-step').forEach((step, index) => {
//             step.classList.remove('form-step-active');
//             const backButton = step.querySelector('.back-button');
//             if (backButton) {
//                 backButton.style.display = 'none'; // Hide back button by default
//             }

//             if (index === currentStep - 1) {
//                 step.classList.add('form-step-active');
//                 if (currentStep > 1 && backButton) {
//                     backButton.style.display = 'block'; // Show back button if not on step 1
//                 }
//             }
//         });
//     }
//     function validateStep1() {
//         let isValid = true;
//         const name = document.querySelector('[name="name"]').value.trim();
//         const email = document.querySelector('[name="email"]').value.trim();

//         if (name === '') {
//             document.getElementById('name-error').style.display = 'block';
//             isValid = false;
//         } else {
//             document.getElementById('name-error').style.display = 'none';
//         }

//         if (email === '') {
//             document.getElementById('email-error').style.display = 'block';
//             isValid = false;
//         } else {
//             document.getElementById('email-error').style.display = 'none';
//         }

//         return isValid;
//     }

//     function validateStep2() {
//         let isValid = true;
//         const projectDetails = document.querySelector('[name="projectDetails"]').value.trim();

//         if (projectDetails === '') {
//             document.getElementById('projectDetails-error').style.display = 'block';
//             isValid = false;
//         } else {
//             document.getElementById('projectDetails-error').style.display = 'none';
//         }

//         return isValid;
//     }

//     function nextStep() {
//         if (currentStep === 1 && validateStep1()) {
//             currentStep++;
//             updateStepVisibility();
//         } else if (currentStep === 2 && validateStep2()) {
//             currentStep++;
//             updateStepVisibility();
//             initializeCalendly(); // Initialize Calendly when moving to step 3
//         }
//     }

//     function previousStep() {
//         if (currentStep > 1) {
//             currentStep--;
//             updateStepVisibility();
//         }
//     }

//     function initializeCalendly() {
//         const name = document.querySelector('[name="name"]').value;
//         const email = document.querySelector('[name="email"]').value;

//         const calendlyDiv = document.getElementById('calendly');
//         calendlyDiv.innerHTML = ''; // Clear any existing content

//         Calendly.initInlineWidget({
//             url: 'https://calendly.com/eduardo-forwwward',
//             prefill: {
//                 name: name,
//                 email: email
//             },
//             parentElement: calendlyDiv,
//             utm: {}
//         });
//     }

//     // Add event listeners for buttons
//     document.getElementById('nextStep1').addEventListener('click', nextStep);
//     document.getElementById('nextStep2').addEventListener('click', nextStep);

//     // Add event listeners for back buttons
//     document.querySelectorAll('.back-button').forEach(button => {
//         button.addEventListener('click', previousStep);
//     });

//     // Initialize step visibility on load
//     updateStepVisibility();

// });