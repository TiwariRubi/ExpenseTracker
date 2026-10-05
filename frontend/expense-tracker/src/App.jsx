import React, {useEffect} from 'react'
import{
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Login from "./pages/Auth/Login";
import SignUp from "./pages/Auth/SignUp";
import Home from "./pages/Dashboard/Home";
import Income from "./pages/Dashboard/Income";
import Expense from "./pages/Dashboard/Expense";
import Budget from "./pages/Dashboard/Budget";
import UserProvider from './context/UserContext';
import toast, {Toaster} from 'react-hot-toast';
import ProtectedRoute from './components/ProtectedRoute';
const App = () => { 
  return (
    <UserProvider>
   <div>
     <Router>
       <SessionExpiryNotice />
       <Routes>
          <Route path="/" element={<Root />} />
          <Route path="/login" element={
            <ProtectedRoute guestOnly><Login /></ProtectedRoute>
          } />
          <Route path="/signup" element={
            <ProtectedRoute guestOnly><SignUp /></ProtectedRoute>
          } />
          <Route path="/dashboard" element={
            <ProtectedRoute><Home /></ProtectedRoute>
          } />
          <Route path="/income" element={
            <ProtectedRoute><Income /></ProtectedRoute>
          } />
          <Route path="/expense" element={
            <ProtectedRoute><Expense /></ProtectedRoute>
          } />
          <Route path="/budget" element={
            <ProtectedRoute><Budget /></ProtectedRoute>
          } />

       </Routes>

     </Router>

   </div>

   <Toaster

      toastOptions={{
        className: "",
        style:{
          fontSize: '13px'
        },


      }}
     
   />

   
   </UserProvider>
  );
};

export default App

const SessionExpiryNotice = () => {
  useEffect(() => {
    const showSessionExpiredMessage = () => {
      if (window.location.pathname !== "/login") return;

      const message = sessionStorage.getItem("sessionExpiredMessage");
      if (message) {
        sessionStorage.removeItem("sessionExpiredMessage");
        toast.error(message);
      }
    };

    showSessionExpiredMessage();
    window.addEventListener("auth:session-expired-notice", showSessionExpiredMessage);
    return () => window.removeEventListener("auth:session-expired-notice", showSessionExpiredMessage);
  }, []);

  return null;
};

 const Root = () => {
  //check if token exists in local storage
  const isAuthenticated = !!localStorage.getItem("token");

  //Redirect to dashboard if authenticated, else redirect to login
  return isAuthenticated ? (
   <Navigate to="/dashboard" replace />
   ) : (

    <Navigate to="/login" replace />

   );
  };

/*
git status

# 2. Stage your files
git add .

# 3. Check again to ensure the correct files are green (staged)
git status

# 4. Commit and push safely
git commit -m "Your commit message"
git push
*/
//44.00