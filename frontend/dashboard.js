// Check if user is logged in
firebase.auth().onAuthStateChanged((user) => {
    if (!user) {
      window.location.href = 'login.html';
      return;
    }
  
    // Update user email in the dashboard
    const userEmail = document.getElementById('user-email');
    if (userEmail) {
      userEmail.textContent = user.email;
    }
  });
  
  // Logout functionality
  const logoutButton = document.getElementById('logout-button');
  if (logoutButton) {
    logoutButton.addEventListener('click', async () => {
      try {
        await firebase.auth().signOut();
        window.location.href = 'login.html';
      } catch (error) {
        const errorMessage = document.getElementById('error-message');
        errorMessage.textContent = 'Failed to log out';
        errorMessage.style.display = 'block';
      }
    });
  }