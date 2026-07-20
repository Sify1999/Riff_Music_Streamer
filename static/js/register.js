const passwordInput = document.getElementById("password");
const confirmInput = document.getElementById("confirmPassword");
const togglePassword = document.getElementById("togglePassword");
const toggleConfirmPassword = document.getElementById("toggleConfirmPassword");
const eyeIcon = document.getElementById("eyeIcon");
const eyeIconConfirm = document.getElementById("eyeIconConfirm");
const passwordError = document.getElementById("passwordError");
const registerForm = document.querySelector(".register-card form");

const EYE_ON = "/static/assets/eye-on.svg";
const EYE_OFF = "/static/assets/eye-off.svg";

let passwordsVisible = false;

function setPasswordsVisibility(visible) {
    passwordsVisible = visible;

    passwordInput.type = visible ? "text" : "password";
    confirmInput.type = visible ? "text" : "password";

    eyeIcon.src = visible ? EYE_ON : EYE_OFF;
    eyeIconConfirm.src = visible ? EYE_ON : EYE_OFF;

    const label = visible ? "Hide password" : "Show password";
    togglePassword.setAttribute("aria-label", label);
    toggleConfirmPassword.setAttribute("aria-label", label);
    togglePassword.setAttribute("aria-pressed", visible ? "true" : "false");
    toggleConfirmPassword.setAttribute("aria-pressed", visible ? "true" : "false");
}

togglePassword.addEventListener("click", () => setPasswordsVisibility(!passwordsVisible));
toggleConfirmPassword.addEventListener("click", () => setPasswordsVisibility(!passwordsVisible));

function checkPasswordsMatch() {
    if (!confirmInput.value) {
        passwordError.textContent = "";
        confirmInput.classList.remove("input-error");
        return true;
    }

    const matches = passwordInput.value === confirmInput.value;

    passwordError.textContent = matches ? "" : "Passwords don't match";
    confirmInput.classList.toggle("input-error", !matches);

    return matches;
}

passwordInput.addEventListener("input", checkPasswordsMatch);
confirmInput.addEventListener("input", checkPasswordsMatch);

registerForm.addEventListener("submit", (e) => {
    if (!checkPasswordsMatch() || !confirmInput.value) {
        e.preventDefault();
        passwordError.textContent = "Passwords don't match";
        confirmInput.classList.add("input-error");
        confirmInput.focus();
    }
});