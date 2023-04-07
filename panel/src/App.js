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

  const [token, setToken] = useState('');

  const [isUserAdmin, setIsUserAdmin] = useState(false);

  const [queueSize, setQueueSize] = useState(null);

  const [mySubmissions, setMySubmissions] = useState([]);

  useEffect(() => {
    restoreToken();
    pollRecentSubmissions();
    getQueueSize();
    //check if there is a token in local storage
  }, []);

  useEffect(() => {
    if (token !== '' && token !== null) {
      getUserInfo();
      checkIfUserIsAdmin();
      getMySubmissions();
    }
  }, [token]);

  const getRecentSubmissions = async () => {
    const response = await fetch('https://api.opendevteam.com/articles');
    const data = await response.json();
    //reverse the array so the most recent submissions are at the top
    data.reverse();
    //only show the 5 most recent submissions
    data.splice(5);
    setRecentSubmissions(data);
  }

  async function pollRecentSubmissions() {
    getRecentSubmissions();
    setTimeout(pollRecentSubmissions, 1000000);
  }

  async function restoreToken() {
    const token = localStorage.getItem('token');

    if (token) {
      setToken(token);
    }
  }
  

  const login = async () => {
    //uses OAuth2 password flow
    if (!loginUsername || !loginPassword) {
      alert("Username and password are required.")
      return;
    }
    const response = await fetch('https://api.opendevteam.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: `grant_type=password&username=${loginUsername}&password=${loginPassword}`
    });
    if (response.status !== 200) {
      alert("Invalid username or password.");
      return;
    }
    const data = await response.json();
    setToken(data.access_token);

    //store the token in local storage so it persists
    localStorage.setItem('token', data.access_token);
    //get the user's info
  }

  const getUserInfo = async () => {
    const response = await fetch('https://api.opendevteam.com/users/me/', {
      //response:
      // {
      //   "username": "string",
      //   "email": "string",
      //   "full_name": "string",
      //   "is_admin": false
      // }
      
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    const data = await response.json();
    if (data.username) {
      setUser(data);
    }
    else {
      setUser(null);
      setToken('');
    }
  }

  const signup = async () => {
    if (!signupUsername || !signupPassword || !signupPasswordConfirm || !signupEmail || !signupDisplayName) {
      alert("All fields are required.")
    }
    else if (signupPassword !== signupPasswordConfirm) {
      alert("Passwords do not match.")
    }
    else {
      const response = await fetch('https://api.opendevteam.com/signup?username=' + signupUsername + '&password=' + signupPassword + '&email=' + signupEmail + '&full_name=' + signupDisplayName, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
      });
      const data = await response.json();
      if (data.success) {
        alert("Account created successfully! Please log in.")
      }
      else if (data.error != null) {
        alert(data.error);
      }
    }
  }

  const checkIfUserIsAdmin = async () => {
    const response = await fetch('https://api.opendevteam.com/articles/submissions', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    const data = await response.json();
    if (!data.error) {
      setIsUserAdmin(true);
    }
    else {
      setIsUserAdmin(false);
    }
  }

  const getQueueSize = async () => {
    const response = await fetch('https://api.opendevteam.com/articles/submissions/queuelength', {
      method: 'GET',
    });

    const data = await response.json();
    setQueueSize(data);
  }

  const getMySubmissions = async () => {
    const response = await fetch('https://api.opendevteam.com/articles/submissions/mysubmissions', {
      method: 'GET',
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    const data = await response.json();
    setMySubmissions(data);
  }


  return (
    <div className="App">
      <div className="header">
        <h1 className="header-title">PixelPlace Chronicles</h1>
        <h2 className="header-username">Welcome, {user ? user.full_name : ''}</h2>
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
        <h2 className="recent-submissions-title">Recently Added Submissions</h2>
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
            <div className="authenticated">
              <div className="seperator-line"></div>
              <div className="status-container">
                <h1>Status</h1>
                <p>Queue Size: {queueSize.queueLength}</p>
                <p title="This is the estimated maximum time that you will have to wait for your submission to be approved. This is in no way a 100% guarantee, but it should be pretty close.">Guaranteed Maxiumum Wait Time: {queueSize.estimatedTime}</p>
                {isUserAdmin ? (
                    <div className="admin">
                      <a className="admin-title">Signed in as Admin 🕵️‍♀️</a>
                    </div>
                  ) : (
                    <div className="not-admin">
                      <a className="not-admin-title">Signed in with Regular Permissions</a>
                    </div>
                  )}
                <p>Queue Server Status: Online</p>
              </div>
              <div className="seperator-line"></div>
              {/* Submission format
              id : int
              title: str
              description: str
              date : str
              thumbnail: str
              icon : str
              icon_color : str
              importance : int
              wiki_link : str
              submitter : str
              submitStatus : str */}

              <div className="my-submissions-container">
                <h1>My Submissions</h1>
                <p>Here are all of your submissions. If you have any questions, please contact us on Discord.<br></br> Your submission is pending? See Guaranteed Maxiumum Wait Time above.</p> 
                <div className="my-submissions">
                  <table className='my-submissions-table'>
                    <tr>
                      <th>Title</th>
                      <th>Description</th>
                      <th>Status</th>
                    </tr>
                      {mySubmissions.map((submission) => (
                        <tr>
                          <td>{submission[1]}</td>
                          <td>{submission[2]}</td>
                          <td className={"status-" + submission[10]}>{submission[10]}</td>
                        </tr>
                      ))}
                  </table>
                </div>
                    
              </div>
              <iframe width="500" height="200" src="https://www.youtube.com/embed/Lva3_gvlcns?autoplay=0" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>
            </div>
          ) : (
            <div className="unauthenticated">
              <div className="seperator-line"></div>
              <div className="not-logged-in">
              <h2 className="not-logged-in-text">You are not logged in.</h2>
              </div>
              <div className="login-or-signup">
                <div className="login-div">
                  <a className="login-title">Login</a>
                  <div className="login-form">
                    <input className="login-input" type="text" placeholder="Username" value={loginUsername} onChange={(e) => setLoginUsername(e.target.value)}/>
                    <input className="login-input" type="password" placeholder="Password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)}/>
                    <Button variant="contained" className="login-button" onClick={() => login()}>Login</Button>
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
                    <a className="safety-text">Your password is as secure as you make it. Please don't use the same password across websites.<br></br>By signing up, you agree to the</a> <a className="tos-link" href="https://pptl.opendevteam.com/TOS.txt">Terms of Service</a><a className="tos-link2" href="https://opendevteam.com/PRIVACY.html">Privacy Policy</a>
                    <Button variant="contained" className="signup-button" onClick={() => signup()}>Signup</Button>
                  </div>
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
