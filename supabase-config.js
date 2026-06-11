// ══════════════════════════════════════════════════
//  SAFARI ASAP — Supabase Configuration
//  Replace with your actual project URL and anon key
// ══════════════════════════════════════════════════
(function () {
  const SUPABASE_URL = 'https://bccblasysmbybssmvswl.supabase.co';   // ← replace
  const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJjY2JsYXN5c21ieWJzc212c3dsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODExMjIyNzIsImV4cCI6MjA5NjY5ODI3Mn0.7NRKYuEY9DkgldkLK9QiDsIcFXo3kdSknwb978RCwL4';                      // ← replace
  window._sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON);
})();
