async function bbRefreshAuthUI() {
  const { data, error } = await window.BB_Supabase.auth.getUser();

  const user = data?.user || null;

  const loggedOutView = document.getElementById("loggedOutView");
  const loggedInView = document.getElementById("loggedInView");
  const accountEmail = document.getElementById("accountEmail");
  const authMessage = document.getElementById("authMessage");

  if (error) {
    console.error("Auth UI refresh error:", error);
  }

  if (user) {
    if (loggedOutView) loggedOutView.style.display = "none";
    if (loggedInView) loggedInView.style.display = "block";
    if (accountEmail) accountEmail.textContent = user.email || "";
    if (authMessage) authMessage.textContent = "";
  } else {
    if (loggedOutView) loggedOutView.style.display = "block";
    if (loggedInView) loggedInView.style.display = "none";
    if (accountEmail) accountEmail.textContent = "";
  }
}

async function bbSignUp() {
  const name = document.getElementById("signupName")?.value.trim() || "";
  const email = document.getElementById("authEmail")?.value.trim() || "";
  const password = document.getElementById("authPassword")?.value || "";
  const authMessage = document.getElementById("authMessage");

  if (!email || !password) {
    if (authMessage) authMessage.textContent = "Enter an email and password.";
    return;
  }

  const { error } = await window.BB_Supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        display_name: name
      }
    }
  });

  if (authMessage) {
    authMessage.textContent = error
      ? error.message
      : "Account created. Check your email if confirmation is required.";
  }
}

async function bbLogIn() {
  const email = document.getElementById("authEmail")?.value.trim() || "";
  const password = document.getElementById("authPassword")?.value || "";
  const authMessage = document.getElementById("authMessage");

  if (!email || !password) {
    if (authMessage) authMessage.textContent = "Enter an email and password.";
    return;
  }

  const { error } = await window.BB_Supabase.auth.signInWithPassword({
    email,
    password
  });

  if (authMessage) {
    authMessage.textContent = error ? error.message : "Logged in.";
  }
}

async function bbLogOut() {
  const authMessage = document.getElementById("authMessage");
  const { error } = await window.BB_Supabase.auth.signOut();

  if (authMessage) {
    authMessage.textContent = error ? error.message : "Logged out.";
  }
}

function bbBindAuthEvents() {
  document.getElementById("signupBtn")?.addEventListener("click", bbSignUp);
  document.getElementById("loginBtn")?.addEventListener("click", bbLogIn);
  document.getElementById("logoutBtn")?.addEventListener("click", bbLogOut);
}

window.BB_Supabase.auth.onAuthStateChange(async () => {
  await bbRefreshAuthUI();

  if (window.BB_App && typeof window.BB_App.reloadUserData === "function") {
    await window.BB_App.reloadUserData();
  }
});

document.addEventListener("DOMContentLoaded", async () => {
  bbBindAuthEvents();
  await bbRefreshAuthUI();
});