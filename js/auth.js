async function bbRefreshAuthUI() {
  const { data, error } = await window.BB_Supabase.auth.getUser();
  const user = data?.user || null;

  const loggedOutView = document.getElementById("loggedOutView");
  const loggedInView = document.getElementById("loggedInView");
  const accountEmail = document.getElementById("accountEmail");
  const accountDisplayName = document.getElementById("accountDisplayName");
  const subscriptionStatus = document.getElementById("subscriptionStatus");
  const authMessage = document.getElementById("authMessage");

  if (error) {
    console.error("Auth UI refresh error:", error);
  }

  if (user) {
    if (loggedOutView) loggedOutView.style.display = "none";
    if (loggedInView) loggedInView.style.display = "block";

    if (accountEmail) {
      accountEmail.textContent = user.email || "No email";
    }

    if (accountDisplayName) {
      accountDisplayName.textContent =
        user.user_metadata?.display_name || "No display name set";
    }

    if (subscriptionStatus) {
      subscriptionStatus.textContent = "Free";
    }

    if (authMessage) authMessage.textContent = "";
  } else {
    if (loggedOutView) loggedOutView.style.display = "block";
    if (loggedInView) loggedInView.style.display = "none";

    if (accountEmail) accountEmail.textContent = "";
    if (accountDisplayName) accountDisplayName.textContent = "";
    if (subscriptionStatus) subscriptionStatus.textContent = "Free";
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
  const loginBtn = document.getElementById("loginBtn");

  if (!email || !password) {
    if (authMessage) authMessage.textContent = "Enter an email and password.";
    return;
  }

  if (loginBtn) {
    loginBtn.disabled = true;
    loginBtn.textContent = "Logging In...";
  }

  const { data, error } = await window.BB_Supabase.auth.signInWithPassword({
    email,
    password
  });

  console.log("Login result:", { data, error });

  if (authMessage) {
    authMessage.textContent = error ? error.message : "Logged in successfully.";
  }

  if (loginBtn) {
    loginBtn.disabled = false;
    loginBtn.textContent = "Log In";
  }

  if (!error) {
    await bbRefreshAuthUI();
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
