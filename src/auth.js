import { supabase } from './supabase.js';

// Sign Up
async function signUp(email, password) {
    const { user, error } = await supabase.auth.signUp({ email, password });
    if (error) console.error('Error signing up:', error.message);
    else console.log('User signed up:', user);
}

// Login
async function login(email, password) {
    const { user, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) console.error('Error logging in:', error.message);
    else console.log('User logged in:', user);
}

// Logout
async function logout() {
    const { error } = await supabase.auth.signOut();
    if (error) console.error('Error logging out:', error.message);
    else console.log('Logged out');
}
