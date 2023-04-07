import './App.css';
import { useEffect, useState } from 'react';
import Button from '@mui/material/Button';

  
// function getRecentSubmissions() {
//   let api = "https://api.opendevteam.com/articles";
//   fetch(api)
//     .then(response => response.json())
//     .then(data => {
//       setRecentSubmissions(data);
//     });
//}


function App() {
  const [recentSubmissions, setRecentSubmissions] = useState([]);

  const [user, setUser] = useState(null);
  const [userSubmissions, setUserSubmissions] = useState([]);

  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const [signupUsername, setSignupUsername] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupPasswordConfirm, setSignupPasswordConfirm] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupDisplayName, setSignupDisplayName] = useState('');

  useEffect(() => {
    pollRecentSubmissions();
  }, []);

  const getRecentSubmissions = async () => {
    const response = await fetch('https://api.opendevteam.com/articles');
    const data = await response.json();
    //reverse the array so the most recent submissions are at the top
    data.reverse();
    //only show the 5 most recent submissions
    data.splice(5);
    setRecentSubmissions(data);
  }

  function pollRecentSubmissions() {
    getRecentSubmissions();
    setTimeout(pollRecentSubmissions, 10000);
  }

  return (
    <div className="App">
      <div className="header">
        <h1 className="header-title">PixelPlace Chronicles</h1>
        <div className="header-buttons">
          {/* use a 5 px margin between the buttons */}
          <Button variant="" className="header-button" sx = {{margin: '5px'}} onClick={() => {window.open("https://pptl.opendevteam.com", "_self")}}>back to PP Chronicles</Button>
        </div>
      </div>
      <div className="welcome-container">
        <h1 className="welcome-title">PixelPlace Chronicles</h1>
        <h2 className="welcome-message">Welcome to the submission portal of the PixelPlace Chronicles!</h2>
      </div>
      <div className="recent-submissions">
        <h2 className="recent-submissions-title">Recent Submissions</h2>
        <div className="recent-submissions-container">
          {recentSubmissions.map((submission) => (
            <div className="recent-submission">
              <img src={submission[4]} alt="submission" className="recent-submission-image"/>
              <div className="recent-submission-info">
                <h3 className="recent-submission-title">{submission[1]}</h3>
                <p className="recent-submission-description">{submission[2]}</p>
                <p className="recent-submission-author">{submission[3]}</p>
              </div>
            </div>
          ))
          }
          <div className="recent-submission">
            <img src="https://cdn.pixabay.com/photo/2017/09/23/16/33/pixel-heart-2779422_1280.png" className="your-submission-heart-img"/>
            <div className="recent-submission-info">
              <h3>Your submission goes here!</h3>
              <p className="recent-submission-author">Contribute to the PixelPlace Chronicles today!</p>
            </div>
          </div>
        </div>
        <div className="recent-submissions-footer">
          <a className="recent-submissions-encourage">These submissions, and more were made possible by people just like you!</a>
          <br></br>
          <a className="recent-submissions-encourage">Help us preserve the history of PixelPlace.</a>
        </div>
      </div>

      <div className="login-container">
        {
          user ? (
            <div className="user-info">
              
              <h2 className="user-info-title">Welcome, {user.username}!</h2>
            </div>
          ) : (
            
            <div className="login-or-signup">
              <div className="login-div">
                <a className="login-title">Login</a>
                <div className="login-form">
                  <input className="login-input" type="text" placeholder="Username" value={loginUsername} onChange={(e) => setLoginUsername(e.target.value)}/>
                  <input className="login-input" type="password" placeholder="Password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)}/>
                  <Button variant="contained" className="login-button" onClick={() => {}}>Login</Button>
                </div>
              </div>
              <a className="or-text">or</a>
              <div className="signup">
                <a className="signup-title">Signup</a>
                <div className="signup-form">
                  <input className="signup-input" type="text" placeholder="Username" value={signupUsername} onChange={(e) => setSignupUsername(e.target.value)}/>
                  <input className="signup-input" type="password" placeholder="Password" value={signupPassword} onChange={(e) => setSignupPassword(e.target.value)}/>
                  <input className="signup-input" type="password" placeholder="Confirm Password" value={signupPasswordConfirm} onChange={(e) => setSignupPasswordConfirm(e.target.value)}/>
                  <input className="signup-input" type="text" placeholder="Email" value={signupEmail} onChange={(e) => setSignupEmail(e.target.value)}/>
                  <input className="signup-input" type="text" placeholder="Display Name" value={signupDisplayName} onChange={(e) => setSignupDisplayName(e.target.value)}/>
                  <a className="safety-text">Your password is as secure as you make it. Please don't use the same password across websites.<br></br>By signing up, you agree to the</a> <a className="tos-link" href="https://pptl.opendevteam.com/TOS.html">Terms of Service</a> <a className="safety-text">and</a> <a className="tos-link" href="https://opendevteam.com/PRIVACY.html">Privacy Policy</a>
                  <Button variant="contained" className="signup-button" onClick={() => {}}>Signup</Button>
                </div>
              </div>
            </div>
          )
        }
      </div>
    </div>
  );
}
// 'mf this shits updates on every char xd ye it cool tho. no more shitty html files its just js and css now 
// html is the easiest shit ever tho'
export default App;
