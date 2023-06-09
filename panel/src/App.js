import './App.css';
import { useEffect, useState } from 'react';
import Button from '@mui/material/Button';
import 'react-quill/dist/quill.snow.css';
import TextField from '@mui/material/TextField';
import Slider from '@mui/material/Slider';
import Box from '@mui/material/Box';
import MenuItem from '@mui/material/MenuItem';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import FormHelperText from '@mui/material/FormHelperText';


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


  var toolbarOptions = [
    ['bold', 'italic', 'underline', 'strike'],        // toggled buttons
    ['blockquote', 'code-block'],

    [{ 'header': 1 }, { 'header': 2 }],               // custom button values
    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
    [{ 'script': 'sub'}, { 'script': 'super' }],      // superscript/subscript
    [{ 'indent': '-1'}, { 'indent': '+1' }],          // outdent/indent
    [{ 'direction': 'rtl' }],                         // text direction

    [{ 'size': ['small', false, 'large', 'huge'] }],  // custom dropdown
    [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
    [ 'link', 'image', 'video', 'formula' ],          // add's image support
    [{ 'color': [] }, { 'background': [] }],          // dropdown with defaults from theme
    [{ 'font': ["Sans Serif"] }],
    [{ 'align': [] }],

    ['clean']                                         // remove formatting button
  ];

  const [submissionTitle, setSubmissionTitle] = useState('');
  const [submissionDescription, setSubmissionDescription] = useState('');
  const [submissionDate, setSubmissionDate] = useState('');
  const [submissionThumbnail, setSubmissionThumbnail] = useState('');
  const [submissionIcon, setSubmissionIcon] = useState('');
  const [submissionIconColor, setSubmissionIconColor] = useState('');
  const [submissionImportance, setSubmissionImportance] = useState('');
  const [submissionWikiLink, setSubmissionWikiLink] = useState('');

  const [adminSubmissions, setAdminSubmissions] = useState([]);
        

  useEffect(() => {
    restoreToken();
    pollRecentSubmissions();
    getQueueSize();
    setSubmissionImportance(1);
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
    setTimeout(pollRecentSubmissions, 10000);
  }

  async function restoreToken() {
    const token = localStorage.getItem('token');

    if (token) {
      setToken(token);
    }
  }

  function parseHTML(html) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    return doc.body.textContent || "";
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
      const response = await fetch('https://api.opendevteam.com/signup',{
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: signupUsername,
          password: signupPassword,
          email: signupEmail,
          full_name: signupDisplayName
        })
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
      setAdminSubmissions(data);
    }
    else {
      setIsUserAdmin(false);
    }
  }

  const approveSubmission = async (submissionId) => {
    const response = await fetch('https://api.opendevteam.com/articles/submissions/approve?id=' + submissionId, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    const data = await response.json();
    if (data.success) {
      alert("Submission approved successfully!");
      checkIfUserIsAdmin();
    }
    else if (data.error != null) {
      alert(data.error);
    }
  }

  const rejectSubmission = async (submissionId) => {
    const response = await fetch('https://api.opendevteam.com/articles/submissions/reject?id=' + submissionId, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    const data = await response.json();
    if (data.success) {
      alert("Submission rejected successfully!");
      checkIfUserIsAdmin();
    }
    else if (data.error != null) {
      alert(data.error);
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

  const submitSubmission = async () => {
    if (!submissionTitle || !submissionDescription || !submissionDate || !submissionThumbnail || !submissionIcon || !submissionIconColor || !submissionImportance || !submissionWikiLink) {
      alert("All fields are required.")
    }
    else {
      if (!user) {
        alert("You must be logged in to submit an article.")
      }
      else {
        const response = await fetch('https://api.opendevteam.com/articles/submit', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          //json form data
          body: JSON.stringify({
            title: submissionTitle,
            description: submissionDescription,
            date: submissionDate,
            thumbnail: submissionThumbnail,
            icon: submissionIcon,
            icon_color: submissionIconColor,
            importance: submissionImportance,
            wiki_link: submissionWikiLink
          })
        });
        const data = await response.json();
        if (data.success) {
          alert("Submission successful! Please wait for an admin to approve your submission.")
          getMySubmissions();
        }
        else if (data.error != null) {
          alert(data.error);
        }
      }
    }
  }

  return (
    <div className="App">
      <div className="header">
        <h1 className="header-title">PixelPlace Chronicles</h1>
        <div className="header-buttons">
          {/* use a 5 px margin between the buttons */}
          <Button variant="" className="header-button" sx = {{margin: '5px'}} onClick={() => {window.open("https://wiki.opendevteam.com", "_blank")}}>open PP Chronicles Wiki</Button>
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
          <a className="recent-submissions-encourage">These submissions, and more were made possible by people just like you.</a>
          <br></br>
          <a className="recent-submissions-encourage">Help us preserve the history of PixelPlace!</a>
        </div>
      </div>

      <div className="login-container">
        {
          user ? (
            <div className="authenticated">
              <div className="seperator-line"></div>
              <div className="status-container">
                <h1>Status</h1>
                <p>Submission Queue Size: {queueSize.queueLength}</p>
                <p title="This is the estimated maximum time that you will have to wait for your submission to be approved. This is in no way a 100% guarantee, but it should be pretty close.">Estimated Maxiumum Wait Time: {queueSize.estimatedTime} day(s)</p>
                {isUserAdmin ? (
                    <div className="admin">
                      <a className="admin-title">Signed in as Admin 🕵️‍♀️</a>
                    </div>
                  ) : (
                    <div className="not-admin">
                      <a className="not-admin-title">Signed in with Regular Permissions</a>
                    </div>
                  )}
                <p>Queue Server Status: ✅</p>
              </div>
              <div className="seperator-line"></div>
              {/* Submission format
              id : int
              title: str
              description: str (HTML, should be sanitized and rendered)
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
                <p>Here are all of your submissions. If you have any questions, please contact us on Discord.<br></br> Due to security reasons, your submittion will not be rendered here, however it will be on the website once it's approved.<br /> Your submission is pending? See Guaranteed Maxiumum Wait Time above.</p> 
                {mySubmissions.length == 0 ? (
                  <div className="no-submissions">
                    <h2 className="no-submissions-title">You have no submissions.</h2>
                    </div>
                    ) : (
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
                                {/* sanitize and render html */}
                                <td>{parseHTML(submission[2])}</td>
                                <td className={"status-" + submission[10]}>{submission[10]}</td>
                              </tr>
                            ))}
                        </table>
                      </div>
                    )}

                    
              </div>
              <div className="seperator-line"></div>
              <div className="submit-container">
                <h1>Submit</h1>
                <h2>Before submitting you MUST read <a href="https://wiki.opendevteam.com/wiki/Main_Page#How_to_contribute" target='_blank'>this</a> guide.</h2>

                <p >Submit your own PixelPlace Chronicles submission! Please make sure that your submission is in the correct format and use the guide above.</p>
                <div className="submit-form">
                  <TextField id="outlined-basic"  label="Title" variant="outlined" sx={{ width: "60vh", marginTop:"2vh"}} value={submissionTitle} onChange={(e) => setSubmissionTitle(e.target.value)} helperText="A title should be clear and concise, and it shouldn't contain emojis or anything spammy." />
                  <div className="submit-form-fields">
                  {/* char limit of 100 */}
                  <TextField id="outlined-basic" label="Description" variant="outlined" value={submissionDescription} onChange={(e) => setSubmissionDescription(e.target.value)} inputProps={{ maxLength: 140 }} helperText="A short summary of the event, with a maximum of 140 charachters."/>
                  <TextField id="outlined-basic" label="Thumbnail URL" variant="outlined" value={submissionThumbnail} onChange={(e) => setSubmissionThumbnail(e.target.value)} helperText="A URL to the image that will be shown on the website. If the image is inaccessible at the time of review, your submission will be rejected."/>
                  <FormControl>
                    <InputLabel id="demo-simple-select-label">Category</InputLabel>
                    <Select
                      labelId="demo-simple-select-label"
                      id="demo-simple-select"
                      value={submissionIcon}
                      label="Category"
                      onChange={(e) => setSubmissionIcon(e.target.value)}
                    >
                      <MenuItem value={"news"}>News</MenuItem>
                      <MenuItem value={"drama"}>Drama</MenuItem>
                      <MenuItem value={"emergency"}>Emergency</MenuItem>
                      <MenuItem value={"modteamenlargement"}>Mod Team Enlargement</MenuItem>
                      <MenuItem value={"userjoined"}>User Joined</MenuItem>
                      <MenuItem value={"userleft"}>User Left</MenuItem>
                      <MenuItem value={"userleft"}>User Banned</MenuItem>
                    </Select>
                  <FormHelperText>Choose a category that best fits your submission.</FormHelperText>
                  </FormControl>
                  <TextField id="outlined-basic" label="Icon Color (HEX)" variant="outlined" value={submissionIconColor} onChange={(e) => setSubmissionIconColor(e.target.value)} helperText="This color will be used in some parts of the website."/>
                  <TextField id="outlined-basic" label="Wiki Link" variant="outlined" value={submissionWikiLink} onChange={(e) => setSubmissionWikiLink(e.target.value)} helperText="A link to a PP Chronicles Wiki article detailing the event."/>
                  <TextField id="outlined-basic" label="Date (YYYY-MM-DD)" variant="outlined" value={submissionDate} onChange={(e) => setSubmissionDate(e.target.value)} helperText="Date (or closest approximation) when the event occured."/>
                  </div>
                  <Box><Slider className='importance-slider' sx={{ width: "32vh", marginTop:"2vh", marginBottom:"4vh"}} size='medium' min={1} max={3} marks={[{value: 1, label:"major event"}, {value:2, label: 'normal event'}, {value:3, label: 'insignificant event'}]} value={submissionImportance} onChange={(e, newValue) => setSubmissionImportance(newValue)}  aria-labelledby="continuous-slider" /></Box>
                  <p>By clicking this button, I confirm that I have read the guide and that my submission is in the correct format.</p>
                  <Button variant="contained" color="primary" onClick={submitSubmission}>Submit</Button>
                </div>
              </div>
              <div className="seperator-line"></div>
              <div className="admin-container">
                <h1>Admin</h1>
                <p>Here are all of the submissions that are currently pending. You can approve or deny them here.<br/>You cannot remove an article on this website after it has been approved.<br/>For that (for now), go on api.opendevteam.com/docs, auth yourself using the 🔒, find the article ID and then remove it.</p>
                <div className="admin-submissions">
                  <table className='admin-submissions-table'>
                    <tr>
                      <th>ID</th>
                      <th>Submitter</th>
                      <th>Title</th>
                      <th>Description</th>
                      <th>Thumbnail</th>
                      <th>Icon</th>
                      <th>Icon Color</th>
                      <th>Importance</th>
                      <th>Wiki Link</th>
                      <th>Date</th>
                      <th>Status</th>
                      <th>Approve</th>
                      <th>Deny</th>
                    </tr>
                      {adminSubmissions.map((submission) => (  
                        <tr>
                          <td>{submission[0]}</td>
                          <td>{submission[9]}</td>
                          <td>{submission[1]}</td>
                          <td>{parseHTML(submission[2])}</td>
                          <td>{submission[4]}</td>
                          <td>{submission[5]}</td>
                          <td>{submission[6]}</td>
                          <td>{submission[7]}</td>
                          <td>{submission[8]}</td>
                          <td>{submission[3]}</td>
                          <td className={"status-" + submission[10]}>{submission[10]}</td>
                          <td><Button variant="contained" color="success" onClick={() => approveSubmission(submission[0])}>Approve</Button></td>
                          <td><Button variant="contained" color="error" onClick={() => rejectSubmission(submission[0])}>Deny</Button></td>
                        </tr>
                      ))}
                  </table>
                </div>
              </div>
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
