const passwordInput = document.getElementById("password");
const togglePassword = document.getElementById("togglePassword");
const eyeIcon = document.getElementById("eyeIcon");

const EYE_ON = "/static/assets/eye-on.svg";
const EYE_OFF = "/static/assets/eye-off.svg";

togglePassword.addEventListener("click", () => {
    const isHidden = passwordInput.type === "password";

    passwordInput.type = isHidden ? "text" : "password";
    eyeIcon.src = isHidden ? EYE_ON : EYE_OFF;

    togglePassword.setAttribute("aria-label", isHidden ? "Hide password" : "Show password");
    togglePassword.setAttribute("aria-pressed", isHidden ? "true" : "false");
});