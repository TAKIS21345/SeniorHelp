// Check if user is logged in
firebase.auth().onAuthStateChanged((user) => {
    if (user && !window.location.pathname.includes('dashboard.html')) {
      window.location.href = 'dashboard.html';
    }
  });
  
  // Login form
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      const errorMessage = document.getElementById('error-message');
  
      try {
        await firebase.auth().signInWithEmailAndPassword(email, password);
        window.location.href = 'dashboard.html';
      } catch (error) {
        errorMessage.textContent = 'Failed to sign in. Please check your credentials.';
        errorMessage.style.display = 'block';
      }
    });
  }
  
  // Signup form
  const signupForm = document.getElementById('signup-form');
  if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('name').value;
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      const confirmPassword = document.getElementById('confirm-password').value;
      const errorMessage = document.getElementById('error-message');
  
      if (password !== confirmPassword) {
        errorMessage.textContent = 'Passwords do not match';
        errorMessage.style.display = 'block';
        return;
      }
  
      try {
        await firebase.auth().createUserWithEmailAndPassword(email, password);
        window.location.href = 'dashboard.html';
      } catch (error) {
        errorMessage.textContent = 'Failed to create account. Please try again.';
        errorMessage.style.display = 'block';
      }
    });
  }