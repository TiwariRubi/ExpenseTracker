import React from 'react'
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
import UserProvider from './context/UserContext';

const App = () => {
  return (
    <UserProvider>
   <div>
     <Router>
       <Routes>
          <Route path="/" element={<Root />} />
          <Route path="/login" exact element={<Login />} />
          <Route path="/signUp" exact element={<SignUp />} />
          <Route path="/dashboard" exact element={<Home />} />
          <Route path="/income" exact element={<Income />} />
          <Route path="/expense" exact element={<Expense />} />

       </Routes>

     </Router>

   </div>
   </UserProvider>
  );
};

export default App
 const Root = () => {
  //check if token exists in local storage
  const isAuthenticated = !!localStorage.getItem("token");

  //Redirect to dashboard if authenticated, else redirect to login
  return isAuthenticated ? (
   <Navigate to="/dashboard" />
   ) : (

    <Navigate to="/login" />

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