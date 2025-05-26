// Script to upgrade Kathy's account to unlimited plan
// Run this in the browser console

// Get registered users from localStorage
const registeredUsers = JSON.parse(localStorage.getItem('registeredUsers') || '[]');

// Find Kathy's account
const kathyIndex = registeredUsers.findIndex(user => user.email === 'odrisck@gmail.com');

if (kathyIndex !== -1) {
  // Update Kathy's plan to unlimited
  registeredUsers[kathyIndex].plan = 'unlimited';
  
  // Save back to localStorage
  localStorage.setItem('registeredUsers', JSON.stringify(registeredUsers));
  
  // If Kathy is currently logged in, update her session
  const currentUserEmail = localStorage.getItem('userEmail');
  if (currentUserEmail === 'odrisck@gmail.com') {
    localStorage.setItem('userPlan', 'unlimited');
  }
  
  console.log('Kathy\'s account upgraded to unlimited plan');
  console.log('Updated user:', registeredUsers[kathyIndex]);
  
  // Refresh the page to apply changes
  window.location.reload();
} else {
  console.log('Kathy\'s account not found');
}