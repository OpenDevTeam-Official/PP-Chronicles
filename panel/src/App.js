import './App.css';

function getRecentSubmissions() {
  let api = "https://api.opendevteam.com/submissions";
  fetch(api)
    .then(response => response.json())
    .then(data => {
      for (let submissionIndex = 0; submissionIndex < data.length; submissionIndex++) {
        let submission = data[submissionIndex];
        console.log(submission);
      }
    });
}

function App() {
  getRecentSubmissions();
  return (
    <div className="App">
      <div className="welcome-container">
        <h1 className="welcome-title">PixelPlace Chronicles</h1>
        <h2 className="welcome-message">Welcome to the submission portal of the PixelPlace Chronicles!</h2>
      </div>
      <div className="recent-submissions">
        <h2 className="recent-submissions-title">Recent Submissions</h2>
        <div className="recent-submissions-container">
          <div className="recent-submission">
            <img src="https://i.imgur.com/1Z1Z1Z1.png" alt="submission" className="recent-submission-image"/>
            <div className="recent-submission-info">
              <h3 className="recent-submission-title">Submission Title</h3>
              <p className="recent-submission-description">Submission Description</p>
              <p className="recent-submission-author">Submission Author</p>
            </div>
          </div>
          <div className="recent-submission">
            <img src="https://i.imgur.com/1Z1Z1Z1.png" alt="submission" className="recent-submission-image"/>
            <div className="recent-submission-info">
              <h3 className="recent-submission-title">Submission Title</h3>
              <p className="recent-submission-description">Submission Description</p>
              <p className="recent-submission-author">Submission Author</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
// 'mf this shits updates on every char xd ye it cool tho. no more shitty html files its just js and css now 
// html is the easiest shit ever tho'
export default App;
